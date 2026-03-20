import { useState, useEffect } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import Avatar from '../../components/ui/Avatar/Avatar'
import ProgressBar from '../../components/ui/ProgressBar/ProgressBar'
import './Progress.css'

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

export default function Progress() {
  const user = useAuthStore((s) => s.user)
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const { data: players } = await api.get('/players')
        const childIds = user?.parentProfile?.children || []
        const myChildren = childIds.length > 0
          ? players.filter((p) => childIds.includes(p._id))
          : players
        setChildren(myChildren)
      } catch (err) {
        setError('Nie udało się załadować danych')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  if (loading) {
    return (
      <div className="progress-page">
        <h1 className="page-title">Postępy</h1>
        <div className="progress-loading">Ładowanie...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="progress-page">
        <h1 className="page-title">Postępy</h1>
        <div className="progress-error">{error}</div>
      </div>
    )
  }

  return (
    <div className="progress-page">
      <h1 className="page-title">Postępy</h1>

      {children.length === 0 && (
        <div className="progress-empty">Brak przypisanych zawodników.</div>
      )}

      {children.map((child) => {
        const activeGoals = (child.goals || []).filter((g) => !g.completed)
        const completedGoals = (child.goals || []).filter((g) => g.completed)

        return (
          <div key={child._id} className="progress-child">
            <div className="progress-child-header">
              <Avatar
                firstName={child.firstName}
                lastName={child.lastName}
                size={48}
                role="player"
              />
              <span className="progress-child-name">
                {child.firstName} {child.lastName}
              </span>
            </div>

            <div className="progress-skills">
              {Object.entries(skillLabels).map(([key, label]) => {
                const value = child.skills?.[key] || 0
                const notes = child.skillNotes?.[key]

                return (
                  <div key={key} className="progress-skill-item">
                    <div className="progress-skill-header">
                      <span className="progress-skill-name">{label}</span>
                      <span className="progress-skill-score">{value}%</span>
                    </div>
                    <ProgressBar
                      value={value}
                      color={skillColors[key]}
                    />
                    {notes && (
                      <div className="progress-skill-notes">{notes}</div>
                    )}
                  </div>
                )
              })}
            </div>

            {(activeGoals.length > 0 || completedGoals.length > 0) && (
              <div className="progress-goals-section">
                <div className="progress-goals-title">Cele</div>

                {activeGoals.map((goal, idx) => (
                  <div key={goal._id || idx} className="progress-goal">
                    <Circle size={16} className="progress-goal-pending" />
                    <div>
                      <div className="progress-goal-text">
                        {goal.text || goal.title}
                      </div>
                      {goal.deadline && (
                        <div className="progress-goal-date">
                          Termin: {new Date(goal.deadline).toLocaleDateString('pl-PL')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {completedGoals.map((goal, idx) => (
                  <div key={goal._id || idx} className="progress-goal">
                    <CheckCircle2 size={16} className="progress-goal-check" />
                    <div>
                      <div className="progress-goal-text completed">
                        {goal.text || goal.title}
                      </div>
                      {goal.completedAt && (
                        <div className="progress-goal-date">
                          Ukończono: {new Date(goal.completedAt).toLocaleDateString('pl-PL')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
