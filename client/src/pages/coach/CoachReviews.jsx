import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, EyeOff, FileText, ChevronRight } from 'lucide-react'
import api from '../../api/axios'
import Button from '../../components/ui/Button/Button'
import './Coach.css'

const TYPE_LABELS = {
  weekly: 'Tygodniowy', monthly: 'Miesieczny', quarterly: 'Kwartalny',
  seasonal: 'Sezonowy', 'ad-hoc': 'Dorazny',
}

export default function CoachReviews() {
  const navigate = useNavigate()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterPlayer, setFilterPlayer] = useState('')
  const [players, setPlayers] = useState([])

  useEffect(() => {
    const fetch = async () => {
      try {
        const [revRes, plRes] = await Promise.all([
          api.get('/reviews'),
          api.get('/players'),
        ])
        setReviews(revRes.data.reviews || [])
        setPlayers(plRes.data.players || plRes.data || [])
      } catch { /* silent */ }
      setLoading(false)
    }
    fetch()
  }, [])

  const filtered = filterPlayer
    ? reviews.filter((r) => {
        const pid = typeof r.player === 'object' ? r.player._id : r.player
        return pid === filterPlayer
      })
    : reviews

  if (loading) {
    return <div className="coach-page"><h1 className="page-title">Oceny i rekomendacje</h1><div className="coach-loading">Ladowanie...</div></div>
  }

  return (
    <div className="coach-page">
      <div className="coach-header">
        <h1 className="page-title">Oceny i rekomendacje</h1>
        <Button variant="primary" size="sm" onClick={() => navigate('/coach/reviews/new')}>
          <Plus size={14} /> Nowa ocena
        </Button>
      </div>

      {players.length > 1 && (
        <div className="coach-session-controls">
          <select className="coach-filter-select" value={filterPlayer} onChange={(e) => setFilterPlayer(e.target.value)}>
            <option value="">Wszyscy zawodnicy</option>
            {players.map((p) => (
              <option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>
            ))}
          </select>
        </div>
      )}

      <div className="coach-reviews-list">
        {filtered.length === 0 ? (
          <div className="coach-empty">
            <FileText size={32} />
            Brak ocen. Dodaj pierwsza ocene dla zawodnika.
          </div>
        ) : (
          filtered.map((r) => {
            const playerName = r.player
              ? `${r.player.firstName || ''} ${r.player.lastName || ''}`.trim()
              : 'Zawodnik'
            return (
              <div key={r._id} className="coach-review-card" onClick={() => navigate(`/coach/reviews/${r._id}/edit`)}>
                <div className="coach-review-card-top">
                  <span className="coach-review-player">{playerName}</span>
                  <span className="coach-review-type">{TYPE_LABELS[r.periodType] || r.periodType}</span>
                  <span className={`coach-review-status ${r.status}`}>
                    {r.status === 'draft' ? 'Szkic' : 'Opublikowany'}
                  </span>
                  {r.visibleToParent ? <Eye size={12} className="coach-review-vis" /> : <EyeOff size={12} className="coach-review-vis" />}
                </div>
                <div className="coach-review-title">{r.title || `Przeglad ${TYPE_LABELS[r.periodType] || ''}`}</div>
                <div className="coach-review-period">
                  {new Date(r.periodStart).toLocaleDateString('pl-PL')} — {new Date(r.periodEnd).toLocaleDateString('pl-PL')}
                </div>
                <ChevronRight size={16} className="coach-review-arrow" />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
