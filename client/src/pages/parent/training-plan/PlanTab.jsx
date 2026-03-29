import { useState, useEffect, useRef } from 'react'
import { Dumbbell, Calendar, Target, Plus } from 'lucide-react'
import api from '../../../api/axios'
import { DAY_NAMES, DAY_NUMBERS } from './constants'
import MilestoneTimeline from './MilestoneTimeline'

const PRESET_FOCUS = ['Serwis', 'Forhend', 'Bekhend', 'Wolej', 'Taktyka', 'Kondycja', 'Return', 'Gra podwojna']

export default function PlanTab({ child, plan, onRefresh }) {
  const childId = child?._id

  // ── Weekly Goal (inline edit, auto-save) ──
  const [sessionsGoal, setSessionsGoal] = useState(plan?.weeklyGoal?.sessionsPerWeek || 5)
  const [hoursGoal, setHoursGoal] = useState(plan?.weeklyGoal?.hoursPerWeek || 8)
  const goalTimeout = useRef(null)

  useEffect(() => {
    setSessionsGoal(plan?.weeklyGoal?.sessionsPerWeek || 5)
    setHoursGoal(plan?.weeklyGoal?.hoursPerWeek || 8)
  }, [plan])

  const saveGoal = (sessions, hours) => {
    clearTimeout(goalTimeout.current)
    goalTimeout.current = setTimeout(async () => {
      try { await api.put(`/players/${childId}/training-plan`, { weeklyGoal: { sessionsPerWeek: sessions, hoursPerWeek: hours } }); onRefresh() } catch {}
    }, 600)
  }

  // ── Scheduled Days (instant save) ──
  const [days, setDays] = useState(plan?.scheduledDays || [])
  useEffect(() => { setDays(plan?.scheduledDays || []) }, [plan])

  const toggleDay = async (day) => {
    const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort()
    setDays(next)
    try { await api.put(`/players/${childId}/training-plan`, { scheduledDays: next }); onRefresh() } catch {}
  }

  // ── Focus (click = toggle + auto-save) ──
  const [focus, setFocus] = useState(plan?.focus || [])
  const [customTag, setCustomTag] = useState('')
  useEffect(() => { setFocus(plan?.focus || []) }, [plan])

  const saveFocus = async (newFocus) => {
    try { await api.put(`/players/${childId}/training-plan`, { focus: newFocus }); onRefresh() } catch {}
  }

  const toggleFocus = (tag) => {
    const next = focus.includes(tag) ? focus.filter((t) => t !== tag) : [...focus, tag]
    setFocus(next)
    saveFocus(next)
  }

  const addCustomFocus = () => {
    const t = customTag.trim()
    if (t && !focus.includes(t)) {
      const next = [...focus, t]
      setFocus(next)
      setCustomTag('')
      saveFocus(next)
    }
  }

  // ── Notes (auto-save on blur) ──
  const [notes, setNotes] = useState(plan?.notes || '')
  useEffect(() => { setNotes(plan?.notes || '') }, [plan])

  const saveNotes = async () => {
    try { await api.put(`/players/${childId}/training-plan`, { notes: notes || null }); onRefresh() } catch {}
  }

  return (
    <div className="tp-plan">
      {/* Weekly goal */}
      <div className="tp-section">
        <h3><Dumbbell size={16} /> Cel tygodniowy</h3>
        <div className="tp-goal-row">
          <label>Treningi / tydz</label>
          <input type="number" min={0} max={14} value={sessionsGoal}
            onChange={(e) => { const v = Number(e.target.value); setSessionsGoal(v); saveGoal(v, hoursGoal) }} />
        </div>
        <div className="tp-goal-row">
          <label>Godziny / tydz</label>
          <input type="number" min={0} max={40} value={hoursGoal}
            onChange={(e) => { const v = Number(e.target.value); setHoursGoal(v); saveGoal(sessionsGoal, v) }} />
        </div>
      </div>

      {/* Scheduled days */}
      <div className="tp-section">
        <h3><Calendar size={16} /> Dni treningowe</h3>
        <div className="tp-days">
          {DAY_NUMBERS.map((num, idx) => (
            <button key={num} className={`tp-day-btn ${days.includes(num) ? 'active' : ''}`}
              onClick={() => toggleDay(num)}>{DAY_NAMES[idx]}</button>
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
        <textarea className="tp-notes" placeholder="Notatki..." value={notes}
          onChange={(e) => setNotes(e.target.value)} onBlur={saveNotes} rows={2} />
      </div>

      {/* Milestones */}
      <MilestoneTimeline milestones={plan?.milestones || []} childId={childId} onUpdate={onRefresh} />
    </div>
  )
}
