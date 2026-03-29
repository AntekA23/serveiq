import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DAY_NAMES, MONTH_NAMES, dateStr, sessionsForDate, totalMinutes, formatDuration } from './constants'
import SessionEntry from './SessionEntry'

export default function MonthGrid({ sessions, scheduledDays, currentMonth, onMonthChange, selectedDay, onDayClick }) {
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
    cells.push({
      day: d,
      types,
      isScheduled: scheduledDays.includes(dayOfWeek),
      isToday: new Date().toDateString() === date.toDateString(),
      hasEntries: entries.length > 0,
    })
  }

  // Selected day detail
  const selEntries = selectedDay
    ? sessionsForDate(sessions, new Date(year, month, selectedDay))
    : []

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
              cell.isScheduled ? 'scheduled' : ''
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
                  {cell.isScheduled && !cell.hasEntries && <span className="tp-mdot sched" />}
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
          ) : (
            <div className="tp-month-detail-empty">Brak wpisow</div>
          )}
        </div>
      )}
    </div>
  )
}
