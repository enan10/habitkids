import { motion } from 'framer-motion'

interface Habit {
  id: string
  title: string
  emoji: string
  color: string
  pointValue: number
}

interface Props {
  habit: Habit
  completed: boolean
  onComplete: () => void
  onUncomplete: () => void
}

export default function HabitCard({ habit, completed, onComplete, onUncomplete }: Props) {
  return (
    <motion.button
      onClick={completed ? onUncomplete : onComplete}
      whileTap={{ scale: 0.9 }}
      animate={completed ? { scale: [1, 1.06, 1] } : {}}
      transition={{ duration: 0.3 }}
      className="w-full aspect-square rounded-2xl p-2 flex flex-col items-center justify-center gap-1 shadow-md relative overflow-hidden"
      style={
        completed
          ? { background: `linear-gradient(135deg, ${habit.color}, ${habit.color}bb)` }
          : { background: '#fff', border: '2px solid #f0f0f0' }
      }
    >
      {completed && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.12 }}
          className="absolute inset-0 flex items-center justify-center text-[80px] pointer-events-none"
        >
          ✓
        </motion.div>
      )}

      <span className="text-3xl leading-none">{habit.emoji}</span>

      <span className={`font-black text-xs text-center leading-tight ${completed ? 'text-white' : 'text-gray-700'}`}>
        {habit.title}
      </span>

      <div className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
        completed ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
      }`}>
        {completed ? '✅ Fait !' : `⭐ +${habit.pointValue}`}
      </div>
    </motion.button>
  )
}
