import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  Calendar,
  Target,
  AlertCircle,
  FileText,
  Plus,
  Link,
} from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import Avatar from '../../components/ui/Avatar/Avatar'
import Button from '../../components/ui/Button/Button'
import './Dashboard.css'

function PlanPreview({ child, navigate }) {
  const plan = child?.trainingPlan
  const milestones = plan?.milestones || []
  const schedule = plan?.weeklySchedule || []
  const nextMilestone = milestones.find(m => !m.completed)

  const dayNames = ['', 'Pon', 'Wt', 'Sr', 'Czw', 'Pt', 'Sb', 'Nd']
  const typeLabels = {
    kort: 'Kort', sparing: 'Sparing', kondycja: 'Kondycja',
    rozciaganie: 'Rozciag.', mecz: 'Mecz', inne: 'Inne',
  }

  // Group schedule by day
  const byDay = {}
  schedule.forEach(s => {
    if (!byDay[s.day]) byDay[s.day] = []
    byDay[s.day].push(s)
  })

  return (
    <div className="plan-preview card">
      <div className="plan-preview-header">
        <Calendar size={16} />
        <span>Plan treningowy</span>
        <button className="plan-preview-more" onClick={() => navigate('/parent/training-plan')}>
          Zobacz wiecej <ChevronRight size={14} />
        </button>
      </div>
      <div className="plan-preview-body">
        {nextMilestone && (
          <div className="plan-milestone">
            <Target size={16} className="plan-milestone-icon" />
            <div>
              <div className="plan-milestone-text">{nextMilestone.text}</div>
              {nextMilestone.date && (
                <div className="plan-milestone-date">
                  {new Date(nextMilestone.date).toLocaleDateString('pl-PL', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {schedule.length > 0 ? (
          <div className="plan-schedule-preview">
            <div className="plan-weekly">
              <div className="plan-weekly-label">Harmonogram</div>
              <div className="plan-weekly-value">
                {schedule.length} treningow · {Math.round(schedule.reduce((s, i) => s + i.durationMinutes, 0) / 60 * 10) / 10}h / tydz
              </div>
            </div>
            <div className="plan-schedule-days">
              {Object.entries(byDay).sort(([a], [b]) => a - b).map(([day, items]) => (
                <div key={day} className="plan-schedule-day">
                  <span className="plan-schedule-day-name">{dayNames[day]}</span>
                  {items.map((item, i) => (
                    <span key={i} className="plan-schedule-type">{typeLabels[item.sessionType] || item.sessionType}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : plan?.weeklyGoal?.sessionsPerWeek ? (
          <div className="plan-weekly">
            <div className="plan-weekly-label">Cel tygodniowy</div>
            <div className="plan-weekly-value">
              {plan.weeklyGoal.sessionsPerWeek} treningow / tydz
            </div>
          </div>
        ) : null}

        {!nextMilestone && schedule.length === 0 && !plan?.weeklyGoal?.sessionsPerWeek && (
          <div className="plan-empty">
            Brak aktywnego planu treningowego
          </div>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch children/players
        const { data: playersRaw } = await api.get('/players')
        const players = Array.isArray(playersRaw) ? playersRaw : playersRaw.players || []
        const childIds = user?.parentProfile?.children || []
        const myChildren = childIds.length > 0
          ? players.filter((p) => childIds.includes(p._id))
          : players
        setChildren(myChildren)

        if (myChildren.length > 0) {
          setSelectedChild(myChildren[0])
        }
      } catch (err) {
        setError('Nie udalo sie zaladowac danych')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const handleChildSelect = (child) => {
    setSelectedChild(child)
  }

  if (loading) {
    return (
      <div className="parent-dashboard">
        <h1 className="page-title">Pulpit</h1>
        <div className="parent-dashboard-loading">Ladowanie...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="parent-dashboard">
        <h1 className="page-title">Pulpit</h1>
        <div className="parent-dashboard-error">{error}</div>
      </div>
    )
  }

  if (children.length === 0) {
    return (
      <div className="parent-dashboard">
        <h1 className="page-title">Pulpit</h1>
        <div className="parent-dashboard-empty">
          <AlertCircle size={32} />
          <h2 style={{ margin: '8px 0 4px' }}>Witaj w ServeIQ!</h2>
          <p>Dodaj swoje pierwsze dziecko, aby rozpocząć.</p>
          <button
            onClick={() => navigate('/my-children')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', background: 'var(--color-accent)',
              color: '#fff', border: 'none',
              borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', marginTop: 12
            }}
          >
            <Plus size={16} /> Dodaj dziecko
          </button>
        </div>
      </div>
    )
  }

  const childAge = selectedChild?.dateOfBirth
    ? Math.floor((Date.now() - new Date(selectedChild.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  return (
    <div className="parent-dashboard">
      {/* Child selector (if multiple) */}
      {children.length > 1 && (
        <div className="child-selector">
          {children.map((child) => (
            <button
              key={child._id}
              className={`child-selector-btn ${selectedChild?._id === child._id ? 'active' : ''}`}
              onClick={() => handleChildSelect(child)}
            >
              <Avatar firstName={child.firstName} lastName={child.lastName} size={28} role="player" />
              <span>{child.firstName}</span>
            </button>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => navigate('/my-children')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', background: 'var(--color-accent-muted)',
            color: 'var(--color-accent)', border: '1px solid var(--color-accent)',
            borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}
        >
          <Plus size={16} /> Dodaj dziecko
        </button>
        <button
          onClick={() => navigate('/parent/add-coach')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', background: 'var(--color-accent-muted)',
            color: 'var(--color-accent)', border: '1px solid var(--color-accent)',
            borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}
        >
          <Link size={16} /> Dodaj trenera
        </button>
      </div>

      {/* Hero section: child info */}
      <div className="dashboard-hero">
        <div className="dashboard-hero-child" onClick={() => navigate(`/parent/child/${selectedChild._id}`)}>
          <Avatar
            firstName={selectedChild.firstName}
            lastName={selectedChild.lastName}
            size={72}
            role="player"
            src={selectedChild.avatarUrl}
          />
          <div className="dashboard-hero-info">
            <h1 className="dashboard-hero-name">
              {selectedChild.firstName} {selectedChild.lastName}
            </h1>
            <div className="dashboard-hero-details">
              {childAge && <span>{childAge} lat</span>}
              {selectedChild.ranking?.pzt && <span>Ranking PZT: #{selectedChild.ranking.pzt}</span>}
            </div>
            <button className="dashboard-hero-profile-btn">
              Zobacz profil <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Plan preview */}
      <PlanPreview child={selectedChild} navigate={navigate} />
    </div>
  )
}
