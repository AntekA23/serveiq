import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import api from '../../api/axios'
import Button from '../../components/ui/Button/Button'
import TagInput from '../../components/ui/TagInput'
import useToast from '../../hooks/useToast'
import { SKILL_NAMES, SKILL_LEVELS } from '../../constants/skillLevels'
import './Coach.css'

const SESSION_TYPES = [
  { value: 'kort', label: 'Kort' },
  { value: 'sparing', label: 'Sparing' },
  { value: 'kondycja', label: 'Kondycja' },
  { value: 'rozciaganie', label: 'Rozciaganie' },
  { value: 'mecz', label: 'Mecz' },
  { value: 'inne', label: 'Inne' },
]

const SURFACES = [
  { value: 'clay', label: 'Maczka' },
  { value: 'hard', label: 'Hard' },
  { value: 'grass', label: 'Trawa' },
  { value: 'carpet', label: 'Dywan' },
  { value: 'indoor-hard', label: 'Hala' },
]

const SURFACE_TYPES = ['kort', 'sparing', 'mecz']

export default function CoachNewSession() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const toast = useToast()

  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    player: searchParams.get('player') || '',
    date: searchParams.get('date') || new Date().toISOString().split('T')[0],
    startTime: '16:00',
    sessionType: 'kort',
    surface: 'clay',
    durationMinutes: 90,
    title: '',
    notes: '',
    focusAreas: [],
    visibleToParent: true,
  })

  // Skill updates
  const [skillUpdates, setSkillUpdates] = useState([])

  useEffect(() => {
    api.get('/players').then(({ data }) => {
      setPlayers(data.players || data || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const addSkillUpdate = (skill) => {
    if (skillUpdates.some((s) => s.skill === skill)) return
    // Get current score from selected player
    const player = players.find((p) => p._id === form.player)
    const currentScore = player?.skills?.[skill]?.score || 0
    setSkillUpdates((prev) => [...prev, { skill, scoreBefore: currentScore, scoreAfter: currentScore }])
  }

  const updateSkill = (skill, field, value) => {
    setSkillUpdates((prev) => prev.map((s) => s.skill === skill ? { ...s, [field]: Number(value) } : s))
  }

  const removeSkillUpdate = (skill) => {
    setSkillUpdates((prev) => prev.filter((s) => s.skill !== skill))
  }

  const handleSubmit = async () => {
    if (!form.player) {
      toast.error('Wybierz zawodnika')
      return
    }
    setSaving(true)
    try {
      const payload = {
        player: form.player,
        date: form.date,
        startTime: form.startTime,
        sessionType: form.sessionType,
        surface: SURFACE_TYPES.includes(form.sessionType) ? form.surface : '',
        durationMinutes: form.durationMinutes,
        title: form.title || `${SESSION_TYPES.find((t) => t.value === form.sessionType)?.label || 'Trening'}`,
        notes: form.notes || undefined,
        focusAreas: form.focusAreas,
        visibleToParent: form.visibleToParent,
        skillUpdates: skillUpdates.length > 0 ? skillUpdates : undefined,
      }
      await api.post('/sessions', payload)
      toast.success('Sesja dodana')
      navigate('/coach/sessions')
    } catch (err) {
      toast.error('Nie udalo sie dodac sesji')
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="coach-page"><div className="coach-loading">Ladowanie...</div></div>
  }

  return (
    <div className="coach-page">
      <button className="coach-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Powrot
      </button>

      <h1 className="page-title">Nowa sesja treningowa</h1>

      <div className="coach-form">
        {/* Player select */}
        <div className="coach-form-group">
          <label>Zawodnik *</label>
          <select value={form.player} onChange={(e) => handleChange('player', e.target.value)}>
            <option value="">Wybierz zawodnika...</option>
            {players.map((p) => (
              <option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>
            ))}
          </select>
        </div>

        {/* Date + time */}
        <div className="coach-form-row">
          <div className="coach-form-group">
            <label>Data</label>
            <input type="date" value={form.date} onChange={(e) => handleChange('date', e.target.value)} />
          </div>
          <div className="coach-form-group">
            <label>Godzina</label>
            <input type="time" value={form.startTime} onChange={(e) => handleChange('startTime', e.target.value)} />
          </div>
          <div className="coach-form-group">
            <label>Czas (min)</label>
            <input type="number" min={15} max={300} step={15} value={form.durationMinutes}
              onChange={(e) => handleChange('durationMinutes', Number(e.target.value))} />
          </div>
        </div>

        {/* Type */}
        <div className="coach-form-group">
          <label>Typ sesji</label>
          <div className="coach-type-grid">
            {SESSION_TYPES.map((t) => (
              <button key={t.value}
                className={`coach-type-btn ${form.sessionType === t.value ? 'active' : ''}`}
                onClick={() => handleChange('sessionType', t.value)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Surface */}
        {SURFACE_TYPES.includes(form.sessionType) && (
          <div className="coach-form-group">
            <label>Nawierzchnia</label>
            <div className="coach-surface-row">
              {SURFACES.map((s) => (
                <button key={s.value}
                  className={`coach-surface-btn ${form.surface === s.value ? 'active' : ''}`}
                  onClick={() => handleChange('surface', s.value)}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Title + notes */}
        <div className="coach-form-group">
          <label>Tytul (opcjonalnie)</label>
          <input type="text" placeholder="np. Trening serwisu..." value={form.title}
            onChange={(e) => handleChange('title', e.target.value)} />
        </div>

        <div className="coach-form-group">
          <label>Notatki</label>
          <textarea rows={3} placeholder="Obserwacje, uwagi do sesji..." value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)} />
        </div>

        <div className="coach-form-group">
          <label>Obszary fokusa</label>
          <TagInput
            value={form.focusAreas}
            onChange={(tags) => handleChange('focusAreas', tags)}
            placeholder="np. serwis, footwork, return"
          />
        </div>

        {/* Visibility */}
        <label className="coach-checkbox">
          <input type="checkbox" checked={form.visibleToParent}
            onChange={(e) => handleChange('visibleToParent', e.target.checked)} />
          Widoczna dla rodzica
        </label>

        {/* Skill updates */}
        <div className="coach-form-group">
          <label>Aktualizacja umiejetnosci</label>
          <div className="coach-skill-updates">
              <div className="coach-skill-add-row">
                {Object.entries(SKILL_NAMES).map(([key, label]) => (
                  <button key={key} className="coach-skill-add-btn"
                    disabled={skillUpdates.some((s) => s.skill === key)}
                    onClick={() => addSkillUpdate(key)}>
                    + {label}
                  </button>
                ))}
              </div>
              {skillUpdates.map((su) => (
                <div key={su.skill} className="coach-skill-update-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="coach-skill-update-name">{SKILL_NAMES[su.skill]}</span>
                    <button className="coach-skill-remove" onClick={() => removeSkillUpdate(su.skill)}>×</button>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <label style={{ fontSize: 11, color: 'var(--color-text-tertiary)', minWidth: 40 }}>Przed:</label>
                    {SKILL_LEVELS.map((l) => (
                      <button key={l.value} className={`coach-skill-level-btn ${su.scoreBefore === l.value ? 'active' : ''}`}
                        style={su.scoreBefore === l.value ? { background: l.bg, color: l.color, borderColor: l.color } : {}}
                        onClick={() => updateSkill(su.skill, 'scoreBefore', l.value)}>
                        {l.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <label style={{ fontSize: 11, color: 'var(--color-text-tertiary)', minWidth: 40 }}>Po:</label>
                    {SKILL_LEVELS.map((l) => (
                      <button key={l.value} className={`coach-skill-level-btn ${su.scoreAfter === l.value ? 'active' : ''}`}
                        style={su.scoreAfter === l.value ? { background: l.bg, color: l.color, borderColor: l.color } : {}}
                        onClick={() => updateSkill(su.skill, 'scoreAfter', l.value)}>
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Submit */}
        <div className="coach-form-actions">
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            <Save size={14} /> Zapisz sesje
          </Button>
          <button className="tp-cancel" onClick={() => navigate(-1)}>Anuluj</button>
        </div>
      </div>
    </div>
  )
}
