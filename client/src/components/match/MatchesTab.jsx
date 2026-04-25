import { useEffect, useState } from 'react'
import { Plus, Edit3, Trash2 } from 'lucide-react'
import api from '../../api/axios'
import MatchCard from './MatchCard'
import MatchDetail from './MatchDetail'
import MatchForm from './MatchForm'
import './MatchesTab.css'

export default function MatchesTab({ playerId }) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)

  const reload = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/matches?player=${playerId}`)
      setMatches(res.data.matches || [])
    } catch { /* silent */ }
    setLoading(false)
  }

  useEffect(() => { reload() }, [playerId])

  const handleSave = () => {
    setCreating(false)
    setEditing(null)
    reload()
  }

  const handleDelete = async (m) => {
    if (!window.confirm(`Usunąć mecz vs. ${m.opponent?.name}?`)) return
    try {
      await api.delete(`/matches/${m._id}`)
      reload()
    } catch { /* silent */ }
  }

  if (loading) return <div className="mt-loading">Ładuję mecze...</div>

  return (
    <div className="mt-tab">
      <header className="mt-header">
        <h3>Mecze ({matches.length})</h3>
        <button className="mt-add" onClick={() => setCreating(true)}>
          <Plus size={14} /> Nowy mecz
        </button>
      </header>

      {matches.length === 0 ? (
        <div className="mt-empty">Brak meczy. Kliknij "Nowy mecz" żeby zacząć.</div>
      ) : (
        <div className="mt-list">
          {matches.map((m) => (
            <div key={m._id} className="mt-item">
              <MatchCard match={m} onClick={() => setDetail(m)} />
              <div className="mt-actions">
                <button onClick={() => setEditing(m)} title="Edytuj"><Edit3 size={14} /></button>
                <button onClick={() => handleDelete(m)} title="Usuń"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {detail && <MatchDetail match={detail} onClose={() => setDetail(null)} />}
      {(editing || creating) && (
        <MatchForm
          playerId={playerId}
          match={editing}
          onSave={handleSave}
          onCancel={() => { setCreating(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
