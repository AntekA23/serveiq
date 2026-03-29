import { Trash2 } from 'lucide-react'
import { SESSION_TYPES, formatDuration } from './constants'

export default function SessionEntry({ session, onDelete, compact }) {
  const typeInfo = SESSION_TYPES[session.sessionType] || SESSION_TYPES.inne
  const Icon = typeInfo.icon

  return (
    <div className={`tp-entry ${compact ? 'compact' : ''}`} style={{ '--entry-color': typeInfo.color, '--entry-bg': typeInfo.bg }}>
      <div className="tp-entry-bar" />
      <div className="tp-entry-icon"><Icon size={compact ? 12 : 14} /></div>
      <div className="tp-entry-body">
        <div className="tp-entry-top">
          <span className="tp-entry-type">{typeInfo.label}</span>
          {session.startTime && <span className="tp-entry-time">{session.startTime}</span>}
          <span className="tp-entry-dur">{formatDuration(session.durationMinutes)}</span>
        </div>
        {!compact && session.notes && <div className="tp-entry-notes">{session.notes}</div>}
      </div>
      {onDelete && (
        <button className="tp-entry-del" onClick={(e) => { e.stopPropagation(); onDelete(session) }}>
          <Trash2 size={12} />
        </button>
      )}
    </div>
  )
}
