import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../../../api/axios'
import useToast from '../../../hooks/useToast'
import { DAY_NAMES, MONTH_NAMES, getWeekStart, dateStr } from './constants'
import WeekList from './WeekList'
import MonthGrid from './MonthGrid'
import WeeklySummary from './WeeklySummary'
import AddSessionInline from './AddSessionInline'

export default function CalendarTab({ child, plan, onRefresh }) {
  const toast = useToast()
  const [sessions, setSessions] = useState([])
  const [view, setView] = useState('week')
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()))
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)
  const [addingDate, setAddingDate] = useState(null)

  const fetchSessions = useCallback(async () => {
    if (!child?._id) return
    try {
      const promises = []
      if (view === 'week') {
        const m1 = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}`
        const end = new Date(weekStart); end.setDate(weekStart.getDate() + 6)
        const m2 = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`
        promises.push(api.get(`/sessions?player=${child._id}&month=${m1}`))
        if (m2 !== m1) promises.push(api.get(`/sessions?player=${child._id}&month=${m2}`))
      } else {
        const m = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`
        promises.push(api.get(`/sessions?player=${child._id}&month=${m}`))
      }
      const results = await Promise.all(promises)
      const all = results.flatMap((r) => Array.isArray(r.data) ? r.data : r.data.sessions || [])
      const seen = new Set()
      setSessions(all.filter((s) => { if (seen.has(s._id)) return false; seen.add(s._id); return true }))
    } catch { setSessions([]) }
  }, [child, view, weekStart, currentMonth])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  const handleSaved = async () => {
    toast.success('Trening dodany')
    setAddingDate(null)
    await fetchSessions()
  }

  const handleDelete = async (session) => {
    try {
      await api.delete(`/sessions/${session._id}`)
      toast.success('Trening usuniety')
      await fetchSessions()
    } catch {
      toast.error('Nie udalo sie usunac treningu')
    }
  }

  const handleAddClick = (ds) => {
    setAddingDate(addingDate === ds ? null : ds)
  }

  // Week sessions for summary
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7)
  const weekSessions = sessions.filter((s) => {
    const d = new Date(s.date)
    return d >= weekStart && d < weekEnd
  })

  return (
    <div className="tp-calendar">
      {/* View toggle + nav */}
      <div className="tp-controls">
        <div className="tp-view-toggle">
          <button className={view === 'week' ? 'active' : ''} onClick={() => setView('week')}>Tydzien</button>
          <button className={view === 'month' ? 'active' : ''} onClick={() => setView('month')}>Miesiac</button>
        </div>
        {view === 'week' && (
          <div className="tp-nav">
            <button className="tp-nav-btn" onClick={() => setWeekStart((p) => { const d = new Date(p); d.setDate(d.getDate() - 7); return d })}>
              <ChevronLeft size={16} />
            </button>
            <span className="tp-nav-label">
              {weekStart.getDate()} {MONTH_NAMES[weekStart.getMonth()].slice(0, 3)} — {(() => { const e = new Date(weekStart); e.setDate(e.getDate() + 6); return `${e.getDate()} ${MONTH_NAMES[e.getMonth()].slice(0, 3)}` })()}
            </span>
            <button className="tp-nav-btn" onClick={() => setWeekStart((p) => { const d = new Date(p); d.setDate(d.getDate() + 7); return d })}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Summary */}
      {view === 'week' && <WeeklySummary sessions={weekSessions} plan={plan} />}

      {/* Calendar */}
      {view === 'week' ? (
        <WeekList
          sessions={sessions}
          scheduledDays={plan?.scheduledDays || []}
          weekStart={weekStart}
          addingDate={addingDate}
          onAddClick={handleAddClick}
          onDeleteSession={handleDelete}
        />
      ) : (
        <MonthGrid
          sessions={sessions}
          scheduledDays={plan?.scheduledDays || []}
          currentMonth={currentMonth}
          onMonthChange={(d) => { setCurrentMonth((p) => { const n = new Date(p); n.setMonth(n.getMonth() + d); return n }); setSelectedDay(null) }}
          selectedDay={selectedDay}
          onDayClick={(d) => { setSelectedDay(d); if (d) setAddingDate(null) }}
        />
      )}

      {/* Inline add form */}
      {addingDate && (
        <AddSessionInline
          childId={child._id}
          date={addingDate}
          onSaved={handleSaved}
          onCancel={() => setAddingDate(null)}
        />
      )}
    </div>
  )
}
