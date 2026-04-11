import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ChevronRight, TrendingUp, Target, Star, Calendar, Clock, Award,
} from 'lucide-react'
import api from '../../api/axios'
import Avatar from '../../components/ui/Avatar/Avatar'
import { SKILL_NAMES } from '../../constants/skillLevels'
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [playerRes, actRes, revRes] = await Promise.all([
          api.get(`/players/${id}`),
          api.get('/activities?status=planned&limit=3').catch(() => ({ data: { activities: [] } })),
          api.get(`/reviews?player=${id}&status=published&limit=1`).catch(() => ({ data: { reviews: [] } })),
        ])
        setChild(playerRes.data.player || playerRes.data)
        const now = new Date()
        setActivities((actRes.data.activities || []).filter((a) => new Date(a.date) >= now).slice(0, 3))
        setReviews(revRes.data.reviews || [])
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

  // Skills average
  const skills = child.skills || {}
  const skillEntries = Object.entries(SKILL_NAMES).map(([key, label]) => {
    const d = skills[key]
    const score = typeof d === 'object' ? (d?.score ?? 0) : (d ?? 0)
    return { key, label, score }
  }).filter((s) => s.score > 0)

  const avgSkill = skillEntries.length > 0
    ? Math.round(skillEntries.reduce((sum, s) => sum + s.score, 0) / skillEntries.length)
    : 0

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

      {/* ─── 2. Progress ─── */}
      {skillEntries.length > 0 && (
        <section className="cp-section">
          <div className="cp-section-head">
            <h2 className="cp-section-title"><TrendingUp size={14} /> Postępy</h2>
            <button className="cp-section-link" onClick={() => navigate(`/parent/child/${id}/timeline`)}>
              Szczegóły <ChevronRight size={14} />
            </button>
          </div>

          {/* Average bar */}
          <div className="cp-progress-avg">
            <div className="cp-progress-bar-track">
              <div
                className="cp-progress-bar-fill"
                style={{ width: `${avgSkill}%` }}
              />
            </div>
            <span className="cp-progress-val">{avgSkill}<span className="cp-progress-max">/100</span></span>
          </div>

          {/* Individual skills — compact */}
          <div className="cp-skills-grid">
            {skillEntries.map((s, i) => (
              <div key={s.key} className="cp-skill-item" style={{ '--i': i }}>
                <span className="cp-skill-name">{s.label}</span>
                <div className="cp-skill-bar-track">
                  <div className="cp-skill-bar-fill" style={{ width: `${s.score}%` }} />
                </div>
                <span className="cp-skill-score">{s.score}</span>
              </div>
            ))}
          </div>
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

      {/* ─── Quick links ─── */}
      <div className="cp-quick-links">
        <button className="cp-quick-link" onClick={() => navigate(`/parent/child/${id}/timeline`)}>
          <Clock size={14} /> Historia
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
