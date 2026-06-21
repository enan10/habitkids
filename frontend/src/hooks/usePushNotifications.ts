import { useState, useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import api from '../api/client'

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(b64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

const IS_NATIVE = Capacitor.isNativePlatform()
const NOTIFICATIONS_DISABLED = import.meta.env.VITE_DISABLE_NOTIFICATIONS === 'true'
const FCM_KEY = 'habitkids-fcm-subscribed'
const FCM_TOKEN_KEY = 'habitkids-fcm-token'

export function usePushNotifications() {
  const [supported, setSupported]       = useState(!NOTIFICATIONS_DISABLED && (IS_NATIVE || ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window)))
  const [permission, setPermission]     = useState<'default' | 'granted' | 'denied'>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const listenersAdded                  = useRef(false)

  useEffect(() => {
    if (NOTIFICATIONS_DISABLED) return
    if (IS_NATIVE) initNative()
    else {
      if (!supported) return
      setPermission(Notification.permission as 'default' | 'granted' | 'denied')
      checkWebSubscription()
    }
  }, [])

  // ── Native (Android APK via FCM) ──────────────────────────────────────────

  // Extracted so it can be called from both initNative and subscribeNative.
  // unsubscribeNative calls removeAllListeners() which wipes these — they must
  // be re-added before any subsequent register() call or the token is lost.
  const addNativeListeners = async (PushNotifications: any) => {
    listenersAdded.current = true

    await PushNotifications.addListener('registration', async ({ value: token }: { value: string }) => {
      if (localStorage.getItem(FCM_KEY) === 'false') return
      localStorage.setItem(FCM_TOKEN_KEY, token)
      localStorage.setItem(FCM_KEY, 'true')
      setIsSubscribed(true)
      setPermission('granted')
      api.post('/push/fcm-register', { token }).catch(() => {})
    })

    await PushNotifications.addListener('registrationError', (err: any) => {
      console.error('FCM registration error:', JSON.stringify(err))
      setError('Échec enregistrement FCM: ' + (err?.error ?? 'inconnu'))
    })

    await PushNotifications.addListener('pushNotificationReceived', async (notification: any) => {
      // App is in foreground — show via LocalNotifications so it appears in the shade
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications')
        await LocalNotifications.requestPermissions()
        await LocalNotifications.schedule({
          notifications: [{
            id: Date.now(),
            title: notification.title ?? 'HabitKids',
            body: notification.body ?? '',
            channelId: 'habitkids_reminders',
          }],
        })
      } catch {}
    })
  }

  const initNative = async () => {
    const { PushNotifications } = await import('@capacitor/push-notifications')

    try {
      await PushNotifications.createChannel({
        id: 'habitkids_reminders',
        name: 'Rappels HabitKids',
        description: 'Rappels pour les habitudes quotidiennes',
        importance: 5,
        visibility: 1,
        vibration: true,
      })
    } catch {}

    const result = await PushNotifications.checkPermissions()
    const alreadyGranted = result.receive === 'granted'
    const notOptedOut = localStorage.getItem(FCM_KEY) !== 'false'

    if (alreadyGranted) {
      setPermission('granted')
      if (notOptedOut) setIsSubscribed(true)
    }

    if (!listenersAdded.current) {
      await addNativeListeners(PushNotifications)
    }

    if (alreadyGranted && notOptedOut) {
      await PushNotifications.register()
    }
  }

  const subscribeNative = async () => {
    const { PushNotifications } = await import('@capacitor/push-notifications')

    const result = await PushNotifications.requestPermissions()
    if (result.receive !== 'granted') {
      setPermission('denied')
      setError('Permission refusée dans les paramètres Android')
      return
    }

    setPermission('granted')

    // Re-add listeners if unsubscribeNative removed them via removeAllListeners()
    if (!listenersAdded.current) {
      await addNativeListeners(PushNotifications)
    }

    localStorage.setItem(FCM_KEY, 'true')
    setIsSubscribed(true)
    await PushNotifications.register()
  }

  const unsubscribeNative = async () => {
    const { PushNotifications } = await import('@capacitor/push-notifications')
    const token = localStorage.getItem(FCM_TOKEN_KEY)

    localStorage.setItem(FCM_KEY, 'false')
    localStorage.removeItem(FCM_TOKEN_KEY)
    setIsSubscribed(false)
    await PushNotifications.removeAllListeners()
    listenersAdded.current = false

    api.delete('/push/fcm-register', { data: token ? { token } : {} }).catch(() => {})
  }

  // ── Web Push (VAPID — navigateur) ─────────────────────────────────────────

  const checkWebSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      if (!reg) return
      const sub = await reg.pushManager.getSubscription()
      setIsSubscribed(!!sub)
    } catch {}
  }

  const subscribeWeb = async () => {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    await navigator.serviceWorker.ready
    const perm = await Notification.requestPermission()
    setPermission(perm as 'default' | 'granted' | 'denied')
    if (perm !== 'granted') {
      setError('Permission refusée. Activez les notifications dans les paramètres du navigateur.')
      return
    }
    const { data } = await api.get('/push/vapid-public-key')
    const appServerKey = urlBase64ToUint8Array(data.publicKey)
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appServerKey as unknown as ArrayBuffer })
    const subJson = sub.toJSON() as PushSubscriptionJSON & { keys: { p256dh: string; auth: string } }
    await api.post('/push/subscribe', { endpoint: sub.endpoint, p256dh: subJson.keys.p256dh, auth: subJson.keys.auth })
    setIsSubscribed(true)
  }

  const unsubscribeWeb = async () => {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js')
    if (reg) {
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await api.delete('/push/subscribe', { data: { endpoint: sub.endpoint } })
        await sub.unsubscribe()
      }
    }
    setIsSubscribed(false)
  }

  // ── Unified API ───────────────────────────────────────────────────────────

  const subscribe = async () => {
    setLoading(true)
    setError('')
    try {
      if (IS_NATIVE) await subscribeNative()
      else           await subscribeWeb()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'activation')
    } finally {
      setLoading(false)
    }
  }

  const unsubscribe = async () => {
    setLoading(true)
    setError('')
    try {
      if (IS_NATIVE) await unsubscribeNative()
      else           await unsubscribeWeb()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la désactivation')
    } finally {
      setLoading(false)
    }
  }

  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const sendTest = async () => {
    setTestStatus('sending')
    setError('')
    try {
      if (IS_NATIVE) {
        const { PushNotifications } = await import('@capacitor/push-notifications')
        // Re-add listeners if removed, and ensure FCM_KEY is true so registration saves the token
        if (!listenersAdded.current) {
          await addNativeListeners(PushNotifications)
        }
        localStorage.setItem(FCM_KEY, 'true')
        await PushNotifications.register()
        await new Promise(r => setTimeout(r, 2500))
      }
      const res = await api.post('/push/test')
      const dbg = res.data?.debug
      if (dbg) {
        const info = `FCM:${dbg.fcmEnabled ? '✅' : '❌'} Appareils:${dbg.fcmDevices} WebPush:${dbg.webSubs}`
        if (!dbg.fcmEnabled || (dbg.fcmDevices === 0 && dbg.webSubs === 0)) {
          setError('⚠️ ' + info + ' — aucun appareil enregistré')
          setTestStatus('error')
        } else {
          setTestStatus('sent')
          setError('ℹ️ ' + info)
        }
      } else {
        setTestStatus('sent')
      }
      setTimeout(() => { setTestStatus('idle'); setError('') }, 6000)
    } catch (err: any) {
      setTestStatus('error')
      setError('Erreur: ' + (err?.response?.data?.error ?? err?.message ?? 'inconnu'))
      setTimeout(() => setTestStatus('idle'), 4000)
    }
  }

  return { supported, permission, isSubscribed, loading, error, subscribe, unsubscribe, sendTest, testStatus }
}
