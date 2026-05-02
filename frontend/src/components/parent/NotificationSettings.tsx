import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../../api/client'
import { usePushNotifications } from '../../hooks/usePushNotifications'

interface Schedule {
  id: string
  hour: number
  minute: number
  label: string
  isEnabled: boolean
}

const PRESETS = [
  { label: '☀️ Matin',       hour: 8,  minute: 0 },
  { label: '🌤️ Après-midi',  hour: 14, minute: 0 },
  { label: '🌙 Soir',        hour: 19, minute: 0 },
]

const pad = (n: number) => String(n).padStart(2, '0')

export default function NotificationSettings({ childId }: { childId: string }) {
  const { supported, permission, isSubscribed, loading, error, subscribe, unsubscribe, sendTest } =
    usePushNotifications()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ hour: 8, minute: 0, label: 'Rappel habitudes' })
  const [saving, setSaving] = useState(false)

  const fetchSchedules = async () => {
    try {
      const res = await api.get(`/push/schedules/${childId}`)
      setSchedules(res.data)
    } catch {}
  }

  useEffect(() => { fetchSchedules() }, [childId])

  const addPreset = async (p: typeof PRESETS[0]) => {
    setSaving(true)
    await api.post('/push/schedules', { hour: p.hour, minute: p.minute, label: p.label, childId })
    await fetchSchedules()
    setSaving(false)
  }

  const addSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await api.post('/push/schedules', { ...form, childId })
    setShowForm(false)
    await fetchSchedules()
    setSaving(false)
  }

  const toggleSchedule = async (s: Schedule) => {
    await api.patch(`/push/schedules/${s.id}`, { isEnabled: !s.isEnabled })
    fetchSchedules()
  }

  const deleteSchedule = async (id: string) => {
    await api.delete(`/push/schedules/${id}`)
    fetchSchedules()
  }

  if (!supported) {
    return (
      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 text-center">
        <p className="font-bold text-amber-700">⚠️ Notifications non supportées sur ce navigateur</p>
        <p className="text-sm text-amber-600 mt-1">Utilisez Chrome ou Firefox pour activer les rappels</p>
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
            <p className="font-black text-gray-800 text-lg">🔔 Notifications push</p>
            <p className={`text-sm font-semibold ${isSubscribed ? 'text-green-600' : 'text-gray-500'}`}>
              {isSubscribed ? '✅ Activées sur cet appareil' : 'Désactivées sur cet appareil'}
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
            {loading ? '⏳' : isSubscribed ? 'Désactiver' : '🔔 Activer'}
          </motion.button>
        </div>

        {permission === 'denied' && (
          <div className="mt-3 bg-red-50 rounded-xl p-3">
            <p className="text-xs text-red-600 font-semibold">
              🚫 Notifications bloquées. Dans Chrome : cliquez sur le 🔒 dans la barre d'adresse → Notifications → Autoriser
            </p>
          </div>
        )}

        {error && (
          <p className="mt-2 text-xs text-red-500 font-semibold">{error}</p>
        )}

        {isSubscribed && (
          <button
            onClick={sendTest}
            className="mt-3 text-xs text-kids-blue font-black underline decoration-dotted"
          >
            📨 Envoyer une notification test
          </button>
        )}
      </div>

      {/* Schedules — only show when subscribed */}
      {isSubscribed && (
        <>
          <div className="flex justify-between items-center">
            <h4 className="font-black text-gray-700">⏰ Rappels planifiés</h4>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowForm(v => !v)}
              className="bg-kids-orange text-white font-bold px-4 py-2 rounded-xl text-sm"
            >
              {showForm ? '✕ Annuler' : '+ Personnalisé'}
            </motion.button>
          </div>

          {/* Quick presets */}
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map(p => (
              <motion.button
                key={p.label}
                whileTap={{ scale: 0.93 }}
                disabled={saving}
                onClick={() => addPreset(p)}
                className="bg-white border-2 border-gray-200 hover:border-kids-orange rounded-2xl p-3 text-center transition-all disabled:opacity-50"
              >
                <div className="text-xl mb-1">{p.label.split(' ')[0]}</div>
                <div className="font-black text-gray-800 text-sm">{pad(p.hour)}h{pad(p.minute)}</div>
                <div className="text-xs text-gray-500 font-semibold">{p.label.split(' ').slice(1).join(' ')}</div>
              </motion.button>
            ))}
          </div>

          {/* Custom form */}
          {showForm && (
            <motion.form
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={addSchedule}
              className="bg-white rounded-2xl p-4 shadow-md border-2 border-kids-orange/30 space-y-3"
            >
              <p className="font-black text-gray-700">Heure personnalisée</p>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <label className="text-xs font-bold text-gray-500 block mb-1">HH</label>
                  <input
                    type="number" min={0} max={23} value={form.hour}
                    onChange={e => setForm(f => ({ ...f, hour: Number(e.target.value) }))}
                    className="w-16 p-2 border-2 border-gray-200 rounded-xl font-black text-xl text-center focus:border-kids-orange focus:outline-none"
                  />
                </div>
                <span className="text-3xl font-black text-gray-400 mt-3">:</span>
                <div className="text-center">
                  <label className="text-xs font-bold text-gray-500 block mb-1">MM</label>
                  <input
                    type="number" min={0} max={59} step={5} value={form.minute}
                    onChange={e => setForm(f => ({ ...f, minute: Number(e.target.value) }))}
                    className="w-16 p-2 border-2 border-gray-200 rounded-xl font-black text-xl text-center focus:border-kids-orange focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-500 block mb-1">Texte</label>
                  <input
                    type="text" value={form.label}
                    onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                    className="w-full p-2 border-2 border-gray-200 rounded-xl font-semibold focus:border-kids-orange focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-kids-teal text-white font-black py-3 rounded-xl disabled:opacity-50"
              >
                {saving ? '⏳' : '✅ Ajouter ce rappel'}
              </button>
            </motion.form>
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
                  {pad(s.hour)}:{pad(s.minute)}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-700 text-sm">{s.label}</p>
                  <p className="text-xs text-gray-400">{s.isEnabled ? 'Actif tous les jours' : 'Désactivé'}</p>
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
                Aucun rappel configuré. Choisissez un créneau ci-dessus.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
