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

export function usePushNotifications() {
  const [supported, setSupported]     = useState(IS_NATIVE || ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window))
  const [permission, setPermission]   = useState<'default' | 'granted' | 'denied'>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const listenersAdded                = useRef(false)

  useEffect(() => {
    if (IS_NATIVE) {
      initNative()
    } else {
      if (!supported) return
      setPermission(Notification.permission as 'default' | 'granted' | 'denied')
      checkWebSubscription()
    }
  }, [])

  // ── Native (Android APK via FCM) ──────────────────────────────────────────

  const initNative = async () => {
    const { PushNotifications } = await import('@capacitor/push-notifications')
    const result = await PushNotifications.checkPermissions()
    if (result.receive === 'granted') {
      setPermission('granted')
      setIsSubscribed(true)
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

    if (!listenersAdded.current) {
      listenersAdded.current = true

      await PushNotifications.addListener('registration', async ({ value: token }) => {
        try {
          await api.post('/push/fcm-register', { token })
          setIsSubscribed(true)
        } catch {
          setError('Erreur d\'enregistrement FCM')
        }
      })

      await PushNotifications.addListener('registrationError', ({ error: err }) => {
        setError(`Erreur FCM : ${err}`)
      })

      // Handle notification received while app is open
      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push received:', notification)
      })
    }

    await PushNotifications.register()
  }

  const unsubscribeNative = async () => {
    const { PushNotifications } = await import('@capacitor/push-notifications')
    await api.delete('/push/fcm-register', { data: {} })
    await PushNotifications.removeAllListeners()
    listenersAdded.current = false
    setIsSubscribed(false)
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
    try {
      if (IS_NATIVE) await unsubscribeNative()
      else           await unsubscribeWeb()
    } finally {
      setLoading(false)
    }
  }

  const sendTest = async () => {
    await api.post('/push/test')
  }

  return { supported, permission, isSubscribed, loading, error, subscribe, unsubscribe, sendTest }
}
