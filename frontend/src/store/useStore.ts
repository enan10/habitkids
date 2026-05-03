import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  plan: 'FREE' | 'PREMIUM'
}

interface AuthState {
  token: string | null
  user: User | null
  activeChildId: string | null
  login: (token: string, user: User) => void
  logout: () => void
  setActiveChild: (childId: string) => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      activeChildId: null,
      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null, activeChildId: null }),
      setActiveChild: (childId) => set({ activeChildId: childId }),
      setUser: (user) => set({ user }),
    }),
    { name: 'habitkids-auth' }
  )
)
