import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Heart,
  Activity,
  Moon,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Watch,
  ChevronRight,
  Calendar,
  Target,
  AlertCircle,
  FileText,
} from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import Avatar from '../../components/ui/Avatar/Avatar'
import Button from '../../components/ui/Button/Button'
import './Dashboard.css'

function RecoveryRing({ score, status }) {
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (score / 100) * circumference
  const statusColor =
    status === 'green' ? 'var(--color-recovery-green)' :
    status === 'yellow' ? 'var(--color-recovery-yellow)' :
    'var(--color-recovery-red)'
  const statusLabel =
    status === 'green' ? 'Gotowy' :
    status === 'yellow' ? 'Umiarkowany' :
    'Potrzebna regeneracja'

  return (
    <div className="recovery-ring">
      <svg viewBox="0 0 120 120" className="recovery-ring-svg">
        <circle cx="60" cy="60" r="54" fill="none" stroke="var(--color-border)" strokeWidth="8" />
        <circle
          cx="60" cy="60" r="54" fill="none"
          stroke={statusColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="recovery-ring-content">
        <div className="recovery-ring-score" style={{ color: statusColor }}>{score}</div>
        <div className="recovery-ring-label">Regeneracja</div>
      </div>
      <div className="recovery-ring-status" style={{ color: statusColor }}>{statusLabel}</div>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, unit, trend, color, bgColor }) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  return (
    <div className="metric-card" style={{ '--metric-color': color, '--metric-bg': bgColor }}>
      <div className="metric-card-icon">
        <Icon size={18} />
      </div>
      <div className="metric-card-value">
        {value}
        <span className="metric-card-unit">{unit}</span>
      </div>
      <div className="metric-card-label">{label}</div>
      {trend && (
        <div className={`metric-card-trend ${trend}`}>
          <TrendIcon size={12} />
        </div>
      )}
    </div>
  )
}

function DeviceStatusBar({ devices }) {
  if (!devices || devices.length === 0) return null

  return (
    <div className="device-status-bar">
      {devices.map((device) => (
        <div key={device._id} className={`device-status-item ${device.connected ? 'connected' : 'disconnected'}`}>
          <Watch size={14} />
          <span className="device-status-name">{device.deviceName}</span>
          <span className="device-status-dot" />
          <span className="device-status-text">
            {device.connected ? `Sync ${formatTimeAgo(device.lastSyncAt)}` : 'Rozlaczony'}
          </span>
        </div>
      ))}
    </div>
  )
}

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

function LatestReview({ childId, navigate }) {
  const [review, setReview] = useState(null)

  useEffect(() => {
    if (!childId) return
    api.get(`/reviews?player=${childId}`).then(({ data }) => {
      const reviews = data.reviews || []
      if (reviews.length > 0) setReview(reviews[0])
    }).catch(() => {})
  }, [childId])

  if (!review) return null

  const coachName = review.coach
    ? `${review.coach.firstName || ''} ${review.coach.lastName || ''}`.trim()
    : 'Trener'

  return (
    <div className="review-preview card" onClick={() => navigate(`/parent/child/${childId}/reviews`)}>
      <div className="plan-preview-header">
        <FileText size={16} />
        <span>Ostatnia ocena od trenera</span>
        <button className="plan-preview-more">
          Wszystkie <ChevronRight size={14} />
        </button>
      </div>
      <div className="review-preview-body">
        <div className="review-preview-title">{review.title}</div>
        <div className="review-preview-meta">
          {coachName} · {new Date(review.createdAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}
          {review.overallRating && (
            <span className="review-preview-stars">
              {'★'.repeat(review.overallRating)}{'☆'.repeat(5 - review.overallRating)}
            </span>
          )}
        </div>
        {review.strengths && (
          <div className="review-preview-excerpt">{review.strengths.slice(0, 120)}{review.strengths.length > 120 ? '...' : ''}</div>
        )}
      </div>
    </div>
  )
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'teraz'
  if (mins < 60) return `${mins} min temu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h temu`
  return `${Math.floor(hours / 24)}d temu`
}

export default function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [wearableData, setWearableData] = useState(null)
  const [devices, setDevices] = useState([])
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
          const firstChild = myChildren[0]
          setSelectedChild(firstChild)

          // Fetch wearable data for first child
          try {
            const [{ data: latestData }, { data: devicesData }] = await Promise.all([
              api.get(`/wearables/data/${firstChild._id}/latest`),
              api.get('/wearables'),
            ])
            setWearableData(latestData)
            const allDevices = Array.isArray(devicesData) ? devicesData : devicesData.devices || []
            const childDevices = allDevices
              .filter(d => d.player === firstChild._id || d.player?._id === firstChild._id)
            setDevices(childDevices)
          } catch {
            // Wearable data may not be available yet
            setWearableData(null)
            setDevices([])
          }
        }
      } catch (err) {
        setError('Nie udalo sie zaladowac danych')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const handleChildSelect = async (child) => {
    setSelectedChild(child)
    try {
      const [{ data: latestData }, { data: devicesData }] = await Promise.all([
        api.get(`/wearables/data/${child._id}/latest`),
        api.get('/wearables'),
      ])
      setWearableData(latestData)
      const allDevices = Array.isArray(devicesData) ? devicesData : devicesData.devices || []
      const childDevices = allDevices
        .filter(d => d.player === child._id || d.player?._id === child._id)
      setDevices(childDevices)
    } catch {
      setWearableData(null)
      setDevices([])
    }
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
          <p>Brak przypisanych zawodnikow.</p>
          <p className="parent-dashboard-empty-sub">Poprosu trenera o dolaczenie do platformy.</p>
        </div>
      </div>
    )
  }

  // Latest data comes as { latest: { daily_summary, sleep, recovery, workout }, devices }
  const latestRecovery = wearableData?.latest?.recovery?.metrics || {}
  const latestSummary = wearableData?.latest?.daily_summary?.metrics || {}
  const latestSleep = wearableData?.latest?.sleep?.metrics || {}

  const recovery = latestRecovery.recovery || {}
  const heartRate = latestSummary.heartRate || latestRecovery.heartRate || {}
  const hrv = latestSummary.hrv || latestRecovery.hrv || {}
  const sleep = latestSleep.sleep || latestRecovery.sleep || {}
  const strain = latestSummary.strain || {}

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

      {/* Hero section: child info + recovery ring */}
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

        {recovery.score != null ? (
          <RecoveryRing score={recovery.score} status={recovery.status || 'green'} />
        ) : (
          <div className="recovery-ring-empty">
            <Watch size={24} />
            <span>Polacz urzadzenie</span>
          </div>
        )}
      </div>

      {/* Health metrics grid */}
      <div className="metrics-grid">
        <MetricCard
          icon={Heart}
          label="Tetno spoczynkowe"
          value={heartRate.resting || '—'}
          unit="bpm"
          trend={hrv.trend === 'up' ? 'up' : hrv.trend === 'down' ? 'down' : null}
          color="var(--color-heart)"
          bgColor="var(--color-heart-bg)"
        />
        <MetricCard
          icon={Activity}
          label="HRV"
          value={hrv.value || '—'}
          unit="ms"
          trend={hrv.trend}
          color="var(--color-hrv)"
          bgColor="var(--color-hrv-bg)"
        />
        <MetricCard
          icon={Moon}
          label="Sen"
          value={sleep.totalMinutes ? `${(sleep.totalMinutes / 60).toFixed(1)}` : '—'}
          unit="h"
          trend={sleep.quality >= 80 ? 'up' : sleep.quality < 60 ? 'down' : null}
          color="var(--color-sleep)"
          bgColor="var(--color-sleep-bg)"
        />
        <MetricCard
          icon={Zap}
          label="Obciazenie"
          value={strain.value != null ? strain.value.toFixed(1) : '—'}
          unit="/21"
          trend={null}
          color="var(--color-strain)"
          bgColor="var(--color-strain-bg)"
        />
      </div>

      {/* Device status */}
      {devices.length > 0 ? (
        <DeviceStatusBar devices={devices} />
      ) : (
        <div className="no-devices-banner" onClick={() => navigate('/parent/devices')}>
          <Watch size={18} />
          <span>Polacz WHOOP lub Garmin aby widziec dane zdrowotne</span>
          <ChevronRight size={16} />
        </div>
      )}

      {/* Recovery recommendation */}
      {recovery.recommendation && (
        <div className={`recovery-recommendation ${recovery.status || 'green'}`}>
          <div className="recovery-recommendation-label">Rekomendacja</div>
          <div className="recovery-recommendation-text">{recovery.recommendation}</div>
        </div>
      )}

      {/* Plan preview */}
      <PlanPreview child={selectedChild} navigate={navigate} />

      {/* Latest review */}
      <LatestReview childId={selectedChild?._id} navigate={navigate} />
    </div>
  )
}
