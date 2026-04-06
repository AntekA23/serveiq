import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import Avatar from '../../ui/Avatar/Avatar'
import { SKILL_NAMES, getSkillLevel } from '../../../constants/skillLevels'
import './PlayerCard.css'

export default function PlayerCard({ player }) {
  const navigate = useNavigate()
  const skills = player.skills || {}

  const topSkills = Object.entries(SKILL_NAMES)
    .map(([key, label]) => {
      const raw = typeof skills[key] === 'object' ? (skills[key]?.score ?? 0) : (skills[key] ?? 0)
      return { key, label, score: raw, level: getSkillLevel(raw) }
    })
    .filter((s) => s.score > 0)
    .slice(0, 4)

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
      {topSkills.length > 0 && (
        <div className="player-card-skills">
          {topSkills.map((s) => (
            <span key={s.key} className="player-card-skill-chip" style={{ borderColor: s.level.dot, color: s.level.dot }}>
              {s.label}: {s.level.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
