import { useState, useEffect } from 'react'
import {
  Calendar,
  Target,
  TrendingUp,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Battery,
  Award,
} from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import Avatar from '../../components/ui/Avatar/Avatar'
import ProgressBar from '../../components/ui/ProgressBar/ProgressBar'
import './TrainingPlan.css'

const DAY_NAMES = ['Pon', 'Wt', 'Sr', 'Czw', 'Pt', 'Sb', 'Nd']
const MONTH_NAMES = [
  'Styczen', 'Luty', 'Marzec', 'Kwiecien', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpien', 'Wrzesien', 'Pazdziernik', 'Listopad', 'Grudzien'
]

function WeeklyProgress({ sessionsCompleted, sessionsGoal, hoursCompleted, hoursGoal }) {
  const sessionPct = sessionsGoal ? Math.min(100, (sessionsCompleted / sessionsGoal) * 100) : 0
  const hoursPct = hoursGoal ? Math.min(100, (hoursCompleted / hoursGoal) * 100) : 0

  return (
    <div className="weekly-progress card">
      <h3 className="weekly-progress-title">Cel tygodniowy</h3>
      <div className="weekly-progress-items">
        <div className="weekly-progress-item">
          <div className="weekly-progress-item-header">
            <Dumbbell size={14} />
            <span>Treningi</span>
            <span className="weekly-progress-value">{sessionsCompleted}/{sessionsGoal}</span>
          </div>
          <div className="weekly-progress-bar">
            <div className="weekly-progress-fill" style={{ width: `${sessionPct}%` }} />
          </div>
        </div>
        <div className="weekly-progress-item">
          <div className="weekly-progress-item-header">
            <Battery size={14} />
            <span>Godziny</span>
            <span className="weekly-progress-value">{hoursCompleted.toFixed(1)}/{hoursGoal}h</span>
          </div>
          <div className="weekly-progress-bar">
            <div className="weekly-progress-fill hours" style={{ width: `${hoursPct}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function TrainingCalendar({ sessions, currentMonth, onMonthChange }) {
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Monday-based week
  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6

  const daysInMonth = lastDay.getDate()
  const cells = []

  // Empty cells before first day
  for (let i = 0; i < startOffset; i++) {
    cells.push({ day: null })
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dayOfWeek = new Date(year, month, d).getDay()

    // Check if there's a session on this day
    const hasSession = sessions.some((s) => {
      const sDate = new Date(s.date)
      return sDate.getFullYear() === year && sDate.getMonth() === month && sDate.getDate() === d
    })

    // Is rest day? (Sunday by default)
    const isRest = dayOfWeek === 0
    const isToday = new Date().toDateString() === new Date(year, month, d).toDateString()

    cells.push({
      day: d,
      hasSession,
      isRest,
      isToday,
    })
  }

  return (
    <div className="training-calendar card">
      <div className="training-calendar-header">
        <button className="calendar-nav" onClick={() => onMonthChange(-1)}>
          <ChevronLeft size={16} />
        </button>
        <span className="calendar-month">{MONTH_NAMES[month]} {year}</span>
        <button className="calendar-nav" onClick={() => onMonthChange(1)}>
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="calendar-grid">
        {DAY_NAMES.map((name) => (
          <div key={name} className="calendar-day-name">{name}</div>
        ))}
        {cells.map((cell, idx) => (
          <div
            key={idx}
            className={`calendar-cell ${
              !cell.day ? 'empty' :
              cell.isToday ? 'today' :
              cell.hasSession ? 'training' :
              cell.isRest ? 'rest' : ''
            }`}
          >
            {cell.day && (
              <>
                <span className="calendar-cell-day">{cell.day}</span>
                {cell.hasSession && <span className="calendar-cell-dot training" />}
                {cell.isRest && !cell.hasSession && <span className="calendar-cell-dot rest" />}
              </>
            )}
          </div>
        ))}
      </div>
      <div className="calendar-legend">
        <div className="calendar-legend-item">
          <span className="calendar-legend-dot training" />
          Trening
        </div>
        <div className="calendar-legend-item">
          <span className="calendar-legend-dot rest" />
          Regeneracja
        </div>
        <div className="calendar-legend-item">
          <span className="calendar-legend-dot today" />
          Dzis
        </div>
      </div>
    </div>
  )
}

function MilestoneTimeline({ milestones }) {
  if (!milestones || milestones.length === 0) return null

  return (
    <div className="milestones card">
      <h3 className="milestones-title">
        <Award size={16} />
        Kamienie milowe
      </h3>
      <div className="milestones-list">
        {milestones.map((milestone, idx) => (
          <div key={idx} className={`milestone-item ${milestone.completed ? 'completed' : ''}`}>
            <div className="milestone-line" />
            <div className="milestone-dot">
              {milestone.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
            </div>
            <div className="milestone-content">
              <div className="milestone-text">{milestone.text}</div>
              {milestone.date && (
                <div className="milestone-date">
                  {new Date(milestone.date).toLocaleDateString('pl-PL', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </div>
              )}
              {milestone.description && (
                <div className="milestone-desc">{milestone.description}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TrainingPlan() {
  const user = useAuthStore((s) => s.user)
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [sessions, setSessions] = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const { data: playersRaw } = await api.get('/players')
        const players = Array.isArray(playersRaw) ? playersRaw : playersRaw.players || []
        const childIds = user?.parentProfile?.children || []
        const myChildren = childIds.length > 0
          ? players.filter((p) => childIds.includes(p._id))
          : players
        setChildren(myChildren)

        if (myChildren.length > 0) {
          setSelectedChild(myChildren[0])
          await fetchSessions(myChildren[0]._id)
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const fetchSessions = async (playerId) => {
    try {
      const monthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`
      const { data } = await api.get(`/sessions?player=${playerId}&month=${monthStr}`)
      const sessionsArr = Array.isArray(data) ? data : data.sessions || []
      setSessions(sessionsArr)
    } catch {
      setSessions([])
    }
  }

  useEffect(() => {
    if (selectedChild) {
      fetchSessions(selectedChild._id)
    }
  }, [currentMonth, selectedChild])

  const handleMonthChange = (delta) => {
    setCurrentMonth(prev => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() + delta)
      return d
    })
  }

  if (loading) {
    return (
      <div className="training-plan-page">
        <h1 className="page-title">Plan treningowy</h1>
        <div className="training-plan-loading">Ladowanie...</div>
      </div>
    )
  }

  if (!selectedChild) {
    return (
      <div className="training-plan-page">
        <h1 className="page-title">Plan treningowy</h1>
        <div className="training-plan-empty">Brak przypisanych zawodnikow</div>
      </div>
    )
  }

  const plan = selectedChild.trainingPlan || {}
  const goals = selectedChild.goals || []
  const activeGoals = goals.filter(g => !g.completed)
  const completedGoals = goals.filter(g => g.completed)

  // Calculate weekly stats from sessions
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay() + 1) // Monday
  weekStart.setHours(0, 0, 0, 0)

  const thisWeekSessions = sessions.filter(s => new Date(s.date) >= weekStart)
  const thisWeekHours = thisWeekSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / 60

  // Build milestones from goals + plan
  const milestones = [
    ...(plan.nextMilestone ? [{
      text: plan.nextMilestone.text,
      date: plan.nextMilestone.date,
      completed: false,
    }] : []),
    ...activeGoals.map(g => ({
      text: g.text,
      date: g.dueDate,
      completed: false,
    })),
    ...completedGoals.slice(0, 3).map(g => ({
      text: g.text,
      date: g.completedAt,
      completed: true,
    })),
  ]

  return (
    <div className="training-plan-page">
      {/* Child selector */}
      {children.length > 1 && (
        <div className="child-selector">
          {children.map((child) => (
            <button
              key={child._id}
              className={`child-selector-btn ${selectedChild?._id === child._id ? 'active' : ''}`}
              onClick={() => setSelectedChild(child)}
            >
              <Avatar firstName={child.firstName} lastName={child.lastName} size={28} role="player" />
              <span>{child.firstName}</span>
            </button>
          ))}
        </div>
      )}

      <h1 className="page-title">Plan treningowy — {selectedChild.firstName}</h1>

      {/* Weekly progress */}
      <WeeklyProgress
        sessionsCompleted={thisWeekSessions.length}
        sessionsGoal={plan.weeklyGoal?.sessionsPerWeek || 5}
        hoursCompleted={thisWeekHours}
        hoursGoal={plan.weeklyGoal?.hoursPerWeek || 8}
      />

      {/* Focus areas */}
      {plan.focus && plan.focus.length > 0 && (
        <div className="focus-areas card">
          <h3 className="focus-areas-title">
            <Target size={16} />
            Obszary fokusa
          </h3>
          <div className="focus-areas-tags">
            {plan.focus.map((area, idx) => (
              <span key={idx} className="focus-area-tag">{area}</span>
            ))}
          </div>
          {plan.notes && (
            <div className="focus-areas-notes">
              <div className="focus-areas-notes-label">Notatki trenera</div>
              <p>{plan.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Calendar */}
      <TrainingCalendar
        sessions={sessions}
        currentMonth={currentMonth}
        onMonthChange={handleMonthChange}
      />

      {/* Milestones */}
      <MilestoneTimeline milestones={milestones} />
    </div>
  )
}
