import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import api from '../../api/client'

interface DayStat { date: string; count: number; points: number }

interface Props {
  childId: string
  childName: string
  isPremium: boolean
  onUpgrade: () => void
}

export default function StatsView({ childId, childName, isPremium, onUpgrade }: Props) {
  const [stats, setStats]   = useState<DayStat[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange]   = useState<7 | 30>(7)

  const fetchStats = async (days: number) => {
    setLoading(true)
    const to   = new Date().toISOString().split('T')[0]
    const from = new Date(Date.now() - (days - 1) * 86400000).toISOString().split('T')[0]
    const res  = await api.get(`/completions/range/${childId}?from=${from}&to=${to}`)
    const grouped = (res.data as any[]).reduce((acc: any, c: any) => {
      if (!acc[c.date]) acc[c.date] = { date: c.date, count: 0, points: 0 }
      acc[c.date].count++
      acc[c.date].points += c.pointsEarned
      return acc
    }, {})
    const result: DayStat[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0]
      result.push(grouped[d] ?? { date: d, count: 0, points: 0 })
    }
    setStats(result)
    setLoading(false)
  }

  useEffect(() => { fetchStats(range) }, [childId, range])

  const exportCSV = () => {
    const header = 'Date,Habitudes complétées,Points gagnés'
    const rows = stats.map(s => `${s.date},${s.count},${s.points}`)
    const csv  = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `habitkids-${childName}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="text-center py-8 text-3xl">⏳</div>

  const maxPts     = Math.max(...stats.map(s => s.points), 1)
  const totalPts   = stats.reduce((s, d) => s + d.points, 0)
  const totalAct   = stats.reduce((s, d) => s + d.count, 0)
  const activeDays = stats.filter(s => s.count > 0).length
  const successRate = stats.length > 0 ? Math.round((activeDays / stats.length) * 100) : 0
  const bestDay    = stats.reduce((best, d) => d.points > best.points ? d : best, stats[0])

  const dayLabel = (d: string) => {
    const date = new Date(d + 'T12:00:00')
    if (range === 7) return date.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 3)
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="space-y-4">
      {/* Range selector (Premium) */}
      <div className="flex gap-2 items-center">
        <div className="flex bg-gray-100 rounded-xl overflow-hidden text-xs font-bold flex-1">
          <button onClick={() => setRange(7)}
            className={`flex-1 py-2 transition-all ${range === 7 ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}>
            7 jours
          </button>
          <button
            onClick={() => isPremium ? setRange(30) : onUpgrade()}
            className={`flex-1 py-2 transition-all flex items-center justify-center gap-1 ${
              range === 30 ? 'bg-white shadow text-gray-800' : 'text-gray-400'
            }`}>
            30 jours {!isPremium && <span className="text-kids-orange">🔒</span>}
          </button>
        </div>
        {isPremium && (
          <button onClick={exportCSV}
            className="flex items-center gap-1 px-3 py-2 bg-kids-teal text-white text-xs font-bold rounded-xl">
            📥 CSV
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-3xl font-black text-kids-orange">⭐ {totalPts}</p>
          <p className="text-xs font-bold text-gray-500 mt-1">points sur {range} jours</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-3xl font-black text-kids-teal">✅ {totalAct}</p>
          <p className="text-xs font-bold text-gray-500 mt-1">habitudes faites</p>
        </div>

        {/* Premium-only cards */}
        {isPremium ? (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <p className="text-3xl font-black text-kids-blue">🎯 {successRate}%</p>
              <p className="text-xs font-bold text-gray-500 mt-1">taux de réussite</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <p className="text-xl font-black text-purple-500">
                🏆 {bestDay.points > 0
                  ? new Date(bestDay.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                  : '—'}
              </p>
              <p className="text-xs font-bold text-gray-500 mt-1">meilleur jour</p>
            </div>
          </>
        ) : (
          <button onClick={onUpgrade}
            className="col-span-2 bg-orange-50 border-2 border-dashed border-kids-orange rounded-2xl p-3 flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <div className="text-left">
              <p className="text-sm font-black text-kids-orange">Stats avancées</p>
              <p className="text-xs text-gray-500">Taux de réussite, meilleur jour, export CSV</p>
            </div>
            <span className="ml-auto text-xs font-bold text-kids-orange bg-orange-100 px-2 py-1 rounded-full">Premium</span>
          </button>
        )}
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h4 className="font-black text-gray-700 mb-4">Points par jour</h4>
        <div className="flex items-end gap-1 h-28 overflow-x-auto">
          {stats.map((s, i) => (
            <div key={s.date} className="flex-1 min-w-[24px] flex flex-col items-center gap-1">
              <motion.div
                className="w-full rounded-t-lg bg-gradient-to-t from-kids-orange to-kids-yellow"
                initial={{ height: 0 }}
                animate={{ height: `${(s.points / maxPts) * 100}%` }}
                transition={{ delay: i * 0.02, duration: 0.4 }}
                style={{ minHeight: s.points > 0 ? '8px' : '3px', opacity: s.points > 0 ? 1 : 0.15 }}
              />
              {range === 7 && (
                <span className="text-xs font-bold text-gray-400 capitalize">{dayLabel(s.date)}</span>
              )}
            </div>
          ))}
        </div>
        {range === 30 && (
          <p className="text-xs text-gray-400 text-center mt-2">
            {new Date(stats[0]?.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            {' → '}
            {new Date(stats[stats.length - 1]?.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </p>
        )}
      </div>
    </div>
  )
}
