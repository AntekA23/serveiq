import { useState, useEffect, useRef } from 'react'
import { CalendarDays, Target, Plus, Trash2, Save, GripVertical, Clock } from 'lucide-react'
import api from '../../../api/axios'
import { SESSION_TYPES, SURFACES, SURFACE_TYPES, DAY_NAMES_FULL, DAY_NUMBERS } from './constants'
import MilestoneTimeline from './MilestoneTimeline'
import PlanRecommendationBar from '../../../components/player/PlanRecommendationBar'

const DURATION_OPTIONS = [30, 45, 60, 75, 90, 120]

function formatDur(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h${m}m`
}

function ScheduleItem({ item, onUpdate, onDelete }) {
  const typeInfo = SESSION_TYPES[item.sessionType] || SESSION_TYPES.inne
  const Icon = typeInfo.icon
  const showSurface = SURFACE_TYPES.includes(item.sessionType)

  return (
    <div className="tp-sched-item" style={{ '--si-color': typeInfo.color, '--si-bg': typeInfo.bg }}>
      <div className="tp-sched-item-bar" />
      <div className="tp-sched-item-icon"><Icon size={14} /></div>
      <div className="tp-sched-item-body">
        <div className="tp-sched-item-row">
          <select
            className="tp-sched-select type"
            value={item.sessionType}
            onChange={(e) => onUpdate({ ...item, sessionType: e.target.value })}
          >
            {Object.entries(SESSION_TYPES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          {showSurface && (
            <select
              className="tp-sched-select surface"
              value={item.surface || 'clay'}
              onChange={(e) => onUpdate({ ...item, surface: e.target.value })}
            >
              {Object.entries(SURFACES).map(([k, v]) => (
                <option key={k} value={k}>{v.emoji} {v.label}</option>
              ))}
            </select>
          )}
        </div>
        <div className="tp-sched-item-row">
          <div className="tp-sched-time-group">
            <Clock size={12} />
            <input
              type="time"
              className="tp-sched-time"
              value={item.startTime || ''}
              onChange={(e) => onUpdate({ ...item, startTime: e.target.value })}
            />
          </div>
          <select
            className="tp-sched-select dur"
            value={item.durationMinutes}
            onChange={(e) => onUpdate({ ...item, durationMinutes: Number(e.target.value) })}
          >
            {DURATION_OPTIONS.map((d) => (
              <option key={d} value={d}>{formatDur(d)}</option>
            ))}
          </select>
          <input
            className="tp-sched-notes"
            placeholder="Notatka..."
            value={item.notes || ''}
            onChange={(e) => onUpdate({ ...item, notes: e.target.value })}
          />
        </div>
      </div>
      <button className="tp-sched-del" onClick={onDelete}><Trash2 size={13} /></button>
    </div>
  )
}

function DayBlock({ day, dayIndex, items, onAdd, onUpdate, onDelete }) {
  const totalMins = items.reduce((s, i) => s + i.durationMinutes, 0)

  return (
    <div className={`tp-sched-day ${items.length > 0 ? 'has-items' : ''}`}>
      <div className="tp-sched-day-header">
        <span className="tp-sched-day-name">{DAY_NAMES_FULL[dayIndex]}</span>
        {items.length > 0 && (
          <span className="tp-sched-day-summary">
            {items.length} {items.length === 1 ? 'trening' : items.length < 5 ? 'treningi' : 'treningow'} · {formatDur(totalMins)}
          </span>
        )}
        <button className="tp-sched-day-add" onClick={() => onAdd(day)} title="Dodaj trening">
          <Plus size={13} />
        </button>
      </div>
      {items.length > 0 && (
        <div className="tp-sched-day-items">
          {items.map((item) => (
            <ScheduleItem
              key={item._id || item._tempId}
              item={item}
              onUpdate={(updated) => onUpdate(item._id || item._tempId, updated)}
              onDelete={() => onDelete(item._id || item._tempId)}
            />
          ))}
        </div>
      )}
      {items.length === 0 && (
        <div className="tp-sched-day-empty">Dzien wolny</div>
      )}
    </div>
  )
}

export default function PlanTab({ child, plan, onRefresh }) {
  const childId = child?._id
  const [schedule, setSchedule] = useState([])
  const [focus, setFocus] = useState([])
  const [customTag, setCustomTag] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const saveTimeout = useRef(null)
  let tempIdCounter = useRef(0)

  // Init from plan
  useEffect(() => {
    const ws = plan?.weeklySchedule || []
    // Add temp IDs for items without _id
    setSchedule(ws.map((item) => ({
      ...item,
      _tempId: item._id || `temp-${++tempIdCounter.current}`,
    })))
    setFocus(plan?.focus || [])
    setNotes(plan?.notes || '')
    setDirty(false)
  }, [plan])

  // Auto-save with debounce
  const doSave = async (newSchedule, newFocus, newNotes) => {
    setSaving(true)
    try {
      const cleanSchedule = newSchedule.map(({ _tempId, surface, ...rest }) => rest)
      await api.put(`/players/${childId}/training-plan`, {
        weeklySchedule: cleanSchedule,
        focus: newFocus,
        notes: newNotes || null,
      })
      onRefresh()
    } catch { /* silent */ }
    setSaving(false)
    setDirty(false)
  }

  const scheduleSave = (newSchedule, newFocus, newNotes) => {
    setDirty(true)
    clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => doSave(newSchedule, newFocus, newNotes), 800)
  }

  // Schedule CRUD
  const addItem = (day) => {
    const newItem = {
      _tempId: `temp-${++tempIdCounter.current}`,
      day,
      sessionType: 'kort',
      durationMinutes: 90,
      startTime: '16:00',
      notes: '',
    }
    const next = [...schedule, newItem]
    setSchedule(next)
    scheduleSave(next, focus, notes)
  }

  const updateItem = (id, updated) => {
    const next = schedule.map((s) => (s._id === id || s._tempId === id) ? { ...updated, _tempId: id } : s)
    setSchedule(next)
    scheduleSave(next, focus, notes)
  }

  const deleteItem = (id) => {
    const next = schedule.filter((s) => s._id !== id && s._tempId !== id)
    setSchedule(next)
    scheduleSave(next, focus, notes)
  }

  // Focus
  const PRESET_FOCUS = ['Serwis', 'Forhend', 'Bekhend', 'Wolej', 'Taktyka', 'Kondycja', 'Return', 'Gra podwojna']

  const toggleFocus = (tag) => {
    const next = focus.includes(tag) ? focus.filter((t) => t !== tag) : [...focus, tag]
    setFocus(next)
    scheduleSave(schedule, next, notes)
  }

  const addCustomFocus = () => {
    const t = customTag.trim()
    if (t && !focus.includes(t)) {
      const next = [...focus, t]
      setFocus(next)
      setCustomTag('')
      scheduleSave(schedule, next, notes)
    }
  }

  const saveNotes = () => {
    scheduleSave(schedule, focus, notes)
  }

  // Summary
  const totalSessions = schedule.length
  const totalMins = schedule.reduce((s, i) => s + i.durationMinutes, 0)
  const activeDays = [...new Set(schedule.map((s) => s.day))].length

  return (
    <div className="tp-plan">
      <PlanRecommendationBar playerId={childId} />
      {/* Weekly overview banner */}
      <div className="tp-plan-overview">
        <div className="tp-plan-stat">
          <span className="tp-plan-stat-value">{totalSessions}</span>
          <span className="tp-plan-stat-label">{totalSessions === 1 ? 'trening' : 'treningow'} / tydz</span>
        </div>
        <div className="tp-plan-stat">
          <span className="tp-plan-stat-value">{formatDur(totalMins)}</span>
          <span className="tp-plan-stat-label">lacznie</span>
        </div>
        <div className="tp-plan-stat">
          <span className="tp-plan-stat-value">{activeDays}</span>
          <span className="tp-plan-stat-label">{activeDays === 1 ? 'dzien' : 'dni'} aktywnych</span>
        </div>
        {(saving || dirty) && (
          <span className="tp-plan-saving">{saving ? 'Zapisywanie...' : 'Niezapisane'}</span>
        )}
      </div>

      {/* Weekly schedule builder */}
      <div className="tp-section">
        <h3><CalendarDays size={16} /> Tygodniowy harmonogram</h3>
        <div className="tp-sched-days">
          {DAY_NUMBERS.map((day, idx) => (
            <DayBlock
              key={day}
              day={day}
              dayIndex={idx}
              items={schedule.filter((s) => s.day === day).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))}
              onAdd={addItem}
              onUpdate={updateItem}
              onDelete={deleteItem}
            />
          ))}
        </div>
      </div>

      {/* Focus areas */}
      <div className="tp-section">
        <h3><Target size={16} /> Obszary fokusa</h3>
        <div className="tp-focus-tags">
          {PRESET_FOCUS.map((tag) => (
            <button key={tag} className={`tp-focus-tag ${focus.includes(tag) ? 'active' : ''}`}
              onClick={() => toggleFocus(tag)}>{tag}</button>
          ))}
          {focus.filter((t) => !PRESET_FOCUS.includes(t)).map((tag) => (
            <button key={tag} className="tp-focus-tag active custom" onClick={() => toggleFocus(tag)}>{tag} ×</button>
          ))}
        </div>
        <div className="tp-focus-custom">
          <input placeholder="Wlasny tag..." value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomFocus())} />
          <button onClick={addCustomFocus}><Plus size={14} /></button>
        </div>
        <textarea className="tp-notes" placeholder="Notatki do planu..." value={notes}
          onChange={(e) => setNotes(e.target.value)} onBlur={saveNotes} rows={2} />
      </div>

      {/* Milestones */}
      <MilestoneTimeline milestones={plan?.milestones || []} childId={childId} onUpdate={onRefresh} />
    </div>
  )
}
