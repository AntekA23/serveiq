import { useState, useEffect, useCallback } from 'react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import Avatar from '../../components/ui/Avatar/Avatar'
import CalendarTab from './training-plan/CalendarTab'
import PlanTab from './training-plan/PlanTab'
import './TrainingPlan.css'

export default function TrainingPlan() {
  const user = useAuthStore((s) => s.user)
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [tab, setTab] = useState('calendar')
  const [loading, setLoading] = useState(true)

  const fetchChildren = useCallback(async () => {
    try {
      const { data: raw } = await api.get('/players')
      const players = Array.isArray(raw) ? raw : raw.players || []
      const ids = user?.parentProfile?.children || []
      return ids.length > 0 ? players.filter((p) => ids.includes(p._id)) : players
    } catch { return [] }
  }, [user])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const kids = await fetchChildren()
      setChildren(kids)
      if (kids.length > 0) setSelectedChild(kids[0])
      setLoading(false)
    }
    init()
  }, [user, fetchChildren])

  const refreshChild = async () => {
    const kids = await fetchChildren()
    setChildren(kids)
    const updated = kids.find((k) => k._id === selectedChild?._id)
    if (updated) setSelectedChild(updated)
  }

  if (loading) {
    return <div className="tp-page"><h1 className="page-title">Plan treningowy</h1><div className="tp-loading">Ladowanie...</div></div>
  }

  if (!selectedChild) {
    return <div className="tp-page"><h1 className="page-title">Plan treningowy</h1><div className="tp-loading">Brak przypisanych zawodnikow</div></div>
  }

  const plan = selectedChild.trainingPlan || {}

  return (
    <div className="tp-page">
      {/* Child selector */}
      {children.length > 1 && (
        <div className="child-selector">
          {children.map((child) => (
            <button key={child._id}
              className={`child-selector-btn ${selectedChild?._id === child._id ? 'active' : ''}`}
              onClick={() => setSelectedChild(child)}>
              <Avatar firstName={child.firstName} lastName={child.lastName} size={28} role="player" />
              <span>{child.firstName}</span>
            </button>
          ))}
        </div>
      )}

      <h1 className="page-title">Plan treningowy — {selectedChild.firstName}</h1>

      {/* Tabs */}
      <div className="tp-tabs">
        <button className={`tp-tab ${tab === 'calendar' ? 'active' : ''}`} onClick={() => setTab('calendar')}>
          Kalendarz
        </button>
        <button className={`tp-tab ${tab === 'plan' ? 'active' : ''}`} onClick={() => setTab('plan')}>
          Moj plan
        </button>
      </div>

      {/* Tab content */}
      {tab === 'calendar' ? (
        <CalendarTab child={selectedChild} plan={plan} onRefresh={refreshChild} />
      ) : (
        <PlanTab child={selectedChild} plan={plan} onRefresh={refreshChild} />
      )}
    </div>
  )
}
