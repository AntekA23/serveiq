import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, FileText, TrendingUp, AlertTriangle, Lightbulb, MessageSquare } from 'lucide-react'
import api from '../../api/axios'
import './Reviews.css'

const TYPE_LABELS = {
  monthly: 'Miesieczna', quarterly: 'Kwartalna', tournament: 'Turniejowa',
  milestone: 'Kamien milowy', general: 'Ogolna',
}

export default function Reviews() {
  const { id: playerId } = useParams()
  const navigate = useNavigate()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [playerName, setPlayerName] = useState('')

  useEffect(() => {
    const fetch = async () => {
      try {
        const url = playerId ? `/reviews?player=${playerId}` : '/reviews'
        const { data } = await api.get(url)
        setReviews(data.reviews || [])

        if (playerId) {
          const { data: pData } = await api.get(`/players/${playerId}`)
          const p = pData.player || pData
          setPlayerName(`${p.firstName || ''} ${p.lastName || ''}`.trim())
        }
      } catch { /* silent */ }
      setLoading(false)
    }
    fetch()
  }, [playerId])

  if (loading) {
    return (
      <div className="reviews-page">
        <div className="reviews-loading">Ladowanie...</div>
      </div>
    )
  }

  return (
    <div className="reviews-page">
      {playerId && (
        <button className="reviews-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Powrot
        </button>
      )}

      <h1 className="page-title">
        Oceny od trenera
        {playerName && <span className="reviews-player-name"> — {playerName}</span>}
      </h1>

      {reviews.length === 0 ? (
        <div className="reviews-empty">
          <FileText size={40} />
          <p>Brak ocen od trenera</p>
        </div>
      ) : (
        <div className="reviews-list">
          {reviews.map((r) => {
            const isExpanded = expanded === r._id
            const coachName = r.coach
              ? `${r.coach.firstName || ''} ${r.coach.lastName || ''}`.trim()
              : 'Trener'

            return (
              <div key={r._id} className={`review-card ${isExpanded ? 'expanded' : ''}`}>
                <div className="review-card-header" onClick={() => setExpanded(isExpanded ? null : r._id)}>
                  <div className="review-card-left">
                    <span className="review-type-badge">{TYPE_LABELS[r.type] || r.type}</span>
                    <span className="review-title">{r.title}</span>
                  </div>
                  <div className="review-card-right">
                    {r.overallRating && (
                      <div className="review-stars">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={12}
                            fill={s <= r.overallRating ? 'var(--color-amber)' : 'none'}
                            stroke={s <= r.overallRating ? 'var(--color-amber)' : 'var(--color-text-tertiary)'} />
                        ))}
                      </div>
                    )}
                    <span className="review-date">
                      {new Date(r.periodStart).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
                      {' — '}
                      {new Date(r.periodEnd).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="review-card-body">
                    <div className="review-meta">
                      Trener: <strong>{coachName}</strong>
                      {' · '}
                      {new Date(r.createdAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>

                    {r.strengths && (
                      <div className="review-section">
                        <div className="review-section-header">
                          <TrendingUp size={14} /> Mocne strony
                        </div>
                        <p>{r.strengths}</p>
                      </div>
                    )}

                    {r.areasToImprove && (
                      <div className="review-section">
                        <div className="review-section-header">
                          <AlertTriangle size={14} /> Obszary do poprawy
                        </div>
                        <p>{r.areasToImprove}</p>
                      </div>
                    )}

                    {r.recommendations && (
                      <div className="review-section">
                        <div className="review-section-header">
                          <Lightbulb size={14} /> Rekomendacje
                        </div>
                        <p>{r.recommendations}</p>
                      </div>
                    )}

                    {r.notes && (
                      <div className="review-section">
                        <div className="review-section-header">
                          <MessageSquare size={14} /> Notatki
                        </div>
                        <p>{r.notes}</p>
                      </div>
                    )}

                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
