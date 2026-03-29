import { SESSION_TYPES, totalMinutes, formatDuration } from './constants'

export default function WeeklySummary({ sessions, plan }) {
  const total = totalMinutes(sessions)
  const byType = {}
  sessions.forEach((s) => {
    const t = s.sessionType || 'inne'
    byType[t] = (byType[t] || 0) + (s.durationMinutes || 0)
  })
  const goalHours = plan?.weeklyGoal?.hoursPerWeek || 8
  const pct = Math.min(100, (total / 60 / goalHours) * 100)

  return (
    <div className="tp-summary">
      <div className="tp-summary-row">
        <span className="tp-summary-total">{formatDuration(total)}</span>
        <span className="tp-summary-goal">/ {goalHours}h cel</span>
      </div>
      <div className="tp-summary-bar"><div className="tp-summary-fill" style={{ width: `${pct}%` }} /></div>
      <div className="tp-summary-types">
        {Object.entries(byType).map(([type, mins]) => {
          const info = SESSION_TYPES[type] || SESSION_TYPES.inne
          return (
            <span key={type} className="tp-type-chip" style={{ '--chip-color': info.color, '--chip-bg': info.bg }}>
              <span className="tp-type-dot" /> {info.label} {formatDuration(mins)}
            </span>
          )
        })}
      </div>
    </div>
  )
}
