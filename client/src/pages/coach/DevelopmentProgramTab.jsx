import { useState, useEffect } from 'react'
import { Globe, ChevronDown, ChevronUp, AlertTriangle, Check, Info, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import api from '../../api/axios'

const STATUS_STYLES = {
  on_target: { color: '#22c55e', bg: '#f0fdf4', icon: Check, label: 'W normie' },
  under: { color: '#eab308', bg: '#fefce8', icon: TrendingDown, label: 'Ponizej' },
  over: { color: '#ef4444', bg: '#fef2f2', icon: TrendingUp, label: 'Powyzej' },
}

function ComparisonCard({ label, actual, min, max, status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.on_target
  const Icon = style.icon
  const range = max - min
  const position = range > 0 ? Math.min(100, Math.max(0, ((actual - min) / range) * 100)) : 50

  return (
    <div style={{
      background: style.bg,
      border: `1px solid ${style.color}30`,
      borderRadius: 10,
      padding: '0.875rem',
      flex: '1 1 calc(50% - 0.5rem)',
      minWidth: 160,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{label}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: style.color, fontWeight: 600 }}>
          <Icon size={14} /> {style.label}
        </span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{actual}h</div>
      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>Rekomendacja: {min}–{max}h</div>
      <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, position: 'relative', overflow: 'visible' }}>
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${Math.min(100, (actual / (max || 1)) * 100)}%`,
          background: style.color,
          borderRadius: 3,
          transition: 'width 0.3s',
        }} />
      </div>
    </div>
  )
}

export default function DevelopmentProgramTab({ playerId, player, toast, isCoach, onRefresh }) {
  const [programs, setPrograms] = useState([])
  const [comparison, setComparison] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [selectedCode, setSelectedCode] = useState('')

  const fp = player?.federationProgram
  const hasProgram = !!fp?.program

  useEffect(() => {
    api.get('/development-programs').then(r => setPrograms(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (hasProgram) {
      api.get(`/players/${playerId}/federation-program/comparison`)
        .then(r => setComparison(r.data))
        .catch(() => setComparison(null))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [playerId, hasProgram, fp?.currentStageCode])

  const handleSetProgram = async (code) => {
    if (!code) return
    setSaving(true)
    try {
      await api.put(`/players/${playerId}/federation-program`, { federationCode: code })
      toast.success('Program rozwoju przypisany')
      onRefresh()
    } catch {
      toast.error('Nie udalo sie przypisac programu')
    }
    setSaving(false)
  }

  const handleConfirmStage = async (stageCode) => {
    setSaving(true)
    try {
      await api.put(`/players/${playerId}/federation-program/confirm-stage`, { stageCode })
      toast.success('Etap zatwierdzony')
      onRefresh()
    } catch {
      toast.error('Nie udalo sie zatwierdzic etapu')
    }
    setSaving(false)
  }

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>Ladowanie programu rozwoju...</div>
  }

  // No program selected — show selector
  if (!hasProgram) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div style={{
          background: '#f9fafb',
          border: '2px dashed #d1d5db',
          borderRadius: 12,
          padding: '2rem',
          textAlign: 'center',
        }}>
          <Globe size={32} style={{ color: '#9ca3af', margin: '0 auto 12px' }} />
          <h3 style={{ margin: '0 0 8px', fontSize: 16, color: '#374151' }}>Wybierz program rozwoju federacji</h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>
            System dopasuje rekomendacje treningowe do wieku i plci zawodnika
          </p>
          {isCoach && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {programs.map(p => (
                <button
                  key={p.federationCode}
                  onClick={() => handleSetProgram(p.federationCode)}
                  disabled={saving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    background: '#fff',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#eff6ff' }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#fff' }}
                >
                  <span style={{ fontSize: 18 }}>{p.countryFlag}</span>
                  <span>{p.federationName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!comparison) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>Brak danych do porownania</div>
  }

  const { federation, stage, recommendations: rec, actual, comparison: cmp, suggestions, suggestedStageTransition } = comparison

  // Find all stages of the program for stepper
  const programFull = programs.find(p => p.federationCode === federation.code)
  const allStages = programFull?.stages || []

  return (
    <div style={{ padding: '1rem' }}>
      {/* Header with federation badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>{federation.flag}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{federation.name}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Etap: {stage.namePl}</div>
          </div>
        </div>
        {isCoach && (
          <select
            value=""
            onChange={e => e.target.value && handleSetProgram(e.target.value)}
            style={{ fontSize: 12, padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 6, color: '#6b7280' }}
          >
            <option value="">Zmien program...</option>
            {programs.map(p => (
              <option key={p.federationCode} value={p.federationCode}>
                {p.countryFlag} {p.federationName}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Stage transition alert */}
      {suggestedStageTransition && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: '#fffbeb',
          border: '1px solid #fbbf24',
          borderRadius: 10,
          padding: '12px 14px',
          marginBottom: 16,
        }}>
          <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 13 }}>
            <strong>{suggestedStageTransition.reason}</strong>
          </div>
          {isCoach && (
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button
                onClick={() => handleConfirmStage(suggestedStageTransition.toStage)}
                disabled={saving}
                style={{
                  padding: '6px 12px',
                  background: '#22c55e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Zatwierdz przejscie
              </button>
              <button
                onClick={() => toast.info('Pozostajesz na obecnym etapie')}
                style={{
                  padding: '6px 12px',
                  background: '#f3f4f6',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Pozostan
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stage stepper */}
      {allStages.length > 0 && (
        <div style={{
          display: 'flex',
          gap: 0,
          marginBottom: 16,
          overflowX: 'auto',
          paddingBottom: 4,
        }}>
          {allStages.map((s, i) => {
            const isCurrent = s.code === stage.code
            const isSuggested = suggestedStageTransition?.toStage === s.code
            return (
              <div key={s.code} style={{
                display: 'flex',
                alignItems: 'center',
                flex: isCurrent ? '0 0 auto' : '0 0 auto',
              }}>
                <div style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: isCurrent ? 700 : 400,
                  background: isCurrent ? '#3b82f6' : isSuggested ? '#fef3c7' : '#f3f4f6',
                  color: isCurrent ? '#fff' : isSuggested ? '#92400e' : '#6b7280',
                  border: isSuggested ? '1px solid #fbbf24' : '1px solid transparent',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}>
                  {s.namePl || s.name}
                </div>
                {i < allStages.length - 1 && (
                  <div style={{ width: 12, height: 2, background: '#d1d5db', flexShrink: 0 }} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Comparison cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: 16 }}>
        <ComparisonCard label="Lacznie" actual={actual.total} min={rec.totalHoursPerWeek.min} max={rec.totalHoursPerWeek.max} status={cmp.total} />
        <ComparisonCard label="Godziny na korcie" actual={actual.onCourt} min={rec.onCourtHours.min} max={rec.onCourtHours.max} status={cmp.onCourt} />
        <ComparisonCard label="Przygotowanie fizyczne" actual={actual.physical} min={rec.physicalHours.min} max={rec.physicalHours.max} status={cmp.physical} />
        <ComparisonCard label="Turnieje / mecze" actual={actual.competition} min={rec.competitionHours.min} max={rec.competitionHours.max} status={cmp.competition} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div style={{
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: 10,
          padding: '12px 14px',
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#0369a1', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Info size={14} /> Wskazowki
          </div>
          {suggestions.map((s, i) => (
            <div key={i} style={{ fontSize: 13, color: '#374151', marginBottom: 2 }}>• {s}</div>
          ))}
        </div>
      )}

      {/* Expandable stage details */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          padding: '10px 14px',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 500,
          color: '#374151',
        }}
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        Szczegoly etapu: {stage.namePl}
      </button>

      {expanded && (
        <div style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderTop: 'none',
          borderRadius: '0 0 10px 10px',
          padding: '14px',
        }}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Zasady etapu</div>
            <div style={{ fontSize: 13, color: '#374151' }}>{stage.principles}</div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Obszary skupienia</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {stage.focusAreas.map((f, i) => (
                <span key={i} style={{
                  padding: '3px 8px',
                  background: '#dbeafe',
                  color: '#1e40af',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 500,
                }}>{f}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6b7280' }}>
            <span>Wielosportowosc: {stage.multiSportRecommended ? 'Tak' : 'Nie'}</span>
            <span>Min. dni wolnych: {rec.restDaysPerWeek}</span>
            <span>Wiek: {stage.ageRange.min}–{stage.ageRange.max} lat</span>
          </div>
        </div>
      )}
    </div>
  )
}
