import { useState } from 'react'
import { motion } from 'framer-motion'
import api from '../api/client'
import { useAuthStore } from '../store/useStore'

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login'
      const { data } = await api.post(endpoint, form)
      login(data.token, data.user)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-kids-yellow to-kids-orange flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center mb-8"
      >
        <motion.div
          className="text-8xl mb-2 inline-block"
          animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          ⭐
        </motion.div>
        <h1 className="text-5xl font-black text-white drop-shadow-md">HabitKids</h1>
        <p className="text-white/80 font-bold text-lg mt-1">Les habitudes des champions !</p>
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl"
      >
        <h2 className="text-2xl font-black text-gray-800 mb-6 text-center">
          {isRegister ? '👋 Créer un compte' : '👋 Bon retour !'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <input
              type="text"
              placeholder="Ton prénom"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full p-4 rounded-2xl border-2 border-gray-200 font-semibold text-lg focus:border-kids-orange focus:outline-none"
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full p-4 rounded-2xl border-2 border-gray-200 font-semibold text-lg focus:border-kids-orange focus:outline-none"
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            className="w-full p-4 rounded-2xl border-2 border-gray-200 font-semibold text-lg focus:border-kids-orange focus:outline-none"
            required
            minLength={8}
          />

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 font-semibold text-center"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.95 }}
            className="w-full bg-kids-orange text-white font-black text-xl py-4 rounded-2xl shadow-lg disabled:opacity-60"
          >
            {loading ? '⏳' : isRegister ? '🚀 Démarrer !' : '🎯 Entrer !'}
          </motion.button>
        </form>

        <button
          onClick={() => setIsRegister(!isRegister)}
          className="w-full mt-4 text-gray-500 font-semibold text-center"
        >
          {isRegister ? 'Déjà un compte ? Connexion' : "Pas de compte ? S'inscrire"}
        </button>
      </motion.div>
    </div>
  )
}
