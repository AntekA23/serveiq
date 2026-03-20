import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Edit, Plus, Target, Trophy, Calendar, Send } from 'lucide-react'
import api from '../../api/axios'
import Button from '../../components/ui/Button/Button'
import Modal from '../../components/ui/Modal/Modal'
import Input from '../../components/ui/Input/Input'
import Avatar from '../../components/ui/Avatar/Avatar'
import ProgressBar from '../../components/ui/ProgressBar/ProgressBar'
import Badge from '../../components/ui/Badge/Badge'
import SessionItem from '../../components/shared/SessionItem/SessionItem'
import useUiStore from '../../store/uiStore'
import './PlayerDetail.css'

const skillDefs = [
  { key: 'serve', label: 'Serwis', color: 'blue' },
  { key: 'forehand', label: 'Forhend', color: 'blue' },
  { key: 'backhand', label: 'Bekhend', color: 'amber' },
  { key: 'volley', label: 'Wolej', color: 'green' },
  { key: 'tactics', label: 'Taktyka', color: 'green' },
  { key: 'fitness', label: 'Kondycja', color: 'red' },
]

const surfaceBadges = {
  hard: { label: 'Twardy', variant: 'blue' },
  clay: { label: 'Mączka', variant: 'amber' },
  grass: { label: 'Trawa', variant: 'green' },
  indoor: { label: 'Hala', variant: 'neutral' },
}

const goalSchema = z.object({
  text: z.string().min(1, 'Treść celu jest wymagana'),
  dueDate: z.string().min(1, 'Data jest wymagana'),
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return dd + '.' + mm + '.' + yyyy
}

export default function PlayerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const addToast = useUiStore((s) => s.addToast)

  const [loading, setLoading] = useState(true)
  const [player, setPlayer] = useState(null)
  const [sessions, setSessions] = useState([])
  const [tournaments, setTournaments] = useState([])

  const [skillModalOpen, setSkillModalOpen] = useState(false)
  const [skillValues, setSkillValues] = useState({})
  const [skillNotes, setSkillNotes] = useState({})
  const [savingSkills, setSavingSkills] = useState(false)

  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [savingGoal, setSavingGoal] = useState(false)

  const goalForm = useForm({
    resolver: zodResolver(goalSchema),
    defaultValues: { text: '', dueDate: '' },
  })

  const fetchPlayer = useCallback(async () => {
    try {
      const [playerRes, sessionsRes, tournamentsRes] = await Promise.all([
        api.get('/players/' + id),
        api.get('/sessions?player=' + id),
        api.get('/tournaments?player=' + id),
      ])
      const playerData = playerRes.data.player || playerRes.data
      setPlayer(playerData)
      setSessions(Array.isArray(sessionsRes.data) ? sessionsRes.data : sessionsRes.data.sessions || [])
      setTournaments(Array.isArray(tournamentsRes.data) ? tournamentsRes.data : tournamentsRes.data.tournaments || [])

      const skills = playerData.skills || {}
      const values = {}
      const notes = {}
      skillDefs.forEach((s) => {
        values[s.key] = skills[s.key] || 0
        notes[s.key] = skills[s.key + 'Notes'] || ''
      })
      setSkillValues(values)
      setSkillNotes(notes)
    } catch (err) {
      addToast('Nie udało się pobrać danych zawodnika', 'error')
    } finally {
      setLoading(false)
    }
  }, [id, addToast])

  useEffect(() => {
    fetchPlayer()
  }, [fetchPlayer])

  const handleSkillSave = async () => {
    setSavingSkills(true)
    try {
      const skills = {}
      skillDefs.forEach((s) => {
        skills[s.key] = Number(skillValues[s.key])
        if (skillNotes[s.key]) {
          skills[s.key + 'Notes'] = skillNotes[s.key]
        }
      })
      await api.put('/players/' + id, { skills })
      addToast('Umiejętności zapisane', 'success')
      setSkillModalOpen(false)
      fetchPlayer()
    } catch (err) {
      addToast('Błąd podczas zapisywania umiejętności', 'error')
    } finally {
      setSavingSkills(false)
    }
  }

  const handleGoalSubmit = async (data) => {
    setSavingGoal(true)
    try {
      await api.post('/players/' + id + '/goals', data)
      addToast('Cel dodany', 'success')
      setGoalModalOpen(false)
      goalForm.reset()
      fetchPlayer()
    } catch (err) {
      addToast('Błąd podczas dodawania celu', 'error')
    } finally {
      setSavingGoal(false)
    }
  }

  const toggleGoalCompleted = async (goalId, completed) => {
    try {
      await api.put('/players/' + id + '/goals/' + goalId, { completed: !completed })
      fetchPlayer()
    } catch (err) {
      addToast('Błąd podczas aktualizacji celu', 'error')
    }
  }

  if (loading) {
    return (
      <div className="page-enter">
        <p className="player-detail-loading">Ładowanie...</p>
      </div>
    )
  }

  if (!player) {
    return (
      <div className="page-enter">
        <p className="player-detail-loading">Nie znaleziono zawodnika</p>
      </div>
    )
  }

  const age = player.dateOfBirth
    ? Math.floor((Date.now() - new Date(player.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  const skills = player.skills || {}
  const goals = player.goals || []

  return (
    <div className="page-enter">
      <div className="player-detail-header">
        <Avatar
          firstName={player.firstName}
          lastName={player.lastName}
          size={48}
          role="player"
        />
        <div>
          <div className="player-detail-name">
            {player.firstName} {player.lastName}
          </div>
          <div className="player-detail-meta">
            {age !== null && <span>{age} lat</span>}
            {player.gender && (
              <span>{player.gender === 'M' ? 'Chłopiec' : 'Dziewczynka'}</span>
            )}
            {player.ranking && <span>Ranking: {player.ranking}</span>}
          </div>
        </div>
        {player.parentId && (
          <Button
            size="sm"
            icon={Send}
            onClick={() => navigate('/coach/messages/' + player.parentId)}
          >
            Napisz do rodzica
          </Button>
        )}
      </div>

      <div className="player-detail-sections">
        {/* Umiejętności */}
        <div className="player-detail-section card">
          <div className="player-detail-section-title">
            <span><Target size={14} /> Umiejętności</span>
            <Button size="sm" icon={Edit} onClick={() => setSkillModalOpen(true)}>
              Edytuj
            </Button>
          </div>
          <div className="skills-grid">
            {skillDefs.map((s) => (
              <ProgressBar
                key={s.key}
                label={s.label}
                value={skills[s.key] || 0}
                color={s.color}
                showValue
              />
            ))}
          </div>
        </div>

        {/* Cele */}
        <div className="player-detail-section card">
          <div className="player-detail-section-title">
            <span><Target size={14} /> Cele</span>
            <Button size="sm" icon={Plus} onClick={() => setGoalModalOpen(true)}>
              Dodaj cel
            </Button>
          </div>
          {goals.length === 0 ? (
            <p className="player-detail-empty">Brak celów</p>
          ) : (
            <div className="goals-list">
              {goals.map((goal) => (
                <div
                  key={goal._id}
                  className={'goal-item' + (goal.completed ? ' completed' : '')}
                >
                  <input
                    type="checkbox"
                    className="goal-checkbox"
                    checked={goal.completed || false}
                    onChange={() => toggleGoalCompleted(goal._id, goal.completed)}
                  />
                  <span className="goal-item-text">{goal.text}</span>
                  <span className="goal-item-date">{formatDate(goal.dueDate)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Treningi */}
        <div className="player-detail-section card">
          <div className="player-detail-section-title">
            <span><Calendar size={14} /> Treningi</span>
            <Button size="sm" onClick={() => navigate('/coach/sessions')}>
              Wszystkie
            </Button>
          </div>
          {sessions.length === 0 ? (
            <p className="player-detail-empty">Brak treningów</p>
          ) : (
            sessions.slice(0, 10).map((session) => (
              <SessionItem key={session._id} session={session} />
            ))
          )}
        </div>

        {/* Turnieje */}
        <div className="player-detail-section card">
          <div className="player-detail-section-title">
            <span><Trophy size={14} /> Turnieje</span>
            <Button size="sm" onClick={() => navigate('/coach/tournaments')}>
              Wszystkie
            </Button>
          </div>
          {tournaments.length === 0 ? (
            <p className="player-detail-empty">Brak turniejów</p>
          ) : (
            <div className="tournaments-list">
              {tournaments.map((t) => {
                const surface = surfaceBadges[t.surface] || surfaceBadges.hard
                return (
                  <div key={t._id} className="tournament-mini-item">
                    <div className="tournament-mini-info">
                      <span className="tournament-mini-name">{t.name}</span>
                      <span className="tournament-mini-dates">
                        {formatDate(t.startDate)}
                        {t.endDate && (' \u2014 ' + formatDate(t.endDate))}
                      </span>
                    </div>
                    <Badge variant={surface.variant}>{surface.label}</Badge>
                    {t.result && (
                      <span className="tournament-mini-result">
                        {t.result.round} ({t.result.wins}W-{t.result.losses}L)
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal edycji umiejętności */}
      <Modal
        isOpen={skillModalOpen}
        onClose={() => setSkillModalOpen(false)}
        title="Edytuj umiejętności"
        footer={
          <div className="modal-actions">
            <Button onClick={() => setSkillModalOpen(false)}>Anuluj</Button>
            <Button variant="primary" loading={savingSkills} onClick={handleSkillSave}>
              Zapisz
            </Button>
          </div>
        }
      >
        <div className="skill-edit-form">
          {skillDefs.map((s) => (
            <div key={s.key} className="skill-edit-item">
              <div className="skill-edit-header">
                <label className="skill-edit-label">{s.label}</label>
                <span className="skill-edit-value">{skillValues[s.key]}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={skillValues[s.key]}
                onChange={(e) =>
                  setSkillValues((prev) => ({ ...prev, [s.key]: Number(e.target.value) }))
                }
                className="skill-edit-slider"
              />
              <textarea
                className="skill-edit-notes"
                placeholder="Notatki..."
                value={skillNotes[s.key]}
                onChange={(e) =>
                  setSkillNotes((prev) => ({ ...prev, [s.key]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>
      </Modal>

      {/* Modal dodawania celu */}
      <Modal
        isOpen={goalModalOpen}
        onClose={() => {
          setGoalModalOpen(false)
          goalForm.reset()
        }}
        title="Dodaj cel"
        footer={
          <div className="modal-actions">
            <Button onClick={() => { setGoalModalOpen(false); goalForm.reset() }}>
              Anuluj
            </Button>
            <Button
              variant="primary"
              loading={savingGoal}
              onClick={goalForm.handleSubmit(handleGoalSubmit)}
            >
              Dodaj
            </Button>
          </div>
        }
      >
        <form className="goal-form" onSubmit={goalForm.handleSubmit(handleGoalSubmit)}>
          <Input
            label="Treść celu *"
            placeholder="np. Poprawić drugi serwis"
            register={goalForm.register('text')}
            error={goalForm.formState.errors.text?.message}
          />
          <Input
            label="Termin *"
            type="date"
            register={goalForm.register('dueDate')}
            error={goalForm.formState.errors.dueDate?.message}
          />
        </form>
      </Modal>
    </div>
  )
}
