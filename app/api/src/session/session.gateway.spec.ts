import { Test, TestingModule } from '@nestjs/testing'
import { SessionGateway } from './session.gateway'
import { SessionService } from './session.service'
import { PushService } from '../push/push.service'

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
    JOIN: 'session:join',
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
  SET_PREFS: 'lobby:set_prefs',
  PREF_UPDATED: 'lobby:pref_updated',
  START: 'lobby:start',
}

const SESSION_EVENTS = {
  JOIN: 'session:join',
  STARTED: 'session:started',
  SPIN: 'session:spin',
  ACTIVITY: 'session:activity',
  VOTE: 'session:vote',
  VOTE_UPDATE: 'session:vote_update',
  VOTE_RESULT: 'session:vote_result',
  CLOSE: 'session:close',
  CLOSED: 'session:closed',
}

const mockSession = {
  join: jest.fn(),
  findByCode: jest.fn(),
  findMember: jest.fn(),
  setPreferences: jest.fn(),
  pickActivity: jest.fn(),
  recordSpin: jest.fn(),
  recordVote: jest.fn(),
  getVoteSummary: jest.fn(),
  resolveVote: jest.fn(),
  getSessionHistory: jest.fn(),
  close: jest.fn(),
  getMemberPushTokens: jest.fn().mockResolvedValue([]),
}

const mockPush = {
  sendToTokens: jest.fn().mockResolvedValue(undefined),
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
    mockPush.sendToTokens.mockReset()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionGateway,
        { provide: SessionService, useValue: mockSession },
        { provide: PushService, useValue: mockPush },
      ],
    }).compile()

    gateway = module.get<SessionGateway>(SessionGateway)

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

    it('reuses existing member when memberId is provided and found', async () => {
      const member = { id: 'm-existing' }
      const fullSession = { id: 's1', members: [member], spins: [] }
      mockSession.findMember.mockResolvedValue(member)
      mockSession.findByCode.mockResolvedValue(fullSession)

      const client = makeSocket('socket-2')
      await gateway.handleLobbyJoin({ code: 'ABC', memberId: 'm-existing' }, client as any)

      expect(mockSession.findMember).toHaveBeenCalledWith('m-existing', 'ABC')
      expect(mockSession.join).not.toHaveBeenCalled()
      expect(client.emit).toHaveBeenCalledWith(LOBBY_EVENTS.JOINED, expect.objectContaining({ memberId: 'm-existing' }))
    })

    it('falls back to join when provided memberId is not found', async () => {
      const member = { id: 'm-new' }
      const fullSession = { id: 's1', members: [member], spins: [] }
      mockSession.findMember.mockResolvedValue(null)
      mockSession.join.mockResolvedValue({ session: { id: 's1' }, member })
      mockSession.findByCode.mockResolvedValue(fullSession)

      const client = makeSocket('socket-3')
      await gateway.handleLobbyJoin({ code: 'ABC', memberId: 'stale-id', guestName: 'Alice' }, client as any)

      expect(mockSession.join).toHaveBeenCalledWith('ABC', undefined, 'Alice')
    })

    it('emits lobby:error when the service throws', async () => {
      mockSession.join.mockRejectedValue(new Error('Session is closed'))

      const client = makeSocket('socket-err')
      await gateway.handleLobbyJoin({ code: 'BAD', userId: 'u1' }, client as any)

      expect(client.emit).toHaveBeenCalledWith('lobby:error', { message: 'Session is closed' })
    })
  })

  describe('handleSetPrefs', () => {
    it('calls setPreferences and broadcasts PREF_UPDATED to the lobby room', async () => {
      const pref = { id: 'p1' }
      mockSession.setPreferences.mockResolvedValue(pref)
      ;(gateway as any).socketToMember.set('socket-1', { memberId: 'm1', sessionCode: 'ABC' })

      const client = makeSocket('socket-1')
      await gateway.handleSetPrefs(
        { memberId: 'm1', category: 'indoor', likedTags: ['games'], dislikedTags: [] },
        client as any,
      )

      expect(mockSession.setPreferences).toHaveBeenCalledWith('m1', 'indoor', ['games'], [])
      expect((gateway as any).server.to).toHaveBeenCalledWith('lobby:ABC')
      expect((gateway as any).server.emit).toHaveBeenCalledWith(LOBBY_EVENTS.PREF_UPDATED, { memberId: 'm1', pref })
    })

    it('does not broadcast when socket is not in the map', async () => {
      mockSession.setPreferences.mockResolvedValue({})

      const client = makeSocket('socket-unknown')
      await gateway.handleSetPrefs(
        { memberId: 'm1', category: 'indoor', likedTags: [], dislikedTags: [] },
        client as any,
      )

      expect((gateway as any).server.to).not.toHaveBeenCalled()
    })
  })

  describe('handleSessionJoin', () => {
    it('joins the session room and stores socket mapping when member is valid', async () => {
      mockSession.findMember.mockResolvedValue({ id: 'm1' })

      const client = makeSocket('socket-1')
      await gateway.handleSessionJoin({ code: 'ABC', memberId: 'm1' }, client as any)

      expect(client.join).toHaveBeenCalledWith('session:ABC')
      expect((gateway as any).socketToMember.get('socket-1')).toEqual({ memberId: 'm1', sessionCode: 'ABC' })
    })

    it('emits session:error and does not join when member is not found', async () => {
      mockSession.findMember.mockResolvedValue(null)

      const client = makeSocket('socket-2')
      await gateway.handleSessionJoin({ code: 'ABC', memberId: 'bad-id' }, client as any)

      expect(client.emit).toHaveBeenCalledWith('session:error', { message: 'Not a member of this session' })
      expect(client.join).not.toHaveBeenCalled()
    })
  })

  describe('handleLobbyStart', () => {
    it('does nothing when socket is not in the map', async () => {
      const client = makeSocket('socket-1')
      await gateway.handleLobbyStart({ sessionId: 's1', hostId: 'host-1' }, client as any)

      expect(mockSession.findByCode).not.toHaveBeenCalled()
    })

    it('does nothing when caller is not the host', async () => {
      ;(gateway as any).socketToMember.set('socket-1', { memberId: 'm1', sessionCode: 'ABC' })
      mockSession.findByCode.mockResolvedValue({ id: 's1', hostId: 'host-1' })

      const client = makeSocket('socket-1')
      await gateway.handleLobbyStart({ sessionId: 's1', hostId: 'impostor' }, client as any)

      expect(client.join).not.toHaveBeenCalled()
    })

    it('joins session room and emits STARTED to the lobby when host starts', async () => {
      ;(gateway as any).socketToMember.set('socket-1', { memberId: 'm1', sessionCode: 'ABC' })
      mockSession.findByCode.mockResolvedValue({ id: 's1', hostId: 'host-1' })

      const client = makeSocket('socket-1')
      await gateway.handleLobbyStart({ sessionId: 's1', hostId: 'host-1' }, client as any)

      expect(client.join).toHaveBeenCalledWith('session:ABC')
      expect((gateway as any).server.to).toHaveBeenCalledWith('lobby:ABC')
      expect((gateway as any).server.emit).toHaveBeenCalledWith(SESSION_EVENTS.STARTED)
    })
  })

  describe('handleSpin', () => {
    it('does nothing when socket is not in the map', async () => {
      const client = makeSocket('socket-1')
      await gateway.handleSpin({ sessionId: 's1', hostId: 'host-1' }, client as any)

      expect(mockSession.pickActivity).not.toHaveBeenCalled()
    })

    it('does nothing when caller is not the host', async () => {
      ;(gateway as any).socketToMember.set('socket-1', { memberId: 'm1', sessionCode: 'ABC' })
      mockSession.findByCode.mockResolvedValue({ id: 's1', hostId: 'host-1', members: [], spins: [] })

      const client = makeSocket('socket-1')
      await gateway.handleSpin({ sessionId: 's1', hostId: 'impostor' }, client as any)

      expect(mockSession.pickActivity).not.toHaveBeenCalled()
    })

    it('picks activity, records spin with correct spinNumber, and emits ACTIVITY', async () => {
      ;(gateway as any).socketToMember.set('socket-1', { memberId: 'm1', sessionCode: 'ABC' })
      const session = { id: 's1', hostId: 'host-1', members: [{ id: 'm1' }, { id: 'm2' }], spins: [{ id: 'old-spin' }] }
      const activity = { id: 'a1', title: 'Bowling' }
      const spin = { id: 'new-spin' }

      mockSession.findByCode.mockResolvedValue(session)
      mockSession.pickActivity.mockResolvedValue(activity)
      mockSession.recordSpin.mockResolvedValue(spin)

      const client = makeSocket('socket-1')
      await gateway.handleSpin({ sessionId: 's1', hostId: 'host-1' }, client as any)

      expect(mockSession.pickActivity).toHaveBeenCalledWith('s1', 2)
      expect(mockSession.recordSpin).toHaveBeenCalledWith('s1', 'a1', 2)
      expect((gateway as any).server.to).toHaveBeenCalledWith('session:ABC')
      expect((gateway as any).server.emit).toHaveBeenCalledWith(SESSION_EVENTS.ACTIVITY, {
        activity,
        spinId: 'new-spin',
      })
    })
  })

  describe('handleVote', () => {
    it('does nothing when socket is not in the map', async () => {
      const client = makeSocket('socket-1')
      await gateway.handleVote({ spinId: 'sp1', memberId: 'm1', value: true, sessionId: 's1' }, client as any)

      expect(mockSession.recordVote).not.toHaveBeenCalled()
    })

    it('records vote and emits VOTE_UPDATE when vote is not yet resolved', async () => {
      ;(gateway as any).socketToMember.set('socket-1', { memberId: 'm1', sessionCode: 'ABC' })
      const summary = { yes: 1, no: 0, total: 1 }

      mockSession.recordVote.mockResolvedValue({})
      mockSession.getVoteSummary.mockResolvedValue(summary)
      mockSession.findByCode.mockResolvedValue({ id: 's1', members: [{ id: 'm1' }, { id: 'm2' }] })
      mockSession.resolveVote.mockResolvedValue(null)

      const client = makeSocket('socket-1')
      await gateway.handleVote({ spinId: 'sp1', memberId: 'm1', value: true, sessionId: 's1' }, client as any)

      expect(mockSession.recordVote).toHaveBeenCalledWith('sp1', 'm1', true)
      expect((gateway as any).server.to).toHaveBeenCalledWith('session:ABC')
      expect((gateway as any).server.emit).toHaveBeenCalledWith(SESSION_EVENTS.VOTE_UPDATE, summary)
      expect((gateway as any).server.emit).not.toHaveBeenCalledWith(SESSION_EVENTS.VOTE_RESULT, expect.anything())
    })

    it('emits VOTE_RESULT with activity when all members have voted and vote resolves', async () => {
      ;(gateway as any).socketToMember.set('socket-1', { memberId: 'm1', sessionCode: 'ABC' })
      const summary = { yes: 2, no: 0, total: 2 }
      const activity = { id: 'a1', title: 'Bowling' }

      mockSession.recordVote.mockResolvedValue({})
      mockSession.getVoteSummary.mockResolvedValue(summary)
      mockSession.findByCode.mockResolvedValue({ id: 's1', members: [{ id: 'm1' }, { id: 'm2' }] })
      mockSession.resolveVote.mockResolvedValue('accepted')
      mockSession.getSessionHistory.mockResolvedValue([{ id: 'sp1', activity }])

      const client = makeSocket('socket-1')
      await gateway.handleVote({ spinId: 'sp1', memberId: 'm1', value: true, sessionId: 's1' }, client as any)

      expect(mockSession.getSessionHistory).toHaveBeenCalledWith('s1')
      expect((gateway as any).server.emit).toHaveBeenCalledWith(SESSION_EVENTS.VOTE_RESULT, {
        result: 'accepted',
        activity,
        ...summary,
      })
    })
  })

  describe('handleClose', () => {
    it('does nothing when socket is not in the map', async () => {
      const client = makeSocket('socket-1')
      await gateway.handleClose({ sessionId: 's1', hostId: 'host-1' }, client as any)

      expect(mockSession.findByCode).not.toHaveBeenCalled()
    })

    it('does nothing when caller is not the host', async () => {
      ;(gateway as any).socketToMember.set('socket-1', { memberId: 'm1', sessionCode: 'ABC' })
      mockSession.findByCode.mockResolvedValue({ id: 's1', hostId: 'host-1' })

      const client = makeSocket('socket-1')
      await gateway.handleClose({ sessionId: 's1', hostId: 'impostor' }, client as any)

      expect(mockSession.close).not.toHaveBeenCalled()
    })

    it('closes the session and emits CLOSED with history when host requests it', async () => {
      ;(gateway as any).socketToMember.set('socket-1', { memberId: 'm1', sessionCode: 'ABC' })
      const history = [{ id: 'sp1', result: 'accepted' }]

      mockSession.findByCode.mockResolvedValue({ id: 's1', hostId: 'host-1' })
      mockSession.close.mockResolvedValue({})
      mockSession.getSessionHistory.mockResolvedValue(history)

      const client = makeSocket('socket-1')
      await gateway.handleClose({ sessionId: 's1', hostId: 'host-1' }, client as any)

      expect(mockSession.close).toHaveBeenCalledWith('s1', 'host-1')
      expect(mockSession.getSessionHistory).toHaveBeenCalledWith('s1')
      expect((gateway as any).server.to).toHaveBeenCalledWith('session:ABC')
      expect((gateway as any).server.emit).toHaveBeenCalledWith(SESSION_EVENTS.CLOSED, { history })
    })
  })
})
