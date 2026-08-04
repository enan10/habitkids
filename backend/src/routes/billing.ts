import { FastifyInstance } from 'fastify'
import { z } from 'zod'

export default async function billingRoutes(app: FastifyInstance) {

  // Webhook RevenueCat → met à jour le plan de l'utilisateur
  app.post('/webhook', async (request: any, reply) => {
    // Vérifier le secret RevenueCat
    const secret = process.env.REVENUECAT_WEBHOOK_SECRET
    if (secret) {
      const auth = request.headers['authorization']
      if (auth !== secret) return reply.code(401).send({ error: 'Unauthorized' })
    }

    const body = request.body as any
    const event = body?.event
    if (!event) return { received: true }

    const appUserId: string = event.app_user_id
    if (!appUserId) return { received: true }

    const type: string = event.type

    try {
      if (['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'NON_RENEWING_PURCHASE'].includes(type)) {
        await app.prisma.user.update({
          where: { id: appUserId },
          data: { plan: 'PREMIUM' },
        })
        app.log.info(`User ${appUserId} upgraded to PREMIUM via ${type}`)
      }

      if (['CANCELLATION', 'EXPIRATION', 'REFUND'].includes(type)) {
        await app.prisma.user.update({
          where: { id: appUserId },
          data: { plan: 'FREE' },
        })
        app.log.info(`User ${appUserId} downgraded to FREE via ${type}`)
      }
    } catch (err) {
      app.log.error(`Billing webhook error for user ${appUserId}: ${err}`)
    }

    return { received: true }
  })
}
