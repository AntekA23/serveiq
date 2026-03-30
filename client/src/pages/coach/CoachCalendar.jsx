import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import api from '../../api/axios'
import Button from '../../components/ui/Button/Button'
import './CoachCalendar.css'

const TYPE_COLORS = {
  kort: '#22C55E', sparing: '#F59E0B', kondycja: '#4DA6FF',
  rozciaganie: '#7C5CFC', mecz: '#FF4757', inne: '#505870',
}
const TYPE_LABELS = {
  kort: 'K', sparing: 'S', kondycja: 'F', rozciaganie: 'R', mecz: 'M', inne: '?',
}

const DAY_NAMES = ['Pon', 'Wt', 'Sr', 'Czw', 'Pt', 'Sb', 'Nd']
const MONTH_NAMES = [
  'Styczen', 'Luty', 'Marzec', 'Kwiecien', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpien', 'Wrzesien', 'Pazdziernik', 'Listopad', 'Grudzien',
]

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  let startDay = firstDay.getDay() - 1
  if (startDay < 0) startDay = 6

  const days = []
  // Previous month padding
  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(year, month, -i)
    days.push({ date: d, isOtherMonth: true })
  }
  // Current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({ date: new Date(year, month, i), isOtherMonth: false })
  }
  // Next month padding
  const remaining = 7 - (days.length % 7)
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isOtherMonth: true })
    }
  }
  return days
}

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function CoachCalendar() {
  const navigate = useNavigate()
  const [month, setMonth] = useState(new Date())
  const [sessions, setSessions] = useState([])
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(null)

  const year = month.getFullYear()
  const mon = month.getMonth()

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const m = `${year}-${String(mon + 1).padStart(2, '0')}`
        const [sessRes, plRes] = await Promise.all([
          api.get(`/sessions?month=${m}`),
          api.get('/players'),
        ])
        const pl = plRes.data.players || plRes.data || []
        setPlayers(pl)

        const playerMap = {}
        pl.forEach((p) => { playerMap[p._id] = `${p.firstName} ${p.lastName}` })

        const s = sessRes.data.sessions || sessRes.data || []
        setSessions(s.map((sess) => ({
          ...sess,
          playerName: playerMap[typeof sess.player === 'object' ? sess.player._id : sess.player] || 'Zawodnik',
          playerId: typeof sess.player === 'object' ? sess.player._id : sess.player,
        })))
      } catch { /* silent */ }
      setLoading(false)
    }
    fetch()
  }, [year, mon])

  const days = useMemo(() => getMonthDays(year, mon), [year, mon])

  const sessionsByDate = useMemo(() => {
    const map = {}
    sessions.forEach((s) => {
      const key = dateKey(new Date(s.date))
      if (!map[key]) map[key] = []
      map[key].push(s)
    })
    return map
  }, [sessions])

  const today = dateKey(new Date())
  const selectedSessions = selectedDay ? (sessionsByDate[selectedDay] || []) : []

  const prevMonth = () => setMonth(new Date(year, mon - 1, 1))
  const nextMonth = () => setMonth(new Date(year, mon + 1, 1))

  return (
    <div className="ccal-page">
      <div className="ccal-header">
        <h1 className="page-title">Kalendarz</h1>
        <Button variant="primary" size="sm" onClick={() => navigate('/coach/sessions/new')}>
          <Plus size={14} /> Nowa sesja
        </Button>
      </div>

      {/* Month nav */}
      <div className="ccal-nav">
        <button className="ccal-nav-btn" onClick={prevMonth}><ChevronLeft size={18} /></button>
        <span className="ccal-nav-label">{MONTH_NAMES[mon]} {year}</span>
        <button className="ccal-nav-btn" onClick={nextMonth}><ChevronRight size={18} /></button>
      </div>

      {/* Calendar grid */}
      <div className="ccal-grid">
        {DAY_NAMES.map((d) => (
          <div key={d} className="ccal-day-name">{d}</div>
        ))}
        {days.map(({ date, isOtherMonth }, i) => {
          const key = dateKey(date)
          const daySessions = sessionsByDate[key] || []
          const isToday = key === today
          const isSelected = key === selectedDay

          return (
            <div
              key={i}
              className={`ccal-cell ${isOtherMonth ? 'other' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${daySessions.length > 0 ? 'has-sessions' : ''}`}
              onClick={() => setSelectedDay(isSelected ? null : key)}
            >
              <span className="ccal-cell-num">{date.getDate()}</span>
              {daySessions.length > 0 && (
                <div className="ccal-cell-dots">
                  {daySessions.slice(0, 4).map((s, j) => (
                    <span key={j} className="ccal-dot" style={{ background: TYPE_COLORS[s.sessionType] || TYPE_COLORS.inne }} title={`${s.playerName}: ${s.title}`} />
                  ))}
                  {daySessions.length > 4 && <span className="ccal-dot-more">+{daySessions.length - 4}</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="ccal-detail">
          <div className="ccal-detail-header">
            <span>{new Date(selectedDay + 'T00:00').toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            <Button size="sm" onClick={() => navigate(`/coach/sessions/new?date=${selectedDay}`)}>
              <Plus size={12} /> Dodaj
            </Button>
          </div>
          {selectedSessions.length === 0 ? (
            <div className="ccal-detail-empty">Brak sesji w tym dniu</div>
          ) : (
            <div className="ccal-detail-list">
              {selectedSessions.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')).map((s) => (
                <div key={s._id} className="ccal-detail-item" onClick={() => navigate(`/coach/sessions/${s._id}/edit`)}>
                  <div className="ccal-detail-dot" style={{ background: TYPE_COLORS[s.sessionType] || TYPE_COLORS.inne }} />
                  <div className="ccal-detail-body">
                    <span className="ccal-detail-title">{s.title || 'Trening'}</span>
                    <span className="ccal-detail-meta">
                      {s.playerName} {s.startTime && `· ${s.startTime}`} · {s.durationMinutes}min
                    </span>
                  </div>
                  <span className="ccal-detail-type" style={{ color: TYPE_COLORS[s.sessionType] }}>
                    {TYPE_LABELS[s.sessionType]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {loading && <div className="ccal-loading-overlay" />}
    </div>
  )
}
