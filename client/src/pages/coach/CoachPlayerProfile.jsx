import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Target, Plus, Save, ChevronDown, ChevronUp, Calendar, Star, MessageSquare, FileText
} from 'lucide-react'
import api from '../../api/axios'
import Avatar from '../../components/ui/Avatar/Avatar'
import Button from '../../components/ui/Button/Button'
import './Coach.css'

const SKILL_NAMES = {
  serve: 'Serwis',
  forehand: 'Forhend',
  backhand: 'Bekhend',
  volley: 'Wolej',
  tactics: 'Taktyka',
  fitness: 'Kondycja',
}

const SESSION_TYPE_LABELS = {
  kort: 'Kort', sparing: 'Sparing', kondycja: 'Kondycja',
  rozciaganie: 'Rozciaganie', mecz: 'Mecz', inne: 'Inne',
}

function SkillBar({ name, label, score, notes, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(score)
  const [noteVal, setNoteVal] = useState(notes || '')

  const handleSave = () => {
    onUpdate(name, val, noteVal)
    setEditing(false)
  }

  return (
    <div className="coach-skill-row">
      <div className="coach-skill-header" onClick={() => setEditing(!editing)}>
        <span className="coach-skill-name">{label}</span>
        <div className="coach-skill-bar-wrap">
          <div className="coach-skill-bar">
            <div className="coach-skill-fill" style={{ width: `${score}%` }} />
          </div>
          <span className="coach-skill-score">{score}</span>
        </div>
        {editing ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </div>
      {editing && (
        <div className="coach-skill-edit">
          <div className="coach-skill-edit-row">
            <label>Wynik:</label>
            <input type="range" min={0} max={100} value={val} onChange={(e) => setVal(Number(e.target.value))} />
            <span className="coach-skill-edit-val">{val}</span>
          </div>
          <input
            className="coach-skill-note"
            placeholder="Notatka do umiejetnosci..."
            value={noteVal}
            onChange={(e) => setNoteVal(e.target.value)}
          />
          <Button variant="primary" size="sm" onClick={handleSave}><Save size={12} /> Zapisz</Button>
        </div>
      )}
    </div>
  )
}

export default function CoachPlayerProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [player, setPlayer] = useState(null)
  const [sessions, setSessions] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('skills')

  useEffect(() => {
    const fetch = async () => {
      try {
        const [playerRes, sessionsRes, reviewsRes] = await Promise.all([
          api.get(`/players/${id}`),
          api.get(`/sessions?player=${id}`),
          api.get(`/reviews?player=${id}`),
        ])
        setPlayer(playerRes.data.player || playerRes.data)
        setSessions((sessionsRes.data.sessions || sessionsRes.data || []).sort((a, b) => new Date(b.date) - new Date(a.date)))
        setReviews((reviewsRes.data.reviews || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
      } catch { /* silent */ }
      setLoading(false)
    }
    fetch()
  }, [id])

  const handleSkillUpdate = async (skillName, score, notes) => {
    try {
      const { data } = await api.put(`/players/${id}`, {
        skills: { [skillName]: { score, notes } },
      })
      setPlayer(data.player || data)
    } catch { /* silent */ }
  }

  const handleAddGoal = async () => {
    const text = prompt('Tekst nowego celu:')
    if (!text?.trim()) return
    try {
      await api.post(`/players/${id}/goals`, { text })
      const { data } = await api.get(`/players/${id}`)
      setPlayer(data.player || data)
    } catch { /* silent */ }
  }

  const handleToggleGoal = async (goalId, completed) => {
    try {
      await api.put(`/players/${id}/goals/${goalId}`, {
        completed: !completed,
        completedAt: !completed ? new Date().toISOString() : null,
      })
      const { data } = await api.get(`/players/${id}`)
      setPlayer(data.player || data)
    } catch { /* silent */ }
  }

  if (loading) {
    return <div className="coach-page"><div className="coach-loading">Ladowanie...</div></div>
  }

  if (!player) {
    return <div className="coach-page"><div className="coach-empty">Zawodnik nie znaleziony</div></div>
  }

  const age = player.dateOfBirth ? new Date().getFullYear() - new Date(player.dateOfBirth).getFullYear() : null
  const skills = player.skills || {}
  const goals = player.goals || []

  return (
    <div className="coach-page">
      <button className="coach-back" onClick={() => navigate('/coach/players')}>
        <ArrowLeft size={16} /> Zawodnicy
      </button>

      {/* Player header */}
      <div className="coach-profile-header">
        <Avatar firstName={player.firstName} lastName={player.lastName} size={64} role="player" src={player.avatarUrl} />
        <div className="coach-profile-info">
          <h1 className="coach-profile-name">{player.firstName} {player.lastName}</h1>
          <div className="coach-profile-meta">
            {age && <span>{age} lat</span>}
            {player.gender && <span>{player.gender === 'M' ? 'Chlopiec' : 'Dziewczyna'}</span>}
            {player.ranking?.pzt && <span>PZT #{player.ranking.pzt}</span>}
            {player.monthlyRate && <span>{player.monthlyRate} PLN/mies</span>}
          </div>
        </div>
        <div className="coach-profile-actions">
          <Button variant="primary" size="sm" onClick={() => navigate(`/coach/sessions/new?player=${id}`)}>
            <Plus size={14} /> Sesja
          </Button>
          <Button size="sm" onClick={() => navigate(`/coach/reviews/new?player=${id}`)}>
            <FileText size={14} /> Ocena
          </Button>
          <Button variant="ghost" size="sm" onClick={() => {
            const parentId = player.parents?.[0]?._id || player.parents?.[0]
            if (parentId) navigate(`/coach/messages/${parentId}`)
          }}>
            <MessageSquare size={14} /> Napisz do rodzica
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="coach-tabs">
        <button className={`coach-tab ${tab === 'skills' ? 'active' : ''}`} onClick={() => setTab('skills')}>
          <Target size={14} /> Umiejetnosci
        </button>
        <button className={`coach-tab ${tab === 'sessions' ? 'active' : ''}`} onClick={() => setTab('sessions')}>
          <Calendar size={14} /> Sesje ({sessions.length})
        </button>
        <button className={`coach-tab ${tab === 'goals' ? 'active' : ''}`} onClick={() => setTab('goals')}>
          <Star size={14} /> Cele ({goals.length})
        </button>
        <button className={`coach-tab ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}>
          <FileText size={14} /> Oceny ({reviews.length})
        </button>
      </div>

      {/* Skills tab */}
      {tab === 'skills' && (
        <div className="coach-skills-section">
          {Object.entries(SKILL_NAMES).map(([key, label]) => (
            <SkillBar
              key={key}
              name={key}
              label={label}
              score={skills[key]?.score || 0}
              notes={skills[key]?.notes || ''}
              onUpdate={handleSkillUpdate}
            />
          ))}
        </div>
      )}

      {/* Sessions tab */}
      {tab === 'sessions' && (
        <div className="coach-sessions-list">
          {sessions.length === 0 ? (
            <div className="coach-empty">Brak sesji treningowych</div>
          ) : (
            sessions.slice(0, 20).map((s) => {
              const d = new Date(s.date)
              return (
                <div key={s._id} className="coach-session-detail coach-session-detail-clickable" onClick={() => navigate(`/coach/sessions/${s._id}/edit`)}>
                  <div className="coach-session-date">
                    {d.getDate()}.{String(d.getMonth() + 1).padStart(2, '0')}.{d.getFullYear()}
                  </div>
                  <div className="coach-session-detail-body">
                    <div className="coach-session-detail-top">
                      <span className="coach-session-type-label">{SESSION_TYPE_LABELS[s.sessionType] || 'Trening'}</span>
                      {s.startTime && <span>{s.startTime}</span>}
                      <span>{s.durationMinutes}min</span>
                      {s.source === 'parent' && <span className="coach-session-badge">rodzic</span>}
                    </div>
                    {s.title && <div className="coach-session-title">{s.title}</div>}
                    {s.notes && <div className="coach-session-notes">{s.notes}</div>}
                    {s.focusAreas?.length > 0 && (
                      <div className="coach-session-focus">
                        {s.focusAreas.map((f) => <span key={f} className="coach-focus-tag">{f}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Goals tab */}
      {tab === 'goals' && (
        <div className="coach-goals-section">
          <Button variant="ghost" size="sm" onClick={handleAddGoal} style={{ marginBottom: 12 }}>
            <Plus size={14} /> Dodaj cel
          </Button>
          {goals.length === 0 ? (
            <div className="coach-empty">Brak celow</div>
          ) : (
            goals.map((g) => (
              <div key={g._id} className={`coach-goal ${g.completed ? 'completed' : ''}`} onClick={() => handleToggleGoal(g._id, g.completed)} style={{ cursor: 'pointer' }}>
                <span className="coach-goal-text">{g.text}</span>
                {g.dueDate && (
                  <span className="coach-goal-date">
                    do {new Date(g.dueDate).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}
                  </span>
                )}
                {g.completed && <span className="coach-goal-done">Ukonczony</span>}
              </div>
            ))
          )}
        </div>
      )}

      {/* Reviews tab */}
      {tab === 'reviews' && (
        <div className="coach-reviews-tab">
          <Button size="sm" onClick={() => navigate(`/coach/reviews/new?player=${id}`)} style={{ marginBottom: 12 }}>
            <Plus size={14} /> Nowa ocena
          </Button>
          {reviews.length === 0 ? (
            <div className="coach-empty">Brak ocen dla tego zawodnika</div>
          ) : (
            reviews.map((r) => (
              <div key={r._id} className="coach-review-card" onClick={() => navigate(`/coach/reviews/${r._id}/edit`)}>
                <div className="coach-review-card-top">
                  <span className={`coach-review-status ${r.status}`}>
                    {r.status === 'draft' ? 'Szkic' : 'Opublikowana'}
                  </span>
                  {r.overallRating && (
                    <div className="coach-review-rating">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={10} fill={s <= r.overallRating ? 'var(--color-amber)' : 'none'} stroke={s <= r.overallRating ? 'var(--color-amber)' : 'var(--color-text-tertiary)'} />
                      ))}
                    </div>
                  )}
                </div>
                <div className="coach-review-title">{r.title}</div>
                <div className="coach-review-period">
                  {new Date(r.periodStart).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
                  {' — '}
                  {new Date(r.periodEnd).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
