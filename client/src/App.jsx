import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
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

// Parent pages (PRIMARY)
import ParentDashboard from './pages/parent/Dashboard'
import ChildProfile from './pages/parent/ChildProfile'
import HealthHistory from './pages/parent/HealthHistory'
import Timeline from './pages/parent/Timeline'
import Devices from './pages/parent/Devices'
import TrainingPlan from './pages/parent/TrainingPlan'
import ParentPayments from './pages/parent/Payments'
import ParentMessages from './pages/parent/Chat'
import Onboarding from './pages/parent/Onboarding'
import Settings from './pages/parent/Settings'
import Pricing from './pages/parent/Pricing'

// Payment pages
import PaymentSuccess from './pages/parent/PaymentSuccess'
import PaymentCancel from './pages/parent/PaymentCancel'

// OAuth callback
import DeviceCallback from './pages/parent/DeviceCallback'

// Coach disabled page
import CoachDisabled from './pages/coach/CoachDisabled'

function ProtectedRoute({ children, role }) {
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const isAuthenticated = !!accessToken
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (role && user?.role !== role) {
    if (user?.role === 'coach') return <Navigate to="/coach/disabled" replace />
    return <Navigate to="/parent/dashboard" replace />
  }

  // Onboarding redirect for parents
  if (
    user?.role === 'parent' &&
    !user?.onboardingCompleted &&
    location.pathname !== '/parent/onboarding'
  ) {
    return <Navigate to="/parent/onboarding" replace />
  }

  return children
}

function RootRedirect() {
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)

  if (!accessToken) return <Navigate to="/login" replace />
  if (user?.role === 'coach') return <Navigate to="/coach/disabled" replace />
  if (user?.role === 'parent' && !user?.onboardingCompleted) {
    return <Navigate to="/parent/onboarding" replace />
  }
  return <Navigate to="/parent/dashboard" replace />
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

        {/* Coach disabled - all coach routes redirect here */}
        <Route path="/coach/disabled" element={<CoachDisabled />} />
        <Route path="/coach/*" element={<Navigate to="/coach/disabled" replace />} />

        {/* Parent onboarding (no AppShell) */}
        <Route
          path="/parent/onboarding"
          element={
            <ProtectedRoute role="parent">
              <Onboarding />
            </ProtectedRoute>
          }
        />

        {/* Parent routes (PRIMARY) */}
        <Route
          path="/parent/dashboard"
          element={
            <ProtectedRoute role="parent">
              <AppShell><ParentDashboard /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/child/:id"
          element={
            <ProtectedRoute role="parent">
              <AppShell><ChildProfile /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/child/:id/health"
          element={
            <ProtectedRoute role="parent">
              <AppShell><HealthHistory /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/child/:id/timeline"
          element={
            <ProtectedRoute role="parent">
              <AppShell><Timeline /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/devices"
          element={
            <ProtectedRoute role="parent">
              <AppShell><Devices /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/training-plan"
          element={
            <ProtectedRoute role="parent">
              <AppShell><TrainingPlan /></AppShell>
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
        <Route
          path="/parent/settings"
          element={
            <ProtectedRoute role="parent">
              <AppShell><Settings /></AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/parent/pricing"
          element={
            <ProtectedRoute role="parent">
              <AppShell><Pricing /></AppShell>
            </ProtectedRoute>
          }
        />

        {/* Payment callback routes */}
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />

        {/* OAuth callback — urządzenia wearable (publiczny, bez AppShell) */}
        <Route path="/parent/devices/callback" element={<DeviceCallback />} />
      </Routes>

      <ToastContainer />
    </>
  )
}
