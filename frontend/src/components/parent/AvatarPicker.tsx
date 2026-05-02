import { useState } from 'react'
import { motion } from 'framer-motion'

const AVATARS = ['🧒','👦','👧','🧑','👱','🧑‍🦰','🧑‍🦱','🧑‍🦳','🦸','🧙','🧚','🦊','🐱','🐶','🦁','🐸','🦄','🐧','🐻','🐼']
const COLORS  = ['#FF6B6B','#FF9F43','#FECA57','#1DD1A1','#54A0FF','#5F27CD','#FF9FF3','#48DBFB','#A29BFE','#FD79A8','#00CEC9','#6C5CE7']

interface Props {
  emoji: string
  color: string
  onChange: (emoji: string, color: string) => void
}

export default function AvatarPicker({ emoji, color, onChange }: Props) {
  const [tab, setTab] = useState<'emoji' | 'color'>('emoji')

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-gray-100">
      <div className="text-center mb-4">
        <div className="text-6xl mb-1 inline-block"
          style={{ filter: `drop-shadow(0 0 8px ${color}88)` }}>
          {emoji}
        </div>
        <div className="w-8 h-8 rounded-full mx-auto border-4 border-white shadow-md"
          style={{ backgroundColor: color }} />
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-3">
        <button onClick={() => setTab('emoji')}
          className={`flex-1 py-1 rounded-lg text-sm font-bold transition-all ${tab === 'emoji' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>
          Avatar
        </button>
        <button onClick={() => setTab('color')}
          className={`flex-1 py-1 rounded-lg text-sm font-bold transition-all ${tab === 'color' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>
          Couleur
        </button>
      </div>

      {tab === 'emoji' && (
        <div className="grid grid-cols-5 gap-2">
          {AVATARS.map(a => (
            <motion.button key={a} whileTap={{ scale: 0.85 }} onClick={() => onChange(a, color)}
              className={`text-2xl p-2 rounded-xl border-2 transition-all ${a === emoji ? 'border-kids-orange bg-orange-50' : 'border-transparent hover:border-gray-200'}`}>
              {a}
            </motion.button>
          ))}
        </div>
      )}

      {tab === 'color' && (
        <div className="grid grid-cols-6 gap-2">
          {COLORS.map(c => (
            <motion.button key={c} whileTap={{ scale: 0.85 }} onClick={() => onChange(emoji, c)}
              className={`w-10 h-10 rounded-full border-4 transition-transform ${c === color ? 'scale-125 border-gray-500' : 'border-white shadow'}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
      )}
    </div>
  )
}
