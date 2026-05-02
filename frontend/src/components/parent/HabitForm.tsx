import { useState } from 'react'
import { motion } from 'framer-motion'
import api from '../../api/client'

const EMOJI_PRESETS = ['🦷', '📚', '🛏️', '🥗', '🏃', '🎨', '🧹', '😴', '💧', '📖', '🎵', '🧼', '🌿', '🎯']
const COLORS        = ['#FF6B6B', '#FF9F43', '#FECA57', '#1DD1A1', '#54A0FF', '#5F27CD', '#FF9FF3', '#48DBFB']

interface Props {
  childId: string
  onSave: () => void
  onCancel: () => void
}

export default function HabitForm({ childId, onSave, onCancel }: Props) {
  const [form, setForm] = useState({
    title: '', emoji: '⭐', color: '#FF9F43',
    frequency: 'DAILY', timeOfDay: 'ANYTIME', pointValue: 10,
    daysOfWeek: [1, 2, 3, 4, 5, 6, 0] as number[],
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/habits', { ...form, childId })
      onSave()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl p-5 shadow-xl mt-4 border-2 border-kids-teal/30"
    >
      <h3 className="font-black text-gray-800 text-lg mb-4">✨ Nouvelle habitude</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-bold text-gray-600 mb-2 block">Emoji</label>
          <div className="flex gap-2 flex-wrap">
            {EMOJI_PRESETS.map(e => (
              <button key={e} type="button" onClick={() => setForm(f => ({ ...f, emoji: e }))}
                className={`text-2xl p-2 rounded-xl border-2 transition-all ${form.emoji === e ? 'border-kids-orange bg-orange-50' : 'border-gray-200'}`}>
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-gray-600 mb-1 block">Nom</label>
          <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Ex: Se brosser les dents"
            className="w-full p-3 border-2 border-gray-200 rounded-xl font-semibold focus:border-kids-orange focus:outline-none"
            required />
        </div>

        <div>
          <label className="text-sm font-bold text-gray-600 mb-2 block">Couleur</label>
          <div className="flex gap-2">
            {COLORS.map(c => (
              <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                className={`w-8 h-8 rounded-full border-4 transition-transform ${form.color === c ? 'scale-125 border-gray-500' : 'border-transparent'}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>

        {form.frequency === 'WEEKLY' && (
          <div>
            <label className="text-sm font-bold text-gray-600 mb-2 block">📅 Jours de la semaine</label>
            <div className="flex gap-1">
              {[
                { label: 'L', day: 1 }, { label: 'M', day: 2 }, { label: 'M', day: 3 },
                { label: 'J', day: 4 }, { label: 'V', day: 5 }, { label: 'S', day: 6 },
                { label: 'D', day: 0 },
              ].map(({ label, day }) => {
                const active = form.daysOfWeek.includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() =>
                      setForm(f => ({
                        ...f,
                        daysOfWeek: active
                          ? f.daysOfWeek.filter(d => d !== day)
                          : [...f.daysOfWeek, day],
                      }))
                    }
                    className={`flex-1 py-2 rounded-xl text-xs font-black transition-all border-2 ${
                      active
                        ? 'bg-kids-blue text-white border-kids-blue shadow'
                        : 'bg-white text-gray-400 border-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-bold text-gray-600 mb-1 block">⭐ Points</label>
            <select value={form.pointValue} onChange={e => setForm(f => ({ ...f, pointValue: Number(e.target.value) }))}
              className="w-full p-3 border-2 border-gray-200 rounded-xl font-semibold focus:outline-none">
              {[5, 10, 15, 20, 30, 50].map(v => <option key={v} value={v}>{v} pts</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-600 mb-1 block">🔁 Fréquence</label>
            <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
              className="w-full p-3 border-2 border-gray-200 rounded-xl font-semibold focus:outline-none">
              <option value="DAILY">Quotidien</option>
              <option value="WEEKLY">Hebdomadaire</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.95 }}
            className="flex-1 bg-kids-teal text-white font-black py-3 rounded-2xl text-lg shadow-md disabled:opacity-60">
            {loading ? '⏳' : '✅ Créer'}
          </motion.button>
          <button type="button" onClick={onCancel}
            className="px-5 bg-gray-100 text-gray-600 font-bold rounded-2xl text-lg">
            ✕
          </button>
        </div>
      </form>
    </motion.div>
  )
}
