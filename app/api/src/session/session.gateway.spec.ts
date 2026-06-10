import { Test, TestingModule } from '@nestjs/testing'
import { SessionGateway } from './session.gateway'
import { SessionService } from './session.service'

jest.mock('@spinout/shared', () => ({
  LOBBY_EVENTS: {
    JOIN: 'lobby:join',
    JOINED: 'lobby:joined',
    MEMBER_JOINED: 'lobby:member_joined',
    MEMBER_LEFT: 'lobby:member_left',
    SET_PREFS: 'lobby:set_prefs',
    PREF_UPDATED: 'lobby:pref_updated',
    START: 'lobby:start',
  },
  SESSION_EVENTS: {
    STARTED: 'session:started',
    SPIN: 'session:spin',
    ACTIVITY: 'session:activity',
    VOTE: 'session:vote',
    VOTE_UPDATE: 'session:vote_update',
    VOTE_RESULT: 'session:vote_result',
    CLOSE: 'session:close',
    CLOSED: 'session:closed',
  },
}))

const LOBBY_EVENTS = {
  JOIN: 'lobby:join',
  JOINED: 'lobby:joined',
  MEMBER_JOINED: 'lobby:member_joined',
  MEMBER_LEFT: 'lobby:member_left',
}

const mockSession = {
  join: jest.fn(),
  findByCode: jest.fn(),
  setPreferences: jest.fn(),
  pickActivity: jest.fn(),
  recordSpin: jest.fn(),
  recordVote: jest.fn(),
  getVoteSummary: jest.fn(),
  resolveVote: jest.fn(),
  getSessionHistory: jest.fn(),
  close: jest.fn(),
}

const makeSocket = (id: string) => ({
  id,
  join: jest.fn(),
  emit: jest.fn(),
  to: jest.fn().mockReturnThis(),
})

describe('SessionGateway', () => {
  let gateway: SessionGateway

  beforeEach(async () => {
    Object.values(mockSession).forEach(fn => fn.mockReset())

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionGateway,
        { provide: SessionService, useValue: mockSession },
      ],
    }).compile()

    gateway = module.get<SessionGateway>(SessionGateway)

    // Inject a mock server
    ;(gateway as any).server = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    }
  })

  it('should be defined', () => {
    expect(gateway).toBeDefined()
  })

  describe('handleDisconnect', () => {
    it('does nothing when socket is not in the map', async () => {
      const client = makeSocket('socket-unknown')
      await gateway.handleDisconnect(client as any)
      expect((gateway as any).server.to).not.toHaveBeenCalled()
    })

    it('emits MEMBER_LEFT to the lobby room and removes the socket', async () => {
      const client = makeSocket('socket-1')
      ;(gateway as any).socketToMember.set('socket-1', { memberId: 'm1', sessionCode: 'ABC' })

      await gateway.handleDisconnect(client as any)

      expect((gateway as any).server.to).toHaveBeenCalledWith('lobby:ABC')
      expect((gateway as any).server.emit).toHaveBeenCalledWith(LOBBY_EVENTS.MEMBER_LEFT, { memberId: 'm1' })
      expect((gateway as any).socketToMember.has('socket-1')).toBe(false)
    })
  })

  describe('handleLobbyJoin', () => {
    it('joins the room, sets socket mapping, emits JOINED and MEMBER_JOINED', async () => {
      const member = { id: 'm1' }
      const fullSession = { id: 's1', members: [member], spins: [] }
      mockSession.join.mockResolvedValue({ session: { id: 's1' }, member })
      mockSession.findByCode.mockResolvedValue(fullSession)

      const client = makeSocket('socket-1')
      await gateway.handleLobbyJoin({ code: 'ABC', userId: 'u1' }, client as any)

      expect(client.join).toHaveBeenCalledWith('lobby:ABC')
      expect((gateway as any).socketToMember.get('socket-1')).toEqual({ memberId: 'm1', sessionCode: 'ABC' })
      expect(client.emit).toHaveBeenCalledWith(LOBBY_EVENTS.JOINED, expect.objectContaining({ session: fullSession }))
    })
  })
})
