import { FastifyInstance } from 'fastify'
import { requireAuth } from '../middleware/auth'
import { BADGE_DEFINITIONS } from '../services/badges'

export default async function badgesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth)

  app.get('/:childId', async (request: any, reply) => {
    const child = await app.prisma.child.findFirst({
      where: { id: request.params.childId, userId: request.userId },
    })
    if (!child) return reply.code(403).send({ error: 'Non autorisé' })

    const earned = await app.prisma.childBadge.findMany({
      where: { childId: request.params.childId },
      orderBy: { earnedAt: 'asc' },
    })

    // Return earned badges with their metadata + all badge definitions for locked display
    const earnedCodes = new Set(earned.map(b => b.code))
    const all = Object.entries(BADGE_DEFINITIONS).map(([code, def]) => ({
      code,
      ...def,
      earned: earnedCodes.has(code),
      earnedAt: earned.find(b => b.code === code)?.earnedAt ?? null,
    }))

    return all
  })
}
