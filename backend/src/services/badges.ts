import { PrismaClient } from '@prisma/client'

export const BADGE_DEFINITIONS: Record<string, { title: string; emoji: string; description: string }> = {
  first_habit:    { emoji: '🌟', title: 'Premier pas !',        description: 'Première habitude complétée' },
  perfect_day:    { emoji: '💯', title: 'Journée parfaite !',   description: 'Toutes les habitudes du jour faites' },
  streak_3:       { emoji: '🔥', title: 'En feu !',             description: '3 jours de suite' },
  streak_7:       { emoji: '⚡', title: 'Super streak !',       description: '7 jours consécutifs' },
  streak_30:      { emoji: '🏅', title: 'Invincible !',         description: '30 jours consécutifs' },
  level_2:        { emoji: '🥈', title: 'Apprenti champion',    description: 'Niveau 2 atteint' },
  level_3:        { emoji: '🥇', title: 'Héros du quotidien',   description: 'Niveau 3 atteint' },
  level_4:        { emoji: '💎', title: 'Super champion',       description: 'Niveau 4 atteint' },
  level_5:        { emoji: '👑', title: 'Légende !',            description: 'Niveau 5 atteint' },
  points_50:      { emoji: '⭐', title: '50 points !',          description: '50 XP cumulés' },
  points_200:     { emoji: '🌠', title: '200 points !',         description: '200 XP cumulés' },
  points_500:     { emoji: '🚀', title: '500 points !',         description: '500 XP cumulés' },
  week_champion:  { emoji: '🏆', title: 'Champion de la semaine', description: '7 habitudes en une semaine' },
}

interface CheckContext {
  childId: string
  newXP: number
  newLevel: number
  newStreak: number
  completedAllToday: boolean
  totalCompletionsThisWeek: number
}

export async function checkAndAwardBadges(prisma: PrismaClient, ctx: CheckContext): Promise<string[]> {
  const earned = await prisma.childBadge.findMany({ where: { childId: ctx.childId } })
  const earnedCodes = new Set(earned.map(b => b.code))

  const toAward: string[] = []

  // First completion ever
  const totalCompletions = await prisma.habitCompletion.count({ where: { childId: ctx.childId } })
  if (totalCompletions === 1 && !earnedCodes.has('first_habit')) toAward.push('first_habit')

  // Perfect day
  if (ctx.completedAllToday && !earnedCodes.has('perfect_day')) toAward.push('perfect_day')

  // Streak badges
  if (ctx.newStreak >= 3  && !earnedCodes.has('streak_3'))  toAward.push('streak_3')
  if (ctx.newStreak >= 7  && !earnedCodes.has('streak_7'))  toAward.push('streak_7')
  if (ctx.newStreak >= 30 && !earnedCodes.has('streak_30')) toAward.push('streak_30')

  // Level badges
  if (ctx.newLevel >= 2 && !earnedCodes.has('level_2')) toAward.push('level_2')
  if (ctx.newLevel >= 3 && !earnedCodes.has('level_3')) toAward.push('level_3')
  if (ctx.newLevel >= 4 && !earnedCodes.has('level_4')) toAward.push('level_4')
  if (ctx.newLevel >= 5 && !earnedCodes.has('level_5')) toAward.push('level_5')

  // XP milestones
  if (ctx.newXP >= 50  && !earnedCodes.has('points_50'))  toAward.push('points_50')
  if (ctx.newXP >= 200 && !earnedCodes.has('points_200')) toAward.push('points_200')
  if (ctx.newXP >= 500 && !earnedCodes.has('points_500')) toAward.push('points_500')

  // Week champion
  if (ctx.totalCompletionsThisWeek >= 7 && !earnedCodes.has('week_champion')) toAward.push('week_champion')

  if (toAward.length > 0) {
    await prisma.childBadge.createMany({
      data: toAward.map(code => ({ childId: ctx.childId, code })),
      skipDuplicates: true,
    })
  }

  return toAward
}
