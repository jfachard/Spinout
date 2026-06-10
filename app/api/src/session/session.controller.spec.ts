import { Test, TestingModule } from '@nestjs/testing'
import { SessionController } from './session.controller'
import { SessionService } from './session.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

describe('SessionController', () => {
  let controller: SessionController
  let session: Record<string, jest.Mock>

  beforeEach(async () => {
    session = {
      create: jest.fn(),
      join: jest.fn(),
      findByCode: jest.fn(),
      close: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionController],
      providers: [{ provide: SessionService, useValue: session }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get<SessionController>(SessionController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('create', () => {
    it('delegates to session.create with hostId and categories', async () => {
      session.create.mockResolvedValue({ id: 's1' })
      const req = { user: { userId: 'u1' } }
      await controller.create({ categories: ['indoor'] }, req as any)
      expect(session.create).toHaveBeenCalledWith('u1', ['indoor'])
    })
  })

  describe('join', () => {
    it('delegates to session.join with userId from authenticated request', async () => {
      session.join.mockResolvedValue({ session: {}, member: {} })
      const req = { user: { userId: 'u1' } }
      await controller.join({ code: 'ABC123' }, req as any)
      expect(session.join).toHaveBeenCalledWith('ABC123', 'u1', undefined)
    })

    it('passes guestName and undefined userId for unauthenticated requests', async () => {
      session.join.mockResolvedValue({ session: {}, member: {} })
      const req = { user: undefined }
      await controller.join({ code: 'ABC123', guestName: 'Bob' }, req as any)
      expect(session.join).toHaveBeenCalledWith('ABC123', undefined, 'Bob')
    })
  })

  describe('findByCode', () => {
    it('delegates to session.findByCode', async () => {
      const s = { id: 's1', code: 'ABC123' }
      session.findByCode.mockResolvedValue(s)
      const result = await controller.findByCode('ABC123')
      expect(session.findByCode).toHaveBeenCalledWith('ABC123')
      expect(result).toEqual(s)
    })
  })

  describe('close', () => {
    it('delegates to session.close with sessionId and userId', async () => {
      session.close.mockResolvedValue({ status: 'closed' })
      const req = { user: { userId: 'u1' } }
      await controller.close('s1', req as any)
      expect(session.close).toHaveBeenCalledWith('s1', 'u1')
    })
  })
})
