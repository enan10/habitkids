import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../api/client'
import { useAuthStore } from '../store/useStore'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-kids-yellow to-kids-orange flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center">
          <div className="text-5xl mb-4">❌</div>
          <p className="font-black text-gray-800 text-xl mb-2">Lien invalide</p>
          <p className="text-gray-500 mb-6">Ce lien de réinitialisation est invalide ou a expiré.</p>
          <button onClick={() => navigate('/')}
            className="w-full bg-kids-orange text-white font-black py-3 rounded-2xl">
            Retour à la connexion
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-kids-yellow to-kids-orange flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center">
          <div className="text-5xl mb-4">✅</div>
          <p className="font-black text-gray-800 text-xl mb-2">Mot de passe mis à jour !</p>
          <p className="text-gray-500 mb-6">Vous êtes maintenant connecté.</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/auth/reset-password', { token, newPassword: password })
      login(data.token, data.user)
      setSuccess(true)
      setTimeout(() => navigate('/child'), 1500)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Lien invalide ou expiré')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-kids-yellow to-kids-orange flex flex-col items-center justify-center p-6">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="text-center mb-8">
        <div className="text-7xl mb-2">🔑</div>
        <h1 className="text-4xl font-black text-white drop-shadow-md">HabitKids</h1>
      </motion.div>

      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
        className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
        <h2 className="text-2xl font-black text-gray-800 mb-2 text-center">Nouveau mot de passe</h2>
        <p className="text-gray-500 text-sm text-center mb-6">Choisissez un mot de passe d'au moins 8 caractères.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Nouveau mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-4 rounded-2xl border-2 border-gray-200 font-semibold text-lg focus:border-kids-orange focus:outline-none"
            required
            minLength={8}
          />
          <input
            type="password"
            placeholder="Confirmer le mot de passe"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="w-full p-4 rounded-2xl border-2 border-gray-200 font-semibold text-lg focus:border-kids-orange focus:outline-none"
            required
            minLength={8}
          />

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-red-500 font-semibold text-center text-sm">
              {error}
            </motion.p>
          )}

          <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.95 }}
            className="w-full bg-kids-orange text-white font-black text-xl py-4 rounded-2xl shadow-lg disabled:opacity-60">
            {loading ? '⏳' : '✅ Enregistrer'}
          </motion.button>
        </form>

        <button onClick={() => navigate('/')}
          className="w-full mt-4 text-gray-400 font-semibold text-center text-sm">
          ← Retour à la connexion
        </button>
      </motion.div>
    </div>
  )
}
