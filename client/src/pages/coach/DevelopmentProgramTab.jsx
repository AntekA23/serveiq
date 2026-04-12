import { useState, useEffect } from 'react'
import { Globe, ChevronDown, ChevronUp, AlertTriangle, Check, Info, TrendingUp, TrendingDown } from 'lucide-react'
import api from '../../api/axios'
import './DevelopmentProgramTab.css'

const STATUS_STYLES = {
  on_target: { color: 'var(--color-green)', icon: Check, label: 'W normie' },
  under: { color: 'var(--color-amber)', icon: TrendingDown, label: 'Ponizej' },
  over: { color: 'var(--color-heart)', icon: TrendingUp, label: 'Powyzej' },
}

function ComparisonCard({ label, actual, min, max, status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.on_target
  const Icon = style.icon

  return (
    <div className="dpt-card" style={{ borderColor: style.color + '30' }}>
      <div className="dpt-card-header">
        <span className="dpt-card-label">{label}</span>
        <span className="dpt-card-status" style={{ color: style.color }}>
          <Icon size={14} /> {style.label}
        </span>
      </div>
      <div className="dpt-card-value">{actual}h</div>
      <div className="dpt-card-rec">Rekomendacja: {min}–{max}h</div>
      <div className="dpt-card-bar">
        <div
          className="dpt-card-bar-fill"
          style={{
            width: `${Math.min(100, (actual / (max || 1)) * 100)}%`,
            background: style.color,
          }}
        />
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
    return <div className="dpt-loading">Ladowanie programu rozwoju...</div>
  }

  if (!hasProgram) {
    return (
      <div className="dpt-selector">
        <div className="dpt-selector-box">
          <Globe size={32} className="dpt-selector-icon" />
          <h3 className="dpt-selector-title">Wybierz program rozwoju federacji</h3>
          <p className="dpt-selector-desc">
            System dopasuje rekomendacje treningowe do wieku i plci zawodnika
          </p>
          {isCoach && (
            <div className="dpt-program-list">
              {programs.map(p => (
                <button
                  key={p.federationCode}
                  onClick={() => handleSetProgram(p.federationCode)}
                  disabled={saving}
                  className="dpt-program-btn"
                >
                  <span className="dpt-flag">{p.countryFlag}</span>
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
    return <div className="dpt-no-data">Brak danych do porownania</div>
  }

  const { federation, stage, recommendations: rec, actual, comparison: cmp, suggestions, suggestedStageTransition } = comparison
  const programFull = programs.find(p => p.federationCode === federation.code)
  const allStages = programFull?.stages || []

  return (
    <div className="dpt-page">
      {/* Header */}
      <div className="dpt-header">
        <div className="dpt-header-left">
          <span className="dpt-header-flag">{federation.flag}</span>
          <div>
            <div className="dpt-header-name">{federation.name}</div>
            <div className="dpt-header-stage">Etap: {stage.namePl}</div>
          </div>
        </div>
        {isCoach && (
          <select
            value=""
            onChange={e => e.target.value && handleSetProgram(e.target.value)}
            className="dpt-program-select"
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
        <div className="dpt-transition-alert">
          <AlertTriangle size={18} className="dpt-transition-icon" />
          <div className="dpt-transition-text">
            <strong>{suggestedStageTransition.reason}</strong>
          </div>
          {isCoach && (
            <div className="dpt-transition-actions">
              <button
                onClick={() => handleConfirmStage(suggestedStageTransition.toStage)}
                disabled={saving}
                className="dpt-transition-confirm"
              >
                Zatwierdz przejscie
              </button>
              <button
                onClick={() => toast.info('Pozostajesz na obecnym etapie')}
                className="dpt-transition-dismiss"
              >
                Pozostan
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stage stepper */}
      {allStages.length > 0 && (
        <div className="dpt-stepper">
          {allStages.map((s, i) => {
            const isCurrent = s.code === stage.code
            const isSuggested = suggestedStageTransition?.toStage === s.code
            return (
              <div key={s.code} className="dpt-stepper-item">
                <div className={`dpt-stepper-label${isCurrent ? ' current' : ''}${isSuggested ? ' suggested' : ''}`}>
                  {s.namePl || s.name}
                </div>
                {i < allStages.length - 1 && <div className="dpt-stepper-connector" />}
              </div>
            )
          })}
        </div>
      )}

      {/* Comparison cards */}
      <div className="dpt-cards">
        <ComparisonCard label="Lacznie" actual={actual.total} min={rec.totalHoursPerWeek.min} max={rec.totalHoursPerWeek.max} status={cmp.total} />
        <ComparisonCard label="Godziny na korcie" actual={actual.onCourt} min={rec.onCourtHours.min} max={rec.onCourtHours.max} status={cmp.onCourt} />
        <ComparisonCard label="Przygotowanie fizyczne" actual={actual.physical} min={rec.physicalHours.min} max={rec.physicalHours.max} status={cmp.physical} />
        <ComparisonCard label="Turnieje / mecze" actual={actual.competition} min={rec.competitionHours.min} max={rec.competitionHours.max} status={cmp.competition} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="dpt-suggestions">
          <div className="dpt-suggestions-header">
            <Info size={14} /> Wskazowki
          </div>
          {suggestions.map((s, i) => (
            <div key={i} className="dpt-suggestion-item">• {s}</div>
          ))}
        </div>
      )}

      {/* Expandable details */}
      <button onClick={() => setExpanded(!expanded)} className="dpt-details-toggle">
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        Szczegoly etapu: {stage.namePl}
      </button>

      {expanded && (
        <div className="dpt-details-body">
          <div className="dpt-details-section">
            <div className="dpt-details-label">Zasady etapu</div>
            <div className="dpt-details-text">{stage.principles}</div>
          </div>
          <div className="dpt-details-section">
            <div className="dpt-details-label">Obszary skupienia</div>
            <div className="dpt-focus-tags">
              {stage.focusAreas.map((f, i) => (
                <span key={i} className="dpt-focus-tag">{f}</span>
              ))}
            </div>
          </div>
          <div className="dpt-details-meta">
            <span>Wielosportowosc: {stage.multiSportRecommended ? 'Tak' : 'Nie'}</span>
            <span>Min. dni wolnych: {rec.restDaysPerWeek}</span>
            <span>Wiek: {stage.ageRange.min}–{stage.ageRange.max} lat</span>
          </div>
        </div>
      )}
    </div>
  )
}
