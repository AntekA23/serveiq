import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import api from '../../api/axios'
import Button from '../../components/ui/Button/Button'
import useToast from '../../hooks/useToast'
import './Coach.css'

export default function CoachNewPlayer() {
  const navigate = useNavigate()
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    monthlyRate: '',
    parentEmail: '',
  })

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName) {
      toast.error('Imie i nazwisko sa wymagane')
      return
    }
    setSaving(true)
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
      }
      if (form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth
      if (form.gender) payload.gender = form.gender
      if (form.monthlyRate) payload.monthlyRate = Number(form.monthlyRate)
      if (form.parentEmail) payload.parentEmail = form.parentEmail

      const { data } = await api.post('/players', payload)
      toast.success('Zawodnik dodany')
      navigate(`/coach/player/${data.player._id}`)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Nie udalo sie dodac zawodnika')
    }
    setSaving(false)
  }

  return (
    <div className="coach-page">
      <button className="coach-back" onClick={() => navigate('/coach/players')}>
        <ArrowLeft size={16} /> Zawodnicy
      </button>

      <h1 className="page-title">Nowy zawodnik</h1>

      <div className="coach-form">
        <div className="coach-form-row">
          <div className="coach-form-group">
            <label>Imie *</label>
            <input type="text" value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)}
              placeholder="Imie zawodnika" autoFocus />
          </div>
          <div className="coach-form-group">
            <label>Nazwisko *</label>
            <input type="text" value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)}
              placeholder="Nazwisko" />
          </div>
        </div>

        <div className="coach-form-row">
          <div className="coach-form-group">
            <label>Data urodzenia</label>
            <input type="date" value={form.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)} />
          </div>
          <div className="coach-form-group">
            <label>Plec</label>
            <select value={form.gender} onChange={(e) => handleChange('gender', e.target.value)}>
              <option value="">Wybierz...</option>
              <option value="M">Chlopiec</option>
              <option value="F">Dziewczyna</option>
            </select>
          </div>
          <div className="coach-form-group">
            <label>Stawka (PLN/mies)</label>
            <input type="number" min={0} value={form.monthlyRate}
              onChange={(e) => handleChange('monthlyRate', e.target.value)}
              placeholder="np. 800" />
          </div>
        </div>

        <div className="coach-form-group">
          <label>Email rodzica (opcjonalnie — wyslemy zaproszenie)</label>
          <input type="email" value={form.parentEmail} onChange={(e) => handleChange('parentEmail', e.target.value)}
            placeholder="rodzic@email.com" />
        </div>

        <div className="coach-form-actions">
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            <Save size={14} /> Dodaj zawodnika
          </Button>
          <button className="tp-cancel" onClick={() => navigate('/coach/players')}>Anuluj</button>
        </div>
      </div>
    </div>
  )
}
