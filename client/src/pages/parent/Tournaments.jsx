import { useState, useEffect, useCallback } from 'react'
import { Plus, Trophy } from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import useToast from '../../hooks/useToast'
import Avatar from '../../components/ui/Avatar/Avatar'
import ConfirmModal from '../../components/ui/ConfirmModal'
import TournamentCard from './tournaments/TournamentCard'
import AddTournamentForm from './tournaments/AddTournamentForm'
import ResultForm from './tournaments/ResultForm'
import TournamentStats from './tournaments/TournamentStats'
import './Tournaments.css'

export default function Tournaments() {
  const user = useAuthStore((s) => s.user)
  const toast = useToast()
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [tournaments, setTournaments] = useState([])
  const [tab, setTab] = useState('upcoming')
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)
  const [resultFor, setResultFor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchChildren = useCallback(async () => {
    try {
      const { data: raw } = await api.get('/players')
      const players = Array.isArray(raw) ? raw : raw.players || []
      const ids = user?.parentProfile?.children || []
      return ids.length > 0 ? players.filter((p) => ids.includes(p._id)) : players
    } catch { return [] }
  }, [user])

  const fetchTournaments = useCallback(async (playerId) => {
    try {
      const { data } = await api.get(`/tournaments?player=${playerId}`)
      setTournaments(data.tournaments || [])
    } catch { setTournaments([]) }
  }, [])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const kids = await fetchChildren()
      setChildren(kids)
      if (kids.length > 0) {
        setSelectedChild(kids[0])
        await fetchTournaments(kids[0]._id)
      }
      setLoading(false)
    }
    init()
  }, [user, fetchChildren, fetchTournaments])

  useEffect(() => {
    if (selectedChild) fetchTournaments(selectedChild._id)
  }, [selectedChild, fetchTournaments])

  const refresh = () => selectedChild && fetchTournaments(selectedChild._id)

  const handleSaved = () => {
    toast.success(editing ? 'Turniej zaktualizowany' : 'Turniej dodany')
    setAdding(false)
    setEditing(null)
    refresh()
  }

  const handleResultSaved = () => {
    toast.success('Wynik zapisany')
    setResultFor(null)
    refresh()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.delete(`/tournaments/${deleteTarget._id}`)
      toast.success('Turniej usunięty')
      refresh()
    } catch { toast.error('Nie udało się usunąć') }
    setDeleteTarget(null)
  }

  const now = new Date()
  const upcoming = tournaments
    .filter((t) => t.status === 'planned' || t.status === 'in-progress' || new Date(t.startDate) >= now)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
  const history = tournaments
    .filter((t) => t.status === 'completed' || t.status === 'cancelled')
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))

  if (loading) return <div className="tn-page"><h1 className="page-title">Turnieje</h1><div className="tn-loading">Ladowanie...</div></div>
  if (!selectedChild) return <div className="tn-page"><h1 className="page-title">Turnieje</h1><div className="tn-loading">Brak przypisanych zawodnikow</div></div>

  return (
    <div className="tn-page">
      {children.length > 1 && (
        <div className="child-selector">
          {children.map((child) => (
            <button key={child._id} className={`child-selector-btn ${selectedChild?._id === child._id ? 'active' : ''}`}
              onClick={() => setSelectedChild(child)}>
              <Avatar firstName={child.firstName} lastName={child.lastName} size={28} role="player" />
              <span>{child.firstName}</span>
            </button>
          ))}
        </div>
      )}

      <div className="tn-header">
        <h1 className="page-title">Turnieje — {selectedChild.firstName}</h1>
        {!adding && !editing && (
          <button className="tn-add-btn" onClick={() => setAdding(true)}><Plus size={16} /> Dodaj turniej</button>
        )}
      </div>

      {/* Add / Edit form */}
      {(adding || editing) && (
        <AddTournamentForm
          childId={selectedChild._id}
          initial={editing}
          onSaved={handleSaved}
          onCancel={() => { setAdding(false); setEditing(null) }}
        />
      )}

      {/* Result form */}
      {resultFor && (
        <ResultForm tournament={resultFor} onSaved={handleResultSaved} onCancel={() => setResultFor(null)} />
      )}

      {/* Tabs */}
      <div className="tp-tabs">
        <button className={`tp-tab ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>
          Nadchodzace {upcoming.length > 0 && <span className="tn-tab-count">{upcoming.length}</span>}
        </button>
        <button className={`tp-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
          Historia {history.length > 0 && <span className="tn-tab-count">{history.length}</span>}
        </button>
      </div>

      {/* Content */}
      {tab === 'upcoming' ? (
        <div className="tn-list">
          {upcoming.length === 0 ? (
            <div className="tn-empty">
              <Trophy size={32} />
              <p>Brak zaplanowanych turniejow</p>
              <button className="tn-add-btn" onClick={() => setAdding(true)}><Plus size={14} /> Dodaj pierwszy turniej</button>
            </div>
          ) : (
            upcoming.map((t) => (
              <TournamentCard key={t._id} tournament={t}
                onEdit={(t) => setEditing(t)}
                onDelete={(t) => setDeleteTarget(t)}
                onResult={(t) => setResultFor(t)} />
            ))
          )}
        </div>
      ) : (
        <div className="tn-list">
          <TournamentStats tournaments={history} />
          {history.length === 0 ? (
            <div className="tn-empty"><p>Brak zakończonych turniejów</p></div>
          ) : (
            history.map((t) => (
              <TournamentCard key={t._id} tournament={t}
                onEdit={(t) => setEditing(t)}
                onDelete={(t) => setDeleteTarget(t)}
                onResult={(t) => setResultFor(t)} />
            ))
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message={`Usunąć turniej "${deleteTarget?.name || ''}"?`}
      />
    </div>
  )
}
