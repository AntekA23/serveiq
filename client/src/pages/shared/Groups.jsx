import { useState, useEffect, useCallback } from 'react'
import { Plus, Users, ChevronDown, Edit3, Trash2, X, Calendar, Clock, User } from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import useToast from '../../hooks/useToast'
import './Groups.css'

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

const SURFACE_LABELS = { clay: 'Maczka', hard: 'Twarda', grass: 'Trawa', carpet: 'Dywan', 'indoor-hard': 'Hala' }

function formatSchedule(schedule) {
  if (!schedule) return null
  const parts = []
  if (schedule.dayOfWeek?.length > 0) parts.push(schedule.dayOfWeek.map((d) => DAY_LABELS[d]).join(', '))
  if (schedule.startTime && schedule.endTime) parts.push(`${schedule.startTime} - ${schedule.endTime}`)
  else if (schedule.startTime) parts.push(schedule.startTime)
  return parts.length > 0 ? parts.join(' | ') : null
}

function getInitials(firstName, lastName) {
  return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase()
}

/* ─── Modal Form ─── */

function GroupFormModal({ group, clubId, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: group?.name || '',
    description: group?.description || '',
    pathwayStage: group?.pathwayStage || '',
    maxPlayers: group?.maxPlayers || '',
    surface: group?.schedule?.surface || '',
    startTime: group?.schedule?.startTime || '',
    endTime: group?.schedule?.endTime || '',
  })
  const [scheduleDays, setScheduleDays] = useState(group?.schedule?.dayOfWeek || [])
  const [selectedPlayers, setSelectedPlayers] = useState(
    (group?.players || []).map((p) => (typeof p === 'string' ? p : p._id))
  )
  const [allPlayers, setAllPlayers] = useState([])
  const [playerSearch, setPlayerSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/players')
      .then(({ data }) => setAllPlayers(Array.isArray(data.players || data) ? (data.players || data) : []))
      .catch(() => {})
  }, [])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const toggleDay = (d) => setScheduleDays((prev) =>
    prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()
  )

  const togglePlayer = (pid) => setSelectedPlayers((prev) =>
    prev.includes(pid) ? prev.filter((x) => x !== pid) : [...prev, pid]
  )

  const filteredPlayers = allPlayers.filter((p) => {
    if (!playerSearch) return true
    return `${p.firstName} ${p.lastName}`.toLowerCase().includes(playerSearch.toLowerCase())
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Nazwa grupy jest wymagana'); return }
    setSaving(true)
    setError('')

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      pathwayStage: form.pathwayStage || undefined,
      maxPlayers: form.maxPlayers ? Number(form.maxPlayers) : undefined,
      players: selectedPlayers,
      schedule: {
        dayOfWeek: scheduleDays,
        startTime: form.startTime || undefined,
        endTime: form.endTime || undefined,
        surface: form.surface || undefined,
      },
    }
    if (!group) payload.club = clubId

    try {
      if (group) await api.put(`/groups/${group._id}`, payload)
      else await api.post('/groups', payload)
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Nie udalo sie zapisac grupy')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grp-overlay" onClick={onClose}>
      <div className="grp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="grp-modal-header">
          <h2 className="grp-modal-title">{group ? 'Edytuj grupe' : 'Nowa grupa'}</h2>
          <button className="grp-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grp-modal-body">
            {error && <div className="grp-form-error">{error}</div>}

            <div className="grp-field">
              <label className="grp-label">Nazwa grupy *</label>
              <input className="grp-input" value={form.name} onChange={set('name')} placeholder="np. Tennis10 Red Poniedzialek" />
            </div>

            <div className="grp-field">
              <label className="grp-label">Opis</label>
              <textarea className="grp-textarea" value={form.description} onChange={set('description')} placeholder="Opis grupy..." />
            </div>

            <div className="grp-form-row">
              <div className="grp-form-half grp-field">
                <label className="grp-label">Etap sciezki</label>
                <select className="grp-select" value={form.pathwayStage} onChange={set('pathwayStage')}>
                  <option value="">-- Wybierz --</option>
                  {Object.entries(PATHWAY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="grp-form-half grp-field">
                <label className="grp-label">Nawierzchnia</label>
                <select className="grp-select" value={form.surface} onChange={set('surface')}>
                  <option value="">-- Nie wybrano --</option>
                  {Object.entries(SURFACE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>

            <div className="grp-field">
              <label className="grp-label">Maks. graczy</label>
              <input type="number" min={1} className="grp-input grp-input-narrow" value={form.maxPlayers} onChange={set('maxPlayers')} placeholder="np. 8" />
            </div>

            <div className="grp-field">
              <label className="grp-label">Harmonogram</label>
              <div className="grp-days">
                {DAY_LABELS.map((label, idx) => (
                  <button key={idx} type="button" className={`grp-day-btn ${scheduleDays.includes(idx) ? 'active' : ''}`} onClick={() => toggleDay(idx)} title={DAY_LABELS_FULL[idx]}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="grp-form-row">
                <div className="grp-form-half">
                  <label className="grp-label grp-label-sm">Od</label>
                  <input type="time" className="grp-input" value={form.startTime} onChange={set('startTime')} />
                </div>
                <div className="grp-form-half">
                  <label className="grp-label grp-label-sm">Do</label>
                  <input type="time" className="grp-input" value={form.endTime} onChange={set('endTime')} />
                </div>
              </div>
            </div>

            <div className="grp-field">
              <label className="grp-label">Zawodnicy ({selectedPlayers.length} wybranych)</label>
              <input className="grp-input grp-input-mb" placeholder="Szukaj zawodnika..." value={playerSearch} onChange={(e) => setPlayerSearch(e.target.value)} />
              <div className="grp-player-list-select">
                {filteredPlayers.length === 0 && (
                  <div className="grp-no-results">{allPlayers.length === 0 ? 'Brak dostepnych zawodnikow' : 'Brak wynikow'}</div>
                )}
                {filteredPlayers.map((p) => {
                  const selected = selectedPlayers.includes(p._id)
                  return (
                    <div key={p._id} className={`grp-player-option ${selected ? 'selected' : ''}`} onClick={() => togglePlayer(p._id)}>
                      <span className={`grp-checkbox ${selected ? 'checked' : ''}`}>{selected ? '\u2713' : ''}</span>
                      {p.firstName} {p.lastName}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="grp-modal-footer">
            <button type="button" className="grp-btn grp-btn-cancel" onClick={onClose}>Anuluj</button>
            <button type="submit" className="grp-btn grp-btn-primary" disabled={saving}>
              {saving ? 'Zapisywanie...' : group ? 'Zapisz zmiany' : 'Utworz grupe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Main Component ─── */

export default function Groups() {
  const user = useAuthStore((s) => s.user)
  const toast = useToast()
  const isCoach = user?.role === 'coach'
  const isClubAdmin = user?.role === 'clubAdmin'
  const isParent = user?.role === 'parent'
  const canEdit = isCoach || isClubAdmin
  const clubId = typeof user?.club === 'string' ? user.club : user?.club?._id || user?.club || ''

  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const params = clubId ? `?club=${clubId}` : ''
      const { data } = await api.get(`/groups${params}`)
      let list = data.groups || []

      if (isParent && user?.parentProfile?.children) {
        const childIds = user.parentProfile.children.map((c) => typeof c === 'string' ? c : c._id)
        list = list.filter((g) => g.players?.some((p) => {
          const pid = typeof p === 'string' ? p : p._id
          return childIds.includes(pid)
        }))
      }
      setGroups(list)
    } catch {
      setError('Nie udalo sie zaladowac grup')
    } finally {
      setLoading(false)
    }
  }, [clubId, isParent, user?.parentProfile?.children])

  useEffect(() => { fetchGroups() }, [fetchGroups])

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

  const handleFormSaved = () => {
    toast.success(editingGroup ? 'Grupa zaktualizowana' : 'Grupa utworzona')
    setShowForm(false)
    setEditingGroup(null)
    setExpandedId(null)
    fetchGroups()
  }

  const openAdd = () => { setEditingGroup(null); setShowForm(true) }
  const openEdit = (g) => { setEditingGroup(g); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditingGroup(null) }

  return (
    <div className="grp-page">
      <div className="grp-header">
        <h1 className="grp-title">Grupy</h1>
        {canEdit && <button className="grp-add-btn" onClick={openAdd}><Plus size={16} /> Nowa grupa</button>}
      </div>

      {loading && <div className="grp-loading">Ladowanie grup...</div>}

      {!loading && error && (
        <div className="grp-error">
          <p>{error}</p>
          <button className="grp-retry-btn" onClick={fetchGroups}>Sprobuj ponownie</button>
        </div>
      )}

      {!loading && !error && groups.length === 0 && (
        <div className="grp-empty">
          <Users size={36} className="grp-empty-icon" />
          <p>{isParent ? 'Twoje dziecko nie nalezy jeszcze do zadnej grupy' : 'Brak grup'}</p>
          <p className="grp-empty-sub">{isParent ? 'Grupy pojawia sie tutaj, gdy trener doda Twoje dziecko.' : 'Kliknij "Nowa grupa" aby utworzyc pierwsza.'}</p>
          {canEdit && <button className="grp-add-btn" onClick={openAdd}><Plus size={16} /> Dodaj pierwsza grupe</button>}
        </div>
      )}

      {!loading && !error && groups.length > 0 && (
        <div className="grp-list">
          {groups.map((group) => {
            const pathColor = PATHWAY_COLORS[group.pathwayStage] || null
            const isExpanded = expandedId === group._id
            const schedule = formatSchedule(group.schedule)
            const playerCount = group.players?.length || 0
            const coachName = group.coach ? `${group.coach.firstName} ${group.coach.lastName}` : null

            return (
              <div key={group._id} className={`grp-card ${isExpanded ? 'expanded' : ''}`}>
                <div className="grp-card-header" onClick={() => setExpandedId(isExpanded ? null : group._id)}>
                  <div className="grp-card-left">
                    <div className="grp-card-title-row">
                      <h3 className="grp-card-name">{group.name}</h3>
                      {group.pathwayStage && (
                        <span className="grp-badge" style={{ background: `${pathColor}18`, color: pathColor }}>
                          {PATHWAY_LABELS[group.pathwayStage] || group.pathwayStage}
                        </span>
                      )}
                    </div>
                    <div className="grp-meta">
                      {coachName && <span className="grp-meta-item"><User size={12} />{coachName}</span>}
                      <span className="grp-meta-item"><Users size={12} />{playerCount}{group.maxPlayers ? `/${group.maxPlayers}` : ''} zawodnikow</span>
                      {schedule && <span className="grp-meta-item"><Calendar size={12} />{schedule}</span>}
                    </div>
                  </div>
                  <ChevronDown size={16} className="grp-chevron" />
                </div>

                {isExpanded && (
                  <div className="grp-card-body">
                    {group.description && <div className="grp-description">{group.description}</div>}

                    <div className="grp-details">
                      {group.schedule?.dayOfWeek?.length > 0 && (
                        <div>
                          <div className="grp-detail-label">Dni treningow</div>
                          <div className="grp-detail-value">{group.schedule.dayOfWeek.map((d) => DAY_LABELS_FULL[d]).join(', ')}</div>
                        </div>
                      )}
                      {(group.schedule?.startTime || group.schedule?.endTime) && (
                        <div>
                          <div className="grp-detail-label">Godziny</div>
                          <div className="grp-detail-value"><Clock size={12} />{group.schedule.startTime || '?'} - {group.schedule.endTime || '?'}</div>
                        </div>
                      )}
                      {group.schedule?.surface && (
                        <div>
                          <div className="grp-detail-label">Nawierzchnia</div>
                          <div className="grp-detail-value">{SURFACE_LABELS[group.schedule.surface] || group.schedule.surface}</div>
                        </div>
                      )}
                      {group.maxPlayers && (
                        <div>
                          <div className="grp-detail-label">Limit miejsc</div>
                          <div className="grp-detail-value">{playerCount}/{group.maxPlayers}</div>
                        </div>
                      )}
                    </div>

                    <div className="grp-players-head"><Users size={13} /> Zawodnicy ({playerCount})</div>
                    {(!group.players || group.players.length === 0) && <div className="grp-no-players">Brak zawodnikow w grupie</div>}
                    {group.players?.map((p) => {
                      if (typeof p === 'string') return <div key={p} className="grp-player-row"><div className="grp-player-avatar">?</div><span>{p}</span></div>
                      return (
                        <div key={p._id} className="grp-player-row">
                          <div className="grp-player-avatar">
                            {p.avatarUrl ? <img src={p.avatarUrl} alt="" /> : getInitials(p.firstName, p.lastName)}
                          </div>
                          <span className="grp-player-name">{p.firstName} {p.lastName}</span>
                          {!isParent && p.pathwayStage && (
                            <span className="grp-badge" style={{ background: `${PATHWAY_COLORS[p.pathwayStage] || '#6b7280'}18`, color: PATHWAY_COLORS[p.pathwayStage] || '#6b7280' }}>
                              {PATHWAY_LABELS[p.pathwayStage] || p.pathwayStage}
                            </span>
                          )}
                        </div>
                      )
                    })}

                    {canEdit && (
                      <div className="grp-actions">
                        <button className="grp-action-btn edit" onClick={() => openEdit(group)}><Edit3 size={13} /> Edytuj</button>
                        <button className="grp-action-btn delete" disabled={deleting === group._id} onClick={() => handleDelete(group._id)}>
                          <Trash2 size={13} /> {deleting === group._id ? 'Usuwanie...' : 'Usun'}
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

      {showForm && <GroupFormModal group={editingGroup} clubId={clubId} onClose={closeForm} onSaved={handleFormSaved} />}
    </div>
  )
}
