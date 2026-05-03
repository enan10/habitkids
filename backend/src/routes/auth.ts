import { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export default async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body)
    const existing = await app.prisma.user.findUnique({ where: { email: body.email } })
    if (existing) return reply.code(400).send({ error: 'Email déjà utilisé' })

    const hashed = await bcrypt.hash(body.password, 12)
    const user = await app.prisma.user.create({
      data: { email: body.email, password: hashed, name: body.name },
    })
    const token = app.jwt.sign({ userId: user.id, email: user.email })
    return { token, user: { id: user.id, email: user.email, name: user.name, plan: user.plan } }
  })

  app.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body)
    const user = await app.prisma.user.findUnique({ where: { email: body.email } })
    if (!user || !(await bcrypt.compare(body.password, user.password))) {
      return reply.code(401).send({ error: 'Email ou mot de passe incorrect' })
    }
    const token = app.jwt.sign({ userId: user.id, email: user.email })
    return { token, user: { id: user.id, email: user.email, name: user.name, plan: user.plan } }
  })

  app.post('/upgrade', { preHandler: requireAuth }, async (request: any) => {
    await app.prisma.user.update({ where: { id: request.userId }, data: { plan: 'PREMIUM' } })
    return { success: true, plan: 'PREMIUM' }
  })
}
