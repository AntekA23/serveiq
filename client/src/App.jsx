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

// Coach pages
import CoachDashboard from './pages/coach/Dashboard'
import CoachPlayers from './pages/coach/Players'
import CoachDisabled from './pages/coach/CoachDisabled'

// Parent pages
import ParentDashboard from './pages/parent/Dashboard'
import ChildProfile from './pages/parent/ChildProfile'
import ParentTimeline from './pages/parent/Timeline'
import TrainingPlan from './pages/parent/TrainingPlan'
import Tournaments from './pages/parent/Tournaments'
import ParentPayments from './pages/parent/Payments'
import ParentMessages from './pages/parent/Chat'
import Onboarding from './pages/parent/Onboarding'
import ParentSettings from './pages/parent/Settings'
import Pricing from './pages/parent/Pricing'

// Club pages
import ClubDashboard from './pages/club/ClubDashboard'
import CoachesList from './pages/club/CoachesList'

// Shared pages (placeholders)
import Groups from './pages/shared/Groups'
import Activities from './pages/shared/Activities'
import Reviews from './pages/shared/Reviews'
import SharedTimeline from './pages/shared/Timeline'
import Calendar from './pages/shared/Calendar'
import MyChildren from './pages/shared/MyChildren'

// Payment pages
import PaymentSuccess from './pages/parent/PaymentSuccess'
import PaymentCancel from './pages/parent/PaymentCancel'

// Landing + Legal pages
import Landing from './pages/Landing'
import Terms from './pages/legal/Terms'
import Privacy from './pages/legal/Privacy'

function ProtectedRoute({ children, role }) {
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const isAuthenticated = !!accessToken
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (role && user?.role !== role) {
    // Redirect to the appropriate dashboard for this role
    if (user?.role === 'coach') return <Navigate to="/coach/dashboard" replace />
    if (user?.role === 'clubAdmin') return <Navigate to="/club/dashboard" replace />
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

/** Routes accessible by multiple authenticated roles */
function AuthRoute({ children }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  if (!accessToken) {
    return <Navigate to="/login" replace />
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

  if (!accessToken) return <Landing />
  if (user?.role === 'coach') return <Navigate to="/coach/dashboard" replace />
  if (user?.role === 'clubAdmin') return <Navigate to="/club/dashboard" replace />
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

        {/* Public legal pages */}
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />

        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/accept-invite/:token" element={<AcceptInvite />} />

        {/* ==================== */}
        {/* COACH ROUTES         */}
        {/* ==================== */}
        <Route
          path="/coach/dashboard"
          element={
            <ProtectedRoute role="coach">
              <AppShell><CoachDashboard /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route path="/coach/disabled" element={<CoachDisabled />} />

        {/* ==================== */}
        {/* PARENT ROUTES        */}
        {/* ==================== */}
        <Route
          path="/parent/onboarding"
          element={
            <ProtectedRoute role="parent">
              <Onboarding />
            </ProtectedRoute>
          }
        />
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
          path="/parent/child/:id/timeline"
          element={
            <ProtectedRoute role="parent">
              <AppShell><ParentTimeline /></AppShell>
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
          path="/parent/tournaments"
          element={
            <ProtectedRoute role="parent">
              <AppShell><Tournaments /></AppShell>
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
          path="/parent/pricing"
          element={
            <ProtectedRoute role="parent">
              <AppShell><Pricing /></AppShell>
            </ProtectedRoute>
          }
        />

        {/* ==================== */}
        {/* CLUB ADMIN ROUTES    */}
        {/* ==================== */}
        <Route
          path="/club/dashboard"
          element={
            <ProtectedRoute role="clubAdmin">
              <AppShell><ClubDashboard /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/coaches"
          element={
            <ProtectedRoute role="clubAdmin">
              <AppShell><CoachesList /></AppShell>
            </ProtectedRoute>
          }
        />

        {/* ================================ */}
        {/* SHARED ROUTES (multi-role)       */}
        {/* ================================ */}
        <Route
          path="/groups"
          element={
            <AuthRoute>
              <AppShell><Groups /></AppShell>
            </AuthRoute>
          }
        />
        <Route
          path="/players"
          element={
            <AuthRoute>
              <AppShell><CoachPlayers /></AppShell>
            </AuthRoute>
          }
        />
        <Route
          path="/activities"
          element={
            <AuthRoute>
              <AppShell><Activities /></AppShell>
            </AuthRoute>
          }
        />
        <Route
          path="/reviews"
          element={
            <AuthRoute>
              <AppShell><Reviews /></AppShell>
            </AuthRoute>
          }
        />
        <Route
          path="/timeline"
          element={
            <AuthRoute>
              <AppShell><SharedTimeline /></AppShell>
            </AuthRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <AuthRoute>
              <AppShell><Calendar /></AppShell>
            </AuthRoute>
          }
        />
        <Route
          path="/my-children"
          element={
            <ProtectedRoute role="parent">
              <AppShell><MyChildren /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <AuthRoute>
              <AppShell><ParentMessages /></AppShell>
            </AuthRoute>
          }
        />
        <Route
          path="/messages/:userId"
          element={
            <AuthRoute>
              <AppShell><ParentMessages /></AppShell>
            </AuthRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <AuthRoute>
              <AppShell><ParentSettings /></AppShell>
            </AuthRoute>
          }
        />

        {/* Keep legacy parent message routes working */}
        <Route
          path="/parent/messages"
          element={<Navigate to="/messages" replace />}
        />
        <Route
          path="/parent/messages/:userId"
          element={<Navigate to="/messages" replace />}
        />
        <Route
          path="/parent/settings"
          element={<Navigate to="/settings" replace />}
        />

        {/* Payment callback routes */}
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />

      </Routes>

      <ToastContainer />
    </>
  )
}
