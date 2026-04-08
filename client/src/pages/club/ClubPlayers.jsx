import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Loader2, Search, Filter, User, UserMinus, UserPlus,
  ChevronDown, ArrowUpDown,
} from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import Avatar from '../../components/ui/Avatar'
import '../../components/ui/Modal/Modal.css'

const STATUS_LABELS = {
  active: { label: 'Aktywny', color: 'var(--color-green)' },
  inactive: { label: 'Nieaktywny', color: 'var(--color-red)' },
  new: { label: 'Nowy', color: 'var(--color-accent)' },
}

function getAge(dob) {
  if (!dob) return '?'
  const diff = Date.now() - new Date(dob).getTime()
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
}

export default function ClubPlayers() {
  const user = useAuthStore((s) => s.user)
  const clubId = user?.club && typeof user.club === 'object' ? user.club._id : user?.club
  const navigate = useNavigate()

  const [players, setPlayers] = useState([])
  const [coaches, setCoaches] = useState([])
  const [pathwayStages, setPathwayStages] = useState([])
  const [loading, setLoading] = useState(true)

  // Filtry
  const [search, setSearch] = useState('')
  const [filterCoach, setFilterCoach] = useState('')
  const [filterStage, setFilterStage] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sort, setSort] = useState('name')
  const [showFilters, setShowFilters] = useState(false)

  // Modal
  const [actionPlayer, setActionPlayer] = useState(null)
  const [actionType, setActionType] = useState(null) // 'coach' | 'stage'
  const [actionValue, setActionValue] = useState('')
  const [actionSaving, setActionSaving] = useState(false)

  useEffect(() => {
    if (!clubId) { setLoading(false); return }
    fetchData()
  }, [clubId])

  const fetchData = async () => {
    try {
      const [playersRes, coachesRes, settingsRes] = await Promise.all([
        api.get(`/clubs/${clubId}/players`),
        api.get(`/clubs/${clubId}/coaches`),
        api.get(`/clubs/${clubId}/settings`),
      ])
      setPlayers(playersRes.data.players || [])
      setCoaches(coachesRes.data.coaches || [])
      setPathwayStages(settingsRes.data.settings?.pathwayStages || [])
    } catch (err) {
      console.error('Blad ladowania:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = players.filter((p) => {
    if (search) {
      const q = search.toLowerCase()
      if (!`${p.firstName} ${p.lastName}`.toLowerCase().includes(q)) return false
    }
    if (filterCoach && !(p.coaches || []).some((c) => c._id === filterCoach)) return false
    if (filterStage && p.pathwayStage !== filterStage) return false
    if (filterStatus && p.playerStatus !== filterStatus) return false
    return true
  }).sort((a, b) => {
    if (sort === 'name') return `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`)
    if (sort === 'recent') return new Date(b.updatedAt) - new Date(a.updatedAt)
    if (sort === 'stage') return (a.pathwayStage || '').localeCompare(b.pathwayStage || '')
    return 0
  })

  const handleAssignCoach = async () => {
    if (!actionPlayer) return
    setActionSaving(true)
    try {
      await api.put(`/clubs/${clubId}/players/${actionPlayer._id}/assign-coach`, { coachId: actionValue || null })
      await fetchData()
      setActionPlayer(null)
      setActionType(null)
    } catch (err) {
      console.error('Blad przypisywania:', err)
    } finally {
      setActionSaving(false)
    }
  }

  const handleChangeStage = async () => {
    if (!actionPlayer) return
    setActionSaving(true)
    try {
      await api.put(`/clubs/${clubId}/players/${actionPlayer._id}/pathway-stage`, { stage: actionValue })
      await fetchData()
      setActionPlayer(null)
      setActionType(null)
    } catch (err) {
      console.error('Blad zmiany etapu:', err)
    } finally {
      setActionSaving(false)
    }
  }

  const handleToggleActive = async (player) => {
    try {
      const endpoint = player.active
        ? `/clubs/${clubId}/players/${player._id}/deactivate`
        : `/clubs/${clubId}/players/${player._id}/activate`
      await api.put(endpoint)
      await fetchData()
    } catch (err) {
      console.error('Blad zmiany statusu:', err)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Loader2 size={32} className="spin" />
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Zawodnicy klubu</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {filtered.length} z {players.length}
          </span>
        </div>
      </div>

      {/* Szukaj + filtry */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input
            className="form-input"
            placeholder="Szukaj zawodnika..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>
        <button
          className={`btn ${showFilters ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={14} /> Filtry
        </button>
        <select className="form-input" value={sort} onChange={(e) => setSort(e.target.value)} style={{ width: 'auto' }}>
          <option value="name">Nazwisko</option>
          <option value="recent">Ostatnia aktywnosc</option>
          <option value="stage">Etap</option>
        </select>
      </div>

      {showFilters && (
        <div className="card" style={{ marginBottom: 16, padding: 16 }}>
          <div className="form-grid-2" style={{ gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Trener</label>
              <select className="form-input" value={filterCoach} onChange={(e) => setFilterCoach(e.target.value)}>
                <option value="">Wszyscy</option>
                {coaches.map((c) => (
                  <option key={c._id} value={c._id}>{c.firstName} {c.lastName}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Etap sciezki</label>
              <select className="form-input" value={filterStage} onChange={(e) => setFilterStage(e.target.value)}>
                <option value="">Wszystkie</option>
                {pathwayStages.map((s) => (
                  <option key={s.name} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">Wszystkie</option>
                <option value="active">Aktywny</option>
                <option value="inactive">Nieaktywny</option>
                <option value="new">Nowy</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 && (
          <div className="page-empty">Brak zawodnikow</div>
        )}
        {filtered.map((p) => {
          const statusInfo = STATUS_LABELS[p.playerStatus] || STATUS_LABELS.active
          const coachNames = (p.coaches || []).map((c) => `${c.firstName} ${c.lastName}`).join(', ')
          const stageObj = pathwayStages.find((s) => s.name === p.pathwayStage)

          return (
            <div
              key={p._id}
              className="card"
              style={{
                padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                cursor: 'pointer',
                opacity: p.active === false ? 0.5 : 1,
              }}
              onClick={() => navigate(`/coach/player/${p._id}`)}
            >
              <Avatar firstName={p.firstName} lastName={p.lastName} size={40} src={p.avatarUrl} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {p.firstName} {p.lastName}
                  <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--color-text-tertiary)', marginLeft: 8 }}>
                    {getAge(p.dateOfBirth)} lat
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 2 }}>
                  {p.pathwayStage && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: stageObj?.color || 'var(--color-text-tertiary)', display: 'inline-block' }} />
                      {p.pathwayStage}
                    </span>
                  )}
                  {coachNames && <span>Trener: {coachNames}</span>}
                  {p.lastActivityDate && (
                    <span>Ost. aktywnosc: {new Date(p.lastActivityDate).toLocaleDateString('pl-PL')}</span>
                  )}
                </div>
              </div>

              {/* Status badge */}
              <span style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                padding: '3px 8px', borderRadius: 10,
                background: `${statusInfo.color}20`, color: statusInfo.color,
                letterSpacing: 0.5, flexShrink: 0,
              }}>
                {statusInfo.label}
              </span>

              {/* Akcje */}
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                <button
                  className="btn btn-ghost btn-sm"
                  title="Przypisz trenera"
                  onClick={() => { setActionPlayer(p); setActionType('coach'); setActionValue(p.coaches?.[0]?._id || '') }}
                >
                  <User size={14} />
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  title="Zmien etap"
                  onClick={() => { setActionPlayer(p); setActionType('stage'); setActionValue(p.pathwayStage || '') }}
                >
                  <ArrowUpDown size={14} />
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  title={p.active ? 'Dezaktywuj' : 'Aktywuj'}
                  onClick={() => handleToggleActive(p)}
                  style={{ color: p.active ? 'var(--color-red)' : 'var(--color-green)' }}
                >
                  {p.active ? <UserMinus size={14} /> : <UserPlus size={14} />}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal — przypisz trenera */}
      {actionPlayer && actionType === 'coach' && (
        <div className="modal-overlay" onClick={() => { setActionPlayer(null); setActionType(null) }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400, padding: 22 }}>
            <h3 style={{ marginBottom: 16 }}>
              Przypisz trenera — {actionPlayer.firstName} {actionPlayer.lastName}
            </h3>
            <div className="form-group">
              <label className="form-label">Trener</label>
              <select className="form-input" value={actionValue} onChange={(e) => setActionValue(e.target.value)}>
                <option value="">Brak trenera</option>
                {coaches.map((c) => (
                  <option key={c._id} value={c._id}>{c.firstName} {c.lastName}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => { setActionPlayer(null); setActionType(null) }}>Anuluj</button>
              <button className="btn btn-primary" onClick={handleAssignCoach} disabled={actionSaving}>
                {actionSaving ? <Loader2 size={14} className="spin" /> : null}
                Zapisz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — zmien etap */}
      {actionPlayer && actionType === 'stage' && (
        <div className="modal-overlay" onClick={() => { setActionPlayer(null); setActionType(null) }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400, padding: 22 }}>
            <h3 style={{ marginBottom: 16 }}>
              Zmien etap — {actionPlayer.firstName} {actionPlayer.lastName}
            </h3>
            <div className="form-group">
              <label className="form-label">Etap sciezki</label>
              <select className="form-input" value={actionValue} onChange={(e) => setActionValue(e.target.value)}>
                <option value="">Brak</option>
                {pathwayStages.map((s) => (
                  <option key={s.name} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => { setActionPlayer(null); setActionType(null) }}>Anuluj</button>
              <button className="btn btn-primary" onClick={handleChangeStage} disabled={actionSaving}>
                {actionSaving ? <Loader2 size={14} className="spin" /> : null}
                Zapisz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
