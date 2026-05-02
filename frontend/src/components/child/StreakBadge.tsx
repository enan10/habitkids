import { motion } from 'framer-motion'

export default function StreakBadge({ days }: { days: number }) {
  const active = days > 0
  return (
    <motion.div
      className={`flex-1 rounded-2xl p-3 shadow-sm border-2 flex flex-col items-center justify-center ${
        active ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'
      }`}
      animate={active ? { scale: [1, 1.03, 1] } : {}}
      transition={{ repeat: Infinity, duration: 2 }}
    >
      <span className="text-2xl">{active ? '🔥' : '💤'}</span>
      <span className={`text-2xl font-black ${active ? 'text-kids-orange' : 'text-gray-400'}`}>{days}</span>
      <span className="text-xs font-bold text-gray-500">{days <= 1 ? 'jour' : 'jours'}</span>
    </motion.div>
  )
}
