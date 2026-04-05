import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Users,
} from 'lucide-react'
import api from '../../api/axios'

const MONTH_NAMES = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
]

const DAY_NAMES = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd']

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
  class: 'Zajęcia',
  camp: 'Obóz',
  tournament: 'Turniej',
  training: 'Trening',
  match: 'Mecz',
  fitness: 'Fitness',
  review: 'Przegląd',
  other: 'Inne',
}

function formatMonth(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

function getToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Day of week: 0=Sun, 1=Mon ... 6=Sat → convert to Mon=0 ... Sun=6
  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6

  const days = []

  // Leading empty cells
  for (let i = 0; i < startDow; i++) {
    days.push(null)
  }

  // Days of the month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push(dateStr)
  }

  return days
}

// Split days into rows of 7 (weeks)
function chunkWeeks(days) {
  const weeks = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }
  // Pad last week if needed
  const last = weeks[weeks.length - 1]
  while (last && last.length < 7) {
    last.push(null)
  }
  return weeks
}

export default function CalendarPage() {
  const navigate = useNavigate()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [activitiesByDay, setActivitiesByDay] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)

  const today = getToday()

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    let cancelled = false
    const fetchCalendar = async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/activities/calendar', {
          params: { month: formatMonth(year, month) },
        })
        if (cancelled) return

        // Backend returns { days: [{ date, activities }] }
        const map = {}
        if (data.days) {
          for (const day of data.days) {
            map[day.date] = day.activities
          }
        }
        // Also support { calendar: { "date": [...] } } format
        if (data.calendar) {
          Object.assign(map, data.calendar)
        }
        setActivitiesByDay(map)
      } catch {
        if (!cancelled) setActivitiesByDay({})
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchCalendar()
    return () => { cancelled = true }
  }, [year, month])

  const calendarDays = useMemo(() => getCalendarDays(year, month), [year, month])
  const weeks = useMemo(() => chunkWeeks(calendarDays), [calendarDays])

  const goToPrev = useCallback(() => {
    if (month === 0) {
      setYear(y => y - 1)
      setMonth(11)
    } else {
      setMonth(m => m - 1)
    }
    setSelectedDay(null)
  }, [month])

  const goToNext = useCallback(() => {
    if (month === 11) {
      setYear(y => y + 1)
      setMonth(0)
    } else {
      setMonth(m => m + 1)
    }
    setSelectedDay(null)
  }, [month])

  const goToToday = useCallback(() => {
    const d = new Date()
    setYear(d.getFullYear())
    setMonth(d.getMonth())
    setSelectedDay(null)
  }, [])

  const handleDayClick = useCallback((dateStr) => {
    if (!dateStr) return
    setSelectedDay(prev => prev === dateStr ? null : dateStr)
  }, [])

  // Get all days with activities for list view
  const allDaysWithActivities = useMemo(() => {
    return calendarDays
      .filter(d => d && activitiesByDay[d] && activitiesByDay[d].length > 0)
      .sort()
  }, [calendarDays, activitiesByDay])

  // Determine which week the selected day belongs to
  const selectedWeekIndex = useMemo(() => {
    if (!selectedDay) return -1
    return weeks.findIndex(week => week.includes(selectedDay))
  }, [selectedDay, weeks])

  const selectedDayActivities = selectedDay ? (activitiesByDay[selectedDay] || []) : []

  // Render dots for a day cell
  const renderDots = (dateStr) => {
    const activities = activitiesByDay[dateStr] || []
    if (activities.length === 0) return null

    const maxDots = 3
    const shown = activities.slice(0, maxDots)
    const extra = activities.length - maxDots

    return (
      <div style={styles.dotsRow}>
        {shown.map((act, i) => (
          <span
            key={i}
            style={{
              ...styles.dot,
              backgroundColor: TYPE_COLORS[act.type] || TYPE_COLORS.other,
            }}
          />
        ))}
        {extra > 0 && (
          <span style={styles.dotsExtra}>+{extra}</span>
        )}
      </div>
    )
  }

  // Activity list item
  const renderActivity = (act, idx) => {
    const color = TYPE_COLORS[act.type] || TYPE_COLORS.other
    const label = TYPE_LABELS[act.type] || act.type
    const playerCount = act.players?.length || 0

    return (
      <div
        key={act._id || idx}
        style={styles.activityItem}
        onClick={() => navigate('/activities')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') navigate('/activities') }}
      >
        <span style={{ ...styles.activityDot, backgroundColor: color }} />
        <div style={styles.activityInfo}>
          <div style={styles.activityTitle}>
            <span style={{ ...styles.typeBadge, backgroundColor: color + '22', color }}>
              {label}
            </span>
            <span>{act.title}</span>
          </div>
          <div style={styles.activityMeta}>
            {act.startTime && (
              <span style={styles.activityTime}>
                <Clock size={12} style={{ marginRight: 4, flexShrink: 0 }} />
                {act.startTime}{act.endTime ? ` – ${act.endTime}` : ''}
              </span>
            )}
            {playerCount > 0 && (
              <span style={styles.activityPlayers}>
                <Users size={12} style={{ marginRight: 4, flexShrink: 0 }} />
                {playerCount}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Expanded day panel (for grid view)
  const renderExpandedDay = () => {
    if (!selectedDay || selectedWeekIndex < 0) return null

    const dayNum = parseInt(selectedDay.split('-')[2], 10)

    return (
      <div style={styles.expandedPanel}>
        <div style={styles.expandedHeader}>
          <span style={styles.expandedDate}>
            {dayNum} {MONTH_NAMES[month]} {year}
          </span>
          <span style={styles.expandedCount}>
            {selectedDayActivities.length} {selectedDayActivities.length === 1 ? 'aktywność' : 'aktywności'}
          </span>
        </div>
        {selectedDayActivities.length === 0 ? (
          <div style={styles.emptyDay}>Brak aktywności w tym dniu</div>
        ) : (
          <div style={styles.expandedList}>
            {selectedDayActivities.map((act, i) => renderActivity(act, i))}
          </div>
        )}
      </div>
    )
  }

  // Mobile: list view
  if (isMobile) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.headerTitle}>
            <CalendarIcon size={22} style={{ color: 'var(--color-primary, #6366f1)' }} />
            <h1 style={styles.h1}>Kalendarz</h1>
          </div>
          <div style={styles.navRow}>
            <button style={styles.navBtn} onClick={goToPrev} aria-label="Poprzedni miesiąc">
              <ChevronLeft size={18} />
            </button>
            <button style={styles.monthLabel} onClick={goToToday}>
              {MONTH_NAMES[month]} {year}
            </button>
            <button style={styles.navBtn} onClick={goToNext} aria-label="Następny miesiąc">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div style={styles.loading}>Ładowanie...</div>
        ) : allDaysWithActivities.length === 0 ? (
          <div style={styles.empty}>Brak aktywności w tym miesiącu</div>
        ) : (
          <div style={styles.listView}>
            {calendarDays.filter(d => d).sort().map((dateStr) => {
              const activities = activitiesByDay[dateStr] || []
              if (activities.length === 0) return null
              const dayNum = parseInt(dateStr.split('-')[2], 10)
              const dayOfWeek = new Date(year, month, dayNum).getDay()
              const dowIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1
              const isToday = dateStr === today

              return (
                <div key={dateStr} style={styles.listDayGroup}>
                  <div style={{
                    ...styles.listDayHeader,
                    ...(isToday ? styles.listDayHeaderToday : {}),
                  }}>
                    <span style={styles.listDayNum}>{dayNum}</span>
                    <span style={styles.listDayName}>{DAY_NAMES[dowIdx]}</span>
                    {isToday && <span style={styles.todayBadge}>Dziś</span>}
                  </div>
                  {activities.map((act, i) => renderActivity(act, i))}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Desktop: grid view
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          <CalendarIcon size={22} style={{ color: 'var(--color-primary, #6366f1)' }} />
          <h1 style={styles.h1}>Kalendarz</h1>
        </div>
        <div style={styles.navRow}>
          <button style={styles.navBtn} onClick={goToPrev} aria-label="Poprzedni miesiąc">
            <ChevronLeft size={18} />
          </button>
          <button style={styles.monthLabel} onClick={goToToday}>
            {MONTH_NAMES[month]} {year}
          </button>
          <button style={styles.navBtn} onClick={goToNext} aria-label="Następny miesiąc">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={styles.loading}>Ładowanie...</div>
      ) : (
        <div style={styles.gridWrapper}>
          {/* Day-of-week headers */}
          <div style={styles.dowRow}>
            {DAY_NAMES.map((name) => (
              <div key={name} style={styles.dowCell}>{name}</div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx}>
              <div style={styles.weekRow}>
                {week.map((dateStr, cellIdx) => {
                  if (!dateStr) {
                    return <div key={cellIdx} style={styles.emptyCell} />
                  }

                  const dayNum = parseInt(dateStr.split('-')[2], 10)
                  const isToday = dateStr === today
                  const isSelected = dateStr === selectedDay
                  const hasActivities = activitiesByDay[dateStr] && activitiesByDay[dateStr].length > 0

                  return (
                    <div
                      key={dateStr}
                      style={{
                        ...styles.dayCell,
                        ...(isToday ? styles.todayCell : {}),
                        ...(isSelected ? styles.selectedCell : {}),
                        ...(hasActivities ? styles.hasActivitiesCell : {}),
                        cursor: 'pointer',
                      }}
                      onClick={() => handleDayClick(dateStr)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleDayClick(dateStr) }}
                      aria-label={`${dayNum} ${MONTH_NAMES[month]}`}
                    >
                      <span style={{
                        ...styles.dayNum,
                        ...(isToday ? styles.todayNum : {}),
                        ...(!hasActivities && !isToday ? styles.emptyDayNum : {}),
                      }}>
                        {dayNum}
                      </span>
                      {renderDots(dateStr)}
                    </div>
                  )
                })}
              </div>

              {/* Expanded panel after the row containing selected day */}
              {selectedWeekIndex === weekIdx && renderExpandedDay()}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    padding: '1.5rem',
    maxWidth: 900,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  h1: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--color-text, #111827)',
  },
  navRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  navBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 8,
    border: '1px solid var(--color-border, #e5e7eb)',
    background: 'var(--color-surface, #fff)',
    cursor: 'pointer',
    color: 'var(--color-text, #111827)',
    transition: 'background 0.15s',
  },
  monthLabel: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--color-text, #111827)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.25rem 0.75rem',
    borderRadius: 6,
    minWidth: 180,
    textAlign: 'center',
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    color: 'var(--color-text-secondary, #6b7280)',
  },
  empty: {
    textAlign: 'center',
    padding: '3rem',
    color: 'var(--color-text-secondary, #6b7280)',
  },
  gridWrapper: {
    border: '1px solid var(--color-border, #e5e7eb)',
    borderRadius: 12,
    overflow: 'hidden',
    background: 'var(--color-surface, #fff)',
  },
  dowRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    borderBottom: '1px solid var(--color-border, #e5e7eb)',
    background: 'var(--color-background, #f9fafb)',
  },
  dowCell: {
    padding: '0.625rem 0',
    textAlign: 'center',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--color-text-secondary, #6b7280)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  weekRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    borderBottom: '1px solid var(--color-border, #e5e7eb)',
  },
  dayCell: {
    minHeight: 80,
    padding: '0.5rem',
    borderRight: '1px solid var(--color-border, #e5e7eb)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    transition: 'background 0.15s',
  },
  emptyCell: {
    minHeight: 80,
    padding: '0.5rem',
    borderRight: '1px solid var(--color-border, #e5e7eb)',
    background: 'var(--color-background, #f9fafb)',
  },
  todayCell: {
    borderLeft: '3px solid var(--color-primary, #6366f1)',
    background: 'var(--color-primary-light, #eef2ff)',
  },
  selectedCell: {
    background: 'var(--color-primary-light, #eef2ff)',
    boxShadow: 'inset 0 0 0 2px var(--color-primary, #6366f1)',
  },
  hasActivitiesCell: {},
  dayNum: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: 'var(--color-text, #111827)',
    lineHeight: 1,
  },
  todayNum: {
    color: 'var(--color-primary, #6366f1)',
    fontWeight: 700,
  },
  emptyDayNum: {
    color: 'var(--color-text-tertiary, #9ca3af)',
    fontWeight: 500,
  },
  dotsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  dot: {
    display: 'inline-block',
    width: 7,
    height: 7,
    borderRadius: '50%',
    flexShrink: 0,
  },
  dotsExtra: {
    fontSize: '0.625rem',
    fontWeight: 600,
    color: 'var(--color-text-secondary, #6b7280)',
    lineHeight: 1,
  },
  // Expanded day panel
  expandedPanel: {
    padding: '1rem 1.25rem',
    background: 'var(--color-background, #f9fafb)',
    borderBottom: '1px solid var(--color-border, #e5e7eb)',
  },
  expandedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  expandedDate: {
    fontSize: '0.9375rem',
    fontWeight: 700,
    color: 'var(--color-text, #111827)',
  },
  expandedCount: {
    fontSize: '0.75rem',
    color: 'var(--color-text-secondary, #6b7280)',
  },
  expandedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  emptyDay: {
    fontSize: '0.8125rem',
    color: 'var(--color-text-tertiary, #9ca3af)',
    fontStyle: 'italic',
  },
  // Activity item
  activityItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    padding: '0.625rem 0.75rem',
    borderRadius: 8,
    background: 'var(--color-surface, #fff)',
    border: '1px solid var(--color-border, #e5e7eb)',
    cursor: 'pointer',
    transition: 'box-shadow 0.15s',
  },
  activityDot: {
    display: 'inline-block',
    width: 10,
    height: 10,
    borderRadius: '50%',
    marginTop: 4,
    flexShrink: 0,
  },
  activityInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  activityTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: 'var(--color-text, #111827)',
    flexWrap: 'wrap',
  },
  typeBadge: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    padding: '1px 6px',
    borderRadius: 4,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  activityMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.75rem',
    color: 'var(--color-text-secondary, #6b7280)',
  },
  activityTime: {
    display: 'flex',
    alignItems: 'center',
  },
  activityPlayers: {
    display: 'flex',
    alignItems: 'center',
  },
  // Mobile list view
  listView: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  listDayGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  listDayHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    paddingBottom: '0.25rem',
    borderBottom: '1px solid var(--color-border, #e5e7eb)',
  },
  listDayHeaderToday: {
    borderBottomColor: 'var(--color-primary, #6366f1)',
    borderBottomWidth: 2,
  },
  listDayNum: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--color-text, #111827)',
    minWidth: 32,
  },
  listDayName: {
    fontSize: '0.8125rem',
    color: 'var(--color-text-secondary, #6b7280)',
    fontWeight: 500,
  },
  todayBadge: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    color: 'var(--color-primary, #6366f1)',
    backgroundColor: 'var(--color-primary-light, #eef2ff)',
    padding: '1px 8px',
    borderRadius: 10,
    marginLeft: 'auto',
  },
}
