import { useState, useEffect } from 'react'
import {
  Loader2, Plus, Trash2, Save, ChevronDown, ChevronUp,
  Lamp, Snowflake, Home,
} from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'

const SURFACE_LABELS = {
  clay: 'Mączka (clay)',
  hard: 'Twarda (hard)',
  grass: 'Trawa',
  carpet: 'Dywan (carpet)',
  'indoor-hard': 'Hala (indoor hard)',
}

const FACILITY_CONFIG = [
  { key: 'gym', label: 'Siłownia', icon: '🏋️' },
  { key: 'squash', label: 'Squash', icon: '🎾', extraField: 'courtsCount', extraLabel: 'Liczba kortów' },
  { key: 'tableTennis', label: 'Tenis stołowy', icon: '🏓', extraField: 'tablesCount', extraLabel: 'Liczba stołów' },
  { key: 'swimmingPool', label: 'Basen', icon: '🏊' },
  { key: 'sauna', label: 'Sauna', icon: '🧖' },
  { key: 'changingRooms', label: 'Szatnie', icon: '🚿' },
  { key: 'parking', label: 'Parking', icon: '🅿️', extraField: 'spacesCount', extraLabel: 'Liczba miejsc' },
  { key: 'shop', label: 'Sklep', icon: '🛒' },
  { key: 'cafe', label: 'Kawiarnia / Restauracja', icon: '☕' },
  { key: 'physio', label: 'Fizjoterapia', icon: '💆' },
]

const emptyCourt = () => ({
  number: 0,
  name: '',
  surface: 'clay',
  indoor: false,
  lighting: false,
  heated: false,
  active: true,
})

export default function ClubFacility() {
  const user = useAuthStore((s) => s.user)
  const clubId = user?.club && typeof user.club === 'object' ? user.club._id : user?.club

  const [courts, setCourts] = useState([])
  const [facilities, setFacilities] = useState({})
  const [otherFacilities, setOtherFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [courtsExpanded, setCourtsExpanded] = useState(true)
  const [facilitiesExpanded, setFacilitiesExpanded] = useState(true)

  useEffect(() => {
    if (!clubId) { setLoading(false); return }
    const fetch = async () => {
      try {
        const { data } = await api.get(`/clubs/${clubId}/facility`)
        const f = data.facility
        setCourts(f.courts || [])
        setFacilities(f.facilities || {})
        setOtherFacilities(f.facilities?.other || [])
      } catch { /* silent */ }
      setLoading(false)
    }
    fetch()
  }, [clubId])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const payload = {
        courts: courts.map((c, i) => ({ ...c, number: c.number || i + 1 })),
        facilities: {
          ...facilities,
          other: otherFacilities.filter(f => f.name.trim()),
        },
      }
      const { data } = await api.put(`/clubs/${clubId}/facility`, payload)
      setCourts(data.facility.courts || [])
      setFacilities(data.facility.facilities || {})
      setOtherFacilities(data.facility.facilities?.other || [])
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      console.error('Facility save error:', err)
    }
    setSaving(false)
  }

  const addCourt = () => {
    const maxNum = courts.length > 0 ? Math.max(...courts.map(c => c.number)) : 0
    setCourts([...courts, { ...emptyCourt(), number: maxNum + 1 }])
  }

  const removeCourt = (idx) => {
    setCourts(courts.filter((_, i) => i !== idx))
  }

  const updateCourt = (idx, field, value) => {
    setCourts(courts.map((c, i) => i === idx ? { ...c, [field]: value } : c))
  }

  const toggleFacility = (key) => {
    setFacilities(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        available: !(prev[key]?.available),
      },
    }))
  }

  const updateFacilityField = (key, field, value) => {
    setFacilities(prev => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [field]: value },
    }))
  }

  const addOtherFacility = () => {
    setOtherFacilities([...otherFacilities, { name: '', description: '' }])
  }

  const removeOtherFacility = (idx) => {
    setOtherFacilities(otherFacilities.filter((_, i) => i !== idx))
  }

  const updateOtherFacility = (idx, field, value) => {
    setOtherFacilities(otherFacilities.map((f, i) => i === idx ? { ...f, [field]: value } : f))
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-accent)' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!clubId) {
    return (
      <div style={{ padding: '2rem', color: 'var(--color-text-secondary)' }}>
        Nie przypisano klubu do tego konta.
      </div>
    )
  }

  const activeCourts = courts.filter(c => c.active !== false)
  const surfaceSummary = {}
  activeCourts.forEach(c => {
    surfaceSummary[c.surface] = (surfaceSummary[c.surface] || 0) + 1
  })

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
            Infrastruktura
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
            Zarządzaj kortami i udogodnieniami ośrodka
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '0.6rem 1.2rem', borderRadius: 8, border: 'none',
            background: saved ? 'var(--color-green)' : 'var(--color-accent)',
            color: '#0B0E14', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
            opacity: saving ? 0.6 : 1, transition: 'all 0.2s',
          }}
        >
          {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
          {saved ? 'Zapisano!' : 'Zapisz zmiany'}
        </button>
      </div>

      {/* Summary bar */}
      {activeCourts.length > 0 && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: '1.5rem',
          padding: '0.75rem 1rem', borderRadius: 10,
          background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
        }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text)', fontWeight: 600 }}>
            Kortów: {activeCourts.length}
          </span>
          {Object.entries(surfaceSummary).map(([s, count]) => (
            <span key={s} style={{
              fontSize: '0.75rem', padding: '2px 10px', borderRadius: 6,
              background: 'var(--color-accent-muted)', color: 'var(--color-accent)', fontWeight: 500,
            }}>
              {SURFACE_LABELS[s] || s}: {count}
            </span>
          ))}
          {activeCourts.filter(c => c.indoor).length > 0 && (
            <span style={{
              fontSize: '0.75rem', padding: '2px 10px', borderRadius: 6,
              background: 'var(--color-blue-bg)', color: 'var(--color-blue)', fontWeight: 500,
            }}>
              Kryte: {activeCourts.filter(c => c.indoor).length}
            </span>
          )}
          {activeCourts.filter(c => c.lighting).length > 0 && (
            <span style={{
              fontSize: '0.75rem', padding: '2px 10px', borderRadius: 6,
              background: 'var(--color-amber-bg)', color: 'var(--color-amber)', fontWeight: 500,
            }}>
              Oświetlenie: {activeCourts.filter(c => c.lighting).length}
            </span>
          )}
        </div>
      )}

      {/* Courts Section */}
      <div style={{
        background: 'var(--color-bg-secondary)', borderRadius: 12,
        border: '1px solid var(--color-border)', marginBottom: '1.5rem', overflow: 'hidden',
      }}>
        <button
          onClick={() => setCourtsExpanded(!courtsExpanded)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '1rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer',
          }}
        >
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
            Korty tenisowe ({courts.length})
          </h2>
          {courtsExpanded ? <ChevronUp size={18} color="var(--color-text-secondary)" /> : <ChevronDown size={18} color="var(--color-text-secondary)" />}
        </button>

        {courtsExpanded && (
          <div style={{ padding: '0 1.25rem 1.25rem' }}>
            {courts.length === 0 && (
              <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.85rem', margin: '0 0 1rem' }}>
                Nie dodano jeszcze żadnych kortów.
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {courts.map((court, idx) => (
                <div key={idx} style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr 1fr auto',
                  gap: 10, alignItems: 'center',
                  padding: '0.75rem', borderRadius: 8,
                  background: court.active === false ? 'var(--color-bg-tertiary)' : 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  opacity: court.active === false ? 0.5 : 1,
                }}>
                  {/* Number */}
                  <input
                    type="number"
                    min={1}
                    value={court.number}
                    onChange={(e) => updateCourt(idx, 'number', parseInt(e.target.value) || 1)}
                    placeholder="#"
                    style={{
                      width: '100%', padding: '0.4rem', borderRadius: 6,
                      border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)',
                      color: 'var(--color-text)', fontSize: '0.85rem', textAlign: 'center',
                    }}
                  />

                  {/* Name */}
                  <input
                    value={court.name || ''}
                    onChange={(e) => updateCourt(idx, 'name', e.target.value)}
                    placeholder={`Kort ${court.number}`}
                    style={{
                      width: '100%', padding: '0.4rem 0.6rem', borderRadius: 6,
                      border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)',
                      color: 'var(--color-text)', fontSize: '0.85rem',
                    }}
                  />

                  {/* Surface */}
                  <select
                    value={court.surface}
                    onChange={(e) => updateCourt(idx, 'surface', e.target.value)}
                    style={{
                      width: '100%', padding: '0.4rem', borderRadius: 6,
                      border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)',
                      color: 'var(--color-text)', fontSize: '0.85rem',
                    }}
                  >
                    {Object.entries(SURFACE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>

                  {/* Actions row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={() => updateCourt(idx, 'indoor', !court.indoor)}
                      title="Kryty"
                      style={{
                        width: 30, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: court.indoor ? 'var(--color-blue-bg)' : 'var(--color-bg-tertiary)',
                        color: court.indoor ? 'var(--color-blue)' : 'var(--color-text-tertiary)',
                      }}
                    >
                      <Home size={14} />
                    </button>
                    <button
                      onClick={() => updateCourt(idx, 'lighting', !court.lighting)}
                      title="Oświetlenie"
                      style={{
                        width: 30, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: court.lighting ? 'var(--color-amber-bg)' : 'var(--color-bg-tertiary)',
                        color: court.lighting ? 'var(--color-amber)' : 'var(--color-text-tertiary)',
                      }}
                    >
                      <Lamp size={14} />
                    </button>
                    <button
                      onClick={() => updateCourt(idx, 'heated', !court.heated)}
                      title="Ogrzewanie"
                      style={{
                        width: 30, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: court.heated ? 'var(--color-green-bg)' : 'var(--color-bg-tertiary)',
                        color: court.heated ? 'var(--color-green)' : 'var(--color-text-tertiary)',
                      }}
                    >
                      <Snowflake size={14} />
                    </button>
                    <button
                      onClick={() => removeCourt(idx)}
                      title="Usuń kort"
                      style={{
                        width: 30, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(239,68,68,0.1)', color: '#EF4444',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addCourt}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, marginTop: 12,
                padding: '0.5rem 1rem', borderRadius: 8,
                border: '1px dashed var(--color-border)', background: 'none',
                color: 'var(--color-accent)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Plus size={16} /> Dodaj kort
            </button>
          </div>
        )}
      </div>

      {/* Facilities Section */}
      <div style={{
        background: 'var(--color-bg-secondary)', borderRadius: 12,
        border: '1px solid var(--color-border)', marginBottom: '1.5rem', overflow: 'hidden',
      }}>
        <button
          onClick={() => setFacilitiesExpanded(!facilitiesExpanded)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '1rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer',
          }}
        >
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
            Udogodnienia
          </h2>
          {facilitiesExpanded ? <ChevronUp size={18} color="var(--color-text-secondary)" /> : <ChevronDown size={18} color="var(--color-text-secondary)" />}
        </button>

        {facilitiesExpanded && (
          <div style={{ padding: '0 1.25rem 1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
              {FACILITY_CONFIG.map(({ key, label, icon, extraField, extraLabel }) => {
                const fac = facilities[key] || {}
                const isOn = !!fac.available
                return (
                  <div key={key} style={{
                    padding: '0.75rem', borderRadius: 8,
                    border: `1px solid ${isOn ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    background: isOn ? 'rgba(163,230,53,0.05)' : 'var(--color-bg)',
                    transition: 'all 0.2s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isOn ? 8 : 0 }}>
                      <span style={{ fontSize: '1.25rem' }}>{icon}</span>
                      <span style={{ flex: 1, fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>
                        {label}
                      </span>
                      <button
                        onClick={() => toggleFacility(key)}
                        style={{
                          width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                          background: isOn ? 'var(--color-accent)' : 'var(--color-bg-tertiary)',
                          position: 'relative', transition: 'background 0.2s',
                        }}
                      >
                        <div style={{
                          width: 18, height: 18, borderRadius: '50%',
                          background: '#fff', position: 'absolute', top: 3,
                          left: isOn ? 23 : 3, transition: 'left 0.2s',
                        }} />
                      </button>
                    </div>

                    {isOn && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 35 }}>
                        {extraField && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                              {extraLabel}:
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={fac[extraField] || ''}
                              onChange={(e) => updateFacilityField(key, extraField, parseInt(e.target.value) || null)}
                              style={{
                                width: 60, padding: '0.25rem 0.4rem', borderRadius: 6,
                                border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)',
                                color: 'var(--color-text)', fontSize: '0.8rem',
                              }}
                            />
                          </div>
                        )}
                        <input
                          value={fac.description || ''}
                          onChange={(e) => updateFacilityField(key, 'description', e.target.value)}
                          placeholder="Opis (opcjonalny)"
                          style={{
                            width: '100%', padding: '0.3rem 0.5rem', borderRadius: 6,
                            border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)',
                            color: 'var(--color-text)', fontSize: '0.8rem',
                          }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Other facilities */}
            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 8px' }}>
                Inne udogodnienia
              </h3>
              {otherFacilities.map((f, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    value={f.name}
                    onChange={(e) => updateOtherFacility(idx, 'name', e.target.value)}
                    placeholder="Nazwa"
                    style={{
                      flex: 1, padding: '0.4rem 0.6rem', borderRadius: 6,
                      border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                      color: 'var(--color-text)', fontSize: '0.85rem',
                    }}
                  />
                  <input
                    value={f.description || ''}
                    onChange={(e) => updateOtherFacility(idx, 'description', e.target.value)}
                    placeholder="Opis"
                    style={{
                      flex: 2, padding: '0.4rem 0.6rem', borderRadius: 6,
                      border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                      color: 'var(--color-text)', fontSize: '0.85rem',
                    }}
                  />
                  <button
                    onClick={() => removeOtherFacility(idx)}
                    style={{
                      width: 32, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(239,68,68,0.1)', color: '#EF4444',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                onClick={addOtherFacility}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '0.4rem 0.8rem', borderRadius: 8,
                  border: '1px dashed var(--color-border)', background: 'none',
                  color: 'var(--color-accent)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                <Plus size={14} /> Dodaj inne
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
