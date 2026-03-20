import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Target } from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import Avatar from '../../components/ui/Avatar/Avatar'
import ProgressBar from '../../components/ui/ProgressBar/ProgressBar'
import Button from '../../components/ui/Button/Button'
import SessionItem from '../../components/shared/SessionItem/SessionItem'
import './Dashboard.css'

const skillLabels = {
  serve: 'Serwis',
  forehand: 'Forhend',
  backhand: 'Bekhend',
  volley: 'Wolej',
  tactics: 'Taktyka',
  fitness: 'Kondycja',
}

const skillColors = {
  serve: 'blue',
  forehand: 'green',
  backhand: 'amber',
  volley: 'blue',
  tactics: 'green',
  fitness: 'amber',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [children, setChildren] = useState([])
  const [sessions, setSessions] = useState({})
  const [pendingPayment, setPendingPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payLoading, setPayLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch children/players
        const { data: playersRaw } = await api.get('/players')
        const players = Array.isArray(playersRaw) ? playersRaw : playersRaw.players || []
        const childIds = user?.parentProfile?.children || []
        const myChildren = childIds.length > 0
          ? players.filter((p) => childIds.includes(p._id))
          : players
        setChildren(myChildren)

        // Fetch sessions for each child
        const sessionsMap = {}
        for (const child of myChildren) {
          try {
            const { data } = await api.get(`/sessions?player=${child._id}`)
            const sessionsArr = Array.isArray(data) ? data : data.sessions || []
            sessionsMap[child._id] = sessionsArr.slice(0, 3)
          } catch {
            sessionsMap[child._id] = []
          }
        }
        setSessions(sessionsMap)

        // Fetch pending payments
        try {
          const { data: paymentsRaw } = await api.get('/payments')
          const paymentsArr = Array.isArray(paymentsRaw) ? paymentsRaw : paymentsRaw.payments || []
          const pending = paymentsArr.find(
            (p) => p.status === 'pending' || p.status === 'overdue'
          )
          setPendingPayment(pending || null)
        } catch {
          // payments may not be available
        }
      } catch (err) {
        setError('Nie udało się załadować danych')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const handlePay = async (paymentId) => {
    setPayLoading(true)
    try {
      const { data } = await api.post(`/payments/${paymentId}/checkout`)
      window.location.href = data.url
    } catch {
      setError('Nie udało się utworzyć sesji płatności')
      setPayLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="parent-dashboard">
        <h1 className="page-title">Pulpit</h1>
        <div className="parent-dashboard-loading">Ładowanie...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="parent-dashboard">
        <h1 className="page-title">Pulpit</h1>
        <div className="parent-dashboard-error">{error}</div>
      </div>
    )
  }

  return (
    <div className="parent-dashboard">
      <h1 className="page-title">Pulpit</h1>

      {pendingPayment && (
        <div className="parent-dashboard-banner">
          <span className="parent-dashboard-banner-text">
            Masz oczekującą płatność: {pendingPayment.description} — {pendingPayment.amount} zł
          </span>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handlePay(pendingPayment._id)}
            loading={payLoading}
          >
            Zapłać
          </Button>
        </div>
      )}

      {children.length === 0 && (
        <div className="parent-dashboard-empty">
          Brak przypisanych zawodników.
        </div>
      )}

      {children.map((child) => (
        <div key={child._id} className="parent-child-card card">
          <div className="parent-child-header">
            <Avatar
              firstName={child.firstName}
              lastName={child.lastName}
              size={40}
              role="player"
            />
            <span className="parent-child-name">
              {child.firstName} {child.lastName}
            </span>
          </div>

          {child.skills && (
            <>
              <div className="parent-section-title">Umiejętności</div>
              <div className="parent-skills-grid">
                {Object.entries(skillLabels).map(([key, label]) => (
                  <ProgressBar
                    key={key}
                    label={label}
                    value={child.skills?.[key]?.score ?? child.skills?.[key] ?? 0}
                    color={skillColors[key]}
                    showValue
                  />
                ))}
              </div>
            </>
          )}

          {child.goals && child.goals.length > 0 && (
            <>
              <div className="parent-section-title">Cele</div>
              <div className="parent-goals-list">
                {child.goals.map((goal, idx) => (
                  <div key={goal._id || idx} className="parent-goal-item">
                    <input
                      type="checkbox"
                      checked={goal.completed || false}
                      disabled
                      readOnly
                    />
                    <span>{goal.text || goal.title}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {sessions[child._id] && sessions[child._id].length > 0 && (
            <>
              <div className="parent-section-title">Ostatnie treningi</div>
              {sessions[child._id].map((session) => (
                <SessionItem key={session._id} session={session} />
              ))}
            </>
          )}
        </div>
      ))}
    </div>
  )
}
