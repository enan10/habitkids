import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { getLevelFromXP } from '../services/points'
import { checkAndAwardBadges, BADGE_DEFINITIONS } from '../services/badges'

const completionSchema = z.object({
  habitId: z.string(),
  childId: z.string(),
})

export default async function completionsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth)

  app.get('/today/:childId', async (request: any, reply) => {
    const child = await app.prisma.child.findFirst({
      where: { id: request.params.childId, userId: request.userId },
    })
    if (!child) return reply.code(403).send({ error: 'Non autorisé' })
    const today = new Date().toISOString().split('T')[0]
    return app.prisma.habitCompletion.findMany({
      where: { childId: request.params.childId, date: today },
      include: { habit: true },
    })
  })

  app.get('/range/:childId', async (request: any, reply) => {
    const child = await app.prisma.child.findFirst({
      where: { id: request.params.childId, userId: request.userId },
    })
    if (!child) return reply.code(403).send({ error: 'Non autorisé' })
    const { from, to } = request.query as { from: string; to: string }
    return app.prisma.habitCompletion.findMany({
      where: { childId: request.params.childId, date: { gte: from, lte: to } },
      include: { habit: true },
      orderBy: { completedAt: 'asc' },
    })
  })

  app.post('/', async (request, reply) => {
    const body = completionSchema.parse(request.body)
    const child = await app.prisma.child.findFirst({
      where: { id: body.childId, userId: request.userId },
    })
    if (!child) return reply.code(403).send({ error: 'Non autorisé' })

    const habit = await app.prisma.habit.findUnique({ where: { id: body.habitId } })
    if (!habit || habit.childId !== body.childId) return reply.code(400).send({ error: 'Habitude invalide' })

    const today = new Date().toISOString().split('T')[0]
    const existing = await app.prisma.habitCompletion.findUnique({
      where: { habitId_date: { habitId: body.habitId, date: today } },
    })
    if (existing) return { alreadyCompleted: true, completion: existing }

    const completion = await app.prisma.habitCompletion.create({
      data: { habitId: body.habitId, childId: body.childId, date: today, pointsEarned: habit.pointValue },
    })

    const newXP = child.xp + habit.pointValue
    const newLevel = getLevelFromXP(newXP)
    const leveledUp = newLevel > child.level

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    const yesterdayHit = await app.prisma.habitCompletion.findFirst({
      where: { childId: body.childId, date: yesterdayStr },
    })
    const newStreak = yesterdayHit ? child.streakDays + 1 : 1

    await app.prisma.child.update({
      where: { id: body.childId },
      data: { xp: newXP, level: newLevel, streakDays: newStreak, lastActiveAt: new Date() },
    })

    // Check if all habits are done today
    const activeHabits = await app.prisma.habit.count({ where: { childId: body.childId, isActive: true } })
    const todayCompletions = await app.prisma.habitCompletion.count({ where: { childId: body.childId, date: today } })
    const completedAllToday = activeHabits > 0 && todayCompletions >= activeHabits

    // Count completions this week
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 6)
    const weekStartStr = weekStart.toISOString().split('T')[0]
    const totalCompletionsThisWeek = await app.prisma.habitCompletion.count({
      where: { childId: body.childId, date: { gte: weekStartStr } },
    })

    // Check and award badges
    const newBadgeCodes = await checkAndAwardBadges(app.prisma, {
      childId: body.childId,
      newXP,
      newLevel,
      newStreak,
      completedAllToday,
      totalCompletionsThisWeek,
    })

    const newBadges = newBadgeCodes.map(code => ({ code, ...BADGE_DEFINITIONS[code] }))

    return {
      completion,
      pointsEarned: habit.pointValue,
      newXP,
      newLevel,
      leveledUp,
      newStreak,
      newBadges,
      completedAllToday,
    }
  })

  app.delete('/:habitId', async (request: any, reply) => {
    const today = new Date().toISOString().split('T')[0]
    const completion = await app.prisma.habitCompletion.findUnique({
      where: { habitId_date: { habitId: request.params.habitId, date: today } },
      include: { child: true },
    })
    if (!completion) return reply.code(404).send({ error: 'Complétion introuvable' })
    if (completion.child.userId !== request.userId) return reply.code(403).send({ error: 'Non autorisé' })

    await app.prisma.$transaction([
      app.prisma.habitCompletion.delete({
        where: { habitId_date: { habitId: request.params.habitId, date: today } },
      }),
      app.prisma.child.update({
        where: { id: completion.childId },
        data: { xp: Math.max(0, completion.child.xp - completion.pointsEarned) },
      }),
    ])
    return { success: true }
  })
}
