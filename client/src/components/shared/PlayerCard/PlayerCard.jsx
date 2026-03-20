import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import Avatar from '../../ui/Avatar/Avatar'
import ProgressBar from '../../ui/ProgressBar/ProgressBar'
import './PlayerCard.css'

const skillLabels = {
  serve: 'Serwis',
  forehand: 'Forhend',
  backhand: 'Bekhend',
  volley: 'Wolej',
  tactics: 'Taktyka',
  fitness: 'Kondycja',
}

const skillColors = {
  serve: 'blue',
  forehand: 'blue',
  backhand: 'amber',
  volley: 'green',
  tactics: 'green',
  fitness: 'red',
}

export default function PlayerCard({ player }) {
  const navigate = useNavigate()
  const skills = player.skills || {}

  const topSkills = Object.entries(skillLabels)
    .map(([key, label]) => ({
      key,
      label,
      value: typeof skills[key] === 'object' ? (skills[key]?.score ?? 0) : (skills[key] ?? 0),
      color: skillColors[key],
    }))
    .slice(0, 3)

  const age = player.dateOfBirth
    ? Math.floor((Date.now() - new Date(player.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  return (
    <div
      className="player-card card"
      onClick={() => navigate(`/coach/players/${player._id}`)}
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
      <div className="player-card-skills">
        {topSkills.map((skill) => (
          <ProgressBar
            key={skill.key}
            label={skill.label}
            value={skill.value}
            color={skill.color}
            showValue
          />
        ))}
      </div>
    </div>
  )
}
