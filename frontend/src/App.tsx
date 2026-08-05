import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/useStore'
import LoginPage from './pages/LoginPage'
import ChildView from './pages/ChildView'
import ParentView from './pages/ParentView'
import ResetPasswordPage from './pages/ResetPasswordPage'
import PrivacyPage from './pages/PrivacyPage'
import { initAdMob, showBanner, removeBanner } from './utils/admob'

export default function App() {
  const { token } = useAuthStore()
  const location = useLocation()

  // Pages publiques accessibles même connecté
  if (location.pathname === '/privacy') return <PrivacyPage />

  useEffect(() => {
    if (!token) return
    initAdMob().then(() => {
      if (location.pathname === '/parent') showBanner()
    })
  }, [token])

  useEffect(() => {
    if (!token) return
    if (location.pathname === '/parent') {
      showBanner()
    } else {
      removeBanner()
    }
  }, [location.pathname])

  return (
    <Routes>
      {/* Accessible sans authentification */}
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {!token ? (
        <Route path="*" element={<LoginPage />} />
      ) : (
        <>
          <Route path="/" element={<Navigate to="/child" replace />} />
          <Route path="/child" element={<ChildView />} />
          <Route path="/parent" element={<ParentView />} />
          <Route path="*" element={<Navigate to="/child" replace />} />
        </>
      )}
    </Routes>
  )
}
