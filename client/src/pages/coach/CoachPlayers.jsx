import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, ChevronRight } from 'lucide-react'
import api from '../../api/axios'
import Avatar from '../../components/ui/Avatar/Avatar'
import Button from '../../components/ui/Button/Button'
import './Coach.css'

export default function CoachPlayers() {
  const navigate = useNavigate()
  const [players, setPlayers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/players')
        setPlayers(data.players || data || [])
      } catch { /* silent */ }
      setLoading(false)
    }
    fetch()
  }, [])

  const filtered = players.filter((p) => {
    const q = search.toLowerCase()
    return `${p.firstName} ${p.lastName}`.toLowerCase().includes(q)
  })

  if (loading) {
    return <div className="coach-page"><h1 className="page-title">Zawodnicy</h1><div className="coach-loading">Ladowanie...</div></div>
  }

  return (
    <div className="coach-page">
      <div className="coach-header">
        <h1 className="page-title">Zawodnicy ({players.length})</h1>
        <Button variant="primary" size="sm" onClick={() => navigate('/coach/players/new')}>
          <Plus size={14} /> Dodaj zawodnika
        </Button>
      </div>

      {players.length > 3 && (
        <div className="coach-search">
          <Search size={14} />
          <input placeholder="Szukaj zawodnika..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      )}

      <div className="coach-players-list">
        {filtered.map((p) => {
          const skills = p.skills || {}
          const skillEntries = Object.entries(skills).filter(([, v]) => v?.score > 0)
          const age = p.dateOfBirth ? new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear() : null

          return (
            <div key={p._id} className="coach-player-card" onClick={() => navigate(`/coach/player/${p._id}`)}>
              <Avatar firstName={p.firstName} lastName={p.lastName} size={44} role="player" src={p.avatarUrl} />
              <div className="coach-player-card-body">
                <div className="coach-player-card-top">
                  <span className="coach-player-name">{p.firstName} {p.lastName}</span>
                  {age && <span className="coach-player-age">{age} lat</span>}
                  {p.ranking?.pzt && <span className="coach-player-ranking">PZT #{p.ranking.pzt}</span>}
                </div>
                {skillEntries.length > 0 && (
                  <div className="coach-player-skills">
                    {skillEntries.map(([name, data]) => (
                      <span key={name} className="coach-skill-chip">
                        {name.charAt(0).toUpperCase() + name.slice(1)}: {data.score}
                      </span>
                    ))}
                  </div>
                )}
                {p.parents?.length > 0 && (
                  <div className="coach-player-parents">
                    Rodzic: {p.parents.map((par) => `${par.firstName} ${par.lastName}`).join(', ')}
                  </div>
                )}
              </div>
              <ChevronRight size={16} className="coach-player-arrow" />
            </div>
          )
        })}
        {filtered.length === 0 && <div className="coach-empty">Brak wynikow</div>}
      </div>
    </div>
  )
}
