import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, Reorder } from 'framer-motion'
import api from '../api/client'
import { useAuthStore } from '../store/useStore'
import HabitForm from '../components/parent/HabitForm'
import StatsView from '../components/parent/StatsView'
import AvatarPicker from '../components/parent/AvatarPicker'
import NotificationSettings from '../components/parent/NotificationSettings'

interface Child {
  id: string
  name: string
  avatarEmoji: string
  avatarColor: string
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

export default function ParentView() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [children, setChildren] = useState<Child[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [tab, setTab] = useState<'habits' | 'stats' | 'rewards' | 'notifications'>('habits')
  const [showAddChild, setShowAddChild] = useState(false)
  const [showHabitForm, setShowHabitForm] = useState(false)
  const [newChildName, setNewChildName] = useState('')
  const [rewards, setRewards] = useState<Reward[]>([])
  const [rewardForm, setRewardForm] = useState({ title: '', emoji: '🎁', pointCost: 50 })
  const [showRewardForm, setShowRewardForm] = useState(false)
  const [editingAvatar, setEditingAvatar] = useState(false)
  const [habitsList, setHabitsList] = useState<any[]>([])
  const habitsListRef = useRef<any[]>([])

  const fetchChildren = async () => {
    const res = await api.get('/children')
    setChildren(res.data)
    if (!activeId && res.data.length > 0) setActiveId(res.data[0].id)
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
  }

  useEffect(() => {
    if (activeId && tab === 'rewards') fetchRewards(activeId)
  }, [activeId, tab])

  const activeChild = children.find(c => c.id === activeId)

  const addChild = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.post('/children', { name: newChildName, avatarEmoji: '🧒', avatarColor: '#FF6B6B' })
    setNewChildName('')
    setShowAddChild(false)
    fetchChildren()
  }

  const deleteHabit = async (habitId: string) => {
    await api.delete(`/habits/${habitId}`)
    fetchChildren()
  }

  const addReward = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.post('/rewards', { ...rewardForm, childId: activeId, type: 'PHYSICAL' })
    setRewardForm({ title: '', emoji: '🎁', pointCost: 50 })
    setShowRewardForm(false)
    if (activeId) fetchRewards(activeId)
  }

  const unlockReward = async (rewardId: string) => {
    await api.post(`/rewards/${rewardId}/unlock`)
    if (activeId) fetchRewards(activeId)
  }

  const TABS = [
    { id: 'habits',        label: '📋 Habitudes' },
    { id: 'stats',         label: '📊 Stats' },
    { id: 'rewards',       label: '🎁 Récompenses' },
    { id: 'notifications', label: '🔔 Rappels' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-gray-800">👨‍👩‍👧 Espace Parent</h1>
          <p className="text-sm text-gray-500 font-semibold">{user?.name}</p>
        </div>
        <div className="flex gap-2">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/child')}
            className="bg-kids-orange text-white font-bold px-4 py-2 rounded-xl text-sm">
            👶 Vue enfant
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
            <button key={child.id} onClick={() => setActiveId(child.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                activeId === child.id ? 'bg-kids-orange text-white shadow-md' : 'bg-white text-gray-600 border-2 border-gray-200'
              }`}>
              {child.avatarEmoji} {child.name}
            </button>
          ))}
          <button onClick={() => setShowAddChild(true)}
            className="flex items-center gap-1 px-4 py-2 rounded-full font-bold text-sm bg-white text-kids-teal border-2 border-kids-teal whitespace-nowrap">
            + Enfant
          </button>
        </div>

        {showAddChild && (
          <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            onSubmit={addChild} className="bg-white rounded-2xl p-4 shadow-md mb-4 flex gap-2">
            <input autoFocus type="text" placeholder="Prénom de l'enfant" value={newChildName}
              onChange={e => setNewChildName(e.target.value)}
              className="flex-1 p-3 border-2 border-gray-200 rounded-xl font-semibold focus:border-kids-orange focus:outline-none" required />
            <button type="submit" className="bg-kids-teal text-white font-bold px-4 rounded-xl">✓</button>
            <button type="button" onClick={() => setShowAddChild(false)} className="bg-gray-100 text-gray-500 font-bold px-3 rounded-xl">✕</button>
          </motion.form>
        )}

        {activeChild && (
          <>
            <div className="flex gap-1 bg-gray-200 rounded-2xl p-1 mb-4">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id as any)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === t.id ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
              <div className="flex items-center gap-4 mb-3">
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEditingAvatar(v => !v)}
                  className="text-4xl" title="Modifier l'avatar">
                  {activeChild.avatarEmoji}
                </motion.button>
                <div className="flex-1">
                  <h2 className="font-black text-gray-800 text-lg">{activeChild.name}</h2>
                  <div className="flex gap-3 text-sm font-semibold text-gray-500">
                    <span>🏆 Niv. {activeChild.level}</span>
                    <span>⭐ {activeChild.xp} XP</span>
                    <span>🔥 {activeChild.streakDays}j</span>
                  </div>
                </div>
                <button onClick={() => setEditingAvatar(v => !v)}
                  className="text-sm text-kids-blue font-bold px-3 py-1 rounded-xl bg-blue-50">
                  {editingAvatar ? '✓ Fermer' : '✏️ Avatar'}
                </button>
              </div>
              {editingAvatar && (
                <AvatarPicker
                  emoji={activeChild.avatarEmoji}
                  color={activeChild.avatarColor}
                  onChange={async (emoji, color) => {
                    await api.patch(`/children/${activeChild.id}`, { avatarEmoji: emoji, avatarColor: color })
                    fetchChildren()
                  }}
                />
              )}
            </div>

            {tab === 'habits' && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-black text-gray-700">Habitudes ({activeChild.habits?.length ?? 0}/5)</h3>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowHabitForm(true)}
                    className="bg-kids-teal text-white font-bold px-4 py-2 rounded-xl text-sm">
                    + Ajouter
                  </motion.button>
                </div>
                <Reorder.Group
                  axis="y"
                  values={habitsList}
                  onReorder={newList => {
                    setHabitsList(newList)
                    habitsListRef.current = newList
                  }}
                  className="space-y-2"
                >
                  {habitsList.map(habit => (
                    <Reorder.Item
                      key={habit.id}
                      value={habit}
                      onDragEnd={() => saveHabitOrder(habitsListRef.current)}
                      className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3 cursor-grab active:cursor-grabbing"
                    >
                      <span className="text-gray-300 text-lg select-none">⠿</span>
                      <span className="text-2xl">{habit.emoji}</span>
                      <div className="flex-1">
                        <p className="font-bold text-gray-800">{habit.title}</p>
                        <p className="text-sm text-gray-500">
                          ⭐ {habit.pointValue} pts ·{' '}
                          {habit.frequency === 'DAILY'
                            ? 'Quotidien'
                            : habit.daysOfWeek?.length === 7
                            ? 'Hebdo (tous les jours)'
                            : `Hebdo (${(habit.daysOfWeek ?? [])
                                .sort((a: number, b: number) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
                                .map((d: number) => ['D','L','M','M','J','V','S'][d])
                                .join(' ')})`}
                        </p>
                      </div>
                      <button onClick={() => deleteHabit(habit.id)} className="text-red-400 hover:text-red-600 font-bold p-2 text-xl">🗑️</button>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
                {showHabitForm && (
                  <HabitForm childId={activeChild.id} onSave={() => { setShowHabitForm(false); fetchChildren() }} onCancel={() => setShowHabitForm(false)} />
                )}
              </div>
            )}

            {tab === 'stats' && <StatsView childId={activeChild.id} />}
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
