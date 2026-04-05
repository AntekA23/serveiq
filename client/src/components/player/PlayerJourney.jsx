import { useState, useEffect } from 'react'
import {
  Target,
  Compass,
  Eye,
  Tag,
  ArrowRight,
  Layers,
} from 'lucide-react'
import api from '../../api/axios'
import ProgressBar from '../ui/ProgressBar/ProgressBar'
import './PlayerJourney.css'

function formatDuration(startDate) {
  if (!startDate) return null
  const start = new Date(startDate)
  const now = new Date()
  const diffMs = now - start
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (days < 30) return `${days} dni`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} mies.`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem > 0 ? `${years} r. ${rem} mies.` : `${years} r.`
}

const STAGE_LABELS = {
  beginner: 'Poczatkujacy',
  tennis10_red: 'Czerwony kort',
  tennis10_orange: 'Pomaranczowy kort',
  tennis10_green: 'Zielony kort',
  committed: 'Zawodnik',
  advanced: 'Zaawansowany',
  performance: 'Performance',
}

const CATEGORY_COLORS = {
  technical: 'var(--color-blue)',
  tactical: 'var(--color-green)',
  physical: 'var(--color-amber)',
  mental: 'var(--color-accent)',
}

export default function PlayerJourney({ player }) {
  const [goals, setGoals] = useState([])
  const [goalsTotal, setGoalsTotal] = useState(0)
  const [observation, setObservation] = useState(null)
  const [loadingGoals, setLoadingGoals] = useState(true)
  const [loadingObs, setLoadingObs] = useState(true)

  useEffect(() => {
    if (!player?._id) return

    const fetchGoals = async () => {
      try {
        const { data } = await api.get(`/goals?player=${player._id}&status=active`)
        const list = data.goals || data || []
        setGoalsTotal(list.length)
        setGoals(list.slice(0, 3))
      } catch {
        // silent
      } finally {
        setLoadingGoals(false)
      }
    }

    const fetchObservation = async () => {
      try {
        const { data } = await api.get(`/observations?player=${player._id}`)
        const list = data.observations || data || []
        setObservation(list[0] || null)
      } catch {
        // silent
      } finally {
        setLoadingObs(false)
      }
    }

    fetchGoals()
    fetchObservation()
  }, [player?._id])

  const pathwayHistory = player.pathwayHistory || []
  const lastEntry = pathwayHistory[pathwayHistory.length - 1]
  const stageDuration = lastEntry?.startDate ? formatDuration(lastEntry.startDate) : null

  const focusTags = player.trainingPlan?.focus || []
  const nextStep = player.nextStep

  return (
    <div className="player-journey">
      {/* Current Stage */}
      <div className="player-journey-card">
        <div className="player-journey-card-header">
          <Layers size={16} />
          <span>Aktualny etap</span>
        </div>
        <div className="player-journey-stage">
          <span className="player-journey-stage-name">
            {STAGE_LABELS[player.pathwayStage] || player.pathwayStage || 'Nie ustawiono'}
          </span>
          {stageDuration && (
            <span className="player-journey-stage-duration">od {stageDuration}</span>
          )}
        </div>
      </div>

      {/* Active Goals */}
      <div className="player-journey-card">
        <div className="player-journey-card-header">
          <Target size={16} />
          <span>Aktywne cele</span>
        </div>
        {loadingGoals ? (
          <div className="player-journey-empty">Ladowanie...</div>
        ) : goals.length === 0 ? (
          <div className="player-journey-empty">Brak aktywnych celow</div>
        ) : (
          <div className="player-journey-goals">
            {goals.map((goal) => (
              <div key={goal._id} className="player-journey-goal">
                <div className="player-journey-goal-top">
                  <span className="player-journey-goal-title">{goal.title}</span>
                  {goal.category && (
                    <span
                      className="player-journey-badge"
                      style={{ background: CATEGORY_COLORS[goal.category] || 'var(--color-accent)' }}
                    >
                      {goal.category}
                    </span>
                  )}
                </div>
                <ProgressBar value={goal.progress || 0} color="blue" />
              </div>
            ))}
            {goalsTotal > 3 && (
              <div className="player-journey-see-all">
                <ArrowRight size={12} />
                Zobacz wszystkie ({goalsTotal})
              </div>
            )}
          </div>
        )}
      </div>

      {/* Current Focus */}
      <div className="player-journey-card">
        <div className="player-journey-card-header">
          <Tag size={16} />
          <span>Aktualny focus</span>
        </div>
        {focusTags.length === 0 ? (
          <div className="player-journey-empty">Brak ustawionego focusu</div>
        ) : (
          <div className="player-journey-tags">
            {focusTags.map((tag, idx) => (
              <span key={idx} className="player-journey-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Next Step */}
      <div className="player-journey-card">
        <div className="player-journey-card-header">
          <Compass size={16} />
          <span>Nastepny krok</span>
        </div>
        {!nextStep?.text ? (
          <div className="player-journey-empty">
            Trener jeszcze nie ustawil nastepnego kroku
          </div>
        ) : (
          <div className="player-journey-next-step">
            <p className="player-journey-next-step-text">{nextStep.text}</p>
            {(nextStep.author || nextStep.date) && (
              <div className="player-journey-next-step-meta">
                {nextStep.author && <span>{nextStep.author}</span>}
                {nextStep.date && (
                  <span>{new Date(nextStep.date).toLocaleDateString('pl-PL')}</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Latest Observation */}
      <div className="player-journey-card">
        <div className="player-journey-card-header">
          <Eye size={16} />
          <span>Ostatnia obserwacja</span>
        </div>
        {loadingObs ? (
          <div className="player-journey-empty">Ladowanie...</div>
        ) : !observation ? (
          <div className="player-journey-empty">Brak obserwacji</div>
        ) : (
          <div className="player-journey-observation">
            <p className="player-journey-observation-text">
              {observation.text && observation.text.length > 150
                ? observation.text.slice(0, 150) + '...'
                : observation.text}
            </p>
            <div className="player-journey-observation-meta">
              {observation.type && (
                <span className="player-journey-badge">{observation.type}</span>
              )}
              {observation.authorName && <span>{observation.authorName}</span>}
              {observation.createdAt && (
                <span>
                  {new Date(observation.createdAt).toLocaleDateString('pl-PL')}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
