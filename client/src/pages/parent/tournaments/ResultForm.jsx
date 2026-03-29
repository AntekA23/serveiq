import { useState } from 'react'
import { Save, X, Plus, Minus } from 'lucide-react'
import api from '../../../api/axios'
import Button from '../../../components/ui/Button/Button'
import { ROUNDS } from './constants'

export default function ResultForm({ tournament, onSaved, onCancel }) {
  const r = tournament.result || {}
  const [round, setRound] = useState(r.round || '')
  const [wins, setWins] = useState(r.wins ?? 0)
  const [losses, setLosses] = useState(r.losses ?? 0)
  const [scores, setScores] = useState(r.scores?.length > 0 ? r.scores : [''])
  const [rating, setRating] = useState(r.rating || 0)
  const [notes, setNotes] = useState(tournament.notes || '')
  const [saving, setSaving] = useState(false)

  const addScore = () => setScores((p) => [...p, ''])
  const removeScore = (idx) => setScores((p) => p.filter((_, i) => i !== idx))
  const updateScore = (idx, val) => setScores((p) => p.map((s, i) => i === idx ? val : s))

  const handleSave = async () => {
    setSaving(true)
    try {
      const filteredScores = scores.filter((s) => s.trim())
      await api.put(`/tournaments/${tournament._id}`, {
        status: 'completed',
        result: { round: round || undefined, wins, losses, scores: filteredScores, rating: rating || undefined },
        notes: notes || undefined,
      })
      onSaved()
    } catch { /* silent */ }
    setSaving(false)
  }

  return (
    <div className="tn-form result-form">
      <div className="tn-form-header">
        <span>Wynik — {tournament.name}</span>
        <button className="tp-icon-btn" onClick={onCancel}><X size={14} /></button>
      </div>

      {/* Round */}
      <div className="tn-field">
        <label>Runda</label>
        <div className="tn-rounds">
          {ROUNDS.map((r) => (
            <button key={r.value} className={`tn-round-btn ${round === r.value ? 'active' : ''}`}
              onClick={() => setRound(round === r.value ? '' : r.value)}>{r.label}</button>
          ))}
        </div>
      </div>

      {/* W-L */}
      <div className="tn-wl-row">
        <div className="tn-field">
          <label>Wygrane</label>
          <input type="number" min={0} value={wins} onChange={(e) => setWins(Number(e.target.value))} />
        </div>
        <div className="tn-field">
          <label>Przegrane</label>
          <input type="number" min={0} value={losses} onChange={(e) => setLosses(Number(e.target.value))} />
        </div>
      </div>

      {/* Set scores */}
      <div className="tn-field">
        <label>Wyniki setow</label>
        <div className="tn-scores-list">
          {scores.map((s, idx) => (
            <div key={idx} className="tn-score-row">
              <span className="tn-set-label">Set {idx + 1}</span>
              <input value={s} onChange={(e) => updateScore(idx, e.target.value)} placeholder="6-3" className="tn-score-input" />
              {scores.length > 1 && (
                <button className="tn-score-rm" onClick={() => removeScore(idx)}><Minus size={12} /></button>
              )}
            </div>
          ))}
          <button className="tn-score-add" onClick={addScore}><Plus size={12} /> Dodaj set</button>
        </div>
      </div>

      {/* Rating */}
      <div className="tn-field">
        <label>Ocena wystepу</label>
        <div className="tn-rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} className={`tn-star ${rating >= star ? 'active' : ''}`}
              onClick={() => setRating(rating === star ? 0 : star)}>★</button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="tn-field">
        <label>Notatki</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Jak poszlo..." />
      </div>

      <div className="tn-form-actions">
        <Button variant="primary" size="sm" onClick={handleSave} loading={saving}><Save size={14} /> Zapisz wynik</Button>
        <button className="tp-cancel" onClick={onCancel}>Anuluj</button>
      </div>
    </div>
  )
}
