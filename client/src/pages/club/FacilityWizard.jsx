import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Check, Minus, Plus,
  Home, Lamp, Snowflake, Trash2, Loader2,
} from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import './FacilityWizard.css'

const SURFACES = [
  { key: 'clay', label: 'Mączka', color: '#D97706' },
  { key: 'hard', label: 'Twarda', color: '#3B82F6' },
  { key: 'grass', label: 'Trawa', color: '#22C55E' },
  { key: 'carpet', label: 'Dywan', color: '#EF4444' },
  { key: 'indoor-hard', label: 'Hala', color: '#8B5CF6' },
]

const SURFACE_LABELS = Object.fromEntries(SURFACES.map(s => [s.key, s.label]))
const SURFACE_COLORS = Object.fromEntries(SURFACES.map(s => [s.key, s.color]))

const AMENITIES = [
  { key: 'gym', label: 'Siłownia', icon: '🏋️' },
  { key: 'squash', label: 'Squash', icon: '🎾', countField: 'courtsCount', countLabel: 'Liczba kortów' },
  { key: 'tableTennis', label: 'Tenis stołowy', icon: '🏓', countField: 'tablesCount', countLabel: 'Liczba stołów' },
  { key: 'swimmingPool', label: 'Basen', icon: '🏊' },
  { key: 'sauna', label: 'Sauna', icon: '🧖' },
  { key: 'changingRooms', label: 'Szatnie', icon: '🚿' },
  { key: 'parking', label: 'Parking', icon: '🅿️', countField: 'spacesCount', countLabel: 'Liczba miejsc' },
  { key: 'shop', label: 'Sklep', icon: '🛒' },
  { key: 'cafe', label: 'Kawiarnia', icon: '☕' },
  { key: 'physio', label: 'Fizjoterapia', icon: '💆' },
]

const STEPS = ['Korty', 'Szczegóły', 'Udogodnienia', 'Podsumowanie']

export default function FacilityWizard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const clubId = user?.club && typeof user.club === 'object' ? user.club._id : user?.club

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  // Data
  const [courtCount, setCourtCount] = useState(0)
  const [courts, setCourts] = useState([])
  const [facilities, setFacilities] = useState({})
  const [customFacilities, setCustomFacilities] = useState([])

  // Load existing data
  useEffect(() => {
    if (!clubId) { setLoading(false); return }
    api.get(`/clubs/${clubId}/facility`)
      .then(({ data }) => {
        const f = data.facility
        const c = f.courts || []
        setCourts(c)
        setCourtCount(c.length)
        setFacilities(f.facilities || {})
        setCustomFacilities(f.facilities?.other || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [clubId])

  // Sync court count with courts array
  useEffect(() => {
    if (courtCount > courts.length) {
      const toAdd = courtCount - courts.length
      const maxNum = courts.length > 0 ? Math.max(...courts.map(c => c.number || 0)) : 0
      const newCourts = Array.from({ length: toAdd }, (_, i) => ({
        number: maxNum + i + 1,
        name: '',
        surface: 'clay',
        indoor: false,
        lighting: false,
        heated: false,
        active: true,
      }))
      setCourts([...courts, ...newCourts])
    } else if (courtCount < courts.length) {
      setCourts(courts.slice(0, courtCount))
    }
  }, [courtCount])

  const updateCourt = (idx, field, value) => {
    setCourts(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c))
  }

  const toggleFacility = (key) => {
    setFacilities(prev => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key]?.enabled },
    }))
  }

  const updateFacilityField = (key, field, value) => {
    setFacilities(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`/clubs/${clubId}/facility`, {
        courts: courts.map((c, i) => ({ ...c, number: c.number || i + 1 })),
        facilities: { ...facilities, other: customFacilities.filter(f => f.name?.trim()) },
      })
      setSuccess(true)
    } catch (err) {
      console.error(err)
    }
    setSaving(false)
  }

  const canNext = () => {
    if (step === 1) return courtCount >= 1
    return true
  }

  const goNext = () => { if (canNext() && step < 4) setStep(step + 1) }
  const goBack = () => { if (step > 1) setStep(step - 1) }
  const goToStep = (s) => { if (s <= step || s === step + 1) setStep(s) }

  if (loading) {
    return (
      <div className="fw-page" style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
        <Loader2 size={24} className="idol-spin" style={{ color: 'var(--color-accent)' }} />
      </div>
    )
  }

  if (success) {
    return (
      <div className="fw-page">
        <div className="fw-success">
          <div className="fw-success-icon"><Check size={28} /></div>
          <h2>Infrastruktura zapisana</h2>
          <p>{courts.length} {courts.length === 1 ? 'kort' : courts.length < 5 ? 'korty' : 'kortów'} skonfigurowanych</p>
          <button className="fw-nav-btn primary" onClick={() => navigate('/club/dashboard')}>
            Przejdź do panelu
          </button>
        </div>
      </div>
    )
  }

  // Active amenities count for summary
  const activeAmenities = AMENITIES.filter(a => facilities[a.key]?.enabled)
  const uniqueSurfaces = [...new Set(courts.map(c => c.surface))]

  return (
    <div className="fw-page">
      {/* Progress */}
      <div className="fw-progress">
        {STEPS.map((label, i) => {
          const num = i + 1
          const isActive = step === num
          const isDone = step > num
          return (
            <div key={num} style={{ display: 'flex', alignItems: 'center' }}>
              <div className={`fw-progress-step ${isActive ? 'is-active' : ''}`} onClick={() => goToStep(num)}>
                <div className={`fw-progress-dot ${isActive ? 'active' : isDone ? 'done' : ''}`}>
                  {isDone ? <Check size={14} /> : num}
                </div>
                <span className="fw-progress-label">{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`fw-progress-line ${isDone ? 'filled' : ''}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Step 1: Court count */}
      {step === 1 && (
        <div className="fw-step" key="step1">
          <div className="fw-watermark">1</div>
          <h2 className="fw-step-title">Ile kortów ma Twój klub?</h2>
          <p className="fw-step-sub">Podaj liczbę kortów tenisowych — szczegóły skonfigurujesz w następnym kroku</p>

          <div className="fw-count-row">
            <button className="fw-count-btn" onClick={() => setCourtCount(Math.max(0, courtCount - 1))}>
              <Minus size={20} />
            </button>
            <span className="fw-count-value">{courtCount}</span>
            <button className="fw-count-btn" onClick={() => setCourtCount(courtCount + 1)}>
              <Plus size={20} />
            </button>
          </div>

          <div className="fw-court-minis">
            {Array.from({ length: courtCount }, (_, i) => (
              <div key={i} className="fw-court-mini" style={{ animationDelay: `${i * 0.04}s` }}>
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Court details */}
      {step === 2 && (
        <div className="fw-step" key="step2">
          <div className="fw-watermark">2</div>
          <h2 className="fw-step-title">Skonfiguruj każdy kort</h2>
          <p className="fw-step-sub">Nawierzchnia, zadaszenie, oświetlenie i ogrzewanie</p>

          <div className="fw-court-cards">
            {courts.map((court, idx) => (
              <div
                key={idx}
                className="fw-court-card"
                data-surface={court.surface}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="fw-court-card-head">
                  <span className="fw-court-num">#{court.number}</span>
                  <input
                    className="fw-court-name-input"
                    value={court.name}
                    onChange={(e) => updateCourt(idx, 'name', e.target.value)}
                    placeholder={`Kort ${court.number}`}
                  />
                </div>

                <div className="fw-surfaces">
                  {SURFACES.map((s) => (
                    <button
                      key={s.key}
                      className={`fw-surface-btn ${court.surface === s.key ? 'active' : ''}`}
                      data-s={s.key}
                      onClick={() => updateCourt(idx, 'surface', s.key)}
                    >
                      <span className="fw-surface-dot" style={{ background: s.color }} />
                      {s.label}
                    </button>
                  ))}
                </div>

                <div className="fw-toggles">
                  <button
                    className={`fw-toggle-chip ${court.indoor ? 'on' : ''}`}
                    onClick={() => updateCourt(idx, 'indoor', !court.indoor)}
                  >
                    <Home size={12} /> Zadaszony
                  </button>
                  <button
                    className={`fw-toggle-chip ${court.lighting ? 'on' : ''}`}
                    onClick={() => updateCourt(idx, 'lighting', !court.lighting)}
                  >
                    <Lamp size={12} /> Oświetlenie
                  </button>
                  <button
                    className={`fw-toggle-chip ${court.heated ? 'on' : ''}`}
                    onClick={() => updateCourt(idx, 'heated', !court.heated)}
                  >
                    <Snowflake size={12} /> Ogrzewanie
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Amenities */}
      {step === 3 && (
        <div className="fw-step" key="step3">
          <div className="fw-watermark">3</div>
          <h2 className="fw-step-title">Co jeszcze oferuje Twój klub?</h2>
          <p className="fw-step-sub">Zaznacz dostępne udogodnienia</p>

          <div className="fw-amenities-grid">
            {AMENITIES.map((a) => {
              const isOn = !!facilities[a.key]?.enabled
              return (
                <div key={a.key} className={`fw-amenity-card ${isOn ? 'active' : ''}`}>
                  <div className="fw-amenity-head" onClick={() => toggleFacility(a.key)}>
                    <span className="fw-amenity-icon">{a.icon}</span>
                    <span className="fw-amenity-name">{a.label}</span>
                    <button className={`fw-amenity-toggle ${isOn ? 'on' : ''}`} />
                  </div>
                  {isOn && (
                    <div className="fw-amenity-body">
                      <input
                        className="fw-amenity-input"
                        placeholder="Opis (opcjonalnie)"
                        value={facilities[a.key]?.description || ''}
                        onChange={(e) => updateFacilityField(a.key, 'description', e.target.value)}
                      />
                      {a.countField && (
                        <div className="fw-amenity-count-row">
                          <label>{a.countLabel}:</label>
                          <input
                            type="number"
                            min="1"
                            value={facilities[a.key]?.[a.countField] || ''}
                            onChange={(e) => updateFacilityField(a.key, a.countField, parseInt(e.target.value) || '')}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Custom facilities */}
          <div className="fw-custom-section">
            <div className="fw-custom-label">Inne udogodnienia</div>
            {customFacilities.map((cf, idx) => (
              <div key={idx} className="fw-custom-row">
                <input
                  placeholder="Nazwa"
                  value={cf.name || ''}
                  onChange={(e) => {
                    const upd = [...customFacilities]
                    upd[idx] = { ...upd[idx], name: e.target.value }
                    setCustomFacilities(upd)
                  }}
                />
                <input
                  placeholder="Opis"
                  value={cf.description || ''}
                  onChange={(e) => {
                    const upd = [...customFacilities]
                    upd[idx] = { ...upd[idx], description: e.target.value }
                    setCustomFacilities(upd)
                  }}
                />
                <button className="fw-custom-del" onClick={() => setCustomFacilities(customFacilities.filter((_, i) => i !== idx))}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <button className="fw-add-custom" onClick={() => setCustomFacilities([...customFacilities, { name: '', description: '' }])}>
              <Plus size={13} /> Dodaj
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Summary */}
      {step === 4 && (
        <div className="fw-step" key="step4">
          <div className="fw-watermark">4</div>
          <h2 className="fw-step-title">Twoja infrastruktura</h2>
          <p className="fw-step-sub">Sprawdź i zapisz konfigurację</p>

          <div className="fw-summary-stats">
            <div className="fw-summary-stat">
              <span className="fw-summary-stat-val">{courts.length}</span>
              <span className="fw-summary-stat-label">{courts.length === 1 ? 'kort' : courts.length < 5 ? 'korty' : 'kortów'}</span>
            </div>
            <div className="fw-summary-stat">
              <span className="fw-summary-stat-val">{uniqueSurfaces.length}</span>
              <span className="fw-summary-stat-label">{uniqueSurfaces.length === 1 ? 'nawierzchnia' : 'nawierzchnie'}</span>
            </div>
            <div className="fw-summary-stat">
              <span className="fw-summary-stat-val">{activeAmenities.length}</span>
              <span className="fw-summary-stat-label">{activeAmenities.length === 1 ? 'udogodnienie' : 'udogodnień'}</span>
            </div>
          </div>

          <div className="fw-summary-section">
            <div className="fw-summary-label">Korty</div>
            <div className="fw-summary-courts">
              {courts.map((c, i) => (
                <div key={i} className="fw-summary-court">
                  <span className="fw-summary-court-name">
                    {c.name || `Kort ${c.number}`}
                  </span>
                  <span
                    className="fw-summary-court-surface"
                    style={{ background: SURFACE_COLORS[c.surface] + '20', color: SURFACE_COLORS[c.surface] }}
                  >
                    {SURFACE_LABELS[c.surface]}
                  </span>
                  <div className="fw-summary-court-tags">
                    {c.indoor && <span className="fw-summary-tag">Zadaszony</span>}
                    {c.lighting && <span className="fw-summary-tag">Oświetlenie</span>}
                    {c.heated && <span className="fw-summary-tag">Ogrzewanie</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {activeAmenities.length > 0 && (
            <div className="fw-summary-section">
              <div className="fw-summary-label">Udogodnienia</div>
              <div className="fw-summary-amenities">
                {activeAmenities.map((a) => (
                  <div key={a.key} className="fw-summary-amenity">
                    <span>{a.icon}</span>
                    <span>{a.label}</span>
                  </div>
                ))}
                {customFacilities.filter(f => f.name?.trim()).map((f, i) => (
                  <div key={`c-${i}`} className="fw-summary-amenity">
                    <span>✦</span>
                    <span>{f.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="fw-nav">
        {step > 1 ? (
          <button className="fw-nav-btn secondary" onClick={goBack}>
            <ChevronLeft size={16} /> Wstecz
          </button>
        ) : <div />}

        {step < 4 ? (
          <button className="fw-nav-btn primary" onClick={goNext} disabled={!canNext()}>
            Dalej <ChevronRight size={16} />
          </button>
        ) : (
          <button className="fw-nav-btn primary" onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 size={14} className="idol-spin" /> Zapisywanie...</> : <><Check size={14} /> Zapisz infrastrukturę</>}
          </button>
        )}
      </div>
    </div>
  )
}
