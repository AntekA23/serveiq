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
  Activity as ActivityIcon,
} from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import useToast from '../../hooks/useToast'
import ActivityForm from '../../components/activities/ActivityForm'
import './Activities.css'

// ─── Constants ───────────────────────────────────────────────────────

const PAGE_SIZE = 20

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

const SURFACE_LABELS = {
  clay: 'Maczka',
  hard: 'Twarda',
  grass: 'Trawa',
  carpet: 'Dywan',
  'indoor-hard': 'Hala',
}

const ATTENDANCE_STYLES = {
  present: { label: 'Obecny', color: '#22c55e' },
  absent: { label: 'Nieobecny', color: '#ef4444' },
  late: { label: 'Spozniony', color: '#eab308' },
  excused: { label: 'Usprawiedliwiony', color: '#8b5cf6' },
}

// ─── Helpers ─────────────────────────────────────────────────────────

function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

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

// ─── Component ───────────────────────────────────────────────────────

export default function Activities() {
  const user = useAuthStore((s) => s.user)
  const toast = useToast()
  const canEdit = user?.role === 'coach' || user?.role === 'clubAdmin'
  const isParent = user?.role === 'parent'

  // Data state
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [filterType, setFilterType] = useState('')
  const [filterMonth, setFilterMonth] = useState(getCurrentMonth())

  // UI state
  const [expandedId, setExpandedId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingActivity, setEditingActivity] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [page, setPage] = useState(1)

  // ─── Fetch ───────────────────────────────────────────────────────

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams()
      if (filterType) params.set('type', filterType)
      if (filterMonth) params.set('month', filterMonth)
      const qs = params.toString()
      const { data } = await api.get(`/activities${qs ? `?${qs}` : ''}`)
      setActivities(data.activities || [])
      setPage(1)
    } catch {
      setError('Nie udalo sie zaladowac aktywnosci')
    } finally {
      setLoading(false)
    }
  }, [filterType, filterMonth])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  // ─── Pagination ──────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(activities.length / PAGE_SIZE))
  const paged = activities.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ─── Handlers ────────────────────────────────────────────────────

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id))
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

  // ─── Render helpers ──────────────────────────────────────────────

  const renderAttendance = (act) => {
    const list = act.attendance && act.attendance.length > 0
      ? act.attendance
      : null
    if (!list) return null

    return (
      <div className="act-attendance">
        <div className="act-attendance-title">Frekwencja</div>
        <div className="act-attendance-list">
          {list.map((a, idx) => {
            const name = a.player
              ? (typeof a.player === 'string' ? a.player : `${a.player.firstName} ${a.player.lastName}`)
              : `Zawodnik ${idx + 1}`
            const style = ATTENDANCE_STYLES[a.status] || { label: a.status, color: '#6b7280' }
            return (
              <div key={idx} className="act-attendance-row">
                <span className="act-attendance-name">{name}</span>
                <span
                  className="act-badge"
                  style={{ background: `${style.color}18`, color: style.color }}
                >
                  {style.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="act-page">
      {/* Header */}
      <div className="act-header">
        <h1 className="act-title">Aktywnosci</h1>
        {canEdit && (
          <button
            className="act-add-btn"
            onClick={() => { setEditingActivity(null); setShowForm(true) }}
          >
            <Plus size={16} /> Nowa aktywnosc
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="act-filters">
        <select
          className="act-filter-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">Wszystkie typy</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <input
          type="month"
          className="act-filter-month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
        />
      </div>

      {/* Loading */}
      {loading && <div className="act-loading">Ladowanie aktywnosci...</div>}

      {/* Error */}
      {!loading && error && (
        <div className="act-error">
          <p>{error}</p>
          <button className="act-retry-btn" onClick={fetchActivities}>
            Sprobuj ponownie
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && activities.length === 0 && (
        <div className="act-empty">
          <ActivityIcon size={40} style={{ opacity: 0.5 }} />
          <p className="act-empty-title">
            {isParent ? 'Brak aktywnosci dla Twojego dziecka' : 'Brak aktywnosci'}
          </p>
          <p className="act-empty-sub">
            {isParent
              ? 'Aktywnosci pojawia sie tutaj, gdy trener je doda.'
              : 'Kliknij "Nowa aktywnosc" aby dodac pierwsza.'}
          </p>
          {canEdit && (
            <button
              className="act-add-btn"
              style={{ marginTop: 10 }}
              onClick={() => { setEditingActivity(null); setShowForm(true) }}
            >
              <Plus size={16} /> Dodaj pierwsza aktywnosc
            </button>
          )}
        </div>
      )}

      {/* Activity list */}
      {!loading && !error && paged.length > 0 && (
        <div className="act-list">
          {paged.map((act) => {
            const typeColor = TYPE_COLORS[act.type] || TYPE_COLORS.other
            const isExpanded = expandedId === act._id
            const time = formatTime(act.startTime, act.endTime)
            const names = playerNames(act.players)

            return (
              <div
                key={act._id}
                className={`act-card${isExpanded ? ' expanded' : ''}`}
                style={{ borderLeftColor: typeColor }}
              >
                {/* Card header */}
                <div className="act-card-header" onClick={() => toggleExpand(act._id)}>
                  <div className="act-card-left">
                    <div className="act-card-title-row">
                      <h3 className="act-card-title">{act.title}</h3>
                      <span
                        className="act-badge"
                        style={{ background: `${typeColor}18`, color: typeColor }}
                      >
                        {TYPE_LABELS[act.type] || act.type}
                      </span>
                    </div>
                    <div className="act-meta">
                      <span className="act-meta-item">
                        <Calendar size={13} />
                        {formatDate(act.date)}
                      </span>
                      {time && (
                        <span className="act-meta-item">
                          <Clock size={13} />
                          {time}
                        </span>
                      )}
                      {act.durationMinutes && (
                        <span className="act-meta-item">{act.durationMinutes} min</span>
                      )}
                      {names && (
                        <span className="act-meta-item">
                          <Users size={13} />
                          {names}
                        </span>
                      )}
                    </div>
                  </div>
                  {isExpanded
                    ? <ChevronUp size={18} className="act-chevron" />
                    : <ChevronDown size={18} className="act-chevron" />}
                </div>

                {/* Expanded body */}
                {isExpanded && (
                  <div className="act-body">
                    <div className="act-details">
                      {act.location && (
                        <div>
                          <div className="act-detail-label">Lokalizacja</div>
                          <div className="act-detail-value">
                            <MapPin size={13} /> {act.location}
                          </div>
                        </div>
                      )}
                      {act.surface && (
                        <div>
                          <div className="act-detail-label">Nawierzchnia</div>
                          <div className="act-detail-value">
                            {SURFACE_LABELS[act.surface] || act.surface}
                          </div>
                        </div>
                      )}
                      {act.coach && (
                        <div>
                          <div className="act-detail-label">Trener</div>
                          <div className="act-detail-value">
                            {act.coach.firstName} {act.coach.lastName}
                          </div>
                        </div>
                      )}
                      {act.group && (
                        <div>
                          <div className="act-detail-label">Grupa</div>
                          <div className="act-detail-value">{act.group.name}</div>
                        </div>
                      )}
                      {act.focusAreas && act.focusAreas.length > 0 && (
                        <div>
                          <div className="act-detail-label">Obszary fokusowe</div>
                          <div className="act-focus-tags">
                            {act.focusAreas.map((fa, i) => (
                              <span
                                key={i}
                                className="act-badge"
                                style={{
                                  background: 'var(--color-accent-muted)',
                                  color: 'var(--color-accent)',
                                }}
                              >
                                {fa}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {act.notes && (
                      <div className="act-notes">
                        <div className="act-detail-label">Notatki</div>
                        <div className="act-notes-block">{act.notes}</div>
                      </div>
                    )}
                    {act.parentNotes && (
                      <div className="act-notes">
                        <div className="act-detail-label">Notatki dla rodzicow</div>
                        <div className="act-notes-block">{act.parentNotes}</div>
                      </div>
                    )}

                    {/* Attendance — read-only badges */}
                    {renderAttendance(act)}

                    {/* Actions (coach/admin only) */}
                    {canEdit && (
                      <div className="act-actions">
                        <button className="act-btn-edit" onClick={() => handleEdit(act)}>
                          <Edit3 size={14} /> Edytuj
                        </button>
                        <button
                          className="act-btn-delete"
                          disabled={deleting === act._id}
                          onClick={() => handleDelete(act._id)}
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
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && activities.length > PAGE_SIZE && (
        <div className="act-pagination">
          <button
            className="act-page-btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Poprzednia
          </button>
          <span className="act-page-info">{page} / {totalPages}</span>
          <button
            className="act-page-btn"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Nastepna
          </button>
        </div>
      )}

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
