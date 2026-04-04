import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Calendar, TrendingUp, Plus, ChevronRight, Clock,
  FileText, CreditCard, UserPlus, Check, X,
} from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import Avatar from '../../components/ui/Avatar/Avatar'
import Button from '../../components/ui/Button/Button'
import './CoachDashboard.css'

function StatCard({ icon: Icon, label, value, color, bg, onClick }) {
  return (
    <div className="cd-stat" style={{ '--s-color': color, '--s-bg': bg }} onClick={onClick}>
      <div className="cd-stat-icon"><Icon size={20} /></div>
      <div className="cd-stat-right">
        <div className="cd-stat-value">{value}</div>
        <div className="cd-stat-label">{label}</div>
      </div>
    </div>
  )
}

function PlayerCard({ player, onClick }) {
  const skills = player.skills || {}
  const scores = Object.values(skills).map((s) => s?.score || 0)
  const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

  return (
    <div className="cd-player" onClick={onClick}>
      <Avatar firstName={player.firstName} lastName={player.lastName} size={40} role="player" src={player.avatarUrl} />
      <div className="cd-player-info">
        <span className="cd-player-name">{player.firstName} {player.lastName}</span>
        <span className="cd-player-meta">
          {player.dateOfBirth && `${new Date().getFullYear() - new Date(player.dateOfBirth).getFullYear()} lat`}
          {player.ranking?.pzt && ` · PZT #${player.ranking.pzt}`}
        </span>
      </div>
      <div className="cd-player-skill">
        <svg viewBox="0 0 36 36" className="cd-skill-ring">
          <circle cx="18" cy="18" r="15" fill="none" stroke="var(--color-bg-tertiary)" strokeWidth="3" />
          <circle cx="18" cy="18" r="15" fill="none" stroke="var(--color-accent)" strokeWidth="3"
            strokeDasharray={`${avg * 0.94} 100`} strokeLinecap="round" transform="rotate(-90 18 18)" />
        </svg>
        <span className="cd-skill-val">{avg}</span>
      </div>
      <ChevronRight size={16} className="cd-player-arrow" />
    </div>
  )
}

const TYPE_COLORS = {
  kort: 'var(--color-green)', sparing: 'var(--color-amber)', kondycja: 'var(--color-blue)',
  rozciaganie: 'var(--color-sleep)', mecz: 'var(--color-heart)', inne: 'var(--color-text-tertiary)',
}
const TYPE_LABELS = {
  kort: 'Kort', sparing: 'Sparing', kondycja: 'Kondycja',
  rozciaganie: 'Rozciąganie', mecz: 'Mecz', inne: 'Inne',
}

function SessionRow({ session, onClick }) {
  const d = new Date(session.date)
  const color = TYPE_COLORS[session.sessionType] || TYPE_COLORS.inne

  return (
    <div className="cd-session" onClick={onClick}>
      <div className="cd-session-dot" style={{ background: color }} />
      <div className="cd-session-body">
        <span className="cd-session-title">{session.title || TYPE_LABELS[session.sessionType] || 'Trening'}</span>
        <span className="cd-session-meta">
          {session.playerName} · {d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
          {session.startTime && ` · ${session.startTime}`}
        </span>
      </div>
      <span className="cd-session-dur">{session.durationMinutes}min</span>
    </div>
  )
}

function InviteCodeCard() {
  const [code, setCode] = useState('')
  const [active, setActive] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      api.get('/coach-links/my-code'),
      api.get('/coach-links/requests?status=pending')
    ]).then(([codeRes, reqRes]) => {
      setCode(codeRes.data.inviteCode || '')
      setActive(codeRes.data.inviteActive)
      setPendingCount(reqRes.data.requests.length)
    }).catch(() => {}).finally(() => setLoaded(true))
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReset = async () => {
    try {
      const res = await api.post('/coach-links/reset-code')
      setCode(res.data.inviteCode)
    } catch { /* silent */ }
  }

  const handleToggle = async () => {
    try {
      const res = await api.patch('/coach-links/toggle-code')
      setActive(res.data.inviteActive)
    } catch { /* silent */ }
  }

  if (!loaded) return null

  return (
    <div className="cd-card" style={{ marginBottom: 20 }}>
      <div className="cd-card-head">
        <h2>Kod zaproszenia</h2>
        {pendingCount > 0 && (
          <button
            className="cd-card-link"
            onClick={() => navigate('/coach/requests')}
            style={{ color: 'var(--color-accent)', fontWeight: 700 }}
          >
            {pendingCount} oczekujących <ChevronRight size={14} />
          </button>
        )}
      </div>
      <div className="cd-card-content" style={{ padding: '16px 20px' }}>
        {active ? (
          <>
            <div style={{
              fontSize: 24, fontWeight: 700, letterSpacing: 4, textAlign: 'center',
              padding: '14px 0', background: 'var(--color-bg)', borderRadius: 8, marginBottom: 12,
              fontFamily: 'monospace', color: 'var(--color-text)'
            }}>{code}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleCopy} style={{
                flex: 1, padding: '8px 0', background: 'var(--color-accent)', color: '#0B0E14',
                border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer',
                textAlign: 'center'
              }}>{copied ? 'Skopiowano!' : 'Kopiuj'}</button>
              <button onClick={handleReset} style={{
                padding: '8px 14px', background: 'transparent', color: 'var(--color-text)',
                border: '1px solid var(--color-border-md)', borderRadius: 8, fontSize: 13, cursor: 'pointer'
              }}>Nowy kod</button>
              <button onClick={handleToggle} style={{
                padding: '8px 14px', background: 'transparent', color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border-md)', borderRadius: 8, fontSize: 13, cursor: 'pointer'
              }}>Wyłącz</button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 12 }}>
              Kod jest dezaktywowany
            </p>
            <button onClick={handleToggle} style={{
              padding: '10px 24px', background: 'var(--color-accent)', color: '#0B0E14',
              border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer'
            }}>Aktywuj</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [players, setPlayers] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [pendingPayments, setPendingPayments] = useState(0)
  const [draftReviews, setDraftReviews] = useState(0)
  const [joinRequests, setJoinRequests] = useState([])

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
        setJoinRequests(requestsRes.data.requests || [])

        const p = playersRes.data.players || playersRes.data || []
        setPlayers(p)

        const allPayments = paymentsRes.data.payments || []
        setPendingPayments(allPayments.filter((py) => py.status === 'pending' || py.status === 'overdue').length)

        const allReviews = reviewsRes.data.reviews || []
        setDraftReviews(allReviews.filter((r) => r.status === 'draft').length)

        const s = sessionsRes.data.sessions || sessionsRes.data || []
        const playerMap = {}
        p.forEach((pl) => { playerMap[pl._id] = `${pl.firstName} ${pl.lastName}` })
        setSessions(
          s.map((sess) => ({
            ...sess,
            playerName: playerMap[typeof sess.player === 'object' ? sess.player._id : sess.player] || 'Zawodnik',
          })).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10)
        )
      } catch { /* silent */ }
      setLoading(false)
    }
    fetchData()
  }, [])

  const now = new Date()
  const thisMonth = sessions.filter((s) => {
    const d = new Date(s.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const totalHours = Math.round(thisMonth.reduce((s, sess) => s + (sess.durationMinutes || 0), 0) / 60)

  const avgSkill = players.length > 0 ? Math.round(
    players.reduce((sum, p) => {
      const sk = p.skills || {}
      return sum + Object.values(sk).reduce((s, v) => s + (v?.score || 0), 0) / Math.max(Object.keys(sk).length, 1)
    }, 0) / players.length
  ) : 0

  const handleJoinRequest = async (playerId, action) => {
    try {
      await api.put(`/players/${playerId}/coach-request`, { action })
      setJoinRequests((prev) => prev.filter((r) => r._id !== playerId))
      if (action === 'accept') {
        const { data } = await api.get('/players')
        setPlayers(data.players || data || [])
      }
    } catch { /* silent */ }
  }

  if (loading) {
    return <div className="cd-page"><div className="cd-loading"><div className="cd-spinner" /></div></div>
  }

  return (
    <div className="cd-page">
      {/* Header */}
      <div className="cd-hero">
        <div className="cd-hero-text">
          <h1 className="cd-hero-title">Witaj, {user?.firstName}</h1>
          <p className="cd-hero-sub">{user?.coachProfile?.club || 'ServeIQ'}</p>
        </div>
        <div className="cd-hero-actions">
          <Button variant="primary" size="sm" onClick={() => navigate('/coach/sessions/new')}>
            <Plus size={14} /> Nowa sesja
          </Button>
          <Button size="sm" onClick={() => navigate('/coach/reviews/new')}>
            <FileText size={14} /> Ocena
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="cd-stats">
        <StatCard icon={Users} label="Zawodnicy" value={players.length} color="var(--color-accent)" bg="var(--color-accent-muted)" onClick={() => navigate('/coach/players')} />
        <StatCard icon={Calendar} label="Sesje (mies.)" value={thisMonth.length} color="var(--color-green)" bg="var(--color-green-bg)" onClick={() => navigate('/coach/sessions')} />
        <StatCard icon={Clock} label="Godziny" value={totalHours} color="var(--color-blue)" bg="var(--color-blue-bg)" />
        <StatCard icon={TrendingUp} label="Średni skill" value={avgSkill} color="var(--color-amber)" bg="var(--color-amber-bg)" />
      </div>

      {/* Invite code */}
      <InviteCodeCard />

      {/* Alerts */}
      {(pendingPayments > 0 || draftReviews > 0) && (
        <div className="cd-alerts">
          {pendingPayments > 0 && (
            <div className="cd-alert cd-alert-payment" onClick={() => navigate('/coach/payments')}>
              <CreditCard size={15} />
              <span>{pendingPayments} oczekując{pendingPayments === 1 ? 'a' : pendingPayments < 5 ? 'e' : 'ych'} płatność{pendingPayments === 1 ? '' : 'i'}</span>
              <ChevronRight size={14} />
            </div>
          )}
          {draftReviews > 0 && (
            <div className="cd-alert cd-alert-review" onClick={() => navigate('/coach/reviews')}>
              <FileText size={15} />
              <span>{draftReviews} szkic{draftReviews === 1 ? '' : draftReviews < 5 ? 'y' : 'ów'} ocen</span>
              <ChevronRight size={14} />
            </div>
          )}
        </div>
      )}

      {/* Join requests (old flow) */}
      {joinRequests.length > 0 && (
        <div className="cd-join-requests">
          <h3 className="cd-join-title"><UserPlus size={16} /> Prośby o dołączenie</h3>
          {joinRequests.map((req) => {
            const parentName = req.parents?.[0] ? `${req.parents[0].firstName} ${req.parents[0].lastName}` : 'Rodzic'
            const age = req.dateOfBirth ? new Date().getFullYear() - new Date(req.dateOfBirth).getFullYear() : null
            return (
              <div key={req._id} className="cd-join-card">
                <div className="cd-join-info">
                  <span className="cd-join-player">{req.firstName} {req.lastName}</span>
                  <span className="cd-join-meta">
                    {age && `${age} lat · `}{parentName}
                    {req.coachRequest?.message && ` · "${req.coachRequest.message}"`}
                  </span>
                </div>
                <div className="cd-join-actions">
                  <button className="cd-join-accept" onClick={() => handleJoinRequest(req._id, 'accept')} title="Akceptuj">
                    <Check size={16} />
                  </button>
                  <button className="cd-join-reject" onClick={() => handleJoinRequest(req._id, 'reject')} title="Odrzuć">
                    <X size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Two-column grid */}
      <div className="cd-grid">
        {/* Players */}
        <div className="cd-card">
          <div className="cd-card-head">
            <h2>Zawodnicy</h2>
            <button className="cd-card-link" onClick={() => navigate('/coach/players')}>
              Wszyscy <ChevronRight size={14} />
            </button>
          </div>
          <div className="cd-card-content">
            {players.length === 0 ? (
              <div className="cd-empty">
                <Users size={28} strokeWidth={1.5} />
                <p>Dodaj pierwszego zawodnika</p>
                <Button variant="primary" size="sm" onClick={() => navigate('/coach/players/new')}>
                  <Plus size={14} /> Dodaj
                </Button>
              </div>
            ) : (
              players.slice(0, 5).map((p) => (
                <PlayerCard key={p._id} player={p} onClick={() => navigate(`/coach/player/${p._id}`)} />
              ))
            )}
          </div>
        </div>

        {/* Recent sessions */}
        <div className="cd-card">
          <div className="cd-card-head">
            <h2>Ostatnie sesje</h2>
            <button className="cd-card-link" onClick={() => navigate('/coach/sessions')}>
              Wszystkie <ChevronRight size={14} />
            </button>
          </div>
          <div className="cd-card-content">
            {sessions.length === 0 ? (
              <div className="cd-empty">
                <Calendar size={28} strokeWidth={1.5} />
                <p>Brak sesji treningowych</p>
              </div>
            ) : (
              sessions.slice(0, 6).map((s) => (
                <SessionRow key={s._id} session={s} onClick={() => navigate(`/coach/sessions/${s._id}/edit`)} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
