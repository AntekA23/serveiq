import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  TrendingUp,
  Trophy,
  CheckCircle,
  Activity,
  Watch,
} from 'lucide-react'
import api from '../../api/axios'
import './Timeline.css'

const eventConfig = {
  skill_update: { icon: TrendingUp, label: 'Aktualizacja umiejetnosci' },
  tournament: { icon: Trophy, label: 'Turniej' },
  goal_completed: { icon: CheckCircle, label: 'Cel osiagniety' },
  health_trend: { icon: Activity, label: 'Trend zdrowotny' },
  device_connected: { icon: Watch, label: 'Urzadzenie polaczone' },
}

function TimelineEvent({ event }) {
  const config = eventConfig[event.type] || eventConfig.skill_update
  const Icon = config.icon

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
      <div className="timeline-event-dot" />
      <div className="timeline-event-content">
        <div className="timeline-event-top">
          <div className="timeline-event-icon">
            <Icon size={16} />
          </div>
          <span className="timeline-event-title">{event.title}</span>
          <span className="timeline-event-date">{formatDate(event.date)}</span>
        </div>
        {event.description && (
          <div className="timeline-event-description">{event.description}</div>
        )}
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [timelineRes, playerRes] = await Promise.all([
          api.get(`/players/${id}/timeline?limit=50`),
          api.get(`/players/${id}`),
        ])
        setEvents(timelineRes.data?.events || [])
        const p = playerRes.data
        setChildName(`${p.firstName} ${p.lastName}`)
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

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
        <div className="timeline-subtitle">Historia postepu</div>
      </div>

      {events.length === 0 ? (
        <div className="timeline-empty">Brak wydarzen do wyswietlenia</div>
      ) : (
        <div className="timeline-list">
          {events.map((event, idx) => (
            <TimelineEvent key={idx} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}
