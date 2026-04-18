import { useState } from 'react'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'
import './IdolCard.css'

export default function IdolReadOnly({ idol }) {
  const [factIndex, setFactIndex] = useState(0)

  if (!idol?.name) return null

  const facts = idol.facts || []
  const currentFact = facts[factIndex % facts.length]

  const prevFact = () => setFactIndex((i) => (i - 1 + facts.length) % facts.length)
  const nextFact = () => setFactIndex((i) => (i + 1) % facts.length)

  return (
    <div className="idol-card">
      <div className="idol-card-header">
        <Star size={14} className="idol-star" />
        <span className="idol-name">{idol.name}</span>
      </div>

      {currentFact ? (
        <div className="idol-fact-row">
          {facts.length > 1 && (
            <button className="idol-nav" onClick={prevFact}><ChevronLeft size={14} /></button>
          )}
          <p className="idol-fact">{currentFact}</p>
          {facts.length > 1 && (
            <button className="idol-nav" onClick={nextFact}><ChevronRight size={14} /></button>
          )}
        </div>
      ) : (
        <p className="idol-fact idol-fact-empty">Trener jeszcze nie dodał ciekawostek.</p>
      )}

      {facts.length > 1 && (
        <div className="idol-dots">
          {facts.map((_, i) => (
            <span key={i} className={`idol-dot ${i === factIndex % facts.length ? 'active' : ''}`} onClick={() => setFactIndex(i)} />
          ))}
        </div>
      )}
    </div>
  )
}
