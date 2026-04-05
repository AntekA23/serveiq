import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Users,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit3,
  X,
  Calendar,
  Clock,
  User,
  Shield,
} from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import useToast from '../../hooks/useToast'

// ─── Constants ───────────────────────────────────────────────────────

const PATHWAY_LABELS = {
  beginner: 'Beginner',
  tennis10_red: 'Tennis10 Red',
  tennis10_orange: 'Tennis10 Orange',
  tennis10_green: 'Tennis10 Green',
  committed: 'Committed',
  advanced: 'Advanced',
  performance: 'Performance',
}

const PATHWAY_COLORS = {
  beginner: '#22c55e',
  tennis10_red: '#ef4444',
  tennis10_orange: '#f97316',
  tennis10_green: '#10b981',
  committed: '#3b82f6',
  advanced: '#8b5cf6',
  performance: '#ec4899',
}

const DAY_LABELS = ['Nd', 'Pn', 'Wt', 'Sr', 'Cz', 'Pt', 'So']
const DAY_LABELS_FULL = ['Niedziela', 'Poniedzialek', 'Wtorek', 'Sroda', 'Czwartek', 'Piatek', 'Sobota']

const SURFACE_LABELS = {
  clay: 'Maczka',
  hard: 'Twarda',
  grass: 'Trawa',
  carpet: 'Dywan',
  'indoor-hard': 'Hala',
}

// ─── Styles ──────────────────────────────────────────────────────────

const pageStyle = { padding: '0 0 2rem' }

const headerRow = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 20,
  flexWrap: 'wrap',
  gap: 12,
}

const pageTitleStyle = {
  fontSize: 22,
  fontWeight: 700,
  margin: 0,
  color: 'var(--color-text)',
}

const addBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 16px',
  background: 'var(--color-accent)',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
}

const cardStyle = (pathColor) => ({
  background: 'var(--color-bg-secondary)',
  border: '1px solid var(--color-border-md)',
  borderLeft: `4px solid ${pathColor || 'var(--color-accent)'}`,
  borderRadius: 12,
  marginBottom: 12,
  overflow: 'hidden',
  transition: 'box-shadow 0.15s',
})

const cardHeader = {
  padding: '14px 18px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
}

const cardHeaderLeft = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  flex: 1,
  minWidth: 0,
}

const cardTitleRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
}

const cardTitle = {
  fontSize: 15,
  fontWeight: 600,
  color: 'var(--color-text)',
  margin: 0,
}

const badge = (bg, color) => ({
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 20,
  fontSize: 11,
  fontWeight: 600,
  background: bg,
  color: color,
  whiteSpace: 'nowrap',
})

const metaRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  flexWrap: 'wrap',
  fontSize: 13,
  color: 'var(--color-text-secondary)',
}

const metaItem = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
}

const expandedSection = {
  padding: '0 18px 18px',
  borderTop: '1px solid var(--color-border)',
}

const detailGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: 14,
  marginTop: 14,
}

const detailItem = { fontSize: 13 }

const detailLabel = {
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  marginBottom: 2,
  fontSize: 12,
}

const detailValue = { color: 'var(--color-text)' }

const playerListStyle = {
  marginTop: 14,
}

const playerRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 0',
  borderBottom: '1px solid var(--color-border)',
  fontSize: 14,
  color: 'var(--color-text)',
}

const playerAvatar = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  background: 'var(--color-accent-muted, rgba(59,130,246,0.1))',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-accent)',
  overflow: 'hidden',
}

const actionRow = {
  display: 'flex',
  gap: 8,
  marginTop: 16,
  flexWrap: 'wrap',
}

const actionBtn = (bg, color) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '7px 14px',
  border: 'none',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  background: bg,
  color: color,
})

const emptyState = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '60px 20px',
  color: 'var(--color-text-tertiary)',
  textAlign: 'center',
}

const loadingStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '60px 20px',
  color: 'var(--color-text-tertiary)',
  fontSize: 14,
}

// ─── Modal Styles ───────────────────────────────────────────────────

const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(6px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  animation: 'fadeIn 0.2s ease',
}

const modal = {
  background: 'var(--color-bg-secondary)',
  border: '1px solid var(--color-border-md)',
  borderRadius: 'var(--radius-lg, 12px)',
  width: '90%',
  maxWidth: 540,
  maxHeight: '85vh',
  overflowY: 'auto',
  boxShadow: 'var(--shadow-modal, 0 8px 32px rgba(0,0,0,0.3))',
}

const modalHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '18px 22px',
  borderBottom: '1px solid var(--color-border)',
}

const modalTitle = {
  fontFamily: "'Bebas Neue', sans-serif",
  fontSize: 20,
  fontWeight: 400,
  letterSpacing: '0.8px',
  textTransform: 'uppercase',
  margin: 0,
}

const modalBody = { padding: 22 }

const fieldGroup = { marginBottom: 16 }

const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  marginBottom: 6,
}

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border-md)',
  borderRadius: 8,
  fontSize: 14,
  color: 'var(--color-text)',
  outline: 'none',
  boxSizing: 'border-box',
}

const selectStyle = { ...inputStyle, cursor: 'pointer' }

const textareaStyle = { ...inputStyle, minHeight: 70, resize: 'vertical' }

const rowStyle = { display: 'flex', gap: 12 }

const halfStyle = { flex: 1, minWidth: 0 }

const modalFooter = {
  padding: '14px 22px',
  borderTop: '1px solid var(--color-border)',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
}

const btnBase = {
  padding: '8px 18px',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  border: 'none',
}

const btnCancel = {
  ...btnBase,
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border-md)',
  color: 'var(--color-text-secondary)',
}

const btnPrimary = {
  ...btnBase,
  background: 'var(--color-accent)',
  color: '#fff',
}

const multiSelectContainer = {
  border: '1px solid var(--color-border-md)',
  borderRadius: 8,
  background: 'var(--color-bg)',
  maxHeight: 160,
  overflowY: 'auto',
  padding: 4,
}

const multiSelectOption = (selected) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 10px',
  borderRadius: 6,
  cursor: 'pointer',
  background: selected ? 'var(--color-accent-muted, rgba(59,130,246,0.1))' : 'transparent',
  fontSize: 13,
  color: selected ? 'var(--color-accent)' : 'var(--color-text)',
  fontWeight: selected ? 600 : 400,
  transition: 'background 0.1s',
})

const dayToggle = (active) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  borderRadius: 8,
  border: active ? '2px solid var(--color-accent)' : '1px solid var(--color-border-md)',
  background: active ? 'var(--color-accent-muted, rgba(59,130,246,0.1))' : 'var(--color-bg)',
  color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s',
})

// ─── Helpers ─────────────────────────────────────────────────────────

function formatSchedule(schedule) {
  if (!schedule) return null
  const parts = []
  if (schedule.dayOfWeek && schedule.dayOfWeek.length > 0) {
    parts.push(schedule.dayOfWeek.map((d) => DAY_LABELS[d]).join(', '))
  }
  if (schedule.startTime && schedule.endTime) {
    parts.push(`${schedule.startTime} - ${schedule.endTime}`)
  } else if (schedule.startTime) {
    parts.push(schedule.startTime)
  }
  return parts.length > 0 ? parts.join(' | ') : null
}

function getInitials(firstName, lastName) {
  return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase()
}

// ─── GroupForm Modal ─────────────────────────────────────────────────

function GroupForm({ group, onClose, onSaved, clubId }) {
  const [name, setName] = useState(group?.name || '')
  const [description, setDescription] = useState(group?.description || '')
  const [coachId, setCoachId] = useState(
    group?.coach?._id || group?.coach || ''
  )
  const [pathwayStage, setPathwayStage] = useState(group?.pathwayStage || '')
  const [maxPlayers, setMaxPlayers] = useState(group?.maxPlayers || '')
  const [selectedPlayers, setSelectedPlayers] = useState(
    (group?.players || []).map((p) => (typeof p === 'string' ? p : p._id))
  )
  const [scheduleDays, setScheduleDays] = useState(
    group?.schedule?.dayOfWeek || []
  )
  const [startTime, setStartTime] = useState(group?.schedule?.startTime || '')
  const [endTime, setEndTime] = useState(group?.schedule?.endTime || '')
  const [surface, setSurface] = useState(group?.schedule?.surface || '')

  const [allPlayers, setAllPlayers] = useState([])
  const [allCoaches, setAllCoaches] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [playerSearch, setPlayerSearch] = useState('')

  useEffect(() => {
    // Fetch players
    api
      .get('/players')
      .then(({ data }) => {
        const list = data.players || data || []
        setAllPlayers(Array.isArray(list) ? list : [])
      })
      .catch(() => {})

    // Fetch coaches - filter users by role, or get from club members
    // The groups controller accepts any User ID for coach
    // We'll look for coaches via players endpoint which returns coach data
    if (clubId) {
      api
        .get(`/clubs/${clubId}`)
        .then(({ data }) => {
          const club = data.club || data
          const coaches = club?.coaches || club?.members?.filter((m) => m.role === 'coach') || []
          setAllCoaches(coaches)
        })
        .catch(() => {})
    }
  }, [clubId])

  const toggleDay = (day) => {
    setScheduleDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  const togglePlayer = (pid) => {
    setSelectedPlayers((prev) =>
      prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid]
    )
  }

  const filteredPlayers = allPlayers.filter((p) => {
    if (!playerSearch) return true
    const full = `${p.firstName} ${p.lastName}`.toLowerCase()
    return full.includes(playerSearch.toLowerCase())
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Nazwa grupy jest wymagana')
      return
    }

    setSaving(true)
    setError('')

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      coach: coachId || undefined,
      pathwayStage: pathwayStage || undefined,
      maxPlayers: maxPlayers ? Number(maxPlayers) : undefined,
      players: selectedPlayers,
      schedule: {
        dayOfWeek: scheduleDays,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        surface: surface || undefined,
      },
    }

    if (!group) {
      payload.club = clubId
    }

    try {
      if (group) {
        await api.put(`/groups/${group._id}`, payload)
      } else {
        await api.post('/groups', payload)
      }
      onSaved()
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        'Nie udalo sie zapisac grupy'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeader}>
          <h2 style={modalTitle}>{group ? 'Edytuj grupe' : 'Nowa grupa'}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={modalBody}>
            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  background: 'rgba(239,68,68,0.08)',
                  color: '#ef4444',
                  borderRadius: 8,
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {error}
              </div>
            )}

            {/* Name */}
            <div style={fieldGroup}>
              <label style={labelStyle}>Nazwa grupy *</label>
              <input
                style={inputStyle}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. Tennis10 Red Poniedzialek"
              />
            </div>

            {/* Description */}
            <div style={fieldGroup}>
              <label style={labelStyle}>Opis</label>
              <textarea
                style={textareaStyle}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Opis grupy..."
              />
            </div>

            {/* Coach + PathwayStage */}
            <div style={rowStyle}>
              <div style={{ ...halfStyle, ...fieldGroup }}>
                <label style={labelStyle}>Trener</label>
                <select
                  style={selectStyle}
                  value={coachId}
                  onChange={(e) => setCoachId(e.target.value)}
                >
                  <option value="">-- Wybierz --</option>
                  {allCoaches.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.firstName} {c.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ ...halfStyle, ...fieldGroup }}>
                <label style={labelStyle}>Etap sciezki</label>
                <select
                  style={selectStyle}
                  value={pathwayStage}
                  onChange={(e) => setPathwayStage(e.target.value)}
                >
                  <option value="">-- Wybierz --</option>
                  {Object.entries(PATHWAY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Max players */}
            <div style={fieldGroup}>
              <label style={labelStyle}>Maks. graczy</label>
              <input
                type="number"
                min={1}
                style={{ ...inputStyle, width: 120 }}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(e.target.value)}
                placeholder="np. 8"
              />
            </div>

            {/* Schedule */}
            <div style={fieldGroup}>
              <label style={labelStyle}>Harmonogram</label>
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  marginBottom: 10,
                  flexWrap: 'wrap',
                }}
              >
                {DAY_LABELS.map((label, idx) => (
                  <button
                    key={idx}
                    type="button"
                    style={dayToggle(scheduleDays.includes(idx))}
                    onClick={() => toggleDay(idx)}
                    title={DAY_LABELS_FULL[idx]}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div style={rowStyle}>
                <div style={halfStyle}>
                  <label style={{ ...labelStyle, fontSize: 12 }}>Od</label>
                  <input
                    type="time"
                    style={inputStyle}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div style={halfStyle}>
                  <label style={{ ...labelStyle, fontSize: 12 }}>Do</label>
                  <input
                    type="time"
                    style={inputStyle}
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ ...fieldGroup, marginTop: 10 }}>
                <label style={{ ...labelStyle, fontSize: 12 }}>
                  Nawierzchnia
                </label>
                <select
                  style={selectStyle}
                  value={surface}
                  onChange={(e) => setSurface(e.target.value)}
                >
                  <option value="">-- Nie wybrano --</option>
                  {Object.entries(SURFACE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Players multi-select */}
            <div style={fieldGroup}>
              <label style={labelStyle}>
                Zawodnicy ({selectedPlayers.length} wybranych)
              </label>
              <input
                style={{ ...inputStyle, marginBottom: 6 }}
                placeholder="Szukaj zawodnika..."
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
              />
              <div style={multiSelectContainer}>
                {filteredPlayers.length === 0 && (
                  <div
                    style={{
                      padding: '12px 10px',
                      fontSize: 13,
                      color: 'var(--color-text-tertiary)',
                      textAlign: 'center',
                    }}
                  >
                    {allPlayers.length === 0
                      ? 'Brak dostepnych zawodnikow'
                      : 'Brak wynikow'}
                  </div>
                )}
                {filteredPlayers.map((p) => {
                  const pid = p._id
                  const isSelected = selectedPlayers.includes(pid)
                  return (
                    <div
                      key={pid}
                      style={multiSelectOption(isSelected)}
                      onClick={() => togglePlayer(pid)}
                    >
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 4,
                          border: isSelected
                            ? '2px solid var(--color-accent)'
                            : '1px solid var(--color-border-md)',
                          background: isSelected
                            ? 'var(--color-accent)'
                            : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {isSelected && (
                          <span
                            style={{
                              color: '#fff',
                              fontSize: 11,
                              lineHeight: 1,
                            }}
                          >
                            &#10003;
                          </span>
                        )}
                      </div>
                      {p.firstName} {p.lastName}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div style={modalFooter}>
            <button type="button" style={btnCancel} onClick={onClose}>
              Anuluj
            </button>
            <button
              type="submit"
              style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}
              disabled={saving}
            >
              {saving
                ? 'Zapisywanie...'
                : group
                ? 'Zapisz zmiany'
                : 'Utworz grupe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────

export default function Groups() {
  const user = useAuthStore((s) => s.user)
  const toast = useToast()
  const isCoach = user?.role === 'coach'
  const isClubAdmin = user?.role === 'clubAdmin'
  const isParent = user?.role === 'parent'
  const canEdit = isCoach || isClubAdmin

  const clubId =
    typeof user?.club === 'string'
      ? user.club
      : user?.club?._id || user?.club || ''

  // State
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [deleting, setDeleting] = useState(null)

  // Fetch groups
  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams()
      if (clubId) params.set('club', clubId)
      const qs = params.toString()
      const { data } = await api.get(`/groups${qs ? `?${qs}` : ''}`)
      let list = data.groups || []

      // Parent: filter to only groups containing their children
      if (isParent && user?.parentProfile?.children) {
        const childIds = user.parentProfile.children.map((c) =>
          typeof c === 'string' ? c : c._id
        )
        list = list.filter((g) =>
          g.players?.some((p) => {
            const pid = typeof p === 'string' ? p : p._id
            return childIds.includes(pid)
          })
        )
      }

      setGroups(list)
    } catch {
      setError('Nie udalo sie zaladowac grup')
    } finally {
      setLoading(false)
    }
  }, [clubId, isParent, user?.parentProfile?.children])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  // Handlers
  const handleExpand = (group) => {
    setExpandedId(expandedId === group._id ? null : group._id)
  }

  const handleDelete = async (groupId) => {
    if (!window.confirm('Czy na pewno chcesz usunac te grupe?')) return
    setDeleting(groupId)
    try {
      await api.delete(`/groups/${groupId}`)
      toast.success('Grupa usunieta')
      setExpandedId(null)
      fetchGroups()
    } catch {
      toast.error('Nie udalo sie usunac grupy')
    } finally {
      setDeleting(null)
    }
  }

  const handleEdit = (group) => {
    setEditingGroup(group)
    setShowForm(true)
  }

  const handleFormSaved = () => {
    toast.success(editingGroup ? 'Grupa zaktualizowana' : 'Grupa utworzona')
    setShowForm(false)
    setEditingGroup(null)
    setExpandedId(null)
    fetchGroups()
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingGroup(null)
  }

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerRow}>
        <h1 style={pageTitleStyle}>Grupy</h1>
        {canEdit && (
          <button
            style={addBtn}
            onClick={() => {
              setEditingGroup(null)
              setShowForm(true)
            }}
          >
            <Plus size={16} /> Nowa grupa
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && <div style={loadingStyle}>Ladowanie grup...</div>}

      {/* Error */}
      {!loading && error && (
        <div style={{ ...emptyState, color: '#ef4444' }}>
          <p>{error}</p>
          <button
            onClick={fetchGroups}
            style={{
              ...addBtn,
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border-md)',
              marginTop: 12,
            }}
          >
            Sprobuj ponownie
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && groups.length === 0 && (
        <div style={emptyState}>
          <Users
            size={40}
            style={{ marginBottom: 12, opacity: 0.5 }}
          />
          <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>
            {isParent
              ? 'Twoje dziecko nie nalezy jeszcze do zadnej grupy'
              : 'Brak grup'}
          </p>
          <p style={{ fontSize: 13, margin: 0 }}>
            {isParent
              ? 'Grupy pojawia sie tutaj, gdy trener doda Twoje dziecko.'
              : 'Kliknij "Nowa grupa" aby utworzyc pierwsza.'}
          </p>
          {canEdit && (
            <button
              style={{ ...addBtn, marginTop: 16 }}
              onClick={() => {
                setEditingGroup(null)
                setShowForm(true)
              }}
            >
              <Plus size={16} /> Dodaj pierwsza grupe
            </button>
          )}
        </div>
      )}

      {/* Group list */}
      {!loading &&
        !error &&
        groups.map((group) => {
          const pathColor =
            PATHWAY_COLORS[group.pathwayStage] || 'var(--color-accent)'
          const isExpanded = expandedId === group._id
          const schedule = formatSchedule(group.schedule)
          const playerCount = group.players?.length || 0
          const coachName = group.coach
            ? `${group.coach.firstName} ${group.coach.lastName}`
            : null

          return (
            <div key={group._id} style={cardStyle(pathColor)}>
              {/* Card header */}
              <div style={cardHeader} onClick={() => handleExpand(group)}>
                <div style={cardHeaderLeft}>
                  <div style={cardTitleRow}>
                    <h3 style={cardTitle}>{group.name}</h3>
                    {group.pathwayStage && (
                      <span
                        style={badge(
                          `${pathColor}18`,
                          pathColor
                        )}
                      >
                        {PATHWAY_LABELS[group.pathwayStage] ||
                          group.pathwayStage}
                      </span>
                    )}
                  </div>
                  <div style={metaRow}>
                    {coachName && (
                      <span style={metaItem}>
                        <User size={13} />
                        {coachName}
                      </span>
                    )}
                    <span style={metaItem}>
                      <Users size={13} />
                      {playerCount}
                      {group.maxPlayers
                        ? `/${group.maxPlayers}`
                        : ''}{' '}
                      zawodnikow
                    </span>
                    {schedule && (
                      <span style={metaItem}>
                        <Calendar size={13} />
                        {schedule}
                      </span>
                    )}
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp
                    size={18}
                    style={{
                      color: 'var(--color-text-tertiary)',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <ChevronDown
                    size={18}
                    style={{
                      color: 'var(--color-text-tertiary)',
                      flexShrink: 0,
                    }}
                  />
                )}
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div style={expandedSection}>
                  {/* Description */}
                  {group.description && (
                    <div
                      style={{
                        marginTop: 14,
                        padding: '10px 14px',
                        background: 'var(--color-bg)',
                        borderRadius: 8,
                        fontSize: 13,
                        color: 'var(--color-text)',
                        lineHeight: 1.5,
                      }}
                    >
                      {group.description}
                    </div>
                  )}

                  {/* Schedule details */}
                  <div style={detailGrid}>
                    {group.schedule?.dayOfWeek?.length > 0 && (
                      <div style={detailItem}>
                        <div style={detailLabel}>Dni treningow</div>
                        <div style={detailValue}>
                          {group.schedule.dayOfWeek
                            .map((d) => DAY_LABELS_FULL[d])
                            .join(', ')}
                        </div>
                      </div>
                    )}
                    {(group.schedule?.startTime || group.schedule?.endTime) && (
                      <div style={detailItem}>
                        <div style={detailLabel}>Godziny</div>
                        <div
                          style={{
                            ...detailValue,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Clock size={13} />
                          {group.schedule.startTime || '?'} -{' '}
                          {group.schedule.endTime || '?'}
                        </div>
                      </div>
                    )}
                    {group.schedule?.surface && (
                      <div style={detailItem}>
                        <div style={detailLabel}>Nawierzchnia</div>
                        <div style={detailValue}>
                          {SURFACE_LABELS[group.schedule.surface] ||
                            group.schedule.surface}
                        </div>
                      </div>
                    )}
                    {group.maxPlayers && (
                      <div style={detailItem}>
                        <div style={detailLabel}>Limit miejsc</div>
                        <div style={detailValue}>
                          {playerCount}/{group.maxPlayers}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Player list */}
                  <div style={playerListStyle}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        marginBottom: 8,
                        color: 'var(--color-text)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Shield size={14} />
                      Zawodnicy ({playerCount})
                    </div>
                    {(!group.players || group.players.length === 0) && (
                      <div
                        style={{
                          fontSize: 13,
                          color: 'var(--color-text-tertiary)',
                          padding: '8px 0',
                        }}
                      >
                        Brak zawodnikow w grupie
                      </div>
                    )}
                    {group.players?.map((p) => {
                      if (typeof p === 'string') {
                        return (
                          <div key={p} style={playerRow}>
                            <div style={playerAvatar}>?</div>
                            <span>{p}</span>
                          </div>
                        )
                      }
                      return (
                        <div key={p._id} style={playerRow}>
                          <div style={playerAvatar}>
                            {p.avatarUrl ? (
                              <img
                                src={p.avatarUrl}
                                alt=""
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  borderRadius: '50%',
                                }}
                              />
                            ) : (
                              getInitials(p.firstName, p.lastName)
                            )}
                          </div>
                          <span style={{ flex: 1 }}>
                            {p.firstName} {p.lastName}
                          </span>
                          {!isParent && p.pathwayStage && (
                            <span
                              style={badge(
                                `${
                                  PATHWAY_COLORS[p.pathwayStage] || '#6b7280'
                                }18`,
                                PATHWAY_COLORS[p.pathwayStage] || '#6b7280'
                              )}
                            >
                              {PATHWAY_LABELS[p.pathwayStage] ||
                                p.pathwayStage}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Coach/Admin actions */}
                  {canEdit && (
                    <div style={actionRow}>
                      <button
                        onClick={() => handleEdit(group)}
                        style={actionBtn(
                          'var(--color-bg)',
                          'var(--color-accent)'
                        )}
                      >
                        <Edit3 size={14} /> Edytuj
                      </button>
                      <button
                        onClick={() => handleDelete(group._id)}
                        disabled={deleting === group._id}
                        style={{
                          ...actionBtn('rgba(239,68,68,0.08)', '#ef4444'),
                          opacity: deleting === group._id ? 0.6 : 1,
                        }}
                      >
                        <Trash2 size={14} />
                        {deleting === group._id ? 'Usuwanie...' : 'Usun'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

      {/* Group form modal */}
      {showForm && (
        <GroupForm
          group={editingGroup}
          clubId={clubId}
          onClose={handleFormClose}
          onSaved={handleFormSaved}
        />
      )}
    </div>
  )
}
