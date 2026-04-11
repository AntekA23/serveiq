import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, ChevronRight, CreditCard, FileText, UserPlus,
  Check, X, Clock, MapPin, Users,
} from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import Avatar from '../../components/ui/Avatar/Avatar'
import Button from '../../components/ui/Button/Button'
import './CoachDashboard.css'

const TYPE_LABELS = {
  kort: 'Kort', sparing: 'Sparing', kondycja: 'Kondycja',
  rozciaganie: 'Rozciąganie', mecz: 'Mecz', inne: 'Inne',
}

const TYPE_ACCENTS = {
  kort: 'var(--color-green)', sparing: 'var(--color-amber)', kondycja: 'var(--color-blue)',
  rozciaganie: 'var(--color-sleep)', mecz: 'var(--color-heart)', inne: 'var(--color-text-tertiary)',
}

function formatTime(t) {
  if (!t) return ''
  return t.slice(0, 5)
}

function getTodayLabel() {
  const d = new Date()
  return d.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [todaySessions, setTodaySessions] = useState([])
  const [players, setPlayers] = useState([])
  const [alerts, setAlerts] = useState({ payments: 0, drafts: 0, requests: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [playersRes, sessionsRes, paymentsRes, reviewsRes, requestsRes] = await Promise.all([
          api.get('/players'),
          api.get('/sessions'),
          api.get('/payments').catch(() => ({ data: { payments: [] } })),
          api.get('/reviews').catch(() => ({ data: { reviews: [] } })),
          api.get('/players/coach-requests').catch(() => ({ data: { requests: [] } })),
        ])

        const p = playersRes.data.players || playersRes.data || []
        setPlayers(p)

        const allSessions = sessionsRes.data.sessions || sessionsRes.data || []
        const playerMap = {}
        p.forEach((pl) => { playerMap[pl._id] = pl })

        // Get today's sessions
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const todayList = allSessions
          .filter((s) => {
            const d = new Date(s.date)
            return d >= today && d < tomorrow
          })
          .map((s) => {
            const pid = typeof s.player === 'object' ? s.player._id : s.player
            const pl = playerMap[pid]
            return {
              ...s,
              playerName: pl ? `${pl.firstName} ${pl.lastName}` : 'Zawodnik',
              playerAvatar: pl,
            }
          })
          .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))

        setTodaySessions(todayList)

        const allPayments = paymentsRes.data.payments || []
        const pendingPayments = allPayments.filter((py) => py.status === 'pending' || py.status === 'overdue').length

        const allReviews = reviewsRes.data.reviews || []
        const draftReviews = allReviews.filter((r) => r.status === 'draft').length

        setAlerts({
          payments: pendingPayments,
          drafts: draftReviews,
          requests: requestsRes.data.requests || [],
        })
      } catch { /* silent */ }
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleJoinRequest = async (playerId, action) => {
    try {
      await api.put(`/players/${playerId}/coach-request`, { action })
      setAlerts((prev) => ({
        ...prev,
        requests: prev.requests.filter((r) => r._id !== playerId),
      }))
      if (action === 'accept') {
        const { data } = await api.get('/players')
        setPlayers(data.players || data || [])
      }
    } catch { /* silent */ }
  }

  // Recent players — sorted by most recent session
  const recentPlayers = players.slice(0, 4)

  if (loading) {
    return <div className="cd-page"><div className="cd-loading"><div className="cd-spinner" /></div></div>
  }

  const hasAlerts = alerts.payments > 0 || alerts.drafts > 0 || alerts.requests.length > 0
  const totalAlerts = alerts.payments + alerts.drafts + alerts.requests.length

  return (
    <div className="cd-page">
      {/* ─── Greeting ─── */}
      <div className="cd-greeting">
        <div>
          <h1 className="cd-greeting-name">Witaj, {user?.firstName}</h1>
          <p className="cd-greeting-date">{getTodayLabel()}</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate('/coach/sessions/new')}>
          <Plus size={14} /> Nowa sesja
        </Button>
      </div>

      {/* ─── Alerts bar ─── */}
      {hasAlerts && (
        <div className="cd-alerts-bar">
          {alerts.requests.length > 0 && (
            <button className="cd-alert-chip cd-alert-requests" onClick={() => document.getElementById('cd-requests')?.scrollIntoView({ behavior: 'smooth' })}>
              <UserPlus size={14} />
              <span>{alerts.requests.length} {alerts.requests.length === 1 ? 'prośba' : 'prośby'}</span>
            </button>
          )}
          {alerts.payments > 0 && (
            <button className="cd-alert-chip cd-alert-payments" onClick={() => navigate('/coach/payments')}>
              <CreditCard size={14} />
              <span>{alerts.payments} {alerts.payments === 1 ? 'płatność' : 'płatności'}</span>
            </button>
          )}
          {alerts.drafts > 0 && (
            <button className="cd-alert-chip cd-alert-drafts" onClick={() => navigate('/coach/reviews')}>
              <FileText size={14} />
              <span>{alerts.drafts} {alerts.drafts === 1 ? 'szkic' : 'szkice'}</span>
            </button>
          )}
        </div>
      )}

      {/* ─── Today's schedule ─── */}
      <section className="cd-section">
        <div className="cd-section-head">
          <h2 className="cd-section-title">Dzisiaj</h2>
          <button className="cd-section-link" onClick={() => navigate('/coach/calendar')}>
            Kalendarz <ChevronRight size={14} />
          </button>
        </div>

        {todaySessions.length === 0 ? (
          <div className="cd-today-empty">
            <Clock size={20} />
            <p>Brak zaplanowanych sesji na dziś</p>
            <Button variant="primary" size="sm" onClick={() => navigate('/coach/sessions/new')}>
              <Plus size={14} /> Zaplanuj sesję
            </Button>
          </div>
        ) : (
          <div className="cd-today-list">
            {todaySessions.map((s, i) => (
              <div
                key={s._id}
                className="cd-today-item"
                onClick={() => navigate(`/coach/sessions/${s._id}/edit`)}
                style={{ '--item-delay': `${i * 60}ms`, '--type-color': TYPE_ACCENTS[s.sessionType] || TYPE_ACCENTS.inne }}
              >
                <div className="cd-today-time">
                  {formatTime(s.startTime) || '—'}
                </div>
                <div className="cd-today-bar" />
                <div className="cd-today-body">
                  <span className="cd-today-type">{TYPE_LABELS[s.sessionType] || 'Trening'}</span>
                  <span className="cd-today-player">{s.playerName}</span>
                  {s.durationMinutes && (
                    <span className="cd-today-dur">{s.durationMinutes} min</span>
                  )}
                </div>
                <ChevronRight size={14} className="cd-today-arrow" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── Join requests (if any) ─── */}
      {alerts.requests.length > 0 && (
        <section className="cd-section" id="cd-requests">
          <div className="cd-section-head">
            <h2 className="cd-section-title">Prośby o dołączenie</h2>
            <span className="cd-badge">{alerts.requests.length}</span>
          </div>
          <div className="cd-requests-list">
            {alerts.requests.map((req) => {
              const parentName = req.parents?.[0] ? `${req.parents[0].firstName} ${req.parents[0].lastName}` : 'Rodzic'
              const age = req.dateOfBirth ? new Date().getFullYear() - new Date(req.dateOfBirth).getFullYear() : null
              return (
                <div key={req._id} className="cd-request-card">
                  <div className="cd-request-info">
                    <span className="cd-request-name">{req.firstName} {req.lastName}</span>
                    <span className="cd-request-meta">
                      {age && `${age} lat · `}{parentName}
                    </span>
                  </div>
                  <div className="cd-request-actions">
                    <button className="cd-req-accept" onClick={() => handleJoinRequest(req._id, 'accept')} title="Akceptuj">
                      <Check size={15} />
                    </button>
                    <button className="cd-req-reject" onClick={() => handleJoinRequest(req._id, 'reject')} title="Odrzuć">
                      <X size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ─── Recent players ─── */}
      <section className="cd-section">
        <div className="cd-section-head">
          <h2 className="cd-section-title">Zawodnicy</h2>
          <button className="cd-section-link" onClick={() => navigate('/players')}>
            Wszyscy <ChevronRight size={14} />
          </button>
        </div>

        {players.length === 0 ? (
          <div className="cd-today-empty">
            <Users size={20} />
            <p>Dodaj pierwszego zawodnika</p>
            <Button variant="primary" size="sm" onClick={() => navigate('/coach/players/new')}>
              <Plus size={14} /> Dodaj
            </Button>
          </div>
        ) : (
          <div className="cd-players-list">
            {recentPlayers.map((p, i) => (
              <div
                key={p._id}
                className="cd-player-row"
                onClick={() => navigate(`/coach/player/${p._id}`)}
                style={{ '--item-delay': `${i * 40}ms` }}
              >
                <Avatar firstName={p.firstName} lastName={p.lastName} size={36} role="player" src={p.avatarUrl} />
                <div className="cd-player-info">
                  <span className="cd-player-name">{p.firstName} {p.lastName}</span>
                  <span className="cd-player-meta">
                    {p.dateOfBirth && `${new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()} lat`}
                    {p.ranking?.pzt ? ` · PZT #${p.ranking.pzt}` : ''}
                  </span>
                </div>
                <ChevronRight size={14} className="cd-player-arrow" />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
