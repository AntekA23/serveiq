import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import useAuthStore from '../../../store/authStore'
import './PaywallGate.css'

/**
 * Sprawdza dostep do funkcji (logika identyczna jak na backendzie)
 */
export function checkFeatureAccess(user, feature) {
  const plan = user?.subscription?.plan || 'free'
  const status = user?.subscription?.status
  const isActive = ['trialing', 'active'].includes(status)

  const features = {
    free: ['dashboard', 'basic_alerts', 'one_child'],
    premium: [
      'dashboard',
      'basic_alerts',
      'full_alerts',
      'health_history',
      'pdf_export',
      'push_notifications',
      'weekly_email',
      'three_children',
    ],
    family: [
      'dashboard',
      'basic_alerts',
      'full_alerts',
      'health_history',
      'pdf_export',
      'push_notifications',
      'weekly_email',
      'five_children',
      'priority_support',
    ],
  }

  if (!isActive && plan !== 'free') return features.free.includes(feature)
  return (features[plan] || features.free).includes(feature)
}

/**
 * Komponent PaywallGate - wyswietla content lub komunikat o braku dostepu
 */
export default function PaywallGate({ feature, children }) {
  const user = useAuthStore((s) => s.user)
  const hasAccess = checkFeatureAccess(user, feature)

  if (hasAccess) return children

  return (
    <div className="paywall-gate">
      <Lock size={32} className="paywall-gate-icon" />
      <h3 className="paywall-gate-title">Funkcja Premium</h3>
      <p className="paywall-gate-text">
        Ta funkcja jest dostepna w planie Premium
      </p>
      <Link to="/parent/pricing" className="paywall-gate-cta">
        Zobacz plany
      </Link>
    </div>
  )
}
