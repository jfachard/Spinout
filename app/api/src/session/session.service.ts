import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ActivityService } from '../activity/activity.service'

@Injectable()
export class SessionService {
  constructor(
    private prisma: PrismaService,
    private activityService: ActivityService,
  ) {}

  async create(hostId: string, categories: string[]) {
    const code = this.generateCode()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    const session = await this.prisma.session.create({
      data: {
        code,
        hostId,
        categories,
        expiresAt,
        members: {
          create: {
            userId: hostId,
          },
        },
      },
      include: { members: true },
    })

    return session
  }

  async join(code: string, userId?: string, guestName?: string) {
    const session = await this.prisma.session.findUnique({
      where: { code },
      include: { members: true },
    })

    if (!session) throw new NotFoundException('Session not found')
    if (session.status === 'closed') throw new ForbiddenException('Session is closed')

    const member = await this.prisma.sessionMember.create({
      data: {
        sessionId: session.id,
        userId: userId ?? null,
        guestName: guestName ?? null,
      },
    })

    return { session, member }
  }

  async findByCode(code: string) {
    const session = await this.prisma.session.findUnique({
      where: { code },
      include: {
        members: {
          include: { user: true, preferences: true },
        },
        spins: true,
      },
    })

    if (!session) throw new NotFoundException('Session not found')
    return session
  }

  async close(sessionId: string, userId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    })

    if (!session) throw new NotFoundException('Session not found')
    if (session.hostId !== userId) throw new ForbiddenException('Only the host can close the session')

    return this.prisma.session.update({
      where: { id: sessionId },
      data: { status: 'closed' },
    })
  }

  async setPreferences(memberId: string, category: string, likedTags: string[], dislikedTags: string[]) {
    return this.prisma.preference.upsert({
      where: { memberId_category: { memberId, category } },
      update: { likedTags, dislikedTags },
      create: { memberId, category, likedTags, dislikedTags },
    })
  }

  async pickActivity(sessionId: string, memberCount: number) {
    return this.activityService.pickActivity(sessionId, memberCount)
  }

  async recordSpin(sessionId: string, activityId: string, spinNumber: number) {
    return this.prisma.spin.create({
      data: { sessionId, activityId, spinNumber, result: 'pending' },
    })
  }

  async recordVote(spinId: string, memberId: string, value: boolean) {
    return this.prisma.vote.upsert({
      where: { spinId_memberId: { spinId, memberId } },
      update: { value },
      create: { spinId, memberId, value },
    })
  }

  async getVoteSummary(spinId: string) {
    const votes = await this.prisma.vote.findMany({ where: { spinId } })
    const yes = votes.filter(v => v.value).length
    const no = votes.filter(v => !v.value).length
    return { yes, no, total: votes.length }
  }

  async resolveVote(spinId: string, totalMembers: number) {
    const { yes, no, total } = await this.getVoteSummary(spinId)
    if (total < totalMembers) return null

    const result = yes > no ? 'accepted' : 'rejected'
    await this.prisma.spin.update({ where: { id: spinId }, data: { result } })
    return result
  }

  async getSessionHistory(sessionId: string) {
    return this.prisma.spin.findMany({
      where: { sessionId },
      include: { activity: true, votes: true },
      orderBy: { spinNumber: 'asc' },
    })
  }

  private generateCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }
}