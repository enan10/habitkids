import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useStore'
import LoginPage from './pages/LoginPage'
import ChildView from './pages/ChildView'
import ParentView from './pages/ParentView'

export default function App() {
  const { token } = useAuthStore()
  if (!token) return <LoginPage />
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/child" replace />} />
      <Route path="/child" element={<ChildView />} />
      <Route path="/parent" element={<ParentView />} />
      <Route path="*" element={<Navigate to="/child" replace />} />
    </Routes>
  )
}
