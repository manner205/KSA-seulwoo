import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import AppLayout from '@/components/AppLayout'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import RoadmapPage from '@/pages/RoadmapPage'
import EventsPage from '@/pages/EventsPage'
import NotesPage from '@/pages/NotesPage'
import AdminPage from '@/pages/AdminPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function AppRouter() {
  const { user } = useAuth()

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="roadmap" element={<RoadmapPage />} />
          <Route path="events"  element={<EventsPage />} />
          <Route path="notes"   element={<NotesPage />} />
          <Route path="admin"   element={<AdminPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
