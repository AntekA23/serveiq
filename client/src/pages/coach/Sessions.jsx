import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2 } from 'lucide-react'
import api from '../../api/axios'
import Button from '../../components/ui/Button/Button'
import SessionItem from '../../components/shared/SessionItem/SessionItem'
import useUiStore from '../../store/uiStore'
import './Sessions.css'

function getCurrentMonth() {
  const now = new Date()
  return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0')
}

function generateMonthOptions() {
  const months = []
  const now = new Date()
  for (let i = -6; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const value = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
    const label = d.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })
    months.push({ value, label })
  }
  return months
}

const skillLabels = {
  serve: 'Serwis',
  forehand: 'Forhend',
  backhand: 'Bekhend',
  volley: 'Wolej',
  tactics: 'Taktyka',
  fitness: 'Kondycja',
}

export default function Sessions() {
  const navigate = useNavigate()
  const addToast = useUiStore((s) => s.addToast)

  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState([])
  const [players, setPlayers] = useState([])
  const [playerFilter, setPlayerFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState(getCurrentMonth())
  const [expandedId, setExpandedId] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const monthOptions = generateMonthOptions()

  const fetchSessions = useCallback(async () => {
    try {
      let url = '/sessions?month=' + monthFilter
      if (playerFilter) {
        url += '&player=' + playerFilter
      }
      const res = await api.get(url)
      setSessions(res.data)
    } catch (err) {
      addToast('Nie udało się pobrać treningów', 'error')
    } finally {
      setLoading(false)
    }
  }, [monthFilter, playerFilter, addToast])

  useEffect(() => {
    api.get('/players').then((res) => setPlayers(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchSessions()
  }, [fetchSessions])

  const handleDelete = async (sessionId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten trening?')) return
    setDeleting(sessionId)
    try {
      await api.delete('/sessions/' + sessionId)
      addToast('Trening usunięty', 'success')
      fetchSessions()
    } catch (err) {
      addToast('Błąd podczas usuwania treningu', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const sorted = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date))

  if (loading) {
    return (
      <div className="page-enter">
        <h1 className="page-title">Treningi</h1>
        <p className="sessions-loading">Ładowanie...</p>
      </div>
    )
  }

  return (
    <div className="page-enter">
      <div className="sessions-header">
        <h1 className="page-title">Treningi</h1>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => navigate('/coach/sessions/new')}>
          Nowy trening
        </Button>
      </div>

      <div className="sessions-filters">
        <select
          value={playerFilter}
          onChange={(e) => setPlayerFilter(e.target.value)}
        >
          <option value="">Wszyscy zawodnicy</option>
          {players.map((p) => (
            <option key={p._id} value={p._id}>
              {p.firstName} {p.lastName}
            </option>
          ))}
        </select>
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
        >
          {monthOptions.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <div className="sessions-list">
        {sorted.length === 0 ? (
          <p className="sessions-empty">Brak treningów w wybranym okresie</p>
        ) : (
          sorted.map((session) => (
            <SessionItem
              key={session._id}
              session={session}
              onClick={() => setExpandedId(expandedId === session._id ? null : session._id)}
            >
              {expandedId === session._id && (
                <div className="session-expanded">
                  {session.notes && (
                    <div className="session-notes">{session.notes}</div>
                  )}
                  {session.skillUpdates && Object.keys(session.skillUpdates).length > 0 && (
                    <div className="session-skill-updates">
                      {Object.entries(session.skillUpdates).map(([key, val]) => (
                        <div key={key} className="session-skill-update">
                          <span className="session-skill-update-label">
                            {skillLabels[key] || key}:
                          </span>
                          <span>{val.before} → {val.after}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="session-actions">
                    <Button
                      size="sm"
                      icon={Edit}
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate('/coach/sessions/' + session._id + '/edit')
                      }}
                    >
                      Edytuj
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      icon={Trash2}
                      loading={deleting === session._id}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(session._id)
                      }}
                    >
                      Usuń
                    </Button>
                  </div>
                </div>
              )}
            </SessionItem>
          ))
        )}
      </div>
    </div>
  )
}
