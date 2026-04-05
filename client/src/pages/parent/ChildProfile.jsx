import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
} from 'lucide-react'
import api from '../../api/axios'
import Avatar from '../../components/ui/Avatar/Avatar'
import ProgressBar from '../../components/ui/ProgressBar/ProgressBar'
import PathwayStepper from '../../components/player/PathwayStepper'
import PlayerJourney from '../../components/player/PlayerJourney'
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

export default function ChildProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [child, setChild] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const { data: playerData } = await api.get(`/players/${id}`)
        setChild(playerData.player || playerData)
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

      {/* Quick navigation links */}
      <div className="child-profile-nav-links">
        <button
          className="child-profile-nav-link"
          onClick={() => navigate(`/parent/child/${id}/timeline`)}
        >
          <Clock size={16} />
          Historia postepu
        </button>
      </div>

      {/* Pathway Stepper */}
      <PathwayStepper
        currentStage={child.pathwayStage}
        pathwayHistory={child.pathwayHistory}
      />

      {/* Player Journey */}
      <PlayerJourney player={child} />

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
