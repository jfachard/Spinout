import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  async pickActivity(
    sessionId: string,
    memberCount: number,
  ) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        members: { include: { preferences: true } },
        spins: true,
      },
    })

    if (!session) throw new NotFoundException('Session not found')

    const alreadySpunIds = session.spins.map(s => s.activityId)

    const membersWithPrefs = session.members.filter(m => m.preferences.length > 0)
    let filterCategories: string[] = session.categories

    if (membersWithPrefs.length > 0) {
      const categorySets = membersWithPrefs.map(m => new Set(m.preferences.map(p => p.category)))
      const firstSet = [...categorySets[0]]
      const intersection = firstSet.filter(cat => categorySets.every(s => s.has(cat)))
      if (intersection.length > 0) filterCategories = intersection
    }

    const allLikedTags = session.members.flatMap(m => m.preferences.flatMap(p => p.likedTags))
    const allDislikedTags = session.members.flatMap(m => m.preferences.flatMap(p => p.dislikedTags))

    const playerFilter = {
      minPlayers: { lte: memberCount },
      maxPlayers: { gte: memberCount },
    }

    const baseExclusion = {
      id: { notIn: alreadySpunIds.length > 0 ? alreadySpunIds : undefined },
      ...playerFilter,
    }

    const activities = await this.prisma.activity.findMany({
      where: {
        ...baseExclusion,
        category: { in: filterCategories.length > 0 ? filterCategories : undefined },
      },
    })

    const pool =
      activities.length > 0
        ? activities
        : await this.prisma.activity.findMany({ where: baseExclusion })

    if (pool.length === 0) throw new NotFoundException('No activities available')

    const scored = pool.map(a => ({
      activity: a,
      score:
        a.tags.filter(t => allLikedTags.includes(t)).length -
        a.tags.filter(t => allDislikedTags.includes(t)).length,
    }))

    scored.sort((a, b) => b.score - a.score)
    const topScore = scored[0].score
    const topActivities = scored.filter(a => a.score === topScore)

    return topActivities[Math.floor(Math.random() * topActivities.length)].activity
  }
}
