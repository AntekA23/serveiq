import { useState } from 'react'
import { Save, X } from 'lucide-react'
import api from '../../../api/axios'
import Button from '../../../components/ui/Button/Button'
import { SESSION_TYPES } from './constants'

const DURATION_PRESETS = [
  { label: '30m', value: 30 },
  { label: '60m', value: 60 },
  { label: '90m', value: 90 },
  { label: '2h', value: 120 },
]

const AUTO_TITLES = {
  kort: 'Trening na korcie',
  sparing: 'Sparing',
  kondycja: 'Trening kondycyjny',
  rozciaganie: 'Rozciaganie',
  mecz: 'Mecz',
  inne: 'Trening',
}

const AUTO_DURATIONS = {
  kort: 90, sparing: 120, kondycja: 60, rozciaganie: 30, mecz: 90, inne: 60,
}

export default function AddSessionInline({ childId, date, onSaved, onCancel }) {
  const [type, setType] = useState('kort')
  const [startTime, setStartTime] = useState('10:00')
  const [duration, setDuration] = useState(90)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleType = (t) => {
    setType(t)
    setDuration(AUTO_DURATIONS[t] || 60)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.post('/sessions', {
        player: childId,
        date,
        startTime,
        sessionType: type,
        durationMinutes: duration,
        title: AUTO_TITLES[type] || 'Trening',
        notes: notes || undefined,
      })
      onSaved()
    } catch { /* silent */ }
    setSaving(false)
  }

  return (
    <div className="tp-add">
      <div className="tp-add-header">
        <span>Dodaj trening</span>
        <button className="tp-icon-btn" onClick={onCancel}><X size={14} /></button>
      </div>

      {/* Types row */}
      <div className="tp-add-types">
        {Object.entries(SESSION_TYPES).map(([key, info]) => {
          const Icon = info.icon
          return (
            <button key={key}
              className={`tp-add-type ${type === key ? 'active' : ''}`}
              style={{ '--t-color': info.color, '--t-bg': info.bg }}
              onClick={() => handleType(key)}
            >
              <Icon size={14} />
              <span>{info.label}</span>
            </button>
          )
        })}
      </div>

      {/* Time + duration row */}
      <div className="tp-add-row">
        <input type="time" className="tp-add-time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        <div className="tp-add-durations">
          {DURATION_PRESETS.map((d) => (
            <button key={d.value} className={`tp-dur-btn ${duration === d.value ? 'active' : ''}`}
              onClick={() => setDuration(d.value)}>{d.label}</button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <input className="tp-add-notes" placeholder="Notatka (opcjonalnie)" value={notes}
        onChange={(e) => setNotes(e.target.value)} />

      <div className="tp-add-actions">
        <Button variant="primary" size="sm" onClick={handleSave} loading={saving}><Save size={14} /> Zapisz</Button>
        <button className="tp-cancel" onClick={onCancel}>Anuluj</button>
      </div>
    </div>
  )
}
