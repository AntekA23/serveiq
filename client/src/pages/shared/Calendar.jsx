import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import './Calendar.css'

// FullCalendar base CSS is auto-loaded by the packages

const TYPE_COLORS = {
  class: '#22c55e',
  camp: '#3b82f6',
  tournament: '#ef4444',
  training: '#eab308',
  match: '#8b5cf6',
  fitness: '#f97316',
  review: '#06b6d4',
  other: '#6b7280',
}

const TYPE_LABELS = {
  class: 'Zajecia',
  camp: 'Oboz',
  tournament: 'Turniej',
  training: 'Trening',
  match: 'Mecz',
  fitness: 'Fitness',
  review: 'Przeglad',
  other: 'Inne',
}

const SESSION_TYPE_COLORS = {
  kort: '#22c55e',
  sparing: '#8b5cf6',
  kondycja: '#f97316',
  rozciaganie: '#06b6d4',
  mecz: '#ef4444',
  inne: '#6b7280',
}

const SESSION_TYPE_LABELS = {
  kort: 'Kort',
  sparing: 'Sparing',
  kondycja: 'Kondycja',
  rozciaganie: 'Rozciaganie',
  mecz: 'Mecz',
  inne: 'Inne',
}

export default function Calendar() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const calendarRef = useRef(null)
  const [events, setEvents] = useState([])

  const fetchEvents = useCallback(async (fetchInfo) => {
    try {
      const start = fetchInfo.startStr.slice(0, 7) // YYYY-MM
      // Fetch both activities and sessions
      const [actRes, sesRes] = await Promise.all([
        api.get('/activities', { params: { limit: 200 } }).catch(() => ({ data: { activities: [] } })),
        api.get('/sessions').catch(() => ({ data: [] })),
      ])

      const activities = (actRes.data.activities || actRes.data || []).map((a) => ({
        id: `act-${a._id}`,
        title: a.title || TYPE_LABELS[a.type] || 'Aktywnosc',
        start: a.date,
        end: a.endDate || undefined,
        backgroundColor: TYPE_COLORS[a.type] || '#6b7280',
        borderColor: TYPE_COLORS[a.type] || '#6b7280',
        textColor: '#fff',
        extendedProps: {
          type: 'activity',
          activityType: a.type,
          status: a.status,
          location: a.location,
          startTime: a.startTime,
          endTime: a.endTime,
          durationMinutes: a.durationMinutes,
          playersCount: a.players?.length || 0,
          _id: a._id,
        },
      }))

      const sessions = (Array.isArray(sesRes.data) ? sesRes.data : sesRes.data.sessions || []).map((s) => {
        const playerName = s.player?.firstName
          ? `${s.player.firstName} ${s.player.lastName?.[0] || ''}.`
          : ''
        return {
          id: `ses-${s._id}`,
          title: s.title || SESSION_TYPE_LABELS[s.sessionType] || 'Sesja',
          start: s.date,
          backgroundColor: SESSION_TYPE_COLORS[s.sessionType] || '#6b7280',
          borderColor: SESSION_TYPE_COLORS[s.sessionType] || '#6b7280',
          textColor: '#fff',
          extendedProps: {
            type: 'session',
            sessionType: s.sessionType,
            playerName,
            startTime: s.startTime,
            durationMinutes: s.durationMinutes,
            _id: s._id,
          },
        }
      })

      setEvents([...activities, ...sessions])
    } catch {
      // silent
    }
  }, [])

  const handleEventClick = (info) => {
    const props = info.event.extendedProps
    if (props.type === 'session' && user?.role === 'coach') {
      navigate(`/coach/sessions/${props._id}/edit`)
    }
  }

  const handleDateClick = (info) => {
    if (user?.role === 'coach') {
      navigate(`/coach/sessions/new?date=${info.dateStr}`)
    }
  }

  function renderEventContent(eventInfo) {
    const props = eventInfo.event.extendedProps
    const time = props.startTime || ''
    return (
      <div className="fc-custom-event">
        {time && <span className="fc-custom-time">{time}</span>}
        <span className="fc-custom-title">{eventInfo.event.title}</span>
        {props.playerName && <span className="fc-custom-player">{props.playerName}</span>}
      </div>
    )
  }

  return (
    <div className="calendar-page">
      <div className="calendar-wrapper">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,listWeek',
          }}
          buttonText={{
            today: 'Dzis',
            month: 'Miesiac',
            list: 'Lista',
          }}
          locale="pl"
          firstDay={1}
          height="auto"
          events={events}
          datesSet={fetchEvents}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          eventContent={renderEventContent}
          dayMaxEvents={3}
          moreLinkText={(n) => `+${n} wiecej`}
          noEventsText="Brak wydarzen"
          eventDisplay="block"
        />
      </div>

      {/* Legend */}
      <div className="calendar-legend">
        {Object.entries(TYPE_LABELS).map(([key, label]) => (
          <span key={key} className="calendar-legend-item">
            <span className="calendar-legend-dot" style={{ background: TYPE_COLORS[key] }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
