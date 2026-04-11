import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, ChevronRight, Users } from 'lucide-react'
import api from '../../api/axios'
import Avatar from '../../components/ui/Avatar/Avatar'
import Button from '../../components/ui/Button/Button'
import './Coach.css'

const PATHWAY_LABELS = {
  beginner: 'Poczatkujacy',
  tennis10_red: 'Tennis 10 Red',
  tennis10_orange: 'Tennis 10 Orange',
  tennis10_green: 'Tennis 10 Green',
  committed: 'Zawodnik',
  advanced: 'Zaawansowany',
  performance: 'Performance',
}

export default function CoachPlayers() {
  const navigate = useNavigate()
  const [players, setPlayers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('name')

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

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
    if (sortBy === 'skill') {
      const avgA = Object.values(a.skills || {}).reduce((s, v) => s + (v?.score || 0), 0) / Math.max(Object.keys(a.skills || {}).length, 1)
      const avgB = Object.values(b.skills || {}).reduce((s, v) => s + (v?.score || 0), 0) / Math.max(Object.keys(b.skills || {}).length, 1)
      return avgB - avgA
    }
    if (sortBy === 'ranking') return (a.ranking?.pzt || 999) - (b.ranking?.pzt || 999)
    if (sortBy === 'age') return new Date(a.dateOfBirth || 0) - new Date(b.dateOfBirth || 0)
    return 0
  })

  if (loading) {
    return <div className="coach-page"><h1 className="page-title">Zawodnicy</h1><div className="coach-loading">Ladowanie...</div></div>
  }

  return (
    <div className="coach-page">
      <div className="coach-header">
        <h1 className="page-title">Zawodnicy</h1>
        <Button variant="primary" size="sm" onClick={() => navigate('/coach/players/new')}>
          <Plus size={14} /> Dodaj zawodnika
        </Button>
      </div>

      {/* Search + sort */}
      <div className="cp-controls">
        {players.length > 2 && (
          <div className="coach-search">
            <Search size={14} />
            <input placeholder="Szukaj zawodnika..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        )}
        <select className="cp-sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="name">Imie</option>
          <option value="skill">Poziom ↓</option>
          <option value="ranking">Ranking</option>
          <option value="age">Wiek</option>
        </select>
      </div>

      <div className="coach-players-list">
        {sorted.map((p) => {
          const age = p.dateOfBirth ? new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear() : null

          return (
            <div key={p._id} className="coach-player-card" onClick={() => navigate(`/coach/player/${p._id}`)}>
              <Avatar firstName={p.firstName} lastName={p.lastName} size={40} role="player" src={p.avatarUrl} />
              <div className="coach-player-card-body">
                <span className="coach-player-name">{p.firstName} {p.lastName}</span>
                <span className="coach-player-meta">
                  {age && `${age} lat`}
                  {p.pathwayStage && ` · ${PATHWAY_LABELS[p.pathwayStage] || p.pathwayStage}`}
                  {p.ranking?.pzt > 0 && ` · PZT #${p.ranking.pzt}`}
                </span>
              </div>
              <ChevronRight size={16} className="coach-player-arrow" />
            </div>
          )
        })}
        {sorted.length === 0 && (
          <div className="coach-empty">
            <Users size={28} strokeWidth={1.5} />
            {search ? 'Brak wynikow wyszukiwania' : 'Dodaj pierwszego zawodnika'}
          </div>
        )}
      </div>
    </div>
  )
}
