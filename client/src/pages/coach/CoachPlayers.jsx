import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, ChevronRight, Users, TrendingUp, Target } from 'lucide-react'
import api from '../../api/axios'
import Avatar from '../../components/ui/Avatar/Avatar'
import Button from '../../components/ui/Button/Button'
import { SKILL_NAMES, getSkillLevel } from '../../constants/skillLevels'
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

  // Group stats
  const avgSkillAll = players.length > 0 ? Math.round(
    players.reduce((sum, p) => {
      const sk = p.skills || {}
      return sum + Object.values(sk).reduce((s, v) => s + (v?.score || 0), 0) / Math.max(Object.keys(sk).length, 1)
    }, 0) / players.length
  ) : 0

  const avgAge = players.length > 0 ? Math.round(
    players.reduce((sum, p) => {
      if (!p.dateOfBirth) return sum
      return sum + (new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear())
    }, 0) / players.filter((p) => p.dateOfBirth).length
  ) : 0

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

      {/* Group stats */}
      {players.length > 0 && (
        <div className="cp-group-stats">
          <div className="cp-group-stat">
            <Users size={14} />
            <span><strong>{players.length}</strong> zawodnikow</span>
          </div>
          <div className="cp-group-stat">
            <TrendingUp size={14} />
            <span>Sredni poziom: <strong>{getSkillLevel(avgSkillAll).label}</strong></span>
          </div>
          <div className="cp-group-stat">
            <Target size={14} />
            <span>Sredni wiek: <strong>{avgAge}</strong> lat</span>
          </div>
        </div>
      )}

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
          const skills = p.skills || {}
          const skillEntries = Object.entries(skills).filter(([, v]) => v?.score > 0)
          const age = p.dateOfBirth ? new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear() : null
          const avgSkill = skillEntries.length > 0
            ? Math.round(skillEntries.reduce((s, [, v]) => s + v.score, 0) / skillEntries.length)
            : 0

          return (
            <div key={p._id} className="coach-player-card" onClick={() => navigate(`/coach/player/${p._id}`)}>
              <Avatar firstName={p.firstName} lastName={p.lastName} size={44} role="player" src={p.avatarUrl} />
              <div className="coach-player-card-body">
                <div className="coach-player-card-top">
                  <span className="coach-player-name">{p.firstName} {p.lastName}</span>
                  {age && <span className="coach-player-age">{age} lat</span>}
                  {p.pathwayStage && <span className="coach-player-stage">{PATHWAY_LABELS[p.pathwayStage] || p.pathwayStage}</span>}
                  {p.ranking?.pzt > 0 && <span className="coach-player-ranking">PZT #{p.ranking.pzt}</span>}
                </div>
                {skillEntries.length > 0 && (
                  <div className="coach-player-skills">
                    {skillEntries.slice(0, 4).map(([name, data]) => {
                      const lvl = getSkillLevel(data.score)
                      return (
                        <span key={name} className="coach-skill-chip" style={{ borderColor: lvl.dot, color: lvl.dot }}>
                          {SKILL_NAMES[name] || name}: {lvl.label}
                        </span>
                      )
                    })}
                    {skillEntries.length > 4 && <span className="coach-skill-chip">+{skillEntries.length - 4}</span>}
                  </div>
                )}
                {p.parents?.length > 0 && (
                  <div className="coach-player-parents">
                    Rodzic: {p.parents.map((par) => `${par.firstName} ${par.lastName}`).join(', ')}
                  </div>
                )}
              </div>
              <div className="cp-player-avg">
                {(() => { const lvl = getSkillLevel(avgSkill); return (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: lvl.color, background: lvl.bg, padding: '4px 10px', borderRadius: 'var(--radius-full)' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: lvl.dot }} />
                    {lvl.label}
                  </span>
                )})()}
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
