import { useState, useEffect } from 'react'
import api from '../api/client'

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(b64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export function usePushNotifications() {
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const ok = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    setSupported(ok)
    if (ok) {
      setPermission(Notification.permission)
      checkSubscription()
    }
  }, [])

  const checkSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      if (!reg) return
      const sub = await reg.pushManager.getSubscription()
      setIsSubscribed(!!sub)
    } catch {}
  }

  const subscribe = async () => {
    setLoading(true)
    setError('')
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      await navigator.serviceWorker.ready

      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') {
        setError('Permission refusée. Activez les notifications dans les paramètres du navigateur.')
        return
      }

      const { data } = await api.get('/push/vapid-public-key')
      const appServerKey = urlBase64ToUint8Array(data.publicKey)

      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appServerKey as unknown as ArrayBuffer })
      const subJson = sub.toJSON() as PushSubscriptionJSON & { keys: { p256dh: string; auth: string } }

      await api.post('/push/subscribe', {
        endpoint: sub.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
      })
      setIsSubscribed(true)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'activation')
    } finally {
      setLoading(false)
    }
  }

  const unsubscribe = async () => {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      if (reg) {
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await api.delete('/push/subscribe', { data: { endpoint: sub.endpoint } })
          await sub.unsubscribe()
        }
      }
      setIsSubscribed(false)
    } finally {
      setLoading(false)
    }
  }

  const sendTest = async () => {
    await api.post('/push/test')
  }

  return { supported, permission, isSubscribed, loading, error, subscribe, unsubscribe, sendTest }
}
