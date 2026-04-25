import { useState } from 'react'
import { LineChart } from 'lucide-react'
import benchmarks from '../../data/careerBenchmarks.json'
import './CareerTrajectory.css'

const MAX_AGE = 25

function ageAtDate(birth, eventDate) {
  const b = new Date(birth)
  const d = new Date(eventDate)
  return (d - b) / (365.25 * 24 * 60 * 60 * 1000)
}

function playerCurrentAge(player) {
  if (!player?.dateOfBirth) return null
  return ageAtDate(player.dateOfBirth, new Date())
}

function buildPlayerMilestones(player, achievements = []) {
  if (!player?.dateOfBirth) return []
  return achievements
    .filter((a) => a.date)
    .map((a) => ({
      age: ageAtDate(player.dateOfBirth, a.date),
      label: a.title,
      year: a.year,
    }))
    .filter((m) => m.age >= 0 && m.age <= MAX_AGE)
    .sort((a, b) => a.age - b.age)
}

export default function CareerTrajectory({ player, achievements = [] }) {
  const [selected, setSelected] = useState(['iga-swiatek'])

  if (!player?.dateOfBirth) return null

  const playerMs = buildPlayerMilestones(player, achievements)
  const currentAge = playerCurrentAge(player)

  const benchmarkOptions = Object.entries(benchmarks).map(([k, v]) => ({ key: k, label: v.displayName, country: v.country }))

  const toggle = (key) => {
    setSelected((cur) => {
      if (cur.includes(key)) return cur.filter((k) => k !== key)
      if (cur.length >= 2) return [cur[1], key]
      return [...cur, key]
    })
  }

  const renderMilestoneLine = (milestones, color, label) => (
    <div className="ct-line">
      <div className="ct-line-label" style={{ color }}>{label}</div>
      <div className="ct-line-track">
        {milestones.map((m, i) => {
          const left = `${(m.age / MAX_AGE) * 100}%`
          return (
            <div key={i} className="ct-dot" style={{ left, background: color }} title={`${m.label} (${m.year || ''}) — wiek ${m.age.toFixed(1)}`} />
          )
        })}
      </div>
    </div>
  )

  return (
    <section className="ct-section">
      <header className="ct-header">
        <LineChart size={20} />
        <h2>Trajektoria kariery</h2>
      </header>

      <div className="ct-controls">
        <span className="ct-controls-label">Porównaj z:</span>
        {benchmarkOptions.map((b) => (
          <button
            key={b.key}
            className={`ct-chip ${selected.includes(b.key) ? 'active' : ''}`}
            onClick={() => toggle(b.key)}
          >
            {b.country} {b.label}
          </button>
        ))}
      </div>

      <div className="ct-axis">
        {[0, 5, 10, 15, 20, 25].map((y) => (
          <div key={y} className="ct-axis-mark" style={{ left: `${(y / MAX_AGE) * 100}%` }}>
            {y} lat
          </div>
        ))}
        {currentAge != null && (
          <div className="ct-current-age" style={{ left: `${(currentAge / MAX_AGE) * 100}%` }} title={`${player.firstName} ma ${currentAge.toFixed(1)} lat`} />
        )}
      </div>

      <div className="ct-lines">
        {renderMilestoneLine(playerMs, '#6366f1', `${player.firstName}`)}
        {selected.map((key, i) => {
          const b = benchmarks[key]
          if (!b) return null
          const color = i === 0 ? '#dc2626' : '#10b981'
          return (
            <div key={key}>
              {renderMilestoneLine(b.milestones, color, b.displayName)}
            </div>
          )
        })}
      </div>

      <div className="ct-tip">
        Najedź na kropki, aby zobaczyć szczegóły. Pionowa kreska = aktualny wiek.
      </div>
    </section>
  )
}
