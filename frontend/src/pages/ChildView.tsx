import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../api/client'
import { useAuthStore } from '../store/useStore'
import Dashboard from '../components/child/Dashboard'

interface Child {
  id: string
  name: string
  avatarEmoji: string
  avatarColor: string
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
      setChildren(res.data)
      if (!activeChildId && res.data.length > 0) setActiveChild(res.data[0].id)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const activeChild = children.find(c => c.id === activeChildId)

  if (loading) {
    return (
      <div className="min-h-screen bg-kids-yellow flex items-center justify-center">
        <motion.div className="text-6xl" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          ⭐
        </motion.div>
      </div>
    )
  }

  if (children.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-kids-yellow to-kids-orange flex flex-col items-center justify-center p-6 text-center">
        <div className="text-7xl mb-4">👨‍👩‍👧</div>
        <h2 className="text-3xl font-black text-white mb-3">Bienvenue !</h2>
        <p className="text-white/80 font-semibold mb-8 text-lg">Créez le profil de votre enfant pour commencer</p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/parent')}
          className="bg-white text-kids-orange font-black text-xl px-8 py-4 rounded-2xl shadow-lg"
        >
          👨‍👩‍👧 Espace Parent
        </motion.button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="flex justify-between items-center p-4 max-w-md mx-auto">
        {children.length > 1 && (
          <div className="flex gap-2 overflow-x-auto flex-1">
            {children.map(child => (
              <button
                key={child.id}
                onClick={() => setActiveChild(child.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap ${
                  activeChildId === child.id
                    ? 'bg-kids-orange text-white shadow-md'
                    : 'bg-white text-gray-600 border-2 border-gray-200'
                }`}
              >
                {child.avatarEmoji} {child.name}
              </button>
            ))}
          </div>
        )}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/parent')}
          className="ml-auto bg-white text-gray-600 font-bold px-4 py-2 rounded-full border-2 border-gray-200 shadow-sm text-sm"
        >
          ⚙️ Parent
        </motion.button>
      </div>

      {activeChild && <Dashboard child={activeChild} onChildUpdate={(updated) =>
        setChildren(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c))
      } />}
    </div>
  )
}
