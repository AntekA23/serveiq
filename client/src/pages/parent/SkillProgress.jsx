import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import api from '../../api/axios'
import { SKILL_NAMES, SKILL_LEVELS, getSkillLevel } from '../../constants/skillLevels'
import './SkillProgress.css'

const SKILL_COLORS = {
  serve: '#4A90D9',
  forehand: '#27AE60',
  backhand: '#F5A623',
  volley: '#9B59B6',
  movement: '#1ABC9C',
  tactics: '#1ABC9C',
  mental: '#3B82F6',
  fitness: '#E74C3C',
}

function SkillChart({ skill, label, color, dataPoints, currentScore }) {
  const level = getSkillLevel(currentScore)

  if (!dataPoints || dataPoints.length === 0) {
    return (
      <div className="sp-skill-card">
        <div className="sp-skill-header">
          <span className="sp-skill-name" style={{ color }}>{label}</span>
          <span className="sp-skill-level-badge" style={{ color: level.color, background: level.bg }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: level.dot, display: 'inline-block' }} />
            {level.label}
          </span>
        </div>
        <div className="sp-skill-empty">Brak danych historycznych</div>
      </div>
    )
  }

  const scores = dataPoints.map((d) => ({
    date: new Date(d.date),
    score: d.scoreAfter,
    label: d.sessionTitle || '',
  }))

  const lastScore = scores[scores.length - 1]?.score
  if (lastScore !== currentScore) {
    scores.push({ date: new Date(), score: currentScore, label: 'Aktualny' })
  }

  const min = 0.5
  const max = 5.5
  const range = max - min

  const width = 320
  const height = 100
  const padding = { top: 8, bottom: 20, left: 5, right: 5 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const points = scores.map((s, i) => {
    const x = padding.left + (i / Math.max(scores.length - 1, 1)) * chartW
    const y = padding.top + chartH - ((s.score - min) / range) * chartH
    return { x, y, score: s.score, date: s.date }
  })

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = pathD + ` L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`

  const firstScore = scores[0].score
  const change = Math.round(currentScore) - Math.round(firstScore)
  const TrendIcon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus
  const trendClass = change > 0 ? 'up' : change < 0 ? 'down' : 'stable'

  return (
    <div className="sp-skill-card">
      <div className="sp-skill-header">
        <span className="sp-skill-name" style={{ color }}>{label}</span>
        <div className="sp-skill-trend-wrap">
          {change !== 0 && (
            <span className={`sp-skill-change ${trendClass}`}>
              <TrendIcon size={12} />
              {change > 0 ? '+' : ''}{change}
            </span>
          )}
          <span className="sp-skill-level-badge" style={{ color: level.color, background: level.bg }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: level.dot, display: 'inline-block' }} />
            {level.label}
          </span>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="sp-chart-svg">
        <defs>
          <linearGradient id={`grad-${skill}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#grad-${skill})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill={color} stroke="var(--color-bg)" strokeWidth="1.5" />
        ))}
        <text x={points[0].x} y={height - 4} fill="var(--color-text-tertiary)" fontSize="9" textAnchor="start">
          {points[0].date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
        </text>
        {points.length > 1 && (
          <text x={points[points.length - 1].x} y={height - 4} fill="var(--color-text-tertiary)" fontSize="9" textAnchor="end">
            {points[points.length - 1].date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
          </text>
        )}
      </svg>
      <div className="sp-skill-sessions">
        {scores.length} {scores.length === 1 ? 'aktualizacja' : 'aktualizacji'}
      </div>
    </div>
  )
}

function RadarChart({ currentSkills }) {
  const skills = Object.entries(SKILL_NAMES)
  const n = skills.length
  const cx = 130, cy = 130, r = 100

  const angleStep = (2 * Math.PI) / n
  const startAngle = -Math.PI / 2

  const getPoint = (i, value) => {
    const angle = startAngle + i * angleStep
    const dist = (value / 5) * r
    return {
      x: cx + dist * Math.cos(angle),
      y: cy + dist * Math.sin(angle),
    }
  }

  const gridLevels = [1, 2, 3, 4, 5]

  const dataPoints = skills.map(([key], i) => {
    const val = currentSkills[key] || 0
    return getPoint(i, val)
  })

  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

  return (
    <div className="sp-radar-wrap">
      <svg viewBox="0 0 260 260" className="sp-radar-svg">
        {gridLevels.map((level) => (
          <polygon key={level}
            points={skills.map((_, i) => {
              const p = getPoint(i, level)
              return `${p.x},${p.y}`
            }).join(' ')}
            fill="none" stroke="var(--color-border)" strokeWidth="1" opacity="0.5"
          />
        ))}
        {skills.map(([key, label], i) => {
          const p = getPoint(i, 5)
          const labelP = getPoint(i, 5.9)
          return (
            <g key={key}>
              <line x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--color-border)" strokeWidth="1" opacity="0.3" />
              <text x={labelP.x} y={labelP.y} fill="var(--color-text-secondary)" fontSize="10" fontWeight="600" textAnchor="middle" dominantBaseline="middle">
                {label}
              </text>
            </g>
          )
        })}
        <polygon points={dataPoints.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="var(--color-accent)" fillOpacity="0.15" stroke="var(--color-accent)" strokeWidth="2" />
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill="var(--color-accent)" stroke="var(--color-bg)" strokeWidth="2" />
        ))}
        {skills.map(([key], i) => {
          const val = currentSkills[key] || 0
          const lvl = getSkillLevel(val)
          const p = getPoint(i, val)
          return (
            <text key={`val-${key}`} x={p.x} y={p.y - 10} fill={lvl.dot} fontSize="9" fontWeight="700" textAnchor="middle">
              {lvl.label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

export default function SkillProgress() {
  const { id: playerId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState({})
  const [currentSkills, setCurrentSkills] = useState({})
  const [playerName, setPlayerName] = useState('')

  useEffect(() => {
    const fetch = async () => {
      try {
        const [histRes, playerRes] = await Promise.all([
          api.get(`/players/${playerId}/skill-history`),
          api.get(`/players/${playerId}`),
        ])
        setHistory(histRes.data.history || {})
        setCurrentSkills(histRes.data.currentSkills || {})
        const p = playerRes.data.player || playerRes.data
        setPlayerName(`${p.firstName || ''} ${p.lastName || ''}`.trim())
      } catch { /* silent */ }
      setLoading(false)
    }
    fetch()
  }, [playerId])

  if (loading) {
    return <div className="sp-page"><div className="sp-loading">Ladowanie...</div></div>
  }

  const skillValues = Object.values(currentSkills).filter((v) => v > 0)
  const avgScore = skillValues.length > 0 ? Math.round(skillValues.reduce((a, b) => a + b, 0) / skillValues.length) : 0
  const avgLevel = getSkillLevel(avgScore)

  return (
    <div className="sp-page">
      <button className="sp-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Powrot
      </button>

      <h1 className="page-title">Postepy — {playerName}</h1>

      <div className="sp-section">
        <h2 className="sp-section-title">Profil umiejetnosci</h2>
        <div className="sp-radar-container">
          <RadarChart currentSkills={currentSkills} />
          <div className="sp-avg">
            <span className="sp-avg-value" style={{ color: avgLevel.color }}>{avgLevel.label}</span>
            <span className="sp-avg-label">Sredni poziom</span>
          </div>
        </div>
      </div>

      <div className="sp-section">
        <h2 className="sp-section-title">Historia zmian</h2>
        <div className="sp-charts-grid">
          {Object.entries(SKILL_NAMES).map(([key, label]) => (
            <SkillChart
              key={key}
              skill={key}
              label={label}
              color={SKILL_COLORS[key]}
              dataPoints={history[key] || []}
              currentScore={currentSkills[key] || 0}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
