import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { SessionService } from './session.service'
import { LOBBY_EVENTS, SESSION_EVENTS } from '@spinout/shared'

@WebSocketGateway({ cors: { origin: '*' } })
export class SessionGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server

  // memberId par socketId pour gérer les déconnexions
  private socketToMember = new Map<string, { memberId: string; sessionCode: string }>()

  constructor(private session: SessionService) {}

  async handleDisconnect(client: Socket) {
    const data = this.socketToMember.get(client.id)
    if (!data) return

    this.server.to(`lobby:${data.sessionCode}`).emit(LOBBY_EVENTS.MEMBER_LEFT, {
      memberId: data.memberId,
    })
    this.socketToMember.delete(client.id)
  }

  @SubscribeMessage(LOBBY_EVENTS.JOIN)
  async handleLobbyJoin(
    @MessageBody() body: { code: string; memberId?: string; userId?: string; guestName?: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Reuse an existing member (REST create/join already inserted one) to avoid duplicates.
      let memberId = body.memberId
        ? (await this.session.findMember(body.memberId, body.code))?.id
        : undefined

      if (!memberId) {
        const { member } = await this.session.join(body.code, body.userId, body.guestName)
        memberId = member.id
      }

      const fullSession = await this.session.findByCode(body.code)

      client.join(`lobby:${body.code}`)
      this.socketToMember.set(client.id, { memberId, sessionCode: body.code })

      client.emit(LOBBY_EVENTS.JOINED, {
        session: fullSession,
        members: fullSession.members,
        memberId,
      })

      client.to(`lobby:${body.code}`).emit(LOBBY_EVENTS.MEMBER_JOINED, {
        members: fullSession.members,
      })
    } catch (err) {
      client.emit('lobby:error', {
        message: err instanceof Error ? err.message : 'Could not join the lobby',
      })
    }
  }

  @SubscribeMessage(LOBBY_EVENTS.SET_PREFS)
  async handleSetPrefs(
    @MessageBody() body: { memberId: string; category: string; likedTags: string[]; dislikedTags: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    const pref = await this.session.setPreferences(
      body.memberId,
      body.category,
      body.likedTags,
      body.dislikedTags,
    )

    const data = this.socketToMember.get(client.id)
    if (!data) return

    this.server.to(`lobby:${data.sessionCode}`).emit(LOBBY_EVENTS.PREF_UPDATED, {
      memberId: body.memberId,
      pref,
    })
  }

  @SubscribeMessage(SESSION_EVENTS.JOIN)
  async handleSessionJoin(
    @MessageBody() body: { code: string; memberId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const member = await this.session.findMember(body.memberId, body.code)
    if (!member) {
      client.emit('session:error', { message: 'Not a member of this session' })
      return
    }

    client.join(`session:${body.code}`)
    this.socketToMember.set(client.id, { memberId: body.memberId, sessionCode: body.code })
  }

  @SubscribeMessage(LOBBY_EVENTS.START)
  async handleLobbyStart(
    @MessageBody() body: { sessionId: string; hostId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const data = this.socketToMember.get(client.id)
    if (!data) return

    const fullSession = await this.session.findByCode(data.sessionCode)
    if (fullSession.hostId !== body.hostId) return

    client.join(`session:${data.sessionCode}`)
    client.to(`lobby:${data.sessionCode}`).emit(SESSION_EVENTS.STARTED)

    this.server.to(`lobby:${data.sessionCode}`).emit(SESSION_EVENTS.STARTED)
  }

  @SubscribeMessage(SESSION_EVENTS.SPIN)
  async handleSpin(
    @MessageBody() body: { sessionId: string; hostId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const data = this.socketToMember.get(client.id)
    if (!data) return

    const fullSession = await this.session.findByCode(data.sessionCode)
    if (fullSession.hostId !== body.hostId) return

    const memberCount = fullSession.members.length
    const activity = await this.session.pickActivity(body.sessionId, memberCount)
    const spinNumber = fullSession.spins?.length ?? 0
    const spin = await this.session.recordSpin(body.sessionId, activity.id, spinNumber + 1)

    this.server.to(`session:${data.sessionCode}`).emit(SESSION_EVENTS.ACTIVITY, {
      activity,
      spinId: spin.id,
    })
  }

  @SubscribeMessage(SESSION_EVENTS.VOTE)
  async handleVote(
    @MessageBody() body: { spinId: string; memberId: string; value: boolean; sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const data = this.socketToMember.get(client.id)
    if (!data) return

    await this.session.recordVote(body.spinId, body.memberId, body.value)

    const summary = await this.session.getVoteSummary(body.spinId)
    this.server.to(`session:${data.sessionCode}`).emit(SESSION_EVENTS.VOTE_UPDATE, summary)

    const fullSession = await this.session.findByCode(data.sessionCode)
    const result = await this.session.resolveVote(body.spinId, fullSession.members.length)

    if (result) {
      const spin = await this.session.getSessionHistory(body.sessionId)
      const currentSpin = spin.find(s => s.id === body.spinId)

      this.server.to(`session:${data.sessionCode}`).emit(SESSION_EVENTS.VOTE_RESULT, {
        result,
        activity: currentSpin?.activity,
        ...summary,
      })
    }
  }

  @SubscribeMessage(SESSION_EVENTS.CLOSE)
  async handleClose(
    @MessageBody() body: { sessionId: string; hostId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const data = this.socketToMember.get(client.id)
    if (!data) return

    const fullSession = await this.session.findByCode(data.sessionCode)
    if (fullSession.hostId !== body.hostId) return

    await this.session.close(body.sessionId, body.hostId)
    const history = await this.session.getSessionHistory(body.sessionId)

    this.server.to(`session:${data.sessionCode}`).emit(SESSION_EVENTS.CLOSED, { history })
  }
}