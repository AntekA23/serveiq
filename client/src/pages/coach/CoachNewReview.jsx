import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save, Send, Trash2, Sparkles, Database } from 'lucide-react'
import api from '../../api/axios'
import Button from '../../components/ui/Button/Button'
import useToast from '../../hooks/useToast'
import './Coach.css'

const PERIOD_TYPES = [
  { value: 'monthly', label: 'Miesieczny' },
  { value: 'quarterly', label: 'Kwartalny' },
  { value: 'seasonal', label: 'Sezonowy' },
  { value: 'weekly', label: 'Tygodniowy' },
  { value: 'ad-hoc', label: 'Dorazny' },
]

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
    periodType: 'monthly',
    title: '',
    whatHappened: '',
    whatWentWell: '',
    whatNeedsFocus: '',
    nextSteps: '',
    visibleToParent: true,
  })

  const [prefilling, setPrefilling] = useState(false)
  const [prefillData, setPrefillData] = useState(null)

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
            periodType: r.periodType || 'monthly',
            title: r.title || '',
            whatHappened: r.whatHappened || '',
            whatWentWell: r.whatWentWell || '',
            whatNeedsFocus: r.whatNeedsFocus || '',
            nextSteps: r.nextSteps || '',
            visibleToParent: r.visibleToParent !== false,
          })
        }
      } catch {
        if (isEdit) {
          toast.error('Nie udalo sie zaladowac przegladu')
          navigate('/coach/reviews')
        }
      }
      setLoading(false)
    }
    fetch()
  }, [editId])

  const handlePrefill = async () => {
    if (!form.player) {
      toast.error('Najpierw wybierz zawodnika')
      return
    }
    setPrefilling(true)
    try {
      if (isEdit) {
        const { data } = await api.get(`/reviews/${editId}/prefill`)
        setPrefillData(data.prefill)
      } else {
        const [activitiesRes, observationsRes, goalsRes] = await Promise.all([
          api.get('/activities', { params: { player: form.player } }),
          api.get('/observations', { params: { player: form.player } }),
          api.get('/goals', { params: { player: form.player, status: 'active' } }),
        ])

        const start = new Date(form.periodStart)
        const end = new Date(form.periodEnd)
        end.setHours(23, 59, 59, 999)

        const allActivities = activitiesRes.data.activities || activitiesRes.data || []
        const periodActivities = allActivities.filter((a) => {
          const d = new Date(a.date)
          return d >= start && d <= end
        })

        const allObs = observationsRes.data.observations || observationsRes.data || []
        const periodObs = allObs.filter((o) => {
          const d = new Date(o.createdAt)
          return d >= start && d <= end
        })

        const activeGoals = goalsRes.data.goals || goalsRes.data || []

        setPrefillData({
          activitiesCount: periodActivities.length,
          observations: periodObs,
          activeGoals,
          attendanceRate: null,
          periodStart: form.periodStart,
          periodEnd: form.periodEnd,
        })
      }
      toast.success('Dane okresu zaladowane')
    } catch {
      toast.error('Nie udalo sie pobrac danych')
    }
    setPrefilling(false)
  }

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
        whatHappened: r.whatHappened || r.notes || prev.whatHappened,
        whatWentWell: r.whatWentWell || r.strengths || prev.whatWentWell,
        whatNeedsFocus: r.whatNeedsFocus || r.areasToImprove || prev.whatNeedsFocus,
        nextSteps: r.nextSteps || r.recommendations || prev.nextSteps,
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
      toast.error('Podaj tytul przegladu')
      return
    }
    setSaving(true)
    try {
      const payload = {
        player: form.player,
        periodType: form.periodType,
        periodStart: form.periodStart,
        periodEnd: form.periodEnd,
        title: form.title,
        whatHappened: form.whatHappened,
        whatWentWell: form.whatWentWell,
        whatNeedsFocus: form.whatNeedsFocus,
        nextSteps: form.nextSteps,
        visibleToParent: form.visibleToParent,
        status,
      }

      if (isEdit) {
        const { player, ...updatePayload } = payload
        await api.put(`/reviews/${editId}`, updatePayload)
        toast.success(status === 'published' ? 'Przeglad opublikowany' : 'Przeglad zapisany')
      } else {
        await api.post('/reviews', payload)
        toast.success(status === 'published' ? 'Przeglad opublikowany' : 'Szkic zapisany')
      }
      navigate('/coach/reviews')
    } catch {
      toast.error('Nie udalo sie zapisac przegladu')
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!window.confirm('Usunac ten przeglad?')) return
    try {
      await api.delete(`/reviews/${editId}`)
      toast.success('Przeglad usuniety')
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
        <h1 className="page-title">{isEdit ? 'Edytuj przeglad' : 'Nowy przeglad'}</h1>
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

        {/* Period Type */}
        <div className="coach-form-group">
          <label>Typ przegladu</label>
          <div className="coach-type-grid">
            {PERIOD_TYPES.map((t) => (
              <button key={t.value}
                className={`coach-type-btn ${form.periodType === t.value ? 'active' : ''}`}
                onClick={() => handleChange('periodType', t.value)}>
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

        {/* AI Toolbar */}
        <div className="coach-ai-generate">
          <Button size="sm" variant="secondary" onClick={handlePrefill} loading={prefilling}
            disabled={!form.player || !form.periodStart || !form.periodEnd}>
            <Database size={14} /> Wypełnij danymi
          </Button>
          <Button size="sm" onClick={handleAiGenerate} loading={aiGenerating}
            disabled={!form.player || !form.periodStart || !form.periodEnd}>
            <Sparkles size={14} /> {aiGenerating ? 'Generowanie...' : 'Wygeneruj draft AI'}
          </Button>
        </div>

        {/* Title */}
        <div className="coach-form-group">
          <label>Tytul *</label>
          <input type="text" placeholder="np. Przeglad miesieczny — marzec 2026" value={form.title}
            onChange={(e) => handleChange('title', e.target.value)} />
        </div>

        {/* Narrative — simplified to 2 fields */}
        <div className="coach-form-group">
          <label>Podsumowanie okresu</label>
          <textarea rows={4} placeholder="Co sie dzialo, co poszlo dobrze, mocne strony..." value={form.whatHappened}
            onChange={(e) => handleChange('whatHappened', e.target.value)} />
        </div>

        <div className="coach-form-group">
          <label>Rekomendacje i kolejne kroki</label>
          <textarea rows={4} placeholder="Obszary do poprawy, rekomendacje na nastepny okres..." value={form.nextSteps}
            onChange={(e) => handleChange('nextSteps', e.target.value)} />
        </div>

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
