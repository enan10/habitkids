import { useState } from 'react'
import { motion } from 'framer-motion'
import api from '../../api/client'


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

const WEEKLY_PRESETS: { label: string; icon: string; days: number[] | null }[] = [
  { label: 'Jours scolaires', icon: '📚', days: [1, 2, 3, 4, 5] },
  { label: 'Week-end',        icon: '🎉', days: [6, 0]           },
  { label: 'Personnalisé',    icon: '✏️', days: null              },
]

const INTERVAL_OPTIONS = [2, 3, 4, 5, 7, 10, 14, 21, 30]

const FREQ_TYPES = [
  { value: 'DAILY',    icon: '🔄', label: 'Tous les jours'    },
  { value: 'WEEKLY',   icon: '📆', label: 'Certains jours'    },
  { value: 'INTERVAL', icon: '🔁', label: 'Tous les X jours'  },
  { value: 'MONTHLY',  icon: '🗓️', label: 'Une fois par mois' },
] as const

export interface HabitDefaults {
  title?: string
  emoji?: string
  color?: string
  category?: string
  pointValue?: number
  daysOfWeek?: number[]
  frequency?: 'DAILY' | 'WEEKLY' | 'INTERVAL' | 'MONTHLY'
}

interface Props {
  childId: string
  onSave: () => void
  onCancel: () => void
  defaultDays?: number[]
  defaultValues?: HabitDefaults
}

export default function HabitForm({ childId, onSave, onCancel, defaultDays, defaultValues }: Props) {
  const initDays = defaultValues?.daysOfWeek ?? defaultDays ?? []
  const initFreq: 'DAILY' | 'WEEKLY' | 'INTERVAL' | 'MONTHLY' =
    defaultValues?.frequency ?? (initDays.length === 7 ? 'DAILY' : 'WEEKLY')

  const [form, setForm] = useState({
    title:      defaultValues?.title    ?? '',
    emoji:      defaultValues?.emoji    ?? '⭐',
    color:      defaultValues?.color    ?? '#FF9F43',
    category:   defaultValues?.category ?? 'GENERAL',
    timeOfDay:  'ANYTIME',
    pointValue: defaultValues?.pointValue ?? 10,
    frequency:  initFreq,
    daysOfWeek: initFreq === 'DAILY' ? [0,1,2,3,4,5,6] : initDays,
    intervalDays: 2,
    dayOfMonth: 1,
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

  const dayLabel = (): string => {
    if (form.frequency === 'DAILY') return 'Tous les jours'
    if (form.frequency === 'INTERVAL') return `Tous les ${form.intervalDays} jours`
    if (form.frequency === 'MONTHLY') return `Le ${form.dayOfMonth} de chaque mois`
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
    if (form.frequency === 'WEEKLY' && form.daysOfWeek.length === 0)
      return alert('Sélectionnez au moins un jour')
    setLoading(true)
    try {
      const data: any = {
        title: form.title,
        emoji: form.emoji,
        color: form.color,
        category: form.category,
        timeOfDay: form.timeOfDay,
        pointValue: form.pointValue,
        frequency: form.frequency,
        daysOfWeek: form.frequency === 'WEEKLY' ? form.daysOfWeek : [0, 1, 2, 3, 4, 5, 6],
        childId,
      }
      if (form.frequency === 'INTERVAL') data.intervalDays = form.intervalDays
      if (form.frequency === 'MONTHLY') data.dayOfMonth = form.dayOfMonth
      await api.post('/habits', data)
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
      <h3 className="font-black text-gray-800 text-lg mb-4">
        {defaultValues?.title ? `✏️ Personnaliser — ${defaultValues.title}` : '✨ Nouvelle habitude'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Nom */}
        <div>
          <label className="text-sm font-bold text-gray-600 mb-1 block">Nom</label>
          <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Ex: Se brosser les dents"
            className="w-full p-3 border-2 border-gray-200 rounded-xl font-semibold focus:border-kids-orange focus:outline-none"
            required />
        </div>

        {/* Catégorie — liste scrollable */}
        <div>
          <label className="text-sm font-bold text-gray-600 mb-2 block">🏷️ Catégorie</label>
          <div className="divide-y divide-gray-100 border-2 border-gray-200 rounded-2xl overflow-hidden">
            {CATEGORIES.map(cat => (
              <button key={cat.id} type="button" onClick={() => setForm(f => ({ ...f, category: cat.id }))}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold transition-all ${
                  form.category === cat.id
                    ? 'bg-blue-50 text-kids-blue'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}>
                <span className="text-base">{cat.emoji}</span>
                <span>{cat.label}</span>
                {form.category === cat.id && <span className="ml-auto text-kids-blue">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Fréquence */}
        <div>
          <label className="text-sm font-bold text-gray-600 mb-3 block">📅 Fréquence</label>

          {/* Type selector 2×2 */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {FREQ_TYPES.map(opt => (
              <button key={opt.value} type="button"
                onClick={() => setForm(f => ({ ...f, frequency: opt.value }))}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                  form.frequency === opt.value
                    ? 'bg-kids-orange text-white border-kids-orange shadow-sm'
                    : 'bg-white text-gray-500 border-gray-200'
                }`}>
                <span className="text-base">{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>

          {/* DAILY */}
          {form.frequency === 'DAILY' && (
            <div className="bg-green-50 rounded-2xl p-3 text-center border-2 border-green-100">
              <p className="text-sm font-bold text-green-700">✅ Habitude active tous les jours</p>
              <p className="text-xs text-green-500 mt-0.5">Lu · Ma · Me · Je · Ve · Sa · Di</p>
            </div>
          )}

          {/* WEEKLY */}
          {form.frequency === 'WEEKLY' && (
            <div>
              {/* Quick presets */}
              <div className="flex gap-2 mb-3">
                {WEEKLY_PRESETS.map(preset => {
                  const matched = preset.days !== null
                    && preset.days.length === form.daysOfWeek.length
                    && preset.days.every(d => form.daysOfWeek.includes(d))
                  const customActive = preset.days === null
                    && !WEEKLY_PRESETS.filter(p => p.days !== null).some(p =>
                        p.days!.length === form.daysOfWeek.length && p.days!.every(d => form.daysOfWeek.includes(d))
                      )
                  return (
                    <button key={preset.label} type="button"
                      onClick={() => setForm(f => ({ ...f, daysOfWeek: preset.days ?? [] }))}
                      className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                        matched || customActive
                          ? 'bg-kids-orange text-white border-kids-orange'
                          : 'bg-white text-gray-500 border-gray-200'
                      }`}>
                      {preset.icon} {preset.label}
                    </button>
                  )
                })}
              </div>

              {/* Day calendar */}
              <p className="text-xs text-gray-400 font-semibold mb-2">Jours actifs :</p>
              <div className="flex gap-1.5">
                {DAYS.map(({ label, full, day }) => {
                  const selected = form.daysOfWeek.includes(day)
                  return (
                    <button key={day} type="button" onClick={() => toggleDay(day)} title={full}
                      className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all ${
                        selected ? 'bg-kids-orange border-kids-orange text-white shadow-sm' : 'bg-white border-gray-200 text-gray-400'
                      }`}>
                      <span className="text-[11px] font-black leading-none">{label}</span>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        selected ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-300'
                      }`}>
                        {selected ? '✓' : '·'}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="mt-2 flex justify-center">
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                  form.daysOfWeek.length === 0 ? 'bg-red-50 text-red-400' : 'bg-orange-50 text-kids-orange'
                }`}>
                  {form.daysOfWeek.length === 0 ? '⚠️ Aucun jour sélectionné' : `📅 ${dayLabel()}`}
                </span>
              </div>
            </div>
          )}

          {/* INTERVAL */}
          {form.frequency === 'INTERVAL' && (
            <div>
              <p className="text-xs text-gray-500 font-semibold mb-2">Répéter tous les :</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {INTERVAL_OPTIONS.map(n => (
                  <button key={n} type="button"
                    onClick={() => setForm(f => ({ ...f, intervalDays: n }))}
                    className={`px-3 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                      form.intervalDays === n
                        ? 'bg-kids-orange text-white border-kids-orange shadow-sm'
                        : 'bg-white text-gray-500 border-gray-200'
                    }`}>
                    {n} jours
                  </button>
                ))}
              </div>
              <div className="bg-orange-50 rounded-2xl p-3 text-center border-2 border-orange-100">
                <p className="text-sm font-bold text-kids-orange">🔁 {dayLabel()}</p>
                <p className="text-xs text-gray-400 mt-0.5">À partir d'aujourd'hui</p>
              </div>
            </div>
          )}

          {/* MONTHLY */}
          {form.frequency === 'MONTHLY' && (
            <div>
              <p className="text-xs text-gray-500 font-semibold mb-2">Le __ de chaque mois :</p>
              <div className="grid grid-cols-7 gap-1 mb-3">
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <button key={d} type="button"
                    onClick={() => setForm(f => ({ ...f, dayOfMonth: d }))}
                    className={`h-9 rounded-xl text-xs font-bold border-2 transition-all ${
                      form.dayOfMonth === d
                        ? 'bg-kids-orange text-white border-kids-orange shadow-sm'
                        : 'bg-white text-gray-500 border-gray-200'
                    }`}>
                    {d}
                  </button>
                ))}
              </div>
              <div className="bg-orange-50 rounded-2xl p-3 text-center border-2 border-orange-100">
                <p className="text-sm font-bold text-kids-orange">🗓️ {dayLabel()}</p>
              </div>
            </div>
          )}
        </div>

        {/* Points */}
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
