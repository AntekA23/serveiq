import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DAY_NAMES, MONTH_NAMES, SESSION_TYPES, dateStr, sessionsForDate, totalMinutes, formatDuration } from './constants'
import SessionEntry from './SessionEntry'

export default function MonthGrid({ sessions, scheduledDays, plannedSchedule = [], currentMonth, onMonthChange, selectedDay, onDayClick }) {
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d)
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay()
    const entries = sessionsForDate(sessions, date)
    const types = [...new Set(entries.map((s) => s.sessionType || 'inne'))]
    const planned = plannedSchedule.filter((s) => s.day === dayOfWeek)
    cells.push({
      day: d,
      types,
      isScheduled: scheduledDays.includes(dayOfWeek),
      hasPlanned: planned.length > 0,
      isToday: new Date().toDateString() === date.toDateString(),
      hasEntries: entries.length > 0,
    })
  }

  // Selected day detail
  const selDate = selectedDay ? new Date(year, month, selectedDay) : null
  const selEntries = selDate ? sessionsForDate(sessions, selDate) : []
  const selDayOfWeek = selDate ? (selDate.getDay() === 0 ? 7 : selDate.getDay()) : 0
  const selPlanned = plannedSchedule.filter((s) => s.day === selDayOfWeek)

  return (
    <div className="tp-month">
      <div className="tp-month-nav">
        <button className="tp-nav-btn" onClick={() => onMonthChange(-1)}><ChevronLeft size={16} /></button>
        <span className="tp-month-label">{MONTH_NAMES[month]} {year}</span>
        <button className="tp-nav-btn" onClick={() => onMonthChange(1)}><ChevronRight size={16} /></button>
      </div>

      <div className="tp-month-grid">
        {DAY_NAMES.map((n) => <div key={n} className="tp-month-dayname">{n}</div>)}
        {cells.map((cell, idx) => (
          <div key={idx}
            className={`tp-month-cell ${
              !cell ? 'empty' :
              cell.day === selectedDay ? 'selected' :
              cell.isToday ? 'today' :
              cell.hasEntries ? 'filled' :
              (cell.hasPlanned || cell.isScheduled) ? 'scheduled' : ''
            }`}
            onClick={() => cell && onDayClick(cell.day === selectedDay ? null : cell.day)}
          >
            {cell && (
              <>
                <span>{cell.day}</span>
                <div className="tp-month-dots">
                  {cell.types.map((t) => {
                    const c = { kort: 'var(--color-green)', sparing: 'var(--color-amber)', kondycja: 'var(--color-blue)', rozciaganie: 'var(--color-purple)', mecz: 'var(--color-heart)' }
                    return <span key={t} className="tp-mdot" style={{ background: c[t] || 'var(--color-text-tertiary)' }} />
                  })}
                  {(cell.hasPlanned || cell.isScheduled) && !cell.hasEntries && <span className="tp-mdot sched" />}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Day detail under calendar */}
      {selectedDay && (
        <div className="tp-month-detail">
          <div className="tp-month-detail-head">
            <span>{selectedDay} {MONTH_NAMES[month]}</span>
            {selEntries.length > 0 && <span className="tp-month-detail-sum">{formatDuration(totalMinutes(selEntries))}</span>}
          </div>
          {selEntries.length > 0 ? (
            <div className="tp-month-detail-list">
              {selEntries.map((s) => <SessionEntry key={s._id} session={s} />)}
            </div>
          ) : selPlanned.length > 0 ? (
            <div className="tp-month-detail-list">
              {selPlanned.map((p, i) => {
                const info = SESSION_TYPES[p.sessionType] || SESSION_TYPES.inne
                return (
                  <div key={i} className="tp-planned-entry" style={{ '--entry-color': info.color, '--entry-bg': info.bg }}>
                    <div className="tp-entry-bar" />
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
          ) : (
            <div className="tp-month-detail-empty">Brak wpisow</div>
          )}
        </div>
      )}
    </div>
  )
}
