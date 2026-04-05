import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Target, Plus, Save, ChevronDown, ChevronUp, Calendar, Star, MessageSquare, FileText, Sparkles, Loader, ClipboardList, Trash2, Clock, Heart, Eye, EyeOff, Pin, X, Edit3, Check, Pause, XCircle, Tag
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

const OBS_TYPES = [
  { value: 'progress', label: 'Postep', color: '#22c55e' },
  { value: 'concern', label: 'Uwaga', color: '#ef4444' },
  { value: 'highlight', label: 'Wyroznienie', color: '#eab308' },
  { value: 'participation', label: 'Uczestnictwo', color: '#3b82f6' },
  { value: 'general', label: 'Ogolna', color: '#6b7280' },
]

const GOAL_CATEGORIES = [
  { value: 'fundamentals', label: 'Podstawy', color: '#22c55e' },
  { value: 'movement', label: 'Ruch', color: '#3b82f6' },
  { value: 'consistency', label: 'Regularnosc', color: '#eab308' },
  { value: 'confidence', label: 'Pewnosc', color: '#8b5cf6' },
  { value: 'match-routines', label: 'Rutyny meczowe', color: '#ef4444' },
  { value: 'recovery', label: 'Regeneracja', color: '#06b6d4' },
  { value: 'school-balance', label: 'Szkola/Balans', color: '#f97316' },
  { value: 'fitness', label: 'Kondycja', color: '#ec4899' },
  { value: 'tactics', label: 'Taktyka', color: '#6366f1' },
  { value: 'serve', label: 'Serwis', color: '#14b8a6' },
  { value: 'other', label: 'Inne', color: '#6b7280' },
]

const GOAL_CATEGORY_MAP = Object.fromEntries(GOAL_CATEGORIES.map((c) => [c.value, c]))

const TIMEFRAME_OPTIONS = [
  { value: 'weekly', label: 'Tygodniowy' },
  { value: 'monthly', label: 'Miesieczny' },
  { value: 'quarterly', label: 'Kwartalny' },
  { value: 'seasonal', label: 'Sezonowy' },
  { value: 'yearly', label: 'Roczny' },
]

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
  const [obsText, setObsText] = useState('')
  const [obsType, setObsType] = useState('general')
  const [obsEngagement, setObsEngagement] = useState(0)
  const [obsEffort, setObsEffort] = useState(0)
  const [obsMood, setObsMood] = useState(0)
  const [obsVisible, setObsVisible] = useState(true)
  const [obsSaving, setObsSaving] = useState(false)

  // Goals state (new API-based)
  const [devGoals, setDevGoals] = useState([])
  const [goalFilter, setGoalFilter] = useState('active') // active / completed / all
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [goalForm, setGoalForm] = useState({ title: '', description: '', category: 'fundamentals', timeframe: 'monthly', targetDate: '', visibleToParent: true })
  const [goalSaving, setGoalSaving] = useState(false)
  const [expandedGoal, setExpandedGoal] = useState(null)
  const [editingGoal, setEditingGoal] = useState(null)

  // Observations state
  const [observations, setObservations] = useState([])
  const [obsGoalRef, setObsGoalRef] = useState('')
  const [obsActivityRef, setObsActivityRef] = useState('')
  const [recentActivities, setRecentActivities] = useState([])
  const [editingObs, setEditingObs] = useState(null)
  const [editObsText, setEditObsText] = useState('')
  const [editObsType, setEditObsType] = useState('general')

  // Focus areas state
  const [focusTags, setFocusTags] = useState([])
  const [focusInput, setFocusInput] = useState('')
  const [focusSaving, setFocusSaving] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [playerRes, sessionsRes, reviewsRes, healthRes, historyRes, goalsRes, obsRes, activitiesRes] = await Promise.all([
          api.get(`/players/${id}`),
          api.get(`/sessions?player=${id}`),
          api.get(`/reviews?player=${id}`),
          api.get(`/wearables/data/${id}/latest`).catch(() => ({ data: {} })),
          api.get(`/wearables/data/${id}?type=daily_summary`).catch(() => ({ data: { data: [] } })),
          api.get(`/goals?player=${id}`).catch(() => ({ data: { goals: [] } })),
          api.get(`/observations?player=${id}`).catch(() => ({ data: { observations: [] } })),
          api.get(`/activities?player=${id}`).catch(() => ({ data: { activities: [] } })),
        ])
        const p = playerRes.data.player || playerRes.data
        setPlayer(p)
        setPathwayStage(p.pathwayStage || '')
        setNextStepText(p.nextStep?.text || '')
        setFocusTags(p.trainingPlan?.focus || [])
        setSessions((sessionsRes.data.sessions || sessionsRes.data || []).sort((a, b) => new Date(b.date) - new Date(a.date)))
        setReviews((reviewsRes.data.reviews || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
        setDevGoals(goalsRes.data.goals || [])
        setObservations(obsRes.data.observations || [])
        setRecentActivities((activitiesRes.data.activities || []).slice(0, 10))
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
    fetchData()
  }, [id])

  const handleSkillUpdate = async (skillName, score, notes) => {
    try {
      const { data } = await api.put(`/players/${id}`, {
        skills: { [skillName]: { score, notes } },
      })
      setPlayer(data.player || data)
    } catch { /* silent */ }
  }

  const handleCreateGoal = async () => {
    if (!goalForm.title.trim()) return
    setGoalSaving(true)
    try {
      const body = {
        player: id,
        title: goalForm.title.trim(),
        description: goalForm.description.trim() || undefined,
        category: goalForm.category,
        timeframe: goalForm.timeframe,
        targetDate: goalForm.targetDate || undefined,
        visibleToParent: goalForm.visibleToParent,
      }
      const { data } = await api.post('/goals', body)
      setDevGoals((prev) => [data.goal, ...prev])
      setGoalForm({ title: '', description: '', category: 'fundamentals', timeframe: 'monthly', targetDate: '', visibleToParent: true })
      setShowGoalForm(false)
      toast.success('Cel utworzony')
    } catch {
      toast.error('Nie udalo sie utworzyc celu')
    }
    setGoalSaving(false)
  }

  const handleUpdateGoal = async (goalId, updates) => {
    try {
      const { data } = await api.put(`/goals/${goalId}`, updates)
      setDevGoals((prev) => prev.map((g) => g._id === goalId ? data.goal : g))
    } catch {
      toast.error('Nie udalo sie zaktualizowac celu')
    }
  }

  const handleDeleteGoal = async (goalId) => {
    if (!confirm('Usunac ten cel?')) return
    try {
      await api.delete(`/goals/${goalId}`)
      setDevGoals((prev) => prev.filter((g) => g._id !== goalId))
      toast.success('Cel usuniety')
    } catch {
      toast.error('Nie udalo sie usunac celu')
    }
  }

  const handleSaveEditGoal = async (goalId) => {
    if (!editingGoal) return
    try {
      const { data } = await api.put(`/goals/${goalId}`, editingGoal)
      setDevGoals((prev) => prev.map((g) => g._id === goalId ? data.goal : g))
      setEditingGoal(null)
      toast.success('Cel zaktualizowany')
    } catch {
      toast.error('Nie udalo sie zapisac zmian')
    }
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

  const handleObservationSubmit = async () => {
    if (!obsText.trim()) return
    setObsSaving(true)
    try {
      const body = {
        player: id,
        text: obsText.trim(),
        type: obsType,
        visibleToParent: obsVisible,
      }
      if (obsEngagement > 0) body.engagement = obsEngagement
      if (obsEffort > 0) body.effort = obsEffort
      if (obsMood > 0) body.mood = obsMood
      if (obsGoalRef) body.goalRef = obsGoalRef
      if (obsActivityRef) body.activity = obsActivityRef
      const { data } = await api.post('/observations', body)
      setObservations((prev) => [data.observation, ...prev])
      toast.success('Obserwacja dodana')
      setObsText('')
      setObsType('general')
      setObsEngagement(0)
      setObsEffort(0)
      setObsMood(0)
      setObsVisible(true)
      setObsGoalRef('')
      setObsActivityRef('')
    } catch {
      toast.error('Nie udalo sie dodac obserwacji')
    }
    setObsSaving(false)
  }

  // Observation management
  const handleDeleteObs = async (obsId) => {
    if (!confirm('Usunac te obserwacje?')) return
    try {
      await api.delete(`/observations/${obsId}`)
      setObservations((prev) => prev.filter((o) => o._id !== obsId))
      toast.success('Obserwacja usunieta')
    } catch {
      toast.error('Nie udalo sie usunac obserwacji')
    }
  }

  const handleUpdateObs = async (obsId) => {
    if (!editObsText.trim()) return
    try {
      const { data } = await api.put(`/observations/${obsId}`, { text: editObsText.trim(), type: editObsType })
      setObservations((prev) => prev.map((o) => o._id === obsId ? data.observation : o))
      setEditingObs(null)
      toast.success('Obserwacja zaktualizowana')
    } catch {
      toast.error('Nie udalo sie zapisac zmian')
    }
  }

  const handleTogglePin = async (obs) => {
    try {
      const { data } = await api.put(`/observations/${obs._id}`, { pinned: !obs.pinned })
      setObservations((prev) => prev.map((o) => o._id === obs._id ? data.observation : o))
    } catch { /* silent */ }
  }

  // Focus areas management
  const handleAddFocus = async () => {
    const tag = focusInput.trim()
    if (!tag || focusTags.length >= 5 || focusTags.includes(tag)) return
    const updated = [...focusTags, tag]
    setFocusTags(updated)
    setFocusInput('')
    setFocusSaving(true)
    try {
      await api.put(`/players/${id}/training-plan`, { focus: updated })
      toast.success('Obszar fokusu dodany')
    } catch {
      toast.error('Nie udalo sie zapisac')
      setFocusTags(focusTags)
    }
    setFocusSaving(false)
  }

  const handleRemoveFocus = async (tag) => {
    const updated = focusTags.filter((t) => t !== tag)
    setFocusTags(updated)
    setFocusSaving(true)
    try {
      await api.put(`/players/${id}/training-plan`, { focus: updated })
    } catch {
      toast.error('Nie udalo sie zapisac')
      setFocusTags(focusTags)
    }
    setFocusSaving(false)
  }

  if (loading) {
    return <div className="coach-page"><div className="coach-loading">Ladowanie...</div></div>
  }

  if (!player) {
    return <div className="coach-page"><div className="coach-empty">Zawodnik nie znaleziony</div></div>
  }

  const age = player.dateOfBirth ? new Date().getFullYear() - new Date(player.dateOfBirth).getFullYear() : null
  const skills = player.skills || {}
  const activeGoals = devGoals.filter((g) => g.status === 'active')
  const filteredGoals = goalFilter === 'all' ? devGoals : devGoals.filter((g) => goalFilter === 'active' ? g.status === 'active' : g.status === 'completed')

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

      {/* Focus Areas */}
      <div style={{
        background: 'var(--color-surface)', borderRadius: 12, padding: '16px 20px',
        marginBottom: 16, border: '1px solid var(--color-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Tag size={16} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontWeight: 600, fontSize: 15 }}>Obszary fokusu</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>({focusTags.length}/5)</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {focusTags.map((tag) => (
            <span key={tag} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: 'var(--color-primary-light, rgba(59,130,246,0.1))',
              color: 'var(--color-primary)', padding: '4px 12px', borderRadius: 20,
              fontSize: 13, fontWeight: 600,
            }}>
              {tag}
              <X size={12} style={{ cursor: 'pointer', opacity: 0.7 }} onClick={() => handleRemoveFocus(tag)} />
            </span>
          ))}
          {focusTags.length < 5 && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                value={focusInput}
                onChange={(e) => setFocusInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddFocus()}
                placeholder="Nowy obszar..."
                style={{
                  padding: '4px 10px', borderRadius: 8, border: '1px solid var(--color-border)',
                  background: 'var(--color-background)', color: 'var(--color-text)',
                  fontSize: 13, width: 140,
                }}
              />
              <button
                onClick={handleAddFocus}
                disabled={focusSaving || !focusInput.trim()}
                style={{
                  padding: '4px 10px', borderRadius: 8, border: 'none',
                  background: 'var(--color-primary)', color: '#fff',
                  fontSize: 13, cursor: 'pointer', opacity: focusInput.trim() ? 1 : 0.5,
                }}
              >
                <Plus size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Observation */}
      <div style={{
        background: 'var(--color-surface)', borderRadius: 12, padding: '16px 20px',
        marginBottom: 16, border: '1px solid var(--color-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <MessageSquare size={16} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontWeight: 600, fontSize: 15 }}>Szybka notatka</span>
        </div>

        <textarea
          value={obsText}
          onChange={(e) => setObsText(e.target.value)}
          placeholder="Dodaj obserwacje o graczu..."
          rows={3}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 8,
            border: '1px solid var(--color-border)', background: 'var(--color-background)',
            color: 'var(--color-text)', fontSize: 14, resize: 'vertical',
            fontFamily: 'inherit', boxSizing: 'border-box',
          }}
        />

        {/* Type badges */}
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {OBS_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setObsType(t.value)}
              style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                border: obsType === t.value ? `2px solid ${t.color}` : '2px solid transparent',
                background: obsType === t.value ? `${t.color}18` : 'var(--color-background)',
                color: obsType === t.value ? t.color : 'var(--color-text-secondary)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Engagement / Effort / Mood sliders */}
        <div style={{ display: 'flex', gap: 20, marginTop: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Zaangazowanie', value: obsEngagement, set: setObsEngagement, color: '#3b82f6' },
            { label: 'Wysilek', value: obsEffort, set: setObsEffort, color: '#22c55e' },
            { label: 'Nastroj', value: obsMood, set: setObsMood, color: '#eab308' },
          ].map((s) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>{s.label}</span>
              {[1, 2, 3, 4, 5].map((dot) => (
                <span
                  key={dot}
                  onClick={() => s.set(s.value === dot ? 0 : dot)}
                  style={{
                    width: 10, height: 10, borderRadius: '50%', cursor: 'pointer',
                    background: dot <= s.value ? s.color : 'var(--color-border)',
                    transition: 'background 0.15s',
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Goal & Activity refs */}
        <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 180px' }}>
            <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Powiaz z celem</label>
            <select
              value={obsGoalRef}
              onChange={(e) => setObsGoalRef(e.target.value)}
              style={{
                width: '100%', padding: '6px 10px', borderRadius: 8,
                border: '1px solid var(--color-border)', background: 'var(--color-background)',
                color: 'var(--color-text)', fontSize: 13,
              }}
            >
              <option value="">— Brak —</option>
              {activeGoals.map((g) => (
                <option key={g._id} value={g._id}>{g.title}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: '1 1 180px' }}>
            <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Powiaz z aktywnoscia</label>
            <select
              value={obsActivityRef}
              onChange={(e) => setObsActivityRef(e.target.value)}
              style={{
                width: '100%', padding: '6px 10px', borderRadius: 8,
                border: '1px solid var(--color-border)', background: 'var(--color-background)',
                color: 'var(--color-text)', fontSize: 13,
              }}
            >
              <option value="">— Brak —</option>
              {recentActivities.map((a) => (
                <option key={a._id} value={a._id}>{a.title || a.type} ({new Date(a.date).toLocaleDateString('pl-PL')})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Visibility toggle + submit */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, flexWrap: 'wrap', gap: 10 }}>
          <button
            onClick={() => setObsVisible(!obsVisible)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              border: '1px solid var(--color-border)', background: 'var(--color-background)',
              color: obsVisible ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              cursor: 'pointer',
            }}
          >
            {obsVisible ? <Eye size={14} /> : <EyeOff size={14} />}
            Widoczne dla rodzica
          </button>
          <Button variant="primary" size="sm" onClick={handleObservationSubmit} loading={obsSaving} disabled={!obsText.trim()}>
            <Plus size={14} /> Dodaj
          </Button>
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
          <Star size={14} /> Cele ({activeGoals.length})
        </button>
        <button className={`coach-tab ${tab === 'observations' ? 'active' : ''}`} onClick={() => setTab('observations')}>
          <MessageSquare size={14} /> Obserwacje ({observations.length})
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
          {/* Top bar: add + filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <Button variant="primary" size="sm" onClick={() => setShowGoalForm(!showGoalForm)}>
              <Plus size={14} /> Nowy cel
            </Button>
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { key: 'active', label: 'Aktywne' },
                { key: 'completed', label: 'Osiagniete' },
                { key: 'all', label: 'Wszystkie' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setGoalFilter(f.key)}
                  style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    border: goalFilter === f.key ? '2px solid var(--color-primary)' : '2px solid transparent',
                    background: goalFilter === f.key ? 'var(--color-primary-light, rgba(59,130,246,0.1))' : 'var(--color-background)',
                    color: goalFilter === f.key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* New goal form */}
          {showGoalForm && (
            <div style={{
              background: 'var(--color-background)', borderRadius: 12, padding: 16,
              marginBottom: 16, border: '1px solid var(--color-border)',
            }}>
              <input
                value={goalForm.title}
                onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                placeholder="Tytul celu *"
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8, marginBottom: 10,
                  border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                  color: 'var(--color-text)', fontSize: 14, boxSizing: 'border-box',
                }}
              />
              <textarea
                value={goalForm.description}
                onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                placeholder="Opis (opcjonalny)"
                rows={2}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8, marginBottom: 10,
                  border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                  color: 'var(--color-text)', fontSize: 14, resize: 'vertical',
                  fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                <div style={{ flex: '1 1 160px' }}>
                  <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Kategoria</label>
                  <select
                    value={goalForm.category}
                    onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value })}
                    style={{
                      width: '100%', padding: '6px 10px', borderRadius: 8,
                      border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                      color: 'var(--color-text)', fontSize: 13,
                    }}
                  >
                    {GOAL_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div style={{ flex: '1 1 140px' }}>
                  <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Horyzont</label>
                  <select
                    value={goalForm.timeframe}
                    onChange={(e) => setGoalForm({ ...goalForm, timeframe: e.target.value })}
                    style={{
                      width: '100%', padding: '6px 10px', borderRadius: 8,
                      border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                      color: 'var(--color-text)', fontSize: 13,
                    }}
                  >
                    {TIMEFRAME_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div style={{ flex: '1 1 140px' }}>
                  <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Data docelowa</label>
                  <input
                    type="date"
                    value={goalForm.targetDate}
                    onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })}
                    style={{
                      width: '100%', padding: '6px 10px', borderRadius: 8,
                      border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                      color: 'var(--color-text)', fontSize: 13, boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <button
                  onClick={() => setGoalForm({ ...goalForm, visibleToParent: !goalForm.visibleToParent })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                    border: '1px solid var(--color-border)', background: 'var(--color-background)',
                    color: goalForm.visibleToParent ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {goalForm.visibleToParent ? <Eye size={14} /> : <EyeOff size={14} />}
                  Widoczny dla rodzica
                </button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="ghost" size="sm" onClick={() => setShowGoalForm(false)}>Anuluj</Button>
                  <Button variant="primary" size="sm" onClick={handleCreateGoal} loading={goalSaving} disabled={!goalForm.title.trim()}>
                    <Plus size={14} /> Utworz
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Goals list */}
          {filteredGoals.length === 0 ? (
            <div className="coach-empty">Brak celow w tej kategorii</div>
          ) : (
            filteredGoals.map((g) => {
              const cat = GOAL_CATEGORY_MAP[g.category] || GOAL_CATEGORY_MAP.other
              const tf = TIMEFRAME_OPTIONS.find((t) => t.value === g.timeframe)
              const isExpanded = expandedGoal === g._id
              return (
                <div key={g._id} style={{
                  background: 'var(--color-surface)', borderRadius: 12, padding: '14px 18px',
                  marginBottom: 10, border: '1px solid var(--color-border)',
                  opacity: g.status === 'dropped' ? 0.5 : g.status === 'paused' ? 0.7 : 1,
                }}>
                  {/* Goal header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setExpandedGoal(isExpanded ? null : g._id)}>
                    <span style={{
                      background: `${cat.color}18`, color: cat.color,
                      padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      whiteSpace: 'nowrap',
                    }}>
                      {cat.label}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: 14, flex: 1, color: 'var(--color-text)' }}>
                      {g.title}
                    </span>
                    {g.status !== 'active' && (
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12,
                        background: g.status === 'completed' ? '#22c55e18' : g.status === 'paused' ? '#eab30818' : '#ef444418',
                        color: g.status === 'completed' ? '#22c55e' : g.status === 'paused' ? '#eab308' : '#ef4444',
                      }}>
                        {g.status === 'completed' ? 'Osiagniety' : g.status === 'paused' ? 'Wstrzymany' : 'Porzucony'}
                      </span>
                    )}
                    {tf && <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', padding: '2px 8px', background: 'var(--color-background)', borderRadius: 12 }}>{tf.label}</span>}
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>

                  {/* Progress slider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--color-border)', overflow: 'hidden' }}>
                      <div style={{ width: `${g.progress || 0}%`, height: '100%', borderRadius: 3, background: cat.color, transition: 'width 0.3s' }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: cat.color, minWidth: 36, textAlign: 'right' }}>{g.progress || 0}%</span>
                  </div>
                  {g.status === 'active' && (
                    <input
                      type="range" min={0} max={100} value={g.progress || 0}
                      onChange={(e) => handleUpdateGoal(g._id, { progress: Number(e.target.value) })}
                      style={{ width: '100%', marginTop: 4, accentColor: cat.color }}
                    />
                  )}

                  {/* Target date */}
                  {g.targetDate && (
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={12} /> do {new Date(g.targetDate).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  )}

                  {/* Status buttons for active goals */}
                  {g.status === 'active' && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                      <button onClick={(e) => { e.stopPropagation(); handleUpdateGoal(g._id, { status: 'completed', progress: 100 }) }} style={{
                        display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8,
                        border: '1px solid #22c55e', background: '#22c55e10', color: '#22c55e',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}>
                        <Check size={12} /> Osiagniety
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleUpdateGoal(g._id, { status: 'paused' }) }} style={{
                        display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8,
                        border: '1px solid #eab308', background: '#eab30810', color: '#eab308',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}>
                        <Pause size={12} /> Wstrzymaj
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleUpdateGoal(g._id, { status: 'dropped' }) }} style={{
                        display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8,
                        border: '1px solid #ef4444', background: '#ef444410', color: '#ef4444',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}>
                        <XCircle size={12} /> Porzuc
                      </button>
                    </div>
                  )}

                  {/* Re-activate for paused/dropped */}
                  {(g.status === 'paused' || g.status === 'dropped') && (
                    <div style={{ marginTop: 10 }}>
                      <button onClick={(e) => { e.stopPropagation(); handleUpdateGoal(g._id, { status: 'active' }) }} style={{
                        display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8,
                        border: '1px solid var(--color-primary)', background: 'var(--color-primary-light, rgba(59,130,246,0.1))', color: 'var(--color-primary)',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}>
                        Aktywuj ponownie
                      </button>
                    </div>
                  )}

                  {/* Expanded: description, edit, delete */}
                  {isExpanded && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
                      {editingGoal && editingGoal._goalId === g._id ? (
                        <div>
                          <input
                            value={editingGoal.title || ''}
                            onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                            placeholder="Tytul"
                            style={{
                              width: '100%', padding: '6px 10px', borderRadius: 8, marginBottom: 8,
                              border: '1px solid var(--color-border)', background: 'var(--color-background)',
                              color: 'var(--color-text)', fontSize: 13, boxSizing: 'border-box',
                            }}
                          />
                          <textarea
                            value={editingGoal.description || ''}
                            onChange={(e) => setEditingGoal({ ...editingGoal, description: e.target.value })}
                            placeholder="Opis"
                            rows={2}
                            style={{
                              width: '100%', padding: '6px 10px', borderRadius: 8, marginBottom: 8,
                              border: '1px solid var(--color-border)', background: 'var(--color-background)',
                              color: 'var(--color-text)', fontSize: 13, resize: 'vertical',
                              fontFamily: 'inherit', boxSizing: 'border-box',
                            }}
                          />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <Button variant="primary" size="sm" onClick={() => handleSaveEditGoal(g._id)}>
                              <Save size={12} /> Zapisz
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setEditingGoal(null)}>Anuluj</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {g.description && <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>{g.description}</div>}
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={(e) => { e.stopPropagation(); setEditingGoal({ _goalId: g._id, title: g.title, description: g.description || '' }) }} style={{
                              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8,
                              border: '1px solid var(--color-border)', background: 'var(--color-background)',
                              color: 'var(--color-text-secondary)', fontSize: 12, cursor: 'pointer',
                            }}>
                              <Edit3 size={12} /> Edytuj
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteGoal(g._id) }} style={{
                              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8,
                              border: '1px solid #ef4444', background: '#ef444410',
                              color: '#ef4444', fontSize: 12, cursor: 'pointer',
                            }}>
                              <Trash2 size={12} /> Usun
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Observations tab */}
      {tab === 'observations' && (
        <div style={{ marginTop: 4 }}>
          {observations.length === 0 ? (
            <div className="coach-empty">Brak obserwacji — dodaj pierwsza za pomoca formularza powyzej</div>
          ) : (
            observations.map((obs) => {
              const obsTypeObj = OBS_TYPES.find((t) => t.value === obs.type) || OBS_TYPES[OBS_TYPES.length - 1]
              const isEditing = editingObs === obs._id
              return (
                <div key={obs._id} style={{
                  background: 'var(--color-surface)', borderRadius: 12, padding: '14px 18px',
                  marginBottom: 10, border: '1px solid var(--color-border)',
                  borderLeft: `3px solid ${obsTypeObj.color}`,
                }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      background: `${obsTypeObj.color}18`, color: obsTypeObj.color,
                      padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                    }}>
                      {obsTypeObj.label}
                    </span>
                    {obs.pinned && <Pin size={12} style={{ color: 'var(--color-primary)' }} />}
                    <span style={{ flex: 1 }} />
                    <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                      {new Date(obs.createdAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Text or edit form */}
                  {isEditing ? (
                    <div style={{ marginBottom: 10 }}>
                      <textarea
                        value={editObsText}
                        onChange={(e) => setEditObsText(e.target.value)}
                        rows={3}
                        style={{
                          width: '100%', padding: '8px 12px', borderRadius: 8,
                          border: '1px solid var(--color-border)', background: 'var(--color-background)',
                          color: 'var(--color-text)', fontSize: 14, resize: 'vertical',
                          fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 8,
                        }}
                      />
                      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                        {OBS_TYPES.map((t) => (
                          <button
                            key={t.value}
                            onClick={() => setEditObsType(t.value)}
                            style={{
                              padding: '3px 10px', borderRadius: 16, fontSize: 12, fontWeight: 600,
                              border: editObsType === t.value ? `2px solid ${t.color}` : '2px solid transparent',
                              background: editObsType === t.value ? `${t.color}18` : 'var(--color-background)',
                              color: editObsType === t.value ? t.color : 'var(--color-text-secondary)',
                              cursor: 'pointer',
                            }}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button variant="primary" size="sm" onClick={() => handleUpdateObs(obs._id)}>
                          <Save size={12} /> Zapisz
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingObs(null)}>Anuluj</Button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.5, marginBottom: 8 }}>{obs.text}</div>
                  )}

                  {/* Linked goal/activity chips */}
                  {(obs.goalRef || obs.activity) && (
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                      {obs.goalRef && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: '#8b5cf618', color: '#8b5cf6',
                          padding: '2px 10px', borderRadius: 16, fontSize: 11, fontWeight: 600,
                        }}>
                          <Star size={10} /> Cel: {obs.goalRef.title || obs.goalRef}
                        </span>
                      )}
                      {obs.activity && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: '#3b82f618', color: '#3b82f6',
                          padding: '2px 10px', borderRadius: 16, fontSize: 11, fontWeight: 600,
                        }}>
                          <Calendar size={10} /> Aktywnosc: {obs.activity.title || obs.activity.type || obs.activity}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Engagement / Effort / Mood dots */}
                  {(obs.engagement || obs.effort || obs.mood) && (
                    <div style={{ display: 'flex', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
                      {[
                        { label: 'Zaangazowanie', value: obs.engagement, color: '#3b82f6' },
                        { label: 'Wysilek', value: obs.effort, color: '#22c55e' },
                        { label: 'Nastroj', value: obs.mood, color: '#eab308' },
                      ].filter((s) => s.value).map((s) => (
                        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 500 }}>{s.label}</span>
                          {[1, 2, 3, 4, 5].map((dot) => (
                            <span key={dot} style={{
                              width: 8, height: 8, borderRadius: '50%',
                              background: dot <= s.value ? s.color : 'var(--color-border)',
                            }} />
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action buttons */}
                  {!isEditing && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleTogglePin(obs)} style={{
                        display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6,
                        border: '1px solid var(--color-border)', background: obs.pinned ? 'var(--color-primary-light, rgba(59,130,246,0.1))' : 'var(--color-background)',
                        color: obs.pinned ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        fontSize: 11, cursor: 'pointer',
                      }}>
                        <Pin size={10} /> {obs.pinned ? 'Odpinaj' : 'Przypnij'}
                      </button>
                      <button onClick={() => { setEditingObs(obs._id); setEditObsText(obs.text); setEditObsType(obs.type || 'general') }} style={{
                        display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6,
                        border: '1px solid var(--color-border)', background: 'var(--color-background)',
                        color: 'var(--color-text-secondary)', fontSize: 11, cursor: 'pointer',
                      }}>
                        <Edit3 size={10} /> Edytuj
                      </button>
                      <button onClick={() => handleDeleteObs(obs._id)} style={{
                        display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6,
                        border: '1px solid #ef4444', background: '#ef444410',
                        color: '#ef4444', fontSize: 11, cursor: 'pointer',
                      }}>
                        <Trash2 size={10} /> Usun
                      </button>
                    </div>
                  )}
                </div>
              )
            })
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
