import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../api/client'
import { useAuthStore } from '../store/useStore'
import Dashboard from '../components/child/Dashboard'
import { mergePhotos } from '../utils/childPhotos'

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

export default function ChildView() {
  const { activeChildId, setActiveChild } = useAuthStore()
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/children').then(res => {
      const merged = mergePhotos(res.data as Child[])
      setChildren(merged)
      if (!activeChildId && merged.length > 0) setActiveChild(merged[0].id)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const activeChild = children.find(c => c.id === activeChildId)

  if (loading) {
    return (
      <div className="h-screen bg-sky-100 flex items-center justify-center">
        <motion.div className="text-6xl" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          ⭐
        </motion.div>
      </div>
    )
  }

  if (children.length === 0) {
    return (
      <div className="h-screen bg-gradient-to-b from-kids-yellow to-kids-orange flex flex-col items-center justify-center p-6 text-center">
        <div className="text-7xl mb-4">👨‍👩‍👧</div>
        <h2 className="text-3xl font-black text-white mb-3">Bienvenue !</h2>
        <p className="text-white/80 font-semibold mb-8 text-lg">Créez le profil de votre enfant pour commencer</p>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/parent')}
          className="bg-white text-kids-orange font-black text-xl px-8 py-4 rounded-2xl shadow-lg">
          👨‍👩‍👧 Espace Parent
        </motion.button>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Child selector — only shown when there are multiple children */}
      {children.length > 1 && (
        <div className="flex-shrink-0 bg-sky-300 flex gap-2 overflow-x-auto px-4 pt-2 pb-1">
          {children.map(child => (
            <button key={child.id} onClick={() => setActiveChild(child.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-xs transition-all whitespace-nowrap flex-shrink-0 ${
                activeChildId === child.id
                  ? 'bg-white text-kids-orange shadow-md'
                  : 'bg-white/50 text-gray-600'
              }`}>
              {child.photoUrl
                ? <img src={child.photoUrl} className="w-5 h-5 rounded-full object-cover" alt={child.name} />
                : <span>{child.avatarEmoji}</span>
              }
              {child.name}
            </button>
          ))}
        </div>
      )}

      {/* Dashboard takes remaining height */}
      {activeChild && (
        <div className="flex-1 overflow-hidden">
          <Dashboard
            child={activeChild}
            onChildUpdate={updated => setChildren(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c))}
          />
        </div>
      )}
    </div>
  )
}
