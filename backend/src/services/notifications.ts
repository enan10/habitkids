import webpush from 'web-push'
import { PrismaClient } from '@prisma/client'

// ── Web Push (VAPID) ─────────────────────────────────────────────────────────

export function initVapid() {
  const pub = process.env.VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY

  if (pub && priv) {
    webpush.setVapidDetails('mailto:admin@habitkids.app', pub, priv)
    console.log('🔑 VAPID keys loaded')
  } else {
    const keys = webpush.generateVAPIDKeys()
    process.env.VAPID_PUBLIC_KEY = keys.publicKey
    process.env.VAPID_PRIVATE_KEY = keys.privateKey
    webpush.setVapidDetails('mailto:admin@habitkids.app', keys.publicKey, keys.privateKey)
    console.warn('⚠️  VAPID keys auto-generated — add to env to persist:')
    console.warn(`VAPID_PUBLIC_KEY=${keys.publicKey}`)
    console.warn(`VAPID_PRIVATE_KEY=${keys.privateKey}`)
  }
}

export function getVapidPublicKey(): string {
  return process.env.VAPID_PUBLIC_KEY!
}

async function sendWebPushToUser(
  prisma: PrismaClient,
  userId: string,
  payload: PushPayload
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
    if (results[i].status === 'rejected') {
      const err = (results[i] as any).reason
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        await prisma.pushSubscription.delete({ where: { endpoint: subscriptions[i].endpoint } }).catch(() => {})
      }
    }
  }
}

// ── Firebase Cloud Messaging (FCM) ───────────────────────────────────────────

let fcmEnabled = false

export function initFCM() {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!sa) {
    console.warn('⚠️  FIREBASE_SERVICE_ACCOUNT not set — FCM disabled (Android push won\'t work)')
    return
  }
  try {
    const admin = require('firebase-admin')
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(JSON.parse(sa)) })
    }
    fcmEnabled = true
    console.log('🔥 Firebase Admin SDK initialized — FCM enabled')
  } catch (e: any) {
    console.error('FCM init error:', e.message)
  }
}

async function sendFcmToUser(
  prisma: PrismaClient,
  userId: string,
  payload: PushPayload
) {
  if (!fcmEnabled) return
  const devices = await prisma.fcmDevice.findMany({ where: { userId } })
  if (devices.length === 0) return

  const admin = require('firebase-admin')

  const results = await Promise.allSettled(
    devices.map(device =>
      admin.messaging().send({
        token: device.token,
        notification: { title: payload.title, body: payload.body },
        android: {
          priority: 'high',
          notification: {
            icon: 'ic_launcher',
            color: '#FF9F43',
            sound: 'default',
            channelId: 'habitkids_reminders',
          },
        },
      })
    )
  )

  for (let i = 0; i < results.length; i++) {
    if (results[i].status === 'rejected') {
      const code = (results[i] as any).reason?.code ?? ''
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        await prisma.fcmDevice.delete({ where: { token: devices[i].token } }).catch(() => {})
      }
    }
  }
}

// ── Unified send ─────────────────────────────────────────────────────────────

interface PushPayload {
  title: string
  body: string
  icon?: string
  tag?: string
}

export async function sendPushToUser(
  prisma: PrismaClient,
  userId: string,
  payload: PushPayload
) {
  await Promise.all([
    sendWebPushToUser(prisma, userId, payload),
    sendFcmToUser(prisma, userId, payload),
  ])
}

// ── Scheduler (runs every minute) ────────────────────────────────────────────

export function startNotificationScheduler(prisma: PrismaClient) {
  setInterval(async () => {
    const now = new Date()
    const hour = now.getUTCHours()
    const minute = now.getUTCMinutes()

    try {
      const schedules = await prisma.notificationSchedule.findMany({
        where: { isEnabled: true, hour, minute },
        include: {
          child: { include: { habits: { where: { isActive: true } } } },
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
        const body =
          remaining === 0
            ? `${child.name} a tout accompli aujourd'hui ! 🏆`
            : doneCount === 0
            ? `${child.name} n'a pas encore commencé. ${total} habitude${total > 1 ? 's' : ''} à faire ! 💪`
            : `${child.name} : encore ${remaining} habitude${remaining > 1 ? 's' : ''} à faire ! ⭐`

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
