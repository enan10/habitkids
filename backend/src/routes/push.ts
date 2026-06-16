import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { getVapidPublicKey, sendPushToUser } from '../services/notifications'

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string(),
  auth: z.string(),
})

const scheduleSchema = z.object({
  childId: z.string(),
  hour: z.coerce.number().int().min(0).max(23),
  minute: z.coerce.number().int().min(0).max(59),
  label: z.string().default('Rappel habitudes'),
  isEnabled: z.boolean().default(true),
})

export default async function pushRoutes(app: FastifyInstance) {
  // Public — frontend needs this before being authenticated
  app.get('/vapid-public-key', async () => ({
    publicKey: getVapidPublicKey(),
  }))

  // Authenticated sub-scope — hook only applies here, not to the public route above
  app.register(async (auth) => {
    auth.addHook('preHandler', requireAuth)

    auth.post('/subscribe', async (request, reply) => {
      const body = subscribeSchema.parse(request.body)
      await app.prisma.pushSubscription.upsert({
        where: { endpoint: body.endpoint },
        update: { p256dh: body.p256dh, auth: body.auth },
        create: { ...body, userId: request.userId },
      })
      return { success: true }
    })

    auth.delete('/subscribe', async (request: any) => {
      const { endpoint } = request.body as { endpoint: string }
      await app.prisma.pushSubscription.deleteMany({
        where: { endpoint, userId: request.userId },
      })
      return { success: true }
    })

    auth.get('/schedules/:childId', async (request: any, reply) => {
      const child = await app.prisma.child.findFirst({
        where: { id: request.params.childId, userId: request.userId },
      })
      if (!child) return reply.code(403).send({ error: 'Non autorisé' })
      return app.prisma.notificationSchedule.findMany({
        where: { childId: request.params.childId },
        orderBy: [{ hour: 'asc' }, { minute: 'asc' }],
      })
    })

    auth.post('/schedules', async (request, reply) => {
      const body = scheduleSchema.parse(request.body)
      const child = await app.prisma.child.findFirst({
        where: { id: body.childId, userId: request.userId },
      })
      if (!child) return reply.code(403).send({ error: 'Non autorisé' })
      const user = await app.prisma.user.findUnique({ where: { id: request.userId } })
      if (user?.plan === 'FREE') {
        const count = await app.prisma.notificationSchedule.count({ where: { childId: body.childId } })
        if (count >= 1) return reply.code(403).send({ error: 'Maximum 1 rappel en plan gratuit', upgrade: true })
      }
      return app.prisma.notificationSchedule.create({ data: body })
    })

    auth.patch('/schedules/:id', async (request: any, reply) => {
      const schedule = await app.prisma.notificationSchedule.findUnique({
        where: { id: request.params.id },
        include: { child: true },
      })
      if (!schedule || schedule.child.userId !== request.userId)
        return reply.code(403).send({ error: 'Non autorisé' })
      const body = scheduleSchema.partial().omit({ childId: true }).parse(request.body)
      return app.prisma.notificationSchedule.update({ where: { id: request.params.id }, data: body })
    })

    auth.delete('/schedules/:id', async (request: any, reply) => {
      const schedule = await app.prisma.notificationSchedule.findUnique({
        where: { id: request.params.id },
        include: { child: true },
      })
      if (!schedule || schedule.child.userId !== request.userId)
        return reply.code(403).send({ error: 'Non autorisé' })
      await app.prisma.notificationSchedule.delete({ where: { id: request.params.id } })
      return { success: true }
    })

    // FCM token registration (Android APK)
    auth.post('/fcm-register', async (request: any) => {
      const { token } = request.body as { token: string }
      if (!token) return { success: false }
      await app.prisma.fcmDevice.upsert({
        where: { token },
        update: { userId: request.userId },
        create: { token, userId: request.userId },
      })
      return { success: true }
    })

    auth.delete('/fcm-register', async (request: any) => {
      const { token } = request.body as { token: string }
      if (token) {
        await app.prisma.fcmDevice.deleteMany({ where: { token, userId: request.userId } })
      } else {
        await app.prisma.fcmDevice.deleteMany({ where: { userId: request.userId } })
      }
      return { success: true }
    })

    auth.post('/test', async (request: any) => {
      await sendPushToUser(app.prisma, request.userId, {
        title: 'HabitKids 🌟',
        body: 'Les notifications fonctionnent parfaitement !',
        icon: '/icon-192.png',
        tag: 'test',
      })
      return { success: true }
    })
  })
}
