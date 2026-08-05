import { Capacitor } from '@capacitor/core'

const PROD_APP_ID     = import.meta.env.VITE_ADMOB_APP_ID as string
const PROD_BANNER_ID  = import.meta.env.VITE_ADMOB_BANNER_ID as string
const PROD_REWARDED_ID = import.meta.env.VITE_ADMOB_REWARDED_ID as string

// IDs de test Google (utilisés si les vrais IDs ne sont pas définis)
const TEST_BANNER_ID   = 'ca-app-pub-3940256099942544/6300978111'
const TEST_REWARDED_ID = 'ca-app-pub-3940256099942544/5224354917'

const BANNER_ID   = PROD_BANNER_ID   || TEST_BANNER_ID
const REWARDED_ID = PROD_REWARDED_ID || TEST_REWARDED_ID

let AdMob: any = null
let initPromise: Promise<void> | null = null

async function getAdMob() {
  if (!Capacitor.isNativePlatform()) return null
  if (!AdMob) {
    const mod = await import('@capacitor-community/admob')
    AdMob = mod.AdMob
  }
  return AdMob
}

export function initAdMob(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const admob = await getAdMob()
      if (!admob) return
      await admob.initialize({ requestTrackingAuthorization: false })
    })()
  }
  return initPromise
}

// Afficher la bannière en bas de l'écran
export async function showBanner() {
  const admob = await getAdMob()
  if (!admob) return
  try {
    const { BannerAdSize, BannerAdPosition } = await import('@capacitor-community/admob')
    await admob.showBanner({
      adId: BANNER_ID,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
    })
  } catch {}
}

// Masquer la bannière
export async function hideBanner() {
  const admob = await getAdMob()
  if (!admob) return
  try { await admob.hideBanner() } catch {}
}

// Supprimer la bannière
export async function removeBanner() {
  const admob = await getAdMob()
  if (!admob) return
  try { await admob.removeBanner() } catch {}
}

// Afficher une vidéo avec récompense — retourne true si regardée jusqu'au bout
export async function showRewardedAd(): Promise<boolean> {
  const admob = await getAdMob()

  // Sur web/dev : simuler une vidéo regardée après 1.5s
  if (!admob) {
    await new Promise(r => setTimeout(r, 1500))
    return true
  }

  return new Promise(async (resolve) => {
    try {
      const { RewardAdPluginEvents } = await import('@capacitor-community/admob')
      let rewarded = false

      const rewardListener = await admob.addListener(RewardAdPluginEvents.Rewarded, () => {
        rewarded = true
      })
      const dismissListener = await admob.addListener(RewardAdPluginEvents.Dismissed, () => {
        rewardListener.remove()
        dismissListener.remove()
        resolve(rewarded)
      })
      const failListener = await admob.addListener(RewardAdPluginEvents.FailedToLoad, () => {
        failListener.remove()
        resolve(false)
      })

      await admob.prepareRewardVideoAd({ adId: REWARDED_ID })
      await admob.showRewardVideoAd()
    } catch {
      resolve(false)
    }
  })
}
