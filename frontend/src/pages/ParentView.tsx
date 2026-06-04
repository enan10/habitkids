import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, Reorder, useDragControls } from 'framer-motion'
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
]

function getCategoryInfo(id: string) {
  return CATEGORIES.find(c => c.id === id) ?? CATEGORIES[0]
}

function HabitRow({ habit, onDragEnd, onDelete }: {
  habit: any
  onDragEnd: () => void
  onDelete: () => void
}) {
  const controls = useDragControls()
  const cat = getCategoryInfo(habit.category || 'GENERAL')
  return (
    <Reorder.Item
      value={habit}
      dragControls={controls}
      dragListener={false}
      onDragEnd={onDragEnd}
      className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3"
    >
      <span
        className="text-gray-300 text-lg select-none cursor-grab active:cursor-grabbing touch-none px-1"
        onPointerDown={(e) => controls.start(e)}
      >⠿</span>
      <span className="text-2xl">{habit.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-800 truncate">{habit.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {cat.emoji} {cat.label}
          </span>
          <span className="text-xs text-gray-500">
            ⭐ {habit.pointValue} ·{' '}
            {(habit.daysOfWeek ?? []).length === 7
              ? 'Quotidien'
              : (habit.daysOfWeek ?? [])
                  .sort((a: number, b: number) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
                  .map((d: number) => ['Di','Lu','Ma','Me','Je','Ve','Sa'][d])
                  .join(' ')}
          </span>
        </div>
      </div>
      <button onClick={onDelete} className="text-red-400 hover:text-red-600 font-bold p-2 text-xl">🗑️</button>
    </Reorder.Item>
  )
}

export default function ParentView() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const isPremium = user?.plan === 'PREMIUM'
  const [children, setChildren] = useState<Child[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [tab, setTab] = useState<'habits' | 'stats' | 'rewards' | 'notifications'>('habits')
  const [showAddChild, setShowAddChild] = useState(false)
  const [showHabitForm, setShowHabitForm] = useState(false)
  const [newChildForm, setNewChildForm] = useState({ name: '', classe: '', birthDate: '', photoUrl: '' })
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [rewardForm, setRewardForm] = useState({ title: '', emoji: '🎁', pointCost: 50 })
  const [showRewardForm, setShowRewardForm] = useState(false)
  const [editingAvatar, setEditingAvatar] = useState(false)
  const [habitsList, setHabitsList] = useState<any[]>([])
  const habitsListRef = useRef<any[]>([])
  const [habitsView, setHabitsView] = useState<'list' | 'parjour'>('list')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestCatFilter, setSuggestCatFilter] = useState<string>('ALL')
  const [addingPreset, setAddingPreset] = useState<string | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [addForDay, setAddForDay] = useState<number | null>(null)

  const fetchChildren = async () => {
    const res = await api.get('/children')
    const merged = mergePhotos(res.data as Child[])
    setChildren(merged)
    if (!activeId && merged.length > 0) setActiveId(merged[0].id)
  }

  const fetchRewards = async (childId: string) => {
    const res = await api.get(`/rewards/${childId}`)
    setRewards(res.data)
  }

  useEffect(() => { fetchChildren() }, [])

  useEffect(() => {
    const habits = activeChild?.habits ?? []
    setHabitsList(habits)
    habitsListRef.current = habits
  }, [activeId, children])

  const saveHabitOrder = async (newList: any[]) => {
    await Promise.all(newList.map((h, i) => api.patch(`/habits/${h.id}`, { order: i })))
    fetchChildren()
  }

  useEffect(() => {
    if (activeId && tab === 'rewards') fetchRewards(activeId)
  }, [activeId, tab])

  const activeChild = children.find(c => c.id === activeId)

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

  const addChild = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await api.post('/children', {
      name: newChildForm.name,
      avatarEmoji: '🧒',
      avatarColor: '#FF6B6B',
      classe: newChildForm.classe || undefined,
      birthDate: newChildForm.birthDate || undefined,
      photoUrl: newChildForm.photoUrl || undefined,
    })
    if (newChildForm.photoUrl && res.data?.id) {
      setChildPhoto(res.data.id, newChildForm.photoUrl)
    }
    setNewChildForm({ name: '', classe: '', birthDate: '', photoUrl: '' })
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
      const frequency = newDays.length === 7 ? 'DAILY' : 'WEEKLY'
      await api.patch(`/habits/${habitId}`, { daysOfWeek: newDays, frequency })
    }
    fetchChildren()
  }

  const addPresetHabit = async (preset: typeof PRESET_HABITS[0]) => {
    if (!activeId) return
    setAddingPreset(preset.title)
    try {
      // If adding from a specific day, use only that day
      const daysOfWeek = addForDay !== null ? [addForDay] : preset.daysOfWeek
      const frequency = daysOfWeek.length === 7 ? 'DAILY' : 'WEEKLY'
      await api.post('/habits', { ...preset, daysOfWeek, frequency, childId: activeId })
      fetchChildren()
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

  const unlockReward = async (rewardId: string) => {
    await api.post(`/rewards/${rewardId}/unlock`)
    if (activeId) fetchRewards(activeId)
  }

  const TABS = [
    { id: 'habits',        label: '📋 Habitudes' },
    { id: 'rewards',       label: '🎁 Récompenses' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      {/* Header simplifié */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-base font-black text-gray-800">Espace Parent</h1>
            <p className="text-xs text-gray-400 font-semibold">{user?.name}</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/child')}
            className="bg-kids-orange text-white font-bold px-4 py-2 rounded-xl text-sm">
            Vue enfant
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={logout}
            className="bg-gray-100 text-gray-600 font-bold px-3 py-2 rounded-xl text-sm">
            🚪
          </motion.button>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto">
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {children.map(child => (
            <div key={child.id} className="relative flex-shrink-0">
              <button onClick={() => setActiveId(child.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                  activeId === child.id ? 'bg-kids-orange text-white shadow-md' : 'bg-white text-gray-600 border-2 border-gray-200'
                }`}>
                {child.photoUrl
                  ? <img src={child.photoUrl} className="w-6 h-6 rounded-full object-cover" />
                  : <span>{child.avatarEmoji}</span>
                }
                {child.name}
              </button>
              {activeId === child.id && (
                <button onClick={() => setConfirmDeleteId(child.id)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow">
                  ✕
                </button>
              )}
            </div>
          ))}
          <button onClick={() => setShowAddChild(true)}
            className="flex items-center gap-1 px-4 py-2 rounded-full font-bold text-sm bg-white text-kids-teal border-2 border-kids-teal whitespace-nowrap">
            + Enfant
          </button>
        </div>

        {confirmDeleteId && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 shadow-md mb-4">
            <p className="font-bold text-red-700 mb-3">⚠️ Supprimer cet enfant ? Toutes ses habitudes et données seront perdues.</p>
            <div className="flex gap-2">
              <button onClick={() => deleteChild(confirmDeleteId)}
                className="flex-1 bg-red-500 text-white font-bold py-2 rounded-xl">Supprimer</button>
              <button onClick={() => setConfirmDeleteId(null)}
                className="flex-1 bg-gray-100 text-gray-600 font-bold py-2 rounded-xl">Annuler</button>
            </div>
          </motion.div>
        )}

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
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-500 mb-1 block">Date de naissance</label>
                <input type="date" value={newChildForm.birthDate}
                  onChange={e => setNewChildForm(f => ({ ...f, birthDate: e.target.value }))}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl font-semibold focus:border-kids-orange focus:outline-none" />
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-500 mb-1 block">Classe</label>
                <input type="text" placeholder="Ex: CM1, 6ème…" value={newChildForm.classe}
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

        {activeChild && (
          <>
            <div className="flex gap-2 mb-4">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id as any)}
                  className={`flex-1 py-3 rounded-2xl text-sm font-black transition-all ${
                    tab === t.id
                      ? 'bg-kids-orange text-white shadow-md'
                      : 'bg-white text-gray-500 shadow-sm'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Profil enfant compact */}
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
              <div className="flex items-center gap-3">
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEditingAvatar(v => !v)}>
                  {activeChild.photoUrl
                    ? <img src={activeChild.photoUrl} className="w-14 h-14 rounded-full object-cover border-2 border-kids-orange" />
                    : <span className="text-4xl">{activeChild.avatarEmoji}</span>
                  }
                </motion.button>
                <div className="flex-1 min-w-0">
                  <h2 className="font-black text-gray-800 text-base">{activeChild.name}</h2>
                  <p className="text-xs text-gray-400 font-semibold">
                    Niv. {activeChild.level} · {activeChild.xp} XP · {activeChild.streakDays}j
                    {activeChild.classe ? ` · ${activeChild.classe}` : ''}
                  </p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <button onClick={() => setEditingAvatar(v => !v)}
                    className="text-xs text-kids-blue font-bold px-2 py-1 rounded-lg bg-blue-50">
                    {editingAvatar ? '✓ Fermer' : '📷 Photo'}
                  </button>
                  <button onClick={() => setTab('stats' as any)}
                    className="text-xs text-gray-400 font-bold px-2 py-1 rounded-lg bg-gray-50">
                    📊 Stats
                  </button>
                  <button onClick={() => setTab('notifications' as any)}
                    className="text-xs text-gray-400 font-bold px-2 py-1 rounded-lg bg-gray-50">
                    🔔 Rappels
                  </button>
                </div>
              </div>
              {editingAvatar && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <PhotoPicker
                    photoUrl={activeChild.photoUrl}
                    onPhotoChange={async (url) => {
                      try {
                        await api.patch(`/children/${activeChild.id}`, { photoUrl: url ?? null })
                        if (url) setChildPhoto(activeChild.id, url)
                        else removeChildPhoto(activeChild.id)
                        setChildren(prev => prev.map(c =>
                          c.id === activeChild.id ? { ...c, photoUrl: url ?? undefined } : c
                        ))
                        setEditingAvatar(false)
                      } catch {
                        alert('❌ Erreur : photo non sauvegardée. Vérifiez votre connexion.')
                      }
                    }}
                  />
                </div>
              )}
            </div>

            {tab === 'habits' && (
              <div>
                {/* Header row */}
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
                      onClick={() => { setAddForDay(null); setShowSuggestions(v => !v); setShowHabitForm(false) }}
                      className="bg-kids-teal text-white font-black px-5 py-2 rounded-xl text-sm shadow-md">
                      + Ajouter
                    </motion.button>
                  </div>
                </div>

                {/* Add panel: suggestions */}
                {showSuggestions && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-orange-50 border-2 border-kids-orange/30 rounded-2xl p-4 mb-4">
                    {addForDay !== null && (
                      <div className="flex items-center gap-2 mb-3 bg-kids-blue/10 rounded-xl px-3 py-2">
                        <span className="w-7 h-7 bg-kids-blue text-white text-xs font-black rounded-full flex items-center justify-center">
                          {WEEK_DAYS.find(d => d.day === addForDay)?.short}
                        </span>
                        <span className="text-sm font-bold text-kids-blue">
                          Habitude pour {WEEK_DAYS.find(d => d.day === addForDay)?.label} uniquement
                        </span>
                        <button onClick={() => setAddForDay(null)} className="ml-auto text-xs text-gray-400 font-bold">Tous les jours</button>
                      </div>
                    )}

                    {/* Header panel */}
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold text-gray-700 text-sm">💡 Suggestions d'habitudes</span>
                      <button
                        onClick={() => { setShowSuggestions(false); setShowHabitForm(false) }}
                        className="px-3 py-2 bg-white text-gray-400 border-2 border-gray-200 rounded-xl font-bold text-sm">
                        ✕
                      </button>
                    </div>

                    {/* Suggestions list */}
                    <>
                        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
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
                        <div className="space-y-1.5 max-h-72 overflow-y-auto">
                          {PRESET_HABITS
                            .filter(p => suggestCatFilter === 'ALL' || p.category === suggestCatFilter)
                            .map(preset => {
                              const cat = getCategoryInfo(preset.category)
                              const alreadyAdded = (activeChild.habits ?? []).some((h: any) => h.title === preset.title)
                              return (
                                <div key={preset.title}
                                  className={`flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 shadow-sm ${alreadyAdded ? 'opacity-50' : ''}`}>
                                  <span className="text-xl">{preset.emoji}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-800 text-sm truncate">{preset.title}</p>
                                    <p className="text-xs text-gray-400">{cat.emoji} {cat.label} · ⭐ {preset.pointValue} pts</p>
                                  </div>
                                  {alreadyAdded ? (
                                    <span className="text-green-400 font-bold">✓</span>
                                  ) : (
                                    <motion.button whileTap={{ scale: 0.9 }}
                                      disabled={addingPreset === preset.title}
                                      onClick={() => addPresetHabit(preset)}
                                      className="w-8 h-8 rounded-full bg-kids-teal text-white font-black text-lg flex items-center justify-center shadow disabled:opacity-50">
                                      {addingPreset === preset.title ? '⏳' : '+'}
                                    </motion.button>
                                  )}
                                </div>
                              )
                            })}
                        </div>
                    </>

                  </motion.div>
                )}

                {/* Category filter chips */}
                {usedCategories.length > 1 && (
                  <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                    <button
                      onClick={() => setCategoryFilter('ALL')}
                      className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold border-2 transition-all ${
                        categoryFilter === 'ALL' ? 'bg-gray-700 text-white border-gray-700' : 'bg-white text-gray-500 border-gray-200'
                      }`}
                    >
                      Tous
                    </button>
                    {usedCategories.map(catId => {
                      const cat = getCategoryInfo(catId)
                      return (
                        <button
                          key={catId}
                          onClick={() => setCategoryFilter(catId)}
                          className={`flex-shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border-2 transition-all ${
                            categoryFilter === catId ? 'bg-kids-blue text-white border-kids-blue' : 'bg-white text-gray-500 border-gray-200'
                          }`}
                        >
                          {cat.emoji} {cat.label}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* List view */}
                {habitsView === 'list' && (
                  <Reorder.Group
                    axis="y"
                    values={filteredHabits}
                    onReorder={newList => {
                      setHabitsList(newList)
                      habitsListRef.current = newList
                    }}
                    className="space-y-2"
                  >
                    {filteredHabits.map(habit => (
                      <HabitRow
                        key={habit.id}
                        habit={habit}
                        onDragEnd={() => saveHabitOrder(habitsListRef.current)}
                        onDelete={() => deleteHabit(habit.id)}
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
                            <span className="w-7 h-7 bg-kids-blue text-white text-xs font-black rounded-full flex items-center justify-center">
                              {short}
                            </span>
                            <span className="font-bold text-gray-700 text-sm">{label}</span>
                            <span className="text-xs text-gray-400 font-semibold">{dayHabits.length} habitude{dayHabits.length !== 1 ? 's' : ''}</span>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                setAddForDay(day)
                                setShowSuggestions(true)
                                setShowHabitForm(false)
                                window.scrollTo({ top: 0, behavior: 'smooth' })
                              }}
                              className="ml-auto w-7 h-7 bg-kids-teal text-white font-black text-base rounded-full flex items-center justify-center shadow-sm">
                              +
                            </motion.button>
                          </div>
                          {dayHabits.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-gray-400 italic">Aucune habitude ce jour</p>
                          ) : (
                            <div className="divide-y divide-gray-50">
                              {dayHabits.map((habit: any) => {
                                const cat = getCategoryInfo(habit.category || 'GENERAL')
                                return (
                                  <div key={habit.id} className="flex items-center gap-3 px-4 py-2.5">
                                    <span className="text-xl">{habit.emoji}</span>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-bold text-gray-800 text-sm truncate">{habit.title}</p>
                                      <span className="text-xs text-gray-400">{cat.emoji} {cat.label} · ⭐ {habit.pointValue}</span>
                                    </div>
                                    <button onClick={() => removeHabitFromDay(habit.id, day, habit.daysOfWeek ?? [])} className="text-red-300 hover:text-red-500 p-1">🗑️</button>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

              </div>
            )}

            {tab === 'stats' && (
              <StatsView
                childId={activeChild.id}
                childName={activeChild.name}
                isPremium={isPremium}
                onUpgrade={() => setShowUpgrade(true)}
              />
            )}
            {tab === 'notifications' && <NotificationSettings childId={activeChild.id} />}

            {tab === 'rewards' && (
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
                </div>
              </div>
            )}
          </>
        )}

        {children.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">👶</div>
            <p className="font-bold text-gray-500">Ajoutez votre premier enfant !</p>
          </div>
        )}
      </div>
    </div>
  )
}
