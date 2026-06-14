import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useStore'
import LoginPage from './pages/LoginPage'
import ChildView from './pages/ChildView'
import ParentView from './pages/ParentView'
import ResetPasswordPage from './pages/ResetPasswordPage'

export default function App() {
  const { token } = useAuthStore()
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
