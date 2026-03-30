import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save, Send, Star, Trash2, Sparkles } from 'lucide-react'
import api from '../../api/axios'
import Button from '../../components/ui/Button/Button'
import useToast from '../../hooks/useToast'
import './Coach.css'

const REVIEW_TYPES = [
  { value: 'monthly', label: 'Miesieczna' },
  { value: 'quarterly', label: 'Kwartalna' },
  { value: 'tournament', label: 'Turniejowa' },
  { value: 'milestone', label: 'Kamien milowy' },
  { value: 'general', label: 'Ogolna' },
]

const SKILL_NAMES = {
  serve: 'Serwis', forehand: 'Forhend', backhand: 'Bekhend',
  volley: 'Wolej', tactics: 'Taktyka', fitness: 'Kondycja',
}

export default function CoachNewReview() {
  const navigate = useNavigate()
  const { id: editId } = useParams()
  const [searchParams] = useSearchParams()
  const toast = useToast()
  const isEdit = !!editId

  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0]

  const [form, setForm] = useState({
    player: searchParams.get('player') || '',
    periodStart: monthAgo,
    periodEnd: today,
    type: 'monthly',
    title: '',
    strengths: '',
    areasToImprove: '',
    recommendations: '',
    notes: '',
    overallRating: 0,
    visibleToParent: true,
  })

  const [skillRatings, setSkillRatings] = useState({})

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/players')
        setPlayers(data.players || data || [])

        if (isEdit) {
          const { data: revData } = await api.get(`/reviews/${editId}`)
          const r = revData.review
          setForm({
            player: typeof r.player === 'object' ? r.player._id : r.player,
            periodStart: r.periodStart ? new Date(r.periodStart).toISOString().split('T')[0] : monthAgo,
            periodEnd: r.periodEnd ? new Date(r.periodEnd).toISOString().split('T')[0] : today,
            type: r.type || 'monthly',
            title: r.title || '',
            strengths: r.strengths || '',
            areasToImprove: r.areasToImprove || '',
            recommendations: r.recommendations || '',
            notes: r.notes || '',
            overallRating: r.overallRating || 0,
            visibleToParent: r.visibleToParent !== false,
          })
          if (r.skillRatings) setSkillRatings(r.skillRatings)
        }
      } catch {
        if (isEdit) {
          toast.error('Nie udalo sie zaladowac oceny')
          navigate('/coach/reviews')
        }
      }
      setLoading(false)
    }
    fetch()
  }, [editId])

  // Load player skills when player selected
  useEffect(() => {
    if (!isEdit && form.player) {
      const player = players.find((p) => p._id === form.player)
      if (player?.skills) {
        const ratings = {}
        for (const [key, val] of Object.entries(player.skills)) {
          if (val && typeof val.score === 'number') {
            ratings[key] = val.score
          }
        }
        setSkillRatings(ratings)
      }
    }
  }, [form.player, players])

  const handleAiGenerate = async () => {
    if (!form.player) {
      toast.error('Najpierw wybierz zawodnika')
      return
    }
    setAiGenerating(true)
    try {
      const { data } = await api.post(`/ai/review-draft/${form.player}`, {
        periodStart: form.periodStart,
        periodEnd: form.periodEnd,
      })
      const r = data.result
      setForm((prev) => ({
        ...prev,
        title: r.title || prev.title,
        strengths: r.strengths || prev.strengths,
        areasToImprove: r.areasToImprove || prev.areasToImprove,
        recommendations: r.recommendations || prev.recommendations,
        notes: r.notes || prev.notes,
        overallRating: r.overallRating || prev.overallRating,
      }))
      toast.success('Szkic wygenerowany przez AI')
    } catch (err) {
      const msg = err.response?.data?.message || 'Nie udalo sie wygenerowac szkicu'
      toast.error(msg)
    }
    setAiGenerating(false)
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (status = 'draft') => {
    if (!form.player) {
      toast.error('Wybierz zawodnika')
      return
    }
    if (!form.title) {
      toast.error('Podaj tytul oceny')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        status,
        skillRatings: Object.keys(skillRatings).length > 0 ? skillRatings : undefined,
        overallRating: form.overallRating > 0 ? form.overallRating : undefined,
      }

      if (isEdit) {
        const { player, ...updatePayload } = payload
        await api.put(`/reviews/${editId}`, updatePayload)
        toast.success(status === 'published' ? 'Ocena opublikowana' : 'Ocena zapisana')
      } else {
        await api.post('/reviews', payload)
        toast.success(status === 'published' ? 'Ocena opublikowana' : 'Szkic zapisany')
      }
      navigate('/coach/reviews')
    } catch {
      toast.error('Nie udalo sie zapisac oceny')
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!window.confirm('Usunac te ocene?')) return
    try {
      await api.delete(`/reviews/${editId}`)
      toast.success('Ocena usunieta')
      navigate('/coach/reviews')
    } catch {
      toast.error('Blad usuwania')
    }
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
        <h1 className="page-title">{isEdit ? 'Edytuj ocene' : 'Nowa ocena'}</h1>
        {isEdit && (
          <Button variant="danger" size="sm" onClick={handleDelete}>
            <Trash2 size={14} /> Usun
          </Button>
        )}
      </div>

      <div className="coach-form">
        {/* Player */}
        {!isEdit && (
          <div className="coach-form-group">
            <label>Zawodnik *</label>
            <select value={form.player} onChange={(e) => handleChange('player', e.target.value)}>
              <option value="">Wybierz zawodnika...</option>
              {players.map((p) => (
                <option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>
          </div>
        )}

        {/* Type */}
        <div className="coach-form-group">
          <label>Typ oceny</label>
          <div className="coach-type-grid">
            {REVIEW_TYPES.map((t) => (
              <button key={t.value}
                className={`coach-type-btn ${form.type === t.value ? 'active' : ''}`}
                onClick={() => handleChange('type', t.value)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Period */}
        <div className="coach-form-row">
          <div className="coach-form-group">
            <label>Okres od</label>
            <input type="date" value={form.periodStart} onChange={(e) => handleChange('periodStart', e.target.value)} />
          </div>
          <div className="coach-form-group">
            <label>Okres do</label>
            <input type="date" value={form.periodEnd} onChange={(e) => handleChange('periodEnd', e.target.value)} />
          </div>
        </div>

        {/* AI Generate */}
        {!isEdit && (
          <div className="coach-ai-generate">
            <Button size="sm" onClick={handleAiGenerate} loading={aiGenerating}>
              <Sparkles size={14} /> Generuj z AI
            </Button>
            <span className="coach-ai-hint">AI wygeneruje szkic na podstawie danych zawodnika</span>
          </div>
        )}

        {/* Title */}
        <div className="coach-form-group">
          <label>Tytul *</label>
          <input type="text" placeholder="np. Ocena miesieczna — marzec 2026" value={form.title}
            onChange={(e) => handleChange('title', e.target.value)} />
        </div>

        {/* Overall rating */}
        <div className="coach-form-group">
          <label>Ocena ogolna</label>
          <div className="coach-rating-stars">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} className="coach-star-btn" onClick={() => handleChange('overallRating', s === form.overallRating ? 0 : s)}>
                <Star size={24} fill={s <= form.overallRating ? 'var(--color-amber)' : 'none'}
                  stroke={s <= form.overallRating ? 'var(--color-amber)' : 'var(--color-text-tertiary)'} />
              </button>
            ))}
          </div>
        </div>

        {/* Structured assessment */}
        <div className="coach-form-group">
          <label>Mocne strony</label>
          <textarea rows={3} placeholder="Co zawodnik robi dobrze..." value={form.strengths}
            onChange={(e) => handleChange('strengths', e.target.value)} />
        </div>

        <div className="coach-form-group">
          <label>Obszary do poprawy</label>
          <textarea rows={3} placeholder="Nad czym nalezy pracowac..." value={form.areasToImprove}
            onChange={(e) => handleChange('areasToImprove', e.target.value)} />
        </div>

        <div className="coach-form-group">
          <label>Rekomendacje</label>
          <textarea rows={3} placeholder="Zalecenia na nastepny okres..." value={form.recommendations}
            onChange={(e) => handleChange('recommendations', e.target.value)} />
        </div>

        <div className="coach-form-group">
          <label>Dodatkowe notatki</label>
          <textarea rows={2} value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)} />
        </div>

        {/* Skill snapshot */}
        {Object.keys(skillRatings).length > 0 && (
          <div className="coach-form-group">
            <label>Umiejetnosci (snapshot)</label>
            <div className="coach-skill-snapshot">
              {Object.entries(SKILL_NAMES).map(([key, label]) => {
                const val = skillRatings[key]
                if (val === undefined) return null
                return (
                  <div key={key} className="coach-skill-snap-row">
                    <span className="coach-skill-snap-name">{label}</span>
                    <div className="coach-skill-bar-wrap">
                      <div className="coach-skill-bar">
                        <div className="coach-skill-fill" style={{ width: `${val}%` }} />
                      </div>
                      <span className="coach-skill-score">{val}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Visibility */}
        <label className="coach-checkbox">
          <input type="checkbox" checked={form.visibleToParent}
            onChange={(e) => handleChange('visibleToParent', e.target.checked)} />
          Widoczna dla rodzica
        </label>

        {/* Actions */}
        <div className="coach-form-actions">
          <Button variant="secondary" onClick={() => handleSubmit('draft')} loading={saving}>
            <Save size={14} /> Zapisz szkic
          </Button>
          <Button variant="primary" onClick={() => handleSubmit('published')} loading={saving}>
            <Send size={14} /> Opublikuj
          </Button>
          <button className="tp-cancel" onClick={() => navigate(-1)}>Anuluj</button>
        </div>
      </div>
    </div>
  )
}
