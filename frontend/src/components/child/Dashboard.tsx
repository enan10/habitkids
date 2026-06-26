import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import CelebrationModal from './CelebrationModal'
import BadgeEarnedModal from './BadgeEarnedModal'
import { useHabits } from '../../hooks/useHabits'
import { playComplete, playPerfectDay, playUncomplete } from '../../utils/sounds'
import { launchConfetti } from '../../utils/confetti'
import { getChildPhoto } from '../../utils/childPhotos'
import api from '../../api/client'

const HABIT_SECTIONS = [
  { key: 'MORNING',   label: 'Matin',           icon: '🌅', bg: 'bg-amber-50',  text: 'text-amber-700'  },
  { key: 'AFTERNOON', label: 'Après-midi',       icon: '☀️', bg: 'bg-sky-100',   text: 'text-sky-700'    },
  { key: 'EVENING',   label: 'Soir',             icon: '🌙', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  { key: 'ANYTIME',   label: 'Toute la journée', icon: '📌', bg: 'bg-gray-100',  text: 'text-gray-600'   },
]

interface Child {
  id: string
  name: string
  sex?: 'GARCON' | 'FILLE'
  avatarEmoji: string
  avatarColor: string
  photoUrl?: string
  xp: number
  level: number
  streakDays: number
}

interface CelebrationData {
  pointsEarned: number
  newXP: number
  leveledUp: boolean
  newLevel: number
}

interface Badge { code: string; emoji: string; title: string; description: string }

interface Props {
  child: Child
  onChildUpdate: (updated: Partial<Child>) => void
}

export default function Dashboard({ child, onChildUpdate }: Props) {
  const navigate = useNavigate()
  const { habits, loading, completeHabit, uncompleteHabit, isCompleted } = useHabits(child.id)
  const [childData, setChildData] = useState(child)
  const [celebration, setCelebration] = useState<CelebrationData | null>(null)
  const [newBadges, setNewBadges] = useState<Badge[]>([])
  const [todayPoints, setTodayPoints] = useState(0)
  const [badgesKey, setBadgesKey] = useState(0)
  const [rewardsCount, setRewardsCount] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const firstLoad = useRef(true)

  const refreshChildData = useCallback(() => {
    api.get(`/completions/today/${child.id}`).then(res => {
      const total = (res.data as any[]).reduce((sum, c) => sum + c.pointsEarned, 0)
      setTodayPoints(total)
    })
    api.get(`/children/${child.id}`).then(res => {
      const photo = getChildPhoto(child.id)
      const updated = { ...res.data, photoUrl: photo || res.data.photoUrl }
      setChildData(updated)
      onChildUpdate(updated)
    })
    api.get(`/rewards/${child.id}`).then(res => {
      setRewardsCount((res.data as any[]).filter((r: any) => r.isUnlocked).length)
    }).catch(() => {})
  }, [child.id])

  useEffect(() => { refreshChildData() }, [child.id])

  const handleComplete = async (habitId: string) => {
    try {
      const result = await completeHabit(habitId)
      if (result.alreadyCompleted) return
      playComplete()
      setCelebration({ pointsEarned: result.pointsEarned, newXP: result.newXP, leveledUp: result.leveledUp, newLevel: result.newLevel })
      setChildData(prev => ({ ...prev, xp: result.newXP, level: result.newLevel, streakDays: result.newStreak }))
      setTodayPoints(prev => prev + result.pointsEarned)
      if (result.newBadges?.length > 0) { setNewBadges(result.newBadges); setBadgesKey(k => k + 1) }
      if (result.completedAllToday) { playPerfectDay(); if (containerRef.current) launchConfetti(containerRef.current) }
    } catch (err) { console.error(err) }
  }

  const handleUncomplete = async (habitId: string) => {
    playUncomplete()
    await uncompleteHabit(habitId)
    setTodayPoints(prev => {
      const habit = habits.find(h => h.id === habitId)
      return Math.max(0, prev - (habit?.pointValue ?? 0))
    })
  }

  const completedCount = habits.filter(h => isCompleted(h.id)).length

  const motivData = () => {
    if (completedCount === habits.length && habits.length > 0) return { emoji: '🏆', text: 'Journée parfaite !' }
    if (completedCount > habits.length / 2) return { emoji: '⭐', text: 'Tu progresses super bien !' }
    return { emoji: '💪', text: 'Tu fais un super travail !' }
  }

  // Only block render on very first load — re-fetches after completions must not show the spinner
  if (loading && firstLoad.current) {
    return (
      <div className="h-full bg-sky-100 flex items-center justify-center">
        <motion.span className="text-5xl" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>⭐</motion.span>
      </div>
    )
  }
  firstLoad.current = false

  return (
    <div ref={containerRef} className="h-full flex flex-col overflow-hidden">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div className="relative flex-shrink-0 bg-gradient-to-b from-sky-300 via-sky-200 to-sky-100 px-4 pt-3 pb-6 overflow-hidden">

        {/* Decorative clouds */}
        <span className="absolute top-10 left-6 text-3xl opacity-80 pointer-events-none select-none">☁️</span>
        <span className="absolute top-5 left-20 text-xl opacity-50 pointer-events-none select-none">☁️</span>

        {/* Sun */}
        <span className="absolute top-3 right-14 text-4xl pointer-events-none select-none"
          style={{ display: 'inline-block', animation: 'spin 30s linear infinite' }}>
          🌞
        </span>

        {/* Sparkles */}
        <span className="absolute top-20 right-5 text-yellow-300 font-black text-xl pointer-events-none select-none">✦</span>
        <span className="absolute bottom-10 left-3 text-yellow-200 text-sm pointer-events-none select-none">✦</span>

        {/* Top bar */}
        <div className="flex items-center mb-4 relative z-10">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/parent')}
            className="flex items-center gap-2 bg-white/90 px-3 py-2 rounded-2xl shadow-sm font-bold text-gray-700 text-sm">
            <span>👨‍👩‍👧</span> Parent
          </motion.button>
        </div>

        {/* Avatar + greeting */}
        <div className="flex items-center gap-4 relative z-10">
          {/* Avatar circle */}
          <div className="flex-shrink-0">
            {childData.photoUrl
              ? <img src={childData.photoUrl} alt={childData.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-xl" />
              : <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-xl flex items-center justify-center"
                  style={{ fontSize: '3rem' }}>
                  {childData.avatarEmoji}
                </div>
            }
          </div>

          {/* Name + speech bubble */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black text-gray-800 drop-shadow-sm">
              Salut {childData.name} ! 👋
            </h1>
            <div className="mt-2 bg-white/90 rounded-2xl px-3 py-2 shadow-sm inline-flex items-center gap-2 whitespace-nowrap">
              <span className="text-2xl leading-none">{motivData().emoji}</span>
              <p className="text-sm font-bold text-gray-700">{motivData().text}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── MISSIONS LIST (scrollable) ────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-sky-50 px-4 pt-4 pb-2">

        {/* Section header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black text-gray-800">🎯 Mes missions du jour</h2>
          <span className="bg-white text-gray-600 font-bold text-xs px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
            {completedCount} / {habits.length} faites
          </span>
        </div>

        {/* Habit rows grouped by time */}
        {habits.length > 0 ? (
          <div className="space-y-4">
            {HABIT_SECTIONS.map(section => {
              const sectionHabits = habits.filter(h => (h.timeOfDay ?? 'ANYTIME') === section.key)
              if (sectionHabits.length === 0) return null
              const sectionDone = sectionHabits.filter(h => isCompleted(h.id)).length
              return (
                <div key={section.key}>
                  {/* Section header */}
                  <div className={`flex items-center justify-between px-3 py-2 rounded-2xl mb-2 ${section.bg}`}>
                    <span className={`font-black text-sm ${section.text}`}>{section.icon} {section.label}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/70 ${section.text}`}>
                      {sectionDone}/{sectionHabits.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {sectionHabits.map(habit => {
                      const done = isCompleted(habit.id)
                      return (
                        <motion.button
                          key={habit.id}
                          whileTap={{ scale: 0.97 }}
                          onClick={done ? () => handleUncomplete(habit.id) : () => handleComplete(habit.id)}
                          className={`w-full bg-white rounded-2xl px-3 py-2.5 flex items-center gap-3 shadow-sm border-2 transition-all text-left ${
                            done ? 'border-green-200 opacity-65' : 'border-transparent'
                          }`}
                        >
                          <div
                            className="w-16 h-16 rounded-full flex items-center justify-center text-4xl flex-shrink-0 shadow-sm"
                            style={{
                              backgroundColor: (habit.color || '#FF9F43') + '28',
                              border: `2px solid ${habit.color || '#FF9F43'}60`,
                            }}
                          >
                            {habit.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold text-gray-800 text-sm leading-snug ${done ? 'line-through text-gray-400' : ''}`}>
                              {habit.title}
                            </p>
                          </div>
                          <div className="flex items-center gap-0.5 text-yellow-500 font-black text-sm flex-shrink-0">
                            <span>⭐</span>
                            <span>+{habit.pointValue}</span>
                          </div>
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            done ? 'bg-green-500 border-green-500 shadow-md' : 'border-gray-300 bg-white'
                          }`}>
                            {done && (
                              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                                className="text-white text-xs font-black">✓</motion.span>
                            )}
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl shadow-sm">
            <div className="text-5xl mb-3">🌱</div>
            <p className="font-bold text-gray-500">Pas encore d'habitudes !</p>
            <p className="text-sm text-gray-400">Demande à tes parents d'en ajouter</p>
          </div>
        )}

        {/* Perfect day banner */}
        {completedCount === habits.length && habits.length > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-4 bg-gradient-to-r from-kids-teal to-kids-blue rounded-3xl p-5 text-center text-white shadow-xl"
          >
            <div className="text-4xl mb-1">🏆</div>
            <p className="font-black text-xl">JOURNÉE PARFAITE !</p>
            <p className="font-semibold opacity-80 text-sm">Tu as tout accompli aujourd'hui !</p>
          </motion.div>
        )}

        <div className="h-2" />
      </div>

      {/* ── STATS BAR (fixed bottom) ──────────────────────────────── */}
      <div className="flex-shrink-0 bg-purple-100 border-t-2 border-purple-200 px-4 py-3 grid grid-cols-3 divide-x divide-purple-200">
        <div className="flex flex-col items-center gap-0.5 pr-3">
          <span className="text-2xl">🔥</span>
          <p className="text-xl font-black text-gray-800 leading-tight">{childData.streakDays}</p>
          <p className="text-[11px] text-gray-500 font-semibold text-center leading-tight">Série actuelle</p>
        </div>
        <div className="flex flex-col items-center gap-0.5 px-3">
          <span className="text-2xl">⭐</span>
          <p className="text-xl font-black text-gray-800 leading-tight">{todayPoints}</p>
          <p className="text-[11px] text-gray-500 font-semibold text-center leading-tight">Points gagnés</p>
        </div>
        <div className="flex flex-col items-center gap-0.5 pl-3">
          <span className="text-2xl">🏆</span>
          <p className="text-xl font-black text-gray-800 leading-tight">{rewardsCount}</p>
          <p className="text-[11px] text-gray-500 font-semibold text-center leading-tight">Récompenses</p>
        </div>
      </div>

      <CelebrationModal data={celebration} onClose={() => setCelebration(null)} />
      <BadgeEarnedModal badges={newBadges} onClose={() => setNewBadges([])} />

      {/* CSS for sun spin */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
