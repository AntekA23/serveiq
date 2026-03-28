import { Link } from 'react-router-dom'
import { Clock, AlertTriangle } from 'lucide-react'
import useAuthStore from '../../../store/authStore'
import './TrialBanner.css'

export default function TrialBanner() {
  const user = useAuthStore((s) => s.user)
  const sub = user?.subscription

  if (!sub) return null

  // Nie pokazuj dla aktywnych subskrybentow (platnych)
  if (sub.status === 'active') return null
  // Nie pokazuj dla planu free
  if (sub.plan === 'free' && sub.status !== 'expired') return null

  const isTrialing = sub.status === 'trialing'
  const isExpired = ['cancelled', 'expired'].includes(sub.status)
  const isPastDue = sub.status === 'past_due'

  if (isTrialing && sub.trialEndsAt) {
    const trialEnd = new Date(sub.trialEndsAt)
    const now = new Date()
    const daysLeft = Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)))

    if (daysLeft <= 0) {
      // Trial juz sie skonczyl ale status jeszcze nie zaktualizowany
      return (
        <div className="trial-banner expired">
          <AlertTriangle size={16} />
          <span>Twoj trial sie skonczyl. Przejdz na Premium, aby zachowac dostep.</span>
          <Link to="/parent/pricing" className="trial-banner-cta">
            Zobacz plany
          </Link>
        </div>
      )
    }

    return (
      <div className="trial-banner trialing">
        <Clock size={16} />
        <span>
          Twoj trial Premium konczy sie za <strong>{daysLeft} {daysLeft === 1 ? 'dzien' : 'dni'}</strong>
        </span>
        <Link to="/parent/pricing" className="trial-banner-cta">
          Zobacz plany
        </Link>
      </div>
    )
  }

  if (isExpired || isPastDue) {
    return (
      <div className="trial-banner expired">
        <AlertTriangle size={16} />
        <span>
          {isPastDue
            ? 'Problem z platnoscia. Zaktualizuj dane platnicze.'
            : 'Twoj trial sie skonczyl. Przejdz na Premium, aby zachowac dostep.'}
        </span>
        <Link to="/parent/pricing" className="trial-banner-cta">
          {isPastDue ? 'Napraw platnosc' : 'Zobacz plany'}
        </Link>
      </div>
    )
  }

  return null
}
