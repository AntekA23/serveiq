import { Calendar, Clock } from 'lucide-react'
import Badge from '../../ui/Badge/Badge'
import './SessionItem.css'

const focusAreaLabels = {
  serve: 'Serwis',
  forehand: 'Forhend',
  backhand: 'Bekhend',
  volley: 'Wolej',
  tactics: 'Taktyka',
  fitness: 'Kondycja',
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}

export default function SessionItem({ session, onClick, children }) {
  const playerName = session.player?.firstName
    ? `${session.player.firstName} ${session.player.lastName}`
    : ''

  return (
    <div className="session-item card" onClick={onClick}>
      <div className="session-item-main">
        <div className="session-item-left">
          <div className="session-item-title">{session.title}</div>
          <div className="session-item-meta">
            {playerName && <span className="session-item-player">{playerName}</span>}
            <span className="session-item-date">
              <Calendar size={12} />
              {formatDate(session.date)}
            </span>
            <span className="session-item-duration">
              <Clock size={12} />
              {session.durationMinutes} min
            </span>
          </div>
        </div>
        <div className="session-item-tags">
          {(session.focusAreas || []).map((area) => (
            <Badge key={area} variant="blue">
              {focusAreaLabels[area] || area}
            </Badge>
          ))}
        </div>
      </div>
      {children}
    </div>
  )
}
