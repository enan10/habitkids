import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'

const MAX_EXTRA_CHILDREN = 2   // total max = 3 enfants
const MAX_EXTRA_HABITS = 15    // total max = 20 habitudes
const MAX_EXTRA_REWARDS = 15   // total max = 16 récompenses

export default async function adsRoutes(app: FastifyInstance) {

  app.post('/reward', { preHandler: requireAuth }, async (request: any, reply) => {
    const { type } = z.object({
      type: z.enum(['habits', 'rewards', 'children']),
    }).parse(request.body)

    const user = await app.prisma.user.findUnique({ where: { id: request.userId } })
    if (!user) return reply.code(404).send({ error: 'Utilisateur introuvable' })

    const updateData: any = {}

    if (type === 'children') {
      if (user.extraChildren >= MAX_EXTRA_CHILDREN) {
        return reply.code(400).send({ error: 'Maximum d\'enfants atteint (3 au total)' })
      }
      updateData.extraChildren = user.extraChildren + 1
    } else if (type === 'habits') {
      if (user.extraHabits >= MAX_EXTRA_HABITS) {
        return reply.code(400).send({ error: 'Maximum d\'habitudes atteint' })
      }
      updateData.extraHabits = user.extraHabits + 1
    } else if (type === 'rewards') {
      if (user.extraRewards >= MAX_EXTRA_REWARDS) {
        return reply.code(400).send({ error: 'Maximum de récompenses atteint' })
      }
      updateData.extraRewards = user.extraRewards + 1
    }

    const updated = await app.prisma.user.update({
      where: { id: request.userId },
      data: updateData,
    })

    return {
      success: true,
      extraChildren: updated.extraChildren,
      extraHabits: updated.extraHabits,
      extraRewards: updated.extraRewards,
    }
  })

  app.get('/limits', { preHandler: requireAuth }, async (request: any, reply) => {
    const user = await app.prisma.user.findUnique({ where: { id: request.userId } })
    if (!user) return reply.code(404).send({ error: 'Utilisateur introuvable' })

    return {
      maxChildren: 1 + user.extraChildren,
      maxHabits: 5 + user.extraHabits,
      maxRewards: 1 + user.extraRewards,
      extraChildren: user.extraChildren,
      extraHabits: user.extraHabits,
      extraRewards: user.extraRewards,
    }
  })
}
