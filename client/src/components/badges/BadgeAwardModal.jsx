import { useState } from 'react'
import { X } from 'lucide-react'
import api from '../../api/axios'
import BadgeIcon from './BadgeIcon'
import Button from '../ui/Button/Button'
import './BadgeAwardModal.css'

const MANUAL_BADGES = [
  { slug: 'coach-mvp', name: 'MVP miesiąca', icon: 'coachMvp', description: 'Wyróżnienie jako MVP' },
  { slug: 'coach-progress', name: 'Największy postęp', icon: 'coachProgress', description: 'Wyróżnienie za duży postęp' },
  { slug: 'coach-sportsmanship', name: 'Sportowe zachowanie', icon: 'coachSportsmanship', description: 'Wyróżnienie za fair play' },
  { slug: 'coach-leader', name: 'Lider grupy', icon: 'coachLeader', description: 'Wyróżnienie za przywództwo' },
  { slug: 'coach-star', name: 'Gwiazda treningu', icon: 'coachStar', description: 'Specjalne wyróżnienie' },
]

export default function BadgeAwardModal({ playerId, onClose, onAwarded }) {
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleAward = async () => {
    if (!selected) return
    setSaving(true)
    setError(null)
    try {
      await api.post(`/badges/${playerId}/award`, {
        badgeSlug: selected,
        note: note.trim() || undefined,
      })
      if (onAwarded) onAwarded()
      onClose()
    } catch (err) {
      const msg = err.response?.data?.message || 'Nie udało się przyznać odznaki'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bam-overlay" onClick={onClose}>
      <div className="bam-modal" onClick={e => e.stopPropagation()}>
        <div className="bam-header">
          <h3 className="bam-title">Przyznaj odznakę</h3>
          <button className="bam-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="bam-badges">
          {MANUAL_BADGES.map(b => (
            <button
              key={b.slug}
              className={`bam-badge-option ${selected === b.slug ? 'selected' : ''}`}
              onClick={() => setSelected(b.slug)}
            >
              <BadgeIcon icon={b.icon} earned={true} size={48} />
              <span className="bam-badge-name">{b.name}</span>
            </button>
          ))}
        </div>

        <div className="bam-note-group">
          <label className="bam-label">Notatka (opcjonalnie)</label>
          <textarea
            className="bam-note"
            value={note}
            onChange={e => setNote(e.target.value)}
            maxLength={200}
            placeholder="Np. Świetna postawa na turnieju w Krakowie!"
            rows={2}
          />
          <span className="bam-char-count">{note.length} / 200</span>
        </div>

        {error && <div className="bam-error">{error}</div>}

        <div className="bam-actions">
          <Button size="sm" onClick={onClose} style={{ background: 'transparent', color: 'var(--color-text-secondary)' }}>
            Anuluj
          </Button>
          <Button size="sm" onClick={handleAward} disabled={!selected || saving}>
            {saving ? 'Przyznawanie...' : 'Przyznaj odznakę'}
          </Button>
        </div>
      </div>
    </div>
  )
}
