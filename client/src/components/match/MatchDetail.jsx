import { X, Trophy, MapPin, Calendar, Brain, FileText } from 'lucide-react'
import './MatchDetail.css'

const ROUND_LABEL = {
  sparing: 'Sparing', qualif: 'Kwalifikacje', R64: '1/32', R32: '1/16',
  R16: '1/8', QF: 'Ćwierćfinał', SF: 'Półfinał', F: 'Finał',
  'final-3rd-place': 'Mecz o 3. miejsce',
}

const SURFACE_LABEL = {
  clay: 'Mączka', hard: 'Twarda', 'indoor-hard': 'Hala (twarda)', grass: 'Trawa',
}

function formatSets(sets = []) {
  return sets.map((s) => {
    const main = `${s.playerScore}:${s.opponentScore}`
    return s.tiebreak != null ? `${main}(${s.tiebreak})` : main
  }).join(', ')
}

export default function MatchDetail({ match, onClose }) {
  if (!match) return null
  const won = match.result?.won
  const opp = match.opponent || {}
  const stats = match.stats || {}
  return (
    <div className="md-overlay" onClick={onClose}>
      <div className="md-modal" onClick={(e) => e.stopPropagation()}>
        <button className="md-close" onClick={onClose}><X size={18} /></button>

        <header className={`md-header ${won ? 'md-won' : 'md-lost'}`}>
          <Trophy size={28} />
          <div>
            <div className="md-result">{won ? 'Wygrana' : 'Porażka'}</div>
            <div className="md-vs">vs. {opp.name}</div>
          </div>
          <div className="md-score">{formatSets(match.result?.sets)}</div>
        </header>

        <div className="md-meta">
          <div><Calendar size={14} /> {new Date(match.date).toLocaleDateString('pl-PL')}</div>
          {match.round && <div>{ROUND_LABEL[match.round]}</div>}
          {match.surface && <div>{SURFACE_LABEL[match.surface]}</div>}
          {match.durationMinutes && <div>{match.durationMinutes} min</div>}
          {match.tournament && <div><MapPin size={14} /> {match.tournament.name}</div>}
        </div>

        {match.scoutingNotes && (
          <section className="md-section">
            <h3><Brain size={14} /> Scouting (przed meczem)</h3>
            <p>{match.scoutingNotes}</p>
          </section>
        )}

        {Object.keys(stats).length > 0 && (
          <section className="md-section">
            <h3>Statystyki</h3>
            <div className="md-stats-grid">
              {stats.firstServePct != null && <div className="md-stat"><span>1. serwis</span><strong>{stats.firstServePct}%</strong></div>}
              {stats.aces != null && <div className="md-stat"><span>Asy</span><strong>{stats.aces}</strong></div>}
              {stats.doubleFaults != null && <div className="md-stat"><span>Double faults</span><strong>{stats.doubleFaults}</strong></div>}
              {stats.winners != null && <div className="md-stat"><span>Winnery</span><strong>{stats.winners}</strong></div>}
              {stats.unforcedErrors != null && <div className="md-stat"><span>Błędy własne</span><strong>{stats.unforcedErrors}</strong></div>}
              {stats.breakPointsConverted != null && stats.breakPointsFaced != null && (
                <div className="md-stat"><span>BP wykorzystane</span><strong>{stats.breakPointsConverted}/{stats.breakPointsFaced}</strong></div>
              )}
            </div>
          </section>
        )}

        {match.keyMoments?.length > 0 && (
          <section className="md-section">
            <h3>Kluczowe momenty</h3>
            <ul className="md-moments">
              {match.keyMoments.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          </section>
        )}

        {match.coachDebrief && (
          <section className="md-section">
            <h3><FileText size={14} /> Debrief trenera</h3>
            <p>{match.coachDebrief}</p>
          </section>
        )}

        {match.mentalState != null && (
          <section className="md-section md-mental">
            <h3>Stan mentalny</h3>
            <div className="md-mental-bar">
              {[1,2,3,4,5].map((n) => (
                <div key={n} className={`md-mental-dot ${n <= match.mentalState ? 'active' : ''}`} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
