import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, Reorder, useDragControls, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import api from '../api/client'
import { useAuthStore } from '../store/useStore'
import HabitForm, { CATEGORIES, HabitDefaults } from '../components/parent/HabitForm'
import StatsView from '../components/parent/StatsView'
import PhotoPicker from '../components/parent/PhotoPicker'
import { mergePhotos, setChildPhoto, removeChildPhoto } from '../utils/childPhotos'
import NotificationSettings from '../components/parent/NotificationSettings'
import UpgradeModal from '../components/parent/UpgradeModal'
import { setLanguage } from '../i18n'
import { habitTitle } from '../utils/habitTitle'

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

const SKILLS = [
  { id: 'autonomie',  label: 'Autonomie',  emoji: '🧠', color: '#54A0FF', bg: 'bg-blue-100',   bar: 'bg-blue-400'   },
  { id: 'discipline', label: 'Discipline', emoji: '💪', color: '#1DD1A1', bg: 'bg-teal-100',   bar: 'bg-teal-400'   },
  { id: 'savoir',     label: 'Savoir',     emoji: '📚', color: '#FF9F43', bg: 'bg-orange-100', bar: 'bg-orange-400' },
  { id: 'empathie',   label: 'Empathie',   emoji: '❤️', color: '#FF6B6B', bg: 'bg-red-100',    bar: 'bg-red-400'    },
  { id: 'respect',    label: 'Respect',    emoji: '🤝', color: '#A29BFE', bg: 'bg-purple-100', bar: 'bg-purple-400' },
]

const CATEGORY_SKILLS: Record<string, string[]> = {
  HYGIENE:      ['autonomie', 'discipline'],
  EDUCATION:    ['savoir', 'discipline'],
  SPORT:        ['discipline', 'autonomie'],
  ALIMENTATION: ['autonomie', 'discipline'],
  SOMMEIL:      ['discipline'],
  CREATIVITE:   ['autonomie', 'savoir'],
  MENAGE:       ['autonomie', 'respect'],
  AUTONOMIE:    ['autonomie'],
  NATURE:       ['respect', 'empathie'],
  SOCIAL:       ['empathie', 'respect'],
  SECURITE:     ['discipline', 'autonomie'],
  GENERAL:      ['discipline'],
}

const WEEK_DAYS = [
  { tKey: 'days.monday',    shortKey: 'days.short_1', day: 1 },
  { tKey: 'days.tuesday',   shortKey: 'days.short_2', day: 2 },
  { tKey: 'days.wednesday', shortKey: 'days.short_3', day: 3 },
  { tKey: 'days.thursday',  shortKey: 'days.short_4', day: 4 },
  { tKey: 'days.friday',    shortKey: 'days.short_5', day: 5 },
  { tKey: 'days.saturday',  shortKey: 'days.short_6', day: 6 },
  { tKey: 'days.sunday',    shortKey: 'days.short_0', day: 0 },
]

const PRESET_HABITS = [
  { tKey: 'presets.brush_teeth',           emoji: '🦷', category: 'HYGIENE',      color: '#54A0FF', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.wash_hands',            emoji: '🧼', category: 'HYGIENE',      color: '#54A0FF', pointValue: 5,  daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.shower',               emoji: '🚿', category: 'HYGIENE',      color: '#54A0FF', pointValue: 15, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.comb_hair',            emoji: '💇', category: 'HYGIENE',      color: '#54A0FF', pointValue: 5,  daysOfWeek: [1,2,3,4,5] },
  { tKey: 'presets.take_medicine',        emoji: '💊', category: 'HYGIENE',      color: '#54A0FF', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.wear_slippers',        emoji: '🩴', category: 'HYGIENE',      color: '#54A0FF', pointValue: 5,  daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.read_15min',           emoji: '📖', category: 'EDUCATION',    color: '#FF9F43', pointValue: 15, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.do_homework',          emoji: '📚', category: 'EDUCATION',    color: '#FF9F43', pointValue: 20, daysOfWeek: [1,2,3,4,5] },
  { tKey: 'presets.study_lessons',        emoji: '✏️', category: 'EDUCATION',    color: '#FF9F43', pointValue: 15, daysOfWeek: [1,2,3,4,5] },
  { tKey: 'presets.learn_word',           emoji: '🔤', category: 'EDUCATION',    color: '#FF9F43', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.sport_30min',          emoji: '🏃', category: 'SPORT',        color: '#1DD1A1', pointValue: 20, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.walk_10min',           emoji: '🚶', category: 'SPORT',        color: '#1DD1A1', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.stretching',           emoji: '🧘', category: 'SPORT',        color: '#1DD1A1', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.eat_vegetables',       emoji: '🥗', category: 'ALIMENTATION', color: '#FECA57', pointValue: 15, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.drink_water',          emoji: '💧', category: 'ALIMENTATION', color: '#FECA57', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.eat_breakfast',        emoji: '🥣', category: 'ALIMENTATION', color: '#FECA57', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.limit_sweets',         emoji: '🍬', category: 'ALIMENTATION', color: '#FECA57', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.sleep_ontime',         emoji: '😴', category: 'SOMMEIL',      color: '#5F27CD', pointValue: 15, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.wake_up_early',        emoji: '🌅', category: 'SOMMEIL',      color: '#5F27CD', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.no_screens_8pm',       emoji: '📵', category: 'SOMMEIL',      color: '#5F27CD', pointValue: 15, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.draw_color',           emoji: '🎨', category: 'CREATIVITE',   color: '#FF6B6B', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.play_instrument',      emoji: '🎵', category: 'CREATIVITE',   color: '#FF6B6B', pointValue: 15, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.make_bed',             emoji: '🛏️', category: 'MENAGE',       color: '#48DBFB', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.tidy_room',            emoji: '🧹', category: 'MENAGE',       color: '#48DBFB', pointValue: 15, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.fold_clothes',         emoji: '👕', category: 'MENAGE',       color: '#48DBFB', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.help_parents',         emoji: '🏠', category: 'MENAGE',       color: '#48DBFB', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.set_table',            emoji: '🍽️', category: 'MENAGE',       color: '#48DBFB', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.water_plants',         emoji: '🌿', category: 'NATURE',       color: '#1DD1A1', pointValue: 10, daysOfWeek: [1,3,5] },
  { tKey: 'presets.go_outside',           emoji: '🌳', category: 'NATURE',       color: '#1DD1A1', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.respect_nature',       emoji: '🌍', category: 'NATURE',       color: '#1DD1A1', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.throw_trash',          emoji: '🗑️', category: 'NATURE',       color: '#1DD1A1', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.say_please_thanks',    emoji: '🙏', category: 'SOCIAL',       color: '#FF9FF3', pointValue: 5,  daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.greet_adults',         emoji: '🤝', category: 'SOCIAL',       color: '#FF9FF3', pointValue: 5,  daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.wait_turn',            emoji: '🤫', category: 'SOCIAL',       color: '#FF9FF3', pointValue: 5,  daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.express_listen',       emoji: '💬', category: 'SOCIAL',       color: '#FF9FF3', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.give_seat',            emoji: '🧓', category: 'SOCIAL',       color: '#FF9FF3', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.call_family',          emoji: '📞', category: 'SOCIAL',       color: '#FF9FF3', pointValue: 10, daysOfWeek: [0,6] },
  { tKey: 'presets.use_crosswalk',        emoji: '🚸', category: 'SECURITE',     color: '#EE5A24', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.no_electricity_gas',   emoji: '⚡', category: 'SECURITE',     color: '#EE5A24', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.avoid_danger',         emoji: '⚠️', category: 'SECURITE',     color: '#EE5A24', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.no_lean_window',       emoji: '🪟', category: 'SECURITE',     color: '#EE5A24', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.no_play_street',       emoji: '🛑', category: 'SECURITE',     color: '#EE5A24', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.prepare_alone_morning',emoji: '🌅', category: 'AUTONOMIE',    color: '#6C5CE7', pointValue: 20, daysOfWeek: [1,2,3,4,5] },
  { tKey: 'presets.prep_bag',             emoji: '🎒', category: 'AUTONOMIE',    color: '#6C5CE7', pointValue: 15, daysOfWeek: [1,2,3,4] },
  { tKey: 'presets.dress_alone',          emoji: '👕', category: 'AUTONOMIE',    color: '#6C5CE7', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.choose_outfit',        emoji: '👗', category: 'AUTONOMIE',    color: '#6C5CE7', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.tie_shoes',            emoji: '👟', category: 'AUTONOMIE',    color: '#6C5CE7', pointValue: 10, daysOfWeek: [1,2,3,4,5] },
  { tKey: 'presets.prep_snack',           emoji: '🥪', category: 'AUTONOMIE',    color: '#6C5CE7', pointValue: 15, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.clear_plate',          emoji: '🍽️', category: 'AUTONOMIE',    color: '#6C5CE7', pointValue: 10, daysOfWeek: [0,1,2,3,4,5,6] },
  { tKey: 'presets.wake_alone',           emoji: '⏰', category: 'AUTONOMIE',    color: '#6C5CE7', pointValue: 15, daysOfWeek: [1,2,3,4,5] },
  { tKey: 'presets.manage_money',         emoji: '💰', category: 'AUTONOMIE',    color: '#6C5CE7', pointValue: 15, daysOfWeek: [6] },
  { tKey: 'presets.dirty_laundry',        emoji: '🧺', category: 'AUTONOMIE',    color: '#6C5CE7', pointValue: 5,  daysOfWeek: [0,1,2,3,4,5,6] },
]

function getCategoryInfo(id: string) {
  return CATEGORIES.find(c => c.id === id) ?? CATEGORIES[0]
}


function isHabitDueOnDate(habit: any, date: string): boolean {
  const freq: string = habit.frequency ?? 'WEEKLY'
  if (freq === 'DAILY') return true
  if (freq === 'INTERVAL') {
    const n = habit.intervalDays ?? 1
    const created = new Date(habit.createdAt).toISOString().split('T')[0]
    const diff = Math.round((new Date(date).getTime() - new Date(created).getTime()) / 86400000)
    return diff >= 0 && diff % n === 0
  }
  if (freq === 'MONTHLY') {
    return new Date(date + 'T12:00:00').getDate() === (habit.dayOfMonth ?? 1)
  }
  // WEEKLY
  const dow = new Date(date + 'T12:00:00').getDay()
  const days: number[] = habit.daysOfWeek ?? []
  return days.length === 7 || days.includes(dow)
}

function DonutChart({ completed, inProgress, missed }: { completed: number; inProgress: number; missed: number }) {
  const { t } = useTranslation()
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
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block flex-shrink-0" />{completed} {t('parent.completed_chart')}</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block flex-shrink-0" />{inProgress} {t('parent.in_progress_chart')}</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block flex-shrink-0" />{missed} {t('parent.missed_chart')}</span>
      </div>
    </div>
  )
}

function HabitRow({ habit, onDragEnd, onDelete, completedDates, weekDays, selectionMode, selected, onToggleSelect }: {
  habit: any
  onDragEnd: () => void
  onDelete: () => void
  completedDates?: Set<string>
  weekDays?: { date: string; label: string }[]
  selectionMode?: boolean
  selected?: boolean
  onToggleSelect?: () => void
}) {
  const controls = useDragControls()
  const [menuOpen, setMenuOpen] = useState(false)
  const { t } = useTranslation()
  const cat = getCategoryInfo(habit.category || 'GENERAL')
  return (
    <Reorder.Item
      value={habit}
      dragControls={controls}
      dragListener={false}
      onDragEnd={onDragEnd}
      className={`bg-white rounded-2xl p-3 shadow-sm relative transition-all ${selected ? 'ring-2 ring-red-400 bg-red-50' : ''}`}
    >
      <div className="flex items-center gap-3">
        {selectionMode ? (
          <button type="button" onClick={onToggleSelect}
            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              selected ? 'bg-red-500 border-red-500' : 'border-gray-300 bg-white'
            }`}>
            {selected && <span className="text-white text-xs font-black">✓</span>}
          </button>
        ) : (
          <span
            className="text-gray-300 text-lg select-none cursor-grab active:cursor-grabbing touch-none px-1"
            onPointerDown={(e) => controls.start(e)}
          >⠿</span>
        )}
        <span className="text-2xl">{habit.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 text-sm truncate">{habitTitle(habit, t)}</p>
          <p className="text-xs text-gray-400">
            {cat.emoji} {t('categories.' + cat.id)} · {(habit.daysOfWeek ?? []).length === 7 ? t('parent.quotidien') : (habit.daysOfWeek ?? []).sort((a: number, b: number) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b)).map((d: number) => t('days.short_' + d)).join(' ')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-yellow-500">⭐ {habit.pointValue}</span>
          {!selectionMode && (
            <button onClick={() => setMenuOpen(v => !v)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 font-bold text-lg">
              ⋮
            </button>
          )}
        </div>
      </div>
      {menuOpen && !selectionMode && (
        <div className="absolute right-3 top-10 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
          <button onClick={() => { onDelete(); setMenuOpen(false) }}
            className="flex items-center gap-2 px-4 py-3 text-red-500 font-bold text-sm hover:bg-red-50 w-full">
            {t('parent.delete_habit_btn')}
          </button>
        </div>
      )}
      {menuOpen && !selectionMode && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />}
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
  const { t, i18n } = useTranslation()
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
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [presetDefaults, setPresetDefaults] = useState<HabitDefaults | null>(null)
  const [suggestCatFilter, setSuggestCatFilter] = useState<string>('ALL')
  const [addForDay, setAddForDay] = useState<number | null>(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedHabitIds, setSelectedHabitIds] = useState<Set<string>>(new Set())

  // Rewards
  const [rewards, setRewards] = useState<Reward[]>([])
  const [showRewardPanel, setShowRewardPanel] = useState(false)
  const [rewardPanelMode, setRewardPanelMode] = useState<'presets' | 'form'>('presets')
  const [rewardForm, setRewardForm] = useState({ title: '', emoji: '🎁', pointCost: '50' })

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
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0])

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
      label: t('days.short_' + d.getDay()),
    }
  }), [i18n.language])

  const fetchChildren = useCallback(async () => {
    const res = await api.get('/children')
    const merged = mergePhotos(res.data as Child[])
    setChildren(merged)
    // Functional update reads the live activeId, not the stale closure value.
    // Falls back to first child if active child was deleted or none is selected.
    setActiveId(prev => {
      if (!prev || !merged.find(c => c.id === prev)) {
        return merged.length > 0 ? merged[0].id : null
      }
      return prev
    })
  }, [])

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
    const today = new Date().toISOString().split('T')[0]
    return (activeChild?.habits ?? []).filter((h: any) => isHabitDueOnDate(h, today))
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
    return t('parent.age', { count: age, defaultValue: `${age}` })
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
    fetchChildren()
  }

  const deleteHabit = async (habitId: string) => {
    await api.delete(`/habits/${habitId}`)
    fetchChildren()
  }

  const deleteSelectedHabits = async () => {
    if (selectedHabitIds.size === 0) return
    if (!confirm(t('parent.confirm_delete', { n: selectedHabitIds.size }))) return
    await Promise.all([...selectedHabitIds].map(id => api.delete(`/habits/${id}`)))
    setSelectedHabitIds(new Set())
    setSelectionMode(false)
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

  const openPresetForm = (preset: typeof PRESET_HABITS[0]) => {
    const days = addForDay !== null ? [addForDay] : preset.daysOfWeek
    setPresetDefaults({
      title:      t(preset.tKey),
      emoji:      preset.emoji,
      color:      preset.color,
      category:   preset.category,
      pointValue: preset.pointValue,
      daysOfWeek: days,
      frequency:  days.length === 7 ? 'DAILY' : 'WEEKLY',
    })
    setShowCustomForm(true)
  }

  const closeSuggestions = () => {
    setShowSuggestions(false)
    setShowCustomForm(false)
    setPresetDefaults(null)
    setAddForDay(null)
  }

  const addReward = async () => {
    if (!rewardForm.title.trim()) return
    const pointCost = Math.max(1, parseInt(rewardForm.pointCost) || 50)
    try {
      await api.post('/rewards', { title: rewardForm.title, emoji: rewardForm.emoji, pointCost, childId: activeId, type: 'PHYSICAL' })
      setRewardForm({ title: '', emoji: '🎁', pointCost: '50' })
      setShowRewardPanel(false)
      setRewardPanelMode('presets')
      if (activeId) fetchRewards(activeId)
    } catch (err: any) {
      if (err.response?.data?.upgrade) { setShowRewardPanel(false); setShowUpgrade(true) }
      else alert(err.response?.data?.error || t('common.error'))
    }
  }

  const deleteReward = async (rewardId: string) => {
    try {
      await api.delete(`/rewards/${rewardId}`)
      if (activeId) fetchRewards(activeId)
    } catch {}
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
      alert(t('modal.save_profile_error'))
    }
  }

  const unlockReward = async (rewardId: string) => {
    await api.post(`/rewards/${rewardId}/unlock`)
    if (activeId) fetchRewards(activeId)
  }

  const submitChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    if (pwForm.next !== pwForm.confirm) { setPwError(t('profile.password_mismatch')); return }
    if (pwForm.next.length < 8) { setPwError(t('profile.password_min')); return }
    setPwLoading(true)
    try {
      await api.patch('/auth/password', { currentPassword: pwForm.current, newPassword: pwForm.next })
      setPwSuccess(true)
      setPwForm({ current: '', next: '', confirm: '' })
      setTimeout(() => { setShowChangePassword(false); setPwSuccess(false) }, 1800)
    } catch (err: any) {
      setPwError(err.response?.data?.error || t('common.error'))
    } finally {
      setPwLoading(false)
    }
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return t('parent.greeting_morning')
    if (h < 18) return t('parent.greeting_afternoon')
    return t('parent.greeting_evening')
  }

  // ── Suggestions panel (modal overlay) ──────────────────────────────────────
  const SuggestionsPanel = () => (
    <AnimatePresence>
      {showSuggestions && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 z-50 flex items-end"
          onClick={closeSuggestions}>
          <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }}
            className="w-full bg-white rounded-t-3xl p-4 max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}>

            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                {showCustomForm && (
                  <button onClick={() => { setShowCustomForm(false); setPresetDefaults(null) }}
                    className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold text-sm">←</button>
                )}
                <span className="font-black text-gray-800 text-base">
                  {showCustomForm
                    ? presetDefaults?.title ? t('habit.customize', { title: presetDefaults.title }) : t('habit.new')
                    : t('parent.add_habit_title')}
                </span>
              </div>
              <button onClick={closeSuggestions}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold">✕</button>
            </div>

            {showCustomForm ? (
              <div className="overflow-y-auto flex-1 -mx-1 px-1">
                <HabitForm
                  childId={activeChild?.id ?? ''}
                  defaultValues={presetDefaults ?? undefined}
                  onSave={() => { closeSuggestions(); fetchChildren() }}
                  onCancel={() => { setShowCustomForm(false); setPresetDefaults(null) }}
                />
              </div>
            ) : (
              <>
                {/* "Créer" button */}
                <button onClick={() => { setPresetDefaults(null); setShowCustomForm(true) }}
                  className="flex items-center gap-3 w-full bg-gradient-to-r from-kids-orange to-orange-400 text-white rounded-2xl px-4 py-3 mb-3 font-bold text-sm shadow-md flex-shrink-0">
                  <span className="text-xl">✏️</span>
                  <div className="text-left">
                    <p className="font-black">{t('parent.create_habit_custom')}</p>
                    <p className="text-xs opacity-80">{t('parent.create_habit_sub')}</p>
                  </div>
                  <span className="ml-auto text-lg">→</span>
                </button>

                {/* Category filter */}
                <div className="flex gap-2 mb-3 overflow-x-auto pb-1 flex-shrink-0">
                  <button onClick={() => setSuggestCatFilter('ALL')}
                    className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold border-2 transition-all ${suggestCatFilter === 'ALL' ? 'bg-gray-700 text-white border-gray-700' : 'bg-white text-gray-500 border-gray-200'}`}>
                    {t('parent.all_categories')}
                  </button>
                  {CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => setSuggestCatFilter(cat.id)}
                      className={`flex-shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border-2 transition-all ${suggestCatFilter === cat.id ? 'bg-kids-orange text-white border-kids-orange' : 'bg-white text-gray-500 border-gray-200'}`}>
                      {cat.emoji} {t('categories.' + cat.id)}
                    </button>
                  ))}
                </div>

                {/* Preset habit list */}
                <div className="space-y-1.5 overflow-y-auto flex-1">
                  {PRESET_HABITS
                    .filter(p => suggestCatFilter === 'ALL' || p.category === suggestCatFilter)
                    .map(preset => {
                      const cat = getCategoryInfo(preset.category)
                      const alreadyAdded = (activeChild?.habits ?? []).some((h: any) =>
                        h.emoji === preset.emoji && (h.category || 'GENERAL') === preset.category
                      )
                      return (
                        <div key={preset.tKey}
                          className={`flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5 ${alreadyAdded ? 'opacity-50' : ''}`}>
                          <span className="text-xl">{preset.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-800 text-sm truncate">{t(preset.tKey)}</p>
                            <p className="text-xs text-gray-400">{cat.emoji} {t('categories.' + cat.id)} · ⭐ {preset.pointValue} pts</p>
                          </div>
                          {alreadyAdded
                            ? <span className="text-green-400 font-bold text-lg">✓</span>
                            : <motion.button whileTap={{ scale: 0.9 }}
                                onClick={() => openPresetForm(preset)}
                                className="w-8 h-8 rounded-full bg-kids-teal text-white font-black text-lg flex items-center justify-center shadow">
                                +
                              </motion.button>
                          }
                        </div>
                      )
                    })}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // ── Accueil tab ─────────────────────────────────────────────────────────────
  const AccueilTab = () => {
    if (!activeChild) return null
    const today = new Date().toISOString().split('T')[0]
    const isToday = viewDate === today

    // Habits and completions for the selected date
    const viewHabits = (activeChild?.habits ?? []).filter((h: any) => isHabitDueOnDate(h, viewDate))
    const viewDone = viewHabits.filter((h: any) => completedByHabit.get(h.id)?.has(viewDate))
    const viewTodo = viewHabits.filter((h: any) => !completedByHabit.get(h.id)?.has(viewDate))
    const progressPct = viewHabits.length > 0 ? Math.round((viewDone.length / viewHabits.length) * 100) : 0

    const totalScheduledWeek = last7Days.reduce((acc, { date }) =>
      acc + (activeChild?.habits ?? []).filter((h: any) => isHabitDueOnDate(h, date)).length
    , 0)
    const weeklyPctReal = totalScheduledWeek > 0
      ? Math.round(Math.min(100, (weeklyCompletions.length / totalScheduledWeek) * 100))
      : 0

    const dateFormatted = new Date(viewDate + 'T12:00:00').toLocaleDateString('fr-FR', {
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
                    <span className="text-[10px] bg-kids-orange text-white font-bold px-1.5 py-0.5 rounded-full mt-0.5 inline-block">{t('parent.active_child')}</span>
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
            <p className="font-bold text-xs whitespace-nowrap">{t('parent.add_child')}</p>
          </button>
        </div>

        {/* Vue enfant shortcut */}
        <div className="flex justify-end">
          <button onClick={() => navigate('/child')}
            className="flex items-center gap-1.5 text-xs text-kids-teal font-bold bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-100">
            {t('parent.child_view')}
          </button>
        </div>

        {/* 5-col stats */}
        <div className="grid grid-cols-5 gap-1.5">
          {[
            { icon: '⭐', value: activeChild.xp,                            label: t('parent.points'),      color: 'text-yellow-500' },
            { icon: '🔥', value: activeChild.streakDays,                    label: t('parent.streak'),      color: 'text-orange-500' },
            { icon: '🏆', value: badgesCount,                               label: t('parent.badges'),      color: 'text-purple-500' },
            { icon: '📈', value: `${weeklyPctReal}%`,                       label: t('parent.this_week'),   color: 'text-green-500'  },
            { icon: '🎯', value: `${viewDone.length}/${viewHabits.length}`, label: isToday ? t('parent.today_label') : t('parent.this_day_label'), color: 'text-blue-500' },
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
                  {t('parent.today_habits_title', { name: activeChild.name, when: isToday ? t('parent.today_label') : t('parent.this_day_label') })}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{dateFormatted}</p>
              </div>
              {/* Changer de jour — native date picker overlay */}
              <div className="relative flex-shrink-0">
                <button className={`flex items-center gap-1 text-xs font-bold px-2 py-1.5 rounded-xl border pointer-events-none ${
                  isToday ? 'text-gray-500 bg-gray-50 border-gray-200' : 'text-kids-orange bg-orange-50 border-kids-orange'
                }`}>
                  {isToday ? t('parent.change_day') : t('parent.back_today')}
                </button>
                <input
                  type="date"
                  value={viewDate}
                  max={today}
                  onChange={e => setViewDate(e.target.value || today)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                />
              </div>
            </div>
            {viewHabits.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-600">{t('parent.day_progress')}</span>
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
                  {t('parent.habits_done', { done: viewDone.length, total: viewHabits.length })}
                </p>
              </div>
            )}
          </div>

          {viewTodo.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-orange-50">
                <p className="text-xs font-black text-kids-orange">{t('parent.todo')} ({viewTodo.length})</p>
              </div>
              {viewTodo.map((habit: any) => (
                <div key={habit.id} className="flex items-center gap-3 px-4 py-3 border-t border-gray-50">
                  <div className="w-5 h-5 rounded border-2 border-gray-300 flex-shrink-0" />
                  <span className="text-xl">{habit.emoji}</span>
                  <p className="flex-1 font-semibold text-gray-800 text-sm">{habitTitle(habit, t)}</p>
                  <span className="text-xs font-bold text-yellow-500 flex-shrink-0">⭐ +{habit.pointValue}</span>
                </div>
              ))}
            </div>
          )}

          {viewDone.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-green-50">
                <p className="text-xs font-black text-green-600">{t('parent.done')} ({viewDone.length})</p>
              </div>
              {viewDone.map((habit: any) => (
                <div key={habit.id} className="flex items-center gap-3 px-4 py-3 border-t border-gray-50 opacity-60">
                  <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                  <span className="text-xl">{habit.emoji}</span>
                  <p className="flex-1 font-semibold text-gray-500 text-sm line-through">{habitTitle(habit, t)}</p>
                  <span className="text-xs font-bold text-yellow-500 flex-shrink-0">⭐ +{habit.pointValue}</span>
                </div>
              ))}
            </div>
          )}

          {viewHabits.length === 0 && (
            <div className="text-center py-8 px-4">
              <p className="text-3xl mb-2">🌱</p>
              <p className="text-sm text-gray-400 font-semibold">{t('parent.no_habits_day')}</p>
              <button onClick={() => setShowSuggestions(true)}
                className="mt-3 bg-kids-teal text-white font-bold px-4 py-2 rounded-xl text-sm">
                {t('parent.add_btn')}
              </button>
            </div>
          )}

          {viewHabits.length > 0 && (
            <div className="flex border-t border-gray-100">
              <button onClick={() => setNavTab('habitudes')}
                className="flex-1 py-3 text-xs text-kids-orange font-bold text-center">
                {t('parent.see_all')}
              </button>
              <div className="w-px bg-gray-100" />
              <button onClick={() => navigate('/child')}
                className="flex-1 py-3 text-xs text-kids-teal font-bold text-center">
                {t('parent.child_view')}
              </button>
            </div>
          )}
        </div>

        {/* Compétences développées cette semaine */}
        {(() => {
          const habitMap = new Map((activeChild.habits ?? []).map((h: any) => [h.id, h]))
          const scores: Record<string, number> = {}
          weeklyCompletions.forEach(c => {
            const habit = habitMap.get(c.habitId)
            if (!habit) return
            const skills = CATEGORY_SKILLS[habit.category] ?? ['discipline']
            skills.forEach(s => { scores[s] = (scores[s] ?? 0) + (c.pointsEarned ?? habit.pointValue ?? 10) })
          })
          const maxScore = Math.max(1, ...Object.values(scores))
          const hasData = Object.keys(scores).length > 0
          return (
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-black text-gray-800 text-sm">{t('parent.skills_title')}</h3>
                  <p className="text-xs text-gray-400">{t('parent.skills_sub')}</p>
                </div>
              </div>
              {hasData ? (
                <div className="space-y-2.5">
                  {SKILLS.map(skill => {
                    const score = scores[skill.id] ?? 0
                    const pct = Math.round((score / maxScore) * 100)
                    return (
                      <div key={skill.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                            <span>{skill.emoji}</span>{t('skills.' + skill.id)}
                          </span>
                          <span className="text-xs font-black" style={{ color: skill.color }}>{score > 0 ? `+${score} pts` : '—'}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <motion.div
                            className={`h-2.5 rounded-full ${skill.bar}`}
                            initial={{ width: 0 }}
                            animate={{ width: score > 0 ? `${pct}%` : '0%' }}
                            transition={{ duration: 0.6, delay: SKILLS.indexOf(skill) * 0.08 }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-3xl mb-1">🌱</p>
                  <p className="text-xs text-gray-400 font-semibold">{t('parent.no_completions')}</p>
                </div>
              )}
            </div>
          )
        })()}

        {/* Family progress */}
        {children.length > 1 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-gray-800 text-sm">{t('parent.family_progress')}</h3>
              <button onClick={() => setNavTab('habitudes')}
                className="text-xs text-kids-orange font-bold">
                {t('parent.see_all_btn')}
              </button>
            </div>
            <div className={`grid gap-4 ${children.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {children.map(child => {
                const childDow = new Date().getDay()
                const childTotal = (child.habits ?? []).filter((h: any) =>
                  (h.daysOfWeek ?? []).length === 7 || (h.daysOfWeek ?? []).includes(childDow)
                ).length
                const childDone = child.id === activeId ? viewDone.length : 0
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
                        ? t('parent.habits_done', { done: childDone, total: childTotal })
                        : t('parent.habits_n', { n: childTotal, s: childTotal > 1 ? 's' : '' })}
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
            <h3 className="font-black text-gray-700">{t('nav.habitudes')}</h3>
            <p className="text-xs text-gray-400">{t('parent.habits_n', { n: activeChild.habits?.length ?? 0, s: (activeChild.habits?.length ?? 0) !== 1 ? 's' : '' })}</p>
          </div>
          <div className="flex gap-2 items-center">
            {!selectionMode ? (
              <>
                <button
                  onClick={() => setHabitsView(habitsView === 'list' ? 'parjour' : 'list')}
                  className="text-xs text-gray-400 font-bold px-3 py-2 bg-white rounded-xl shadow-sm">
                  {habitsView === 'list' ? t('parent.per_day_view') : t('parent.list_view')}
                </button>
                <button
                  onClick={() => { setSelectionMode(true); setSelectedHabitIds(new Set()) }}
                  className="text-xs text-gray-500 font-bold px-3 py-2 bg-white rounded-xl shadow-sm border border-gray-200">
                  {t('parent.select_btn')}
                </button>
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSuggestions(true)}
                  className="bg-kids-teal text-white font-black px-5 py-2 rounded-xl text-sm shadow-md">
                  {t('parent.add_btn')}
                </motion.button>
              </>
            ) : (
              <button
                onClick={() => { setSelectionMode(false); setSelectedHabitIds(new Set()) }}
                className="text-xs text-gray-500 font-bold px-3 py-2 bg-white rounded-xl shadow-sm border border-gray-200">
                {t('parent.cancel_select')}
              </button>
            )}
          </div>
        </div>

        {/* Barre d'actions en mode sélection */}
        {selectionMode && (
          <div className="flex items-center justify-between mb-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-2.5">
            <button
              onClick={() => {
                const allIds = new Set(filteredHabits.map((h: any) => h.id))
                if (selectedHabitIds.size === filteredHabits.length) {
                  setSelectedHabitIds(new Set())
                } else {
                  setSelectedHabitIds(allIds)
                }
              }}
              className="text-sm font-bold text-red-600">
              {selectedHabitIds.size === filteredHabits.length ? t('parent.deselect_all') : t('parent.select_all')}
            </button>
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={deleteSelectedHabits}
              disabled={selectedHabitIds.size === 0}
              className="bg-red-500 text-white font-black px-4 py-1.5 rounded-xl text-sm disabled:opacity-40">
              {t('parent.delete_selection')} {selectedHabitIds.size > 0 ? `(${selectedHabitIds.size})` : ''}
            </motion.button>
          </div>
        )}

        {/* Category filter */}
        {usedCategories.length > 1 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            <button onClick={() => setCategoryFilter('ALL')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${categoryFilter === 'ALL' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200'}`}>
              {t('parent.all_categories')}
            </button>
            {usedCategories.map(catId => {
              const cat = getCategoryInfo(catId)
              return (
                <button key={catId} onClick={() => setCategoryFilter(catId)}
                  className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${categoryFilter === catId ? 'bg-kids-orange text-white border-kids-orange' : 'bg-white text-gray-500 border-gray-200'}`}>
                  {cat.emoji} {t('categories.' + cat.id)}
                </button>
              )
            })}
          </div>
        )}

        {/* List view — drag normal, plain div en mode sélection */}
        {habitsView === 'list' && (
          selectionMode ? (
            <div className="space-y-2">
              {filteredHabits.map(habit => {
                const selected = selectedHabitIds.has(habit.id)
                const cat = getCategoryInfo(habit.category || 'GENERAL')
                return (
                  <button
                    key={habit.id}
                    type="button"
                    onClick={() => setSelectedHabitIds(prev => {
                      const next = new Set(prev)
                      next.has(habit.id) ? next.delete(habit.id) : next.add(habit.id)
                      return next
                    })}
                    className={`w-full text-left bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3 transition-all border-2 ${
                      selected ? 'border-red-400 bg-red-50' : 'border-transparent'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      selected ? 'bg-red-500 border-red-500' : 'border-gray-300 bg-white'
                    }`}>
                      {selected && <span className="text-white text-xs font-black">✓</span>}
                    </div>
                    <span className="text-2xl">{habit.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 text-sm truncate">{habitTitle(habit, t)}</p>
                      <p className="text-xs text-gray-400">{cat.emoji} {t('categories.' + cat.id)}</p>
                    </div>
                    <span className="text-xs font-bold text-yellow-500 flex-shrink-0">⭐ {habit.pointValue}</span>
                  </button>
                )
              })}
            </div>
          ) : (
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
          )
        )}

        {/* Par jour view */}
        {habitsView === 'parjour' && (
          <div className="space-y-3">
            {WEEK_DAYS.map(({ tKey, shortKey, day }) => {
              const dayHabits = habitsForDay(day)
              return (
                <div key={day} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <span className="w-7 h-7 bg-kids-blue text-white text-xs font-black rounded-full flex items-center justify-center">{t(shortKey)}</span>
                    <span className="font-bold text-gray-700 text-sm">{t(tKey)}</span>
                    <span className="text-xs text-gray-400 font-semibold">{t('parent.habits_n', { n: dayHabits.length, s: dayHabits.length !== 1 ? 's' : '' })}</span>
                    <motion.button whileTap={{ scale: 0.9 }}
                      onClick={() => { setAddForDay(day); setShowSuggestions(true) }}
                      className="ml-auto w-7 h-7 bg-kids-teal text-white font-black text-base rounded-full flex items-center justify-center shadow-sm">
                      +
                    </motion.button>
                  </div>
                  {dayHabits.length === 0
                    ? <p className="px-4 py-3 text-sm text-gray-400 italic">{t('parent.no_day_habits')}</p>
                    : <div className="divide-y divide-gray-50">
                        {dayHabits.map((habit: any) => {
                          const cat = getCategoryInfo(habit.category || 'GENERAL')
                          return (
                            <div key={habit.id} className="flex items-center gap-3 px-4 py-2.5">
                              <span className="text-xl">{habit.emoji}</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-800 text-sm truncate">{habitTitle(habit, t)}</p>
                                <span className="text-xs text-gray-400">{cat.emoji} {t('categories.' + cat.id)} · ⭐ {habit.pointValue}</span>
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
            <p className="font-bold text-gray-500">{t('parent.no_habits_yet')}</p>
            <button onClick={() => setShowSuggestions(true)}
              className="mt-3 bg-kids-teal text-white font-bold px-6 py-3 rounded-xl">
              {t('parent.add_btn')}
            </button>
          </div>
        )}
      </div>
    )
  }

  const PRESET_REWARDS = [
    { emoji: '🍽️', tKey: 'preset_rewards.choose_dinner',  pointCost: 50  },
    { emoji: '🌳', tKey: 'preset_rewards.park_outing',    pointCost: 80  },
    { emoji: '❤️', tKey: 'preset_rewards.special_time',   pointCost: 100 },
    { emoji: '🎬', tKey: 'preset_rewards.family_movie',   pointCost: 60  },
    { emoji: '🎮', tKey: 'preset_rewards.game_together',  pointCost: 40  },
    { emoji: '🎁', tKey: 'preset_rewards.small_surprise', pointCost: 30  },
    { emoji: '🧸', tKey: 'preset_rewards.buy_toy',        pointCost: 150 },
  ]

  // ── Récompenses tab ──────────────────────────────────────────────────────────
  const RecompensesTab = () => {
    if (!activeChild) return null

    const openPreset = (preset: typeof PRESET_REWARDS[0]) => {
      setRewardForm({ title: t(preset.tKey), emoji: preset.emoji, pointCost: String(preset.pointCost) })
      setRewardPanelMode('form')
    }

    const openCustom = () => {
      setRewardForm({ title: '', emoji: '🎁', pointCost: '50' })
      setRewardPanelMode('form')
    }

    return (
      <>
        {/* ── Panel bottom sheet ── */}
        <AnimatePresence>
          {showRewardPanel && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50 flex items-end"
              onClick={() => { setShowRewardPanel(false); setRewardPanelMode('presets') }}>
              <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }}
                className="w-full bg-white rounded-t-3xl p-4 max-h-[85vh] flex flex-col"
                onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    {rewardPanelMode === 'form' && (
                      <button onClick={() => setRewardPanelMode('presets')}
                        className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold text-sm">←</button>
                    )}
                    <span className="font-black text-gray-800 text-base">
                      {rewardPanelMode === 'form' ? (rewardForm.title ? `✏️ ${rewardForm.title}` : t('reward.new_reward')) : t('reward.add_title')}
                    </span>
                  </div>
                  <button onClick={() => { setShowRewardPanel(false); setRewardPanelMode('presets') }}
                    className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold">✕</button>
                </div>

                {rewardPanelMode === 'presets' ? (
                  <div className="overflow-y-auto flex-1 space-y-2">
                    {/* Custom button */}
                    <button onClick={openCustom}
                      className="flex items-center gap-3 w-full bg-gradient-to-r from-kids-orange to-orange-400 text-white rounded-2xl px-4 py-3 font-bold text-sm shadow-md">
                      <span className="text-xl">✏️</span>
                      <div className="text-left">
                        <p className="font-black">{t('reward.create_custom')}</p>
                        <p className="text-xs opacity-80">{t('reward.create_custom_sub')}</p>
                      </div>
                      <span className="ml-auto text-lg">→</span>
                    </button>

                    {/* Preset list */}
                    <div className="divide-y divide-gray-100 border-2 border-gray-100 rounded-2xl overflow-hidden">
                      {PRESET_REWARDS.map(preset => {
                        const alreadyAdded = rewards.some(r => r.emoji === preset.emoji)
                        return (
                          <div key={preset.tKey} className={`flex items-center gap-3 px-4 py-3 bg-white ${alreadyAdded ? 'opacity-50' : ''}`}>
                            <span className="text-2xl flex-shrink-0">{preset.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-800 text-sm">{t(preset.tKey)}</p>
                              <p className="text-xs text-gray-400">{t('reward.pts_label', { n: preset.pointCost })}</p>
                            </div>
                            {alreadyAdded
                              ? <span className="text-green-400 font-bold text-lg flex-shrink-0">✓</span>
                              : <motion.button whileTap={{ scale: 0.9 }} onClick={() => openPreset(preset)}
                                  className="flex-shrink-0 flex items-center gap-1 bg-kids-teal text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow">
                                  {t('reward.customize_btn')}
                                </motion.button>
                            }
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  /* Reward form */
                  <div className="space-y-4 overflow-y-auto flex-1">
                    {/* Emoji + Titre */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={rewardForm.emoji}
                        onChange={e => setRewardForm(f => ({ ...f, emoji: e.target.value }))}
                        className="w-16 p-3 border-2 border-gray-200 rounded-xl text-center text-2xl focus:border-kids-orange focus:outline-none"
                        maxLength={2}
                      />
                      <input
                        type="text"
                        placeholder={t('reward.name_placeholder')}
                        value={rewardForm.title}
                        onChange={e => setRewardForm(f => ({ ...f, title: e.target.value }))}
                        className="flex-1 p-3 border-2 border-gray-200 rounded-xl font-semibold focus:border-kids-orange focus:outline-none"
                      />
                    </div>

                    {/* Points */}
                    <div>
                      <label className="text-sm font-bold text-gray-600 mb-2 block">{t('reward.points_label')}</label>
                      <div className="flex gap-2 flex-wrap mb-2">
                        {[20, 30, 50, 80, 100, 150, 200].map(v => (
                          <button key={v} type="button"
                            onClick={() => setRewardForm(f => ({ ...f, pointCost: String(v) }))}
                            className={`px-3 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                              rewardForm.pointCost === String(v)
                                ? 'bg-kids-orange text-white border-kids-orange'
                                : 'bg-white text-gray-500 border-gray-200'
                            }`}>
                            {v}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder={t('reward.other_value')}
                        value={rewardForm.pointCost}
                        onFocus={e => e.target.select()}
                        onChange={e => setRewardForm(f => ({ ...f, pointCost: e.target.value.replace(/\D/g, '') }))}
                        className="w-full p-3 border-2 border-gray-200 rounded-xl font-semibold focus:border-kids-orange focus:outline-none"
                      />
                    </div>

                    <motion.button whileTap={{ scale: 0.97 }} type="button"
                      onClick={addReward}
                      disabled={!rewardForm.title.trim()}
                      className="w-full bg-kids-teal text-white font-black py-3.5 rounded-2xl text-base shadow-md disabled:opacity-50">
                      {t('reward.add_reward_btn')}
                    </motion.button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Reward list ── */}
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-black text-gray-700">{t('nav.recompenses')}</h3>
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={() => { setRewardPanelMode('presets'); setShowRewardPanel(true) }}
            className="bg-kids-orange text-white font-bold px-4 py-2 rounded-xl text-sm">
            {t('reward.add_shortbtn')}
          </motion.button>
        </div>

        <div className="space-y-2">
          {rewards.map(r => (
            <div key={r.id} className={`rounded-2xl p-3 shadow-sm flex items-center gap-3 ${r.isUnlocked ? 'bg-green-50 border-2 border-green-200' : 'bg-white'}`}>
              <span className="text-2xl">{r.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 truncate">{r.title}</p>
                <p className="text-sm text-gray-500">{t('reward.pts_label', { n: r.pointCost })}</p>
              </div>
              {r.isUnlocked
                ? <span className="text-green-500 font-bold text-sm flex-shrink-0">{t('reward.unlocked_label')}</span>
                : <>
                    <button onClick={() => unlockReward(r.id)}
                      disabled={activeChild.xp < r.pointCost}
                      className="bg-kids-orange text-white font-bold px-3 py-1 rounded-xl text-sm disabled:opacity-40 flex-shrink-0">
                      {t('reward.unlock_btn')}
                    </button>
                    <button onClick={() => deleteReward(r.id)}
                      className="text-red-300 hover:text-red-500 flex-shrink-0 p-1">🗑️</button>
                  </>
              }
            </div>
          ))}
          {rewards.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">🎁</p>
              <p className="font-semibold">{t('reward.no_rewards')}</p>
              <p className="text-sm mt-1">{t('reward.no_rewards_sub')}</p>
            </div>
          )}
        </div>
      </>
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
          {isPremium && <span className="text-xs bg-yellow-100 text-yellow-700 font-bold px-2 py-0.5 rounded-full">{t('profile.premium_badge')}</span>}
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
          <p className="px-4 pt-4 font-black text-gray-700 text-sm">{t('profile.stats')}</p>
          <StatsView childId={activeChild.id} childName={activeChild.name} isPremium={isPremium} onUpgrade={() => setShowUpgrade(true)} />
        </div>
      )}

      {/* Notifications */}
      {activeChild && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <p className="px-4 pt-4 font-black text-gray-700 text-sm">{t('profile.reminders')}</p>
          <div className="p-4">
            <NotificationSettings childId={activeChild.id} />
          </div>
        </div>
      )}

      {/* Language selector */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="font-black text-gray-700 text-sm mb-3">🌐 {t('profile.language')}</p>
        <div className="flex gap-2">
          <button
            onClick={() => setLanguage('fr')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${
              i18n.language === 'fr'
                ? 'bg-kids-blue text-white border-kids-blue shadow-md'
                : 'bg-white text-gray-500 border-gray-200'
            }`}>
            🇫🇷 {t('profile.lang_fr')}
          </button>
          <button
            onClick={() => setLanguage('ar')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${
              i18n.language === 'ar'
                ? 'bg-kids-blue text-white border-kids-blue shadow-md'
                : 'bg-white text-gray-500 border-gray-200'
            }`}>
            🇸🇦 {t('profile.lang_ar')}
          </button>
        </div>
      </div>

      {/* Changer le mot de passe */}
      <button onClick={() => { setShowChangePassword(true); setPwError(''); setPwSuccess(false) }}
        className="w-full bg-gray-50 text-gray-700 font-bold py-3 rounded-2xl border-2 border-gray-100">
        {t('profile.change_password')}
      </button>

      {/* Logout */}
      <button onClick={logout}
        className="w-full bg-red-50 text-red-500 font-bold py-3 rounded-2xl border-2 border-red-100">
        🚪 {t('profile.logout')}
      </button>
    </div>
  )

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
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
                {isPremium && <span className="text-xs bg-white/20 text-white font-bold px-2 py-0.5 rounded-full mt-1 inline-block">{t('profile.premium_badge')}</span>}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Enfants */}
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2 px-1">{t('parent.my_children')}</p>
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
                          <p className="text-xs text-gray-400">{t('parent.level_short')} {c.level} · {c.xp} XP{c.classe ? ` · ${c.classe}` : ''}</p>
                        </button>
                        {/* Supprimer */}
                        <button onClick={() => { setConfirmDeleteId(c.id); setShowHamburger(false) }}
                          className="w-6 h-6 bg-red-100 text-red-400 rounded-full text-xs flex items-center justify-center flex-shrink-0">✕</button>
                      </div>
                    ))}
                    <button onClick={() => { setShowAddChild(true); setShowHamburger(false) }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 text-left border-2 border-dashed border-gray-200">
                      <span className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-xl">+</span>
                      <span className="font-bold text-gray-400 text-sm">{t('parent.add_child')}</span>
                    </button>
                  </div>
                </div>

                {/* Navigation */}
                <div className="border-t border-gray-100 pt-3 space-y-1">
                  <button onClick={() => { setNavTab('profil'); setShowHamburger(false) }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-left">
                    <span className="text-xl">👤</span>
                    <span className="font-bold text-gray-700">{t('parent.my_profile')}</span>
                  </button>
                  {!isPremium && (
                    <button onClick={() => { setShowUpgrade(true); setShowHamburger(false) }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-yellow-50 text-left">
                      <span className="text-xl">⭐</span>
                      <span className="font-bold text-yellow-600">{t('parent.go_premium')}</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="p-4 border-t border-gray-100">
                <button onClick={logout}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-left">
                  <span className="text-xl">🚪</span>
                  <span className="font-bold text-red-500">{t('profile.logout')}</span>
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
                <h2 className="font-black text-gray-800 text-lg">{t('modal.edit_profile')}</h2>
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
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5 block">{t('modal.first_name')}</label>
                  <input type="text" value={editChildForm.name}
                    onChange={e => setEditChildForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-800 focus:border-kids-orange focus:outline-none" />
                </div>
                {/* Sexe */}
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5 block">{t('modal.gender')}</label>
                  <div className="flex gap-2">
                    <button type="button"
                      onClick={() => setEditChildForm(f => ({ ...f, sex: f.sex === 'GARCON' ? '' : 'GARCON' }))}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition-colors ${editChildForm.sex === 'GARCON' ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-white border-gray-200 text-gray-500'}`}>
                      {t('modal.boy')}
                    </button>
                    <button type="button"
                      onClick={() => setEditChildForm(f => ({ ...f, sex: f.sex === 'FILLE' ? '' : 'FILLE' }))}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition-colors ${editChildForm.sex === 'FILLE' ? 'bg-pink-100 border-pink-400 text-pink-700' : 'bg-white border-gray-200 text-gray-500'}`}>
                      {t('modal.girl')}
                    </button>
                  </div>
                </div>
                {/* Date de naissance */}
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5 block">{t('modal.birth_date')}</label>
                  <input type="date" value={editChildForm.birthDate}
                    onChange={e => setEditChildForm(f => ({ ...f, birthDate: e.target.value }))}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-800 focus:border-kids-orange focus:outline-none" />
                </div>
                {/* Classe */}
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5 block">{t('modal.class_label')}</label>
                  <input type="text" placeholder={t('modal.class_ph')} value={editChildForm.classe}
                    onChange={e => setEditChildForm(f => ({ ...f, classe: e.target.value }))}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-800 focus:border-kids-orange focus:outline-none" />
                </div>
                {/* Stats (lecture seule) */}
                <div className="bg-gray-50 rounded-2xl p-4 grid grid-cols-3 gap-3 text-center">
                  <div><p className="text-lg font-black text-kids-orange">{editingChildProfile.level}</p><p className="text-xs text-gray-400 font-semibold">{t('modal.level')}</p></div>
                  <div><p className="text-lg font-black text-yellow-500">{editingChildProfile.xp}</p><p className="text-xs text-gray-400 font-semibold">{t('modal.xp_total')}</p></div>
                  <div><p className="text-lg font-black text-orange-500">{editingChildProfile.streakDays}j</p><p className="text-xs text-gray-400 font-semibold">{t('modal.streak')}</p></div>
                </div>
              </div>
              {/* Footer */}
              <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
                <button onClick={() => setEditingChildProfile(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl">
                  {t('modal.cancel_btn')}
                </button>
                <button onClick={saveChildProfile}
                  className="flex-1 py-3 bg-kids-orange text-white font-black rounded-2xl shadow-md">
                  {t('modal.save_btn')}
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
                <h2 className="font-black text-gray-800 text-lg">{t('profile.change_password')}</h2>
                <button onClick={() => setShowChangePassword(false)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold">✕</button>
              </div>
              {pwSuccess ? (
                <div className="text-center py-6">
                  <div className="text-5xl mb-3">✅</div>
                  <p className="font-black text-green-600 text-lg">{t('profile.password_updated')}</p>
                </div>
              ) : (
                <form onSubmit={submitChangePassword} className="space-y-3">
                  <input type="password" placeholder={t('profile.current_password')} value={pwForm.current}
                    onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                    className="w-full p-3.5 border-2 border-gray-200 rounded-xl font-semibold focus:border-kids-orange focus:outline-none"
                    required />
                  <input type="password" placeholder={t('profile.new_password')} value={pwForm.next}
                    onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                    className="w-full p-3.5 border-2 border-gray-200 rounded-xl font-semibold focus:border-kids-orange focus:outline-none"
                    required minLength={8} />
                  <input type="password" placeholder={t('profile.confirm_password')} value={pwForm.confirm}
                    onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                    className="w-full p-3.5 border-2 border-gray-200 rounded-xl font-semibold focus:border-kids-orange focus:outline-none"
                    required minLength={8} />
                  {pwError && (
                    <p className="text-red-500 font-semibold text-sm text-center">{pwError}</p>
                  )}
                  <button type="submit" disabled={pwLoading}
                    className="w-full bg-kids-orange text-white font-black py-3.5 rounded-xl disabled:opacity-60 mt-2">
                    {pwLoading ? t('profile.saving') : t('profile.save_password')}
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
              className="fixed top-16 left-4 right-4 max-w-md mx-auto bg-white rounded-2xl shadow-2xl z-50 flex flex-col" style={{ maxHeight: 'calc(100vh - 80px)' }}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
                <span className="font-black text-gray-800">{t('parent.notif_panel_title')}</span>
                <button onClick={() => setShowNotifPanel(false)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold">✕</button>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
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
                ? <p className="font-black text-gray-800 text-base">{t('parent.all_children_progress')}</p>
                : <button
                    onClick={() => setShowChildDropdown(v => !v)}
                    className="flex items-center gap-1 font-black text-gray-800 text-base">
                    {activeChild ? t('parent.child_progress', { name: activeChild.name }) : t('nav.accueil')}
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
                      <p className="text-xs text-gray-400">{t('parent.level_short')} {c.level} · {c.xp} XP · {c.streakDays}j</p>
                    </div>
                    {activeId === c.id && <span className="text-kids-orange font-bold">✓</span>}
                    <button onClick={e => { e.stopPropagation(); setConfirmDeleteId(c.id) }}
                      className="w-6 h-6 bg-red-100 text-red-400 rounded-full text-xs flex items-center justify-center">✕</button>
                  </button>
                ))}
                <button onClick={() => { setShowAddChild(true); setShowChildDropdown(false) }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-kids-teal font-bold hover:bg-gray-50">
                  <span className="w-9 h-9 border-2 border-dashed border-kids-teal rounded-full flex items-center justify-center text-lg">+</span>
                  {t('parent.add_child')}
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
            <p className="font-bold text-red-700 mb-3">{t('parent.delete_child_confirm')}</p>
            <div className="flex gap-2">
              <button onClick={() => deleteChild(confirmDeleteId)} className="flex-1 bg-red-500 text-white font-bold py-2 rounded-xl">{t('common.delete')}</button>
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-2 rounded-xl">{t('modal.cancel_btn')}</button>
            </div>
          </motion.div>
        )}

        {/* Add child form */}
        {showAddChild && (
          <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            onSubmit={addChild} className="bg-white rounded-2xl p-4 shadow-md mb-4 space-y-3">
            <h3 className="font-black text-gray-800 text-base">{t('modal.new_child')}</h3>
            <PhotoPicker
              photoUrl={newChildForm.photoUrl || undefined}
              onPhotoChange={url => setNewChildForm(f => ({ ...f, photoUrl: url ?? '' }))}
            />
            <input autoFocus type="text" placeholder={t('modal.first_name_ph')} value={newChildForm.name}
              onChange={e => setNewChildForm(f => ({ ...f, name: e.target.value }))}
              className="w-full p-3 border-2 border-gray-200 rounded-xl font-semibold focus:border-kids-orange focus:outline-none" required />
            <div className="flex gap-2">
              <button type="button"
                onClick={() => setNewChildForm(f => ({ ...f, sex: f.sex === 'GARCON' ? '' : 'GARCON' }))}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition-colors ${newChildForm.sex === 'GARCON' ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-white border-gray-200 text-gray-500'}`}>
                {t('modal.boy')}
              </button>
              <button type="button"
                onClick={() => setNewChildForm(f => ({ ...f, sex: f.sex === 'FILLE' ? '' : 'FILLE' }))}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition-colors ${newChildForm.sex === 'FILLE' ? 'bg-pink-100 border-pink-400 text-pink-700' : 'bg-white border-gray-200 text-gray-500'}`}>
                {t('modal.girl')}
              </button>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-500 mb-1 block">{t('modal.birth_date')}</label>
                <input type="date" value={newChildForm.birthDate}
                  onChange={e => setNewChildForm(f => ({ ...f, birthDate: e.target.value }))}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl font-semibold focus:border-kids-orange focus:outline-none" />
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-500 mb-1 block">{t('modal.class_label')}</label>
                <input type="text" placeholder={t('modal.class_ph_short')} value={newChildForm.classe}
                  onChange={e => setNewChildForm(f => ({ ...f, classe: e.target.value }))}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl font-semibold focus:border-kids-orange focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-kids-teal text-white font-bold py-3 rounded-xl">{t('modal.add_btn')}</button>
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
              <p className="text-xs text-gray-400">{t('parent.level_short')} {activeChild.level} · {activeChild.xp} XP · {activeChild.streakDays}j</p>
            </div>
            <button onClick={() => setEditingAvatar(v => !v)}
              className="text-xs text-kids-blue font-bold px-2 py-1 rounded-lg bg-blue-50">
              {editingAvatar ? '✓' : '📷'}
            </button>
            <button onClick={() => navigate('/child')}
              className="text-xs text-kids-orange font-bold px-2 py-1 rounded-lg bg-orange-50">
              {t('parent.child_btn_view')}
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
                  alert(t('modal.save_photo_error'))
                }
              }}
            />
          </motion.div>
        )}

        {/* Tab content */}
        {children.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-5xl mb-3">👶</p>
            <p className="font-bold text-gray-500 mb-4">{t('parent.no_children')}</p>
            <button onClick={() => setShowAddChild(true)}
              className="bg-kids-teal text-white font-bold px-6 py-3 rounded-2xl">
              {t('parent.add_child')}
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
            { id: 'accueil',   icon: '🏠', tKey: 'nav.accueil'   },
            { id: 'habitudes', icon: '📋', tKey: 'nav.habitudes'  },
          ].map(item => (
            <button key={item.id} onClick={() => setNavTab(item.id as any)}
              className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all ${navTab === item.id ? 'text-kids-orange' : 'text-gray-400'}`}>
              <span className="text-xl">{item.icon}</span>
              <span className={`text-xs font-bold mt-0.5 ${navTab === item.id ? 'text-kids-orange' : 'text-gray-400'}`}>{t(item.tKey)}</span>
            </button>
          ))}

          {/* Center + button */}
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={() => setShowSuggestions(true)}
            className="w-14 h-14 bg-kids-orange rounded-full flex items-center justify-center shadow-lg text-white text-3xl font-black -mt-5 border-4 border-white">
            +
          </motion.button>

          {[
            { id: 'recompenses', icon: '🎁', tKey: 'nav.recompenses' },
            { id: 'profil',      icon: '👤', tKey: 'nav.profil'       },
          ].map(item => (
            <button key={item.id} onClick={() => setNavTab(item.id as any)}
              className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all ${navTab === item.id ? 'text-kids-orange' : 'text-gray-400'}`}>
              <span className="text-xl">{item.icon}</span>
              <span className={`text-xs font-bold mt-0.5 ${navTab === item.id ? 'text-kids-orange' : 'text-gray-400'}`}>{t(item.tKey)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
