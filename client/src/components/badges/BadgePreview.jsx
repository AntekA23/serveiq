import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import api from '../../api/axios'
import BadgeIcon from './BadgeIcon'
import './BadgePreview.css'

export default function BadgePreview({ playerId, basePath }) {
  const navigate = useNavigate()
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!playerId) return
    api.get(`/badges/${playerId}`)
      .then(({ data }) => setBadges(data.badges || []))
      .catch(() => setBadges([]))
      .finally(() => setLoading(false))
  }, [playerId])

  if (loading) return null

  const earned = badges.filter(b => b.earned)
  const earnedCount = earned.length
  const totalCount = badges.length

  // Show last 6 earned, or 3 closest to earning if none earned
  let displayBadges
  if (earned.length > 0) {
    displayBadges = earned
      .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))
      .slice(0, 6)
  } else {
    displayBadges = badges
      .filter(b => !b.isManual && b.progress && b.progress.target > 0)
      .sort((a, b) => (b.progress.current / b.progress.target) - (a.progress.current / a.progress.target))
      .slice(0, 3)
  }

  if (displayBadges.length === 0 && totalCount === 0) return null

  const badgePath = basePath || `/parent/child/${playerId}/badges`

  return (
    <div className="badge-preview">
      <div className="badge-preview-icons">
        {displayBadges.map(b => (
          <div key={b.slug} className="badge-preview-icon" title={b.name}>
            <BadgeIcon icon={b.icon} earned={b.earned} size={40} />
          </div>
        ))}
      </div>
      <button className="badge-preview-link" onClick={() => navigate(badgePath)}>
        <span className="badge-preview-count">{earnedCount} / {totalCount}</span>
        <ChevronRight size={14} />
      </button>
    </div>
  )
}
