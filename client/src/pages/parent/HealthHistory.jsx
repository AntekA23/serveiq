import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Heart,
  Activity,
  Moon,
  Zap,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import api from '../../api/axios'
import './HealthHistory.css'

// ─── SVG Line Chart ───
function LineChart({ data, color, height = 120 }) {
  const [tooltip, setTooltip] = useState(null)

  if (!data || data.length === 0) return null

  const padding = { top: 10, right: 10, bottom: 10, left: 10 }
  const viewWidth = 600
  const viewHeight = height
  const chartW = viewWidth - padding.left - padding.right
  const chartH = viewHeight - padding.top - padding.bottom

  const values = data.map((d) => d.value)
  const maxVal = Math.max(...values)
  const minVal = Math.min(...values)
  const range = maxVal - minVal || 1

  const points = data.map((d, i) => {
    const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartW
    const y = padding.top + chartH - ((d.value - minVal) / range) * chartH
    return { x, y, date: d.date, value: d.value }
  })

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ')

  // Gradient area
  const areaPath =
    `M ${points[0].x},${viewHeight - padding.bottom} ` +
    points.map((p) => `L ${p.x},${p.y}`).join(' ') +
    ` L ${points[points.length - 1].x},${viewHeight - padding.bottom} Z`

  // Grid lines
  const gridLines = [0.25, 0.5, 0.75].map((pct) => {
    const y = padding.top + chartH * (1 - pct)
    return y
  })

  const gradId = `grad-${color.replace(/[^a-zA-Z0-9]/g, '')}-${Math.random().toString(36).slice(2, 6)}`

  const handleMouseMove = (e) => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const mouseX = ((e.clientX - rect.left) / rect.width) * viewWidth
    // Find closest point
    let closest = points[0]
    let closestDist = Infinity
    for (const p of points) {
      const dist = Math.abs(p.x - mouseX)
      if (dist < closestDist) {
        closestDist = dist
        closest = p
      }
    }
    const pctX = (closest.x / viewWidth) * 100
    const pctY = (closest.y / viewHeight) * 100
    setTooltip({ x: pctX, y: pctY, value: closest.value, date: closest.date })
  }

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="line-chart-container">
      <svg
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        preserveAspectRatio="none"
        style={{ height }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {gridLines.map((y, i) => (
          <line
            key={i}
            x1={padding.left}
            y1={y}
            x2={viewWidth - padding.right}
            y2={y}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
          />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill={`url(#${gradId})`} />

        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Hover point */}
        {tooltip && (
          <circle
            cx={(tooltip.x / 100) * viewWidth}
            cy={(tooltip.y / 100) * viewHeight}
            r="4"
            fill={color}
            stroke="var(--color-bg-secondary)"
            strokeWidth="2"
          />
        )}
      </svg>
      {tooltip && (
        <div
          className="line-chart-tooltip"
          style={{
            left: `${tooltip.x}%`,
            top: `${tooltip.y - 8}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {tooltip.value} &middot; {formatDate(tooltip.date)}
        </div>
      )}
    </div>
  )
}

// ─── Sleep Bar Chart ───
function SleepBarChart({ data, height = 120 }) {
  if (!data || data.length === 0) return null

  const padding = { top: 5, right: 5, bottom: 5, left: 5 }
  const viewWidth = 600
  const viewHeight = height
  const chartW = viewWidth - padding.left - padding.right
  const chartH = viewHeight - padding.top - padding.bottom

  const maxTotal = Math.max(...data.map((d) => d.deep + d.rem + d.light + d.awake), 1)
  const barWidth = Math.max(2, chartW / data.length - 2)
  const gap = Math.max(1, (chartW - barWidth * data.length) / Math.max(data.length - 1, 1))

  const colors = {
    deep: '#3B82F6',
    rem: '#7C5CFC',
    light: '#94A3B8',
    awake: '#F59E0B',
  }

  return (
    <>
      <div className="sleep-legend">
        <div className="sleep-legend-item">
          <div className="sleep-legend-dot" style={{ background: colors.deep }} />
          Gleboki
        </div>
        <div className="sleep-legend-item">
          <div className="sleep-legend-dot" style={{ background: colors.rem }} />
          REM
        </div>
        <div className="sleep-legend-item">
          <div className="sleep-legend-dot" style={{ background: colors.light }} />
          Lekki
        </div>
        <div className="sleep-legend-item">
          <div className="sleep-legend-dot" style={{ background: colors.awake }} />
          Czuwanie
        </div>
      </div>
      <div className="line-chart-container">
        <svg
          viewBox={`0 0 ${viewWidth} ${viewHeight}`}
          preserveAspectRatio="none"
          style={{ height }}
        >
          {data.map((d, i) => {
            const x = padding.left + i * (barWidth + gap)
            const total = d.deep + d.rem + d.light + d.awake
            const scale = chartH / maxTotal

            let yOffset = padding.top + (chartH - total * scale)

            const segments = [
              { key: 'deep', val: d.deep },
              { key: 'rem', val: d.rem },
              { key: 'light', val: d.light },
              { key: 'awake', val: d.awake },
            ]

            return (
              <g key={i}>
                {segments.map((seg) => {
                  const h = seg.val * scale
                  const rect = (
                    <rect
                      key={seg.key}
                      x={x}
                      y={yOffset}
                      width={barWidth}
                      height={Math.max(0, h)}
                      fill={colors[seg.key]}
                      rx="1"
                    />
                  )
                  yOffset += h
                  return rect
                })}
              </g>
            )
          })}
        </svg>
      </div>
    </>
  )
}

// ─── Period Comparison ───
function PeriodComparison({ playerId }) {
  const [period1, setPeriod1] = useState('0-7')
  const [period2, setPeriod2] = useState('7-14')
  const [comparison, setComparison] = useState(null)
  const [loading, setLoading] = useState(false)

  const periodOptions = [
    { value: '0-7', label: 'Ostatnie 7 dni' },
    { value: '7-14', label: '8-14 dni temu' },
    { value: '14-21', label: '15-21 dni temu' },
    { value: '21-28', label: '22-28 dni temu' },
  ]

  const parsePeriod = (val) => {
    const [fromDays, toDays] = val.split('-').map(Number)
    const now = new Date()
    const from = new Date(now)
    from.setDate(from.getDate() - toDays)
    const to = new Date(now)
    to.setDate(to.getDate() - fromDays)
    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    }
  }

  const fetchComparison = useCallback(async () => {
    setLoading(true)
    try {
      const p1 = parsePeriod(period1)
      const p2 = parsePeriod(period2)
      const { data } = await api.get(
        `/wearables/data/${playerId}/compare?p1_from=${p1.from}&p1_to=${p1.to}&p2_from=${p2.from}&p2_to=${p2.to}`
      )
      setComparison(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [playerId, period1, period2])

  useEffect(() => {
    fetchComparison()
  }, [fetchComparison])

  const metrics = [
    { key: 'hr', label: 'Tetno (bpm)', invertBetter: true },
    { key: 'hrv', label: 'HRV (ms)', invertBetter: false },
    { key: 'sleep', label: 'Sen (%)', invertBetter: false },
    { key: 'recovery', label: 'Regeneracja (%)', invertBetter: false },
    { key: 'strain', label: 'Obciazenie', invertBetter: false },
  ]

  return (
    <div className="period-comparison">
      <h3 className="period-comparison-title">Porownaj okresy</h3>

      <div className="period-selectors">
        <div className="period-selector">
          <div className="period-selector-label">Okres 1</div>
          <select value={period1} onChange={(e) => setPeriod1(e.target.value)}>
            {periodOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="period-selector">
          <div className="period-selector-label">Okres 2</div>
          <select value={period2} onChange={(e) => setPeriod2(e.target.value)}>
            {periodOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="health-history-loading">Ladowanie...</div>}

      {comparison && !loading && (
        <div className="period-compare-grid">
          {metrics.map((m) => {
            const delta = comparison.deltas?.[m.key] || 0
            const p1Avg = comparison.period1?.[m.key]?.avg || 0
            const p2Avg = comparison.period2?.[m.key]?.avg || 0
            const isPositive = m.invertBetter ? delta < 0 : delta > 0
            const deltaClass =
              Math.abs(delta) < 0.5 ? 'neutral' : isPositive ? 'positive' : 'negative'

            return (
              <div key={m.key} className="period-compare-card">
                <div className="period-compare-card-label">{m.label}</div>
                <div className="period-compare-values">
                  <span className="period-compare-val">{p1Avg}</span>
                  <span className="period-compare-vs">vs</span>
                  <span className="period-compare-val">{p2Avg}</span>
                </div>
                <div className={`period-compare-delta ${deltaClass}`}>
                  {delta > 0 ? '+' : ''}
                  {delta}%
                  {deltaClass === 'positive' && <TrendingUp size={12} />}
                  {deltaClass === 'negative' && <TrendingDown size={12} />}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Chart Section ───
function ChartSection({ title, icon: Icon, color, bgColor, chartData, stats, delta, unit, isSleep, sleepData }) {
  const deltaAbs = Math.abs(delta || 0)
  const deltaClass = deltaAbs < 0.5 ? 'neutral' : delta > 0 ? 'positive' : 'negative'
  const deltaLabel =
    deltaAbs < 0.5
      ? 'Bez zmian'
      : `${delta > 0 ? '\u2191' : '\u2193'} ${deltaAbs}% vs poprzedni okres`

  return (
    <div className="health-chart-section">
      <div className="health-chart-section-header">
        <div className="health-chart-section-icon" style={{ background: bgColor, color }}>
          <Icon size={18} />
        </div>
        <span className="health-chart-section-title">{title}</span>
        <div className={`health-chart-section-trend ${deltaClass}`}>{deltaLabel}</div>
      </div>

      {isSleep ? (
        <SleepBarChart data={sleepData} height={120} />
      ) : (
        <LineChart data={chartData} color={color} height={120} />
      )}

      <div className="health-chart-stats">
        <div className="health-chart-stat">
          <div className="health-chart-stat-label">Min</div>
          <div className="health-chart-stat-value">
            {stats?.min ?? '—'}
            {unit && <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginLeft: 2 }}>{unit}</span>}
          </div>
        </div>
        <div className="health-chart-stat">
          <div className="health-chart-stat-label">Srednia</div>
          <div className="health-chart-stat-value">
            {stats?.avg ?? '—'}
            {unit && <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginLeft: 2 }}>{unit}</span>}
          </div>
        </div>
        <div className="health-chart-stat">
          <div className="health-chart-stat-label">Max</div>
          <div className="health-chart-stat-value">
            {stats?.max ?? '—'}
            {unit && <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginLeft: 2 }}>{unit}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───
export default function HealthHistory() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [range, setRange] = useState(7)
  const [trends, setTrends] = useState(null)
  const [childName, setChildName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [trendsRes, playerRes] = await Promise.all([
          api.get(`/wearables/data/${id}/trends?range=${range}`),
          api.get(`/players/${id}`),
        ])
        setTrends(trendsRes.data)
        const p = playerRes.data
        setChildName(`${p.firstName} ${p.lastName}`)
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id, range])

  const ranges = [
    { value: 7, label: '7d' },
    { value: 30, label: '30d' },
    { value: 90, label: '90d' },
  ]

  if (loading) {
    return (
      <div className="health-history">
        <div className="health-history-loading">Ladowanie danych...</div>
      </div>
    )
  }

  const m = trends?.metrics || {}
  const chartData = trends?.chartData || []

  const hrChartData = chartData.map((d) => ({ date: d.date, value: d.hr })).filter((d) => d.value)
  const hrvChartData = chartData.map((d) => ({ date: d.date, value: d.hrv })).filter((d) => d.value)
  const sleepChartData = chartData.map((d) => ({ date: d.date, value: d.sleep })).filter((d) => d.value)
  const recoveryChartData = chartData.map((d) => ({ date: d.date, value: d.recovery })).filter((d) => d.value)

  return (
    <div className="health-history">
      <button className="health-history-back" onClick={() => navigate(`/parent/child/${id}`)}>
        <ArrowLeft size={16} />
        Powrot do profilu
      </button>

      <div className="health-history-header">
        <h1 className="health-history-title">{childName}</h1>
        <div className="health-history-subtitle">Historia metryk zdrowotnych</div>
      </div>

      <div className="health-range-tabs">
        {ranges.map((r) => (
          <button
            key={r.value}
            className={`health-range-tab ${range === r.value ? 'active' : ''}`}
            onClick={() => setRange(r.value)}
          >
            {r.label}
          </button>
        ))}
      </div>

      <ChartSection
        title="Tetno spoczynkowe"
        icon={Heart}
        color="var(--color-heart)"
        bgColor="var(--color-heart-bg)"
        chartData={hrChartData}
        stats={m.hr?.current}
        delta={m.hr?.delta}
        unit="bpm"
      />

      <ChartSection
        title="Zmiennosc rytmu serca (HRV)"
        icon={Activity}
        color="var(--color-hrv)"
        bgColor="var(--color-hrv-bg)"
        chartData={hrvChartData}
        stats={m.hrv?.current}
        delta={m.hrv?.delta}
        unit="ms"
      />

      <ChartSection
        title="Jakosc snu"
        icon={Moon}
        color="var(--color-sleep)"
        bgColor="var(--color-sleep-bg)"
        chartData={sleepChartData}
        stats={m.sleep?.current}
        delta={m.sleep?.delta}
        unit="%"
        isSleep
        sleepData={trends?.sleepDetail || []}
      />

      <ChartSection
        title="Regeneracja"
        icon={Zap}
        color="var(--color-recovery-green)"
        bgColor="var(--color-green-bg)"
        chartData={recoveryChartData}
        stats={m.recovery?.current}
        delta={m.recovery?.delta}
        unit="%"
      />

      <PeriodComparison playerId={id} />
    </div>
  )
}
