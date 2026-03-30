import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  TrendingUp,
  Trophy,
  CheckCircle,
  Activity,
  Watch,
  Target,
  Dumbbell,
  Filter,
} from 'lucide-react'
import api from '../../api/axios'
import './Timeline.css'

const eventConfig = {
  session: { icon: Target, label: 'Sesja treningowa', color: 'var(--color-green)' },
  skill_update: { icon: TrendingUp, label: 'Aktualizacja umiejetnosci', color: 'var(--color-accent)' },
  tournament: { icon: Trophy, label: 'Turniej', color: 'var(--color-amber)' },
  goal_completed: { icon: CheckCircle, label: 'Cel osiagniety', color: 'var(--color-green)' },
  health_trend: { icon: Activity, label: 'Trend zdrowotny', color: 'var(--color-hrv)' },
  device_connected: { icon: Watch, label: 'Urzadzenie polaczone', color: 'var(--color-blue)' },
}

const sessionTypeColors = {
  kort: 'var(--color-green)', sparing: 'var(--color-amber)', kondycja: 'var(--color-blue)',
  rozciaganie: 'var(--color-purple)', mecz: 'var(--color-heart)', inne: 'var(--color-text-tertiary)',
}

function TimelineEvent({ event }) {
  const config = eventConfig[event.type] || eventConfig.session
  const Icon = config.icon
  const color = event.type === 'session' && event.sessionType
    ? (sessionTypeColors[event.sessionType] || config.color)
    : config.color

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('pl-PL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return ''
    }
  }

  return (
    <div className={`timeline-event timeline-event--${event.type}`}>
      <div className="timeline-event-dot" style={{ background: color }} />
      <div className="timeline-event-content">
        <div className="timeline-event-top">
          <div className="timeline-event-icon" style={{ color }}>
            <Icon size={16} />
          </div>
          <span className="timeline-event-title">{event.title}</span>
          <span className="timeline-event-date">{formatDate(event.date)}</span>
        </div>
        {event.description && (
          <div className="timeline-event-description">{event.description}</div>
        )}
        <div className="timeline-event-badge" style={{ color, borderColor: color }}>
          {config.label}
        </div>
      </div>
    </div>
  )
}

export default function Timeline() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [childName, setChildName] = useState('')
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [timelineRes, playerRes] = await Promise.all([
          api.get(`/players/${id}/timeline?limit=50`),
          api.get(`/players/${id}`),
        ])
        setEvents(timelineRes.data?.events || [])
        const p = playerRes.data?.player || playerRes.data
        setChildName(`${p.firstName} ${p.lastName}`)
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const filtered = filter === 'all'
    ? events
    : events.filter((e) => e.type === filter)

  // Group by month
  const grouped = {}
  filtered.forEach((e) => {
    const d = new Date(e.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })
    if (!grouped[key]) grouped[key] = { label, events: [] }
    grouped[key].events.push(e)
  })

  // Count by type for filter buttons
  const typeCounts = {}
  events.forEach((e) => { typeCounts[e.type] = (typeCounts[e.type] || 0) + 1 })

  if (loading) {
    return (
      <div className="timeline-page">
        <div className="timeline-loading">Ladowanie...</div>
      </div>
    )
  }

  return (
    <div className="timeline-page">
      <button className="timeline-back" onClick={() => navigate(`/parent/child/${id}`)}>
        <ArrowLeft size={16} />
        Powrot do profilu
      </button>

      <div className="timeline-header">
        <h1 className="timeline-title">{childName}</h1>
        <div className="timeline-subtitle">Historia postepu · {events.length} wydarzen</div>
      </div>

      {/* Filters */}
      {events.length > 0 && (
        <div className="timeline-filters">
          <button
            className={`timeline-filter ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Wszystko ({events.length})
          </button>
          {Object.entries(typeCounts).map(([type, count]) => {
            const config = eventConfig[type]
            if (!config) return null
            return (
              <button
                key={type}
                className={`timeline-filter ${filter === type ? 'active' : ''}`}
                onClick={() => setFilter(type)}
                style={{ '--filter-color': config.color }}
              >
                {config.label} ({count})
              </button>
            )
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="timeline-empty">
          {events.length === 0
            ? 'Brak wydarzen do wyswietlenia. Treningi, turnieje i osiagniecia pojawia sie tutaj.'
            : 'Brak wydarzen pasujacych do filtra.'
          }
        </div>
      ) : (
        <div className="timeline-grouped">
          {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([key, group]) => (
            <div key={key} className="timeline-month">
              <div className="timeline-month-label">{group.label}</div>
              <div className="timeline-list">
                {group.events.map((event, idx) => (
                  <TimelineEvent key={idx} event={event} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
