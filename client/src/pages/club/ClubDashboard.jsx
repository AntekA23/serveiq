import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Calendar, FileText, Percent,
  CalendarClock, AlertTriangle, ChevronRight, Loader2,
} from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'

const REASON_LABELS = {
  no_recent_activity: 'Brak aktywności >14d',
  no_review: 'Brak przeglądu >30d',
  no_goals: 'Brak celów',
  no_coach: 'Brak trenera',
}

const REASON_COLORS = {
  no_recent_activity: { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B' },
  no_review: { bg: 'rgba(77,166,255,0.15)', color: '#4DA6FF' },
  no_goals: { bg: 'rgba(239,68,68,0.15)', color: '#EF4444' },
  no_coach: { bg: 'rgba(139,92,246,0.15)', color: '#8B5CF6' },
}

function MetricCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div style={{
      background: 'var(--color-bg-secondary)',
      borderRadius: 12,
      padding: '1.25rem',
      border: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
          {label}
        </div>
      </div>
    </div>
  )
}

function PercentRing({ value, label, color }) {
  const pct = Math.min(Math.max(value, 0), 100)
  const dash = (pct / 100) * 94.25

  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <svg viewBox="0 0 36 36" style={{ width: 72, height: 72 }}>
        <circle cx="18" cy="18" r="15" fill="none" stroke="var(--color-bg-tertiary)" strokeWidth="3" />
        <circle
          cx="18" cy="18" r="15" fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${dash} 94.25`} strokeLinecap="round"
          transform="rotate(-90 18 18)"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x="18" y="19.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--color-text)">
          {pct}%
        </text>
      </svg>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 6 }}>
        {label}
      </div>
    </div>
  )
}

export default function ClubDashboard() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState(null)
  const [attention, setAttention] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [loading, setLoading] = useState(true)

  const clubId = user?.club && typeof user.club === 'object' ? user.club._id : user?.club

  useEffect(() => {
    if (!clubId) {
      setLoading(false)
      return
    }
    const fetch = async () => {
      try {
        const [dashRes, attRes, actRes] = await Promise.all([
          api.get(`/clubs/${clubId}/dashboard`),
          api.get(`/clubs/${clubId}/attention`).catch(() => ({ data: { players: [] } })),
          api.get('/activities?status=planned&limit=5').catch(() => ({ data: { activities: [] } })),
        ])
        setDashboard(dashRes.data.dashboard)
        setAttention(attRes.data.players || [])
        setUpcoming((actRes.data.activities || []).slice(0, 5))
      } catch { /* silent */ }
      setLoading(false)
    }
    fetch()
  }, [clubId])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-accent)' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!clubId) {
    return (
      <div style={{ padding: '2rem', color: 'var(--color-text-secondary)' }}>
        Nie przypisano klubu do tego konta.
      </div>
    )
  }

  const d = dashboard || {}
  const pc = d.pathwayContinuity || {}
  const total = pc.totalPlayers || 0
  const pctGoal = total > 0 ? Math.round((pc.playersWithActiveGoal / total) * 100) : 0
  const pctReview = total > 0 ? Math.round((pc.playersWithRecentReview / total) * 100) : 0
  const pctActivity = total > 0 ? Math.round((pc.playersWithUpcomingActivity / total) * 100) : 0

  const clubName = user?.club && typeof user.club === 'object' ? user.club.name : ''

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
          Panel Klubu
        </h1>
        {clubName && (
          <p style={{ color: 'var(--color-text-secondary)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
            {clubName}
          </p>
        )}
      </div>

      {/* 4 Metric Cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem', marginBottom: '1.5rem',
      }}>
        <MetricCard icon={Users} label="Zawodnicy" value={d.totalPlayers ?? 0} color="var(--color-accent)" bg="var(--color-accent-muted)" />
        <MetricCard icon={Calendar} label="Aktywności (miesiąc)" value={d.totalActivities ?? 0} color="var(--color-green)" bg="var(--color-green-bg)" />
        <MetricCard icon={FileText} label="Przeglądy (miesiąc)" value={d.recentReviews ?? 0} color="var(--color-blue)" bg="var(--color-blue-bg)" />
        <MetricCard icon={Percent} label="Frekwencja" value={`${d.attendanceRate ?? 0}%`} color="var(--color-amber)" bg="var(--color-amber-bg)" />
      </div>

      {/* Two-column layout */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '1.5rem', marginBottom: '1.5rem',
      }}>
        {/* Players by Stage */}
        <div style={{
          background: 'var(--color-bg-secondary)', borderRadius: 12,
          border: '1px solid var(--color-border)', padding: '1.25rem',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 1rem' }}>
            Zawodnicy wg etapu
          </h2>
          {(d.playersByStage || []).length === 0 ? (
            <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.85rem' }}>Brak danych</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(d.playersByStage || []).map((s) => {
                const maxCount = Math.max(...(d.playersByStage || []).map((x) => x.count), 1)
                const widthPct = Math.max((s.count / maxCount) * 100, 8)
                const stageLabel = s._id || 'Nieokreślony'
                return (
                  <div key={s._id || 'none'} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: '0 0 140px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {stageLabel}
                    </div>
                    <div style={{ flex: 1, height: 22, background: 'var(--color-bg-tertiary)', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{
                        width: `${widthPct}%`, height: '100%', borderRadius: 6,
                        background: 'var(--color-accent)', transition: 'width 0.4s ease',
                        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8,
                      }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#0B0E14' }}>{s.count}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pathway Continuity */}
        <div style={{
          background: 'var(--color-bg-secondary)', borderRadius: 12,
          border: '1px solid var(--color-border)', padding: '1.25rem',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 1rem' }}>
            Ciągłość ścieżki
          </h2>
          {total === 0 ? (
            <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.85rem' }}>Brak zawodników</p>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-around', padding: '0.5rem 0' }}>
              <PercentRing value={pctGoal} label="Aktywne cele" color="var(--color-green)" />
              <PercentRing value={pctReview} label="Ostatni przegląd" color="var(--color-blue)" />
              <PercentRing value={pctActivity} label="Planowane zaj." color="var(--color-amber)" />
            </div>
          )}
        </div>
      </div>

      {/* Players Needing Attention */}
      <div style={{
        background: 'var(--color-bg-secondary)', borderRadius: 12,
        border: '1px solid var(--color-border)', padding: '1.25rem', marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
          <AlertTriangle size={18} color="var(--color-amber)" />
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
            Wymagają uwagi
          </h2>
          <span style={{
            fontSize: '0.75rem', background: 'var(--color-amber-bg)', color: 'var(--color-amber)',
            borderRadius: 10, padding: '2px 8px', fontWeight: 600,
          }}>
            {attention.length}
          </span>
        </div>
        {attention.length === 0 ? (
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.85rem' }}>
            Wszyscy zawodnicy są na bieżąco.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {attention.map((p) => (
              <div key={p._id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '0.6rem 0.75rem',
                background: 'var(--color-bg-tertiary)', borderRadius: 8,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.9rem' }}>
                    {p.firstName} {p.lastName}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {p.reasons.map((r) => (
                      <span key={r} style={{
                        fontSize: '0.7rem', fontWeight: 500, padding: '2px 8px', borderRadius: 6,
                        background: REASON_COLORS[r]?.bg || 'var(--color-bg-tertiary)',
                        color: REASON_COLORS[r]?.color || 'var(--color-text-secondary)',
                      }}>
                        {REASON_LABELS[r] || r}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/players`)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--color-accent)', fontSize: '0.8rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                  }}
                >
                  Zobacz profil <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Activities */}
      <div style={{
        background: 'var(--color-bg-secondary)', borderRadius: 12,
        border: '1px solid var(--color-border)', padding: '1.25rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
          <CalendarClock size={18} color="var(--color-blue)" />
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
            Nadchodzące aktywności
          </h2>
        </div>
        {upcoming.length === 0 ? (
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.85rem' }}>
            Brak zaplanowanych aktywności.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcoming.map((a) => {
              const dt = new Date(a.date)
              return (
                <div key={a._id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '0.6rem 0.75rem',
                  background: 'var(--color-bg-tertiary)', borderRadius: 8,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 8, background: 'var(--color-blue-bg)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-blue)', lineHeight: 1 }}>
                      {dt.toLocaleDateString('pl-PL', { day: 'numeric' })}
                    </span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--color-blue)', textTransform: 'uppercase' }}>
                      {dt.toLocaleDateString('pl-PL', { month: 'short' })}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.85rem' }}>
                      {a.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      {a.type}{a.startTime ? ` \u00b7 ${a.startTime}` : ''}
                      {a.players?.length ? ` \u00b7 ${a.players.length} zawodnik${a.players.length === 1 ? '' : a.players.length < 5 ? 'ów' : 'ów'}` : ''}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
