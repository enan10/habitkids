import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface CelebrationData {
  pointsEarned: number
  newXP: number
  leveledUp: boolean
  newLevel: number
}

const EMOJIS = ['🎉', '🌟', '🏆', '🎊', '🦄', '🥳']
const MSGS   = ['Super bien joué !', 'Tu es formidable !', 'Excellent travail !', 'Tu es un champion !', 'Continue comme ça !']

export default function CelebrationModal({ data, onClose }: { data: CelebrationData | null; onClose: () => void }) {
  useEffect(() => {
    if (!data) return
    const t = setTimeout(onClose, 2800)
    return () => clearTimeout(t)
  }, [data])

  const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
  const msg   = MSGS[Math.floor(Math.random() * MSGS.length)]

  return (
    <AnimatePresence>
      {data && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6"
        >
          <motion.div
            initial={{ scale: 0.5, y: 60 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-xs w-full relative overflow-hidden"
          >
            <motion.div
              className="text-7xl mb-3 inline-block"
              animate={{ rotate: [0, -12, 12, -6, 6, 0], scale: [1, 1.25, 1] }}
              transition={{ duration: 0.7 }}
            >
              {emoji}
            </motion.div>

            <h2 className="text-2xl font-black text-gray-800 mb-2">{msg}</h2>

            <motion.div
              className="text-5xl font-black text-kids-orange my-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.25, type: 'spring', bounce: 0.6 }}
            >
              +{data.pointsEarned} ⭐
            </motion.div>

            {data.leveledUp && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-r from-kids-purple to-kids-pink text-white rounded-2xl p-3 font-black text-lg"
              >
                🏆 NIVEAU {data.newLevel} ATTEINT !
              </motion.div>
            )}

            <p className="text-gray-400 text-sm font-semibold mt-4">Appuie pour continuer</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
