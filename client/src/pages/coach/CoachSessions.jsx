import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import api from '../../api/axios'
import Button from '../../components/ui/Button/Button'
import './Coach.css'

const TYPE_LABELS = {
  kort: 'Kort', sparing: 'Sparing', kondycja: 'Kondycja',
  rozciaganie: 'Rozciaganie', mecz: 'Mecz', inne: 'Inne',
}
const TYPE_COLORS = {
  kort: 'var(--color-green)', sparing: 'var(--color-amber)', kondycja: 'var(--color-blue)',
  rozciaganie: 'var(--color-purple)', mecz: 'var(--color-heart)', inne: 'var(--color-text-tertiary)',
}

const MONTH_NAMES = [
  'Styczen', 'Luty', 'Marzec', 'Kwiecien', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpien', 'Wrzesien', 'Pazdziernik', 'Listopad', 'Grudzien',
]

export default function CoachSessions() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(new Date())
  const [filterPlayer, setFilterPlayer] = useState('')

  useEffect(() => {
    const fetch = async () => {
      try {
        const m = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
        const [sessRes, plRes] = await Promise.all([
          api.get(`/sessions?month=${m}`),
          api.get('/players'),
        ])
        const pl = plRes.data.players || plRes.data || []
        setPlayers(pl)

        const s = sessRes.data.sessions || sessRes.data || []
        const playerMap = {}
        pl.forEach((p) => { playerMap[p._id] = `${p.firstName} ${p.lastName}` })
        setSessions(
          s.map((sess) => ({
            ...sess,
            playerName: playerMap[typeof sess.player === 'object' ? sess.player._id : sess.player] || 'Zawodnik',
            playerId: typeof sess.player === 'object' ? sess.player._id : sess.player,
          })).sort((a, b) => new Date(b.date) - new Date(a.date))
        )
      } catch { /* silent */ }
      setLoading(false)
    }
    fetch()
  }, [month])

  const filtered = filterPlayer
    ? sessions.filter((s) => s.playerId === filterPlayer)
    : sessions

  // Group by date
  const grouped = {}
  filtered.forEach((s) => {
    const key = new Date(s.date).toDateString()
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(s)
  })

  if (loading) {
    return <div className="coach-page"><h1 className="page-title">Sesje treningowe</h1><div className="coach-loading">Ladowanie...</div></div>
  }

  return (
    <div className="coach-page">
      <div className="coach-header">
        <h1 className="page-title">Sesje treningowe</h1>
        <Button variant="primary" size="sm" onClick={() => navigate('/coach/sessions/new')}>
          <Plus size={14} /> Nowa sesja
        </Button>
      </div>

      {/* Month nav + filter */}
      <div className="coach-session-controls">
        <div className="coach-month-nav">
          <button className="tp-nav-btn" onClick={() => setMonth((p) => { const d = new Date(p); d.setMonth(d.getMonth() - 1); return d })}>
            <ChevronLeft size={16} />
          </button>
          <span className="tp-nav-label">{MONTH_NAMES[month.getMonth()]} {month.getFullYear()}</span>
          <button className="tp-nav-btn" onClick={() => setMonth((p) => { const d = new Date(p); d.setMonth(d.getMonth() + 1); return d })}>
            <ChevronRight size={16} />
          </button>
        </div>
        {players.length > 1 && (
          <select className="coach-filter-select" value={filterPlayer} onChange={(e) => setFilterPlayer(e.target.value)}>
            <option value="">Wszyscy zawodnicy</option>
            {players.map((p) => (
              <option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>
            ))}
          </select>
        )}
      </div>

      {/* Session list grouped by date */}
      <div className="coach-sessions-grouped">
        {Object.keys(grouped).length === 0 ? (
          <div className="coach-empty">Brak sesji w tym miesiacu</div>
        ) : (
          Object.entries(grouped).map(([dateKey, daySessions]) => {
            const d = new Date(dateKey)
            return (
              <div key={dateKey} className="coach-day-group">
                <div className="coach-day-label">
                  {d.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                {daySessions.map((s) => (
                  <div key={s._id} className="coach-session-card">
                    <div className="coach-session-type-dot" style={{ background: TYPE_COLORS[s.sessionType] || TYPE_COLORS.inne }} />
                    <div className="coach-session-card-body">
                      <div className="coach-session-card-top">
                        <span className="coach-session-type-text">{TYPE_LABELS[s.sessionType] || 'Trening'}</span>
                        <span className="coach-session-player-name">{s.playerName}</span>
                        {s.startTime && <span className="coach-session-time">{s.startTime}</span>}
                        <span className="coach-session-dur">{s.durationMinutes}min</span>
                      </div>
                      {s.notes && <div className="coach-session-card-notes">{s.notes}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
