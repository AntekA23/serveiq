import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Calendar, AlertTriangle, ChevronRight, Loader2,
  Dumbbell, CreditCard,
} from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import './ClubDashboard.css'

const REASON_LABELS = {
  no_recent_activity: 'Brak aktywności >14d',
  no_review: 'Brak przeglądu >30d',
  no_goals: 'Brak celów',
  no_coach: 'Brak trenera',
}

const REASON_COLORS = {
  no_recent_activity: { bg: 'rgba(245,158,11,0.12)', color: 'var(--color-amber)' },
  no_review: { bg: 'rgba(77,166,255,0.12)', color: 'var(--color-blue)' },
  no_goals: { bg: 'rgba(239,68,68,0.12)', color: 'var(--color-red)' },
  no_coach: { bg: 'rgba(139,92,246,0.12)', color: 'var(--color-sleep)' },
}

export default function ClubDashboard() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState(null)
  const [attention, setAttention] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [loading, setLoading] = useState(true)

  const clubId = user?.club && typeof user.club === 'object' ? user.club._id : user?.club
  const clubName = user?.club && typeof user.club === 'object' ? user.club.name : ''

  useEffect(() => {
    if (!clubId) { setLoading(false); return }
    const fetchAll = async () => {
      try {
        const [dashRes, attRes, actRes] = await Promise.all([
          api.get(`/clubs/${clubId}/dashboard`),
          api.get(`/clubs/${clubId}/attention`).catch(() => ({ data: { players: [] } })),
          api.get('/activities?status=planned&limit=5').catch(() => ({ data: { activities: [] } })),
        ])
        setDashboard(dashRes.data.dashboard)
        setAttention(attRes.data.players || [])

        // Filter to today + upcoming
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        const acts = (actRes.data.activities || [])
          .filter((a) => new Date(a.date) >= now)
          .slice(0, 4)
        setUpcoming(acts)
      } catch { /* silent */ }
      setLoading(false)
    }
    fetchAll()
  }, [clubId])

  if (loading) {
    return (
      <div className="cld-page">
        <div className="cld-loading"><Loader2 size={24} className="cld-spin" /></div>
      </div>
    )
  }

  if (!clubId) {
    return (
      <div className="cld-page">
        <p className="cld-no-club">Nie przypisano klubu do tego konta.</p>
      </div>
    )
  }

  const d = dashboard || {}

  return (
    <div className="cld-page">
      {/* ─── Header ─── */}
      <div className="cld-header">
        <h1 className="cld-title">{clubName || 'Panel Klubu'}</h1>
      </div>

      {/* ─── Metrics inline ─── */}
      <div className="cld-metrics">
        <div className="cld-metric">
          <Users size={15} />
          <span className="cld-metric-val">{d.totalPlayers ?? 0}</span>
          <span className="cld-metric-label">zawodników</span>
        </div>
        <div className="cld-metric-sep" />
        <div className="cld-metric">
          <Calendar size={15} />
          <span className="cld-metric-val">{d.totalActivities ?? 0}</span>
          <span className="cld-metric-label">aktywności/mies.</span>
        </div>
        <div className="cld-metric-sep" />
        <div className="cld-metric">
          <Dumbbell size={15} />
          <span className="cld-metric-val">{d.totalCoaches ?? '—'}</span>
          <span className="cld-metric-label">trenerów</span>
        </div>
        {d.attendanceRate > 0 && (
          <>
            <div className="cld-metric-sep" />
            <div className="cld-metric">
              <span className="cld-metric-val">{d.attendanceRate}%</span>
              <span className="cld-metric-label">frekwencja</span>
            </div>
          </>
        )}
      </div>

      {/* ─── Needs attention ─── */}
      {attention.length > 0 && (
        <section className="cld-section">
          <div className="cld-section-head">
            <AlertTriangle size={15} className="cld-attention-icon" />
            <h2 className="cld-section-title">Wymagają uwagi</h2>
            <span className="cld-badge">{attention.length}</span>
          </div>
          <div className="cld-attention-list">
            {attention.slice(0, 6).map((p, i) => (
              <div key={p._id} className="cld-attention-row" style={{ '--i': i }}>
                <div className="cld-attention-info">
                  <span className="cld-attention-name">{p.firstName} {p.lastName}</span>
                  <div className="cld-attention-reasons">
                    {p.reasons.map((r) => (
                      <span
                        key={r}
                        className="cld-reason-badge"
                        style={{ '--r-bg': REASON_COLORS[r]?.bg, '--r-color': REASON_COLORS[r]?.color }}
                      >
                        {REASON_LABELS[r] || r}
                      </span>
                    ))}
                  </div>
                </div>
                <button className="cld-attention-link" onClick={() => navigate('/club/players')}>
                  <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Upcoming activities ─── */}
      <section className="cld-section">
        <div className="cld-section-head">
          <h2 className="cld-section-title">Nadchodzące</h2>
          <button className="cld-section-link" onClick={() => navigate('/calendar')}>
            Kalendarz <ChevronRight size={14} />
          </button>
        </div>

        {upcoming.length === 0 ? (
          <div className="cld-empty-state">
            <Calendar size={20} />
            <p>Brak zaplanowanych aktywności</p>
          </div>
        ) : (
          <div className="cld-upcoming-list">
            {upcoming.map((a, i) => {
              const dt = new Date(a.date)
              return (
                <div key={a._id} className="cld-upcoming-item" style={{ '--i': i }}>
                  <div className="cld-upcoming-date">
                    <span className="cld-upcoming-day">{dt.toLocaleDateString('pl-PL', { day: 'numeric' })}</span>
                    <span className="cld-upcoming-month">{dt.toLocaleDateString('pl-PL', { month: 'short' })}</span>
                  </div>
                  <div className="cld-upcoming-body">
                    <span className="cld-upcoming-title">{a.title}</span>
                    <span className="cld-upcoming-meta">
                      {a.type}{a.startTime ? ` · ${a.startTime.slice(0, 5)}` : ''}
                      {a.players?.length ? ` · ${a.players.length} zaw.` : ''}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ─── Quick nav ─── */}
      <div className="cld-quick-nav">
        <button className="cld-quick-item" onClick={() => navigate('/club/players')}>
          <Users size={16} /> Zawodnicy
        </button>
        <button className="cld-quick-item" onClick={() => navigate('/coaches')}>
          <Dumbbell size={16} /> Trenerzy
        </button>
        <button className="cld-quick-item" onClick={() => navigate('/club/payments')}>
          <CreditCard size={16} /> Płatności
        </button>
      </div>
    </div>
  )
}
