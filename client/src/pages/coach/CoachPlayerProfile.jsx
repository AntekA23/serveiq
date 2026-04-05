import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Target, Plus, Save, ChevronDown, ChevronUp, Calendar, Star, MessageSquare, FileText, Sparkles, Loader, ClipboardList, Trash2, Clock, Heart
} from 'lucide-react'
import api from '../../api/axios'
import Avatar from '../../components/ui/Avatar/Avatar'
import Button from '../../components/ui/Button/Button'
import useToast from '../../hooks/useToast'
import './Coach.css'

const DAY_NAMES = ['Pon', 'Wt', 'Sr', 'Czw', 'Pt', 'Sb', 'Nd']
const TYPE_OPTIONS = [
  { value: 'kort', label: 'Kort' }, { value: 'sparing', label: 'Sparing' },
  { value: 'kondycja', label: 'Kondycja' }, { value: 'rozciaganie', label: 'Rozciaganie' },
  { value: 'mecz', label: 'Mecz' }, { value: 'inne', label: 'Inne' },
]

function CoachPlanTab({ playerId, player, toast }) {
  const plan = player?.trainingPlan || {}
  const [schedule, setSchedule] = useState(plan.weeklySchedule || [])
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const addItem = (day) => {
    setSchedule((prev) => [...prev, { day, sessionType: 'kort', durationMinutes: 90, startTime: '16:00', notes: '' }])
    setDirty(true)
  }

  const updateItem = (idx, field, value) => {
    setSchedule((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: field === 'durationMinutes' ? Number(value) : value } : item))
    setDirty(true)
  }

  const removeItem = (idx) => {
    setSchedule((prev) => prev.filter((_, i) => i !== idx))
    setDirty(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`/players/${playerId}/training-plan`, { weeklySchedule: schedule })
      toast.success('Plan treningowy zapisany')
      setDirty(false)
    } catch {
      toast.error('Nie udalo sie zapisac planu')
    }
    setSaving(false)
  }

  const totalSessions = schedule.length
  const totalHours = Math.round(schedule.reduce((s, i) => s + (i.durationMinutes || 0), 0) / 60 * 10) / 10
  const activeDays = [...new Set(schedule.map((s) => s.day))].length

  return (
    <div className="coach-plan-tab">
      {/* Summary */}
      <div className="coach-plan-summary">
        <div className="coach-plan-stat"><span className="coach-plan-stat-val">{totalSessions}</span> sesji/tyg</div>
        <div className="coach-plan-stat"><span className="coach-plan-stat-val">{totalHours}</span> h/tyg</div>
        <div className="coach-plan-stat"><span className="coach-plan-stat-val">{activeDays}</span> dni/tyg</div>
        {dirty && (
          <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
            <Save size={14} /> Zapisz
          </Button>
        )}
      </div>

      {/* Schedule by day */}
      <div className="coach-plan-days">
        {[1, 2, 3, 4, 5, 6, 7].map((day) => {
          const dayItems = schedule.map((item, idx) => ({ ...item, _idx: idx })).filter((i) => i.day === day)
          return (
            <div key={day} className={`coach-plan-day ${dayItems.length > 0 ? 'active' : ''}`}>
              <div className="coach-plan-day-header">
                <span className="coach-plan-day-name">{DAY_NAMES[day - 1]}</span>
                <button className="coach-plan-add-btn" onClick={() => addItem(day)} title="Dodaj sesje">
                  <Plus size={12} />
                </button>
              </div>
              {dayItems.map((item) => (
                <div key={item._idx} className="coach-plan-item">
                  <select value={item.sessionType} onChange={(e) => updateItem(item._idx, 'sessionType', e.target.value)} className="coach-plan-select">
                    {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <input type="time" value={item.startTime || '16:00'} onChange={(e) => updateItem(item._idx, 'startTime', e.target.value)} className="coach-plan-time" />
                  <select value={item.durationMinutes} onChange={(e) => updateItem(item._idx, 'durationMinutes', e.target.value)} className="coach-plan-dur">
                    {[30, 45, 60, 75, 90, 120].map((d) => <option key={d} value={d}>{d}min</option>)}
                  </select>
                  <button className="coach-plan-remove" onClick={() => removeItem(item._idx)}><Trash2 size={12} /></button>
                </div>
              ))}
              {dayItems.length === 0 && <div className="coach-plan-empty-day">—</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const PATHWAY_STAGES = [
  { value: 'beginner', label: 'Początkujący' },
  { value: 'tennis10_red', label: 'Czerwony kort' },
  { value: 'tennis10_orange', label: 'Pomarańczowy kort' },
  { value: 'tennis10_green', label: 'Zielony kort' },
  { value: 'committed', label: 'Zawodnik' },
  { value: 'advanced', label: 'Zaawansowany' },
  { value: 'performance', label: 'Performance' },
]

const PATHWAY_LABEL_MAP = Object.fromEntries(PATHWAY_STAGES.map((s) => [s.value, s.label]))

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
  const toast = useToast()
  const [player, setPlayer] = useState(null)
  const [sessions, setSessions] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('skills')
  const [aiRecs, setAiRecs] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [health, setHealth] = useState(null)
  const [healthHistory, setHealthHistory] = useState([])
  const [pathwayStage, setPathwayStage] = useState('')
  const [nextStepText, setNextStepText] = useState('')
  const [pathwaySaving, setPathwaySaving] = useState(false)
  const [nextStepSaving, setNextStepSaving] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const [playerRes, sessionsRes, reviewsRes, healthRes, historyRes] = await Promise.all([
          api.get(`/players/${id}`),
          api.get(`/sessions?player=${id}`),
          api.get(`/reviews?player=${id}`),
          api.get(`/wearables/data/${id}/latest`).catch(() => ({ data: {} })),
          api.get(`/wearables/data/${id}?type=daily_summary`).catch(() => ({ data: { data: [] } })),
        ])
        const p = playerRes.data.player || playerRes.data
        setPlayer(p)
        setPathwayStage(p.pathwayStage || '')
        setNextStepText(p.nextStep?.text || '')
        setSessions((sessionsRes.data.sessions || sessionsRes.data || []).sort((a, b) => new Date(b.date) - new Date(a.date)))
        setReviews((reviewsRes.data.reviews || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
        const latest = healthRes.data?.latest || {}
        const recovery = latest.recovery?.metrics?.recovery || {}
        const sleep = latest.sleep?.metrics?.sleep || {}
        const hrData = latest.daily_summary?.metrics?.heartRate || {}
        const hrvData = latest.daily_summary?.metrics?.hrv || {}
        if (recovery.score != null || sleep.quality != null) {
          setHealth({ recovery, sleep, hr: hrData, hrv: hrvData })
        }
        const histData = historyRes.data?.data || []
        setHealthHistory(Array.isArray(histData) ? histData.slice(0, 14).reverse() : [])
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

  const handleAiRecommendations = async () => {
    setAiLoading(true)
    try {
      const { data } = await api.post(`/ai/recommendations/${id}`)
      setAiRecs(data.result)
    } catch (err) {
      const msg = err.response?.data?.message || 'Nie udalo sie wygenerowac rekomendacji'
      toast.error(msg)
    }
    setAiLoading(false)
  }

  const handlePathwayChange = async (newStage) => {
    setPathwayStage(newStage)
    setPathwaySaving(true)
    try {
      const { data } = await api.put(`/players/${id}`, { pathwayStage: newStage })
      setPlayer(data.player || data)
      toast.success('Etap sciezki zapisany')
    } catch {
      toast.error('Nie udalo sie zapisac etapu')
      setPathwayStage(player?.pathwayStage || '')
    }
    setPathwaySaving(false)
  }

  const handleNextStepSave = async () => {
    setNextStepSaving(true)
    try {
      const { data } = await api.put(`/players/${id}`, { nextStep: nextStepText })
      setPlayer(data.player || data)
      toast.success('Nastepny krok zapisany')
    } catch {
      toast.error('Nie udalo sie zapisac nastepnego kroku')
    }
    setNextStepSaving(false)
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
          {health && (
            <div className="coach-health-badges">
              {health.recovery?.score != null && (
                <span className={`coach-health-badge ${health.recovery.status === 'green' ? 'good' : health.recovery.status === 'yellow' ? 'warn' : 'bad'}`}>
                  Regeneracja: {health.recovery.score}%
                </span>
              )}
              {health.sleep?.quality != null && (
                <span className="coach-health-badge neutral">
                  Sen: {health.sleep.quality}%
                </span>
              )}
              {health.hrv?.value != null && (
                <span className="coach-health-badge neutral">
                  HRV: {health.hrv.value}ms
                </span>
              )}
              {health.hr?.resting != null && (
                <span className="coach-health-badge neutral">
                  HR: {health.hr.resting}bpm
                </span>
              )}
            </div>
          )}
        </div>
        <div className="coach-profile-actions">
          <Button variant="primary" size="sm" onClick={() => navigate(`/coach/sessions/new?player=${id}`)}>
            <Plus size={14} /> Sesja
          </Button>
          <Button size="sm" onClick={() => navigate(`/coach/reviews/new?player=${id}`)}>
            <FileText size={14} /> Ocena
          </Button>
          <Button size="sm" onClick={handleAiRecommendations} loading={aiLoading}>
            <Sparkles size={14} /> AI
          </Button>
          <Button variant="ghost" size="sm" onClick={() => {
            const parentId = player.parents?.[0]?._id || player.parents?.[0]
            if (parentId) navigate(`/coach/messages/${parentId}`)
          }}>
            <MessageSquare size={14} /> Rodzic
          </Button>
        </div>
      </div>

      {/* Pathway & Next Step */}
      <div style={{
        background: 'var(--color-surface)', borderRadius: 12, padding: '16px 20px',
        marginBottom: 16, border: '1px solid var(--color-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Target size={16} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontWeight: 600, fontSize: 15 }}>Sciezka rozwoju</span>
          {pathwayStage && (
            <span style={{
              background: 'var(--color-primary-light, rgba(59,130,246,0.1))',
              color: 'var(--color-primary)',
              padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            }}>
              {PATHWAY_LABEL_MAP[pathwayStage] || pathwayStage}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {/* Pathway Stage */}
          <div style={{ flex: '0 0 auto' }}>
            <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
              Etap sciezki
            </label>
            <select
              value={pathwayStage}
              onChange={(e) => handlePathwayChange(e.target.value)}
              disabled={pathwaySaving}
              style={{
                padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)',
                background: 'var(--color-background)', color: 'var(--color-text)',
                fontSize: 14, cursor: 'pointer', minWidth: 180,
              }}
            >
              <option value="">— Wybierz etap —</option>
              {PATHWAY_STAGES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Next Step */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
              Nastepny krok
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <textarea
                value={nextStepText}
                onChange={(e) => setNextStepText(e.target.value)}
                placeholder="Wpisz nastepny krok dla zawodnika..."
                rows={2}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)',
                  background: 'var(--color-background)', color: 'var(--color-text)',
                  fontSize: 14, resize: 'vertical', fontFamily: 'inherit',
                }}
              />
              <Button variant="primary" size="sm" onClick={handleNextStepSave} loading={nextStepSaving} style={{ alignSelf: 'flex-end' }}>
                <Save size={14} /> Zapisz
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      {aiRecs && (
        <div className="coach-ai-section">
          <div className="coach-ai-header">
            <Sparkles size={14} />
            <span>Rekomendacje AI</span>
            <button className="coach-ai-close" onClick={() => setAiRecs(null)}>×</button>
          </div>
          {aiRecs.weekSummary && (
            <div className="coach-ai-summary">{aiRecs.weekSummary}</div>
          )}
          <div className="coach-ai-recs">
            {(aiRecs.recommendations || []).map((rec, i) => (
              <div key={i} className={`coach-ai-rec coach-ai-rec-${rec.priority || 'medium'}`}>
                <div className="coach-ai-rec-title">{rec.title}</div>
                <div className="coach-ai-rec-desc">{rec.description}</div>
                <div className="coach-ai-rec-meta">
                  <span className={`coach-ai-priority ${rec.priority}`}>{rec.priority === 'high' ? 'Wysoki' : rec.priority === 'low' ? 'Niski' : 'Sredni'}</span>
                  <span className="coach-ai-category">{rec.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
        <button className={`coach-tab ${tab === 'plan' ? 'active' : ''}`} onClick={() => setTab('plan')}>
          <ClipboardList size={14} /> Plan
        </button>
        <button className={`coach-tab ${tab === 'health' ? 'active' : ''}`} onClick={() => setTab('health')}>
          <Heart size={14} /> Zdrowie
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

      {/* Health tab */}
      {tab === 'health' && (
        <div className="coach-health-tab">
          {healthHistory.length === 0 ? (
            <div className="coach-empty">Brak danych zdrowotnych — wymagane polaczenie urzadzenia</div>
          ) : (
            <>
              <div className="coach-health-charts">
                {[
                  { key: 'recovery', label: 'Regeneracja', unit: '%', color: 'var(--color-green)', extract: (d) => d.metrics?.recovery?.score },
                  { key: 'hrv', label: 'HRV', unit: 'ms', color: 'var(--color-hrv)', extract: (d) => d.metrics?.hrv?.value },
                  { key: 'hr', label: 'Tetno spocz.', unit: 'bpm', color: 'var(--color-heart)', extract: (d) => d.metrics?.heartRate?.resting },
                  { key: 'sleep', label: 'Sen', unit: '%', color: 'var(--color-sleep)', extract: (d) => d.metrics?.sleep?.quality },
                ].map(({ key, label, unit, color, extract }) => {
                  const values = healthHistory.map(extract).filter((v) => v != null)
                  if (values.length === 0) return null
                  const latest = values[values.length - 1]
                  const min = Math.min(...values)
                  const max = Math.max(...values)
                  const range = max - min || 1
                  const w = 200, h = 50
                  const points = values.map((v, i) => {
                    const x = (i / Math.max(values.length - 1, 1)) * w
                    const y = h - 4 - ((v - min) / range) * (h - 8)
                    return `${x},${y}`
                  }).join(' ')

                  return (
                    <div key={key} className="coach-health-chart-card">
                      <div className="coach-health-chart-head">
                        <span className="coach-health-chart-label">{label}</span>
                        <span className="coach-health-chart-value" style={{ color }}>{latest}{unit}</span>
                      </div>
                      <svg viewBox={`0 0 ${w} ${h}`} className="coach-health-sparkline">
                        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="coach-health-chart-range">
                        <span>Min: {min}</span>
                        <span>{values.length}d</span>
                        <span>Max: {max}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Plan tab */}
      {tab === 'plan' && <CoachPlanTab playerId={id} player={player} toast={toast} />}

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
