import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Heart,
  Activity,
  Moon,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowLeft,
  Watch,
  Calendar,
} from 'lucide-react'
import api from '../../api/axios'
import Avatar from '../../components/ui/Avatar/Avatar'
import ProgressBar from '../../components/ui/ProgressBar/ProgressBar'
import './ChildProfile.css'

const skillLabels = {
  serve: 'Serwis',
  forehand: 'Forhend',
  backhand: 'Bekhend',
  volley: 'Wolej',
  tactics: 'Taktyka',
  fitness: 'Kondycja',
}

const skillColors = {
  serve: 'blue',
  forehand: 'green',
  backhand: 'amber',
  volley: 'blue',
  tactics: 'green',
  fitness: 'amber',
}

function MiniSparkline({ data, color, height = 40 }) {
  if (!data || data.length === 0) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const width = 120

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((val - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mini-sparkline" style={{ width, height }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function HealthChart({ label, icon: Icon, data, unit, color, bgColor }) {
  const latest = data?.[data.length - 1]
  const prev = data?.[data.length - 2]
  const trend = latest > prev ? 'up' : latest < prev ? 'down' : 'stable'
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  return (
    <div className="health-chart-card">
      <div className="health-chart-header">
        <div className="health-chart-icon" style={{ background: bgColor, color }}>
          <Icon size={16} />
        </div>
        <span className="health-chart-label">{label}</span>
        <div className={`health-chart-trend ${trend}`}>
          <TrendIcon size={12} />
        </div>
      </div>
      <div className="health-chart-value" style={{ color }}>
        {latest ?? '—'}
        <span className="health-chart-unit">{unit}</span>
      </div>
      <MiniSparkline data={data} color={color} />
      <div className="health-chart-range">
        <span>Min: {data ? Math.min(...data) : '—'}</span>
        <span>Max: {data ? Math.max(...data) : '—'}</span>
      </div>
    </div>
  )
}

export default function ChildProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [child, setChild] = useState(null)
  const [wearableHistory, setWearableHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const { data: playerData } = await api.get(`/players/${id}`)
        setChild(playerData)

        try {
          const { data: historyRaw } = await api.get(`/wearables/data/${id}?type=daily_summary`)
          const history = Array.isArray(historyRaw) ? historyRaw : historyRaw.data || []
          setWearableHistory(history)
        } catch {
          setWearableHistory([])
        }
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
      <div className="child-profile">
        <div className="child-profile-loading">Ladowanie...</div>
      </div>
    )
  }

  if (!child) {
    return (
      <div className="child-profile">
        <div className="child-profile-error">Nie znaleziono zawodnika</div>
      </div>
    )
  }

  const childAge = child.dateOfBirth
    ? Math.floor((Date.now() - new Date(child.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  // Extract chart data from history
  const hrData = wearableHistory.map(d => d.metrics?.heartRate?.resting).filter(Boolean)
  const hrvData = wearableHistory.map(d => d.metrics?.hrv?.value).filter(Boolean)
  const sleepData = wearableHistory.map(d => d.metrics?.sleep?.quality).filter(Boolean)
  const recoveryData = wearableHistory.map(d => d.metrics?.recovery?.score).filter(Boolean)

  const activeGoals = (child.goals || []).filter(g => !g.completed)
  const completedGoals = (child.goals || []).filter(g => g.completed)

  return (
    <div className="child-profile">
      <button className="child-profile-back" onClick={() => navigate('/parent/dashboard')}>
        <ArrowLeft size={16} />
        Powrot do pulpitu
      </button>

      {/* Hero */}
      <div className="child-profile-hero">
        <Avatar
          firstName={child.firstName}
          lastName={child.lastName}
          size={96}
          role="player"
          src={child.avatarUrl}
        />
        <div className="child-profile-hero-info">
          <h1 className="child-profile-name">
            {child.firstName} {child.lastName}
          </h1>
          <div className="child-profile-meta">
            {childAge && <span>{childAge} lat</span>}
            {child.gender && <span>{child.gender === 'M' ? 'Chlopiec' : 'Dziewczyna'}</span>}
          </div>
          <div className="child-profile-rankings">
            {child.ranking?.pzt && (
              <div className="child-profile-rank">
                <span className="child-profile-rank-label">PZT</span>
                <span className="child-profile-rank-value">#{child.ranking.pzt}</span>
              </div>
            )}
            {child.ranking?.te && (
              <div className="child-profile-rank">
                <span className="child-profile-rank-label">TE</span>
                <span className="child-profile-rank-value">#{child.ranking.te}</span>
              </div>
            )}
            {child.ranking?.atp && (
              <div className="child-profile-rank">
                <span className="child-profile-rank-label">ATP</span>
                <span className="child-profile-rank-value">#{child.ranking.atp}</span>
              </div>
            )}
            {child.ranking?.wta && (
              <div className="child-profile-rank">
                <span className="child-profile-rank-label">WTA</span>
                <span className="child-profile-rank-value">#{child.ranking.wta}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Health metrics charts (7 days) */}
      {wearableHistory.length > 0 && (
        <div className="child-profile-section">
          <h2 className="child-profile-section-title">
            <Activity size={16} />
            Metryki zdrowotne (ostatnie 7 dni)
          </h2>
          <div className="health-charts-grid">
            <HealthChart
              label="Tetno spoczynkowe"
              icon={Heart}
              data={hrData.slice(-7)}
              unit="bpm"
              color="var(--color-heart)"
              bgColor="var(--color-heart-bg)"
            />
            <HealthChart
              label="HRV"
              icon={Activity}
              data={hrvData.slice(-7)}
              unit="ms"
              color="var(--color-hrv)"
              bgColor="var(--color-hrv-bg)"
            />
            <HealthChart
              label="Jakosc snu"
              icon={Moon}
              data={sleepData.slice(-7)}
              unit="%"
              color="var(--color-sleep)"
              bgColor="var(--color-sleep-bg)"
            />
            <HealthChart
              label="Regeneracja"
              icon={Zap}
              data={recoveryData.slice(-7)}
              unit="%"
              color="var(--color-recovery-green)"
              bgColor="var(--color-green-bg)"
            />
          </div>
        </div>
      )}

      {wearableHistory.length === 0 && (
        <div className="child-profile-no-data">
          <Watch size={24} />
          <p>Brak danych z urzadzen. Polacz WHOOP lub Garmin aby widziec metryki zdrowotne.</p>
          <button className="child-profile-connect-btn" onClick={() => navigate('/parent/devices')}>
            Polacz urzadzenie
          </button>
        </div>
      )}

      {/* Tennis skills */}
      {child.skills && (
        <div className="child-profile-section">
          <h2 className="child-profile-section-title">
            <TrendingUp size={16} />
            Umiejetnosci tenisowe
          </h2>
          <div className="child-profile-skills">
            {Object.entries(skillLabels).map(([key, label]) => {
              const skillData = child.skills?.[key]
              const value = typeof skillData === 'object' ? (skillData?.score ?? 0) : (skillData ?? 0)
              const notes = typeof skillData === 'object' ? skillData?.notes : null

              return (
                <div key={key} className="child-profile-skill">
                  <div className="child-profile-skill-header">
                    <span>{label}</span>
                    <span className="child-profile-skill-score">{value}%</span>
                  </div>
                  <ProgressBar value={value} color={skillColors[key]} />
                  {notes && <div className="child-profile-skill-notes">{notes}</div>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Goals */}
      {(activeGoals.length > 0 || completedGoals.length > 0) && (
        <div className="child-profile-section">
          <h2 className="child-profile-section-title">
            <Calendar size={16} />
            Cele
          </h2>
          <div className="child-profile-goals">
            {activeGoals.map((goal, idx) => (
              <div key={goal._id || idx} className="child-profile-goal active">
                <div className="child-profile-goal-dot active" />
                <div>
                  <div className="child-profile-goal-text">{goal.text}</div>
                  {goal.dueDate && (
                    <div className="child-profile-goal-date">
                      Termin: {new Date(goal.dueDate).toLocaleDateString('pl-PL')}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {completedGoals.map((goal, idx) => (
              <div key={goal._id || idx} className="child-profile-goal completed">
                <div className="child-profile-goal-dot completed" />
                <div>
                  <div className="child-profile-goal-text completed">{goal.text}</div>
                  {goal.completedAt && (
                    <div className="child-profile-goal-date">
                      Ukonczone: {new Date(goal.completedAt).toLocaleDateString('pl-PL')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
