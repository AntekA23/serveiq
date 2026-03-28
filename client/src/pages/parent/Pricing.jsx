import { useState } from 'react'
import { Check, X, Crown, Star, Zap } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import api from '../../api/axios'
import useToast from '../../hooks/useToast'
import './Pricing.css'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    period: 'na zawsze',
    icon: Zap,
    features: {
      dashboard: true,
      children: '1 dziecko',
      health_history: '7 dni',
      charts: false,
      alerts: 'Podstawowe',
      weekly_email: false,
      pdf_export: false,
      push_notifications: false,
      priority_support: false,
    },
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '39',
    period: 'zl / mies.',
    icon: Star,
    popular: true,
    features: {
      dashboard: true,
      children: 'Do 3 dzieci',
      health_history: 'Pelna',
      charts: true,
      alerts: 'Pelne',
      weekly_email: true,
      pdf_export: true,
      push_notifications: true,
      priority_support: false,
    },
  },
  {
    id: 'family',
    name: 'Family',
    price: '59',
    period: 'zl / mies.',
    icon: Crown,
    features: {
      dashboard: true,
      children: 'Do 5 dzieci',
      health_history: 'Pelna',
      charts: true,
      alerts: 'Pelne',
      weekly_email: true,
      pdf_export: true,
      push_notifications: true,
      priority_support: true,
    },
  },
]

const FEATURE_LABELS = {
  dashboard: 'Dashboard',
  children: 'Liczba dzieci',
  health_history: 'Historia zdrowia',
  charts: 'Wykresy i porownania',
  alerts: 'Alerty zdrowotne',
  weekly_email: 'Email tygodniowy',
  pdf_export: 'Eksport PDF',
  push_notifications: 'Push notifications',
  priority_support: 'Priorytetowy support',
}

export default function Pricing() {
  const user = useAuthStore((s) => s.user)
  const toast = useToast()
  const [loadingPlan, setLoadingPlan] = useState(null)

  const currentPlan = user?.subscription?.plan || 'free'
  const currentStatus = user?.subscription?.status

  const handleSelectPlan = async (planId) => {
    if (planId === 'free' || planId === currentPlan) return

    setLoadingPlan(planId)
    try {
      const { data } = await api.post('/subscriptions/checkout', { plan: planId })
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Nie udalo sie utworzyc sesji platnosci')
    } finally {
      setLoadingPlan(null)
    }
  }

  const renderFeatureValue = (value) => {
    if (value === true) return <Check size={16} className="pricing-check" />
    if (value === false) return <X size={16} className="pricing-x" />
    return <span className="pricing-feature-text">{value}</span>
  }

  return (
    <div className="pricing-page">
      <div className="pricing-header">
        <h1 className="pricing-title">Wybierz plan</h1>
        <p className="pricing-subtitle">
          Monitoruj zdrowie i postepy Twojego mlodego tenisisty
        </p>
      </div>

      <div className="pricing-grid">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan
          const isActive = ['trialing', 'active'].includes(currentStatus)

          return (
            <div
              key={plan.id}
              className={`pricing-card${plan.popular ? ' popular' : ''}${isCurrent ? ' current' : ''}`}
            >
              {plan.popular && (
                <div className="pricing-badge">Najpopularniejszy</div>
              )}
              {isCurrent && isActive && (
                <div className="pricing-badge current-badge">Twoj plan</div>
              )}

              <div className="pricing-card-header">
                <plan.icon size={24} className="pricing-plan-icon" />
                <h2 className="pricing-plan-name">{plan.name}</h2>
                <div className="pricing-price">
                  <span className="pricing-price-amount">{plan.price}</span>
                  <span className="pricing-price-period">{plan.period}</span>
                </div>
              </div>

              <div className="pricing-features">
                {Object.entries(FEATURE_LABELS).map(([key, label]) => (
                  <div key={key} className="pricing-feature-row">
                    <span className="pricing-feature-label">{label}</span>
                    <span className="pricing-feature-value">
                      {renderFeatureValue(plan.features[key])}
                    </span>
                  </div>
                ))}
              </div>

              <button
                className={`pricing-cta${plan.popular ? ' popular' : ''}${isCurrent ? ' current' : ''}`}
                onClick={() => handleSelectPlan(plan.id)}
                disabled={plan.id === 'free' || (isCurrent && isActive) || loadingPlan === plan.id}
              >
                {loadingPlan === plan.id
                  ? 'Ladowanie...'
                  : isCurrent && isActive
                  ? 'Aktualny plan'
                  : plan.id === 'free'
                  ? 'Plan podstawowy'
                  : 'Wybierz plan'}
              </button>
            </div>
          )
        })}
      </div>

      <div className="pricing-footer">
        <p>Wszystkie plany mozna anulowac w dowolnym momencie.</p>
        <p>14-dniowy darmowy trial Premium dla nowych uzytkownikow.</p>
      </div>
    </div>
  )
}
