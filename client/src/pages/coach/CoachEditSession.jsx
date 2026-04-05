import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import api from '../../api/axios'
import Button from '../../components/ui/Button/Button'
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

// SKILL_NAMES imported from constants/skillLevels

export default function CoachEditSession() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [playerName, setPlayerName] = useState('')

  const [form, setForm] = useState({
    date: '',
    startTime: '16:00',
    sessionType: 'kort',
    surface: 'clay',
    durationMinutes: 90,
    title: '',
    notes: '',
    focusAreas: '',
    visibleToParent: true,
  })

  const [skillUpdates, setSkillUpdates] = useState([])
  const [showSkills, setShowSkills] = useState(false)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data } = await api.get(`/sessions/${id}`)
        const s = data.session
        setForm({
          date: s.date ? new Date(s.date).toISOString().split('T')[0] : '',
          startTime: s.startTime || '16:00',
          sessionType: s.sessionType || 'kort',
          surface: s.surface || 'clay',
          durationMinutes: s.durationMinutes || 90,
          title: s.title || '',
          notes: s.notes || '',
          focusAreas: (s.focusAreas || []).join(', '),
          visibleToParent: s.visibleToParent !== false,
        })
        if (s.skillUpdates && s.skillUpdates.length > 0) {
          setSkillUpdates(s.skillUpdates.map((su) => ({
            skill: su.skill,
            scoreBefore: su.scoreBefore,
            scoreAfter: su.scoreAfter,
          })))
          setShowSkills(true)
        }
        const pName = s.player
          ? `${s.player.firstName || ''} ${s.player.lastName || ''}`.trim()
          : 'Zawodnik'
        setPlayerName(pName)
      } catch {
        toast.error('Nie udalo sie zaladowac sesji')
        navigate('/coach/sessions')
      }
      setLoading(false)
    }
    fetchSession()
  }, [id])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const addSkillUpdate = (skill) => {
    if (skillUpdates.some((s) => s.skill === skill)) return
    setSkillUpdates((prev) => [...prev, { skill, scoreBefore: 0, scoreAfter: 0 }])
  }

  const updateSkill = (skill, field, value) => {
    setSkillUpdates((prev) => prev.map((s) => s.skill === skill ? { ...s, [field]: Number(value) } : s))
  }

  const removeSkillUpdate = (skill) => {
    setSkillUpdates((prev) => prev.filter((s) => s.skill !== skill))
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const payload = {
        date: form.date,
        startTime: form.startTime,
        sessionType: form.sessionType,
        surface: SURFACE_TYPES.includes(form.sessionType) ? form.surface : '',
        durationMinutes: form.durationMinutes,
        title: form.title,
        notes: form.notes || undefined,
        focusAreas: form.focusAreas ? form.focusAreas.split(',').map((s) => s.trim()).filter(Boolean) : [],
        visibleToParent: form.visibleToParent,
        skillUpdates: skillUpdates.length > 0 ? skillUpdates : undefined,
      }
      await api.put(`/sessions/${id}`, payload)
      toast.success('Sesja zaktualizowana')
      navigate('/coach/sessions')
    } catch {
      toast.error('Nie udalo sie zaktualizowac sesji')
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!window.confirm('Czy na pewno chcesz usunac te sesje?')) return
    setDeleting(true)
    try {
      await api.delete(`/sessions/${id}`)
      toast.success('Sesja usunieta')
      navigate('/coach/sessions')
    } catch {
      toast.error('Nie udalo sie usunac sesji')
    }
    setDeleting(false)
  }

  if (loading) {
    return <div className="coach-page"><div className="coach-loading">Ladowanie...</div></div>
  }

  return (
    <div className="coach-page">
      <button className="coach-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Powrot
      </button>

      <div className="coach-header">
        <div>
          <h1 className="page-title">Edytuj sesje</h1>
          <div className="coach-subtitle">{playerName}</div>
        </div>
        <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}>
          <Trash2 size={14} /> Usun
        </Button>
      </div>

      <div className="coach-form">
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
          <label>Tytul</label>
          <input type="text" value={form.title}
            onChange={(e) => handleChange('title', e.target.value)} />
        </div>

        <div className="coach-form-group">
          <label>Notatki</label>
          <textarea rows={3} value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)} />
        </div>

        <div className="coach-form-group">
          <label>Obszary fokusa (oddzielone przecinkami)</label>
          <input type="text" value={form.focusAreas}
            onChange={(e) => handleChange('focusAreas', e.target.value)} />
        </div>

        {/* Visibility */}
        <label className="coach-checkbox">
          <input type="checkbox" checked={form.visibleToParent}
            onChange={(e) => handleChange('visibleToParent', e.target.checked)} />
          Widoczna dla rodzica
        </label>

        {/* Skill updates */}
        <div className="coach-form-group">
          <label>
            Aktualizacja umiejetnosci
            <button className="coach-link-btn" onClick={() => setShowSkills(!showSkills)}>
              {showSkills ? 'Ukryj' : 'Pokaz'}
            </button>
          </label>
          {showSkills && (
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
          )}
        </div>

        {/* Submit */}
        <div className="coach-form-actions">
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            <Save size={14} /> Zapisz zmiany
          </Button>
          <button className="tp-cancel" onClick={() => navigate(-1)}>Anuluj</button>
        </div>
      </div>
    </div>
  )
}
