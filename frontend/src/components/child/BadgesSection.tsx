import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import api from '../../api/client'

interface Badge {
  code: string
  emoji: string
  title: string
  description: string
  earned: boolean
  earnedAt: string | null
}

export default function BadgesSection({ childId }: { childId: string }) {
  const [badges, setBadges] = useState<Badge[]>([])

  useEffect(() => {
    api.get(`/badges/${childId}`).then(res => setBadges(res.data)).catch(() => {})
  }, [childId])

  const earned = badges.filter(b => b.earned)
  const locked = badges.filter(b => !b.earned)

  if (badges.length === 0) return null

  return (
    <div className="mt-4">
      <h3 className="font-black text-gray-700 mb-2">
        🏅 Mes badges <span className="text-kids-orange">({earned.length}/{badges.length})</span>
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
        {earned.map((badge, i) => (
          <motion.div
            key={badge.code}
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: i * 0.05, type: 'spring', bounce: 0.5 }}
            className="flex-shrink-0 snap-start bg-gradient-to-b from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl p-3 text-center w-20 shadow-sm"
            title={badge.description}
          >
            <div className="text-3xl mb-1">{badge.emoji}</div>
            <p className="text-xs font-black text-gray-700 leading-tight">{badge.title}</p>
          </motion.div>
        ))}
        {locked.slice(0, 4).map(badge => (
          <div
            key={badge.code}
            className="flex-shrink-0 snap-start bg-gray-100 border-2 border-gray-200 rounded-2xl p-3 text-center w-20 opacity-40"
            title={badge.description}
          >
            <div className="text-3xl mb-1 grayscale">🔒</div>
            <p className="text-xs font-bold text-gray-400 leading-tight">{badge.title}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
