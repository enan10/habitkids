import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import HabitCard from './HabitCard'
import CelebrationModal from './CelebrationModal'
import BadgesSection from './BadgesSection'
import BadgeEarnedModal from './BadgeEarnedModal'
import { useHabits } from '../../hooks/useHabits'
import { playComplete, playPerfectDay, playUncomplete } from '../../utils/sounds'
import { launchConfetti } from '../../utils/confetti'
import { getChildPhoto } from '../../utils/childPhotos'
import api from '../../api/client'

const LEVEL_XP    = [0, 100, 300, 600, 1000, 1500]
const LEVEL_NAMES = ['', 'Petit explorateur', 'Apprenti champion', 'Héros du quotidien', 'Super champion', 'Légende']

interface Child {
  id: string
  name: string
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
  const containerRef = useRef<HTMLDivElement>(null)

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

  // XP bar
  const curXP  = LEVEL_XP[childData.level - 1] ?? 0
  const nextXP = LEVEL_XP[childData.level] ?? LEVEL_XP[LEVEL_XP.length - 1]
  const xpPct  = Math.min(((childData.xp - curXP) / (nextXP - curXP)) * 100, 100)
  const levelName = LEVEL_NAMES[childData.level] ?? 'Légende'

  const motivMessage = () => {
    if (completedCount === habits.length && habits.length > 0) return '🏆 Journée parfaite !'
    if (completedCount > habits.length / 2) return 'Tu progresses super bien ! ⭐'
    return 'Continue comme ça ! 💪'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <motion.span className="text-5xl" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>⭐</motion.span>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-amber-50 pb-10">

      {/* Top bar */}
      <div className="flex justify-between items-center px-4 pt-4 pb-2 max-w-md mx-auto">
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/parent')}
          className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm font-bold text-gray-600 text-sm">
          <span>👨‍👩‍👧</span> Parent
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/parent')}
          className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm font-bold text-gray-600 text-sm">
          <span>⚙️</span> Réglages
        </motion.button>
      </div>

      <div className="px-4 max-w-md mx-auto">

        {/* Hero section */}
        <div className="relative flex items-center gap-4 mb-5 mt-2">
          {/* Photo + level badge */}
          <div className="relative flex-shrink-0">
            {childData.photoUrl
              ? <img src={childData.photoUrl} alt={childData.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg" />
              : <div className="w-20 h-20 rounded-full flex items-center justify-center text-5xl border-4 border-white shadow-lg bg-white">
                  {childData.avatarEmoji}
                </div>
            }
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-kids-orange rounded-full border-2 border-white flex items-center justify-center shadow">
              <span className="text-white text-xs font-black">{childData.level}</span>
            </div>
          </div>

          {/* Greeting */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-gray-800">
              Salut {childData.name} ! 👋
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">{motivMessage()}</p>
          </div>

          {/* Dragon mascot */}
          <div className="text-5xl flex-shrink-0 select-none">🐉</div>
        </div>

        {/* Stats — 3 cards */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
            <span className="text-2xl">🔥</span>
            <p className="text-xl font-black text-orange-500 mt-1">{childData.streakDays}</p>
            <p className="text-xs text-gray-400 font-semibold leading-tight mt-0.5">Série<br/>actuelle</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
            <span className="text-2xl">⭐</span>
            <p className="text-xl font-black text-yellow-500 mt-1">{todayPoints}</p>
            <p className="text-xs text-gray-400 font-semibold leading-tight mt-0.5">points<br/>gagnés</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
            <span className="text-2xl">🏆</span>
            <p className="text-xl font-black text-purple-500 mt-1">{childData.level}</p>
            <p className="text-xs text-gray-400 font-semibold leading-tight mt-0.5">{completedCount}/{habits.length}<br/>faites</p>
          </div>
        </div>

        {/* XP Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex items-center gap-3 mb-3">
            {/* Shield badge */}
            <div className="flex-shrink-0 w-11 h-11 bg-gradient-to-b from-purple-500 to-purple-700 rounded-xl flex flex-col items-center justify-center shadow-md">
              <span className="text-white text-xs font-black leading-none">NIV.</span>
              <span className="text-white text-base font-black leading-none">{childData.level}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="font-black text-gray-800 text-sm truncate">{levelName}</span>
                <span className="text-xs font-bold text-gray-400 ml-2 flex-shrink-0">{childData.xp} XP</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPct}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1 text-right font-semibold">
                {nextXP - childData.xp} XP avant le niveau {childData.level + 1}
              </p>
            </div>
          </div>
        </div>

        {/* Habits section */}
        {habits.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-black text-gray-800 text-base">Mes habitudes</span>
              <span className="text-sm font-bold text-gray-400">{completedCount}/{habits.length} faites</span>
            </div>
            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden mb-4">
              <motion.div
                className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: habits.length > 0 ? `${(completedCount / habits.length) * 100}%` : '0%' }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <AnimatePresence>
                {habits.map((habit, i) => (
                  <motion.div key={habit.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                    <HabitCard
                      habit={habit}
                      completed={isCompleted(habit.id)}
                      onComplete={() => handleComplete(habit.id)}
                      onUncomplete={() => handleUncomplete(habit.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {habits.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl shadow-sm">
            <div className="text-5xl mb-3">🌱</div>
            <p className="font-bold text-gray-500">Pas encore d'habitudes !</p>
            <p className="text-sm text-gray-400">Demande à tes parents d'en ajouter</p>
          </div>
        )}

        {/* Perfect day */}
        {completedCount === habits.length && habits.length > 0 && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="mt-2 bg-gradient-to-r from-kids-teal to-kids-blue rounded-3xl p-6 text-center text-white shadow-xl">
            <div className="text-5xl mb-2">🏆</div>
            <p className="font-black text-2xl">JOURNÉE PARFAITE !</p>
            <p className="font-semibold opacity-80">Tu as tout accompli aujourd'hui !</p>
          </motion.div>
        )}

        <BadgesSection key={badgesKey} childId={child.id} />
      </div>

      <CelebrationModal data={celebration} onClose={() => setCelebration(null)} />
      <BadgeEarnedModal badges={newBadges} onClose={() => setNewBadges([])} />
    </div>
  )
}
