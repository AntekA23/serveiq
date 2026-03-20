import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import useAuth from './hooks/useAuth'
import AppShell from './components/layout/AppShell'
import ToastContainer from './components/ui/Toast'

// Auth pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import AcceptInvite from './pages/auth/AcceptInvite'

// Coach pages
import CoachDashboard from './pages/coach/Dashboard'
import Players from './pages/coach/Players'
import PlayerDetail from './pages/coach/PlayerDetail'
import Sessions from './pages/coach/Sessions'
import NewSession from './pages/coach/NewSession'
import CoachPayments from './pages/coach/Payments'
import Tournaments from './pages/coach/Tournaments'
import CoachMessages from './pages/coach/Messages'

// Parent pages
import ParentDashboard from './pages/parent/Dashboard'
import Progress from './pages/parent/Progress'
import ParentPayments from './pages/parent/Payments'
import ParentMessages from './pages/parent/Chat'

// Payment pages
import PaymentSuccess from './pages/parent/PaymentSuccess'
import PaymentCancel from './pages/parent/PaymentCancel'

function ProtectedRoute({ children, role }) {
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const isAuthenticated = !!accessToken

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (role && user?.role !== role) {
    const redirect = user?.role === 'coach' ? '/coach/dashboard' : '/parent/dashboard'
    return <Navigate to={redirect} replace />
  }

  return children
}

function RootRedirect() {
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)

  if (!accessToken) return <Navigate to="/login" replace />
  if (user?.role === 'parent') return <Navigate to="/parent/dashboard" replace />
  return <Navigate to="/coach/dashboard" replace />
}

export default function App() {
  const { checkAuth } = useAuth()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth().finally(() => setLoading(false))
  }, [checkAuth])

  if (loading) {
    return null
  }

  return (
    <>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/accept-invite/:token" element={<AcceptInvite />} />

        {/* Coach routes */}
        <Route
          path="/coach/dashboard"
          element={
            <ProtectedRoute role="coach">
              <AppShell><CoachDashboard /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/coach/players"
          element={
            <ProtectedRoute role="coach">
              <AppShell><Players /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/coach/players/:id"
          element={
            <ProtectedRoute role="coach">
              <AppShell><PlayerDetail /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/coach/sessions"
          element={
            <ProtectedRoute role="coach">
              <AppShell><Sessions /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/coach/sessions/new"
          element={
            <ProtectedRoute role="coach">
              <AppShell><NewSession /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/coach/payments"
          element={
            <ProtectedRoute role="coach">
              <AppShell><CoachPayments /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/coach/tournaments"
          element={
            <ProtectedRoute role="coach">
              <AppShell><Tournaments /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/coach/messages"
          element={
            <ProtectedRoute role="coach">
              <AppShell><CoachMessages /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/coach/messages/:userId"
          element={
            <ProtectedRoute role="coach">
              <AppShell><CoachMessages /></AppShell>
            </ProtectedRoute>
          }
        />

        {/* Parent routes */}
        <Route
          path="/parent/dashboard"
          element={
            <ProtectedRoute role="parent">
              <AppShell><ParentDashboard /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/progress"
          element={
            <ProtectedRoute role="parent">
              <AppShell><Progress /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/payments"
          element={
            <ProtectedRoute role="parent">
              <AppShell><ParentPayments /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/messages"
          element={
            <ProtectedRoute role="parent">
              <AppShell><ParentMessages /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/messages/:userId"
          element={
            <ProtectedRoute role="parent">
              <AppShell><ParentMessages /></AppShell>
            </ProtectedRoute>
          }
        />

        {/* Payment callback routes */}
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />
      </Routes>

      <ToastContainer />
    </>
  )
}
