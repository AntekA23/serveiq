import { SESSION_TYPES, totalMinutes, formatDuration } from './constants'
import { CheckCircle2, Circle, TrendingUp } from 'lucide-react'

export default function WeeklySummary({ sessions, plan }) {
  const total = totalMinutes(sessions)
  const byType = {}
  sessions.forEach((s) => {
    const t = s.sessionType || 'inne'
    byType[t] = (byType[t] || 0) + (s.durationMinutes || 0)
  })

  const schedule = plan?.weeklySchedule || []
  const hasSchedule = schedule.length > 0

  // Adherence: compare planned vs actual
  const plannedSessions = schedule.length
  const plannedMins = schedule.reduce((s, p) => s + p.durationMinutes, 0)
  const actualSessions = sessions.length
  const goalMins = hasSchedule ? plannedMins : (plan?.weeklyGoal?.hoursPerWeek || 0) * 60

  const pctTime = goalMins > 0 ? Math.min(100, (total / goalMins) * 100) : (total > 0 ? 100 : 0)
  const pctSessions = plannedSessions > 0 ? Math.min(100, (actualSessions / plannedSessions) * 100) : (actualSessions > 0 ? 100 : 0)

  // Match planned types
  const plannedByType = {}
  schedule.forEach((s) => {
    plannedByType[s.sessionType] = (plannedByType[s.sessionType] || 0) + 1
  })
  const actualByType = {}
  sessions.forEach((s) => {
    const t = s.sessionType || 'inne'
    actualByType[t] = (actualByType[t] || 0) + 1
  })

  return (
    <div className="tp-summary">
      {/* Main stats row */}
      <div className="tp-summary-row">
        <span className="tp-summary-total">{formatDuration(total)}</span>
        {goalMins > 0 && <span className="tp-summary-goal">/ {formatDuration(goalMins)} cel</span>}
      </div>
      <div className="tp-summary-bar"><div className="tp-summary-fill" style={{ width: `${pctTime}%` }} /></div>

      {/* Adherence row — only if schedule exists */}
      {hasSchedule && (
        <div className="tp-adherence">
          <div className="tp-adherence-item">
            {actualSessions >= plannedSessions
              ? <CheckCircle2 size={14} className="tp-adherence-ok" />
              : <Circle size={14} className="tp-adherence-pending" />
            }
            <span>{actualSessions}/{plannedSessions} treningow</span>
          </div>
          <div className="tp-adherence-item">
            <TrendingUp size={14} />
            <span>{Math.round(pctTime)}% czasu</span>
          </div>
          {/* Per-type breakdown */}
          {Object.entries(plannedByType).map(([type, planned]) => {
            const actual = actualByType[type] || 0
            const info = SESSION_TYPES[type] || SESSION_TYPES.inne
            return (
              <div key={type} className="tp-adherence-type" style={{ '--at-color': info.color }}>
                <span className="tp-adherence-dot" />
                <span>{info.label}: {actual}/{planned}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Session type chips */}
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
