import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../api/client'
import { useAuthStore } from '../../store/useStore'

const FEATURES = [
  { label: 'Enfants',          free: '1',           premium: 'Illimité' },
  { label: 'Habitudes',        free: '5 / enfant',  premium: 'Illimité' },
  { label: 'Récompenses',      free: '3 / enfant',  premium: 'Illimité' },
  { label: 'Rappels',          free: '1 / enfant',  premium: 'Illimité' },
  { label: 'Historique stats', free: '7 jours',     premium: '30 jours' },
  { label: 'Taux de réussite', free: false,         premium: true },
  { label: 'Export CSV',       free: false,         premium: true },
]

interface Props {
  onClose: () => void
}

export default function UpgradeModal({ onClose }: Props) {
  const { user, setUser } = useAuthStore()
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const price = billing === 'monthly' ? '29 DH / mois' : '199 DH / an'
  const saving = billing === 'annual' ? '(économisez 149 DH)' : ''

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      await api.post('/auth/upgrade')
      if (user) setUser({ ...user, plan: 'PREMIUM' })
      setDone(true)
      setTimeout(onClose, 1800)
    } catch {
      alert('Erreur lors de l\'activation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-kids-orange to-yellow-400 px-6 py-5 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-2xl font-black">🚀 Passez Premium</p>
                <p className="text-sm font-semibold opacity-90 mt-1">Débloquez toutes les fonctionnalités</p>
              </div>
              <button onClick={onClose} className="text-white/70 hover:text-white font-bold text-xl">✕</button>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {done ? (
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                className="text-center py-6">
                <div className="text-6xl mb-3">🎉</div>
                <p className="text-xl font-black text-gray-800">Bienvenue Premium !</p>
                <p className="text-gray-500 font-semibold mt-1">Toutes les fonctionnalités sont débloquées</p>
              </motion.div>
            ) : (
              <>
                {/* Feature comparison */}
                <div className="bg-gray-50 rounded-2xl overflow-hidden">
                  <div className="grid grid-cols-3 text-xs font-black text-gray-500 bg-gray-100 px-3 py-2">
                    <span>Fonctionnalité</span>
                    <span className="text-center">Gratuit</span>
                    <span className="text-center text-kids-orange">Premium</span>
                  </div>
                  {FEATURES.map(f => (
                    <div key={f.label} className="grid grid-cols-3 px-3 py-2.5 border-b border-gray-100 last:border-0 items-center">
                      <span className="text-xs font-bold text-gray-700">{f.label}</span>
                      <span className="text-center text-xs text-gray-400">
                        {typeof f.free === 'boolean'
                          ? (f.free ? '✅' : '❌')
                          : f.free}
                      </span>
                      <span className="text-center text-xs font-bold text-kids-teal">
                        {typeof f.premium === 'boolean'
                          ? (f.premium ? '✅' : '❌')
                          : f.premium}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Billing toggle */}
                <div>
                  <div className="flex bg-gray-100 rounded-2xl p-1 gap-1 mb-3">
                    <button onClick={() => setBilling('monthly')}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${billing === 'monthly' ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}>
                      Mensuel
                    </button>
                    <button onClick={() => setBilling('annual')}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${billing === 'annual' ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}>
                      Annuel
                      <span className="ml-1 bg-green-100 text-green-600 text-xs px-1.5 py-0.5 rounded-full">-43%</span>
                    </button>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-black text-gray-800">{price}</p>
                    {saving && <p className="text-sm text-green-500 font-bold">{saving}</p>}
                  </div>
                </div>

                {/* CTA */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  disabled={loading}
                  onClick={handleUpgrade}
                  className="w-full bg-gradient-to-r from-kids-orange to-yellow-400 text-white font-black py-4 rounded-2xl text-lg shadow-lg disabled:opacity-60">
                  {loading ? '⏳ Activation...' : `✨ Activer Premium — ${price}`}
                </motion.button>

                <p className="text-center text-xs text-gray-400">
                  Annulable à tout moment · Paiement sécurisé
                </p>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
