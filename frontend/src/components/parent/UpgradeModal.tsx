import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Capacitor } from '@capacitor/core'
import { useAuthStore } from '../../store/useStore'
import { getOfferings, purchasePackage, restorePurchases, hasPremiumEntitlement } from '../../utils/purchases'
import { useTranslation } from 'react-i18next'
import api from '../../api/client'

const FEATURES = [
  { label: 'Enfants',          free: '1',           premium: 'Illimité' },
  { label: 'Habitudes',        free: '5 / enfant',  premium: 'Illimité' },
  { label: 'Récompenses',      free: '3 / enfant',  premium: 'Illimité' },
  { label: 'Rappels',          free: '1 / enfant',  premium: 'Illimité' },
  { label: 'Historique stats', free: '7 jours',     premium: '30 jours' },
  { label: 'Taux de réussite', free: false,         premium: true },
  { label: 'Export CSV',       free: false,         premium: true },
]

interface Props { onClose: () => void }

export default function UpgradeModal({ onClose }: Props) {
  const { user, setUser } = useAuthStore()
  const { i18n } = useTranslation()
  const isNative = Capacitor.isNativePlatform()

  const [offering, setOffering] = useState<any>(null)
  const [selectedPkg, setSelectedPkg] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const isRTL = i18n.language === 'ar'

  useEffect(() => {
    if (!isNative) return
    getOfferings().then(off => {
      if (!off) return
      setOffering(off)
      // Sélectionner l'annuel par défaut
      const annual = off.annual ?? off.availablePackages.find((p: any) => p.packageType === 'ANNUAL')
      const monthly = off.monthly ?? off.availablePackages.find((p: any) => p.packageType === 'MONTHLY')
      setSelectedPkg(annual ?? monthly ?? off.availablePackages[0])
    }).catch(() => {})
  }, [isNative])

  const handlePurchase = async () => {
    if (!selectedPkg) return
    setError('')
    setLoading(true)
    try {
      const info = await purchasePackage(selectedPkg)
      if (hasPremiumEntitlement(info)) {
        // Notifier le backend
        await api.post('/auth/upgrade')
        if (user) setUser({ ...user, plan: 'PREMIUM' })
        setDone(true)
        setTimeout(onClose, 2000)
      }
    } catch (e: any) {
      if (e?.code !== 'PURCHASE_CANCELLED') {
        setError('Erreur lors de l\'achat. Réessayez.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async () => {
    setRestoring(true)
    setError('')
    try {
      const info = await restorePurchases()
      if (hasPremiumEntitlement(info)) {
        await api.post('/auth/upgrade')
        if (user) setUser({ ...user, plan: 'PREMIUM' })
        setDone(true)
        setTimeout(onClose, 2000)
      } else {
        setError('Aucun abonnement actif trouvé.')
      }
    } catch {
      setError('Erreur lors de la restauration.')
    } finally {
      setRestoring(false)
    }
  }

  // Fallback web : activation directe (pour tests hors Android)
  const handleWebUpgrade = async () => {
    setLoading(true)
    try {
      await api.post('/auth/upgrade')
      if (user) setUser({ ...user, plan: 'PREMIUM' })
      setDone(true)
      setTimeout(onClose, 1800)
    } catch {
      setError('Erreur lors de l\'activation')
    } finally {
      setLoading(false)
    }
  }

  const packages = offering?.availablePackages ?? []
  const monthlyPkg = packages.find((p: any) => p.packageType === 'MONTHLY')
  const annualPkg  = packages.find((p: any) => p.packageType === 'ANNUAL')

  const monthlyPrice = monthlyPkg?.product?.priceString ?? '29 MAD'
  const annualPrice  = annualPkg?.product?.priceString  ?? '199 MAD'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <motion.div
          initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
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

          <div className="p-5 space-y-4">
            {done ? (
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center py-6">
                <div className="text-6xl mb-3">🎉</div>
                <p className="text-xl font-black text-gray-800">Bienvenue Premium !</p>
                <p className="text-gray-500 font-semibold mt-1">Toutes les fonctionnalités sont débloquées</p>
              </motion.div>
            ) : (
              <>
                {/* Tableau comparatif */}
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
                        {typeof f.free === 'boolean' ? (f.free ? '✅' : '❌') : f.free}
                      </span>
                      <span className="text-center text-xs font-bold text-kids-teal">
                        {typeof f.premium === 'boolean' ? (f.premium ? '✅' : '❌') : f.premium}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Sélection du plan */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Mensuel */}
                  <button
                    onClick={() => setSelectedPkg(monthlyPkg ?? null)}
                    className={`border-2 rounded-2xl p-3 text-left transition-all ${
                      selectedPkg?.packageType === 'MONTHLY'
                        ? 'border-kids-orange bg-orange-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <p className="text-xs font-bold text-gray-500 mb-1">Mensuel</p>
                    <p className="text-lg font-black text-gray-800">{monthlyPrice}</p>
                    <p className="text-xs text-gray-400">/ mois</p>
                  </button>

                  {/* Annuel */}
                  <button
                    onClick={() => setSelectedPkg(annualPkg ?? null)}
                    className={`border-2 rounded-2xl p-3 text-left relative transition-all ${
                      selectedPkg?.packageType === 'ANNUAL'
                        ? 'border-kids-orange bg-orange-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <span className="absolute -top-2 right-2 bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      -43%
                    </span>
                    <p className="text-xs font-bold text-gray-500 mb-1">Annuel</p>
                    <p className="text-lg font-black text-gray-800">{annualPrice}</p>
                    <p className="text-xs text-gray-400">/ an</p>
                  </button>
                </div>

                {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}

                {/* Bouton principal */}
                {isNative ? (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    disabled={loading || !selectedPkg}
                    onClick={handlePurchase}
                    className="w-full bg-gradient-to-r from-kids-orange to-yellow-400 text-white font-black py-4 rounded-2xl text-lg shadow-lg disabled:opacity-60"
                  >
                    {loading ? '⏳ Traitement...' : `✨ S'abonner via Google Play`}
                  </motion.button>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    disabled={loading}
                    onClick={handleWebUpgrade}
                    className="w-full bg-gradient-to-r from-kids-orange to-yellow-400 text-white font-black py-4 rounded-2xl text-lg shadow-lg disabled:opacity-60"
                  >
                    {loading ? '⏳ Activation...' : '✨ Activer Premium'}
                  </motion.button>
                )}

                {/* Restaurer les achats */}
                {isNative && (
                  <button
                    onClick={handleRestore}
                    disabled={restoring}
                    className="w-full text-sm text-gray-400 font-semibold py-1 disabled:opacity-50"
                  >
                    {restoring ? '⏳ Restauration...' : '🔄 Restaurer mes achats'}
                  </button>
                )}

                <p className="text-center text-xs text-gray-400">
                  Annulable à tout moment · Géré par Google Play
                </p>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
