import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit3,
  Save,
  X,
  Activity as ActivityIcon,
  Filter,
} from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import useToast from '../../hooks/useToast'
import ActivityForm from '../../components/activities/ActivityForm'

// ─── Constants ───────────────────────────────────────────────────────

const TYPE_COLORS = {
  class: '#22c55e',
  camp: '#3b82f6',
  tournament: '#ef4444',
  training: '#eab308',
  match: '#8b5cf6',
  fitness: '#f97316',
  review: '#06b6d4',
  other: '#6b7280',
}

const TYPE_LABELS = {
  class: 'Zajecia',
  camp: 'Oboz',
  tournament: 'Turniej',
  training: 'Trening',
  match: 'Mecz',
  fitness: 'Fitness',
  review: 'Przeglad',
  other: 'Inne',
}

const STATUS_LABELS = {
  planned: 'Zaplanowane',
  'in-progress': 'W trakcie',
  completed: 'Zakonczone',
  cancelled: 'Anulowane',
}

const STATUS_COLORS = {
  planned: '#3b82f6',
  'in-progress': '#eab308',
  completed: '#22c55e',
  cancelled: '#ef4444',
}

const ATTENDANCE_OPTIONS = [
  { value: 'present', label: 'Obecny', color: '#22c55e' },
  { value: 'absent', label: 'Nieobecny', color: '#ef4444' },
  { value: 'late', label: 'Spozniony', color: '#eab308' },
  { value: 'excused', label: 'Usprawiedliwiony', color: '#8b5cf6' },
]

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
  color: '#0B0E14',
  border: 'none',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
}

const filtersRow = {
  display: 'flex',
  gap: 10,
  marginBottom: 20,
  flexWrap: 'wrap',
  alignItems: 'center',
}

const filterSelect = {
  padding: '7px 12px',
  background: 'var(--color-bg-secondary)',
  border: '1px solid var(--color-border-md)',
  borderRadius: 8,
  fontSize: 13,
  color: 'var(--color-text)',
  cursor: 'pointer',
  outline: 'none',
}

const filterInput = {
  padding: '7px 12px',
  background: 'var(--color-bg-secondary)',
  border: '1px solid var(--color-border-md)',
  borderRadius: 8,
  fontSize: 13,
  color: 'var(--color-text)',
  outline: 'none',
  width: 150,
}

const cardStyle = (typeColor) => ({
  background: 'var(--color-bg-secondary)',
  border: '1px solid var(--color-border-md)',
  borderLeft: `4px solid ${typeColor}`,
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

const detailItem = {
  fontSize: 13,
}

const detailLabel = {
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  marginBottom: 2,
  fontSize: 12,
}

const detailValue = {
  color: 'var(--color-text)',
}

const notesBlock = {
  marginTop: 14,
  padding: '10px 14px',
  background: 'var(--color-bg)',
  borderRadius: 8,
  fontSize: 13,
  color: 'var(--color-text)',
  lineHeight: 1.5,
}

const attendanceSection = {
  marginTop: 18,
}

const attendanceTitle = {
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 10,
  color: 'var(--color-text)',
}

const attendanceRow = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 0',
  borderBottom: '1px solid var(--color-border)',
  gap: 8,
}

const attendancePlayerName = {
  fontSize: 14,
  fontWeight: 500,
  color: 'var(--color-text)',
  flex: 1,
  minWidth: 0,
}

const attendanceSelect = {
  padding: '4px 8px',
  borderRadius: 6,
  border: '1px solid var(--color-border-md)',
  background: 'var(--color-bg)',
  fontSize: 12,
  color: 'var(--color-text)',
  cursor: 'pointer',
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

// ─── Helpers ─────────────────────────────────────────────────────────

function formatDate(d) {
  return new Date(d).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(start, end) {
  if (!start && !end) return null
  if (start && end) return `${start} - ${end}`
  return start || end
}

function playerNames(players) {
  if (!players || players.length === 0) return null
  if (players.length <= 3) {
    return players.map((p) => `${p.firstName} ${p.lastName}`).join(', ')
  }
  return `${players.length} zawodnikow`
}

function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// ─── Component ───────────────────────────────────────────────────────

export default function Activities() {
  const user = useAuthStore((s) => s.user)
  const toast = useToast()
  const isCoach = user?.role === 'coach'
  const isClubAdmin = user?.role === 'clubAdmin'
  const isParent = user?.role === 'parent'
  const canEdit = isCoach || isClubAdmin

  // State
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterMonth, setFilterMonth] = useState(getCurrentMonth())
  const [filterStatus, setFilterStatus] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingActivity, setEditingActivity] = useState(null)
  const [attendance, setAttendance] = useState({})
  const [savingAttendance, setSavingAttendance] = useState(false)
  const [deleting, setDeleting] = useState(null)

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams()
      if (filterType) params.set('type', filterType)
      if (filterMonth) params.set('month', filterMonth)
      const qs = params.toString()
      const { data } = await api.get(`/activities${qs ? `?${qs}` : ''}`)
      let list = data.activities || []

      // Client-side status filter
      if (filterStatus) {
        list = list.filter((a) => a.status === filterStatus)
      }

      setActivities(list)
    } catch (err) {
      setError('Nie udalo sie zaladowac aktywnosci')
    } finally {
      setLoading(false)
    }
  }, [filterType, filterMonth, filterStatus])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  // Initialize attendance state when expanding
  const handleExpand = (act) => {
    if (expandedId === act._id) {
      setExpandedId(null)
      return
    }
    setExpandedId(act._id)

    // Build attendance map from existing data
    const map = {}
    if (act.attendance && act.attendance.length > 0) {
      act.attendance.forEach((a) => {
        const pid = typeof a.player === 'string' ? a.player : a.player?._id
        if (pid) map[pid] = a.status
      })
    }
    // Ensure all players have a status
    if (act.players) {
      act.players.forEach((p) => {
        const pid = typeof p === 'string' ? p : p._id
        if (pid && !map[pid]) map[pid] = 'present'
      })
    }
    setAttendance(map)
  }

  const handleAttendanceChange = (playerId, status) => {
    setAttendance((prev) => ({ ...prev, [playerId]: status }))
  }

  const handleSaveAttendance = async (actId) => {
    setSavingAttendance(true)
    try {
      const payload = {
        attendance: Object.entries(attendance).map(([player, status]) => ({
          player,
          status,
        })),
      }
      await api.put(`/activities/${actId}/attendance`, payload)
      toast.success('Frekwencja zapisana')
      fetchActivities()
    } catch {
      toast.error('Nie udalo sie zapisac frekwencji')
    } finally {
      setSavingAttendance(false)
    }
  }

  const handleDelete = async (actId) => {
    if (!window.confirm('Czy na pewno chcesz usunac te aktywnosc?')) return
    setDeleting(actId)
    try {
      await api.delete(`/activities/${actId}`)
      toast.success('Aktywnosc usunieta')
      setExpandedId(null)
      fetchActivities()
    } catch {
      toast.error('Nie udalo sie usunac aktywnosci')
    } finally {
      setDeleting(null)
    }
  }

  const handleEdit = (act) => {
    setEditingActivity(act)
    setShowForm(true)
  }

  const handleFormSaved = () => {
    toast.success(editingActivity ? 'Aktywnosc zaktualizowana' : 'Aktywnosc dodana')
    setShowForm(false)
    setEditingActivity(null)
    setExpandedId(null)
    fetchActivities()
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingActivity(null)
  }

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerRow}>
        <h1 style={pageTitleStyle}>Aktywnosci</h1>
        {canEdit && (
          <button style={addBtn} onClick={() => { setEditingActivity(null); setShowForm(true) }}>
            <Plus size={16} /> Nowa aktywnosc
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={filtersRow}>
        <Filter size={14} style={{ color: 'var(--color-text-tertiary)' }} />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={filterSelect}>
          <option value="">Wszystkie typy</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          style={filterInput}
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={filterSelect}>
          <option value="">Wszystkie statusy</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading && <div style={loadingStyle}>Ladowanie aktywnosci...</div>}

      {/* Error */}
      {!loading && error && (
        <div style={{ ...emptyState, color: '#ef4444' }}>
          <p>{error}</p>
          <button onClick={fetchActivities} style={{ ...addBtn, background: 'var(--color-bg-secondary)', color: 'var(--color-text)', border: '1px solid var(--color-border-md)', marginTop: 12 }}>
            Sprobuj ponownie
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && activities.length === 0 && (
        <div style={emptyState}>
          <ActivityIcon size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
          <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>
            {isParent ? 'Brak aktywnosci dla Twojego dziecka' : 'Brak aktywnosci'}
          </p>
          <p style={{ fontSize: 13, margin: 0 }}>
            {isParent
              ? 'Aktywnosci pojawia sie tutaj, gdy trener je doda.'
              : 'Kliknij "Nowa aktywnosc" aby dodac pierwsza.'}
          </p>
          {canEdit && (
            <button style={{ ...addBtn, marginTop: 16 }} onClick={() => { setEditingActivity(null); setShowForm(true) }}>
              <Plus size={16} /> Dodaj pierwsza aktywnosc
            </button>
          )}
        </div>
      )}

      {/* Activity list */}
      {!loading && !error && activities.map((act) => {
        const typeColor = TYPE_COLORS[act.type] || TYPE_COLORS.other
        const statusColor = STATUS_COLORS[act.status] || '#6b7280'
        const isExpanded = expandedId === act._id
        const time = formatTime(act.startTime, act.endTime)
        const names = playerNames(act.players)

        return (
          <div key={act._id} style={cardStyle(typeColor)}>
            {/* Card header (always visible) */}
            <div style={cardHeader} onClick={() => handleExpand(act)}>
              <div style={cardHeaderLeft}>
                <div style={cardTitleRow}>
                  <h3 style={cardTitle}>{act.title}</h3>
                  <span style={badge(`${typeColor}18`, typeColor)}>
                    {TYPE_LABELS[act.type] || act.type}
                  </span>
                  <span style={badge(`${statusColor}18`, statusColor)}>
                    {STATUS_LABELS[act.status] || act.status}
                  </span>
                </div>
                <div style={metaRow}>
                  <span style={metaItem}>
                    <Calendar size={13} />
                    {formatDate(act.date)}
                  </span>
                  {time && (
                    <span style={metaItem}>
                      <Clock size={13} />
                      {time}
                    </span>
                  )}
                  {act.durationMinutes && (
                    <span style={metaItem}>
                      {act.durationMinutes} min
                    </span>
                  )}
                  {names && (
                    <span style={metaItem}>
                      <Users size={13} />
                      {names}
                    </span>
                  )}
                </div>
              </div>
              {isExpanded ? <ChevronUp size={18} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} /> : <ChevronDown size={18} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />}
            </div>

            {/* Expanded detail */}
            {isExpanded && (
              <div style={expandedSection}>
                {/* Detail grid */}
                <div style={detailGrid}>
                  {act.location && (
                    <div style={detailItem}>
                      <div style={detailLabel}>Lokalizacja</div>
                      <div style={{ ...detailValue, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={13} /> {act.location}
                      </div>
                    </div>
                  )}
                  {act.surface && (
                    <div style={detailItem}>
                      <div style={detailLabel}>Nawierzchnia</div>
                      <div style={detailValue}>{SURFACE_LABELS[act.surface] || act.surface}</div>
                    </div>
                  )}
                  {act.coach && (
                    <div style={detailItem}>
                      <div style={detailLabel}>Trener</div>
                      <div style={detailValue}>
                        {act.coach.firstName} {act.coach.lastName}
                      </div>
                    </div>
                  )}
                  {act.group && (
                    <div style={detailItem}>
                      <div style={detailLabel}>Grupa</div>
                      <div style={detailValue}>{act.group.name}</div>
                    </div>
                  )}
                  {act.focusAreas && act.focusAreas.length > 0 && (
                    <div style={detailItem}>
                      <div style={detailLabel}>Obszary fokusowe</div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
                        {act.focusAreas.map((fa, i) => (
                          <span key={i} style={badge('var(--color-accent-muted, rgba(59,130,246,0.1))', 'var(--color-accent)')}>
                            {fa}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {act.type === 'tournament' && act.tournamentData && (
                    <>
                      {act.tournamentData.category && (
                        <div style={detailItem}>
                          <div style={detailLabel}>Kategoria</div>
                          <div style={detailValue}>{act.tournamentData.category}</div>
                        </div>
                      )}
                      {act.tournamentData.drawSize && (
                        <div style={detailItem}>
                          <div style={detailLabel}>Rozmiar drabinki</div>
                          <div style={detailValue}>{act.tournamentData.drawSize}</div>
                        </div>
                      )}
                      {act.tournamentData.result && (
                        <div style={detailItem}>
                          <div style={detailLabel}>Wynik</div>
                          <div style={detailValue}>
                            {act.tournamentData.result.round && `Runda: ${act.tournamentData.result.round}`}
                            {act.tournamentData.result.wins !== undefined && ` | W: ${act.tournamentData.result.wins}`}
                            {act.tournamentData.result.losses !== undefined && ` L: ${act.tournamentData.result.losses}`}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Notes */}
                {act.notes && (
                  <div style={{ marginTop: 14 }}>
                    <div style={detailLabel}>Notatki</div>
                    <div style={notesBlock}>{act.notes}</div>
                  </div>
                )}

                {/* Parent notes (visible to parents) */}
                {act.parentNotes && (
                  <div style={{ marginTop: 14 }}>
                    <div style={detailLabel}>Notatki dla rodzicow</div>
                    <div style={notesBlock}>{act.parentNotes}</div>
                  </div>
                )}

                {/* Attendance (coach/admin only) */}
                {canEdit && act.players && act.players.length > 0 && (
                  <div style={attendanceSection}>
                    <div style={attendanceTitle}>Frekwencja</div>
                    {act.players.map((p) => {
                      const pid = typeof p === 'string' ? p : p._id
                      const pName = typeof p === 'string' ? pid : `${p.firstName} ${p.lastName}`
                      const currentStatus = attendance[pid] || 'present'
                      return (
                        <div key={pid} style={attendanceRow}>
                          <span style={attendancePlayerName}>{pName}</span>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {ATTENDANCE_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleAttendanceChange(pid, opt.value)}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: 6,
                                  border: currentStatus === opt.value ? `2px solid ${opt.color}` : '1px solid var(--color-border-md)',
                                  background: currentStatus === opt.value ? `${opt.color}18` : 'var(--color-bg)',
                                  color: currentStatus === opt.value ? opt.color : 'var(--color-text-secondary)',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s',
                                }}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                    <button
                      onClick={() => handleSaveAttendance(act._id)}
                      disabled={savingAttendance}
                      style={{
                        ...actionBtn('var(--color-accent)', '#0B0E14'),
                        marginTop: 12,
                        opacity: savingAttendance ? 0.7 : 1,
                      }}
                    >
                      <Save size={14} />
                      {savingAttendance ? 'Zapisywanie...' : 'Zapisz frekwencje'}
                    </button>
                  </div>
                )}

                {/* Parent view: attendance summary (read-only) */}
                {isParent && act.attendance && act.attendance.length > 0 && (
                  <div style={attendanceSection}>
                    <div style={attendanceTitle}>Frekwencja</div>
                    {act.attendance.map((a, idx) => {
                      const pName = a.player
                        ? (typeof a.player === 'string' ? a.player : `${a.player.firstName} ${a.player.lastName}`)
                        : `Zawodnik ${idx + 1}`
                      const opt = ATTENDANCE_OPTIONS.find((o) => o.value === a.status)
                      return (
                        <div key={idx} style={attendanceRow}>
                          <span style={attendancePlayerName}>{pName}</span>
                          <span style={badge(`${opt?.color || '#6b7280'}18`, opt?.color || '#6b7280')}>
                            {opt?.label || a.status}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Coach/Admin actions */}
                {canEdit && (
                  <div style={actionRow}>
                    <button onClick={() => handleEdit(act)} style={actionBtn('var(--color-bg)', 'var(--color-accent)')}>
                      <Edit3 size={14} /> Edytuj
                    </button>
                    <button
                      onClick={() => handleDelete(act._id)}
                      disabled={deleting === act._id}
                      style={{
                        ...actionBtn('rgba(239,68,68,0.08)', '#ef4444'),
                        opacity: deleting === act._id ? 0.6 : 1,
                      }}
                    >
                      <Trash2 size={14} />
                      {deleting === act._id ? 'Usuwanie...' : 'Usun'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Activity form modal */}
      {showForm && (
        <ActivityForm
          activity={editingActivity}
          onClose={handleFormClose}
          onSaved={handleFormSaved}
        />
      )}
    </div>
  )
}
