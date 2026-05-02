import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import api from '../../api/client'

interface DayStat { date: string; count: number; points: number }

export default function StatsView({ childId }: { childId: string }) {
  const [stats, setStats] = useState<DayStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const to   = new Date().toISOString().split('T')[0]
    const from = new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0]
    api.get(`/completions/range/${childId}?from=${from}&to=${to}`).then(res => {
      const grouped = (res.data as any[]).reduce((acc: any, c: any) => {
        if (!acc[c.date]) acc[c.date] = { date: c.date, count: 0, points: 0 }
        acc[c.date].count++
        acc[c.date].points += c.pointsEarned
        return acc
      }, {})
      const result: DayStat[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0]
        result.push(grouped[d] ?? { date: d, count: 0, points: 0 })
      }
      setStats(result)
      setLoading(false)
    })
  }, [childId])

  if (loading) return <div className="text-center py-8 text-3xl">⏳</div>

  const maxPts   = Math.max(...stats.map(s => s.points), 1)
  const totalPts = stats.reduce((s, d) => s + d.points, 0)
  const totalAct = stats.reduce((s, d) => s + d.count, 0)
  const dayLabel = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 3)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-3xl font-black text-kids-orange">⭐ {totalPts}</p>
          <p className="text-sm font-bold text-gray-500">points cette semaine</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-3xl font-black text-kids-teal">✅ {totalAct}</p>
          <p className="text-sm font-bold text-gray-500">habitudes faites</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h4 className="font-black text-gray-700 mb-4">Points par jour</h4>
        <div className="flex items-end gap-2 h-28">
          {stats.map((s, i) => (
            <div key={s.date} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                className="w-full rounded-t-xl bg-gradient-to-t from-kids-orange to-kids-yellow"
                initial={{ height: 0 }}
                animate={{ height: `${(s.points / maxPts) * 100}%` }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                style={{ minHeight: s.points > 0 ? '8px' : '3px', opacity: s.points > 0 ? 1 : 0.2 }}
              />
              <span className="text-xs font-bold text-gray-500 capitalize">{dayLabel(s.date)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
