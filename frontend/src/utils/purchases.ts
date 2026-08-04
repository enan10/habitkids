import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor'
import { Capacitor } from '@capacitor/core'

const RC_KEY = import.meta.env.VITE_REVENUECAT_KEY as string

export async function initPurchases(userId: string) {
  if (!Capacitor.isNativePlatform()) return
  await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG })
  await Purchases.configure({ apiKey: RC_KEY, appUserID: userId })
}

export async function getOfferings() {
  if (!Capacitor.isNativePlatform()) return null
  const { current } = await Purchases.getOfferings()
  return current
}

export async function purchasePackage(pkg: any) {
  const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg })
  return customerInfo
}

export async function restorePurchases() {
  const { customerInfo } = await Purchases.restorePurchases()
  return customerInfo
}

export function hasPremiumEntitlement(customerInfo: any): boolean {
  return customerInfo?.entitlements?.active?.['premium'] != null
}
