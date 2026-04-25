import { useState } from 'react'
import { X, Save } from 'lucide-react'
import api from '../../api/axios'
import './MatchForm.css'

const ROUNDS = ['sparing', 'qualif', 'R64', 'R32', 'R16', 'QF', 'SF', 'F', 'final-3rd-place']
const SURFACES = ['clay', 'hard', 'indoor-hard', 'grass']

export default function MatchForm({ playerId, match, onSave, onCancel }) {
  const isEdit = !!match?._id
  const [form, setForm] = useState(() => ({
    date: match?.date ? new Date(match.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    round: match?.round || 'sparing',
    surface: match?.surface || 'clay',
    durationMinutes: match?.durationMinutes || '',
    opponent: {
      name: match?.opponent?.name || '',
      club: match?.opponent?.club || '',
      ranking: match?.opponent?.ranking || {},
    },
    scoutingNotes: match?.scoutingNotes || '',
    won: match?.result?.won ?? true,
    sets: match?.result?.sets?.length ? match.result.sets : [{ playerScore: 6, opponentScore: 4 }],
    keyMoments: (match?.keyMoments || []).join('\n'),
    coachDebrief: match?.coachDebrief || '',
    mentalState: match?.mentalState || 3,
    stats: match?.stats || {},
  }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const updateForm = (patch) => setForm((f) => ({ ...f, ...patch }))
  const updateOpp = (patch) => setForm((f) => ({ ...f, opponent: { ...f.opponent, ...patch } }))
  const updateSet = (idx, patch) => setForm((f) => {
    const sets = [...f.sets]
    sets[idx] = { ...sets[idx], ...patch }
    return { ...f, sets }
  })
  const addSet = () => setForm((f) => ({ ...f, sets: [...f.sets, { playerScore: 0, opponentScore: 0 }] }))
  const removeSet = (idx) => setForm((f) => ({ ...f, sets: f.sets.filter((_, i) => i !== idx) }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        player: playerId,
        date: form.date,
        round: form.round,
        surface: form.surface,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
        opponent: {
          name: form.opponent.name,
          club: form.opponent.club || undefined,
          ranking: form.opponent.ranking,
        },
        scoutingNotes: form.scoutingNotes || undefined,
        result: {
          won: form.won,
          sets: form.sets.map((s) => ({
            playerScore: Number(s.playerScore),
            opponentScore: Number(s.opponentScore),
            tiebreak: s.tiebreak != null && s.tiebreak !== '' ? Number(s.tiebreak) : undefined,
          })),
        },
        keyMoments: form.keyMoments.split('\n').map((s) => s.trim()).filter(Boolean),
        coachDebrief: form.coachDebrief || undefined,
        mentalState: form.mentalState ? Number(form.mentalState) : undefined,
        stats: form.stats,
      }
      const res = isEdit
        ? await api.put(`/matches/${match._id}`, payload)
        : await api.post('/matches', payload)
      onSave(res.data.match)
    } catch (err) {
      setError(err.response?.data?.message || 'Błąd zapisu')
    }
    setSaving(false)
  }

  return (
    <div className="mf-overlay" onClick={onCancel}>
      <form className="mf-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <header className="mf-header">
          <h2>{isEdit ? 'Edytuj mecz' : 'Nowy mecz'}</h2>
          <button type="button" className="mf-close" onClick={onCancel}><X size={18} /></button>
        </header>

        <div className="mf-grid">
          <label>Data
            <input type="date" value={form.date} onChange={(e) => updateForm({ date: e.target.value })} required />
          </label>
          <label>Runda
            <select value={form.round} onChange={(e) => updateForm({ round: e.target.value })}>
              {ROUNDS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label>Nawierzchnia
            <select value={form.surface} onChange={(e) => updateForm({ surface: e.target.value })}>
              {SURFACES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label>Czas (min)
            <input type="number" value={form.durationMinutes} onChange={(e) => updateForm({ durationMinutes: e.target.value })} />
          </label>
        </div>

        <fieldset className="mf-fs">
          <legend>Rywalka</legend>
          <input placeholder="Imię i nazwisko" value={form.opponent.name} onChange={(e) => updateOpp({ name: e.target.value })} required />
          <input placeholder="Klub (opcjonalnie)" value={form.opponent.club} onChange={(e) => updateOpp({ club: e.target.value })} />
          <input type="number" placeholder="Ranking PZT" value={form.opponent.ranking?.pzt || ''} onChange={(e) => updateOpp({ ranking: { ...form.opponent.ranking, pzt: e.target.value ? Number(e.target.value) : undefined } })} />
        </fieldset>

        <label>Scouting (przed meczem)
          <textarea rows={3} value={form.scoutingNotes} onChange={(e) => updateForm({ scoutingNotes: e.target.value })} />
        </label>

        <fieldset className="mf-fs">
          <legend>Wynik</legend>
          <label className="mf-switch">
            <input type="checkbox" checked={form.won} onChange={(e) => updateForm({ won: e.target.checked })} />
            Wygrana
          </label>
          {form.sets.map((s, idx) => (
            <div key={idx} className="mf-set-row">
              <span>Set {idx + 1}</span>
              <input type="number" value={s.playerScore} onChange={(e) => updateSet(idx, { playerScore: e.target.value })} />
              <span>:</span>
              <input type="number" value={s.opponentScore} onChange={(e) => updateSet(idx, { opponentScore: e.target.value })} />
              <input type="number" placeholder="TB" value={s.tiebreak ?? ''} onChange={(e) => updateSet(idx, { tiebreak: e.target.value })} />
              <button type="button" className="mf-set-rm" onClick={() => removeSet(idx)}>×</button>
            </div>
          ))}
          <button type="button" className="mf-add-set" onClick={addSet}>+ dodaj set</button>
        </fieldset>

        <label>Kluczowe momenty (po jednym w linii)
          <textarea rows={3} value={form.keyMoments} onChange={(e) => updateForm({ keyMoments: e.target.value })} />
        </label>

        <label>Debrief trenera (po meczu)
          <textarea rows={3} value={form.coachDebrief} onChange={(e) => updateForm({ coachDebrief: e.target.value })} />
        </label>

        <label>Stan mentalny (1-5)
          <input type="number" min={1} max={5} value={form.mentalState} onChange={(e) => updateForm({ mentalState: e.target.value })} />
        </label>

        {error && <div className="mf-error">{error}</div>}

        <footer className="mf-footer">
          <button type="button" onClick={onCancel}>Anuluj</button>
          <button type="submit" disabled={saving}>
            <Save size={14} /> {saving ? 'Zapisuję...' : 'Zapisz'}
          </button>
        </footer>
      </form>
    </div>
  )
}
