import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import Avatar from '../../ui/Avatar/Avatar'
import './PlayerCard.css'

export default function PlayerCard({ player }) {
  const navigate = useNavigate()

  const age = player.dateOfBirth
    ? Math.floor((Date.now() - new Date(player.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  return (
    <div
      className="player-card card"
      onClick={() => navigate(`/coach/player/${player._id}`)}
    >
      <div className="player-card-header">
        <Avatar
          firstName={player.firstName}
          lastName={player.lastName}
          size={36}
          role="player"
        />
        <div className="player-card-info">
          <div className="player-card-name">
            {player.firstName} {player.lastName}
          </div>
          <div className="player-card-meta">
            {age !== null && <span>{age} lat</span>}
            {player.gender && (
              <span>{player.gender === 'M' ? 'Ch' : 'Dz'}</span>
            )}
          </div>
        </div>
        <ChevronRight size={16} className="player-card-arrow" />
      </div>
    </div>
  )
}
