import { useEffect, useState, useCallback } from 'react'
import api from '../api/client'

export interface Habit {
  id: string
  title: string
  emoji: string
  color: string
  category: string
  pointValue: number
  frequency: string
  timeOfDay: string
  daysOfWeek: number[]
  order: number
}

export interface HabitCompletion {
  id: string
  habitId: string
  date: string
  pointsEarned: number
}

export function useHabits(childId: string | null) {
  const [habits, setHabits] = useState<Habit[]>([])
  const [completions, setCompletions] = useState<HabitCompletion[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!childId) return
    setLoading(true)
    try {
      const [childRes, completionsRes] = await Promise.all([
        api.get(`/children/${childId}?filter=today`),
        api.get(`/completions/today/${childId}`),
      ])
      setHabits(childRes.data.habits ?? [])
      setCompletions(completionsRes.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [childId])

  useEffect(() => { fetchData() }, [fetchData])

  const completeHabit = useCallback(async (habitId: string) => {
    const res = await api.post('/completions', { habitId, childId })
    await fetchData()
    return res.data
  }, [childId, fetchData])

  const uncompleteHabit = useCallback(async (habitId: string) => {
    await api.delete(`/completions/${habitId}`)
    await fetchData()
  }, [fetchData])

  const isCompleted = useCallback(
    (habitId: string) => completions.some(c => c.habitId === habitId),
    [completions]
  )

  return { habits, completions, loading, completeHabit, uncompleteHabit, isCompleted, refresh: fetchData }
}
