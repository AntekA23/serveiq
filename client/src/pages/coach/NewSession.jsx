import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '../../api/axios'
import Button from '../../components/ui/Button/Button'
import Input from '../../components/ui/Input/Input'
import useUiStore from '../../store/uiStore'
import './NewSession.css'

const sessionSchema = z.object({
  player: z.string().min(1, 'Wybierz zawodnika'),
  date: z.string().min(1, 'Data jest wymagana'),
  durationMinutes: z.union([z.string(), z.number()]).transform((v) => Number(v)).refine((v) => v > 0, 'Czas trwania musi być większy niż 0'),
  title: z.string().min(3, 'Tytuł musi mieć min. 3 znaki'),
  notes: z.string().optional(),
})

const focusAreaOptions = [
  { key: 'serve', label: 'Serwis' },
  { key: 'forehand', label: 'Forhend' },
  { key: 'backhand', label: 'Bekhend' },
  { key: 'volley', label: 'Wolej' },
  { key: 'tactics', label: 'Taktyka' },
  { key: 'fitness', label: 'Kondycja' },
]

const skillLabels = {
  serve: 'Serwis',
  forehand: 'Forhend',
  backhand: 'Bekhend',
  volley: 'Wolej',
  tactics: 'Taktyka',
  fitness: 'Kondycja',
}

function getTodayStr() {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

export default function NewSession() {
  const navigate = useNavigate()
  const addToast = useUiStore((s) => s.addToast)

  const [players, setPlayers] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [focusAreas, setFocusAreas] = useState([])
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [skillUpdates, setSkillUpdates] = useState({})

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      player: '',
      date: getTodayStr(),
      durationMinutes: 60,
      title: '',
      notes: '',
    },
  })

  const watchedPlayer = watch('player')

  useEffect(() => {
    api.get('/players')
      .then((res) => setPlayers(Array.isArray(res.data) ? res.data : res.data.players || []))
      .catch(() => addToast('Nie udało się pobrać listy zawodników', 'error'))
  }, [addToast])

  useEffect(() => {
    if (watchedPlayer) {
      const player = players.find((p) => p._id === watchedPlayer)
      setSelectedPlayer(player || null)
      if (player && player.skills) {
        const updates = {}
        Object.keys(skillLabels).forEach((key) => {
          updates[key] = {
            before: player.skills[key] || 0,
            after: player.skills[key] || 0,
          }
        })
        setSkillUpdates(updates)
      } else {
        setSkillUpdates({})
      }
    } else {
      setSelectedPlayer(null)
      setSkillUpdates({})
    }
  }, [watchedPlayer, players])

  const toggleFocusArea = (key) => {
    setFocusAreas((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const handleSkillChange = (key, value) => {
    setSkillUpdates((prev) => ({
      ...prev,
      [key]: { ...prev[key], after: Number(value) },
    }))
  }

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      const payload = {
        ...data,
        durationMinutes: Number(data.durationMinutes),
        focusAreas,
      }

      // Only include skill updates if values actually changed
      const changedSkills = {}
      Object.entries(skillUpdates).forEach(([key, val]) => {
        if (val.before !== val.after) {
          changedSkills[key] = val
        }
      })
      if (Object.keys(changedSkills).length > 0) {
        payload.skillUpdates = changedSkills
      }

      if (!payload.notes) delete payload.notes

      await api.post('/sessions', payload)
      addToast('Trening został dodany', 'success')
      navigate('/coach/sessions')
    } catch (err) {
      addToast(err.response?.data?.message || 'Błąd podczas dodawania treningu', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-enter new-session">
      <h1 className="page-title">Nowy trening</h1>

      <div className="card">
        <form className="new-session-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="new-session-row">
            <div className="input-group">
              <label className="input-label">Zawodnik *</label>
              <select className="input" {...register('player')}>
                <option value="">Wybierz zawodnika...</option>
                {players.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.firstName} {p.lastName}
                  </option>
                ))}
              </select>
              {errors.player && (
                <span className="input-error-text">{errors.player.message}</span>
              )}
            </div>
            <Input
              label="Data *"
              type="date"
              register={register('date')}
              error={errors.date?.message}
            />
          </div>

          <div className="new-session-row">
            <Input
              label="Tytuł *"
              placeholder="np. Trening serwisu"
              register={register('title')}
              error={errors.title?.message}
            />
            <Input
              label="Czas trwania (min) *"
              type="number"
              register={register('durationMinutes')}
              error={errors.durationMinutes?.message}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Notatki</label>
            <textarea
              className="input new-session-textarea"
              placeholder="Notatki z treningu..."
              {...register('notes')}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Obszary skupienia</label>
            <div className="focus-areas">
              {focusAreaOptions.map((area) => (
                <button
                  key={area.key}
                  type="button"
                  className={'focus-area-tag' + (focusAreas.includes(area.key) ? ' selected' : '')}
                  onClick={() => toggleFocusArea(area.key)}
                >
                  {area.label}
                </button>
              ))}
            </div>
          </div>

          {selectedPlayer && Object.keys(skillUpdates).length > 0 && (
            <div className="input-group">
              <label className="input-label">Aktualizacja umiejętności</label>
              <div className="skill-updates">
                {Object.entries(skillUpdates).map(([key, val]) => (
                  <div key={key} className="skill-update-row">
                    <span className="skill-update-label">{skillLabels[key]}</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={val.after}
                      onChange={(e) => handleSkillChange(key, e.target.value)}
                      className="skill-update-slider"
                    />
                    <span className="skill-update-values">
                      {val.before} → {val.after}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="new-session-actions">
            <Button type="button" onClick={() => navigate('/coach/sessions')}>
              Anuluj
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Zapisz trening
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
