import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'

const childSchema = z.object({
  name: z.string().min(1),
  birthDate: z.string().optional(),
  avatarEmoji: z.string().default('🧒'),
  avatarColor: z.string().default('#FF6B6B'),
})

export default async function childrenRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth)

  app.get('/', async (request) => {
    return app.prisma.child.findMany({
      where: { userId: request.userId },
      include: {
        habits: { where: { isActive: true }, orderBy: { order: 'asc' } },
        rewards: true,
      },
    })
  })

  app.post('/', async (request, reply) => {
    const user = await app.prisma.user.findUnique({ where: { id: request.userId } })
    const childCount = await app.prisma.child.count({ where: { userId: request.userId } })
    if (user?.plan === 'FREE' && childCount >= 1) {
      return reply.code(403).send({ error: 'Passez au plan Premium pour ajouter plusieurs enfants' })
    }
    const body = childSchema.parse(request.body)
    return app.prisma.child.create({
      data: {
        ...body,
        userId: request.userId,
        birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
      },
    })
  })

  app.get('/:id', async (request: any, reply) => {
    const { filter } = request.query as { filter?: string }
    const todayDayOfWeek = new Date().getDay() // 0=Sun … 6=Sat

    const habitsWhere: any = { isActive: true }
    if (filter === 'today') {
      habitsWhere.OR = [
        { frequency: 'DAILY' },
        { frequency: 'WEEKLY', daysOfWeek: { has: todayDayOfWeek } },
      ]
    }

    const child = await app.prisma.child.findFirst({
      where: { id: request.params.id, userId: request.userId },
      include: {
        habits: { where: habitsWhere, orderBy: { order: 'asc' } },
        rewards: true,
      },
    })
    if (!child) return reply.code(404).send({ error: 'Enfant introuvable' })
    return child
  })

  app.patch('/:id', async (request: any, reply) => {
    const child = await app.prisma.child.findFirst({
      where: { id: request.params.id, userId: request.userId },
    })
    if (!child) return reply.code(404).send({ error: 'Enfant introuvable' })
    const body = childSchema.partial().parse(request.body)
    return app.prisma.child.update({ where: { id: request.params.id }, data: body })
  })

  app.delete('/:id', async (request: any, reply) => {
    const child = await app.prisma.child.findFirst({
      where: { id: request.params.id, userId: request.userId },
    })
    if (!child) return reply.code(404).send({ error: 'Enfant introuvable' })
    await app.prisma.child.delete({ where: { id: request.params.id } })
    return { success: true }
  })
}
