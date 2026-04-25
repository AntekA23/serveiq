import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ChevronRight, Target, Star, Calendar, Clock, Award, Dumbbell,
} from 'lucide-react'
import api from '../../api/axios'
import Avatar from '../../components/ui/Avatar/Avatar'
import BadgePreview from '../../components/badges/BadgePreview'
import IdolReadOnly from '../../components/player/IdolReadOnly'
import PalmaresSection from '../../components/player/PalmaresSection'
import CoachingTeamSection from '../../components/player/CoachingTeamSection'
import RankingSummary from '../../components/player/RankingSummary'
import UpcomingTournaments from '../../components/player/UpcomingTournaments'
import RecentMatchesSection from '../../components/match/RecentMatchesSection'
import SeasonTimeline from '../../components/season/SeasonTimeline'
import CareerTrajectory from '../../components/career/CareerTrajectory'
import './ChildProfile.css'

function formatRelDate(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Dzisiaj'
  if (diff === 1) return 'Jutro'
  if (diff > 1 && diff <= 6) return d.toLocaleDateString('pl-PL', { weekday: 'long' })
  return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })
}

export default function ChildProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [child, setChild] = useState(null)
  const [activities, setActivities] = useState([])
  const [reviews, setReviews] = useState([])
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [playerRes, actRes, revRes, achRes] = await Promise.all([
          api.get(`/players/${id}`),
          api.get('/activities?status=planned&limit=3').catch(() => ({ data: { activities: [] } })),
          api.get(`/reviews?player=${id}&status=published&limit=1`).catch(() => ({ data: { reviews: [] } })),
          api.get(`/achievements?player=${id}`).catch(() => ({ data: { achievements: [] } })),
        ])
        setChild(playerRes.data.player || playerRes.data)
        const now = new Date()
        setActivities((actRes.data.activities || []).filter((a) => new Date(a.date) >= now).slice(0, 3))
        setReviews(revRes.data.reviews || [])
        setAchievements(achRes.data.achievements || [])
      } catch { /* silent */ }
      setLoading(false)
    }
    fetchData()
  }, [id])

  if (loading) {
    return <div className="cp-page"><div className="cp-loading"><div className="cp-spinner" /></div></div>
  }

  if (!child) {
    return <div className="cp-page"><div className="cp-error">Nie znaleziono zawodnika</div></div>
  }

  const age = child.dateOfBirth
    ? Math.floor((Date.now() - new Date(child.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  // Goals
  const activeGoals = (child.goals || []).filter((g) => !g.completed).slice(0, 4)
  const completedCount = (child.goals || []).filter((g) => g.completed).length

  // Rankings — only show those that exist
  const rankings = []
  if (child.ranking?.pzt) rankings.push({ label: 'PZT', val: child.ranking.pzt })
  if (child.ranking?.te) rankings.push({ label: 'TE', val: child.ranking.te })
  if (child.ranking?.atp) rankings.push({ label: 'ATP', val: child.ranking.atp })
  if (child.ranking?.wta) rankings.push({ label: 'WTA', val: child.ranking.wta })

  const latestReview = reviews[0] || null

  // Training plan
  const plan = child.trainingPlan || {}
  const schedule = plan.weeklySchedule || []
  const weekGoal = plan.weeklyGoal || {}
  const focusAreas = plan.focus || []
  const planNotes = plan.notes || ''

  const DAY_NAMES = ['', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd']
  const DAY_FULL = ['', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']
  const SESSION_LABELS = {
    kort: 'Kort', sparing: 'Sparing', kondycja: 'Kondycja',
    rozciaganie: 'Rozciąganie', mecz: 'Mecz', inne: 'Inne',
  }
  const SESSION_COLORS = {
    kort: '#22c55e', sparing: '#eab308', kondycja: '#4da6ff',
    rozciaganie: '#8b5cf6', mecz: '#ef4444', inne: '#6b7280',
  }

  // Group schedule by day
  const byDay = {}
  schedule.forEach((s) => {
    if (!byDay[s.day]) byDay[s.day] = []
    byDay[s.day].push(s)
  })
  const totalSessions = schedule.length
  const totalHours = Math.round(schedule.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / 60 * 10) / 10
  const activeDays = Object.keys(byDay).length

  return (
    <div className="cp-page">
      {/* Back */}
      <button className="cp-back" onClick={() => navigate('/parent/dashboard')}>
        <ArrowLeft size={16} /> Powrót
      </button>

      {/* ─── 1. Hero ─── */}
      <div className="cp-hero">
        <Avatar
          firstName={child.firstName}
          lastName={child.lastName}
          size={64}
          role="player"
          src={child.avatarUrl}
        />
        <div className="cp-hero-info">
          <h1 className="cp-hero-name">{child.firstName} {child.lastName}</h1>
          <div className="cp-hero-tags">
            {age && <span className="cp-tag">{age} lat</span>}
            {child.pathwayStage && <span className="cp-tag cp-tag-accent">{child.pathwayStage}</span>}
            {rankings.map((r) => (
              <span key={r.label} className="cp-tag cp-tag-rank">{r.label} #{r.val}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 1.5 Performance pathway sections (warunkowo) ─── */}
      {child.developmentLevel === 'performance' && (
        <>
          <PalmaresSection playerId={child._id} />
          <CoachingTeamSection coaches={child.coaches || []} />
          <RankingSummary ranking={child.ranking || {}} />
          <SeasonTimeline playerId={child._id} />
          <UpcomingTournaments playerId={child._id} />
          <RecentMatchesSection playerId={child._id} />
          <CareerTrajectory player={child} achievements={achievements} />
        </>
      )}

      {/* ─── 2. Training Plan ─── */}
      {schedule.length > 0 && (
        <section className="cp-section">
          <div className="cp-section-head">
            <h2 className="cp-section-title"><Dumbbell size={14} /> Plan treningowy</h2>
            <button className="cp-section-link" onClick={() => navigate('/parent/training-plan')}>
              Pełny plan <ChevronRight size={14} />
            </button>
          </div>

          {/* Stats ribbon */}
          <div className="cp-plan-stats">
            <div className="cp-plan-stat">
              <span className="cp-plan-stat-val">{totalSessions}</span>
              <span className="cp-plan-stat-label">treningów/tyg</span>
            </div>
            <div className="cp-plan-stat-sep" />
            <div className="cp-plan-stat">
              <span className="cp-plan-stat-val">{totalHours}</span>
              <span className="cp-plan-stat-label">h/tyg</span>
            </div>
            <div className="cp-plan-stat-sep" />
            <div className="cp-plan-stat">
              <span className="cp-plan-stat-val">{activeDays}</span>
              <span className="cp-plan-stat-label">dni</span>
            </div>
          </div>

          {/* Week strip */}
          <div className="cp-plan-week">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
              const items = byDay[day] || []
              const isActive = items.length > 0
              return (
                <div key={day} className={`cp-plan-day ${isActive ? 'active' : ''}`}>
                  <span className="cp-plan-day-name">{DAY_NAMES[day]}</span>
                  {isActive ? (
                    <div className="cp-plan-day-sessions">
                      {items.map((s, i) => (
                        <div
                          key={i}
                          className="cp-plan-session"
                          style={{ '--s-color': SESSION_COLORS[s.sessionType] || SESSION_COLORS.inne }}
                        >
                          <span className="cp-plan-session-type">{SESSION_LABELS[s.sessionType] || s.sessionType}</span>
                          <span className="cp-plan-session-time">
                            {s.startTime ? s.startTime.slice(0, 5) : '—'}
                          </span>
                          <span className="cp-plan-session-dur">{s.durationMinutes}′</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="cp-plan-day-off">—</div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Focus areas */}
          {focusAreas.length > 0 && (
            <div className="cp-plan-focus">
              <span className="cp-plan-focus-label">Fokus:</span>
              {focusAreas.map((f, i) => (
                <span key={i} className="cp-plan-focus-tag">{f}</span>
              ))}
            </div>
          )}

          {/* Coach notes */}
          {planNotes && (
            <div className="cp-plan-notes">
              <span className="cp-plan-notes-text">{planNotes}</span>
            </div>
          )}
        </section>
      )}

      {/* ─── 3. Upcoming ─── */}
      {activities.length > 0 && (
        <section className="cp-section">
          <div className="cp-section-head">
            <h2 className="cp-section-title"><Calendar size={14} /> Nadchodzące</h2>
            <button className="cp-section-link" onClick={() => navigate('/calendar')}>
              Kalendarz <ChevronRight size={14} />
            </button>
          </div>
          <div className="cp-upcoming">
            {activities.map((a, i) => (
              <div key={a._id} className="cp-upcoming-item" style={{ '--i': i }}>
                <div className="cp-upcoming-when">
                  <span className="cp-upcoming-day">{formatRelDate(a.date)}</span>
                  {a.startTime && <span className="cp-upcoming-time">{a.startTime.slice(0, 5)}</span>}
                </div>
                <div className="cp-upcoming-what">
                  <span className="cp-upcoming-title">{a.title || a.type}</span>
                  {a.location && <span className="cp-upcoming-loc">{a.location}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── 4. Latest review ─── */}
      {latestReview && (
        <section className="cp-section">
          <div className="cp-section-head">
            <h2 className="cp-section-title"><Star size={14} /> Ostatnia ocena</h2>
            <button className="cp-section-link" onClick={() => navigate('/reviews')}>
              Wszystkie <ChevronRight size={14} />
            </button>
          </div>
          <div className="cp-review" onClick={() => navigate('/reviews')}>
            {latestReview.rating && (
              <div className="cp-review-stars">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={13} fill={s <= latestReview.rating ? 'var(--color-amber)' : 'none'} color={s <= latestReview.rating ? 'var(--color-amber)' : 'var(--color-text-tertiary)'} />
                ))}
              </div>
            )}
            <p className="cp-review-text">
              {latestReview.whatHappened || latestReview.title || 'Ocena trenera'}
            </p>
            <span className="cp-review-date">
              {new Date(latestReview.createdAt || latestReview.periodStart).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}
            </span>
          </div>
        </section>
      )}

      {/* ─── 5. Goals ─── */}
      {(activeGoals.length > 0 || completedCount > 0) && (
        <section className="cp-section">
          <div className="cp-section-head">
            <h2 className="cp-section-title"><Target size={14} /> Cele</h2>
            {completedCount > 0 && (
              <span className="cp-goals-completed">
                <Award size={12} /> {completedCount} ukończonych
              </span>
            )}
          </div>
          <div className="cp-goals">
            {activeGoals.map((g, i) => (
              <div key={g._id || i} className="cp-goal" style={{ '--i': i }}>
                <div className="cp-goal-dot" />
                <div className="cp-goal-body">
                  <span className="cp-goal-text">{g.text}</span>
                  {g.dueDate && (
                    <span className="cp-goal-date">
                      do {new Date(g.dueDate).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── 6. Twój Idol (read-only) ─── */}
      {child.idol?.name && (
        <section className="cp-section">
          <div className="cp-section-head">
            <h2 className="cp-section-title"><Star size={14} /> Twój Idol</h2>
          </div>
          <IdolReadOnly idol={child.idol} />
        </section>
      )}

      {/* ─── 7. Odznaki ─── */}
      <section className="cp-section">
        <div className="cp-section-head">
          <h2 className="cp-section-title"><Award size={14} /> Odznaki</h2>
          <button className="cp-section-link" onClick={() => navigate(`/parent/child/${id}/badges`)}>
            Wszystkie <ChevronRight size={14} />
          </button>
        </div>
        <BadgePreview playerId={id} />
      </section>

      {/* ─── Quick links ─── */}
      <div className="cp-quick-links">
        <button className="cp-quick-link" onClick={() => navigate(`/parent/child/${id}/timeline`)}>
          <Clock size={14} /> Historia
        </button>
        <button className="cp-quick-link" onClick={() => navigate(`/parent/child/${id}/badges`)}>
          <Award size={14} /> Odznaki
        </button>
        <button className="cp-quick-link" onClick={() => navigate('/reviews')}>
          <Star size={14} /> Oceny
        </button>
        <button className="cp-quick-link" onClick={() => navigate('/parent/training-plan')}>
          <Calendar size={14} /> Plan
        </button>
      </div>
    </div>
  )
}
