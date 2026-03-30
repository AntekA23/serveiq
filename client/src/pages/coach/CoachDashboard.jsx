import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Calendar, TrendingUp, Plus, ChevronRight, Clock, FileText, CreditCard } from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import Avatar from '../../components/ui/Avatar/Avatar'
import Button from '../../components/ui/Button/Button'
import './Coach.css'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="coach-stat" style={{ '--stat-color': color }}>
      <div className="coach-stat-icon"><Icon size={18} /></div>
      <div className="coach-stat-value">{value}</div>
      <div className="coach-stat-label">{label}</div>
    </div>
  )
}

function PlayerRow({ player, onClick }) {
  const skills = player.skills || {}
  const avgSkill = Object.values(skills).reduce((s, sk) => s + (sk?.score || 0), 0) / Math.max(Object.keys(skills).length, 1)

  return (
    <div className="coach-player-row" onClick={onClick}>
      <Avatar firstName={player.firstName} lastName={player.lastName} size={36} role="player" src={player.avatarUrl} />
      <div className="coach-player-info">
        <span className="coach-player-name">{player.firstName} {player.lastName}</span>
        <span className="coach-player-meta">
          {player.dateOfBirth && `${new Date().getFullYear() - new Date(player.dateOfBirth).getFullYear()} lat`}
          {player.ranking?.pzt && ` · PZT #${player.ranking.pzt}`}
        </span>
      </div>
      <div className="coach-player-skill">
        <div className="coach-player-skill-bar">
          <div className="coach-player-skill-fill" style={{ width: `${avgSkill}%` }} />
        </div>
        <span className="coach-player-skill-val">{Math.round(avgSkill)}</span>
      </div>
      <ChevronRight size={16} className="coach-player-arrow" />
    </div>
  )
}

function SessionRow({ session }) {
  const typeLabels = {
    kort: 'Kort', sparing: 'Sparing', kondycja: 'Kondycja',
    rozciaganie: 'Rozciaganie', mecz: 'Mecz', inne: 'Inne',
  }
  const typeColors = {
    kort: 'var(--color-green)', sparing: 'var(--color-amber)', kondycja: 'var(--color-blue)',
    rozciaganie: 'var(--color-purple)', mecz: 'var(--color-heart)', inne: 'var(--color-text-tertiary)',
  }

  const d = new Date(session.date)
  const dateStr = `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`

  return (
    <div className="coach-session-row">
      <div className="coach-session-type" style={{ background: typeColors[session.sessionType] || typeColors.inne }} />
      <div className="coach-session-info">
        <span className="coach-session-title">{session.title || typeLabels[session.sessionType] || 'Trening'}</span>
        <span className="coach-session-meta">
          {session.playerName} · {dateStr} {session.startTime && `· ${session.startTime}`} · {session.durationMinutes}min
        </span>
      </div>
    </div>
  )
}

export default function CoachDashboard() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [players, setPlayers] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  const [pendingPayments, setPendingPayments] = useState(0)
  const [draftReviews, setDraftReviews] = useState(0)

  useEffect(() => {
    const fetch = async () => {
      try {
        const [playersRes, sessionsRes, paymentsRes, reviewsRes] = await Promise.all([
          api.get('/players'),
          api.get('/sessions'),
          api.get('/payments').catch(() => ({ data: { payments: [] } })),
          api.get('/reviews').catch(() => ({ data: { reviews: [] } })),
        ])
        const p = playersRes.data.players || playersRes.data || []
        setPlayers(p)

        // Count pending/overdue payments
        const allPayments = paymentsRes.data.payments || []
        setPendingPayments(allPayments.filter((py) => py.status === 'pending' || py.status === 'overdue').length)

        // Count draft reviews
        const allReviews = reviewsRes.data.reviews || []
        setDraftReviews(allReviews.filter((r) => r.status === 'draft').length)

        const s = sessionsRes.data.sessions || sessionsRes.data || []
        // Enrich sessions with player names
        const playerMap = {}
        p.forEach((pl) => { playerMap[pl._id] = `${pl.firstName} ${pl.lastName}` })
        const enriched = s.map((sess) => ({
          ...sess,
          playerName: playerMap[typeof sess.player === 'object' ? sess.player._id : sess.player] || 'Zawodnik',
        }))
        setSessions(enriched.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10))
      } catch { /* silent */ }
      setLoading(false)
    }
    fetch()
  }, [])

  // Stats
  const now = new Date()
  const thisMonth = sessions.filter((s) => {
    const d = new Date(s.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const totalHours = Math.round(thisMonth.reduce((s, sess) => s + (sess.durationMinutes || 0), 0) / 60)

  if (loading) {
    return <div className="coach-page"><h1 className="page-title">Pulpit trenera</h1><div className="coach-loading">Ladowanie...</div></div>
  }

  return (
    <div className="coach-page">
      <div className="coach-header">
        <div>
          <h1 className="page-title">Witaj, {user?.firstName}</h1>
          <p className="coach-subtitle">{user?.coachProfile?.club || 'ServeIQ'}</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate('/coach/sessions/new')}>
          <Plus size={14} /> Nowa sesja
        </Button>
      </div>

      {/* Stats */}
      <div className="coach-stats">
        <StatCard icon={Users} label="Zawodnicy" value={players.length} color="var(--color-accent)" />
        <StatCard icon={Calendar} label="Sesje (miesiac)" value={thisMonth.length} color="var(--color-green)" />
        <StatCard icon={Clock} label="Godziny (miesiac)" value={totalHours} color="var(--color-blue)" />
        <StatCard icon={TrendingUp} label="Sredni skill" value={
          players.length > 0 ? Math.round(
            players.reduce((sum, p) => {
              const sk = p.skills || {}
              return sum + Object.values(sk).reduce((s, v) => s + (v?.score || 0), 0) / Math.max(Object.keys(sk).length, 1)
            }, 0) / players.length
          ) : 0
        } color="var(--color-amber)" />
      </div>

      {/* Quick action alerts */}
      {(pendingPayments > 0 || draftReviews > 0) && (
        <div className="coach-alerts">
          {pendingPayments > 0 && (
            <div className="coach-alert" onClick={() => navigate('/coach/payments')}>
              <CreditCard size={14} />
              <span>{pendingPayments} oczekujac{pendingPayments === 1 ? 'a' : pendingPayments < 5 ? 'e' : 'ych'} platnosc{pendingPayments === 1 ? '' : 'i'}</span>
              <ChevronRight size={14} />
            </div>
          )}
          {draftReviews > 0 && (
            <div className="coach-alert" onClick={() => navigate('/coach/reviews')}>
              <FileText size={14} />
              <span>{draftReviews} szkic{draftReviews === 1 ? '' : draftReviews < 5 ? 'y' : 'ow'} ocen do opublikowania</span>
              <ChevronRight size={14} />
            </div>
          )}
        </div>
      )}

      <div className="coach-grid">
        {/* Players */}
        <div className="coach-card">
          <div className="coach-card-header">
            <h2>Zawodnicy</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/coach/players')}>
              Wszyscy <ChevronRight size={14} />
            </Button>
          </div>
          <div className="coach-card-body">
            {players.length === 0 ? (
              <div className="coach-empty">
                Brak zawodnikow. Dodaj pierwszego zawodnika.
                <Button variant="primary" size="sm" onClick={() => navigate('/coach/players/new')} style={{ marginTop: 12 }}>
                  <Plus size={14} /> Dodaj zawodnika
                </Button>
              </div>
            ) : (
              players.slice(0, 5).map((p) => (
                <PlayerRow key={p._id} player={p} onClick={() => navigate(`/coach/player/${p._id}`)} />
              ))
            )}
          </div>
        </div>

        {/* Recent sessions */}
        <div className="coach-card">
          <div className="coach-card-header">
            <h2>Ostatnie sesje</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/coach/sessions')}>
              Wszystkie <ChevronRight size={14} />
            </Button>
          </div>
          <div className="coach-card-body">
            {sessions.length === 0 ? (
              <div className="coach-empty">Brak sesji treningowych.</div>
            ) : (
              sessions.slice(0, 6).map((s) => <SessionRow key={s._id} session={s} />)
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
