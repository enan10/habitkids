import { useState } from 'react'
import { motion } from 'framer-motion'
import api from '../../api/client'

const EMOJI_PRESETS = ['🦷', '📚', '🛏️', '🥗', '🏃', '🎨', '🧹', '😴', '💧', '📖', '🎵', '🧼', '🌿', '🎯']
const COLORS = ['#FF6B6B', '#FF9F43', '#FECA57', '#1DD1A1', '#54A0FF', '#5F27CD', '#FF9FF3', '#48DBFB']

export const CATEGORIES = [
  { id: 'GENERAL',      label: 'Général',      emoji: '📌' },
  { id: 'HYGIENE',      label: 'Hygiène',      emoji: '🧼' },
  { id: 'EDUCATION',    label: 'Éducation',    emoji: '📚' },
  { id: 'SPORT',        label: 'Sport',        emoji: '🏃' },
  { id: 'ALIMENTATION', label: 'Alimentation', emoji: '🥗' },
  { id: 'SOMMEIL',      label: 'Sommeil',      emoji: '😴' },
  { id: 'CREATIVITE',   label: 'Créativité',   emoji: '🎨' },
  { id: 'MENAGE',       label: 'Ménage',       emoji: '🧹' },
  { id: 'AUTONOMIE',    label: 'Autonomie',    emoji: '🦋' },
  { id: 'NATURE',       label: 'Nature',       emoji: '🌿' },
  { id: 'SOCIAL',       label: 'Social',       emoji: '👫' },
  { id: 'SECURITE',     label: 'Sécurité',     emoji: '🛡️' },
]

const DAYS = [
  { label: 'Lu', full: 'Lundi',    day: 1 },
  { label: 'Ma', full: 'Mardi',    day: 2 },
  { label: 'Me', full: 'Mercredi', day: 3 },
  { label: 'Je', full: 'Jeudi',    day: 4 },
  { label: 'Ve', full: 'Vendredi', day: 5 },
  { label: 'Sa', full: 'Samedi',   day: 6 },
  { label: 'Di', full: 'Dimanche', day: 0 },
]

const QUICK_SELECT = [
  { label: 'Tous les jours', days: [1, 2, 3, 4, 5, 6, 0] },
  { label: 'Lun – Ven',      days: [1, 2, 3, 4, 5] },
  { label: 'Week-end',       days: [6, 0] },
]

interface Props {
  childId: string
  onSave: () => void
  onCancel: () => void
  defaultDays?: number[]
}

export default function HabitForm({ childId, onSave, onCancel, defaultDays }: Props) {
  const [form, setForm] = useState({
    title: '', emoji: '⭐', color: '#FF9F43', category: 'GENERAL',
    timeOfDay: 'ANYTIME', pointValue: 10,
    daysOfWeek: defaultDays ?? [] as number[],
  })
  const [loading, setLoading] = useState(false)

  const toggleDay = (day: number) => {
    setForm(f => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(day)
        ? f.daysOfWeek.filter(d => d !== day)
        : [...f.daysOfWeek, day],
    }))
  }

  const frequency = form.daysOfWeek.length === 7 ? 'DAILY' : 'WEEKLY'

  const dayLabel = () => {
    const n = form.daysOfWeek.length
    if (n === 0) return 'Aucun jour sélectionné'
    if (n === 7) return 'Tous les jours'
    const names = ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa']
    return form.daysOfWeek
      .slice()
      .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
      .map(d => names[d])
      .join(' · ')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.daysOfWeek.length === 0) return alert('Sélectionnez au moins un jour')
    setLoading(true)
    try {
      await api.post('/habits', { ...form, frequency, childId })
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
          <label className="text-sm font-bold text-gray-600 mb-2 block">🏷️ Catégorie</label>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button key={cat.id} type="button" onClick={() => setForm(f => ({ ...f, category: cat.id }))}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold border-2 transition-all ${
                  form.category === cat.id
                    ? 'border-kids-blue bg-blue-50 text-kids-blue'
                    : 'border-gray-200 text-gray-500'
                }`}>
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
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

        {/* Day picker */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-gray-600">📅 Jours</label>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              form.daysOfWeek.length === 0
                ? 'bg-red-50 text-red-400'
                : 'bg-blue-50 text-kids-blue'
            }`}>
              {dayLabel()}
            </span>
          </div>

          {/* Quick select shortcuts */}
          <div className="flex gap-2 mb-2">
            {QUICK_SELECT.map(q => {
              const active = q.days.length === form.daysOfWeek.length &&
                q.days.every(d => form.daysOfWeek.includes(d))
              return (
                <button key={q.label} type="button"
                  onClick={() => setForm(f => ({ ...f, daysOfWeek: q.days }))}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-black border-2 transition-all ${
                    active ? 'bg-kids-orange text-white border-kids-orange' : 'bg-white text-gray-500 border-gray-200'
                  }`}>
                  {q.label}
                </button>
              )
            })}
          </div>

          {/* Individual day buttons */}
          <div className="flex gap-1">
            {DAYS.map(({ label, day }) => (
              <button
                key={day} type="button" onClick={() => toggleDay(day)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all border-2 ${
                  form.daysOfWeek.includes(day)
                    ? 'bg-kids-blue text-white border-kids-blue shadow'
                    : 'bg-white text-gray-400 border-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-gray-600 mb-1 block">⭐ Points</label>
          <select value={form.pointValue} onChange={e => setForm(f => ({ ...f, pointValue: Number(e.target.value) }))}
            className="w-full p-3 border-2 border-gray-200 rounded-xl font-semibold focus:outline-none">
            {[5, 10, 15, 20, 30, 50].map(v => <option key={v} value={v}>{v} pts</option>)}
          </select>
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
