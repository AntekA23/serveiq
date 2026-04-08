import { useState, useEffect, useRef } from 'react'
import {
  Loader2, Save, Upload, RefreshCw, Copy, Check,
  ChevronDown, ChevronUp, Plus, Trash2, ArrowUp, ArrowDown,
} from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function ClubSettings() {
  const user = useAuthStore((s) => s.user)
  const clubId = user?.club && typeof user.club === 'object' ? user.club._id : user?.club

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Dane klubu
  const [form, setForm] = useState({
    name: '', shortName: '', city: '', address: '',
    phone: '', email: '', website: '', pztLicense: '', pztCertified: false,
  })
  const [logoUrl, setLogoUrl] = useState(null)
  const [pathwayStages, setPathwayStages] = useState([])
  const [settings, setSettings] = useState({ defaultCurrency: 'PLN', timezone: 'Europe/Warsaw', language: 'pl' })
  const [inviteCode, setInviteCode] = useState('')
  const [codeCopied, setCodeCopied] = useState(false)

  // Sekcje
  const [infoExpanded, setInfoExpanded] = useState(true)
  const [pathwayExpanded, setPathwayExpanded] = useState(true)
  const [inviteExpanded, setInviteExpanded] = useState(true)
  const [defaultsExpanded, setDefaultsExpanded] = useState(true)

  const fileInput = useRef(null)

  useEffect(() => {
    if (!clubId) { setLoading(false); return }
    const fetchData = async () => {
      try {
        const { data } = await api.get(`/clubs/${clubId}/settings`)
        const s = data.settings
        setForm({
          name: s.name || '',
          shortName: s.shortName || '',
          city: s.city || '',
          address: s.address || '',
          phone: s.phone || '',
          email: s.email || '',
          website: s.website || '',
          pztLicense: s.pztLicense || '',
          pztCertified: s.pztCertified || false,
        })
        setLogoUrl(s.logoUrl || null)
        setPathwayStages(s.pathwayStages || [])
        setSettings(s.settings || { defaultCurrency: 'PLN', timezone: 'Europe/Warsaw', language: 'pl' })
        setInviteCode(s.inviteCode || '')
      } catch (err) {
        console.error('Blad ladowania ustawien:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [clubId])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await api.put(`/clubs/${clubId}`, {
        ...form,
        pathwayStages,
        settings,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Blad zapisu:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('logo', file)
    try {
      const { data } = await api.post(`/clubs/${clubId}/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setLogoUrl(data.logoUrl)
    } catch (err) {
      console.error('Blad uploadu logo:', err)
    }
  }

  const handleRegenerateCode = async () => {
    try {
      const { data } = await api.post(`/clubs/${clubId}/regenerate-invite-code`)
      setInviteCode(data.inviteCode)
    } catch (err) {
      console.error('Blad regeneracji kodu:', err)
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  // Pathway stage handlers
  const addStage = () => {
    setPathwayStages([...pathwayStages, {
      name: '', order: pathwayStages.length + 1, description: '',
      ageRange: { min: 0, max: 18 }, color: '#3B82F6',
    }])
  }

  const removeStage = (idx) => {
    setPathwayStages(pathwayStages.filter((_, i) => i !== idx))
  }

  const moveStage = (idx, dir) => {
    const next = [...pathwayStages]
    const target = idx + dir
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    next.forEach((s, i) => { s.order = i + 1 })
    setPathwayStages(next)
  }

  const updateStage = (idx, field, value) => {
    const next = [...pathwayStages]
    if (field === 'ageMin') next[idx].ageRange = { ...next[idx].ageRange, min: Number(value) }
    else if (field === 'ageMax') next[idx].ageRange = { ...next[idx].ageRange, max: Number(value) }
    else next[idx][field] = value
    setPathwayStages(next)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Loader2 size={32} className="spin" />
      </div>
    )
  }

  if (!clubId) {
    return <div className="page-empty">Nie nalezysz do zadnego klubu</div>
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Ustawienia Klubu</h1>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={16} className="spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
          {saved ? 'Zapisano' : 'Zapisz zmiany'}
        </button>
      </div>

      {/* === DANE PODSTAWOWE === */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header clickable" onClick={() => setInfoExpanded(!infoExpanded)}>
          <h3 className="card-title">Dane podstawowe</h3>
          {infoExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        {infoExpanded && (
          <div className="card-body">
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div
                style={{
                  width: 80, height: 80, borderRadius: 12,
                  background: 'var(--color-bg-tertiary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', border: '2px dashed var(--color-border)',
                  cursor: 'pointer', flexShrink: 0,
                }}
                onClick={() => fileInput.current?.click()}
              >
                {logoUrl ? (
                  <img
                    src={`${API_URL}${logoUrl}`}
                    alt="Logo"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Upload size={24} style={{ color: 'var(--color-text-tertiary)' }} />
                )}
              </div>
              <div>
                <button className="btn btn-ghost btn-sm" onClick={() => fileInput.current?.click()}>
                  <Upload size={14} /> Zmien logo
                </button>
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                  JPG, PNG, WebP lub SVG. Max 2 MB.
                </div>
              </div>
              <input ref={fileInput} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Nazwa klubu *</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Skrocona nazwa</label>
                <input className="form-input" value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Miasto</label>
                <input className="form-input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Adres</label>
                <input className="form-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Telefon</label>
                <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Strona www</label>
                <input className="form-input" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Licencja PZT</label>
                <input className="form-input" value={form.pztLicense} onChange={(e) => setForm({ ...form, pztLicense: e.target.value })} />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.pztCertified}
                  onChange={(e) => setForm({ ...form, pztCertified: e.target.checked })}
                />
                <span className="form-label" style={{ margin: 0 }}>Certyfikat PZT</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* === PATHWAY STAGES === */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header clickable" onClick={() => setPathwayExpanded(!pathwayExpanded)}>
          <h3 className="card-title">Etapy sciezki rozwoju</h3>
          {pathwayExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        {pathwayExpanded && (
          <div className="card-body">
            {pathwayStages.map((stage, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 0',
                  borderBottom: idx < pathwayStages.length - 1 ? '1px solid var(--color-border)' : 'none',
                }}
              >
                <input
                  type="color"
                  value={stage.color || '#3B82F6'}
                  onChange={(e) => updateStage(idx, 'color', e.target.value)}
                  style={{ width: 32, height: 32, border: 'none', cursor: 'pointer', background: 'none', flexShrink: 0 }}
                />
                <input
                  className="form-input"
                  placeholder="Nazwa etapu"
                  value={stage.name}
                  onChange={(e) => updateStage(idx, 'name', e.target.value)}
                  style={{ flex: 2, minWidth: 0 }}
                />
                <input
                  className="form-input"
                  type="number"
                  placeholder="Od"
                  value={stage.ageRange?.min || ''}
                  onChange={(e) => updateStage(idx, 'ageMin', e.target.value)}
                  style={{ width: 60 }}
                  title="Wiek od"
                />
                <span style={{ color: 'var(--color-text-tertiary)', fontSize: 12 }}>-</span>
                <input
                  className="form-input"
                  type="number"
                  placeholder="Do"
                  value={stage.ageRange?.max || ''}
                  onChange={(e) => updateStage(idx, 'ageMax', e.target.value)}
                  style={{ width: 60 }}
                  title="Wiek do"
                />
                <div style={{ display: 'flex', gap: 2 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => moveStage(idx, -1)} disabled={idx === 0}>
                    <ArrowUp size={14} />
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => moveStage(idx, 1)} disabled={idx === pathwayStages.length - 1}>
                    <ArrowDown size={14} />
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => removeStage(idx)} style={{ color: 'var(--color-red)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            <button className="btn btn-ghost" onClick={addStage} style={{ marginTop: 12 }}>
              <Plus size={14} /> Dodaj etap
            </button>
          </div>
        )}
      </div>

      {/* === KOD ZAPROSZENIOWY === */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header clickable" onClick={() => setInviteExpanded(!inviteExpanded)}>
          <h3 className="card-title">Kod zaproszeniowy</h3>
          {inviteExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        {inviteExpanded && (
          <div className="card-body">
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
              Trenerzy moga dolaczyc do klubu uzywajac tego kodu.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  fontFamily: 'monospace', fontSize: 20, fontWeight: 700,
                  letterSpacing: 3, padding: '10px 20px',
                  background: 'var(--color-bg-tertiary)', borderRadius: 8,
                  border: '1px solid var(--color-border)',
                }}
              >
                {inviteCode}
              </div>
              <button className="btn btn-ghost" onClick={handleCopyCode}>
                {codeCopied ? <Check size={16} /> : <Copy size={16} />}
                {codeCopied ? 'Skopiowano' : 'Kopiuj'}
              </button>
              <button className="btn btn-ghost" onClick={handleRegenerateCode}>
                <RefreshCw size={16} /> Nowy kod
              </button>
            </div>
          </div>
        )}
      </div>

      {/* === USTAWIENIA DOMYSLNE === */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header clickable" onClick={() => setDefaultsExpanded(!defaultsExpanded)}>
          <h3 className="card-title">Ustawienia domyslne</h3>
          {defaultsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        {defaultsExpanded && (
          <div className="card-body">
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Waluta</label>
                <select
                  className="form-input"
                  value={settings.defaultCurrency}
                  onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                >
                  <option value="PLN">PLN (zloty)</option>
                  <option value="EUR">EUR (euro)</option>
                  <option value="USD">USD (dolar)</option>
                  <option value="GBP">GBP (funt)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Strefa czasowa</label>
                <select
                  className="form-input"
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                >
                  <option value="Europe/Warsaw">Europa/Warszawa</option>
                  <option value="Europe/London">Europa/Londyn</option>
                  <option value="Europe/Berlin">Europa/Berlin</option>
                  <option value="Europe/Paris">Europa/Paryz</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Jezyk</label>
                <select
                  className="form-input"
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                >
                  <option value="pl">Polski</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
