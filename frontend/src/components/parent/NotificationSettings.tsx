import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import api from '../../api/client'
import { usePushNotifications } from '../../hooks/usePushNotifications'

interface Schedule {
  id: string
  hour: number
  minute: number
  label: string
  isEnabled: boolean
}

const pad = (n: number) => String(n).padStart(2, '0')

function localToUtc(localH: number, localM: number) {
  const offset = new Date().getTimezoneOffset()
  const utcMins = ((localH * 60 + localM + offset) % 1440 + 1440) % 1440
  return { hour: Math.floor(utcMins / 60), minute: utcMins % 60 }
}

function utcToLocal(utcH: number, utcM: number) {
  const offset = new Date().getTimezoneOffset()
  const localMins = ((utcH * 60 + utcM - offset) % 1440 + 1440) % 1440
  return { hour: Math.floor(localMins / 60), minute: localMins % 60 }
}

export default function NotificationSettings({ childId }: { childId: string }) {
  const { t } = useTranslation()
  const { supported, permission, isSubscribed, loading, error, subscribe, unsubscribe, sendTest, testStatus } =
    usePushNotifications()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ hour: '8', minute: '00', label: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const formRef = useRef<HTMLDivElement>(null)

  const fetchSchedules = async () => {
    try {
      const res = await api.get(`/push/schedules/${childId}`)
      setSchedules(res.data)
    } catch {}
  }

  useEffect(() => { fetchSchedules() }, [childId])
  useEffect(() => { setForm(f => ({ ...f, label: t('notif.default_label') })) }, [t])

  const PRESETS = [
    { tKey: 'notif.preset_morning',   hour: 8,  minute: 0 },
    { tKey: 'notif.preset_afternoon', hour: 14, minute: 0 },
    { tKey: 'notif.preset_evening',   hour: 19, minute: 0 },
  ]

  const addPreset = async (p: typeof PRESETS[0]) => {
    setFormError('')
    setSaving(true)
    try {
      const utc = localToUtc(p.hour, p.minute)
      await api.post('/push/schedules', { hour: utc.hour, minute: utc.minute, label: t(p.tKey), childId })
      await fetchSchedules()
    } catch (err: any) {
      setFormError(err.response?.data?.error || t('notif.err_add'))
    } finally {
      setSaving(false)
    }
  }

  const addSchedule = async () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    setFormError('')
    setSaving(true)
    const hourNum   = Math.max(0, Math.min(23, parseInt(form.hour)   || 0))
    const minuteNum = Math.max(0, Math.min(59, parseInt(form.minute) || 0))
    try {
      const utc = localToUtc(hourNum, minuteNum)
      await api.post('/push/schedules', {
        hour: utc.hour, minute: utc.minute,
        label: form.label || t('notif.default_label'),
        childId,
      })
      setShowForm(false)
      setForm({ hour: '8', minute: '00', label: t('notif.default_label') })
      await fetchSchedules()
    } catch (err: any) {
      setFormError(err.response?.data?.error || t('notif.err_save'))
    } finally {
      setSaving(false)
    }
  }

  const toggleSchedule = async (s: Schedule) => {
    try {
      await api.patch(`/push/schedules/${s.id}`, { isEnabled: !s.isEnabled })
      fetchSchedules()
    } catch {}
  }

  const deleteSchedule = async (id: string) => {
    await api.delete(`/push/schedules/${id}`)
    fetchSchedules()
  }

  if (!supported) {
    return (
      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 text-center">
        <p className="font-bold text-amber-700">{t('notif.not_supported')}</p>
        <p className="text-sm text-amber-600 mt-1">{t('notif.not_supported_sub')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toggle card */}
      <div className={`rounded-2xl p-4 shadow-sm border-2 transition-all ${
        isSubscribed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-black text-gray-800 text-lg">{t('notif.push_title')}</p>
            <p className={`text-sm font-semibold ${isSubscribed ? 'text-green-600' : 'text-gray-500'}`}>
              {isSubscribed ? t('notif.enabled') : t('notif.disabled')}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={isSubscribed ? unsubscribe : subscribe}
            disabled={loading || permission === 'denied'}
            className={`font-black px-5 py-2 rounded-xl text-sm transition-all disabled:opacity-40 ${
              isSubscribed
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'bg-kids-teal text-white shadow-md'
            }`}
          >
            {loading ? '⏳' : isSubscribed ? t('notif.deactivate') : t('notif.activate')}
          </motion.button>
        </div>

        {permission === 'denied' && (
          <div className="mt-3 bg-red-50 rounded-xl p-3">
            <p className="text-xs text-red-600 font-semibold">{t('notif.blocked')}</p>
          </div>
        )}

        {error && <p className="mt-2 text-xs text-red-500 font-semibold">{error}</p>}

        {isSubscribed && (
          <div className="mt-3">
            <button
              onClick={sendTest}
              disabled={testStatus === 'sending'}
              className="text-xs text-kids-blue font-black underline decoration-dotted disabled:opacity-50"
            >
              {testStatus === 'sending' ? t('notif.test_sending')
                : testStatus === 'sent'  ? t('notif.test_sent')
                : testStatus === 'error' ? t('notif.test_error')
                : t('notif.test_btn')}
            </button>
          </div>
        )}
      </div>

      {/* Schedules */}
      {isSubscribed && (
        <>
          <div className="flex justify-between items-center">
            <h4 className="font-black text-gray-700">{t('notif.scheduled_title')}</h4>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowForm(v => !v)}
              className="bg-kids-orange text-white font-bold px-4 py-2 rounded-xl text-sm"
            >
              {showForm ? t('notif.cancel_btn') : t('notif.custom_btn')}
            </motion.button>
          </div>

          {/* Quick presets */}
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map(p => (
              <motion.button
                key={p.tKey}
                whileTap={{ scale: 0.93 }}
                disabled={saving}
                onClick={() => addPreset(p)}
                className="bg-white border-2 border-gray-200 hover:border-kids-orange rounded-2xl p-3 text-center transition-all disabled:opacity-50"
              >
                <div className="text-xl mb-1">{t(p.tKey).split(' ')[0]}</div>
                <div className="font-black text-gray-800 text-sm">{pad(p.hour)}h{pad(p.minute)}</div>
                <div className="text-xs text-gray-500 font-semibold">{t(p.tKey).split(' ').slice(1).join(' ')}</div>
              </motion.button>
            ))}
          </div>

          {formError && !showForm && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-red-500 font-semibold text-sm text-center bg-red-50 rounded-xl p-3">
              ⚠️ {formError}
            </motion.p>
          )}

          {/* Custom form */}
          {showForm && (
            <motion.div
              ref={formRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-4 shadow-md border-2 border-kids-orange/30 space-y-3 pb-8"
            >
              <p className="font-black text-gray-700">{t('notif.custom_time')}</p>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <label className="text-xs font-bold text-gray-500 block mb-1">HH</label>
                  <input
                    type="text" inputMode="numeric" placeholder="8" value={form.hour}
                    onFocus={e => e.target.select()}
                    onChange={e => setForm(f => ({ ...f, hour: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                    className="w-16 p-2 border-2 border-gray-200 rounded-xl font-black text-xl text-center focus:border-kids-orange focus:outline-none"
                  />
                </div>
                <span className="text-3xl font-black text-gray-400 mt-3">:</span>
                <div className="text-center">
                  <label className="text-xs font-bold text-gray-500 block mb-1">MM</label>
                  <input
                    type="text" inputMode="numeric" placeholder="00" value={form.minute}
                    onFocus={e => e.target.select()}
                    onChange={e => setForm(f => ({ ...f, minute: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                    className="w-16 p-2 border-2 border-gray-200 rounded-xl font-black text-xl text-center focus:border-kids-orange focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-500 block mb-1">{t('notif.text_label')}</label>
                  <input
                    type="text" value={form.label}
                    onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                    className="w-full p-2 border-2 border-gray-200 rounded-xl font-semibold focus:border-kids-orange focus:outline-none"
                  />
                </div>
              </div>
              {formError && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-red-500 font-semibold text-sm text-center bg-red-50 rounded-xl p-3">
                  ⚠️ {formError}
                </motion.p>
              )}
              <button
                type="button" onClick={addSchedule} disabled={saving}
                className="w-full bg-kids-teal text-white font-black py-3 rounded-xl disabled:opacity-50"
              >
                {saving ? t('notif.saving') : t('notif.add_btn')}
              </button>
            </motion.div>
          )}

          {/* Schedule list */}
          <div className="space-y-2">
            {schedules.map(s => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`rounded-2xl p-4 shadow-sm flex items-center gap-3 border-2 transition-all ${
                  s.isEnabled ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="text-3xl font-black text-gray-800 tabular-nums w-16">
                  {(() => { const l = utcToLocal(s.hour, s.minute); return `${pad(l.hour)}:${pad(l.minute)}` })()}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-700 text-sm">{s.label}</p>
                  <p className="text-xs text-gray-400">{s.isEnabled ? t('notif.active') : t('notif.inactive')}</p>
                </div>
                <button
                  onClick={() => toggleSchedule(s)}
                  className={`font-bold px-3 py-1 rounded-xl text-xs transition-all ${
                    s.isEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {s.isEnabled ? '✅ ON' : 'OFF'}
                </button>
                <button onClick={() => deleteSchedule(s.id)} className="text-red-400 hover:text-red-600 p-1">
                  🗑️
                </button>
              </motion.div>
            ))}
            {schedules.length === 0 && (
              <p className="text-center text-gray-400 text-sm font-semibold py-6">
                {t('notif.none')}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
