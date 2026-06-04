import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import HabitCard from './HabitCard'
import XPBar from './XPBar'
import StreakBadge from './StreakBadge'
import CelebrationModal from './CelebrationModal'
import BadgesSection from './BadgesSection'
import BadgeEarnedModal from './BadgeEarnedModal'
import { useHabits } from '../../hooks/useHabits'
import { playComplete, playPerfectDay, playUncomplete } from '../../utils/sounds'
import { launchConfetti } from '../../utils/confetti'
import { getChildPhoto } from '../../utils/childPhotos'
import api from '../../api/client'

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

      setCelebration({
        pointsEarned: result.pointsEarned,
        newXP: result.newXP,
        leveledUp: result.leveledUp,
        newLevel: result.newLevel,
      })
      setChildData(prev => ({ ...prev, xp: result.newXP, level: result.newLevel, streakDays: result.newStreak }))
      setTodayPoints(prev => prev + result.pointsEarned)

      if (result.newBadges?.length > 0) {
        setNewBadges(result.newBadges)
        setBadgesKey(k => k + 1)
      }

      if (result.completedAllToday) {
        playPerfectDay()
        if (containerRef.current) launchConfetti(containerRef.current)
      }
    } catch (err) {
      console.error(err)
    }
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

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return '☀️ Bonjour'
    if (h < 18) return '🌤️ Bonne après-midi'
    return '🌙 Bonsoir'
  }

  const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.span className="text-5xl" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>
          ⭐
        </motion.span>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="px-4 pb-10 max-w-md mx-auto">
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center py-4">
        <motion.div
          className="mb-1 inline-block"
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ repeat: Infinity, duration: 4 }}
        >
          {childData.photoUrl
            ? <img src={childData.photoUrl} alt={childData.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg mx-auto" />
            : <span className="text-7xl">{childData.avatarEmoji}</span>
          }
        </motion.div>
        <h1 className="text-2xl font-black text-gray-800">
          {greeting()}, <span style={{ color: childData.avatarColor }}>{childData.name}</span> !
        </h1>
        <p className="text-gray-500 font-semibold capitalize text-sm">{dateStr}</p>
      </motion.div>

      <div className="flex gap-3 mb-4">
        <StreakBadge days={childData.streakDays} />
        <motion.div className="flex-1 bg-white rounded-2xl p-3 shadow-sm border-2 border-yellow-200" whileHover={{ scale: 1.02 }}>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Aujourd'hui</p>
          <p className="text-2xl font-black text-kids-orange">⭐ {todayPoints}</p>
          <p className="text-xs text-gray-400 font-semibold">points gagnés</p>
        </motion.div>
        <motion.div className="flex-1 bg-white rounded-2xl p-3 shadow-sm border-2 border-purple-200" whileHover={{ scale: 1.02 }}>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Niveau</p>
          <p className="text-2xl font-black text-kids-purple">🏆 {childData.level}</p>
          <p className="text-xs text-gray-400 font-semibold">{completedCount}/{habits.length} faites</p>
        </motion.div>
      </div>

      <XPBar xp={childData.xp} level={childData.level} />

      {habits.length > 0 && (
        <div className="my-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-gray-700">Mes habitudes</span>
            <span className="text-sm font-bold text-gray-500">{completedCount}/{habits.length}</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-kids-teal to-kids-blue rounded-full"
              initial={{ width: 0 }}
              animate={{ width: habits.length > 0 ? `${(completedCount / habits.length) * 100}%` : '0%' }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <AnimatePresence>
          {habits.map((habit, i) => (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
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

      {habits.length === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">🌱</div>
          <p className="font-bold text-gray-500">Pas encore d'habitudes !</p>
          <p className="text-sm text-gray-400">Demande à tes parents d'en ajouter</p>
        </div>
      )}

      {completedCount === habits.length && habits.length > 0 && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-6 bg-gradient-to-r from-kids-teal to-kids-blue rounded-3xl p-6 text-center text-white shadow-xl"
        >
          <div className="text-5xl mb-2">🏆</div>
          <p className="font-black text-2xl">JOURNÉE PARFAITE !</p>
          <p className="font-semibold opacity-80">Tu as tout accompli aujourd'hui !</p>
        </motion.div>
      )}

      <BadgesSection key={badgesKey} childId={child.id} />

      <CelebrationModal data={celebration} onClose={() => setCelebration(null)} />
      <BadgeEarnedModal badges={newBadges} onClose={() => setNewBadges([])} />
    </div>
  )
}
