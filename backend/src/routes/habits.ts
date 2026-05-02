import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'

const habitSchema = z.object({
  childId: z.string(),
  title: z.string().min(1),
  emoji: z.string(),
  color: z.string().default('#4ECDC4'),
  frequency: z.enum(['DAILY', 'WEEKLY']).default('DAILY'),
  timeOfDay: z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'ANYTIME']).default('ANYTIME'),
  pointValue: z.number().int().min(1).max(100).default(10),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).default([0,1,2,3,4,5,6]),
  order: z.number().int().default(0),
})

export default async function habitsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth)

  app.post('/', async (request, reply) => {
    const body = habitSchema.parse(request.body)
    const child = await app.prisma.child.findFirst({ where: { id: body.childId, userId: request.userId } })
    if (!child) return reply.code(403).send({ error: 'Non autorisé' })

    const user = await app.prisma.user.findUnique({ where: { id: request.userId } })
    if (user?.plan === 'FREE') {
      const count = await app.prisma.habit.count({ where: { childId: body.childId, isActive: true } })
      if (count >= 5) return reply.code(403).send({ error: 'Maximum 5 habitudes en plan gratuit' })
    }
    return app.prisma.habit.create({ data: body })
  })

  app.patch('/:id', async (request: any, reply) => {
    const habit = await app.prisma.habit.findUnique({
      where: { id: request.params.id },
      include: { child: true },
    })
    if (!habit || habit.child.userId !== request.userId) return reply.code(403).send({ error: 'Non autorisé' })
    const body = habitSchema.partial().omit({ childId: true }).parse(request.body)
    return app.prisma.habit.update({ where: { id: request.params.id }, data: body })
  })

  app.delete('/:id', async (request: any, reply) => {
    const habit = await app.prisma.habit.findUnique({
      where: { id: request.params.id },
      include: { child: true },
    })
    if (!habit || habit.child.userId !== request.userId) return reply.code(403).send({ error: 'Non autorisé' })
    return app.prisma.habit.update({ where: { id: request.params.id }, data: { isActive: false } })
  })
}
