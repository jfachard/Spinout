import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, ForbiddenException } from '@nestjs/common'
import { SessionService } from './session.service'
import { PrismaService } from '../prisma/prisma.service'
import { ActivityService } from '../activity/activity.service'

describe('SessionService', () => {
  let service: SessionService
  let prisma: Record<string, Record<string, jest.Mock>>
  let activityService: { pickActivity: jest.Mock }

  beforeEach(async () => {
    prisma = {
      session: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      sessionMember: { create: jest.fn(), findFirst: jest.fn() },
      preference: { upsert: jest.fn() },
      spin: { create: jest.fn(), update: jest.fn(), findMany: jest.fn() },
      vote: { upsert: jest.fn(), findMany: jest.fn() },
    }
    activityService = { pickActivity: jest.fn() }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        { provide: PrismaService, useValue: prisma },
        { provide: ActivityService, useValue: activityService },
      ],
    }).compile()

    service = module.get<SessionService>(SessionService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('creates a session with a 6-char code and adds host as member', async () => {
      const fakeSession = { id: 's1', code: 'ABC123', members: [{ id: 'm1' }] }
      prisma.session.create.mockResolvedValue(fakeSession)

      const result = await service.create('user-1', ['indoor'])

      expect(prisma.session.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            hostId: 'user-1',
            categories: ['indoor'],
            members: { create: { userId: 'user-1' } },
          }),
        }),
      )
      expect(result).toEqual(fakeSession)
    })
  })

  describe('join', () => {
    it('throws NotFoundException when session does not exist', async () => {
      prisma.session.findUnique.mockResolvedValue(null)
      await expect(service.join('INVALID')).rejects.toThrow(NotFoundException)
    })

    it('throws ForbiddenException when session is closed', async () => {
      prisma.session.findUnique.mockResolvedValue({ id: 's1', status: 'closed', members: [] })
      await expect(service.join('CODE1')).rejects.toThrow(ForbiddenException)
    })

    it('creates a member and returns session + member', async () => {
      const session = { id: 's1', status: 'waiting', members: [] }
      const member = { id: 'm1' }
      prisma.session.findUnique.mockResolvedValue(session)
      prisma.sessionMember.create.mockResolvedValue(member)

      const result = await service.join('CODE1', undefined, 'Alice')
      expect(result).toEqual({ session, member })
      expect(prisma.sessionMember.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ guestName: 'Alice' }) }),
      )
    })
  })

  describe('findByCode', () => {
    it('throws NotFoundException when session does not exist', async () => {
      prisma.session.findUnique.mockResolvedValue(null)
      await expect(service.findByCode('NOPE')).rejects.toThrow(NotFoundException)
    })

    it('returns the session when found', async () => {
      const session = { id: 's1', code: 'ABC', members: [], spins: [] }
      prisma.session.findUnique.mockResolvedValue(session)
      expect(await service.findByCode('ABC')).toEqual(session)
    })
  })

  describe('close', () => {
    it('throws NotFoundException when session does not exist', async () => {
      prisma.session.findUnique.mockResolvedValue(null)
      await expect(service.close('s1', 'user-1')).rejects.toThrow(NotFoundException)
    })

    it('throws ForbiddenException when caller is not the host', async () => {
      prisma.session.findUnique.mockResolvedValue({ id: 's1', hostId: 'host-id' })
      await expect(service.close('s1', 'not-the-host')).rejects.toThrow(ForbiddenException)
    })

    it('updates session status to closed when host calls it', async () => {
      prisma.session.findUnique.mockResolvedValue({ id: 's1', hostId: 'host-id' })
      prisma.session.update.mockResolvedValue({ id: 's1', status: 'closed' })

      await service.close('s1', 'host-id')

      expect(prisma.session.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'closed' } }),
      )
    })
  })

  describe('setPreferences', () => {
    it('upserts a preference record', async () => {
      prisma.preference.upsert.mockResolvedValue({ id: 'p1' })
      await service.setPreferences('m1', 'indoor', ['games'], ['chill'])
      expect(prisma.preference.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { memberId_category: { memberId: 'm1', category: 'indoor' } },
          update: { likedTags: ['games'], dislikedTags: ['chill'] },
        }),
      )
    })
  })

  describe('pickActivity', () => {
    it('delegates to ActivityService', async () => {
      const activity = { id: 'a1', title: 'Bowling' }
      activityService.pickActivity.mockResolvedValue(activity)
      const result = await service.pickActivity('s1', 4)
      expect(activityService.pickActivity).toHaveBeenCalledWith('s1', 4)
      expect(result).toEqual(activity)
    })
  })

  describe('recordSpin', () => {
    it('creates a spin with result pending', async () => {
      prisma.spin.create.mockResolvedValue({ id: 'spin-1' })
      await service.recordSpin('s1', 'a1', 1)
      expect(prisma.spin.create).toHaveBeenCalledWith({
        data: { sessionId: 's1', activityId: 'a1', spinNumber: 1, result: 'pending' },
      })
    })
  })

  describe('recordVote', () => {
    it('upserts a vote', async () => {
      prisma.vote.upsert.mockResolvedValue({ id: 'v1' })
      await service.recordVote('spin-1', 'm1', true)
      expect(prisma.vote.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { spinId_memberId: { spinId: 'spin-1', memberId: 'm1' } },
          update: { value: true },
        }),
      )
    })
  })

  describe('getVoteSummary', () => {
    it('counts yes and no votes correctly', async () => {
      prisma.vote.findMany.mockResolvedValue([
        { value: true },
        { value: true },
        { value: false },
      ])
      const summary = await service.getVoteSummary('spin-1')
      expect(summary).toEqual({ yes: 2, no: 1, total: 3 })
    })
  })

  describe('resolveVote', () => {
    it('returns null when not all members have voted', async () => {
      prisma.vote.findMany.mockResolvedValue([{ value: true }])
      const result = await service.resolveVote('spin-1', 3)
      expect(result).toBeNull()
      expect(prisma.spin.update).not.toHaveBeenCalled()
    })

    it('returns accepted when yes > no', async () => {
      prisma.vote.findMany.mockResolvedValue([
        { value: true },
        { value: true },
        { value: false },
      ])
      prisma.spin.update.mockResolvedValue({})
      const result = await service.resolveVote('spin-1', 3)
      expect(result).toBe('accepted')
    })

    it('returns rejected when no >= yes', async () => {
      prisma.vote.findMany.mockResolvedValue([
        { value: false },
        { value: false },
        { value: true },
      ])
      prisma.spin.update.mockResolvedValue({})
      const result = await service.resolveVote('spin-1', 3)
      expect(result).toBe('rejected')
    })
  })

  describe('getSessionHistory', () => {
    it('returns spins ordered by spinNumber ascending', async () => {
      const history = [{ id: 'sp1', spinNumber: 1 }, { id: 'sp2', spinNumber: 2 }]
      prisma.spin.findMany.mockResolvedValue(history)

      const result = await service.getSessionHistory('s1')
      expect(prisma.spin.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { spinNumber: 'asc' } }),
      )
      expect(result).toEqual(history)
    })
  })

  describe('findMember', () => {
    it('returns null when the session does not exist', async () => {
      prisma.session.findUnique.mockResolvedValue(null)
      const result = await service.findMember('m1', 'NOPE')
      expect(result).toBeNull()
      expect(prisma.sessionMember.findFirst).not.toHaveBeenCalled()
    })

    it('returns the member when session and member both exist', async () => {
      const member = { id: 'm1', sessionId: 's1' }
      prisma.session.findUnique.mockResolvedValue({ id: 's1' })
      prisma.sessionMember.findFirst.mockResolvedValue(member)

      const result = await service.findMember('m1', 'ABC')
      expect(prisma.sessionMember.findFirst).toHaveBeenCalledWith({
        where: { id: 'm1', sessionId: 's1' },
      })
      expect(result).toEqual(member)
    })

    it('returns null when member does not belong to the session', async () => {
      prisma.session.findUnique.mockResolvedValue({ id: 's1' })
      prisma.sessionMember.findFirst.mockResolvedValue(null)

      const result = await service.findMember('stranger', 'ABC')
      expect(result).toBeNull()
    })
  })

  describe('getHistoryByCode', () => {
    it('throws NotFoundException when session does not exist', async () => {
      prisma.session.findUnique.mockResolvedValue(null)
      await expect(service.getHistoryByCode('NOPE')).rejects.toThrow(NotFoundException)
    })

    it('returns session metadata and spins when found', async () => {
      const session = { id: 's1', code: 'ABC', status: 'closed' }
      const spins = [{ id: 'sp1', spinNumber: 1 }, { id: 'sp2', spinNumber: 2 }]
      prisma.session.findUnique.mockResolvedValue(session)
      prisma.spin.findMany.mockResolvedValue(spins)

      const result = await service.getHistoryByCode('ABC')
      expect(result).toEqual({ session, spins })
      expect(prisma.spin.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { sessionId: 's1' }, orderBy: { spinNumber: 'asc' } }),
      )
    })
  })
})
