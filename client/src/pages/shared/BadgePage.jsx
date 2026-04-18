import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Award, TrendingUp } from 'lucide-react'
import api from '../../api/axios'
import Avatar from '../../components/ui/Avatar/Avatar'
import BadgeGrid from '../../components/badges/BadgeGrid'
import BadgeIcon from '../../components/badges/BadgeIcon'
import './BadgePage.css'

export default function BadgePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [player, setPlayer] = useState(null)
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/players/${id}`)
      .then(({ data }) => setPlayer(data.player || data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="bp-page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div style={{ color: 'var(--color-text-tertiary)', fontSize: 14 }}>Ładowanie...</div>
    </div>
  )
  if (!player) return <div className="bp-page"><p>Nie znaleziono zawodnika.</p></div>

  const earned = badges.filter(b => b.earned)
  const earnedCount = earned.length
  const totalCount = badges.length

  // Recent 5 earned, sorted by date
  const recent = [...earned]
    .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))
    .slice(0, 5)

  // New this month
  const now = new Date()
  const thisMonth = earned.filter(b => {
    const d = new Date(b.earnedAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const age = player.dateOfBirth
    ? Math.floor((new Date() - new Date(player.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  return (
    <div className="bp-page">
      {/* Header */}
      <button className="bp-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} />
      </button>

      <div className="bp-hero">
        <Avatar
          src={player.avatarUrl}
          name={`${player.firstName} ${player.lastName}`}
          size={56}
        />
        <div className="bp-hero-info">
          <h1 className="bp-hero-name">{player.firstName} {player.lastName}</h1>
          <p className="bp-hero-sub">
            {age && `${age} lat · `}Dzienniczek osiągnięć
          </p>
        </div>
      </div>

      {/* Stats ribbon */}
      <div className="bp-stats">
        <div className="bp-stat">
          <Award size={16} className="bp-stat-icon" />
          <div className="bp-stat-body">
            <span className="bp-stat-value">{earnedCount}</span>
            <span className="bp-stat-label">/ {totalCount} odznak</span>
          </div>
        </div>
        {thisMonth > 0 && (
          <div className="bp-stat">
            <TrendingUp size={16} className="bp-stat-icon" />
            <div className="bp-stat-body">
              <span className="bp-stat-value">+{thisMonth}</span>
              <span className="bp-stat-label">w tym miesiącu</span>
            </div>
          </div>
        )}
      </div>

      {/* Recent achievements timeline */}
      {recent.length > 0 && (
        <section className="bp-section">
          <h2 className="bp-section-title">Ostatnio zdobyte</h2>
          <div className="bp-timeline">
            {recent.map(b => (
              <div key={b.slug} className="bp-timeline-item">
                <div className="bp-timeline-icon">
                  <BadgeIcon icon={b.icon} earned={true} size={36} />
                </div>
                <div className="bp-timeline-body">
                  <span className="bp-timeline-name">{b.name}</span>
                  <span className="bp-timeline-desc">{b.description}</span>
                  {b.awardedBy && (
                    <span className="bp-timeline-coach">
                      Przyznana przez: {b.awardedBy.firstName} {b.awardedBy.lastName}
                    </span>
                  )}
                </div>
                <span className="bp-timeline-date">
                  {new Date(b.earnedAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Full badge grid */}
      <BadgeGrid
        playerId={id}
        onBadgesLoaded={(b) => setBadges(b)}
      />
    </div>
  )
}
