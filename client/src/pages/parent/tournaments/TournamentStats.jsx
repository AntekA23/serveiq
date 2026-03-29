import { Trophy, Target, TrendingUp } from 'lucide-react'
import { SURFACES, ROUNDS } from './constants'

export default function TournamentStats({ tournaments }) {
  if (!tournaments || tournaments.length === 0) return null

  const completed = tournaments.filter((t) => t.status === 'completed')
  if (completed.length === 0) return null

  const totalWins = completed.reduce((s, t) => s + (t.result?.wins || 0), 0)
  const totalLosses = completed.reduce((s, t) => s + (t.result?.losses || 0), 0)

  // Best round
  const roundOrder = ['R1', 'R2', 'R3', 'QF', 'SF', 'F', 'W']
  let bestRoundIdx = -1
  completed.forEach((t) => {
    const idx = roundOrder.indexOf(t.result?.round)
    if (idx > bestRoundIdx) bestRoundIdx = idx
  })
  const bestRound = bestRoundIdx >= 0 ? ROUNDS.find((r) => r.value === roundOrder[bestRoundIdx]) : null

  // Surface breakdown
  const bySurface = {}
  completed.forEach((t) => {
    if (t.surface) bySurface[t.surface] = (bySurface[t.surface] || 0) + 1
  })

  return (
    <div className="tn-stats">
      <div className="tn-stat">
        <Trophy size={16} />
        <div className="tn-stat-value">{completed.length}</div>
        <div className="tn-stat-label">turniejow</div>
      </div>
      <div className="tn-stat">
        <TrendingUp size={16} />
        <div className="tn-stat-value">{totalWins}W-{totalLosses}L</div>
        <div className="tn-stat-label">bilans</div>
      </div>
      {bestRound && (
        <div className="tn-stat">
          <Target size={16} />
          <div className="tn-stat-value">{bestRound.label}</div>
          <div className="tn-stat-label">najlepsza runda</div>
        </div>
      )}
      <div className="tn-stat surfaces">
        {Object.entries(bySurface).map(([key, count]) => (
          <span key={key} className="tn-stat-surface">{SURFACES[key]?.emoji} {count}</span>
        ))}
      </div>
    </div>
  )
}
