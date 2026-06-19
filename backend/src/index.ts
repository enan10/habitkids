import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { PrismaClient } from '@prisma/client'
import './types/index'

import authRoutes from './routes/auth'
import childrenRoutes from './routes/children'
import habitsRoutes from './routes/habits'
import completionsRoutes from './routes/completions'
import rewardsRoutes from './routes/rewards'
import badgesRoutes from './routes/badges'
import pushRoutes from './routes/push'
import { initVapid, initFCM, startNotificationScheduler } from './services/notifications'

const prisma = new PrismaClient()
// 5MB limit for child photo (base64 data URL)
const app = Fastify({ logger: { level: 'info' }, bodyLimit: 5 * 1024 * 1024 })

app.register(cors, {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost',
    'capacitor://localhost',
    'ionic://localhost',
    /^https:\/\/.*\.onrender\.com$/,
    /^https:\/\/.*\.netlify\.app$/,
    /^https:\/\/.*\.fly\.dev$/,
    /^https:\/\/.*\.pages\.dev$/,
    /^https:\/\/.*\.workers\.dev$/,
    /^http:\/\/192\.168\./,
    /^http:\/\/10\./,
    /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./,
  ],
  credentials: true,
})

app.register(jwt, {
  secret: process.env.JWT_SECRET || 'habitkids-dev-secret-change-in-prod-32chars',
})

app.decorate('prisma', prisma)

app.register(authRoutes, { prefix: '/api/auth' })
app.register(childrenRoutes, { prefix: '/api/children' })
app.register(habitsRoutes, { prefix: '/api/habits' })
app.register(completionsRoutes, { prefix: '/api/completions' })
app.register(rewardsRoutes, { prefix: '/api/rewards' })
app.register(badgesRoutes, { prefix: '/api/badges' })
app.register(pushRoutes, { prefix: '/api/push' })

app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

const start = async () => {
  try {
    await prisma.$connect()
    initVapid()
    initFCM()
    startNotificationScheduler(prisma)
    await app.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' })
    console.log('🚀 HabitKids API running on port 3000')
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
