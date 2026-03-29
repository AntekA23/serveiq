import { Trophy, MapPin, Trash2, Edit3 } from 'lucide-react'
import { SURFACES, ROUNDS, daysUntil, formatDateRange } from './constants'

export default function TournamentCard({ tournament, onEdit, onDelete, onResult }) {
  const t = tournament
  const surface = SURFACES[t.surface]
  const days = daysUntil(t.startDate)
  const isUpcoming = t.status === 'planned' || t.status === 'in-progress'
  const roundLabel = ROUNDS.find((r) => r.value === t.result?.round)?.label

  return (
    <div className={`tn-card ${t.status}`}>
      <div className="tn-card-left">
        <div className="tn-card-icon"><Trophy size={18} /></div>
      </div>

      <div className="tn-card-body">
        <div className="tn-card-name">{t.name}</div>
        <div className="tn-card-meta">
          <span>{formatDateRange(t.startDate, t.endDate)}</span>
          {t.location && <span><MapPin size={11} /> {t.location}</span>}
          {surface && <span>{surface.emoji} {surface.label}</span>}
          {t.category && <span className="tn-card-cat">{t.category}</span>}
          {t.drawSize && <span>D{t.drawSize}</span>}
        </div>

        {/* Result for completed */}
        {t.status === 'completed' && t.result && (
          <div className="tn-card-result">
            {roundLabel && <span className="tn-result-round">{roundLabel}</span>}
            {(t.result.wins != null || t.result.losses != null) && (
              <span className="tn-result-wl">{t.result.wins || 0}W-{t.result.losses || 0}L</span>
            )}
            {t.result.scores?.length > 0 && (
              <span className="tn-result-scores">{t.result.scores.join(', ')}</span>
            )}
            {t.result.rating && (
              <span className="tn-result-rating">{'★'.repeat(t.result.rating)}{'☆'.repeat(5 - t.result.rating)}</span>
            )}
          </div>
        )}

        {t.notes && <div className="tn-card-notes">{t.notes}</div>}
      </div>

      <div className="tn-card-right">
        {isUpcoming && days > 0 && (
          <span className="tn-card-countdown">za {days}d</span>
        )}
        {isUpcoming && days <= 0 && days >= -3 && (
          <span className="tn-card-countdown live">teraz</span>
        )}
        {t.status === 'completed' && !t.result?.round && (
          <button className="tn-card-action result" onClick={() => onResult?.(t)}>Dodaj wynik</button>
        )}

        <div className="tn-card-actions">
          <button onClick={() => onEdit?.(t)}><Edit3 size={12} /></button>
          <button onClick={() => onDelete?.(t)}><Trash2 size={12} /></button>
        </div>
      </div>
    </div>
  )
}
