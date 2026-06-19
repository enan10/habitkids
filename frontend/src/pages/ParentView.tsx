import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, Reorder, useDragControls, AnimatePresence } from 'framer-motion'
import api from '../api/client'
import { useAuthStore } from '../store/useStore'
import HabitForm, { CATEGORIES } from '../components/parent/HabitForm'
import StatsView from '../components/parent/StatsView'
import PhotoPicker from '../components/parent/PhotoPicker'
import { mergePhotos, setChildPhoto, removeChildPhoto } from '../utils/childPhotos'
import NotificationSettings from '../components/parent/NotificationSettings'
import UpgradeModal from '../components/parent/UpgradeModal'

interface Child {
  id: string
  name: string
  sex?: 'GARCON' | 'FILLE'
  avatarEmoji: string
  avatarColor: string
  photoUrl?: string
  classe?: string
  birthDate?: string
  xp: number
  level: number
  streakDays: number
  habits: any[]
}

interface Reward {
  id: string
  title: string
  emoji: string
  pointCost: number
  isUnlocked: boolean
  type: string
}

const WEEK_DAYS = [
  { label: 'Lundi',    short: 'Lu', day: 1 },
  { label: 'Mardi',    short: 'Ma', day: 2 },
  { label: 'Mercredi', short: 'Me', day: 3 },
  { label: 'Jeudi',    short: 'Je', day: 4 },
  { label: 'Vendredi', short: 'Ve', day: 5 },
  { label: 'Samedi',   short: 'Sa', day: 6 },
  { label: 'Dimanche', short: 'Di', day: 0 },
]

const PRESET_HABITS = [
  { title: 'Se brosser les dents',                  emoji: '🦷', category: 'HYGIENE',      color: '#54A0FF', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Se laver les mains',                    emoji: '🧼', category: 'HYGIENE',      color: '#54A0FF', pointValue: 5,  daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Prendre une douche',                    emoji: '🚿', category: 'HYGIENE',      color: '#54A0FF', pointValue: 15, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Se coiffer',                            emoji: '💇', category: 'HYGIENE',      color: '#54A0FF', pointValue: 5,  daysOfWeek: [1,2,3,4,5] },
  { title: 'Prendre ses médicaments',               emoji: '💊', category: 'HYGIENE',      color: '#54A0FF', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Porter ses sandales de maison',         emoji: '🩴', category: 'HYGIENE',      color: '#54A0FF', pointValue: 5,  daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Lire 15 minutes',                       emoji: '📖', category: 'EDUCATION',    color: '#FF9F43', pointValue: 15, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Faire ses devoirs',                     emoji: '📚', category: 'EDUCATION',    color: '#FF9F43', pointValue: 20, daysOfWeek: [1,2,3,4,5] },
  { title: 'Réviser ses leçons',                    emoji: '✏️', category: 'EDUCATION',    color: '#FF9F43', pointValue: 15, daysOfWeek: [1,2,3,4,5] },
  { title: 'Apprendre un mot nouveau',              emoji: '🔤', category: 'EDUCATION',    color: '#FF9F43', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Faire du sport 30 min',                 emoji: '🏃', category: 'SPORT',        color: '#1DD1A1', pointValue: 20, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Marcher 10 minutes',                    emoji: '🚶', category: 'SPORT',        color: '#1DD1A1', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Faire des étirements',                  emoji: '🧘', category: 'SPORT',        color: '#1DD1A1', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Manger des légumes',                    emoji: '🥗', category: 'ALIMENTATION', color: '#FECA57', pointValue: 15, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Boire 8 verres d\'eau',                 emoji: '💧', category: 'ALIMENTATION', color: '#FECA57', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Prendre le petit-déjeuner',             emoji: '🥣', category: 'ALIMENTATION', color: '#FECA57', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Limiter les sucreries',                 emoji: '🍬', category: 'ALIMENTATION', color: '#FECA57', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Se coucher à l\'heure',                 emoji: '😴', category: 'SOMMEIL',      color: '#5F27CD', pointValue: 15, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Se lever tôt le matin',                 emoji: '🌅', category: 'SOMMEIL',      color: '#5F27CD', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Éteindre les écrans à 20h',             emoji: '📵', category: 'SOMMEIL',      color: '#5F27CD', pointValue: 15, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Dessiner ou colorier',                  emoji: '🎨', category: 'CREATIVITE',   color: '#FF6B6B', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Jouer d\'un instrument',                emoji: '🎵', category: 'CREATIVITE',   color: '#FF6B6B', pointValue: 15, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Faire son lit',                         emoji: '🛏️', category: 'MENAGE',       color: '#48DBFB', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Ranger sa chambre',                     emoji: '🧹', category: 'MENAGE',       color: '#48DBFB', pointValue: 15, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Ranger ses vêtements',                  emoji: '👕', category: 'MENAGE',       color: '#48DBFB', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Aider ses parents à la maison',         emoji: '🏠', category: 'MENAGE',       color: '#48DBFB', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Aider à mettre la table',               emoji: '🍽️', category: 'MENAGE',       color: '#48DBFB', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Arroser les plantes',                   emoji: '🌿', category: 'NATURE',       color: '#1DD1A1', pointValue: 10, daysOfWeek: [1,3,5] },
  { title: 'Sortir dehors 20 min',                  emoji: '🌳', category: 'NATURE',       color: '#1DD1A1', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Respecter la nature',                   emoji: '🌍', category: 'NATURE',       color: '#1DD1A1', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Jeter les déchets à la poubelle',       emoji: '🗑️', category: 'NATURE',       color: '#1DD1A1', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Dire merci et s\'il te plaît',          emoji: '🙏', category: 'SOCIAL',       color: '#FF9FF3', pointValue: 5,  daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Saluer poliment les adultes',           emoji: '🤝', category: 'SOCIAL',       color: '#FF9FF3', pointValue: 5,  daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Attendre son tour pour parler',         emoji: '🤫', category: 'SOCIAL',       color: '#FF9FF3', pointValue: 5,  daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'S\'exprimer et écouter les autres',     emoji: '💬', category: 'SOCIAL',       color: '#FF9FF3', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Céder sa place aux personnes âgées',   emoji: '🧓', category: 'SOCIAL',       color: '#FF9FF3', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Appeler un ami ou la famille',          emoji: '📞', category: 'SOCIAL',       color: '#FF9FF3', pointValue: 10, daysOfWeek: [0,6] },
  { title: 'Utiliser le passage piéton',            emoji: '🚸', category: 'SECURITE',     color: '#EE5A24', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Ne jamais toucher l\'électricité ou le gaz', emoji: '⚡', category: 'SECURITE', color: '#EE5A24', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Éviter les produits dangereux',         emoji: '⚠️', category: 'SECURITE',     color: '#EE5A24', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Ne pas se pencher aux fenêtres',        emoji: '🪟', category: 'SECURITE',     color: '#EE5A24', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Ne pas jouer dans la rue',              emoji: '🛑', category: 'SECURITE',     color: '#EE5A24', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Se préparer tout seul le matin',        emoji: '🌅', category: 'AUTONOMIE',    color: '#6C5CE7', pointValue: 20, daysOfWeek: [1,2,3,4,5] },
  { title: 'Préparer son cartable la veille',       emoji: '🎒', category: 'AUTONOMIE',    color: '#6C5CE7', pointValue: 15, daysOfWeek: [1,2,3,4] },
  { title: 'S\'habiller tout seul',                 emoji: '👕', category: 'AUTONOMIE',    color: '#6C5CE7', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Choisir sa tenue du lendemain',         emoji: '👗', category: 'AUTONOMIE',    color: '#6C5CE7', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Attacher ses lacets tout seul',         emoji: '👟', category: 'AUTONOMIE',    color: '#6C5CE7', pointValue: 10, daysOfWeek: [1,2,3,4,5] },
  { title: 'Préparer son goûter',                   emoji: '🥪', category: 'AUTONOMIE',    color: '#6C5CE7', pointValue: 15, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Débarrasser son assiette',              emoji: '🍽️', category: 'AUTONOMIE',    color: '#6C5CE7', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { title: 'Se réveiller seul à l\'heure',          emoji: '⏰', category: 'AUTONOMIE',    color: '#6C5CE7', pointValue: 15, daysOfWeek: [1,2,3,4,5] },
  { title: 'Gérer son argent de poche',             emoji: '💰', category: 'AUTONOMIE',    color: '#6C5CE7', pointValue: 15, daysOfWeek: [6] },
  { title: 'Mettre son linge sale au panier',       emoji: '🧺', category: 'AUTONOMIE',    color: '#6C5CE7', pointValue: 5,  daysOfWeek: [0,1,2,3,4,5,6] },
]

function getCategoryInfo(id: string) {
  return CATEGORIES.find(c => c.id === id) ?? CATEGORIES[0]
}

function DonutChart({ completed, inProgress, missed }: { completed: number; inProgress: number; missed: number }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const total = completed + inProgress + missed
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const dashCompleted = total > 0 ? (completed / total) * circ : 0
  const dashInProgress = total > 0 ? (inProgress / total) * circ : 0
  const offsetCompleted = 0
  const offsetInProgress = dashCompleted
  const offsetMissed = dashCompleted + dashInProgress
  const dashMissed = total > 0 ? (missed / total) * circ : 0
  return (
    <div className="flex flex-col items-center">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        {completed > 0 && (
          <circle cx="44" cy="44" r={r} fill="none" stroke="#22c55e" strokeWidth="10"
            strokeDasharray={`${dashCompleted} ${circ - dashCompleted}`}
            strokeDashoffset={-offsetCompleted} strokeLinecap="butt"
            transform="rotate(-90 44 44)" />
        )}
        {inProgress > 0 && (
          <circle cx="44" cy="44" r={r} fill="none" stroke="#f97316" strokeWidth="10"
            strokeDasharray={`${dashInProgress} ${circ - dashInProgress}`}
            strokeDashoffset={-offsetInProgress} strokeLinecap="butt"
            transform="rotate(-90 44 44)" />
        )}
        {missed > 0 && (
          <circle cx="44" cy="44" r={r} fill="none" stroke="#ef4444" strokeWidth="10"
            strokeDasharray={`${dashMissed} ${circ - dashMissed}`}
            strokeDashoffset={-offsetMissed} strokeLinecap="butt"
            transform="rotate(-90 44 44)" />
        )}
        <text x="44" y="49" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#374151">{pct}%</text>
      </svg>
      <div className="flex flex-col gap-0.5 text-xs mt-1 w-full">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block flex-shrink-0" />{completed} complétées</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block flex-shrink-0" />{inProgress} en cours</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block flex-shrink-0" />{missed} manquées</span>
      </div>
    </div>
  )
}

function HabitRow({ habit, onDragEnd, onDelete, completedDates, weekDays }: {
  habit: any
  onDragEnd: () => void
  onDelete: () => void
  completedDates?: Set<string>
  weekDays?: { date: string; label: string }[]
}) {
  const controls = useDragControls()
  const [menuOpen, setMenuOpen] = useState(false)
  const cat = getCategoryInfo(habit.category || 'GENERAL')
  return (
    <Reorder.Item
      value={habit}
      dragControls={controls}
      dragListener={false}
      onDragEnd={onDragEnd}
      className="bg-white rounded-2xl p-3 shadow-sm relative"
    >
      <div className="flex items-center gap-3">
        <span
          className="text-gray-300 text-lg select-none cursor-grab active:cursor-grabbing touch-none px-1"
          onPointerDown={(e) => controls.start(e)}
        >⠿</span>
        <span className="text-2xl">{habit.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 text-sm truncate">{habit.title}</p>
          <p className="text-xs text-gray-400">
            {cat.emoji} {cat.label} · {(habit.daysOfWeek ?? []).length === 7 ? 'Quotidien' : (habit.daysOfWeek ?? []).sort((a: number, b: number) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b)).map((d: number) => ['Di','Lu','Ma','Me','Je','Ve','Sa'][d]).join(' ')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-yellow-500">⭐ {habit.pointValue}</span>
          <button onClick={() => setMenuOpen(v => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 font-bold text-lg">
            ⋮
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="absolute right-3 top-10 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
          <button onClick={() => { onDelete(); setMenuOpen(false) }}
            className="flex items-center gap-2 px-4 py-3 text-red-500 font-bold text-sm hover:bg-red-50 w-full">
            🗑️ Supprimer
          </button>
        </div>
      )}
      {menuOpen && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />}
      {weekDays && completedDates && (
        <div className="flex gap-1 mt-2 ml-10">
          {weekDays.map(({ date, label }) => {
            const dow = new Date(date + 'T12:00:00').getDay()
            const scheduled = (habit.daysOfWeek ?? []).length === 7 || (habit.daysOfWeek ?? []).includes(dow)
            const done = completedDates.has(date)
            if (!scheduled) return (
              <div key={date} className="flex flex-col items-center gap-0.5 opacity-30">
                <span className="text-xs text-gray-400">{label}</span>
                <div className="w-5 h-5 rounded-full border border-gray-200" />
              </div>
            )
            return (
              <div key={date} className="flex flex-col items-center gap-0.5">
                <span className="text-xs text-gray-500 font-semibold">{label}</span>
                {done
                  ? <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"><span className="text-white text-xs">✓</span></div>
                  : <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                }
              </div>
            )
          })}
        </div>
      )}
    </Reorder.Item>
  )
}

export default function ParentView() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const isPremium = user?.plan === 'PREMIUM'

  // Core state
  const [children, setChildren] = useState<Child[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [navTab, setNavTab] = useState<'accueil' | 'habitudes' | 'recompenses' | 'profil'>('accueil')

  // Child management
  const [showChildDropdown, setShowChildDropdown] = useState(false)
  const [showAddChild, setShowAddChild] = useState(false)
  const [newChildForm, setNewChildForm] = useState({ name: '', sex: '' as '' | 'GARCON' | 'FILLE', classe: '', birthDate: '', photoUrl: '' })
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [editingAvatar, setEditingAvatar] = useState(false)

  // Habits
  const [habitsList, setHabitsList] = useState<any[]>([])
  const habitsListRef = useRef<any[]>([])
  const [habitsView, setHabitsView] = useState<'list' | 'parjour'>('list')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestCatFilter, setSuggestCatFilter] = useState<string>('ALL')
  const [addingPreset, setAddingPreset] = useState<string | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<typeof PRESET_HABITS[0] | null>(null)
  const [selectedPresetDays, setSelectedPresetDays] = useState<number[]>([])
  const [addForDay, setAddForDay] = useState<number | null>(null)
  const [showHabitForm] = useState(false)

  // Rewards
  const [rewards, setRewards] = useState<Reward[]>([])
  const [rewardForm, setRewardForm] = useState({ title: '', emoji: '🎁', pointCost: 50 })
  const [showRewardForm, setShowRewardForm] = useState(false)

  // Weekly data
  const [weeklyCompletions, setWeeklyCompletions] = useState<any[]>([])
  const [badgesCount, setBadgesCount] = useState(0)

  // Misc
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [showHamburger, setShowHamburger] = useState(false)
  const [showNotifPanel, setShowNotifPanel] = useState(false)
  const [editingChildProfile, setEditingChildProfile] = useState<Child | null>(null)
  const [editChildForm, setEditChildForm] = useState({ name: '', sex: '' as '' | 'GARCON' | 'FILLE', classe: '', birthDate: '', photoUrl: '' })
  const [habitDayFilter, setHabitDayFilter] = useState<'today' | 'all'>('today')
  const [showDayFilterMenu, setShowDayFilterMenu] = useState(false)

  // Change password
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  // Last 7 days (Mon label = Lu, etc.)
  const last7Days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000)
    return {
      date: d.toISOString().split('T')[0],
      label: ['Di','Lu','Ma','Me','Je','Ve','Sa'][d.getDay()],
    }
  }), [])

  const fetchChildren = useCallback(async () => {
    const res = await api.get('/children')
    const merged = mergePhotos(res.data as Child[])
    setChildren(merged)
    if (!activeId && merged.length > 0) setActiveId(merged[0].id)
  }, [activeId])

  const fetchRewards = useCallback(async (childId: string) => {
    const res = await api.get(`/rewards/${childId}`)
    setRewards(res.data)
  }, [])

  const fetchWeeklyData = useCallback(async (childId: string) => {
    const to = new Date().toISOString().split('T')[0]
    const from = new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0]
    try {
      const [compRes, badgesRes] = await Promise.all([
        api.get(`/completions/range/${childId}?from=${from}&to=${to}`),
        api.get(`/badges/${childId}`),
      ])
      setWeeklyCompletions(compRes.data)
      setBadgesCount((badgesRes.data as any[]).filter(b => b.earned).length)
    } catch {}
  }, [])

  useEffect(() => { fetchChildren() }, [])

  useEffect(() => {
    const habits = activeChild?.habits ?? []
    setHabitsList(habits)
    habitsListRef.current = habits
  }, [activeId, children])

  useEffect(() => {
    if (activeId) {
      fetchWeeklyData(activeId)
      fetchRewards(activeId)
    }
  }, [activeId])

  const activeChild = children.find(c => c.id === activeId)

  // Weekly stats computed
  const weeklyPoints = weeklyCompletions.reduce((s, c) => s + c.pointsEarned, 0)
  const completedByHabit = useMemo(() => {
    const map = new Map<string, Set<string>>()
    weeklyCompletions.forEach(c => {
      if (!map.has(c.habitId)) map.set(c.habitId, new Set())
      map.get(c.habitId)!.add(c.date)
    })
    return map
  }, [weeklyCompletions])

  const todayHabits = useMemo(() => {
    const todayDow = new Date().getDay()
    return (activeChild?.habits ?? []).filter((h: any) =>
      (h.daysOfWeek ?? []).length === 7 || (h.daysOfWeek ?? []).includes(todayDow)
    )
  }, [activeChild])

  const todayCompleted = todayHabits.filter((h: any) => {
    const today = new Date().toISOString().split('T')[0]
    return completedByHabit.get(h.id)?.has(today)
  }).length

  const weeklyPct = todayHabits.length > 0 ? Math.round((todayCompleted / todayHabits.length) * 100) : 0

  // Habitudes manquées = scheduled for past days this week but not completed
  const missedCount = useMemo(() => {
    let missed = 0
    last7Days.slice(0, 6).forEach(({ date }) => {
      const dow = new Date(date + 'T12:00:00').getDay()
      const scheduled = (activeChild?.habits ?? []).filter((h: any) =>
        (h.daysOfWeek ?? []).length === 7 || (h.daysOfWeek ?? []).includes(dow)
      ).length
      const done = weeklyCompletions.filter((c: any) => c.date === date).length
      missed += Math.max(0, scheduled - done)
    })
    return missed
  }, [last7Days, activeChild, weeklyCompletions])

  const getAge = (birthDate?: string) => {
    if (!birthDate) return null
    const age = Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    return `${age} an${age > 1 ? 's' : ''}`
  }

  // Nombre de rappels en attente pour le badge cloche
  const pendingToday = todayHabits.length - todayCompleted

  const usedCategories = useMemo(() => {
    const cats = new Set((activeChild?.habits ?? []).map((h: any) => h.category || 'GENERAL'))
    return Array.from(cats) as string[]
  }, [activeChild?.habits])

  const filteredHabits = useMemo(() => {
    if (categoryFilter === 'ALL') return habitsList
    return habitsList.filter(h => (h.category || 'GENERAL') === categoryFilter)
  }, [habitsList, categoryFilter])

  const habitsForDay = (day: number) => {
    return (activeChild?.habits ?? [])
      .filter((h: any) => (h.daysOfWeek ?? []).includes(day))
      .filter((h: any) => categoryFilter === 'ALL' || (h.category || 'GENERAL') === categoryFilter)
  }

  const saveHabitOrder = async (newList: any[]) => {
    await Promise.all(newList.map((h, i) => api.patch(`/habits/${h.id}`, { order: i })))
    fetchChildren()
  }

  const addChild = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await api.post('/children', {
      name: newChildForm.name,
      sex: newChildForm.sex || undefined,
      avatarEmoji: '🧒',
      avatarColor: '#FF6B6B',
      classe: newChildForm.classe || undefined,
      birthDate: newChildForm.birthDate || undefined,
      photoUrl: newChildForm.photoUrl || undefined,
    })
    if (newChildForm.photoUrl && res.data?.id) setChildPhoto(res.data.id, newChildForm.photoUrl)
    setNewChildForm({ name: '', sex: '', classe: '', birthDate: '', photoUrl: '' })
    setShowAddChild(false)
    fetchChildren()
  }

  const deleteChild = async (childId: string) => {
    await api.delete(`/children/${childId}`)
    removeChildPhoto(childId)
    setConfirmDeleteId(null)
    if (activeId === childId) setActiveId(null)
    fetchChildren()
  }

  const deleteHabit = async (habitId: string) => {
    await api.delete(`/habits/${habitId}`)
    fetchChildren()
  }

  const removeHabitFromDay = async (habitId: string, day: number, currentDays: number[]) => {
    const newDays = currentDays.filter(d => d !== day)
    if (newDays.length === 0) {
      await api.delete(`/habits/${habitId}`)
    } else {
      await api.patch(`/habits/${habitId}`, { daysOfWeek: newDays, frequency: newDays.length === 7 ? 'DAILY' : 'WEEKLY' })
    }
    fetchChildren()
  }

  const addPresetHabit = async (preset: typeof PRESET_HABITS[0], overrideDays?: number[]) => {
    if (!activeId) return
    setAddingPreset(preset.title)
    try {
      const daysOfWeek = overrideDays ?? (addForDay !== null ? [addForDay] : preset.daysOfWeek)
      const frequency = daysOfWeek.length === 7 ? 'DAILY' : 'WEEKLY'
      await api.post('/habits', { ...preset, daysOfWeek, frequency, childId: activeId })
      fetchChildren()
      fetchWeeklyData(activeId)
    } catch (err: any) {
      if (err.response?.data?.upgrade || err.response?.data?.error?.includes('Maximum')) setShowUpgrade(true)
      else alert(err.response?.data?.error || 'Erreur')
    } finally {
      setAddingPreset(null)
    }
  }

  const addReward = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/rewards', { ...rewardForm, childId: activeId, type: 'PHYSICAL' })
      setRewardForm({ title: '', emoji: '🎁', pointCost: 50 })
      setShowRewardForm(false)
      if (activeId) fetchRewards(activeId)
    } catch (err: any) {
      if (err.response?.data?.upgrade) { setShowRewardForm(false); setShowUpgrade(true) }
      else alert(err.response?.data?.error || 'Erreur')
    }
  }

  const openEditChildProfile = (child: Child) => {
    setEditChildForm({
      name: child.name,
      sex: child.sex ?? '',
      classe: child.classe ?? '',
      birthDate: child.birthDate ? child.birthDate.split('T')[0] : '',
      photoUrl: child.photoUrl ?? '',
    })
    setEditingChildProfile(child)
    setShowHamburger(false)
  }

  const saveChildProfile = async () => {
    if (!editingChildProfile) return
    try {
      await api.patch(`/children/${editingChildProfile.id}`, {
        name: editChildForm.name || undefined,
        sex: editChildForm.sex || undefined,
        classe: editChildForm.classe || undefined,
        birthDate: editChildForm.birthDate || undefined,
      })
      setEditingChildProfile(null)
      fetchChildren()
    } catch {
      alert('Erreur lors de la sauvegarde')
    }
  }

  const unlockReward = async (rewardId: string) => {
    await api.post(`/rewards/${rewardId}/unlock`)
    if (activeId) fetchRewards(activeId)
  }

  const submitChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    if (pwForm.next !== pwForm.confirm) { setPwError('Les mots de passe ne correspondent pas'); return }
    if (pwForm.next.length < 8) { setPwError('Minimum 8 caractères'); return }
    setPwLoading(true)
    try {
      await api.patch('/auth/password', { currentPassword: pwForm.current, newPassword: pwForm.next })
      setPwSuccess(true)
      setPwForm({ current: '', next: '', confirm: '' })
      setTimeout(() => { setShowChangePassword(false); setPwSuccess(false) }, 1800)
    } catch (err: any) {
      setPwError(err.response?.data?.error || 'Erreur')
    } finally {
      setPwLoading(false)
    }
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bonjour'
    if (h < 18) return 'Bonne après-midi'
    return 'Bonsoir'
  }

  // ── Preset day configurator modal ───────────────────────────────────────────
  const PresetDayModal = () => {
    if (!selectedPreset) return null
    const cat = getCategoryInfo(selectedPreset.category)
    const freqPresets = [
      { label: 'Tous les jours',  icon: '🔄', days: [1, 2, 3, 4, 5, 6, 0] as number[] | null },
      { label: 'Jours scolaires', icon: '📚', days: [1, 2, 3, 4, 5]        as number[] | null },
      { label: 'Week-end',        icon: '🎉', days: [6, 0]                  as number[] | null },
      { label: 'Personnalisé',    icon: '✏️', days: null                                       },
    ]
    const toggleDay = (day: number) =>
      setSelectedPresetDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])

    const dayLabel = () => {
      const n = selectedPresetDays.length
      if (n === 0) return 'Aucun jour'
      if (n === 7) return 'Tous les jours'
      const names = ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa']
      return selectedPresetDays.slice().sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b)).map(d => names[d]).join(' · ')
    }

    const handleAdd = async () => {
      if (selectedPresetDays.length === 0) return
      await addPresetHabit(selectedPreset, selectedPresetDays)
      setSelectedPreset(null)
    }

    return (
      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-[60] flex items-end"
          onClick={() => setSelectedPreset(null)}>
          <motion.div initial={{ y: 400 }} animate={{ y: 0 }} exit={{ y: 400 }}
            className="w-full bg-white rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-gray-800 text-base">📅 Choisir les jours</h3>
              <button onClick={() => setSelectedPreset(null)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold">✕</button>
            </div>

            {/* Habit info */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3 mb-5">
              <span className="text-3xl">{selectedPreset.emoji}</span>
              <div>
                <p className="font-black text-gray-800">{selectedPreset.title}</p>
                <p className="text-xs text-gray-400">{cat.emoji} {cat.label} · ⭐ {selectedPreset.pointValue} pts</p>
              </div>
            </div>

            {/* Frequency presets */}
            <p className="text-sm font-bold text-gray-600 mb-2">Fréquence :</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {freqPresets.map(fp => {
                const matched = fp.days !== null
                  && fp.days.length === selectedPresetDays.length
                  && fp.days.every(d => selectedPresetDays.includes(d))
                const customActive = fp.days === null
                  && selectedPresetDays.length > 0
                  && !freqPresets.filter(p => p.days !== null).some(p =>
                      p.days!.length === selectedPresetDays.length && p.days!.every(d => selectedPresetDays.includes(d))
                    )
                const active = matched || customActive
                return (
                  <button key={fp.label} type="button"
                    onClick={() => { if (fp.days !== null) setSelectedPresetDays(fp.days!) }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                      active ? 'bg-kids-orange text-white border-kids-orange shadow-sm' : 'bg-white text-gray-500 border-gray-200'
                    }`}>
                    <span className="text-base">{fp.icon}</span>
                    <span>{fp.label}</span>
                    {matched && fp.days && (
                      <span className="ml-auto text-xs opacity-75">{fp.days.length}/7</span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Visual week calendar */}
            <p className="text-xs text-gray-400 font-semibold mb-2">Jours actifs :</p>
            <div className="flex gap-1.5 mb-3">
              {WEEK_DAYS.map(({ short, label, day }) => {
                const selected = selectedPresetDays.includes(day)
                return (
                  <button key={day} type="button" onClick={() => toggleDay(day)} title={label}
                    className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all ${
                      selected ? 'bg-kids-orange border-kids-orange text-white shadow-sm' : 'bg-white border-gray-200 text-gray-400'
                    }`}>
                    <span className="text-[11px] font-black leading-none">{short}</span>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      selected ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-300'
                    }`}>
                      {selected ? '✓' : '·'}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Summary */}
            <div className="flex justify-center mb-5">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                selectedPresetDays.length === 0 ? 'bg-red-50 text-red-400' : 'bg-orange-50 text-kids-orange'
              }`}>
                {selectedPresetDays.length === 0 ? '⚠️ Aucun jour sélectionné' : `📅 ${dayLabel()}`}
              </span>
            </div>

            {/* Add button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleAdd}
              disabled={selectedPresetDays.length === 0 || addingPreset === selectedPreset.title}
              className="w-full bg-kids-teal text-white font-black py-3.5 rounded-2xl text-base shadow-md disabled:opacity-60">
              {addingPreset === selectedPreset.title ? '⏳ Ajout en cours...' : '✅ Ajouter cette habitude'}
            </motion.button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }

  // ── Suggestions panel (modal overlay) ──────────────────────────────────────
  const SuggestionsPanel = () => (
    <AnimatePresence>
      {showSuggestions && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 z-50 flex items-end"
          onClick={() => setShowSuggestions(false)}>
          <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }}
            className="w-full bg-white rounded-t-3xl p-4 max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <span className="font-black text-gray-800 text-base">💡 Ajouter une habitude</span>
              <button onClick={() => setShowSuggestions(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold">✕</button>
            </div>
            {/* Category filter */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 flex-shrink-0">
              <button onClick={() => setSuggestCatFilter('ALL')}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold border-2 transition-all ${suggestCatFilter === 'ALL' ? 'bg-gray-700 text-white border-gray-700' : 'bg-white text-gray-500 border-gray-200'}`}>
                Tous
              </button>
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setSuggestCatFilter(cat.id)}
                  className={`flex-shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border-2 transition-all ${suggestCatFilter === cat.id ? 'bg-kids-orange text-white border-kids-orange' : 'bg-white text-gray-500 border-gray-200'}`}>
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
            {/* Habit list */}
            <div className="space-y-1.5 overflow-y-auto flex-1">
              {PRESET_HABITS
                .filter(p => suggestCatFilter === 'ALL' || p.category === suggestCatFilter)
                .map(preset => {
                  const cat = getCategoryInfo(preset.category)
                  const alreadyAdded = (activeChild?.habits ?? []).some((h: any) => h.title === preset.title)
                  return (
                    <div key={preset.title}
                      className={`flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5 ${alreadyAdded ? 'opacity-50' : ''}`}>
                      <span className="text-xl">{preset.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 text-sm truncate">{preset.title}</p>
                        <p className="text-xs text-gray-400">{cat.emoji} {cat.label} · ⭐ {preset.pointValue} pts</p>
                      </div>
                      {alreadyAdded
                        ? <span className="text-green-400 font-bold text-lg">✓</span>
                        : <motion.button whileTap={{ scale: 0.9 }}
                            onClick={() => { setSelectedPreset(preset); setSelectedPresetDays(preset.daysOfWeek) }}
                            className="w-8 h-8 rounded-full bg-kids-teal text-white font-black text-lg flex items-center justify-center shadow">
                            +
                          </motion.button>
                      }
                    </div>
                  )
                })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // ── Accueil tab ─────────────────────────────────────────────────────────────
  const AccueilTab = () => {
    if (!activeChild) return null
    const today = new Date().toISOString().split('T')[0]
    const todayDone = todayHabits.filter((h: any) => completedByHabit.get(h.id)?.has(today))
    const todayTodo = todayHabits.filter((h: any) => !completedByHabit.get(h.id)?.has(today))
    const progressPct = todayHabits.length > 0 ? Math.round((todayDone.length / todayHabits.length) * 100) : 0

    const totalScheduledWeek = last7Days.reduce((acc, { date }) => {
      const dow = new Date(date + 'T12:00:00').getDay()
      return acc + (activeChild?.habits ?? []).filter((h: any) =>
        (h.daysOfWeek ?? []).length === 7 || (h.daysOfWeek ?? []).includes(dow)
      ).length
    }, 0)
    const weeklyPctReal = totalScheduledWeek > 0
      ? Math.round(Math.min(100, (weeklyCompletions.length / totalScheduledWeek) * 100))
      : 0

    const dateFormatted = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long',
    }).replace(/^\w/, c => c.toUpperCase())

    return (
      <div className="space-y-4">

        {/* Children horizontal selector */}
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
          {children.map(child => {
            const isActive = child.id === activeId
            const age = getAge(child.birthDate)
            return (
              <button
                key={child.id}
                onClick={() => setActiveId(child.id)}
                className={`flex-shrink-0 flex items-center gap-2.5 p-3 rounded-2xl border-2 transition-all bg-white ${
                  isActive ? 'border-kids-orange shadow-md' : 'border-gray-100'
                }`}
              >
                {child.photoUrl
                  ? <img src={child.photoUrl} className="w-12 h-12 rounded-full object-cover flex-shrink-0" alt={child.name} />
                  : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-kids-orange to-yellow-400 flex items-center justify-center text-2xl flex-shrink-0">
                      {child.avatarEmoji}
                    </div>
                }
                <div className="text-left min-w-0">
                  <p className={`font-black text-sm ${isActive ? 'text-kids-orange' : 'text-gray-800'}`}>{child.name}</p>
                  <p className="text-xs text-gray-400">{[age, child.classe].filter(Boolean).join(' • ') || ' '}</p>
                  {isActive && (
                    <span className="text-[10px] bg-kids-orange text-white font-bold px-1.5 py-0.5 rounded-full mt-0.5 inline-block">Actif</span>
                  )}
                </div>
              </button>
            )
          })}
          <button
            onClick={() => setShowAddChild(true)}
            className="flex-shrink-0 flex items-center gap-2 p-3 rounded-2xl border-2 border-dashed border-gray-200 bg-white text-gray-400"
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl">+</div>
            <p className="font-bold text-xs whitespace-nowrap">Ajouter<br/>un enfant</p>
          </button>
        </div>

        {/* 5-col stats */}
        <div className="grid grid-cols-5 gap-1.5">
          {[
            { icon: '⭐', value: activeChild.xp,                              label: 'Points',        color: 'text-yellow-500' },
            { icon: '🔥', value: activeChild.streakDays,                      label: 'Série',         color: 'text-orange-500' },
            { icon: '🏆', value: badgesCount,                                 label: 'Badges',        color: 'text-purple-500' },
            { icon: '📈', value: `${weeklyPctReal}%`,                         label: 'Cette semaine', color: 'text-green-500'  },
            { icon: '🎯', value: `${todayDone.length}/${todayHabits.length}`, label: "Aujourd'hui",   color: 'text-blue-500'   },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <span className="text-sm">{s.icon}</span>
              <p className={`text-xs font-black leading-tight mt-0.5 ${s.color}`}>{s.value}</p>
              <p className="text-[9px] text-gray-400 font-semibold mt-0.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Today's habits card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <p className="font-black text-gray-800 text-sm leading-snug">
                  Voici les habitudes de {activeChild.name} pour aujourd'hui :
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{dateFormatted}</p>
              </div>
              <button className="flex items-center gap-1 text-xs text-gray-500 font-bold bg-gray-50 px-2 py-1.5 rounded-xl flex-shrink-0 border border-gray-200">
                📅 Changer de jour
              </button>
            </div>
            {todayHabits.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-600">Progression du jour</span>
                  <span className="text-xs font-black text-green-600">{progressPct}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <motion.div
                    className="bg-green-500 h-2.5 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <p className="text-xs text-gray-400 text-right mt-1">
                  {todayDone.length}/{todayHabits.length} habitudes réalisées
                </p>
              </div>
            )}
          </div>

          {todayTodo.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-orange-50">
                <p className="text-xs font-black text-kids-orange">À faire aujourd'hui ({todayTodo.length})</p>
              </div>
              {todayTodo.map((habit: any) => (
                <div key={habit.id} className="flex items-center gap-3 px-4 py-3 border-t border-gray-50">
                  <div className="w-5 h-5 rounded border-2 border-gray-300 flex-shrink-0" />
                  <span className="text-xl">{habit.emoji}</span>
                  <p className="flex-1 font-semibold text-gray-800 text-sm">{habit.title}</p>
                  <span className="text-xs font-bold text-yellow-500 flex-shrink-0">⭐ +{habit.pointValue}</span>
                </div>
              ))}
            </div>
          )}

          {todayDone.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-green-50">
                <p className="text-xs font-black text-green-600">Déjà réalisées ({todayDone.length})</p>
              </div>
              {todayDone.map((habit: any) => (
                <div key={habit.id} className="flex items-center gap-3 px-4 py-3 border-t border-gray-50 opacity-60">
                  <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                  <span className="text-xl">{habit.emoji}</span>
                  <p className="flex-1 font-semibold text-gray-500 text-sm line-through">{habit.title}</p>
                  <span className="text-xs font-bold text-yellow-500 flex-shrink-0">⭐ +{habit.pointValue}</span>
                </div>
              ))}
            </div>
          )}

          {todayHabits.length === 0 && (
            <div className="text-center py-8 px-4">
              <p className="text-3xl mb-2">🌱</p>
              <p className="text-sm text-gray-400 font-semibold">Aucune habitude pour aujourd'hui</p>
              <button onClick={() => setShowSuggestions(true)}
                className="mt-3 bg-kids-teal text-white font-bold px-4 py-2 rounded-xl text-sm">
                + Ajouter
              </button>
            </div>
          )}

          {todayHabits.length > 0 && (
            <button
              onClick={() => setNavTab('habitudes')}
              className="w-full py-3 text-xs text-kids-orange font-bold border-t border-gray-100 text-center"
            >
              Voir toutes les habitudes de {activeChild.name} →
            </button>
          )}
        </div>

        {/* Family progress */}
        {children.length > 1 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-gray-800 text-sm">Progression de la famille</h3>
              <button onClick={() => setNavTab('habitudes')}
                className="text-xs text-kids-orange font-bold">
                Voir tous les enfants →
              </button>
            </div>
            <div className={`grid gap-4 ${children.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {children.map(child => {
                const todayDow = new Date().getDay()
                const childTotal = (child.habits ?? []).filter((h: any) =>
                  (h.daysOfWeek ?? []).length === 7 || (h.daysOfWeek ?? []).includes(todayDow)
                ).length
                const childDone = child.id === activeId ? todayDone.length : 0
                const childPct = child.id === activeId ? progressPct : 0
                return (
                  <button key={child.id} onClick={() => setActiveId(child.id)}
                    className="flex flex-col items-center text-center">
                    {child.photoUrl
                      ? <img src={child.photoUrl} className="w-14 h-14 rounded-full object-cover mb-1.5 border-2 border-gray-100" alt={child.name} />
                      : <div className="w-14 h-14 rounded-full bg-gradient-to-br from-kids-orange to-yellow-400 flex items-center justify-center text-2xl mb-1.5">
                          {child.avatarEmoji}
                        </div>
                    }
                    <p className="font-black text-gray-800 text-xs mb-0.5">{child.name}</p>
                    {child.id === activeId
                      ? <p className={`font-black text-sm ${childPct >= 80 ? 'text-green-500' : childPct >= 40 ? 'text-orange-400' : 'text-red-400'}`}>{childPct}%</p>
                      : <p className="font-black text-sm text-gray-300">—</p>
                    }
                    <div className="w-full bg-gray-100 rounded-full h-1.5 my-1">
                      <div
                        className={`h-1.5 rounded-full ${childPct >= 80 ? 'bg-green-500' : childPct >= 40 ? 'bg-orange-400' : 'bg-red-400'}`}
                        style={{ width: `${childPct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400">
                      {child.id === activeId
                        ? `${childDone}/${childTotal} habitudes réalisées`
                        : `${childTotal} habitudes`}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

      </div>
    )
  }

  // ── Habitudes tab ────────────────────────────────────────────────────────────
  const HabitudesTab = () => {
    if (!activeChild) return null
    return (
      <div>
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="font-black text-gray-700">Habitudes</h3>
            <p className="text-xs text-gray-400">{activeChild.habits?.length ?? 0} habitude{(activeChild.habits?.length ?? 0) !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setHabitsView(habitsView === 'list' ? 'parjour' : 'list')}
              className="text-xs text-gray-400 font-bold px-3 py-2 bg-white rounded-xl shadow-sm">
              {habitsView === 'list' ? '📅 Par jour' : '📋 Liste'}
            </button>
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => setShowSuggestions(true)}
              className="bg-kids-teal text-white font-black px-5 py-2 rounded-xl text-sm shadow-md">
              + Ajouter
            </motion.button>
          </div>
        </div>

        {/* Category filter */}
        {usedCategories.length > 1 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            <button onClick={() => setCategoryFilter('ALL')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${categoryFilter === 'ALL' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200'}`}>
              Toutes
            </button>
            {usedCategories.map(catId => {
              const cat = getCategoryInfo(catId)
              return (
                <button key={catId} onClick={() => setCategoryFilter(catId)}
                  className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${categoryFilter === catId ? 'bg-kids-orange text-white border-kids-orange' : 'bg-white text-gray-500 border-gray-200'}`}>
                  {cat.emoji} {cat.label}
                </button>
              )
            })}
          </div>
        )}

        {/* List view with drag */}
        {habitsView === 'list' && (
          <Reorder.Group axis="y" values={filteredHabits}
            onReorder={newList => { setHabitsList(newList); habitsListRef.current = newList }}
            className="space-y-2">
            {filteredHabits.map(habit => (
              <HabitRow
                key={habit.id}
                habit={habit}
                onDragEnd={() => saveHabitOrder(habitsListRef.current)}
                onDelete={() => deleteHabit(habit.id)}
                completedDates={completedByHabit.get(habit.id)}
                weekDays={last7Days}
              />
            ))}
          </Reorder.Group>
        )}

        {/* Par jour view */}
        {habitsView === 'parjour' && (
          <div className="space-y-3">
            {WEEK_DAYS.map(({ label, short, day }) => {
              const dayHabits = habitsForDay(day)
              return (
                <div key={day} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <span className="w-7 h-7 bg-kids-blue text-white text-xs font-black rounded-full flex items-center justify-center">{short}</span>
                    <span className="font-bold text-gray-700 text-sm">{label}</span>
                    <span className="text-xs text-gray-400 font-semibold">{dayHabits.length} habitude{dayHabits.length !== 1 ? 's' : ''}</span>
                    <motion.button whileTap={{ scale: 0.9 }}
                      onClick={() => { setAddForDay(day); setShowSuggestions(true) }}
                      className="ml-auto w-7 h-7 bg-kids-teal text-white font-black text-base rounded-full flex items-center justify-center shadow-sm">
                      +
                    </motion.button>
                  </div>
                  {dayHabits.length === 0
                    ? <p className="px-4 py-3 text-sm text-gray-400 italic">Aucune habitude ce jour</p>
                    : <div className="divide-y divide-gray-50">
                        {dayHabits.map((habit: any) => {
                          const cat = getCategoryInfo(habit.category || 'GENERAL')
                          return (
                            <div key={habit.id} className="flex items-center gap-3 px-4 py-2.5">
                              <span className="text-xl">{habit.emoji}</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-800 text-sm truncate">{habit.title}</p>
                                <span className="text-xs text-gray-400">{cat.emoji} {cat.label} · ⭐ {habit.pointValue}</span>
                              </div>
                              <button onClick={() => removeHabitFromDay(habit.id, day, habit.daysOfWeek ?? [])}
                                className="text-red-300 hover:text-red-500 p-1">🗑️</button>
                            </div>
                          )
                        })}
                      </div>
                  }
                </div>
              )
            })}
          </div>
        )}

        {activeChild.habits?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-5xl mb-3">🌱</p>
            <p className="font-bold text-gray-500">Pas encore d'habitudes</p>
            <button onClick={() => setShowSuggestions(true)}
              className="mt-3 bg-kids-teal text-white font-bold px-6 py-3 rounded-xl">
              + Ajouter une habitude
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── Récompenses tab ──────────────────────────────────────────────────────────
  const RecompensesTab = () => {
    if (!activeChild) return null
    return (
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-black text-gray-700">Récompenses</h3>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowRewardForm(true)}
            className="bg-kids-orange text-white font-bold px-4 py-2 rounded-xl text-sm">
            + Ajouter
          </motion.button>
        </div>
        {showRewardForm && (
          <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            onSubmit={addReward} className="bg-white rounded-2xl p-4 shadow-md mb-4 space-y-3">
            <div className="flex gap-2">
              <input type="text" placeholder="🎁" value={rewardForm.emoji}
                onChange={e => setRewardForm(f => ({ ...f, emoji: e.target.value }))}
                className="w-16 p-3 border-2 border-gray-200 rounded-xl text-center text-xl" />
              <input type="text" placeholder="Nom de la récompense" value={rewardForm.title}
                onChange={e => setRewardForm(f => ({ ...f, title: e.target.value }))}
                className="flex-1 p-3 border-2 border-gray-200 rounded-xl font-semibold" required />
            </div>
            <div className="flex items-center gap-2">
              <label className="font-semibold text-gray-600 text-sm">⭐ Points :</label>
              <input type="number" value={rewardForm.pointCost} min={1}
                onChange={e => setRewardForm(f => ({ ...f, pointCost: Number(e.target.value) }))}
                className="w-24 p-3 border-2 border-gray-200 rounded-xl font-semibold" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-kids-teal text-white font-bold py-3 rounded-xl">✓ Sauvegarder</button>
              <button type="button" onClick={() => setShowRewardForm(false)} className="px-4 bg-gray-100 text-gray-500 font-bold rounded-xl">✕</button>
            </div>
          </motion.form>
        )}
        <div className="space-y-2">
          {rewards.map(r => (
            <div key={r.id} className={`rounded-2xl p-3 shadow-sm flex items-center gap-3 ${r.isUnlocked ? 'bg-green-50 border-2 border-green-200' : 'bg-white'}`}>
              <span className="text-2xl">{r.emoji}</span>
              <div className="flex-1">
                <p className="font-bold text-gray-800">{r.title}</p>
                <p className="text-sm text-gray-500">⭐ {r.pointCost} points</p>
              </div>
              {r.isUnlocked
                ? <span className="text-green-500 font-bold text-sm">✅ Débloqué</span>
                : <button onClick={() => unlockReward(r.id)}
                    disabled={activeChild.xp < r.pointCost}
                    className="bg-kids-orange text-white font-bold px-3 py-1 rounded-xl text-sm disabled:opacity-40">
                    Débloquer
                  </button>
              }
            </div>
          ))}
          {rewards.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">🎁</p>
              <p className="font-semibold">Aucune récompense</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Profil tab ───────────────────────────────────────────────────────────────
  const ProfilTab = () => (
    <div className="space-y-4">
      {/* Parent info */}
      <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-kids-orange flex items-center justify-center text-white text-2xl font-black">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="font-black text-gray-800">{user?.name}</p>
          <p className="text-sm text-gray-400">{user?.email}</p>
          {isPremium && <span className="text-xs bg-yellow-100 text-yellow-700 font-bold px-2 py-0.5 rounded-full">✨ Premium</span>}
        </div>
        {!isPremium && (
          <button onClick={() => setShowUpgrade(true)}
            className="bg-gradient-to-r from-kids-orange to-yellow-400 text-white font-bold px-3 py-2 rounded-xl text-xs">
            ⭐ Premium
          </button>
        )}
      </div>

      {/* Stats section */}
      {activeChild && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <p className="px-4 pt-4 font-black text-gray-700 text-sm">📊 Statistiques</p>
          <StatsView childId={activeChild.id} childName={activeChild.name} isPremium={isPremium} onUpgrade={() => setShowUpgrade(true)} />
        </div>
      )}

      {/* Notifications */}
      {activeChild && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <p className="px-4 pt-4 font-black text-gray-700 text-sm">🔔 Rappels</p>
          <div className="p-4">
            <NotificationSettings childId={activeChild.id} />
          </div>
        </div>
      )}

      {/* Changer le mot de passe */}
      <button onClick={() => { setShowChangePassword(true); setPwError(''); setPwSuccess(false) }}
        className="w-full bg-gray-50 text-gray-700 font-bold py-3 rounded-2xl border-2 border-gray-100">
        🔑 Changer le mot de passe
      </button>

      {/* Logout */}
      <button onClick={logout}
        className="w-full bg-red-50 text-red-500 font-bold py-3 rounded-2xl border-2 border-red-100">
        🚪 Se déconnecter
      </button>
    </div>
  )

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
      <PresetDayModal />
      <SuggestionsPanel />

      {/* Hamburger panel */}
      <AnimatePresence>
        {showHamburger && (
          <>
            <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowHamburger(false)} />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-white z-50 shadow-2xl flex flex-col">
              <div className="p-6 bg-kids-orange">
                <p className="text-white/80 text-sm font-semibold">{greeting()} 👋</p>
                <p className="text-white font-black text-xl">{user?.name}</p>
                {isPremium && <span className="text-xs bg-white/20 text-white font-bold px-2 py-0.5 rounded-full mt-1 inline-block">✨ Premium</span>}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Enfants */}
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2 px-1">Mes enfants</p>
                  <div className="space-y-1">
                    {children.map(c => (
                      <div key={c.id}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border-2 transition-all ${activeId === c.id ? 'border-kids-orange bg-orange-50' : 'border-transparent hover:bg-gray-50'}`}>
                        {/* Photo cliquable */}
                        <button
                          onClick={() => openEditChildProfile(c)}
                          className="relative flex-shrink-0">
                          {c.photoUrl
                            ? <img src={c.photoUrl} className="w-11 h-11 rounded-full object-cover border-2 border-kids-orange" />
                            : <div className="w-11 h-11 rounded-full bg-kids-orange/20 flex items-center justify-center text-2xl">{c.avatarEmoji}</div>
                          }
                          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-kids-blue rounded-full flex items-center justify-center text-xs text-white">✏️</span>
                        </button>
                        {/* Infos */}
                        <button
                          onClick={() => openEditChildProfile(c)}
                          className="flex-1 text-left min-w-0">
                          <p className="font-bold text-gray-800 text-sm truncate">{c.name}</p>
                          <p className="text-xs text-gray-400">Niv. {c.level} · {c.xp} XP{c.classe ? ` · ${c.classe}` : ''}</p>
                        </button>
                        {/* Supprimer */}
                        <button onClick={() => { setConfirmDeleteId(c.id); setShowHamburger(false) }}
                          className="w-6 h-6 bg-red-100 text-red-400 rounded-full text-xs flex items-center justify-center flex-shrink-0">✕</button>
                      </div>
                    ))}
                    <button onClick={() => { setShowAddChild(true); setShowHamburger(false) }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 text-left border-2 border-dashed border-gray-200">
                      <span className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-xl">+</span>
                      <span className="font-bold text-gray-400 text-sm">Ajouter un enfant</span>
                    </button>
                  </div>
                </div>

                {/* Navigation */}
                <div className="border-t border-gray-100 pt-3 space-y-1">
                  <button onClick={() => { setNavTab('profil'); setShowHamburger(false) }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-left">
                    <span className="text-xl">👤</span>
                    <span className="font-bold text-gray-700">Mon profil</span>
                  </button>
                  {!isPremium && (
                    <button onClick={() => { setShowUpgrade(true); setShowHamburger(false) }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-yellow-50 text-left">
                      <span className="text-xl">⭐</span>
                      <span className="font-bold text-yellow-600">Passer Premium</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="p-4 border-t border-gray-100">
                <button onClick={logout}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-left">
                  <span className="text-xl">🚪</span>
                  <span className="font-bold text-red-500">Se déconnecter</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal modification profil enfant */}
      <AnimatePresence>
        {editingChildProfile && (
          <>
            <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setEditingChildProfile(null)} />
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              className="fixed inset-x-4 top-16 bottom-16 max-w-md mx-auto bg-white rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="font-black text-gray-800 text-lg">Modifier le profil</h2>
                <button onClick={() => setEditingChildProfile(null)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold">✕</button>
              </div>
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Photo */}
                <div className="flex flex-col items-center">
                  <PhotoPicker
                    photoUrl={editChildForm.photoUrl || undefined}
                    onPhotoChange={async (url) => {
                      try {
                        if (url) {
                          await api.patch(`/children/${editingChildProfile.id}`, { photoUrl: url })
                          setChildPhoto(editingChildProfile.id, url)
                        } else {
                          await api.patch(`/children/${editingChildProfile.id}`, { photoUrl: null })
                          removeChildPhoto(editingChildProfile.id)
                        }
                        setEditChildForm(f => ({ ...f, photoUrl: url ?? '' }))
                        setChildren(prev => prev.map(c =>
                          c.id === editingChildProfile.id ? { ...c, photoUrl: url ?? undefined } : c
                        ))
                      } catch {
                        alert('❌ Erreur sauvegarde photo')
                      }
                    }}
                  />
                </div>
                {/* Nom */}
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5 block">Prénom</label>
                  <input type="text" value={editChildForm.name}
                    onChange={e => setEditChildForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-800 focus:border-kids-orange focus:outline-none" />
                </div>
                {/* Sexe */}
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5 block">Sexe</label>
                  <div className="flex gap-2">
                    <button type="button"
                      onClick={() => setEditChildForm(f => ({ ...f, sex: f.sex === 'GARCON' ? '' : 'GARCON' }))}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition-colors ${editChildForm.sex === 'GARCON' ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-white border-gray-200 text-gray-500'}`}>
                      👦 Garçon
                    </button>
                    <button type="button"
                      onClick={() => setEditChildForm(f => ({ ...f, sex: f.sex === 'FILLE' ? '' : 'FILLE' }))}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition-colors ${editChildForm.sex === 'FILLE' ? 'bg-pink-100 border-pink-400 text-pink-700' : 'bg-white border-gray-200 text-gray-500'}`}>
                      👧 Fille
                    </button>
                  </div>
                </div>
                {/* Date de naissance */}
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5 block">Date de naissance</label>
                  <input type="date" value={editChildForm.birthDate}
                    onChange={e => setEditChildForm(f => ({ ...f, birthDate: e.target.value }))}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-800 focus:border-kids-orange focus:outline-none" />
                </div>
                {/* Classe */}
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5 block">Classe</label>
                  <input type="text" placeholder="Ex : CM1, 6ème, Maternelle…" value={editChildForm.classe}
                    onChange={e => setEditChildForm(f => ({ ...f, classe: e.target.value }))}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-800 focus:border-kids-orange focus:outline-none" />
                </div>
                {/* Stats (lecture seule) */}
                <div className="bg-gray-50 rounded-2xl p-4 grid grid-cols-3 gap-3 text-center">
                  <div><p className="text-lg font-black text-kids-orange">{editingChildProfile.level}</p><p className="text-xs text-gray-400 font-semibold">Niveau</p></div>
                  <div><p className="text-lg font-black text-yellow-500">{editingChildProfile.xp}</p><p className="text-xs text-gray-400 font-semibold">XP total</p></div>
                  <div><p className="text-lg font-black text-orange-500">{editingChildProfile.streakDays}j</p><p className="text-xs text-gray-400 font-semibold">Série</p></div>
                </div>
              </div>
              {/* Footer */}
              <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
                <button onClick={() => setEditingChildProfile(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl">
                  Annuler
                </button>
                <button onClick={saveChildProfile}
                  className="flex-1 py-3 bg-kids-orange text-white font-black rounded-2xl shadow-md">
                  ✓ Sauvegarder
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal changer le mot de passe */}
      <AnimatePresence>
        {showChangePassword && (
          <>
            <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowChangePassword(false)} />
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              className="fixed inset-x-4 top-auto bottom-0 max-w-md mx-auto bg-white rounded-t-3xl shadow-2xl z-50 p-6 pb-10">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-black text-gray-800 text-lg">🔑 Changer le mot de passe</h2>
                <button onClick={() => setShowChangePassword(false)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold">✕</button>
              </div>
              {pwSuccess ? (
                <div className="text-center py-6">
                  <div className="text-5xl mb-3">✅</div>
                  <p className="font-black text-green-600 text-lg">Mot de passe mis à jour !</p>
                </div>
              ) : (
                <form onSubmit={submitChangePassword} className="space-y-3">
                  <input type="password" placeholder="Mot de passe actuel" value={pwForm.current}
                    onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                    className="w-full p-3.5 border-2 border-gray-200 rounded-xl font-semibold focus:border-kids-orange focus:outline-none"
                    required />
                  <input type="password" placeholder="Nouveau mot de passe (min. 8 car.)" value={pwForm.next}
                    onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                    className="w-full p-3.5 border-2 border-gray-200 rounded-xl font-semibold focus:border-kids-orange focus:outline-none"
                    required minLength={8} />
                  <input type="password" placeholder="Confirmer le nouveau mot de passe" value={pwForm.confirm}
                    onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                    className="w-full p-3.5 border-2 border-gray-200 rounded-xl font-semibold focus:border-kids-orange focus:outline-none"
                    required minLength={8} />
                  {pwError && (
                    <p className="text-red-500 font-semibold text-sm text-center">{pwError}</p>
                  )}
                  <button type="submit" disabled={pwLoading}
                    className="w-full bg-kids-orange text-white font-black py-3.5 rounded-xl disabled:opacity-60 mt-2">
                    {pwLoading ? '⏳ Enregistrement...' : '✅ Enregistrer'}
                  </button>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Notif panel */}
      <AnimatePresence>
        {showNotifPanel && activeChild && (
          <>
            <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowNotifPanel(false)} />
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
              className="fixed top-16 left-4 right-4 max-w-md mx-auto bg-white rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-black text-gray-800">🔔 Rappels</span>
                <button onClick={() => setShowNotifPanel(false)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold">✕</button>
              </div>
              <div className="p-4">
                <NotificationSettings childId={activeChild.id} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowHamburger(true)}
              className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-xl bg-gray-50">
              <span className="w-5 h-0.5 bg-gray-600 rounded" />
              <span className="w-5 h-0.5 bg-gray-600 rounded" />
              <span className="w-5 h-0.5 bg-gray-600 rounded" />
            </button>
            <div>
              <p className="text-xs text-gray-400 font-semibold">{greeting()} 👋</p>
              {navTab === 'accueil'
                ? <p className="font-black text-gray-800 text-base">Progrès de mes enfants</p>
                : <button
                    onClick={() => setShowChildDropdown(v => !v)}
                    className="flex items-center gap-1 font-black text-gray-800 text-base">
                    {activeChild ? `Progrès de ${activeChild.name}` : 'Espace Parent'}
                    {children.length > 0 && <span className="text-gray-400 text-sm">▾</span>}
                  </button>
              }
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <button onClick={() => setShowNotifPanel(true)}
              className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-lg relative">
              🔔
              {pendingToday > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {pendingToday}
                </span>
              )}
            </button>
            {/* Child avatar — cliquable pour changer la photo */}
            <button onClick={() => setEditingAvatar(v => !v)} className="relative">
              {activeChild?.photoUrl
                ? <img src={activeChild.photoUrl} className="w-9 h-9 rounded-full object-cover border-2 border-kids-orange" />
                : <div className="w-9 h-9 rounded-full bg-kids-orange flex items-center justify-center text-white font-black">
                    {activeChild?.avatarEmoji ?? user?.name?.[0]?.toUpperCase()}
                  </div>
              }
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center text-xs shadow">📷</span>
            </button>
          </div>
        </div>

        {/* Child dropdown */}
        <AnimatePresence>
          {showChildDropdown && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="absolute top-full left-0 right-0 bg-white shadow-xl border-t border-gray-100 z-50 p-3">
              <div className="max-w-md mx-auto space-y-1">
                {children.map(c => (
                  <button key={c.id} onClick={() => { setActiveId(c.id); setShowChildDropdown(false) }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeId === c.id ? 'bg-kids-orange/10' : 'hover:bg-gray-50'}`}>
                    {c.photoUrl
                      ? <img src={c.photoUrl} className="w-9 h-9 rounded-full object-cover" />
                      : <span className="text-2xl">{c.avatarEmoji}</span>
                    }
                    <div className="flex-1 text-left">
                      <p className="font-bold text-gray-800">{c.name}</p>
                      <p className="text-xs text-gray-400">Niv. {c.level} · {c.xp} XP · {c.streakDays}j</p>
                    </div>
                    {activeId === c.id && <span className="text-kids-orange font-bold">✓</span>}
                    <button onClick={e => { e.stopPropagation(); setConfirmDeleteId(c.id) }}
                      className="w-6 h-6 bg-red-100 text-red-400 rounded-full text-xs flex items-center justify-center">✕</button>
                  </button>
                ))}
                <button onClick={() => { setShowAddChild(true); setShowChildDropdown(false) }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-kids-teal font-bold hover:bg-gray-50">
                  <span className="w-9 h-9 border-2 border-dashed border-kids-teal rounded-full flex items-center justify-center text-lg">+</span>
                  Ajouter un enfant
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Click outside to close dropdown */}
      {showChildDropdown && <div className="fixed inset-0 z-30" onClick={() => setShowChildDropdown(false)} />}

      {/* Main content */}
      <div className="p-4 max-w-md mx-auto">
        {/* Confirm delete child */}
        {confirmDeleteId && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 shadow-md mb-4">
            <p className="font-bold text-red-700 mb-3">⚠️ Supprimer cet enfant ? Toutes ses données seront perdues.</p>
            <div className="flex gap-2">
              <button onClick={() => deleteChild(confirmDeleteId)} className="flex-1 bg-red-500 text-white font-bold py-2 rounded-xl">Supprimer</button>
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-2 rounded-xl">Annuler</button>
            </div>
          </motion.div>
        )}

        {/* Add child form */}
        {showAddChild && (
          <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            onSubmit={addChild} className="bg-white rounded-2xl p-4 shadow-md mb-4 space-y-3">
            <h3 className="font-black text-gray-800 text-base">👶 Nouvel enfant</h3>
            <PhotoPicker
              photoUrl={newChildForm.photoUrl || undefined}
              onPhotoChange={url => setNewChildForm(f => ({ ...f, photoUrl: url ?? '' }))}
            />
            <input autoFocus type="text" placeholder="Prénom *" value={newChildForm.name}
              onChange={e => setNewChildForm(f => ({ ...f, name: e.target.value }))}
              className="w-full p-3 border-2 border-gray-200 rounded-xl font-semibold focus:border-kids-orange focus:outline-none" required />
            <div className="flex gap-2">
              <button type="button"
                onClick={() => setNewChildForm(f => ({ ...f, sex: f.sex === 'GARCON' ? '' : 'GARCON' }))}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition-colors ${newChildForm.sex === 'GARCON' ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-white border-gray-200 text-gray-500'}`}>
                👦 Garçon
              </button>
              <button type="button"
                onClick={() => setNewChildForm(f => ({ ...f, sex: f.sex === 'FILLE' ? '' : 'FILLE' }))}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition-colors ${newChildForm.sex === 'FILLE' ? 'bg-pink-100 border-pink-400 text-pink-700' : 'bg-white border-gray-200 text-gray-500'}`}>
                👧 Fille
              </button>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-500 mb-1 block">Date de naissance</label>
                <input type="date" value={newChildForm.birthDate}
                  onChange={e => setNewChildForm(f => ({ ...f, birthDate: e.target.value }))}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl font-semibold focus:border-kids-orange focus:outline-none" />
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-500 mb-1 block">Classe</label>
                <input type="text" placeholder="Ex: CM1" value={newChildForm.classe}
                  onChange={e => setNewChildForm(f => ({ ...f, classe: e.target.value }))}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl font-semibold focus:border-kids-orange focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-kids-teal text-white font-bold py-3 rounded-xl">✓ Ajouter</button>
              <button type="button" onClick={() => setShowAddChild(false)} className="px-4 bg-gray-100 text-gray-500 font-bold rounded-xl">✕</button>
            </div>
          </motion.form>
        )}

        {/* Child profile compact (visible on all tabs) */}
        {activeChild && navTab === 'habitudes' && (
          <div className="bg-white rounded-2xl p-3 shadow-sm mb-4 flex items-center gap-3">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEditingAvatar(v => !v)}>
              {activeChild.photoUrl
                ? <img src={activeChild.photoUrl} className="w-12 h-12 rounded-full object-cover border-2 border-kids-orange" />
                : <span className="text-3xl">{activeChild.avatarEmoji}</span>
              }
            </motion.button>
            <div className="flex-1 min-w-0">
              <p className="font-black text-gray-800">{activeChild.name}</p>
              <p className="text-xs text-gray-400">Niv. {activeChild.level} · {activeChild.xp} XP · {activeChild.streakDays}j</p>
            </div>
            <button onClick={() => setEditingAvatar(v => !v)}
              className="text-xs text-kids-blue font-bold px-2 py-1 rounded-lg bg-blue-50">
              {editingAvatar ? '✓' : '📷'}
            </button>
            <button onClick={() => navigate('/child')}
              className="text-xs text-kids-orange font-bold px-2 py-1 rounded-lg bg-orange-50">
              Vue enfant
            </button>
          </div>
        )}

        {/* Photo editor */}
        {editingAvatar && activeChild && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-4 shadow-md mb-4">
            <PhotoPicker
              photoUrl={activeChild.photoUrl}
              onPhotoChange={async (url) => {
                try {
                  await api.patch(`/children/${activeChild.id}`, { photoUrl: url ?? null })
                  if (url) setChildPhoto(activeChild.id, url)
                  else removeChildPhoto(activeChild.id)
                  setChildren(prev => prev.map(c => c.id === activeChild.id ? { ...c, photoUrl: url ?? undefined } : c))
                  setEditingAvatar(false)
                } catch {
                  alert('❌ Erreur : photo non sauvegardée. Vérifiez votre connexion.')
                }
              }}
            />
          </motion.div>
        )}

        {/* Tab content */}
        {children.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-5xl mb-3">👶</p>
            <p className="font-bold text-gray-500 mb-4">Ajoutez votre premier enfant !</p>
            <button onClick={() => setShowAddChild(true)}
              className="bg-kids-teal text-white font-bold px-6 py-3 rounded-2xl">
              + Ajouter un enfant
            </button>
          </div>
        ) : (
          <>
            {navTab === 'accueil' && <AccueilTab />}
            {navTab === 'habitudes' && <HabitudesTab />}
            {navTab === 'recompenses' && <RecompensesTab />}
            {navTab === 'profil' && <ProfilTab />}
          </>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex items-center justify-around max-w-md mx-auto px-2 py-1">
          {[
            { id: 'accueil',      icon: '🏠', label: 'Accueil' },
            { id: 'habitudes',    icon: '📋', label: 'Habitudes' },
          ].map(item => (
            <button key={item.id} onClick={() => setNavTab(item.id as any)}
              className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all ${navTab === item.id ? 'text-kids-orange' : 'text-gray-400'}`}>
              <span className="text-xl">{item.icon}</span>
              <span className={`text-xs font-bold mt-0.5 ${navTab === item.id ? 'text-kids-orange' : 'text-gray-400'}`}>{item.label}</span>
            </button>
          ))}

          {/* Center + button */}
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={() => setShowSuggestions(true)}
            className="w-14 h-14 bg-kids-orange rounded-full flex items-center justify-center shadow-lg text-white text-3xl font-black -mt-5 border-4 border-white">
            +
          </motion.button>

          {[
            { id: 'recompenses', icon: '🎁', label: 'Récompenses' },
            { id: 'profil',      icon: '👤', label: 'Profil' },
          ].map(item => (
            <button key={item.id} onClick={() => setNavTab(item.id as any)}
              className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all ${navTab === item.id ? 'text-kids-orange' : 'text-gray-400'}`}>
              <span className="text-xl">{item.icon}</span>
              <span className={`text-xs font-bold mt-0.5 ${navTab === item.id ? 'text-kids-orange' : 'text-gray-400'}`}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
