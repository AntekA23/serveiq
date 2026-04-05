import { useState, useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import api from '../../api/axios'

const TYPE_OPTIONS = [
  { value: 'class', label: 'Zajecia' },
  { value: 'camp', label: 'Oboz' },
  { value: 'tournament', label: 'Turniej' },
  { value: 'training', label: 'Trening' },
  { value: 'match', label: 'Mecz' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'review', label: 'Przeglad' },
  { value: 'other', label: 'Inne' },
]

const SURFACE_OPTIONS = [
  { value: '', label: 'Nie wybrano' },
  { value: 'clay', label: 'Maczka (clay)' },
  { value: 'hard', label: 'Twarda (hard)' },
  { value: 'grass', label: 'Trawa (grass)' },
  { value: 'carpet', label: 'Dywan (carpet)' },
  { value: 'indoor-hard', label: 'Hala (indoor-hard)' },
]

const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(6px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  animation: 'fadeIn 0.2s ease',
}

const modal = {
  background: 'var(--color-bg-secondary)',
  border: '1px solid var(--color-border-md)',
  borderRadius: 'var(--radius-lg, 12px)',
  width: '90%',
  maxWidth: 540,
  maxHeight: '85vh',
  overflowY: 'auto',
  boxShadow: 'var(--shadow-modal, 0 8px 32px rgba(0,0,0,0.3))',
}

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '18px 22px',
  borderBottom: '1px solid var(--color-border)',
}

const titleStyle = {
  fontFamily: "'Bebas Neue', sans-serif",
  fontSize: 20,
  fontWeight: 400,
  letterSpacing: '0.8px',
  textTransform: 'uppercase',
  margin: 0,
}

const bodyStyle = { padding: 22 }

const fieldGroup = { marginBottom: 16 }

const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  marginBottom: 6,
}

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border-md)',
  borderRadius: 8,
  fontSize: 14,
  color: 'var(--color-text)',
  outline: 'none',
  boxSizing: 'border-box',
}

const selectStyle = { ...inputStyle, cursor: 'pointer' }

const textareaStyle = { ...inputStyle, minHeight: 70, resize: 'vertical' }

const rowStyle = { display: 'flex', gap: 12 }

const halfStyle = { flex: 1, minWidth: 0 }

const checkboxRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 16,
  fontSize: 14,
  cursor: 'pointer',
}

const footerStyle = {
  padding: '14px 22px',
  borderTop: '1px solid var(--color-border)',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
}

const btnBase = {
  padding: '8px 18px',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  border: 'none',
}

const btnCancel = {
  ...btnBase,
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border-md)',
  color: 'var(--color-text-secondary)',
}

const btnSubmit = {
  ...btnBase,
  background: 'var(--color-accent)',
  color: '#0B0E14',
}

const chipContainer = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  marginTop: 8,
}

const chip = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '3px 10px',
  background: 'var(--color-accent-muted, rgba(59,130,246,0.1))',
  color: 'var(--color-accent)',
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  border: 'none',
}

const chipSelected = {
  ...chip,
  background: 'var(--color-accent)',
  color: '#0B0E14',
}

const errStyle = {
  color: '#ef4444',
  fontSize: 13,
  marginBottom: 12,
  padding: '8px 12px',
  background: 'rgba(239,68,68,0.08)',
  borderRadius: 8,
}

function calcDuration(start, end) {
  if (!start || !end) return ''
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const diff = (eh * 60 + em) - (sh * 60 + sm)
  return diff > 0 ? String(diff) : ''
}

export default function ActivityForm({ activity, onClose, onSaved }) {
  const isEdit = !!activity

  const [form, setForm] = useState({
    type: activity?.type || 'training',
    title: activity?.title || '',
    date: activity?.date ? new Date(activity.date).toISOString().split('T')[0] : '',
    startTime: activity?.startTime || '',
    endTime: activity?.endTime || '',
    durationMinutes: activity?.durationMinutes || '',
    location: activity?.location || '',
    surface: activity?.surface || '',
    focusAreas: activity?.focusAreas?.join(', ') || '',
    notes: activity?.notes || '',
    parentNotes: activity?.parentNotes || '',
    visibleToParent: activity?.visibleToParent !== undefined ? activity.visibleToParent : true,
    tournamentCategory: activity?.tournamentData?.category || '',
    tournamentDrawSize: activity?.tournamentData?.drawSize || '',
  })

  const [players, setPlayers] = useState([])
  const [selectedPlayerIds, setSelectedPlayerIds] = useState(
    () => (activity?.players || []).map((p) => (typeof p === 'string' ? p : p._id))
  )
  const [loadingPlayers, setLoadingPlayers] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const fetchPlayers = async () => {
      try {
        const { data } = await api.get('/players')
        const list = Array.isArray(data) ? data : data.players || []
        if (!cancelled) setPlayers(list)
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoadingPlayers(false)
      }
    }
    fetchPlayers()
    return () => { cancelled = true }
  }, [])

  // Auto-calculate duration from startTime/endTime
  useEffect(() => {
    const auto = calcDuration(form.startTime, form.endTime)
    if (auto) {
      setForm((prev) => ({ ...prev, durationMinutes: auto }))
    }
  }, [form.startTime, form.endTime])

  const handleChange = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [field]: val }))
  }

  const togglePlayer = (id) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.title.trim()) { setError('Tytul jest wymagany'); return }
    if (!form.date) { setError('Data jest wymagana'); return }

    setSubmitting(true)

    try {
      const payload = {
        type: form.type,
        title: form.title.trim(),
        date: form.date,
        startTime: form.startTime || undefined,
        endTime: form.endTime || undefined,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
        players: selectedPlayerIds.length > 0 ? selectedPlayerIds : undefined,
        location: form.location.trim() || undefined,
        surface: form.surface || undefined,
        focusAreas: form.focusAreas.trim()
          ? form.focusAreas.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
        notes: form.notes.trim() || undefined,
        parentNotes: form.parentNotes.trim() || undefined,
        visibleToParent: form.visibleToParent,
      }

      if (form.type === 'tournament') {
        payload.tournamentData = {
          category: form.tournamentCategory.trim() || undefined,
          drawSize: form.tournamentDrawSize ? Number(form.tournamentDrawSize) : undefined,
        }
      }

      if (isEdit) {
        await api.put(`/activities/${activity._id}`, payload)
      } else {
        await api.post('/activities', payload)
      }

      onSaved()
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Wystapil blad'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setSubmitting(false)
    }
  }

  const isTournament = form.type === 'tournament'

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <h3 style={titleStyle}>{isEdit ? 'Edytuj aktywnosc' : 'Nowa aktywnosc'}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-tertiary)', padding: 4, borderRadius: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={bodyStyle}>
          {error && <div style={errStyle}>{error}</div>}

          {/* Type + Title */}
          <div style={rowStyle}>
            <div style={{ ...fieldGroup, ...halfStyle }}>
              <label style={labelStyle}>Typ *</label>
              <select value={form.type} onChange={handleChange('type')} style={selectStyle}>
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div style={{ ...fieldGroup, ...halfStyle }}>
              <label style={labelStyle}>Tytul *</label>
              <input value={form.title} onChange={handleChange('title')} style={inputStyle} placeholder="np. Trening forehand" />
            </div>
          </div>

          {/* Date row */}
          <div style={rowStyle}>
            <div style={{ ...fieldGroup, ...halfStyle }}>
              <label style={labelStyle}>Data *</label>
              <input type="date" value={form.date} onChange={handleChange('date')} style={inputStyle} />
            </div>
            <div style={{ ...fieldGroup, ...halfStyle }}>
              <label style={labelStyle}>Czas trwania (min)</label>
              <input
                type="number" min="1"
                value={form.durationMinutes} onChange={handleChange('durationMinutes')}
                style={inputStyle} placeholder="np. 60"
              />
            </div>
          </div>

          {/* Time row */}
          <div style={rowStyle}>
            <div style={{ ...fieldGroup, ...halfStyle }}>
              <label style={labelStyle}>Godzina rozpoczecia</label>
              <input type="time" value={form.startTime} onChange={handleChange('startTime')} style={inputStyle} />
            </div>
            <div style={{ ...fieldGroup, ...halfStyle }}>
              <label style={labelStyle}>Godzina zakonczenia</label>
              <input type="time" value={form.endTime} onChange={handleChange('endTime')} style={inputStyle} />
            </div>
          </div>

          {/* Location + Surface */}
          <div style={rowStyle}>
            <div style={{ ...fieldGroup, ...halfStyle }}>
              <label style={labelStyle}>Lokalizacja</label>
              <input value={form.location} onChange={handleChange('location')} style={inputStyle} placeholder="np. Kort 3" />
            </div>
            <div style={{ ...fieldGroup, ...halfStyle }}>
              <label style={labelStyle}>Nawierzchnia</label>
              <select value={form.surface} onChange={handleChange('surface')} style={selectStyle}>
                {SURFACE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Players */}
          <div style={fieldGroup}>
            <label style={labelStyle}>Zawodnicy</label>
            {loadingPlayers ? (
              <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>Ladowanie zawodnikow...</div>
            ) : players.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>Brak dostepnych zawodnikow</div>
            ) : (
              <div style={chipContainer}>
                {players.map((p) => {
                  const isSelected = selectedPlayerIds.includes(p._id)
                  return (
                    <button
                      key={p._id} type="button"
                      onClick={() => togglePlayer(p._id)}
                      style={isSelected ? chipSelected : chip}
                    >
                      {p.firstName} {p.lastName}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Focus areas */}
          <div style={fieldGroup}>
            <label style={labelStyle}>Obszary fokusowe (oddzielone przecinkami)</label>
            <input
              value={form.focusAreas} onChange={handleChange('focusAreas')}
              style={inputStyle} placeholder="np. serwis, return, wolej"
            />
          </div>

          {/* Notes */}
          <div style={fieldGroup}>
            <label style={labelStyle}>Notatki</label>
            <textarea value={form.notes} onChange={handleChange('notes')} style={textareaStyle} placeholder="Notatki dotyczace aktywnosci..." />
          </div>

          {/* Parent notes */}
          <div style={fieldGroup}>
            <label style={labelStyle}>Notatki dla rodzicow</label>
            <textarea value={form.parentNotes} onChange={handleChange('parentNotes')} style={textareaStyle} placeholder="Informacje widoczne dla rodzicow..." />
          </div>

          {/* Visible to parent */}
          <label style={checkboxRow}>
            <input
              type="checkbox"
              checked={form.visibleToParent}
              onChange={handleChange('visibleToParent')}
              style={{ width: 16, height: 16, accentColor: 'var(--color-accent)' }}
            />
            Widoczne dla rodzicow
          </label>

          {/* Tournament extras */}
          {isTournament && (
            <div style={rowStyle}>
              <div style={{ ...fieldGroup, ...halfStyle }}>
                <label style={labelStyle}>Kategoria turnieju</label>
                <input value={form.tournamentCategory} onChange={handleChange('tournamentCategory')} style={inputStyle} placeholder="np. U14" />
              </div>
              <div style={{ ...fieldGroup, ...halfStyle }}>
                <label style={labelStyle}>Rozmiar drabinki</label>
                <input type="number" min="2" value={form.tournamentDrawSize} onChange={handleChange('tournamentDrawSize')} style={inputStyle} placeholder="np. 32" />
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={footerStyle}>
            <button type="button" onClick={onClose} style={btnCancel} disabled={submitting}>
              Anuluj
            </button>
            <button type="submit" style={{ ...btnSubmit, opacity: submitting ? 0.7 : 1 }} disabled={submitting}>
              {submitting ? 'Zapisywanie...' : isEdit ? 'Zapisz zmiany' : 'Dodaj aktywnosc'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
