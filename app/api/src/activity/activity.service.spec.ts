import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { ActivityService } from './activity.service'
import { PrismaService } from '../prisma/prisma.service'

const makeActivity = (
  id: string,
  category: string,
  tags: string[],
  minPlayers = 1,
  maxPlayers = 10,
) => ({ id, title: `Activity ${id}`, category, tags, minPlayers, maxPlayers })

const makeMember = (
  id: string,
  prefCategories: string[],
  likedTags: string[] = [],
  dislikedTags: string[] = [],
) => ({
  id,
  preferences: prefCategories.map((category, i) => ({
    id: `pref-${id}-${i}`,
    memberId: id,
    category,
    likedTags,
    dislikedTags,
  })),
})

describe('ActivityService', () => {
  let service: ActivityService
  let findUnique: jest.Mock
  let findMany: jest.Mock

  beforeEach(async () => {
    findUnique = jest.fn()
    findMany = jest.fn()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityService,
        {
          provide: PrismaService,
          useValue: { session: { findUnique }, activity: { findMany } },
        },
      ],
    }).compile()

    service = module.get<ActivityService>(ActivityService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('pickActivity', () => {
    it('throws NotFoundException when session does not exist', async () => {
      findUnique.mockResolvedValue(null)
      await expect(service.pickActivity('s1', 2)).rejects.toThrow(NotFoundException)
    })

    it('throws NotFoundException when no activities are available at all', async () => {
      findUnique.mockResolvedValue({ id: 's1', categories: ['indoor'], members: [], spins: [] })
      findMany.mockResolvedValue([])
      await expect(service.pickActivity('s1', 2)).rejects.toThrow(NotFoundException)
    })

    it('returns the activity with the highest likedTags score', async () => {
      const a1 = makeActivity('a1', 'indoor', ['games', 'fun'])
      const a2 = makeActivity('a2', 'indoor', ['chill'])
      findUnique.mockResolvedValue({
        id: 's1',
        categories: ['indoor'],
        members: [makeMember('m1', ['indoor'], ['games', 'fun'])],
        spins: [],
      })
      findMany.mockResolvedValue([a1, a2])

      // a1 → score 2 (games+fun both liked), a2 → score 1 (chill not liked)
      expect(await service.pickActivity('s1', 2)).toEqual(a1)
    })

    it('penalizes activities matching dislikedTags', async () => {
      const a1 = makeActivity('a1', 'indoor', ['games'])
      const a2 = makeActivity('a2', 'indoor', ['chill'])
      findUnique.mockResolvedValue({
        id: 's1',
        categories: ['indoor'],
        members: [makeMember('m1', ['indoor'], ['chill'], ['games'])],
        spins: [],
      })
      findMany.mockResolvedValue([a1, a2])

      // a1: liked=0, disliked=1 → score=-1 | a2: liked=1, disliked=0 → score=1
      expect(await service.pickActivity('s1', 2)).toEqual(a2)
    })

    it('intersects preference categories across all members', async () => {
      // A: indoor+sport, B: sport+food → intersection = sport
      const mA = makeMember('m1', ['indoor', 'sport'], ['games'])
      const mB = makeMember('m2', ['sport', 'food'], ['active'])
      findUnique.mockResolvedValue({ id: 's1', categories: ['indoor'], members: [mA, mB], spins: [] })
      findMany.mockResolvedValue([makeActivity('a1', 'sport', ['games'])])

      await service.pickActivity('s1', 2)

      const where = findMany.mock.calls[0][0].where
      expect(where.category.in).toEqual(['sport'])
    })

    it('falls back to session.categories when no member has preferences', async () => {
      findUnique.mockResolvedValue({
        id: 's1',
        categories: ['outdoor'],
        members: [{ id: 'm1', preferences: [] }],
        spins: [],
      })
      findMany.mockResolvedValue([makeActivity('a1', 'outdoor', ['nature'])])

      await service.pickActivity('s1', 2)

      const where = findMany.mock.calls[0][0].where
      expect(where.category.in).toEqual(['outdoor'])
    })

    it('falls back to full pool (no category filter) when preferred categories yield no results', async () => {
      const fallback = makeActivity('a1', 'food', ['cooking'])
      findUnique.mockResolvedValue({ id: 's1', categories: ['indoor'], members: [], spins: [] })
      findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([fallback])

      const result = await service.pickActivity('s1', 2)
      expect(result).toEqual(fallback)
      expect(findMany).toHaveBeenCalledTimes(2)
    })

    it('excludes already-spun activity ids', async () => {
      findUnique.mockResolvedValue({
        id: 's1',
        categories: ['indoor'],
        members: [],
        spins: [{ activityId: 'already-spun' }],
      })
      findMany.mockResolvedValue([makeActivity('a1', 'indoor', [])])

      await service.pickActivity('s1', 2)

      const where = findMany.mock.calls[0][0].where
      expect(where.id.notIn).toContain('already-spun')
    })

    it('filters by minPlayers lte and maxPlayers gte memberCount', async () => {
      findUnique.mockResolvedValue({ id: 's1', categories: [], members: [], spins: [] })
      findMany.mockResolvedValue([makeActivity('a1', 'sport', [])])

      await service.pickActivity('s1', 5)

      const where = findMany.mock.calls[0][0].where
      expect(where.minPlayers).toEqual({ lte: 5 })
      expect(where.maxPlayers).toEqual({ gte: 5 })
    })

    it('picks randomly among activities tied at top score', async () => {
      const a1 = makeActivity('a1', 'indoor', ['games'])
      const a2 = makeActivity('a2', 'indoor', ['games'])
      findUnique.mockResolvedValue({
        id: 's1',
        categories: ['indoor'],
        members: [makeMember('m1', ['indoor'], ['games'])],
        spins: [],
      })
      findMany.mockResolvedValue([a1, a2])

      const results = new Set<string>()
      for (let i = 0; i < 30; i++) {
        const r = await service.pickActivity('s1', 2)
        results.add(r.id)
      }
      // Both should appear in 30 draws
      expect(results).toContain('a1')
      expect(results).toContain('a2')
    })
  })
})
