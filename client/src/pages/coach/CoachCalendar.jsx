import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import api from '../../api/axios'
import useToast from '../../hooks/useToast'
import './CoachCalendar.css'

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

const SESSION_COLORS = {
  kort: '#22c55e',
  sparing: '#8b5cf6',
  kondycja: '#f97316',
  rozciaganie: '#06b6d4',
  mecz: '#ef4444',
  inne: '#6b7280',
}

function parseTimeToDate(dateStr, timeStr) {
  if (!timeStr) return null
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date(dateStr)
  d.setHours(h, m, 0, 0)
  return d
}

function addMinutes(date, mins) {
  return new Date(date.getTime() + mins * 60000)
}

export default function CoachCalendar() {
  const navigate = useNavigate()
  const toast = useToast()
  const calendarRef = useRef(null)
  const [events, setEvents] = useState([])

  const fetchEvents = useCallback(async () => {
    try {
      const [actRes, sesRes, plRes] = await Promise.all([
        api.get('/activities', { params: { limit: 200 } }).catch(() => ({ data: { activities: [] } })),
        api.get('/sessions').catch(() => ({ data: [] })),
        api.get('/players').catch(() => ({ data: { players: [] } })),
      ])

      const players = plRes.data.players || plRes.data || []
      const playerMap = {}
      for (const p of players) {
        playerMap[p._id] = `${p.firstName} ${p.lastName?.[0] || ''}.`
      }

      const activities = (actRes.data.activities || []).map((a) => {
        const start = parseTimeToDate(a.date, a.startTime) || new Date(a.date)
        const end = a.endTime ? parseTimeToDate(a.date, a.endTime) : (a.durationMinutes ? addMinutes(start, a.durationMinutes) : addMinutes(start, 60))
        const playerNames = (a.players || []).map((p) => {
          const id = typeof p === 'object' ? p._id : p
          return playerMap[id] || (typeof p === 'object' ? p.firstName : '')
        }).filter(Boolean).join(', ')

        return {
          id: `act-${a._id}`,
          title: a.title || 'Aktywnosc',
          start,
          end,
          backgroundColor: TYPE_COLORS[a.type] || '#6b7280',
          borderColor: 'transparent',
          textColor: '#fff',
          extendedProps: {
            source: 'activity',
            activityType: a.type,
            playerNames,
            location: a.location,
            _id: a._id,
          },
        }
      })

      const sessionsRaw = Array.isArray(sesRes.data) ? sesRes.data : sesRes.data.sessions || []
      const sessions = sessionsRaw.map((s) => {
        const start = parseTimeToDate(s.date, s.startTime) || new Date(s.date)
        const end = s.durationMinutes ? addMinutes(start, s.durationMinutes) : addMinutes(start, 60)
        const playerId = typeof s.player === 'object' ? s.player._id : s.player
        const playerName = playerMap[playerId] || (typeof s.player === 'object' ? s.player.firstName : '')

        return {
          id: `ses-${s._id}`,
          title: s.title || 'Sesja',
          start,
          end,
          backgroundColor: SESSION_COLORS[s.sessionType] || '#6b7280',
          borderColor: 'transparent',
          textColor: '#fff',
          extendedProps: {
            source: 'session',
            sessionType: s.sessionType,
            playerNames: playerName,
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
    if (props.source === 'session') {
      navigate(`/coach/sessions/${props._id}/edit`)
    }
  }

  const handleDateClick = (info) => {
    navigate(`/coach/sessions/new?date=${info.dateStr.slice(0, 10)}`)
  }

  const handleEventDrop = async (info) => {
    const props = info.event.extendedProps
    if (props.source !== 'session') {
      info.revert()
      return
    }
    try {
      const newDate = info.event.start.toISOString()
      const newTime = `${String(info.event.start.getHours()).padStart(2, '0')}:${String(info.event.start.getMinutes()).padStart(2, '0')}`
      await api.put(`/sessions/${props._id}`, { date: newDate, startTime: newTime })
      toast.success('Sesja przeniesiona')
    } catch {
      info.revert()
      toast.error('Nie udalo sie przeniesc sesji')
    }
  }

  const handleEventResize = async (info) => {
    const props = info.event.extendedProps
    if (props.source !== 'session') {
      info.revert()
      return
    }
    try {
      const durationMs = info.event.end - info.event.start
      const durationMinutes = Math.round(durationMs / 60000)
      await api.put(`/sessions/${props._id}`, { durationMinutes })
      toast.success('Czas trwania zaktualizowany')
    } catch {
      info.revert()
      toast.error('Nie udalo sie zmienic czasu trwania')
    }
  }

  function renderEventContent(eventInfo) {
    const props = eventInfo.event.extendedProps
    return (
      <div className="ccal-event">
        <div className="ccal-event-title">{eventInfo.event.title}</div>
        {props.playerNames && <div className="ccal-event-player">{props.playerNames}</div>}
        {props.location && <div className="ccal-event-location">{props.location}</div>}
      </div>
    )
  }

  return (
    <div className="coach-calendar-page">
      <div className="coach-calendar-wrapper">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridWeek,dayGridMonth,listWeek',
          }}
          buttonText={{
            today: 'Dzis',
            week: 'Tydzien',
            month: 'Miesiac',
            list: 'Lista',
          }}
          locale="pl"
          firstDay={1}
          height="auto"
          contentHeight={700}
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          slotDuration="00:30:00"
          slotLabelInterval="01:00"
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }}
          allDaySlot={false}
          nowIndicator
          events={events}
          datesSet={fetchEvents}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventContent={renderEventContent}
          editable
          eventDurationEditable
          dayMaxEvents={4}
          moreLinkText={(n) => `+${n}`}
          noEventsText="Brak wydarzen"
          eventDisplay="block"
        />
      </div>
    </div>
  )
}
