import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import api from '../../api/axios'
import Button from '../../components/ui/Button/Button'
import PlayerCard from '../../components/shared/PlayerCard/PlayerCard'
import SessionItem from '../../components/shared/SessionItem/SessionItem'
import useUiStore from '../../store/uiStore'
import './Dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const addToast = useUiStore((s) => s.addToast)
  const [loading, setLoading] = useState(true)
  const [players, setPlayers] = useState([])
  const [sessions, setSessions] = useState([])
  const [paymentStats, setPaymentStats] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = new Date()
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

        const [playersRes, sessionsRes, statsRes] = await Promise.all([
          api.get('/players'),
          api.get(`/sessions?month=${month}`),
          api.get('/payments/stats'),
        ])

        setPlayers(playersRes.data)
        setSessions(sessionsRes.data)
        setPaymentStats(statsRes.data)
      } catch (err) {
        addToast('Nie udało się pobrać danych', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [addToast])

  if (loading) {
    return (
      <div className="page-enter">
        <h1 className="page-title">Pulpit</h1>
        <p className="dashboard-loading">Ładowanie...</p>
      </div>
    )
  }

  const monthlyRevenue = paymentStats?.monthly?.length
    ? paymentStats.monthly[paymentStats.monthly.length - 1]?.amount || 0
    : 0

  return (
    <div className="page-enter">
      <div className="dashboard-header">
        <h1 className="page-title">Pulpit</h1>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => navigate('/coach/sessions/new')}>
          Dodaj trening
        </Button>
      </div>

      <div className="dashboard-metrics">
        <div className="metric">
          <div className="metric-label">Zawodnicy</div>
          <div className="metric-value">{players.length}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Treningi w tym miesiącu</div>
          <div className="metric-value">{sessions.length}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Przychód miesiąca</div>
          <div className="metric-value">{monthlyRevenue} zł</div>
        </div>
        <div className="metric">
          <div className="metric-label">Oczekujące płatności</div>
          <div className="metric-value">{paymentStats?.pending || 0}</div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="dashboard-section">
          <div className="dashboard-section-title">
            <span>Ostatni zawodnicy</span>
            <Button size="sm" onClick={() => navigate('/coach/players')}>
              Zobacz wszystkich
            </Button>
          </div>
          {players.length === 0 ? (
            <p className="dashboard-empty">Brak zawodników</p>
          ) : (
            <div className="dashboard-players-grid">
              {players.slice(0, 2).map((player) => (
                <PlayerCard key={player._id} player={player} />
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-section">
          <div className="dashboard-section-title">
            <span>Ostatnie treningi</span>
            <Button size="sm" onClick={() => navigate('/coach/sessions')}>
              Zobacz wszystkie
            </Button>
          </div>
          {sessions.length === 0 ? (
            <p className="dashboard-empty">Brak treningów w tym miesiącu</p>
          ) : (
            <div className="dashboard-sessions-list">
              {sessions.slice(0, 3).map((session) => (
                <SessionItem key={session._id} session={session} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
