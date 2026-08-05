import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/useStore'
import { showRewardedAd } from '../../utils/admob'
import api from '../../api/client'

type AdType = 'habits' | 'rewards' | 'children'

interface Props {
  type: AdType
  onClose: () => void
  onUnlocked: () => void
}

const CONFIG: Record<AdType, { emoji: string; title: string; gain: string; color: string }> = {
  habits: {
    emoji: '✅',
    title: 'Limite d\'habitudes atteinte',
    gain: '+5 habitudes débloquées',
    color: 'from-kids-teal to-teal-400',
  },
  rewards: {
    emoji: '🎁',
    title: 'Limite de récompenses atteinte',
    gain: '+5 récompenses débloquées',
    color: 'from-kids-orange to-yellow-400',
  },
  children: {
    emoji: '👶',
    title: 'Limite d\'enfants atteinte',
    gain: '+1 enfant débloqué',
    color: 'from-purple-500 to-pink-400',
  },
}

export default function WatchAdModal({ type, onClose, onUnlocked }: Props) {
  const { user, setUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const cfg = CONFIG[type]

  const handleWatchAd = async () => {
    setLoading(true)
    setError('')
    try {
      const watched = await showRewardedAd()
      if (!watched) {
        setError('Vidéo non terminée. Regardez jusqu\'à la fin pour débloquer.')
        setLoading(false)
        return
      }

      // Notifier le backend
      const res = await api.post('/ads/reward', { type })
      const data = res.data

      // Mettre à jour le store
      if (user) {
        setUser({
          ...user,
          extraChildren: data.extraChildren,
          extraHabits: data.extraHabits,
          extraRewards: data.extraRewards,
        })
      }

      setDone(true)
      setTimeout(() => {
        onUnlocked()
        onClose()
      }, 1800)
    } catch (e: any) {
      if (e?.response?.status === 429) {
        setError('Limite journalière atteinte (3 vidéos/jour). Revenez demain !')
      } else {
        setError('Une erreur est survenue. Réessayez.')
      }
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
          className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
        >
          <div className={`bg-gradient-to-r ${cfg.color} px-6 py-5 text-white text-center`}>
            <div className="text-5xl mb-2">{cfg.emoji}</div>
            <p className="font-black text-lg">{cfg.title}</p>
          </div>

          <div className="p-6 space-y-4">
            {done ? (
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center py-4">
                <div className="text-5xl mb-3">🎉</div>
                <p className="text-lg font-black text-gray-800">{cfg.gain} !</p>
              </motion.div>
            ) : (
              <>
                <div className="bg-gray-50 rounded-2xl p-4 text-center">
                  <p className="text-gray-600 font-semibold text-sm mb-1">Regardez une courte vidéo pour obtenir</p>
                  <p className="text-2xl font-black text-gray-800">{cfg.gain}</p>
                  <p className="text-xs text-gray-400 mt-1">Débloqué définitivement sur votre compte</p>
                </div>

                <div className="text-xs text-gray-400 text-center">
                  Maximum 3 vidéos par jour
                </div>

                {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  disabled={loading}
                  onClick={handleWatchAd}
                  className={`w-full bg-gradient-to-r ${cfg.color} text-white font-black py-4 rounded-2xl text-base shadow-lg disabled:opacity-60`}
                >
                  {loading ? '⏳ Chargement...' : '▶️ Regarder une vidéo'}
                </motion.button>

                <button onClick={onClose} className="w-full text-sm text-gray-400 font-semibold py-1">
                  Annuler
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
