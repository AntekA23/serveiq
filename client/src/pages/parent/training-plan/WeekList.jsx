import { Plus, CalendarCheck } from 'lucide-react'
import { DAY_NAMES, SESSION_TYPES, dateStr, sessionsForDate, totalMinutes, formatDuration } from './constants'
import SessionEntry from './SessionEntry'

export default function WeekList({ sessions, scheduledDays, plannedSchedule = [], weekStart, addingDate, onAddClick, onDeleteSession }) {
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    days.push(d)
  }
  const today = dateStr(new Date())

  return (
    <div className="tp-weeklist">
      {days.map((d, idx) => {
        const ds = dateStr(d)
        const entries = sessionsForDate(sessions, d)
        const dayNum = d.getDay() === 0 ? 7 : d.getDay()
        const isScheduled = scheduledDays.includes(dayNum)
        const isToday = ds === today
        const mins = totalMinutes(entries)

        // Planned sessions for this day of week
        const planned = plannedSchedule.filter((s) => s.day === dayNum)
        const hasPlanned = planned.length > 0

        // Check which planned sessions are "covered" by actual sessions
        const coveredTypes = new Set(entries.map((e) => e.sessionType || 'inne'))

        return (
          <div key={ds} className={`tp-day ${isToday ? 'today' : ''} ${entries.length > 0 ? 'has-entries' : ''}`}>
            {/* Day header */}
            <div className="tp-day-header">
              <div className="tp-day-label">
                <span className="tp-day-name">{DAY_NAMES[idx]}</span>
                <span className="tp-day-date">{d.getDate()}.{String(d.getMonth() + 1).padStart(2, '0')}</span>
              </div>
              <div className="tp-day-info">
                {entries.length > 0 && (
                  <>
                    <div className="tp-day-dots">
                      {[...new Set(entries.map((s) => s.sessionType || 'inne'))].map((t) => {
                        const c = { kort: 'var(--color-green)', sparing: 'var(--color-amber)', kondycja: 'var(--color-blue)', rozciaganie: 'var(--color-purple)', mecz: 'var(--color-heart)' }
                        return <span key={t} className="tp-dot" style={{ background: c[t] || 'var(--color-text-tertiary)' }} />
                      })}
                    </div>
                    <span className="tp-day-sum">{formatDuration(mins)}</span>
                  </>
                )}
                {entries.length === 0 && hasPlanned && <span className="tp-day-planned">zaplanowany</span>}
                {entries.length === 0 && !hasPlanned && !isScheduled && <span className="tp-day-free">wolne</span>}
                {entries.length === 0 && !hasPlanned && isScheduled && <span className="tp-day-scheduled">zaplanowany</span>}
              </div>
              <button className="tp-day-add" onClick={() => onAddClick(ds)} title="Dodaj trening">
                <Plus size={14} />
              </button>
            </div>

            {/* Planned sessions (not yet done) — show as ghost items */}
            {hasPlanned && entries.length === 0 && (
              <div className="tp-day-planned-items">
                {planned.map((p, i) => {
                  const info = SESSION_TYPES[p.sessionType] || SESSION_TYPES.inne
                  const Icon = info.icon
                  return (
                    <div key={i} className="tp-planned-entry" style={{ '--entry-color': info.color, '--entry-bg': info.bg }}>
                      <div className="tp-entry-bar" />
                      <div className="tp-entry-icon"><Icon size={14} /></div>
                      <div className="tp-entry-body">
                        <div className="tp-entry-top">
                          <span className="tp-entry-type">{info.label}</span>
                          {p.startTime && <span className="tp-entry-time">{p.startTime}</span>}
                          <span className="tp-entry-dur">{formatDuration(p.durationMinutes)}</span>
                        </div>
                        {p.notes && <div className="tp-entry-notes">{p.notes}</div>}
                      </div>
                      <span className="tp-planned-badge">plan</span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Actual sessions with adherence indicators */}
            {entries.length > 0 && (
              <div className="tp-day-entries">
                {hasPlanned && (
                  <div className="tp-day-adherence">
                    <CalendarCheck size={12} />
                    <span>{entries.length}/{planned.length} z planu</span>
                  </div>
                )}
                {entries.map((s) => (
                  <SessionEntry key={s._id} session={s} onDelete={onDeleteSession} />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
