import { useEffect, useState } from 'react'
import { Swords } from 'lucide-react'
import api from '../../api/axios'
import MatchCard from './MatchCard'
import MatchDetail from './MatchDetail'
import './RecentMatchesSection.css'

export default function RecentMatchesSection({ playerId }) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    let alive = true
    api.get(`/matches?player=${playerId}`)
      .then((res) => { if (alive) setMatches((res.data.matches || []).slice(0, 3)) })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [playerId])

  if (loading) return null
  if (!matches.length) return null

  return (
    <section className="rms-section">
      <header className="rms-header">
        <Swords size={20} />
        <h2>Ostatnie mecze</h2>
        <span className="rms-count">{matches.length}</span>
      </header>
      <div className="rms-list">
        {matches.map((m) => (
          <MatchCard key={m._id} match={m} onClick={() => setSelected(m)} />
        ))}
      </div>
      {selected && <MatchDetail match={selected} onClose={() => setSelected(null)} />}
    </section>
  )
}
