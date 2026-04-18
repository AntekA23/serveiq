import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ChevronDown, ChevronUp, Plus, Save, Trash2, Target,
  Calendar, FileText, Eye, EyeOff, Clock, Sparkles, Award, Star,
} from 'lucide-react'
import api from '../../api/axios'
import Avatar from '../../components/ui/Avatar/Avatar'
import Button from '../../components/ui/Button/Button'
import ConfirmModal from '../../components/ui/ConfirmModal'
import BadgeGrid from '../../components/badges/BadgeGrid'
import BadgeAwardModal from '../../components/badges/BadgeAwardModal'
import IdolCard from '../../components/player/IdolCard'
import useToast from '../../hooks/useToast'
import './CoachPlayerProfile.css'

const DAY_NAMES = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sb', 'Nd']
const TYPE_LABELS = {
  kort: 'Kort', sparing: 'Sparing', kondycja: 'Kondycja',
  rozciaganie: 'Rozciąganie', mecz: 'Mecz', inne: 'Inne',
}
const TYPE_OPTIONS = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))

const PATHWAY_STAGES = [
  { value: 'beginner', label: 'Początkujący' },
  { value: 'tennis10_red', label: 'Czerwony kort' },
  { value: 'tennis10_orange', label: 'Pomarańczowy kort' },
  { value: 'tennis10_green', label: 'Zielony kort' },
  { value: 'committed', label: 'Zawodnik' },
  { value: 'advanced', label: 'Zaawansowany' },
  { value: 'performance', label: 'Performance' },
]
const PATHWAY_MAP = Object.fromEntries(PATHWAY_STAGES.map((s) => [s.value, s.label]))

const OBS_TYPES = [
  { value: 'progress', label: 'Postęp', color: '#22c55e' },
  { value: 'concern', label: 'Uwaga', color: '#ef4444' },
  { value: 'highlight', label: 'Wyróżnienie', color: '#eab308' },
  { value: 'general', label: 'Ogólna', color: '#6b7280' },
]

const GOAL_CATEGORIES = [
  { value: 'fundamentals', label: 'Podstawy', color: '#22c55e' },
  { value: 'movement', label: 'Ruch', color: '#3b82f6' },
  { value: 'fitness', label: 'Kondycja', color: '#ec4899' },
  { value: 'tactics', label: 'Taktyka', color: '#6366f1' },
  { value: 'serve', label: 'Serwis', color: '#14b8a6' },
  { value: 'other', label: 'Inne', color: '#6b7280' },
]
const GOAL_CAT_MAP = Object.fromEntries(GOAL_CATEGORIES.map((c) => [c.value, c]))

/* ── Collapsible Section ── */
function Section({ title, icon: Icon, defaultOpen = false, badge, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="cpp-section">
      <button className="cpp-section-toggle" onClick={() => setOpen(!open)}>
        {Icon && <Icon size={15} className="cpp-section-icon" />}
        <span className="cpp-section-title">{title}</span>
        {badge != null && <span className="cpp-section-badge">{badge}</span>}
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && <div className="cpp-section-body">{children}</div>}
    </section>
  )
}

export default function CoachPlayerProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [player, setPlayer] = useState(null)
  const [sessions, setSessions] = useState([])
  const [reviews, setReviews] = useState([])
  const [goals, setGoals] = useState([])
  const [observations, setObservations] = useState([])
  const [loading, setLoading] = useState(true)

  // Observation form
  const [obsText, setObsText] = useState('')
  const [obsType, setObsType] = useState('general')
  const [obsVisible, setObsVisible] = useState(true)
  const [obsSaving, setObsSaving] = useState(false)

  // Goal form
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [goalTitle, setGoalTitle] = useState('')
  const [goalCat, setGoalCat] = useState('fundamentals')
  const [goalSaving, setGoalSaving] = useState(false)

  // Pathway stage
  const [pathwayStage, setPathwayStage] = useState('')
  const [pathwaySaving, setPathwaySaving] = useState(false)

  // Badges
  const [showAwardModal, setShowAwardModal] = useState(false)
  const [badgeEarnedCount, setBadgeEarnedCount] = useState(0)
  const [badgeRefreshKey, setBadgeRefreshKey] = useState(0)

  // AI Recommendations
  const [aiRecs, setAiRecs] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  // Plan editing
  const [schedule, setSchedule] = useState([])
  const [planDirty, setPlanDirty] = useState(false)
  const [planSaving, setPlanSaving] = useState(false)

  // Confirm modal
  const [confirmAction, setConfirmAction] = useState(null)

  const fetchData = async () => {
    try {
      const [playerRes, sessionsRes, reviewsRes, goalsRes, obsRes] = await Promise.all([
        api.get(`/players/${id}`),
        api.get(`/sessions?player=${id}`),
        api.get(`/reviews?player=${id}`).catch(() => ({ data: { reviews: [] } })),
        api.get(`/goals?player=${id}`).catch(() => ({ data: { goals: [] } })),
        api.get(`/observations?player=${id}`).catch(() => ({ data: { observations: [] } })),
      ])
      const p = playerRes.data.player || playerRes.data
      setPlayer(p)
      setPathwayStage(p.pathwayStage || '')
      setSchedule(p.trainingPlan?.weeklySchedule || [])
      setSessions((sessionsRes.data.sessions || sessionsRes.data || []).sort((a, b) => new Date(b.date) - new Date(a.date)))
      setReviews((reviewsRes.data.reviews || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
      setGoals(goalsRes.data.goals || [])
      setObservations(obsRes.data.observations || [])
    } catch { /* silent */ }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [id])

  /* ── Handlers ── */
  const handlePathwayChange = async (newStage) => {
    setPathwayStage(newStage)
    setPathwaySaving(true)
    try {
      const { data } = await api.put(`/players/${id}`, { pathwayStage: newStage })
      setPlayer(data.player || data)
      toast.success('Etap ścieżki zapisany')
    } catch {
      toast.error('Nie udało się zapisać etapu')
      setPathwayStage(player?.pathwayStage || '')
    }
    setPathwaySaving(false)
  }

  const handleAiRecommendations = async () => {
    setAiLoading(true)
    try {
      const { data } = await api.post(`/ai/recommendations/${id}`)
      setAiRecs(data.result)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Nie udało się wygenerować rekomendacji')
    }
    setAiLoading(false)
  }

  const handleObsSubmit = async () => {
    if (!obsText.trim()) return
    setObsSaving(true)
    try {
      const { data } = await api.post('/observations', {
        player: id, text: obsText.trim(), type: obsType, visibleToParent: obsVisible,
      })
      setObservations((prev) => [data.observation, ...prev])
      setObsText('')
      setObsType('general')
      toast.success('Obserwacja dodana')
    } catch { toast.error('Nie udało się dodać obserwacji') }
    setObsSaving(false)
  }

  const handleDeleteObs = async (obsId) => {
    setConfirmAction({
      message: 'Usunąć tę obserwację?',
      onConfirm: async () => {
        setConfirmAction(null)
        try {
          await api.delete(`/observations/${obsId}`)
          setObservations((prev) => prev.filter((o) => o._id !== obsId))
        } catch { toast.error('Nie udało się usunąć') }
      },
    })
  }

  const handleGoalCreate = async () => {
    if (!goalTitle.trim()) return
    setGoalSaving(true)
    try {
      const { data } = await api.post('/goals', {
        player: id, title: goalTitle.trim(), category: goalCat, timeframe: 'monthly', visibleToParent: true,
      })
      setGoals((prev) => [data.goal, ...prev])
      setGoalTitle('')
      setShowGoalForm(false)
      toast.success('Cel dodany')
    } catch { toast.error('Nie udało się dodać celu') }
    setGoalSaving(false)
  }

  const handleGoalToggle = async (goal) => {
    try {
      const newStatus = goal.status === 'completed' ? 'active' : 'completed'
      const { data } = await api.put(`/goals/${goal._id}`, { status: newStatus })
      setGoals((prev) => prev.map((g) => g._id === goal._id ? data.goal : g))
    } catch { toast.error('Nie udało się zaktualizować') }
  }

  const handleGoalDelete = async (goalId) => {
    setConfirmAction({
      message: 'Usunąć ten cel?',
      onConfirm: async () => {
        setConfirmAction(null)
        try {
          await api.delete(`/goals/${goalId}`)
          setGoals((prev) => prev.filter((g) => g._id !== goalId))
        } catch { toast.error('Nie udało się usunąć') }
      },
    })
  }

  const handlePlanSave = async () => {
    setPlanSaving(true)
    try {
      await api.put(`/players/${id}/training-plan`, { weeklySchedule: schedule })
      setPlanDirty(false)
      toast.success('Plan zapisany')
    } catch { toast.error('Nie udało się zapisać planu') }
    setPlanSaving(false)
  }

  const addPlanItem = (day) => {
    setSchedule((prev) => [...prev, { day, sessionType: 'kort', durationMinutes: 90, startTime: '16:00' }])
    setPlanDirty(true)
  }

  const updatePlanItem = (idx, field, value) => {
    setSchedule((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: field === 'durationMinutes' ? Number(value) : value } : item))
    setPlanDirty(true)
  }

  const removePlanItem = (idx) => {
    setSchedule((prev) => prev.filter((_, i) => i !== idx))
    setPlanDirty(true)
  }

  if (loading) {
    return <div className="cpp-page"><div className="cpp-loading"><div className="cpp-spinner" /></div></div>
  }

  if (!player) {
    return <div className="cpp-page"><div className="cpp-error">Nie znaleziono zawodnika</div></div>
  }

  const age = player.dateOfBirth
    ? Math.floor((Date.now() - new Date(player.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  const activeGoals = goals.filter((g) => g.status !== 'completed')
  const completedGoals = goals.filter((g) => g.status === 'completed')

  const totalHours = Math.round(schedule.reduce((s, i) => s + (i.durationMinutes || 0), 0) / 60 * 10) / 10

  return (
    <div className="cpp-page">
      {/* Back */}
      <button className="cpp-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Zawodnicy
      </button>

      {/* ─── Header ─── */}
      <div className="cpp-header">
        <Avatar firstName={player.firstName} lastName={player.lastName} size={56} role="player" src={player.avatarUrl} />
        <div className="cpp-header-info">
          <h1 className="cpp-name">{player.firstName} {player.lastName}</h1>
          <div className="cpp-tags">
            {age && <span className="cpp-tag">{age} lat</span>}
            {player.ranking?.pzt && <span className="cpp-tag cpp-tag-rank">PZT #{player.ranking.pzt}</span>}
          </div>
          {/* Pathway stage selector */}
          <div className="cpp-pathway">
            <select
              className="cpp-pathway-select"
              value={pathwayStage}
              onChange={(e) => handlePathwayChange(e.target.value)}
              disabled={pathwaySaving}
            >
              <option value="">Etap ścieżki...</option>
              {PATHWAY_STAGES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="cpp-header-actions">
          <Button size="sm" onClick={() => setShowGoalForm(true)}>
            <Target size={13} /> Cel
          </Button>
          <Button size="sm" onClick={handleAiRecommendations} loading={aiLoading}>
            <Sparkles size={13} /> AI
          </Button>
          <Button size="sm" onClick={() => navigate(`/coach/reviews/new?player=${id}`)}>
            <FileText size={13} /> Ocena
          </Button>
        </div>
      </div>

      {/* AI Recommendations (if generated) */}
      {aiRecs && (
        <div className="cpp-ai-result">
          <div className="cpp-ai-header">
            <Sparkles size={14} /> <span>Rekomendacje AI</span>
            <button className="cpp-ai-close" onClick={() => setAiRecs(null)}>&times;</button>
          </div>
          <div className="cpp-ai-body">
            {typeof aiRecs === 'string' ? (
              <p>{aiRecs}</p>
            ) : (
              <>
                {aiRecs.summary && <p>{aiRecs.summary}</p>}
                {aiRecs.recommendations?.map((r, i) => <p key={i}>• {r}</p>)}
                {aiRecs.focusAreas?.length > 0 && (
                  <p><strong>Fokus:</strong> {aiRecs.focusAreas.join(', ')}</p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── Plan ─── */}
      <Section title="Plan treningowy" icon={Calendar} badge={schedule.length > 0 ? `${schedule.length} treningów · ${totalHours}h/tyg` : null}>
        <div className="cpp-plan">
          {planDirty && (
            <div className="cpp-plan-save">
              <Button variant="primary" size="sm" onClick={handlePlanSave} loading={planSaving}>
                <Save size={13} /> Zapisz plan
              </Button>
            </div>
          )}
          <div className="cpp-plan-days">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
              const dayItems = schedule.map((item, idx) => ({ ...item, _idx: idx })).filter((i) => i.day === day)
              return (
                <div key={day} className={`cpp-plan-day ${dayItems.length > 0 ? 'active' : ''}`}>
                  <div className="cpp-plan-day-head">
                    <span className="cpp-plan-day-name">{DAY_NAMES[day - 1]}</span>
                    <button className="cpp-plan-add" onClick={() => addPlanItem(day)} title="Dodaj"><Plus size={12} /></button>
                  </div>
                  {dayItems.map((item) => (
                    <div key={item._idx} className="cpp-plan-item">
                      <select value={item.sessionType} onChange={(e) => updatePlanItem(item._idx, 'sessionType', e.target.value)} className="cpp-plan-select">
                        {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                      <input type="time" value={item.startTime || '16:00'} onChange={(e) => updatePlanItem(item._idx, 'startTime', e.target.value)} className="cpp-plan-time" />
                      <select value={item.durationMinutes} onChange={(e) => updatePlanItem(item._idx, 'durationMinutes', e.target.value)} className="cpp-plan-dur">
                        {[30, 45, 60, 75, 90, 120].map((d) => <option key={d} value={d}>{d}′</option>)}
                      </select>
                      <button className="cpp-plan-remove" onClick={() => removePlanItem(item._idx)}><Trash2 size={11} /></button>
                    </div>
                  ))}
                  {dayItems.length === 0 && <span className="cpp-plan-empty">—</span>}
                </div>
              )
            })}
          </div>
        </div>
      </Section>

      {/* ─── Recent sessions ─── */}
      <Section title="Ostatnie sesje" icon={Clock} badge={sessions.length > 0 ? sessions.length : null}>
        {sessions.length === 0 ? (
          <div className="cpp-empty">Brak treningów</div>
        ) : (
          <div className="cpp-sessions">
            {sessions.slice(0, 8).map((s) => (
              <div key={s._id} className="cpp-session-row" onClick={() => navigate(`/coach/sessions/${s._id}/edit`)}>
                <span className="cpp-session-date">
                  {new Date(s.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
                </span>
                <span className="cpp-session-type">{TYPE_LABELS[s.sessionType] || 'Trening'}</span>
                <span className="cpp-session-dur">{s.durationMinutes}′</span>
                {s.startTime && <span className="cpp-session-time">{s.startTime.slice(0, 5)}</span>}
              </div>
            ))}
            {sessions.length > 8 && (
              <button className="cpp-show-more" onClick={() => navigate('/coach/sessions')}>
                Wszystkie sesje ({sessions.length})
              </button>
            )}
          </div>
        )}
      </Section>

      {/* ─── Goals ─── */}
      <Section title="Cele" icon={Target} defaultOpen badge={activeGoals.length > 0 ? `${activeGoals.length} aktywnych` : null}>
        {/* Add goal */}
        {!showGoalForm ? (
          <button className="cpp-add-btn" onClick={() => setShowGoalForm(true)}>
            <Plus size={13} /> Dodaj cel
          </button>
        ) : (
          <div className="cpp-goal-form">
            <input className="cpp-goal-input" placeholder="Tytuł celu..." value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} autoFocus />
            <div className="cpp-goal-form-row">
              <select className="cpp-goal-cat" value={goalCat} onChange={(e) => setGoalCat(e.target.value)}>
                {GOAL_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <Button variant="primary" size="sm" onClick={handleGoalCreate} loading={goalSaving}><Save size={12} /> Zapisz</Button>
              <button className="cpp-cancel-btn" onClick={() => { setShowGoalForm(false); setGoalTitle('') }}>Anuluj</button>
            </div>
          </div>
        )}

        {/* Active goals */}
        {activeGoals.length > 0 && (
          <div className="cpp-goals-list">
            {activeGoals.map((g) => {
              const cat = GOAL_CAT_MAP[g.category] || GOAL_CAT_MAP.other
              return (
                <div key={g._id} className="cpp-goal-item">
                  <div className="cpp-goal-dot" style={{ background: cat.color }} />
                  <div className="cpp-goal-body">
                    <span className="cpp-goal-title">{g.title}</span>
                    <span className="cpp-goal-cat" style={{ color: cat.color }}>{cat.label}</span>
                  </div>
                  <button className="cpp-goal-done" onClick={() => handleGoalToggle(g)} title="Oznacz jako ukończony">✓</button>
                  <button className="cpp-goal-del" onClick={() => handleGoalDelete(g._id)} title="Usuń"><Trash2 size={12} /></button>
                </div>
              )
            })}
          </div>
        )}

        {/* Completed count */}
        {completedGoals.length > 0 && (
          <div className="cpp-goals-done-count">{completedGoals.length} ukończonych celów</div>
        )}
      </Section>

      {/* ─── Observations ─── */}
      <Section title="Obserwacje" icon={FileText} badge={observations.length > 0 ? observations.length : null}>
        {/* Quick add form */}
        <div className="cpp-obs-form">
          <textarea className="cpp-obs-input" placeholder="Dodaj obserwację..." value={obsText} onChange={(e) => setObsText(e.target.value)} rows={2} />
          <div className="cpp-obs-form-row">
            <div className="cpp-obs-types">
              {OBS_TYPES.map((t) => (
                <button
                  key={t.value}
                  className={`cpp-obs-type-btn ${obsType === t.value ? 'active' : ''}`}
                  style={obsType === t.value ? { background: t.color + '20', color: t.color, borderColor: t.color + '40' } : {}}
                  onClick={() => setObsType(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="cpp-obs-form-actions">
              <button className="cpp-obs-vis" onClick={() => setObsVisible(!obsVisible)} title={obsVisible ? 'Widoczna dla rodzica' : 'Ukryta'}>
                {obsVisible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <Button variant="primary" size="sm" onClick={handleObsSubmit} loading={obsSaving} disabled={!obsText.trim()}>Dodaj</Button>
            </div>
          </div>
        </div>

        {/* List */}
        {observations.length > 0 && (
          <div className="cpp-obs-list">
            {observations.slice(0, 10).map((obs) => {
              const typeInfo = OBS_TYPES.find((t) => t.value === obs.type) || OBS_TYPES[3]
              return (
                <div key={obs._id} className="cpp-obs-item">
                  <div className="cpp-obs-dot" style={{ background: typeInfo.color }} />
                  <div className="cpp-obs-body">
                    <p className="cpp-obs-text">{obs.text}</p>
                    <span className="cpp-obs-meta">
                      {new Date(obs.createdAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
                      {!obs.visibleToParent && ' · ukryta'}
                    </span>
                  </div>
                  <button className="cpp-obs-del" onClick={() => handleDeleteObs(obs._id)}><Trash2 size={11} /></button>
                </div>
              )
            })}
          </div>
        )}
      </Section>

      {/* ─── Idol ─── */}
      <Section title="Idol zawodnika" icon={Star}>
        <IdolCard
          playerId={id}
          idol={player.idol}
          onUpdate={(newIdol) => setPlayer((prev) => ({ ...prev, idol: newIdol }))}
        />
      </Section>

      {/* ─── Badges ─── */}
      <Section title="Odznaki" icon={Award} badge={badgeEarnedCount > 0 ? `${badgeEarnedCount} zdobytych` : null}>
        <BadgeGrid
          key={badgeRefreshKey}
          playerId={id}
          onBadgesLoaded={(badges) => setBadgeEarnedCount(badges.filter(b => b.earned).length)}
        />
        <div style={{ marginTop: '0.75rem' }}>
          <Button size="sm" onClick={() => setShowAwardModal(true)}>
            <Plus size={14} /> Przyznaj odznakę
          </Button>
        </div>
      </Section>

      {showAwardModal && (
        <BadgeAwardModal
          playerId={id}
          onClose={() => setShowAwardModal(false)}
          onAwarded={() => setBadgeRefreshKey(k => k + 1)}
        />
      )}

      {/* ─── Reviews quick link ─── */}
      {reviews.length > 0 && (
        <div className="cpp-reviews-link" onClick={() => navigate('/coach/reviews')}>
          <FileText size={15} />
          <span>{reviews.length} {reviews.length === 1 ? 'ocena' : 'ocen'}</span>
          <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} />
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={confirmAction?.onConfirm}
        message={confirmAction?.message}
      />
    </div>
  )
}
