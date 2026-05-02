import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { playBadge } from '../../utils/sounds'

interface Badge {
  code: string
  emoji: string
  title: string
  description: string
}

interface Props {
  badges: Badge[]
  onClose: () => void
}

export default function BadgeEarnedModal({ badges, onClose }: Props) {
  const badge = badges[0] ?? null

  useEffect(() => {
    if (!badge) return
    playBadge()
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [badge])

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-6"
        >
          <motion.div
            initial={{ scale: 0.3, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.6 }}
            className="bg-gradient-to-b from-yellow-50 to-orange-50 border-4 border-yellow-400 rounded-3xl p-8 text-center shadow-2xl max-w-xs w-full"
          >
            <p className="text-sm font-black text-kids-orange uppercase tracking-widest mb-2">
              🏅 Nouveau badge !
            </p>
            <motion.div
              className="text-8xl my-4 inline-block"
              animate={{ rotate: [0, -15, 15, -8, 8, 0], scale: [1, 1.3, 1] }}
              transition={{ duration: 0.8 }}
            >
              {badge.emoji}
            </motion.div>
            <h2 className="text-2xl font-black text-gray-800 mb-1">{badge.title}</h2>
            <p className="text-gray-500 font-semibold">{badge.description}</p>
            {badges.length > 1 && (
              <p className="text-kids-orange font-bold mt-2">+{badges.length - 1} autre(s) badge(s) !</p>
            )}
            <p className="text-gray-400 text-sm font-semibold mt-4">Appuie pour continuer</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
