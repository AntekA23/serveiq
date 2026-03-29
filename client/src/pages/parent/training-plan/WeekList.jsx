import { Plus } from 'lucide-react'
import { DAY_NAMES, dateStr, sessionsForDate, totalMinutes, formatDuration } from './constants'
import SessionEntry from './SessionEntry'

export default function WeekList({ sessions, scheduledDays, weekStart, addingDate, onAddClick, onDeleteSession }) {
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
        const isAdding = addingDate === ds

        return (
          <div key={ds} className={`tp-day ${isToday ? 'today' : ''} ${entries.length > 0 ? 'has-entries' : ''}`}>
            {/* Day header — always visible */}
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
                {entries.length === 0 && isScheduled && <span className="tp-day-scheduled">zaplanowany</span>}
                {entries.length === 0 && !isScheduled && <span className="tp-day-free">wolne</span>}
              </div>
              <button className="tp-day-add" onClick={() => onAddClick(ds)} title="Dodaj trening">
                <Plus size={14} />
              </button>
            </div>

            {/* Entries list — shown if there are entries */}
            {entries.length > 0 && (
              <div className="tp-day-entries">
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
