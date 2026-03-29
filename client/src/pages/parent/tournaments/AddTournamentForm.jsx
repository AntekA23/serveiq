import { useState } from 'react'
import { Save, X } from 'lucide-react'
import api from '../../../api/axios'
import Button from '../../../components/ui/Button/Button'
import { SURFACES, CATEGORIES, DRAW_SIZES } from './constants'

export default function AddTournamentForm({ childId, onSaved, onCancel, initial }) {
  const [name, setName] = useState(initial?.name || '')
  const [location, setLocation] = useState(initial?.location || '')
  const [surface, setSurface] = useState(initial?.surface || 'clay')
  const [startDate, setStartDate] = useState(initial?.startDate ? new Date(initial.startDate).toISOString().split('T')[0] : '')
  const [endDate, setEndDate] = useState(initial?.endDate ? new Date(initial.endDate).toISOString().split('T')[0] : '')
  const [category, setCategory] = useState(initial?.category || '')
  const [drawSize, setDrawSize] = useState(initial?.drawSize || null)
  const [notes, setNotes] = useState(initial?.notes || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim() || !startDate) return
    setSaving(true)
    try {
      const payload = {
        name, location: location || undefined, surface, startDate,
        endDate: endDate || undefined, category: category || undefined,
        drawSize: drawSize || undefined, notes: notes || undefined,
      }

      if (initial?._id) {
        await api.put(`/tournaments/${initial._id}`, payload)
      } else {
        await api.post('/tournaments', { ...payload, player: childId })
      }
      onSaved()
    } catch { /* silent */ }
    setSaving(false)
  }

  return (
    <div className="tn-form">
      <div className="tn-form-header">
        <span>{initial?._id ? 'Edytuj turniej' : 'Dodaj turniej'}</span>
        <button className="tp-icon-btn" onClick={onCancel}><X size={14} /></button>
      </div>

      {/* Name */}
      <div className="tn-field">
        <label>Nazwa turnieju *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="np. Mistrzostwa PZT U14 Warszawa" autoFocus />
      </div>

      {/* Location */}
      <div className="tn-field">
        <label>Lokalizacja</label>
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="np. KT Arkadia, Warszawa" />
      </div>

      {/* Surface */}
      <div className="tn-field">
        <label>Nawierzchnia</label>
        <div className="tn-surface-row">
          {Object.entries(SURFACES).map(([key, info]) => (
            <button key={key} className={`tp-surface-btn ${surface === key ? 'active' : ''}`}
              onClick={() => setSurface(key)}>{info.emoji} {info.label}</button>
          ))}
        </div>
      </div>

      {/* Dates */}
      <div className="tn-dates-row">
        <div className="tn-field">
          <label>Data rozpoczecia *</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="tn-field">
          <label>Data zakonczenia</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      {/* Category + Draw */}
      <div className="tn-dates-row">
        <div className="tn-field">
          <label>Kategoria</label>
          <div className="tn-cat-row">
            {CATEGORIES.map((c) => (
              <button key={c} className={`tn-cat-btn ${category === c ? 'active' : ''}`}
                onClick={() => setCategory(category === c ? '' : c)}>{c}</button>
            ))}
          </div>
        </div>
        <div className="tn-field">
          <label>Drabinka</label>
          <div className="tn-cat-row">
            {DRAW_SIZES.map((d) => (
              <button key={d} className={`tn-cat-btn ${drawSize === d ? 'active' : ''}`}
                onClick={() => setDrawSize(drawSize === d ? null : d)}>{d}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="tn-field">
        <label>Notatki</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Dodatkowe informacje..." />
      </div>

      <div className="tn-form-actions">
        <Button variant="primary" size="sm" onClick={handleSave} loading={saving}><Save size={14} /> Zapisz</Button>
        <button className="tp-cancel" onClick={onCancel}>Anuluj</button>
      </div>
    </div>
  )
}
