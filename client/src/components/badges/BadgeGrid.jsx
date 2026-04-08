import { useState, useEffect } from 'react'
import { Award } from 'lucide-react'
import api from '../../api/axios'
import BadgeIcon from './BadgeIcon'
import './BadgeGrid.css'

const CATEGORY_LABELS = {
  training: 'Treningowe',
  skills: 'Umiejetnosci',
  tournament: 'Turniejowe',
  special: 'Specjalne',
}

const CATEGORY_ORDER = ['training', 'skills', 'tournament', 'special']

export default function BadgeGrid({ playerId }) {
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!playerId) return
    const fetchBadges = async () => {
      try {
        setLoading(true)
        const { data } = await api.get(`/badges/${playerId}`)
        setBadges(data.badges || [])
      } catch {
        setBadges([])
      } finally {
        setLoading(false)
      }
    }
    fetchBadges()
  }, [playerId])

  if (loading) return null

  const earnedCount = badges.filter((b) => b.earned).length
  const totalCount = badges.length

  const grouped = {}
  for (const badge of badges) {
    if (!grouped[badge.category]) grouped[badge.category] = []
    grouped[badge.category].push(badge)
  }

  return (
    <div className="badge-grid-section">
      <div className="badge-grid-header">
        <h2 className="badge-grid-title">
          <Award size={16} style={{ color: 'var(--color-accent)', marginRight: 6, verticalAlign: 'middle' }} />
          Odznaki
        </h2>
        <span className="badge-grid-count">
          {earnedCount} / {totalCount}
        </span>
      </div>

      {CATEGORY_ORDER.map((cat) => {
        const items = grouped[cat]
        if (!items || items.length === 0) return null
        return (
          <div key={cat} className="badge-grid-category">
            <div className="badge-grid-category-label">{CATEGORY_LABELS[cat]}</div>
            <div className="badge-grid-items">
              {items.map((badge) => (
                <div key={badge.slug} className={`badge-grid-item ${badge.earned ? 'earned' : 'locked'}`}>
                  <div className="badge-grid-item-icon">
                    <BadgeIcon icon={badge.icon} earned={badge.earned} size={56} />
                  </div>
                  <span className="badge-grid-item-name">{badge.name}</span>
                  {!badge.earned && badge.progress && badge.progress.target > 1 && (
                    <div className="badge-grid-progress">
                      <div className="badge-grid-progress-fill" style={{ width: `${(badge.progress.current / badge.progress.target) * 100}%` }} />
                    </div>
                  )}
                  <div className="badge-grid-tooltip">
                    <div className="badge-grid-tooltip-name">{badge.name}</div>
                    <div className="badge-grid-tooltip-desc">{badge.description}</div>
                    {badge.earned && badge.earnedAt && (
                      <div className="badge-grid-tooltip-date">
                        Zdobyta: {new Date(badge.earnedAt).toLocaleDateString('pl-PL')}
                      </div>
                    )}
                    {!badge.earned && badge.progress && (
                      <div className="badge-grid-tooltip-date">
                        Postep: {badge.progress.current} / {badge.progress.target}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
