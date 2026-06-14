import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/client'
import { useAuthStore } from '../store/useStore'

type Mode = 'login' | 'register' | 'forgot'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [form, setForm] = useState({ email: '', password: '', name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const { login } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'forgot') {
        await api.post('/auth/forgot-password', { email: form.email })
        setForgotSent(true)
      } else {
        const endpoint = mode === 'register' ? '/auth/register' : '/auth/login'
        const { data } = await api.post(endpoint, form)
        login(data.token, data.user)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const title = mode === 'register' ? '👋 Créer un compte' : mode === 'forgot' ? '🔑 Mot de passe oublié' : '👋 Bon retour !'

  return (
    <div className="min-h-screen bg-gradient-to-b from-kids-yellow to-kids-orange flex flex-col items-center justify-center p-6">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="text-center mb-8">
        <motion.div className="text-8xl mb-2 inline-block"
          animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 3 }}>
          ⭐
        </motion.div>
        <h1 className="text-5xl font-black text-white drop-shadow-md">HabitKids</h1>
        <p className="text-white/80 font-bold text-lg mt-1">Les habitudes des champions !</p>
      </motion.div>

      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
        className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">

        <AnimatePresence mode="wait">
          {mode === 'forgot' && forgotSent ? (
            <motion.div key="sent" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="text-center py-4">
              <div className="text-5xl mb-4">📬</div>
              <p className="font-black text-gray-800 text-xl mb-2">Email envoyé !</p>
              <p className="text-gray-500 text-sm mb-6">
                Si cet email est enregistré, vous recevrez un lien de réinitialisation dans quelques instants.
              </p>
              <button onClick={() => { setMode('login'); setForgotSent(false); setForm(f => ({ ...f, email: '' })) }}
                className="w-full bg-kids-orange text-white font-black py-3 rounded-2xl">
                Retour à la connexion
              </button>
            </motion.div>
          ) : (
            <motion.div key={mode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <h2 className="text-2xl font-black text-gray-800 mb-2 text-center">{title}</h2>
              {mode === 'forgot' && (
                <p className="text-gray-500 text-sm text-center mb-4">
                  Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {mode === 'register' && (
                  <input type="text" placeholder="Ton prénom" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full p-4 rounded-2xl border-2 border-gray-200 font-semibold text-lg focus:border-kids-orange focus:outline-none"
                    required />
                )}
                <input type="email" placeholder="Email" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full p-4 rounded-2xl border-2 border-gray-200 font-semibold text-lg focus:border-kids-orange focus:outline-none"
                  required />
                {mode !== 'forgot' && (
                  <input type="password" placeholder="Mot de passe" value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full p-4 rounded-2xl border-2 border-gray-200 font-semibold text-lg focus:border-kids-orange focus:outline-none"
                    required minLength={8} />
                )}

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-red-500 font-semibold text-center text-sm">
                    {error}
                  </motion.p>
                )}

                <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.95 }}
                  className="w-full bg-kids-orange text-white font-black text-xl py-4 rounded-2xl shadow-lg disabled:opacity-60">
                  {loading ? '⏳' : mode === 'register' ? '🚀 Démarrer !' : mode === 'forgot' ? '📧 Envoyer le lien' : '🎯 Entrer !'}
                </motion.button>
              </form>

              <div className="mt-4 space-y-2">
                {mode === 'login' && (
                  <button onClick={() => { setMode('forgot'); setError('') }}
                    className="w-full text-kids-orange font-semibold text-sm text-center">
                    Mot de passe oublié ?
                  </button>
                )}
                {mode !== 'forgot' ? (
                  <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
                    className="w-full text-gray-500 font-semibold text-center text-sm">
                    {mode === 'login' ? "Pas de compte ? S'inscrire" : 'Déjà un compte ? Connexion'}
                  </button>
                ) : (
                  <button onClick={() => { setMode('login'); setError('') }}
                    className="w-full text-gray-400 font-semibold text-center text-sm">
                    ← Retour à la connexion
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
