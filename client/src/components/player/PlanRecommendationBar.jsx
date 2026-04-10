import { useState, useEffect } from 'react'
import { Info, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../../api/axios'

export default function PlanRecommendationBar({ playerId }) {
  const [comparison, setComparison] = useState(null)
  const [tipsOpen, setTipsOpen] = useState(false)

  useEffect(() => {
    if (!playerId) return
    api.get(`/players/${playerId}/federation-program/comparison`)
      .then(r => setComparison(r.data))
      .catch(() => setComparison(null))
  }, [playerId])

  if (!comparison) return null

  const { federation, stage, recommendations: rec, actual, comparison: cmp, suggestions } = comparison

  const statusColor = (status) => {
    if (status === 'on_target') return '#22c55e'
    if (status === 'under') return '#eab308'
    return '#ef4444'
  }

  const items = [
    { label: 'Kort', actual: actual.onCourt, range: `${rec.onCourtHours.min}-${rec.onCourtHours.max}`, status: cmp.onCourt },
    { label: 'Kondycja', actual: actual.physical, range: `${rec.physicalHours.min}-${rec.physicalHours.max}`, status: cmp.physical },
    { label: 'Turnieje', actual: actual.competition, range: `${rec.competitionHours.min}-${rec.competitionHours.max}`, status: cmp.competition },
    { label: 'Lacznie', actual: actual.total, range: `${rec.totalHoursPerWeek.min}-${rec.totalHoursPerWeek.max}`, status: cmp.total },
  ]

  return (
    <div style={{
      background: '#f0f9ff',
      border: '1px solid #bae6fd',
      borderRadius: 10,
      padding: '10px 14px',
      marginBottom: 16,
      fontSize: 13,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>{federation.flag}</span>
        <span style={{ fontWeight: 600, color: '#0c4a6e' }}>{federation.name}</span>
        <span style={{ color: '#6b7280' }}>·</span>
        <span style={{ color: '#0369a1' }}>{stage.namePl}</span>
      </div>

      {/* Inline comparison */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 16px' }}>
        {items.map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: statusColor(item.status),
              display: 'inline-block',
            }} />
            <span style={{ color: '#374151' }}>{item.label}: <strong>{item.actual}h</strong></span>
            <span style={{ color: '#9ca3af', fontSize: 11 }}>({item.range}h)</span>
          </div>
        ))}
      </div>

      {/* Expandable tips */}
      {suggestions.length > 0 && (
        <>
          <button
            onClick={() => setTipsOpen(!tipsOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 8,
              padding: 0,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 12,
              color: '#0369a1',
              fontWeight: 500,
            }}
          >
            <Info size={12} />
            Wskazowki ({suggestions.length})
            {tipsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {tipsOpen && (
            <div style={{ marginTop: 6, paddingLeft: 4 }}>
              {suggestions.map((s, i) => (
                <div key={i} style={{ fontSize: 12, color: '#374151', marginBottom: 2 }}>• {s}</div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
