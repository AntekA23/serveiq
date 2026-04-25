import { Trophy, X, MapPin } from 'lucide-react'
import './MatchCard.css'

const ROUND_LABEL = {
  sparing: 'Sparing',
  qualif: 'Kwalifikacje',
  R64: '1/32',
  R32: '1/16',
  R16: '1/8',
  QF: 'Ćwierćfinał',
  SF: 'Półfinał',
  F: 'Finał',
  'final-3rd-place': 'Mecz o 3. miejsce',
}

function formatSets(sets = []) {
  return sets.map((s) => {
    const main = `${s.playerScore}:${s.opponentScore}`
    return s.tiebreak != null ? `${main}(${s.tiebreak})` : main
  }).join(' ')
}

export default function MatchCard({ match, onClick }) {
  const won = match.result?.won
  const opp = match.opponent || {}
  return (
    <article className={`mc-card ${won ? 'mc-won' : 'mc-lost'}`} onClick={onClick}>
      <div className="mc-result-badge">
        {won ? <Trophy size={14} /> : <X size={14} />}
        {won ? 'W' : 'L'}
      </div>
      <div className="mc-body">
        <div className="mc-top">
          <span className="mc-round">{ROUND_LABEL[match.round] || match.round}</span>
          <span className="mc-date">{new Date(match.date).toLocaleDateString('pl-PL')}</span>
        </div>
        <div className="mc-opponent">
          vs. <strong>{opp.name}</strong>
          {opp.club && <span className="mc-opp-club"> · {opp.club}</span>}
        </div>
        <div className="mc-score">{formatSets(match.result?.sets)}</div>
        {match.tournament?.location && (
          <div className="mc-loc">
            <MapPin size={11} /> {match.tournament.location}
          </div>
        )}
      </div>
    </article>
  )
}
