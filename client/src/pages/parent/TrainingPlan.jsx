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
  Swords,
  Trophy,
  Heart,
  StretchHorizontal,
} from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import useToast from '../../hooks/useToast'
import Avatar from '../../components/ui/Avatar/Avatar'
import Button from '../../components/ui/Button/Button'
import './TrainingPlan.css'

const DAY_NAMES = ['Pon', 'Wt', 'Sr', 'Czw', 'Pt', 'Sb', 'Nd']
const DAY_NAMES_FULL = ['Poniedzialek', 'Wtorek', 'Sroda', 'Czwartek', 'Piatek', 'Sobota', 'Niedziela']
const DAY_NUMBERS = [1, 2, 3, 4, 5, 6, 7]
const MONTH_NAMES = [
  'Styczen', 'Luty', 'Marzec', 'Kwiecien', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpien', 'Wrzesien', 'Pazdziernik', 'Listopad', 'Grudzien'
]
const PRESET_FOCUS = ['Serwis', 'Forhend', 'Bekhend', 'Wolej', 'Taktyka', 'Kondycja', 'Return', 'Gra podwojna']
const DURATION_PRESETS = [15, 30, 45, 60, 90, 120]

const SESSION_TYPES = {
  kort:         { label: 'Kort',         color: 'var(--color-green)',  bg: 'var(--color-green-bg)',  icon: Target },
  sparing:      { label: 'Sparing',      color: 'var(--color-amber)',  bg: 'var(--color-amber-bg)',  icon: Swords },
  kondycja:     { label: 'Kondycja',     color: 'var(--color-blue)',   bg: 'var(--color-blue-bg)',   icon: Dumbbell },
  rozciaganie:  { label: 'Rozciaganie',  color: 'var(--color-purple)', bg: 'var(--color-purple-bg)', icon: Heart },
  mecz:         { label: 'Mecz',         color: 'var(--color-heart)',  bg: 'var(--color-heart-bg)',  icon: Trophy },
  inne:         { label: 'Inne',         color: 'var(--color-text-tertiary)', bg: 'var(--color-bg-tertiary)', icon: Circle },
}

function getWeekStart(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function dateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function sessionsForDate(sessions, d) {
  const ds = dateStr(d)
  return sessions.filter((s) => {
    const sd = new Date(s.date)
    return dateStr(sd) === ds
  }).sort((a, b) => (a.startTime || '99:99').localeCompare(b.startTime || '99:99'))
}

function totalMinutes(entries) {
  return entries.reduce((sum, s) => sum + (s.durationMinutes || 0), 0)
}

function formatDuration(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

// ─── Session Entry Row ───

function SessionEntry({ session, onDelete }) {
  const typeInfo = SESSION_TYPES[session.sessionType] || SESSION_TYPES.inne
  const Icon = typeInfo.icon

  return (
    <div className="session-entry" style={{ '--entry-color': typeInfo.color, '--entry-bg': typeInfo.bg }}>
      <div className="session-entry-bar" />
      <div className="session-entry-icon"><Icon size={14} /></div>
      <div className="session-entry-body">
        <div className="session-entry-title">{session.title}</div>
        <div className="session-entry-meta">
          {session.startTime && <span>{session.startTime}</span>}
          <span>{formatDuration(session.durationMinutes)}</span>
          <span className="session-entry-type">{typeInfo.label}</span>
        </div>
        {session.notes && <div className="session-entry-notes">{session.notes}</div>}
      </div>
      {onDelete && (
        <button className="session-entry-delete" onClick={() => onDelete(session)}><Trash2 size={12} /></button>
      )}
    </div>
  )
}

// ─── Weekly Summary Bar ───

function WeeklySummary({ sessions, plan }) {
  const total = totalMinutes(sessions)
  const byType = {}
  sessions.forEach((s) => {
    const t = s.sessionType || 'inne'
    byType[t] = (byType[t] || 0) + (s.durationMinutes || 0)
  })
  const goalHours = plan?.weeklyGoal?.hoursPerWeek || 8
  const pct = Math.min(100, (total / 60 / goalHours) * 100)

  return (
    <div className="weekly-summary card">
      <div className="weekly-summary-header">
        <span className="weekly-summary-total">{formatDuration(total)}</span>
        <span className="weekly-summary-goal">/ {goalHours}h cel</span>
      </div>
      <div className="weekly-progress-bar"><div className="weekly-progress-fill" style={{ width: `${pct}%` }} /></div>
      <div className="weekly-summary-types">
        {Object.entries(byType).map(([type, mins]) => {
          const info = SESSION_TYPES[type] || SESSION_TYPES.inne
          return (
            <div key={type} className="weekly-type-chip" style={{ '--chip-color': info.color, '--chip-bg': info.bg }}>
              <span className="weekly-type-dot" />
              <span>{info.label}</span>
              <span className="weekly-type-mins">{formatDuration(mins)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Week Agenda View ───

function WeekAgenda({ sessions, scheduledDays, weekStart, onAddClick, selectedDate, onDeleteSession }) {
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    days.push(d)
  }
  const today = dateStr(new Date())

  return (
    <div className="week-agenda">
      {days.map((d, idx) => {
        const ds = dateStr(d)
        const entries = sessionsForDate(sessions, d)
        const dayNum = d.getDay() === 0 ? 7 : d.getDay()
        const isScheduled = scheduledDays.includes(dayNum)
        const isToday = ds === today
        const dayMins = totalMinutes(entries)

        return (
          <div key={ds} className={`week-day-col ${isToday ? 'today' : ''} ${selectedDate === ds ? 'selected' : ''}`}>
            <div className="week-day-header">
              <span className="week-day-name">{DAY_NAMES[idx]}</span>
              <span className="week-day-date">{d.getDate()}</span>
              {isScheduled && entries.length === 0 && <span className="week-day-scheduled" title="Zaplanowany">●</span>}
            </div>
            <div className="week-day-entries">
              {entries.map((s) => (
                <SessionEntry key={s._id} session={s} onDelete={onDeleteSession} />
              ))}
              {entries.length === 0 && isScheduled && (
                <div className="week-day-empty-slot">Zaplanowany trening</div>
              )}
            </div>
            <div className="week-day-footer">
              {dayMins > 0 && <span className="week-day-sum">{formatDuration(dayMins)}</span>}
              <button className="week-day-add" onClick={() => onAddClick(ds)}>
                <Plus size={14} /> Dodaj
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Month Calendar View ───

function MonthCalendar({ sessions, scheduledDays, currentMonth, onMonthChange, onDayClick, selectedDay }) {
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
    const entries = sessionsForDate(sessions, date)
    const isScheduled = scheduledDays.includes(dayOfWeek)
    const isToday = new Date().toDateString() === date.toDateString()
    const isSelected = selectedDay === d

    // Collect unique session types for dots
    const types = [...new Set(entries.map((s) => s.sessionType || 'inne'))]

    cells.push({ day: d, entries, types, isScheduled, isToday, isSelected, hasEntries: entries.length > 0 })
  }

  return (
    <div className="month-calendar card">
      <div className="month-calendar-header">
        <button className="calendar-nav" onClick={() => onMonthChange(-1)}><ChevronLeft size={16} /></button>
        <span className="calendar-month">{MONTH_NAMES[month]} {year}</span>
        <button className="calendar-nav" onClick={() => onMonthChange(1)}><ChevronRight size={16} /></button>
      </div>
      <div className="calendar-grid">
        {DAY_NAMES.map((name) => <div key={name} className="calendar-day-name">{name}</div>)}
        {cells.map((cell, idx) => (
          <div
            key={idx}
            className={`calendar-cell ${
              !cell.day ? 'empty' :
              cell.isSelected ? 'selected' :
              cell.isToday ? 'today' :
              cell.hasEntries ? 'has-entries' :
              cell.isScheduled ? 'scheduled' : ''
            }`}
            onClick={() => cell.day && onDayClick(cell.day)}
          >
            {cell.day && (
              <>
                <span className="calendar-cell-day">{cell.day}</span>
                <div className="calendar-cell-dots">
                  {cell.types.map((t) => (
                    <span key={t} className="calendar-type-dot" style={{ background: (SESSION_TYPES[t] || SESSION_TYPES.inne).color }} />
                  ))}
                  {cell.isScheduled && !cell.hasEntries && <span className="calendar-type-dot scheduled-dot" />}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Day Detail (for month view) ───

function DayDetail({ date, sessions, scheduledDays, onAdd, onDeleteSession }) {
  const d = new Date(date)
  const entries = sessionsForDate(sessions, d)
  const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay()
  const isScheduled = scheduledDays.includes(dayOfWeek)
  const dayIdx = (dayOfWeek + 5) % 7
  const dayMins = totalMinutes(entries)

  return (
    <div className="day-detail card">
      <div className="day-detail-header">
        <span className="day-detail-title">{DAY_NAMES_FULL[dayIdx]}, {d.getDate()} {MONTH_NAMES[d.getMonth()]}</span>
        {dayMins > 0 && <span className="day-detail-sum">{formatDuration(dayMins)}</span>}
      </div>
      {entries.length > 0 ? (
        <div className="day-detail-entries">
          {entries.map((s) => <SessionEntry key={s._id} session={s} onDelete={onDeleteSession} />)}
        </div>
      ) : (
        <div className="day-detail-empty">
          {isScheduled ? 'Zaplanowany dzien treningowy — brak wpisow' : 'Brak treningow'}
        </div>
      )}
      <button className="day-detail-add" onClick={onAdd}><Plus size={14} /> Dodaj trening</button>
    </div>
  )
}

// ─── Add Session Form ───

function AddSessionForm({ childId, selectedDate, onSaved, onCancel }) {
  const [sessionType, setSessionType] = useState('kort')
  const [startTime, setStartTime] = useState('10:00')
  const [duration, setDuration] = useState(60)
  const [customDuration, setCustomDuration] = useState(false)
  const [title, setTitle] = useState('Trening techniczny')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Auto-set title when type changes
  const handleTypeChange = (type) => {
    setSessionType(type)
    const titles = { kort: 'Trening techniczny', sparing: 'Sparing', kondycja: 'Trening kondycyjny', rozciaganie: 'Rozciaganie', mecz: 'Mecz', inne: 'Trening' }
    setTitle(titles[type] || 'Trening')
    const durations = { kort: 90, sparing: 120, kondycja: 60, rozciaganie: 30, mecz: 90, inne: 60 }
    setDuration(durations[type] || 60)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.post('/sessions', {
        player: childId,
        date: selectedDate,
        startTime,
        sessionType,
        durationMinutes: duration,
        title,
        notes: notes || undefined,
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

      {/* Session type */}
      <div className="session-form-field">
        <label>Typ treningu</label>
        <div className="session-type-grid">
          {Object.entries(SESSION_TYPES).map(([key, info]) => {
            const Icon = info.icon
            return (
              <button key={key}
                className={`session-type-card ${sessionType === key ? 'active' : ''}`}
                style={{ '--type-color': info.color, '--type-bg': info.bg }}
                onClick={() => handleTypeChange(key)}
              >
                <Icon size={16} />
                <span>{info.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="session-form-row-2">
        {/* Start time */}
        <div className="session-form-field">
          <label>Godzina</label>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>

        {/* Duration */}
        <div className="session-form-field">
          <label>Czas trwania</label>
          {!customDuration ? (
            <div className="duration-presets">
              {DURATION_PRESETS.map((d) => (
                <button key={d} className={`duration-btn ${duration === d ? 'active' : ''}`}
                  onClick={() => setDuration(d)}>{d >= 60 ? `${d/60}h` : `${d}m`}</button>
              ))}
              <button className="duration-btn custom" onClick={() => setCustomDuration(true)}>...</button>
            </div>
          ) : (
            <div className="duration-custom">
              <input type="number" min={5} max={300} step={5} value={duration}
                onChange={(e) => setDuration(Number(e.target.value))} />
              <span>min</span>
              <button className="cancel-btn" onClick={() => setCustomDuration(false)}>Gotowe</button>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="session-form-field">
        <label>Tytul</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Opis treningu" />
      </div>

      {/* Notes */}
      <div className="session-form-field">
        <label>Notatka (opcjonalnie)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
          placeholder="Jak poszlo, co cwiczyliscie..." />
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

// ─── Scheduled Days ───

function ScheduledDays({ plan, childId, onUpdate }) {
  const [days, setDays] = useState(plan?.scheduledDays || [])
  const [saving, setSaving] = useState(false)

  useEffect(() => { setDays(plan?.scheduledDays || []) }, [plan])

  const toggle = async (day) => {
    const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort()
    setDays(next)
    setSaving(true)
    try { await api.put(`/players/${childId}/training-plan`, { scheduledDays: next }); onUpdate() } catch {}
    setSaving(false)
  }

  return (
    <div className="scheduled-days card">
      <h3 className="section-title"><Calendar size={16} /> Dni treningowe</h3>
      <div className="days-grid">
        {DAY_NUMBERS.map((num, idx) => (
          <button key={num} className={`day-btn ${days.includes(num) ? 'active' : ''}`}
            onClick={() => toggle(num)} disabled={saving}>{DAY_NAMES[idx]}</button>
        ))}
      </div>
    </div>
  )
}

// ─── Focus Areas ───

function FocusAreas({ plan, childId, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [focus, setFocus] = useState(plan?.focus || [])
  const [notes, setNotes] = useState(plan?.notes || '')
  const [customTag, setCustomTag] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { setFocus(plan?.focus || []); setNotes(plan?.notes || '') }, [plan])

  const toggleTag = (tag) => setFocus((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
  const addCustom = () => { const t = customTag.trim(); if (t && !focus.includes(t)) { setFocus((p) => [...p, t]); setCustomTag('') } }

  const handleSave = async () => {
    setSaving(true)
    try { await api.put(`/players/${childId}/training-plan`, { focus, notes: notes || null }); onUpdate(); setEditing(false) } catch {}
    setSaving(false)
  }

  return (
    <div className="focus-areas card">
      <div className="section-header">
        <h3 className="section-title"><Target size={16} /> Obszary fokusa</h3>
        {!editing && <button className="edit-btn" onClick={() => setEditing(true)}><Edit3 size={14} /></button>}
      </div>
      {editing ? (
        <div className="inline-edit-form">
          <div className="focus-tags-edit">
            {PRESET_FOCUS.map((tag) => (
              <button key={tag} className={`focus-tag-btn ${focus.includes(tag) ? 'active' : ''}`} onClick={() => toggleTag(tag)}>{tag}</button>
            ))}
            {focus.filter((t) => !PRESET_FOCUS.includes(t)).map((tag) => (
              <button key={tag} className="focus-tag-btn active custom" onClick={() => toggleTag(tag)}>{tag} <X size={12} /></button>
            ))}
          </div>
          <div className="custom-tag-row">
            <input placeholder="Wlasny tag..." value={customTag} onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom())} />
            <button className="add-tag-btn" onClick={addCustom}><Plus size={14} /></button>
          </div>
          <textarea placeholder="Notatki" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          <div className="inline-edit-actions">
            <Button variant="primary" size="sm" onClick={handleSave} loading={saving}><Save size={14} /> Zapisz</Button>
            <button className="cancel-btn" onClick={() => setEditing(false)}>Anuluj</button>
          </div>
        </div>
      ) : (
        <>
          {focus.length > 0 ? (
            <div className="focus-areas-tags">{focus.map((tag, idx) => <span key={idx} className="focus-area-tag">{tag}</span>)}</div>
          ) : <div className="empty-hint">Kliknij edytuj aby dodac obszary fokusa</div>}
          {notes && <div className="focus-areas-notes"><div className="focus-areas-notes-label">Notatki</div><p>{notes}</p></div>}
        </>
      )}
    </div>
  )
}

// ─── Milestones ───

function MilestoneTimeline({ milestones, childId, onUpdate }) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [text, setText] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const resetForm = () => { setText(''); setDate(''); setDescription(''); setAdding(false); setEditingId(null) }
  const startEdit = (m) => { setEditingId(m._id); setText(m.text); setDate(m.date ? new Date(m.date).toISOString().split('T')[0] : ''); setDescription(m.description || '') }

  const handleAdd = async () => { if (!text.trim()) return; setSaving(true); try { await api.post(`/players/${childId}/milestones`, { text, date: date || null, description: description || null }); onUpdate(); resetForm() } catch {} setSaving(false) }
  const handleUpdate = async () => { if (!text.trim()) return; setSaving(true); try { await api.put(`/players/${childId}/milestones/${editingId}`, { text, date: date || null, description: description || null }); onUpdate(); resetForm() } catch {} setSaving(false) }
  const handleToggle = async (m) => { try { await api.put(`/players/${childId}/milestones/${m._id}`, { completed: !m.completed }); onUpdate() } catch {} }
  const handleDelete = async (m) => { try { await api.delete(`/players/${childId}/milestones/${m._id}`); onUpdate() } catch {} }

  const active = (milestones || []).filter((m) => !m.completed)
  const completed = (milestones || []).filter((m) => m.completed)

  return (
    <div className="milestones card">
      <div className="section-header">
        <h3 className="section-title"><Award size={16} /> Kamienie milowe</h3>
        {!adding && !editingId && <button className="edit-btn" onClick={() => setAdding(true)}><Plus size={14} /></button>}
      </div>
      {(adding || editingId) && (
        <div className="milestone-form">
          <input placeholder="Cel / kamien milowy" value={text} onChange={(e) => setText(e.target.value)} />
          <div className="milestone-form-row">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <input placeholder="Opis (opcjonalnie)" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="inline-edit-actions">
            <Button variant="primary" size="sm" loading={saving} onClick={editingId ? handleUpdate : handleAdd}><Save size={14} /> {editingId ? 'Zapisz' : 'Dodaj'}</Button>
            <button className="cancel-btn" onClick={resetForm}>Anuluj</button>
          </div>
        </div>
      )}
      {active.length === 0 && completed.length === 0 && !adding && <div className="empty-hint">Dodaj kamien milowy aby sledzic postepy</div>}
      <div className="milestones-list">
        {active.map((m) => (
          <div key={m._id} className="milestone-item">
            <div className="milestone-line" />
            <button className="milestone-dot" onClick={() => handleToggle(m)}><Circle size={16} /></button>
            <div className="milestone-content">
              <div className="milestone-text">{m.text}</div>
              {m.date && <div className="milestone-date">{new Date(m.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}</div>}
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
            <button className="milestone-dot" onClick={() => handleToggle(m)}><CheckCircle2 size={16} /></button>
            <div className="milestone-content">
              <div className="milestone-text">{m.text}</div>
              {m.completedAt && <div className="milestone-date">Ukonczone {new Date(m.completedAt).toLocaleDateString('pl-PL')}</div>}
            </div>
            <div className="milestone-actions"><button onClick={() => handleDelete(m)}><Trash2 size={12} /></button></div>
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
  const [viewMode, setViewMode] = useState('week') // 'week' | 'month'
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()))
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)
  const [addingDate, setAddingDate] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchChildren = useCallback(async () => {
    try {
      const { data: playersRaw } = await api.get('/players')
      const players = Array.isArray(playersRaw) ? playersRaw : playersRaw.players || []
      const childIds = user?.parentProfile?.children || []
      return childIds.length > 0 ? players.filter((p) => childIds.includes(p._id)) : players
    } catch { return [] }
  }, [user])

  const fetchSessions = useCallback(async (playerId) => {
    try {
      // Fetch 2 months to cover week view crossing month boundary
      const promises = []
      if (viewMode === 'week') {
        const m1 = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}`
        const endOfWeek = new Date(weekStart); endOfWeek.setDate(weekStart.getDate() + 6)
        const m2 = `${endOfWeek.getFullYear()}-${String(endOfWeek.getMonth() + 1).padStart(2, '0')}`
        promises.push(api.get(`/sessions?player=${playerId}&month=${m1}`))
        if (m2 !== m1) promises.push(api.get(`/sessions?player=${playerId}&month=${m2}`))
      } else {
        const m = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`
        promises.push(api.get(`/sessions?player=${playerId}&month=${m}`))
      }
      const results = await Promise.all(promises)
      const all = results.flatMap((r) => { const d = r.data; return Array.isArray(d) ? d : d.sessions || [] })
      // Deduplicate by _id
      const seen = new Set()
      setSessions(all.filter((s) => { if (seen.has(s._id)) return false; seen.add(s._id); return true }))
    } catch { setSessions([]) }
  }, [viewMode, weekStart, currentMonth])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const kids = await fetchChildren()
      setChildren(kids)
      if (kids.length > 0) { setSelectedChild(kids[0]); await fetchSessions(kids[0]._id) }
      setLoading(false)
    }
    init()
  }, [user])

  useEffect(() => {
    if (selectedChild) fetchSessions(selectedChild._id)
  }, [viewMode, weekStart, currentMonth, selectedChild])

  const refreshChild = async () => {
    const kids = await fetchChildren()
    setChildren(kids)
    const updated = kids.find((k) => k._id === selectedChild?._id)
    if (updated) setSelectedChild(updated)
  }

  const refreshAll = async () => {
    await refreshChild()
    if (selectedChild) await fetchSessions(selectedChild._id)
  }

  const handleSessionSaved = async () => {
    toast.success('Trening dodany')
    setAddingDate(null)
    await refreshAll()
  }

  // Week sessions for summary
  const weekSessions = sessions.filter((s) => {
    const sd = new Date(s.date)
    const end = new Date(weekStart); end.setDate(weekStart.getDate() + 7)
    return sd >= weekStart && sd < end
  })

  if (loading) return <div className="training-plan-page"><h1 className="page-title">Plan treningowy</h1><div className="training-plan-loading">Ladowanie...</div></div>
  if (!selectedChild) return <div className="training-plan-page"><h1 className="page-title">Plan treningowy</h1><div className="training-plan-empty">Brak przypisanych zawodnikow</div></div>

  const plan = selectedChild.trainingPlan || {}

  return (
    <div className="training-plan-page">
      {children.length > 1 && (
        <div className="child-selector">
          {children.map((child) => (
            <button key={child._id} className={`child-selector-btn ${selectedChild?._id === child._id ? 'active' : ''}`}
              onClick={() => { setSelectedChild(child); setAddingDate(null); setSelectedDay(null) }}>
              <Avatar firstName={child.firstName} lastName={child.lastName} size={28} role="player" />
              <span>{child.firstName}</span>
            </button>
          ))}
        </div>
      )}

      <h1 className="page-title">Plan treningowy — {selectedChild.firstName}</h1>

      {/* View toggle + navigation */}
      <div className="calendar-controls card">
        <div className="view-toggle">
          <button className={viewMode === 'week' ? 'active' : ''} onClick={() => setViewMode('week')}>Tydzien</button>
          <button className={viewMode === 'month' ? 'active' : ''} onClick={() => setViewMode('month')}>Miesiac</button>
        </div>
        {viewMode === 'week' ? (
          <div className="calendar-nav-row">
            <button className="calendar-nav" onClick={() => setWeekStart((p) => { const d = new Date(p); d.setDate(d.getDate() - 7); return d })}><ChevronLeft size={16} /></button>
            <span className="calendar-range">
              {weekStart.getDate()} {MONTH_NAMES[weekStart.getMonth()].slice(0, 3)} — {(() => { const e = new Date(weekStart); e.setDate(e.getDate() + 6); return `${e.getDate()} ${MONTH_NAMES[e.getMonth()].slice(0, 3)}` })()}
            </span>
            <button className="calendar-nav" onClick={() => setWeekStart((p) => { const d = new Date(p); d.setDate(d.getDate() + 7); return d })}><ChevronRight size={16} /></button>
          </div>
        ) : (
          <div className="calendar-nav-row">
            <button className="calendar-nav" onClick={() => setCurrentMonth((p) => { const d = new Date(p); d.setMonth(d.getMonth() - 1); return d })}><ChevronLeft size={16} /></button>
            <span className="calendar-range">{MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
            <button className="calendar-nav" onClick={() => setCurrentMonth((p) => { const d = new Date(p); d.setMonth(d.getMonth() + 1); return d })}><ChevronRight size={16} /></button>
          </div>
        )}
      </div>

      {/* Weekly summary */}
      {viewMode === 'week' && <WeeklySummary sessions={weekSessions} plan={plan} />}

      {/* Calendar views */}
      {viewMode === 'week' ? (
        <WeekAgenda
          sessions={sessions}
          scheduledDays={plan.scheduledDays || []}
          weekStart={weekStart}
          onAddClick={(ds) => setAddingDate(addingDate === ds ? null : ds)}
          selectedDate={addingDate}
          onDeleteSession={() => refreshAll()}
        />
      ) : (
        <>
          <MonthCalendar
            sessions={sessions}
            scheduledDays={plan.scheduledDays || []}
            currentMonth={currentMonth}
            onMonthChange={(d) => { setCurrentMonth((p) => { const n = new Date(p); n.setMonth(n.getMonth() + d); return n }); setSelectedDay(null) }}
            onDayClick={(d) => setSelectedDay(selectedDay === d ? null : d)}
            selectedDay={selectedDay}
          />
          {selectedDay && (
            <DayDetail
              date={`${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`}
              sessions={sessions}
              scheduledDays={plan.scheduledDays || []}
              onAdd={() => setAddingDate(`${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`)}
              onDeleteSession={() => refreshAll()}
            />
          )}
        </>
      )}

      {/* Add session form */}
      {addingDate && (
        <AddSessionForm
          childId={selectedChild._id}
          selectedDate={addingDate}
          onSaved={handleSessionSaved}
          onCancel={() => setAddingDate(null)}
        />
      )}

      {/* Plan sections */}
      <ScheduledDays plan={plan} childId={selectedChild._id} onUpdate={refreshChild} />
      <FocusAreas plan={plan} childId={selectedChild._id} onUpdate={refreshChild} />
      <MilestoneTimeline milestones={plan.milestones || []} childId={selectedChild._id} onUpdate={refreshChild} />
    </div>
  )
}
