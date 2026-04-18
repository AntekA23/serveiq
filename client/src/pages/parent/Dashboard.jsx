import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight, Calendar, Target, Plus, Clock, Star,
} from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import Avatar from '../../components/ui/Avatar/Avatar'
import Button from '../../components/ui/Button/Button'
import './Dashboard.css'

const TYPE_LABELS = {
  kort: 'Kort', sparing: 'Sparing', kondycja: 'Kondycja',
  rozciaganie: 'Rozciąganie', mecz: 'Mecz', inne: 'Inne',
  class: 'Zajęcia', camp: 'Obóz', tournament: 'Turniej',
  training: 'Trening', match: 'Mecz', fitness: 'Kondycja',
}

function formatRelativeDate(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = d - now
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Dzisiaj'
  if (diffDays === 1) return 'Jutro'
  if (diffDays > 1 && diffDays <= 6) {
    return d.toLocaleDateString('pl-PL', { weekday: 'long' })
  }
  return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })
}

export default function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [nextActivities, setNextActivities] = useState([])
  const [latestReview, setLatestReview] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: playersRaw } = await api.get('/players')
        const players = Array.isArray(playersRaw) ? playersRaw : playersRaw.players || []
        const childIds = user?.parentProfile?.children || []
        const myChildren = childIds.length > 0
          ? players.filter((p) => childIds.includes(p._id))
          : players
        setChildren(myChildren)
        if (myChildren.length > 0) setSelectedChild(myChildren[0])
      } catch { /* silent */ }
      setLoading(false)
    }
    fetchData()
  }, [user])

  // Fetch activities & reviews when child changes
  useEffect(() => {
    if (!selectedChild) return
    const fetchChildData = async () => {
      try {
        const [activitiesRes, reviewsRes] = await Promise.all([
          api.get('/activities?status=planned&limit=3').catch(() => ({ data: { activities: [] } })),
          api.get(`/reviews?player=${selectedChild._id}&status=published&limit=1`).catch(() => ({ data: { reviews: [] } })),
        ])

        const acts = (activitiesRes.data.activities || [])
          .filter((a) => new Date(a.date) >= new Date())
          .slice(0, 3)
        setNextActivities(acts)

        const revs = reviewsRes.data.reviews || []
        setLatestReview(revs.length > 0 ? revs[0] : null)
      } catch { /* silent */ }
    }
    fetchChildData()
  }, [selectedChild])

  if (loading) {
    return (
      <div className="pd-page">
        <div className="pd-loading"><div className="pd-spinner" /></div>
      </div>
    )
  }

  if (children.length === 0) {
    return (
      <div className="pd-page">
        <div className="pd-empty">
          <div className="pd-empty-icon">🎾</div>
          <h2>Witaj w ServeIQ!</h2>
          <p>Dodaj swoje pierwsze dziecko, aby rozpocząć.</p>
          <Button variant="primary" onClick={() => navigate('/my-children')}>
            <Plus size={16} /> Dodaj dziecko
          </Button>
        </div>
      </div>
    )
  }

  const childAge = selectedChild?.dateOfBirth
    ? Math.floor((Date.now() - new Date(selectedChild.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  const skills = selectedChild?.skills || {}
  const skillScores = Object.values(skills).map((s) => s?.score || 0).filter((s) => s > 0)
  const avgSkill = skillScores.length > 0
    ? Math.round(skillScores.reduce((a, b) => a + b, 0) / skillScores.length)
    : null

  const schedule = selectedChild?.trainingPlan?.weeklySchedule || []
  const dayNames = ['', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sb', 'Nd']

  // Group schedule by day, show only days with sessions
  const weekDays = {}
  schedule.forEach((s) => {
    if (!weekDays[s.day]) weekDays[s.day] = []
    weekDays[s.day].push(s)
  })

  return (
    <div className="pd-page">
      {/* ─── Child selector ─── */}
      {children.length > 1 && (
        <div className="pd-child-tabs">
          {children.map((child) => (
            <button
              key={child._id}
              className={`pd-child-tab ${selectedChild?._id === child._id ? 'active' : ''}`}
              onClick={() => setSelectedChild(child)}
            >
              <Avatar firstName={child.firstName} lastName={child.lastName} size={24} role="player" />
              {child.firstName}
            </button>
          ))}
          {children.length < 2 && (
            <button className="pd-child-tab pd-child-add" onClick={() => navigate('/my-children')}>
              <Plus size={14} />
            </button>
          )}
        </div>
      )}

      {/* ─── Hero: child identity ─── */}
      <div className="pd-hero" onClick={() => navigate(`/parent/child/${selectedChild._id}`)}>
        <Avatar
          firstName={selectedChild.firstName}
          lastName={selectedChild.lastName}
          size={56}
          role="player"
          src={selectedChild.avatarUrl}
        />
        <div className="pd-hero-info">
          <h1 className="pd-hero-name">{selectedChild.firstName} {selectedChild.lastName}</h1>
          <div className="pd-hero-meta">
            {childAge && <span>{childAge} lat</span>}
            {selectedChild.pathwayStage && <span>{selectedChild.pathwayStage}</span>}
            {selectedChild.ranking?.pzt && <span>PZT #{selectedChild.ranking.pzt}</span>}
          </div>
        </div>
        {avgSkill !== null && (
          <div className="pd-hero-score">
            <span className="pd-hero-score-val">{avgSkill}</span>
            <span className="pd-hero-score-label">średnia</span>
          </div>
        )}
        <ChevronRight size={16} className="pd-hero-arrow" />
      </div>

      {/* ─── This week ─── */}
      {schedule.length > 0 && (
        <section className="pd-section">
          <div className="pd-section-head">
            <h2 className="pd-section-title">Ten tydzień</h2>
            <span className="pd-week-summary">{schedule.length} treningów · {Math.round(schedule.reduce((s, i) => s + (i.durationMinutes || 0), 0) / 60 * 10) / 10}h</span>
          </div>
          <div className="pd-week-grid">
            {Object.entries(weekDays).sort(([a], [b]) => a - b).map(([day, items]) => (
              <div key={day} className="pd-week-day">
                <span className="pd-week-day-name">{dayNames[day]}</span>
                <div className="pd-week-day-items">
                  {items.map((item, i) => (
                    <span key={i} className="pd-week-type">
                      {TYPE_LABELS[item.sessionType] || item.sessionType}
                      <span className="pd-week-dur">{item.durationMinutes}′</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Upcoming ─── */}
      {nextActivities.length > 0 && (
        <section className="pd-section">
          <div className="pd-section-head">
            <h2 className="pd-section-title">Nadchodzące</h2>
            <button className="pd-section-link" onClick={() => navigate('/calendar')}>
              Kalendarz <ChevronRight size={14} />
            </button>
          </div>
          <div className="pd-upcoming">
            {nextActivities.map((a, i) => (
              <div key={a._id} className="pd-upcoming-item" style={{ '--i': i }}>
                <div className="pd-upcoming-date">
                  <span className="pd-upcoming-day">{formatRelativeDate(a.date)}</span>
                  {a.startTime && <span className="pd-upcoming-time">{a.startTime.slice(0, 5)}</span>}
                </div>
                <div className="pd-upcoming-info">
                  <span className="pd-upcoming-title">{a.title || TYPE_LABELS[a.type] || 'Aktywność'}</span>
                  {a.location && <span className="pd-upcoming-loc">{a.location}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Latest review ─── */}
      {latestReview && (
        <section className="pd-section">
          <div className="pd-section-head">
            <h2 className="pd-section-title">Ostatnia ocena</h2>
            <button className="pd-section-link" onClick={() => navigate('/reviews')}>
              Wszystkie <ChevronRight size={14} />
            </button>
          </div>
          <div className="pd-review-card" onClick={() => navigate('/reviews')}>
            {latestReview.rating && (
              <div className="pd-review-stars">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={14} fill={s <= latestReview.rating ? 'var(--color-amber)' : 'none'} color={s <= latestReview.rating ? 'var(--color-amber)' : 'var(--color-text-tertiary)'} />
                ))}
              </div>
            )}
            <p className="pd-review-excerpt">
              {latestReview.whatHappened || latestReview.title || 'Ocena trenera'}
            </p>
            <span className="pd-review-meta">
              {new Date(latestReview.createdAt || latestReview.periodStart).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}
            </span>
          </div>
        </section>
      )}

      {/* ─── Quick actions (subtle) ─── */}
      {children.length <= 1 && (
        <div className="pd-quick-actions">
          <button className="pd-quick-btn" onClick={() => navigate('/my-children')}>
            <Plus size={14} /> Dodaj dziecko
          </button>
          <button className="pd-quick-btn" onClick={() => navigate('/parent/add-coach')}>
            <Plus size={14} /> Dodaj trenera
          </button>
        </div>
      )}
    </div>
  )
}
