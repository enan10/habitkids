import webpush from 'web-push'
import { PrismaClient } from '@prisma/client'

export function initVapid() {
  const pub = process.env.VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY

  if (pub && priv) {
    webpush.setVapidDetails('mailto:admin@habitkids.app', pub, priv)
    console.log('🔑 VAPID keys loaded from env')
  } else {
    const keys = webpush.generateVAPIDKeys()
    process.env.VAPID_PUBLIC_KEY = keys.publicKey
    process.env.VAPID_PRIVATE_KEY = keys.privateKey
    webpush.setVapidDetails('mailto:admin@habitkids.app', keys.publicKey, keys.privateKey)
    console.warn('⚠️  VAPID keys auto-generated (add to env to persist across restarts):')
    console.warn(`VAPID_PUBLIC_KEY=${keys.publicKey}`)
    console.warn(`VAPID_PRIVATE_KEY=${keys.privateKey}`)
  }
}

export function getVapidPublicKey(): string {
  return process.env.VAPID_PUBLIC_KEY!
}

export async function sendPushToUser(
  prisma: PrismaClient,
  userId: string,
  payload: { title: string; body: string; icon?: string; tag?: string }
) {
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } })
  if (subscriptions.length === 0) return

  const results = await Promise.allSettled(
    subscriptions.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    )
  )

  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    if (r.status === 'rejected') {
      const err = r.reason as any
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        await prisma.pushSubscription.delete({ where: { endpoint: subscriptions[i].endpoint } }).catch(() => {})
      }
    }
  }
}

export function startNotificationScheduler(prisma: PrismaClient) {
  setInterval(async () => {
    const now = new Date()
    const hour = now.getHours()
    const minute = now.getMinutes()

    try {
      const schedules = await prisma.notificationSchedule.findMany({
        where: { isEnabled: true, hour, minute },
        include: {
          child: {
            include: { habits: { where: { isActive: true } } },
          },
        },
      })

      for (const schedule of schedules) {
        const child = schedule.child
        const today = now.toISOString().split('T')[0]

        const doneCount = await prisma.habitCompletion.count({
          where: { childId: child.id, date: today },
        })
        const total = child.habits.length
        if (total === 0) continue

        const remaining = total - doneCount
        let body: string
        if (remaining === 0) {
          body = `${child.name} a tout accompli aujourd'hui ! 🏆`
        } else if (doneCount === 0) {
          body = `${child.name} n'a pas encore commencé. ${total} habitude${total > 1 ? 's' : ''} à faire ! 💪`
        } else {
          body = `${child.name} : encore ${remaining} habitude${remaining > 1 ? 's' : ''} à faire ! ⭐`
        }

        await sendPushToUser(prisma, child.userId, {
          title: `HabitKids — ${schedule.label}`,
          body,
          icon: '/icon-192.png',
          tag: `reminder-${child.id}`,
        })
      }
    } catch (err) {
      console.error('Notification scheduler error:', err)
    }
  }, 60_000)

  console.log('🔔 Notification scheduler started (checks every minute)')
}
