import { useState, useEffect, useCallback } from 'react'
import {
  Calendar,
  Target,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Battery,
  Award,
  Plus,
  X,
  Edit3,
  Save,
  Trash2,
  Clock,
} from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import useToast from '../../hooks/useToast'
import Avatar from '../../components/ui/Avatar/Avatar'
import Button from '../../components/ui/Button/Button'
import './TrainingPlan.css'

const DAY_NAMES = ['Pon', 'Wt', 'Sr', 'Czw', 'Pt', 'Sb', 'Nd']
const DAY_NUMBERS = [1, 2, 3, 4, 5, 6, 7]
const MONTH_NAMES = [
  'Styczen', 'Luty', 'Marzec', 'Kwiecien', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpien', 'Wrzesien', 'Pazdziernik', 'Listopad', 'Grudzien'
]

const PRESET_FOCUS = ['Serwis', 'Forhend', 'Bekhend', 'Wolej', 'Taktyka', 'Kondycja', 'Return', 'Gra podwojna']
const SESSION_TYPES = ['Kort', 'Fitness', 'Mecz', 'Inne']

// ─── Weekly Progress (editable) ───

function WeeklyProgress({ plan, sessionsCompleted, hoursCompleted, childId, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [sessionsGoal, setSessionsGoal] = useState(plan?.weeklyGoal?.sessionsPerWeek || 5)
  const [hoursGoal, setHoursGoal] = useState(plan?.weeklyGoal?.hoursPerWeek || 8)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setSessionsGoal(plan?.weeklyGoal?.sessionsPerWeek || 5)
    setHoursGoal(plan?.weeklyGoal?.hoursPerWeek || 8)
  }, [plan])

  const sessionPct = sessionsGoal ? Math.min(100, (sessionsCompleted / sessionsGoal) * 100) : 0
  const hoursPct = hoursGoal ? Math.min(100, (hoursCompleted / hoursGoal) * 100) : 0

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`/players/${childId}/training-plan`, {
        weeklyGoal: { sessionsPerWeek: sessionsGoal, hoursPerWeek: hoursGoal },
      })
      onUpdate()
      setEditing(false)
    } catch { /* silent */ }
    setSaving(false)
  }

  return (
    <div className="weekly-progress card">
      <div className="section-header">
        <h3 className="section-title"><Dumbbell size={16} /> Cel tygodniowy</h3>
        {!editing && (
          <button className="edit-btn" onClick={() => setEditing(true)}><Edit3 size={14} /></button>
        )}
      </div>

      {editing ? (
        <div className="inline-edit-form">
          <div className="inline-edit-row">
            <label>Treningi / tydzien</label>
            <input type="number" min={0} max={14} value={sessionsGoal}
              onChange={(e) => setSessionsGoal(Number(e.target.value))} />
          </div>
          <div className="inline-edit-row">
            <label>Godziny / tydzien</label>
            <input type="number" min={0} max={40} value={hoursGoal}
              onChange={(e) => setHoursGoal(Number(e.target.value))} />
          </div>
          <div className="inline-edit-actions">
            <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
              <Save size={14} /> Zapisz
            </Button>
            <button className="cancel-btn" onClick={() => setEditing(false)}>Anuluj</button>
          </div>
        </div>
      ) : (
        <div className="weekly-progress-items">
          <div className="weekly-progress-item">
            <div className="weekly-progress-item-header">
              <Dumbbell size={14} />
              <span>Treningi</span>
              <span className="weekly-progress-value">{sessionsCompleted}/{sessionsGoal}</span>
            </div>
            <div className="weekly-progress-bar">
              <div className="weekly-progress-fill" style={{ width: `${sessionPct}%` }} />
            </div>
          </div>
          <div className="weekly-progress-item">
            <div className="weekly-progress-item-header">
              <Battery size={14} />
              <span>Godziny</span>
              <span className="weekly-progress-value">{hoursCompleted.toFixed(1)}/{hoursGoal}h</span>
            </div>
            <div className="weekly-progress-bar">
              <div className="weekly-progress-fill hours" style={{ width: `${hoursPct}%` }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Scheduled Days ───

function ScheduledDays({ plan, childId, onUpdate }) {
  const [days, setDays] = useState(plan?.scheduledDays || [])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDays(plan?.scheduledDays || [])
  }, [plan])

  const toggle = async (day) => {
    const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort()
    setDays(next)
    setSaving(true)
    try {
      await api.put(`/players/${childId}/training-plan`, { scheduledDays: next })
      onUpdate()
    } catch { /* silent */ }
    setSaving(false)
  }

  return (
    <div className="scheduled-days card">
      <h3 className="section-title"><Calendar size={16} /> Dni treningowe</h3>
      <div className="days-grid">
        {DAY_NUMBERS.map((num, idx) => (
          <button
            key={num}
            className={`day-btn ${days.includes(num) ? 'active' : ''}`}
            onClick={() => toggle(num)}
            disabled={saving}
          >
            {DAY_NAMES[idx]}
          </button>
        ))}
      </div>
      <div className="days-summary">
        {days.length > 0
          ? `${days.length} ${days.length === 1 ? 'trening' : days.length < 5 ? 'treningi' : 'treningow'} / tydz`
          : 'Kliknij aby wybrac dni treningowe'}
      </div>
    </div>
  )
}

// ─── Focus Areas (editable) ───

function FocusAreas({ plan, childId, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [focus, setFocus] = useState(plan?.focus || [])
  const [notes, setNotes] = useState(plan?.notes || '')
  const [customTag, setCustomTag] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setFocus(plan?.focus || [])
    setNotes(plan?.notes || '')
  }, [plan])

  const toggleTag = (tag) => {
    setFocus((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
  }

  const addCustom = () => {
    const tag = customTag.trim()
    if (tag && !focus.includes(tag)) {
      setFocus((prev) => [...prev, tag])
      setCustomTag('')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`/players/${childId}/training-plan`, { focus, notes: notes || null })
      onUpdate()
      setEditing(false)
    } catch { /* silent */ }
    setSaving(false)
  }

  return (
    <div className="focus-areas card">
      <div className="section-header">
        <h3 className="section-title"><Target size={16} /> Obszary fokusa</h3>
        {!editing && (
          <button className="edit-btn" onClick={() => setEditing(true)}><Edit3 size={14} /></button>
        )}
      </div>

      {editing ? (
        <div className="inline-edit-form">
          <div className="focus-tags-edit">
            {PRESET_FOCUS.map((tag) => (
              <button key={tag}
                className={`focus-tag-btn ${focus.includes(tag) ? 'active' : ''}`}
                onClick={() => toggleTag(tag)}
              >{tag}</button>
            ))}
            {focus.filter((t) => !PRESET_FOCUS.includes(t)).map((tag) => (
              <button key={tag} className="focus-tag-btn active custom" onClick={() => toggleTag(tag)}>
                {tag} <X size={12} />
              </button>
            ))}
          </div>
          <div className="custom-tag-row">
            <input placeholder="Wlasny tag..." value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom())} />
            <button className="add-tag-btn" onClick={addCustom}><Plus size={14} /></button>
          </div>
          <textarea placeholder="Notatki (opcjonalnie)" value={notes}
            onChange={(e) => setNotes(e.target.value)} rows={3} />
          <div className="inline-edit-actions">
            <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
              <Save size={14} /> Zapisz
            </Button>
            <button className="cancel-btn" onClick={() => setEditing(false)}>Anuluj</button>
          </div>
        </div>
      ) : (
        <>
          {focus.length > 0 ? (
            <div className="focus-areas-tags">
              {focus.map((tag, idx) => (
                <span key={idx} className="focus-area-tag">{tag}</span>
              ))}
            </div>
          ) : (
            <div className="empty-hint">Kliknij edytuj aby dodac obszary fokusa</div>
          )}
          {notes && (
            <div className="focus-areas-notes">
              <div className="focus-areas-notes-label">Notatki</div>
              <p>{notes}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Calendar with scheduled slots + sessions ───

function TrainingCalendar({ sessions, scheduledDays, currentMonth, onMonthChange, onDayClick, selectedDay }) {
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6

  const daysInMonth = lastDay.getDate()
  const cells = []

  for (let i = 0; i < startOffset; i++) cells.push({ day: null })

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay()

    const hasSession = sessions.some((s) => {
      const sd = new Date(s.date)
      return sd.getFullYear() === year && sd.getMonth() === month && sd.getDate() === d
    })

    const isScheduled = scheduledDays.includes(dayOfWeek)
    const isToday = new Date().toDateString() === date.toDateString()
    const isSelected = selectedDay === d

    cells.push({ day: d, hasSession, isScheduled, isToday, isSelected })
  }

  return (
    <div className="training-calendar card">
      <div className="training-calendar-header">
        <button className="calendar-nav" onClick={() => onMonthChange(-1)}>
          <ChevronLeft size={16} />
        </button>
        <span className="calendar-month">{MONTH_NAMES[month]} {year}</span>
        <button className="calendar-nav" onClick={() => onMonthChange(1)}>
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="calendar-grid">
        {DAY_NAMES.map((name) => (
          <div key={name} className="calendar-day-name">{name}</div>
        ))}
        {cells.map((cell, idx) => (
          <div
            key={idx}
            className={`calendar-cell ${
              !cell.day ? 'empty' :
              cell.isSelected ? 'selected' :
              cell.isToday ? 'today' :
              cell.hasSession && cell.isScheduled ? 'completed' :
              cell.hasSession ? 'training' :
              cell.isScheduled ? 'scheduled' : ''
            }`}
            onClick={() => cell.day && onDayClick(cell.day)}
          >
            {cell.day && (
              <>
                <span className="calendar-cell-day">{cell.day}</span>
                {cell.hasSession && cell.isScheduled && <span className="calendar-cell-dot completed-dot" />}
                {cell.hasSession && !cell.isScheduled && <span className="calendar-cell-dot training" />}
                {cell.isScheduled && !cell.hasSession && <span className="calendar-cell-dot scheduled" />}
              </>
            )}
          </div>
        ))}
      </div>
      <div className="calendar-legend">
        <div className="calendar-legend-item">
          <span className="calendar-legend-dot scheduled" /> Zaplanowany
        </div>
        <div className="calendar-legend-item">
          <span className="calendar-legend-dot training" /> Zrealizowany
        </div>
        <div className="calendar-legend-item">
          <span className="calendar-legend-dot completed-dot" /> Plan + realizacja
        </div>
        <div className="calendar-legend-item">
          <span className="calendar-legend-dot today" /> Dzis
        </div>
      </div>
    </div>
  )
}

// ─── Add Session Form (under calendar) ───

function AddSessionForm({ childId, selectedDate, onSaved, onCancel }) {
  const [title, setTitle] = useState('Trening')
  const [duration, setDuration] = useState(60)
  const [type, setType] = useState('Kort')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.post('/sessions', {
        player: childId,
        date: selectedDate,
        durationMinutes: duration,
        title: `${type}: ${title}`,
        notes: notes || undefined,
        focusAreas: [type],
      })
      onSaved()
    } catch { /* silent */ }
    setSaving(false)
  }

  return (
    <div className="add-session-form card">
      <div className="section-header">
        <h3 className="section-title">
          <Plus size={16} /> Dodaj trening — {new Date(selectedDate).toLocaleDateString('pl-PL')}
        </h3>
        <button className="edit-btn" onClick={onCancel}><X size={14} /></button>
      </div>
      <div className="session-form-grid">
        <div className="session-form-field">
          <label>Typ</label>
          <div className="session-type-btns">
            {SESSION_TYPES.map((t) => (
              <button key={t} className={`session-type-btn ${type === t ? 'active' : ''}`}
                onClick={() => setType(t)}>{t}</button>
            ))}
          </div>
        </div>
        <div className="session-form-field">
          <label>Tytul</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Opis treningu" />
        </div>
        <div className="session-form-field">
          <label>Czas (min)</label>
          <input type="number" min={15} max={300} step={15} value={duration}
            onChange={(e) => setDuration(Number(e.target.value))} />
        </div>
        <div className="session-form-field">
          <label>Notatka (opcjonalnie)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            placeholder="Jak poszlo, co cwiczyliscie..." />
        </div>
      </div>
      <div className="inline-edit-actions">
        <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
          <Save size={14} /> Zapisz trening
        </Button>
        <button className="cancel-btn" onClick={onCancel}>Anuluj</button>
      </div>
    </div>
  )
}

// ─── Milestones Timeline (CRUD) ───

function MilestoneTimeline({ milestones, childId, onUpdate }) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [text, setText] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const resetForm = () => { setText(''); setDate(''); setDescription(''); setAdding(false); setEditingId(null) }

  const startEdit = (m) => {
    setEditingId(m._id)
    setText(m.text)
    setDate(m.date ? new Date(m.date).toISOString().split('T')[0] : '')
    setDescription(m.description || '')
  }

  const handleAdd = async () => {
    if (!text.trim()) return
    setSaving(true)
    try {
      await api.post(`/players/${childId}/milestones`, {
        text, date: date || null, description: description || null,
      })
      onUpdate(); resetForm()
    } catch { /* silent */ }
    setSaving(false)
  }

  const handleUpdate = async () => {
    if (!text.trim()) return
    setSaving(true)
    try {
      await api.put(`/players/${childId}/milestones/${editingId}`, {
        text, date: date || null, description: description || null,
      })
      onUpdate(); resetForm()
    } catch { /* silent */ }
    setSaving(false)
  }

  const handleToggle = async (m) => {
    try {
      await api.put(`/players/${childId}/milestones/${m._id}`, { completed: !m.completed })
      onUpdate()
    } catch { /* silent */ }
  }

  const handleDelete = async (m) => {
    try {
      await api.delete(`/players/${childId}/milestones/${m._id}`)
      onUpdate()
    } catch { /* silent */ }
  }

  const active = (milestones || []).filter((m) => !m.completed)
  const completed = (milestones || []).filter((m) => m.completed)

  return (
    <div className="milestones card">
      <div className="section-header">
        <h3 className="section-title"><Award size={16} /> Kamienie milowe</h3>
        {!adding && !editingId && (
          <button className="edit-btn" onClick={() => setAdding(true)}><Plus size={14} /></button>
        )}
      </div>

      {(adding || editingId) && (
        <div className="milestone-form">
          <input placeholder="Cel / kamien milowy" value={text} onChange={(e) => setText(e.target.value)} />
          <div className="milestone-form-row">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <input placeholder="Opis (opcjonalnie)" value={description}
              onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="inline-edit-actions">
            <Button variant="primary" size="sm" loading={saving}
              onClick={editingId ? handleUpdate : handleAdd}>
              <Save size={14} /> {editingId ? 'Zapisz' : 'Dodaj'}
            </Button>
            <button className="cancel-btn" onClick={resetForm}>Anuluj</button>
          </div>
        </div>
      )}

      {active.length === 0 && completed.length === 0 && !adding && (
        <div className="empty-hint">Dodaj pierwszy kamien milowy aby sledzic postepy</div>
      )}

      <div className="milestones-list">
        {active.map((m) => (
          <div key={m._id} className="milestone-item">
            <div className="milestone-line" />
            <button className="milestone-dot" onClick={() => handleToggle(m)}>
              <Circle size={16} />
            </button>
            <div className="milestone-content">
              <div className="milestone-text">{m.text}</div>
              {m.date && (
                <div className="milestone-date">
                  {new Date(m.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              )}
              {m.description && <div className="milestone-desc">{m.description}</div>}
            </div>
            <div className="milestone-actions">
              <button onClick={() => startEdit(m)}><Edit3 size={12} /></button>
              <button onClick={() => handleDelete(m)}><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
        {completed.map((m) => (
          <div key={m._id} className="milestone-item completed">
            <div className="milestone-line" />
            <button className="milestone-dot" onClick={() => handleToggle(m)}>
              <CheckCircle2 size={16} />
            </button>
            <div className="milestone-content">
              <div className="milestone-text">{m.text}</div>
              {m.completedAt && (
                <div className="milestone-date">
                  Ukonczone {new Date(m.completedAt).toLocaleDateString('pl-PL')}
                </div>
              )}
            </div>
            <div className="milestone-actions">
              <button onClick={() => handleDelete(m)}><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ───

export default function TrainingPlan() {
  const user = useAuthStore((s) => s.user)
  const toast = useToast()
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [sessions, setSessions] = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchChildren = useCallback(async () => {
    try {
      const { data: playersRaw } = await api.get('/players')
      const players = Array.isArray(playersRaw) ? playersRaw : playersRaw.players || []
      const childIds = user?.parentProfile?.children || []
      const myChildren = childIds.length > 0
        ? players.filter((p) => childIds.includes(p._id))
        : players
      setChildren(myChildren)
      return myChildren
    } catch {
      return []
    }
  }, [user])

  const fetchSessions = useCallback(async (playerId, month) => {
    try {
      const monthStr = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
      const { data } = await api.get(`/sessions?player=${playerId}&month=${monthStr}`)
      setSessions(Array.isArray(data) ? data : data.sessions || [])
    } catch {
      setSessions([])
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const kids = await fetchChildren()
      if (kids.length > 0) {
        setSelectedChild(kids[0])
        await fetchSessions(kids[0]._id, currentMonth)
      }
      setLoading(false)
    }
    init()
  }, [user])

  useEffect(() => {
    if (selectedChild) fetchSessions(selectedChild._id, currentMonth)
  }, [currentMonth, selectedChild])

  const refreshChild = async () => {
    const kids = await fetchChildren()
    const updated = kids.find((k) => k._id === selectedChild?._id)
    if (updated) setSelectedChild(updated)
  }

  const refreshAll = async () => {
    await refreshChild()
    if (selectedChild) await fetchSessions(selectedChild._id, currentMonth)
  }

  const handleMonthChange = (delta) => {
    setSelectedDay(null)
    setCurrentMonth((prev) => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() + delta)
      return d
    })
  }

  const handleDayClick = (day) => {
    setSelectedDay(selectedDay === day ? null : day)
  }

  const handleSessionSaved = async () => {
    toast.success('Trening dodany')
    setSelectedDay(null)
    await refreshAll()
  }

  if (loading) {
    return (
      <div className="training-plan-page">
        <h1 className="page-title">Plan treningowy</h1>
        <div className="training-plan-loading">Ladowanie...</div>
      </div>
    )
  }

  if (!selectedChild) {
    return (
      <div className="training-plan-page">
        <h1 className="page-title">Plan treningowy</h1>
        <div className="training-plan-empty">Brak przypisanych zawodnikow</div>
      </div>
    )
  }

  const plan = selectedChild.trainingPlan || {}

  // Weekly stats
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  weekStart.setHours(0, 0, 0, 0)
  const thisWeekSessions = sessions.filter((s) => new Date(s.date) >= weekStart)
  const thisWeekHours = thisWeekSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / 60

  // Selected date for add-session form
  const selectedDate = selectedDay
    ? `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    : null

  return (
    <div className="training-plan-page">
      {/* Child selector */}
      {children.length > 1 && (
        <div className="child-selector">
          {children.map((child) => (
            <button
              key={child._id}
              className={`child-selector-btn ${selectedChild?._id === child._id ? 'active' : ''}`}
              onClick={() => { setSelectedChild(child); setSelectedDay(null) }}
            >
              <Avatar firstName={child.firstName} lastName={child.lastName} size={28} role="player" />
              <span>{child.firstName}</span>
            </button>
          ))}
        </div>
      )}

      <h1 className="page-title">Plan treningowy — {selectedChild.firstName}</h1>

      <WeeklyProgress
        plan={plan}
        sessionsCompleted={thisWeekSessions.length}
        hoursCompleted={thisWeekHours}
        childId={selectedChild._id}
        onUpdate={refreshChild}
      />

      <ScheduledDays plan={plan} childId={selectedChild._id} onUpdate={refreshChild} />

      <FocusAreas plan={plan} childId={selectedChild._id} onUpdate={refreshChild} />

      <TrainingCalendar
        sessions={sessions}
        scheduledDays={plan.scheduledDays || []}
        currentMonth={currentMonth}
        onMonthChange={handleMonthChange}
        onDayClick={handleDayClick}
        selectedDay={selectedDay}
      />

      {selectedDay && (
        <AddSessionForm
          childId={selectedChild._id}
          selectedDate={selectedDate}
          onSaved={handleSessionSaved}
          onCancel={() => setSelectedDay(null)}
        />
      )}

      <MilestoneTimeline
        milestones={plan.milestones || []}
        childId={selectedChild._id}
        onUpdate={refreshChild}
      />
    </div>
  )
}
