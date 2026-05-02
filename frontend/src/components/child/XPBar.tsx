import { motion } from 'framer-motion'

const LEVEL_XP    = [0, 100, 300, 600, 1000, 1500]
const LEVEL_NAMES = ['', 'Petit explorateur', 'Apprenti champion', 'Héros du quotidien', 'Super champion', 'Légende']

export default function XPBar({ xp, level }: { xp: number; level: number }) {
  const curXP  = LEVEL_XP[level - 1] ?? 0
  const nextXP = LEVEL_XP[level]     ?? LEVEL_XP[LEVEL_XP.length - 1]
  const pct    = Math.min(((xp - curXP) / (nextXP - curXP)) * 100, 100)

  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm border-2 border-purple-100 mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-black text-kids-purple">
          Niv. {level} — {LEVEL_NAMES[level] ?? 'Légende'}
        </span>
        <span className="text-xs font-bold text-gray-400">{xp} XP</span>
      </div>
      <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-kids-purple to-kids-pink"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1 text-right font-semibold">
        {nextXP - xp} XP avant niveau {level + 1}
      </p>
    </div>
  )
}
