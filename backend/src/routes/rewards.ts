import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'

const rewardSchema = z.object({
  childId: z.string(),
  title: z.string().min(1),
  emoji: z.string(),
  pointCost: z.number().int().min(1),
  type: z.enum(['DIGITAL', 'PHYSICAL', 'PRIVILEGE']).default('PHYSICAL'),
})

export default async function rewardsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth)

  app.get('/:childId', async (request: any, reply) => {
    const child = await app.prisma.child.findFirst({
      where: { id: request.params.childId, userId: request.userId },
    })
    if (!child) return reply.code(403).send({ error: 'Non autorisé' })
    return app.prisma.reward.findMany({ where: { childId: request.params.childId } })
  })

  app.post('/', async (request, reply) => {
    const body = rewardSchema.parse(request.body)
    const child = await app.prisma.child.findFirst({
      where: { id: body.childId, userId: request.userId },
    })
    if (!child) return reply.code(403).send({ error: 'Non autorisé' })
    return app.prisma.reward.create({ data: body })
  })

  app.post('/:id/unlock', async (request: any, reply) => {
    const reward = await app.prisma.reward.findUnique({
      where: { id: request.params.id },
      include: { child: true },
    })
    if (!reward || reward.child.userId !== request.userId) return reply.code(403).send({ error: 'Non autorisé' })
    if (reward.isUnlocked) return reply.code(400).send({ error: 'Déjà débloquée' })
    if (reward.child.xp < reward.pointCost) return reply.code(400).send({ error: 'Pas assez de points' })

    await app.prisma.$transaction([
      app.prisma.reward.update({
        where: { id: request.params.id },
        data: { isUnlocked: true, unlockedAt: new Date() },
      }),
      app.prisma.child.update({
        where: { id: reward.childId },
        data: { xp: reward.child.xp - reward.pointCost },
      }),
    ])
    return { success: true }
  })

  app.delete('/:id', async (request: any, reply) => {
    const reward = await app.prisma.reward.findUnique({
      where: { id: request.params.id },
      include: { child: true },
    })
    if (!reward || reward.child.userId !== request.userId) return reply.code(403).send({ error: 'Non autorisé' })
    await app.prisma.reward.delete({ where: { id: request.params.id } })
    return { success: true }
  })
}
