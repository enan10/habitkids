import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fr from './fr.json'
import ar from './ar.json'

const savedLang = localStorage.getItem('habitkids_lang') || 'fr'

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    ar: { translation: ar },
  },
  lng: savedLang,
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
})

export function setLanguage(lang: 'fr' | 'ar') {
  i18n.changeLanguage(lang)
  localStorage.setItem('habitkids_lang', lang)
  const dir = lang === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.setAttribute('dir', dir)
  document.documentElement.setAttribute('lang', lang)
}

// Apply direction on load
const dir = savedLang === 'ar' ? 'rtl' : 'ltr'
document.documentElement.setAttribute('dir', dir)
document.documentElement.setAttribute('lang', savedLang)

export default i18n
