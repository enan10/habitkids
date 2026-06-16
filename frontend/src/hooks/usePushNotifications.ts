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

  const initNative = async () => {
    const { PushNotifications } = await import('@capacitor/push-notifications')
    const result = await PushNotifications.checkPermissions()

    const alreadyGranted = result.receive === 'granted'
    const notOptedOut = localStorage.getItem(FCM_KEY) !== 'false'

    if (alreadyGranted) {
      setPermission('granted')
      if (notOptedOut) setIsSubscribed(true)
    }

    // Set up listeners here so they survive an Android Activity recreation
    if (!listenersAdded.current) {
      listenersAdded.current = true

      await PushNotifications.addListener('registration', async ({ value: token }) => {
        // Ignore if user explicitly unsubscribed
        if (localStorage.getItem(FCM_KEY) === 'false') return
        localStorage.setItem(FCM_TOKEN_KEY, token)
        localStorage.setItem(FCM_KEY, 'true')
        setIsSubscribed(true)
        setPermission('granted')
        // Best-effort server registration — don't block on failure
        api.post('/push/fcm-register', { token }).catch(() => {})
      })

      await PushNotifications.addListener('registrationError', () => {})


      await PushNotifications.addListener('pushNotificationReceived', () => {})
    }

    // Auto-register FCM token on startup if permission already granted
    if (alreadyGranted && notOptedOut) {
      await PushNotifications.register()
    }
  }

  const subscribeNative = async () => {
    const { PushNotifications } = await import('@capacitor/push-notifications')

    // This call may trigger the Android permission dialog which can destroy/recreate
    // the Activity. We optimistically update state before calling requestPermissions.
    const result = await PushNotifications.requestPermissions()
    if (result.receive !== 'granted') {
      setPermission('denied')
      setError('Permission refusée dans les paramètres Android')
      return
    }

    setPermission('granted')
    // Optimistically mark subscribed — the registration listener will confirm with token
    localStorage.setItem(FCM_KEY, 'true')
    setIsSubscribed(true)

    // Trigger FCM token request — handled by the listener set up in initNative
    await PushNotifications.register()
  }

  const unsubscribeNative = async () => {
    const { PushNotifications } = await import('@capacitor/push-notifications')
    const token = localStorage.getItem(FCM_TOKEN_KEY)

    // Update local state immediately — don't wait for server response
    localStorage.setItem(FCM_KEY, 'false')
    localStorage.removeItem(FCM_TOKEN_KEY)
    setIsSubscribed(false)
    await PushNotifications.removeAllListeners()
    listenersAdded.current = false

    // Best-effort server unregistration
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

  const sendTest = async () => {
    try { await api.post('/push/test') } catch {}
  }

  return { supported, permission, isSubscribed, loading, error, subscribe, unsubscribe, sendTest }
}
