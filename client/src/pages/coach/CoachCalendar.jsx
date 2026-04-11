import { useState, useCallback, useRef } from 'react'
import { X, Save, Trash2, Plus } from 'lucide-react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import api from '../../api/axios'
import useToast from '../../hooks/useToast'
import './CoachCalendar.css'

const TYPE_COLORS = {
  class: '#22c55e', camp: '#3b82f6', tournament: '#ef4444',
  training: '#eab308', match: '#8b5cf6', fitness: '#f97316',
  review: '#06b6d4', other: '#6b7280',
}
const SESSION_COLORS = {
  kort: '#22c55e', sparing: '#8b5cf6', kondycja: '#f97316',
  rozciaganie: '#06b6d4', mecz: '#ef4444', inne: '#6b7280',
}
const SESSION_TYPES = [
  { value: 'kort', label: 'Kort' },
  { value: 'sparing', label: 'Sparing' },
  { value: 'kondycja', label: 'Kondycja' },
  { value: 'rozciaganie', label: 'Rozciaganie' },
  { value: 'mecz', label: 'Mecz' },
  { value: 'inne', label: 'Inne' },
]
const SURFACES = [
  { value: 'clay', label: 'Maczka' },
  { value: 'hard', label: 'Twarda' },
  { value: 'indoor-hard', label: 'Hala' },
  { value: 'grass', label: 'Trawa' },
]

function pad2(n) { return String(n).padStart(2, '0') }
function toTimeStr(date) { return `${pad2(date.getHours())}:${pad2(date.getMinutes())}` }
function toDateStr(date) { return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}` }

function parseTimeToDate(dateStr, timeStr) {
  if (!timeStr) return null
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date(dateStr)
  d.setHours(h, m, 0, 0)
  return d
}
function addMinutes(date, mins) { return new Date(date.getTime() + mins * 60000) }

// ─── Modal for cancelling / restoring activities ───

function ActivityModal({ data, onClose, onChanged, toast }) {
  const isCancelled = data.status === 'cancelled'
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const handleCancel = async () => {
    setSaving(true)
    try {
      await api.put(`/activities/${data._id}/cancel`, { reason })
      toast.success('Aktywnosc odwolana')
      onChanged()
    } catch {
      toast.error('Nie udalo sie odwolac')
    }
    setSaving(false)
  }

  const handleRestore = async () => {
    setSaving(true)
    try {
      await api.put(`/activities/${data._id}/restore`)
      toast.success('Aktywnosc przywrocona')
      onChanged()
    } catch {
      toast.error('Nie udalo sie przywrocic')
    }
    setSaving(false)
  }

  const handleDeleteSeries = async () => {
    if (!data.recurrence?.seriesId) return
    if (!window.confirm('Usunac wszystkie powtorzenia tej aktywnosci?')) return
    setSaving(true)
    try {
      await api.delete(`/activities/series/${data.recurrence.seriesId}`)
      toast.success('Seria usunieta')
      onChanged()
    } catch {
      toast.error('Nie udalo sie usunac serii')
    }
    setSaving(false)
  }

  return (
    <div className="ccal-modal-overlay" onClick={onClose}>
      <div className="ccal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ccal-modal-header">
          <h3>{data.title}</h3>
          <button className="ccal-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="ccal-modal-body">
          {isCancelled ? (
            <div className="ccal-cancelled-banner">
              Ta aktywnosc zostala odwolana
            </div>
          ) : (
            <>
              <div className="ccal-field">
                <label>Powod odwolania (opcjonalnie)</label>
                <input type="text" placeholder="np. Deszcz, choroba trenera..."
                  value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
            </>
          )}
        </div>

        <div className="ccal-modal-footer">
          {data.recurrence?.seriesId && (
            <button className="ccal-btn-danger" onClick={handleDeleteSeries} disabled={saving}>
              <Trash2 size={14} /> Usun serie
            </button>
          )}
          <div className="ccal-modal-footer-right">
            <button className="ccal-btn-secondary" onClick={onClose}>Zamknij</button>
            {isCancelled ? (
              <button className="ccal-btn-primary" onClick={handleRestore} disabled={saving}>
                Przywroc
              </button>
            ) : (
              <button className="ccal-btn-cancel" onClick={handleCancel} disabled={saving}>
                Odwolaj zajecia
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'Jednorazowo' },
  { value: 'weekly', label: 'Co tydzien' },
  { value: 'biweekly', label: 'Co 2 tygodnie' },
  { value: 'monthly', label: 'Co miesiac' },
]

// ─── Modal for creating / viewing sessions ───

function SessionModal({ mode, data, players, onClose, onSaved, onDeleted, toast }) {
  const isEdit = mode === 'edit'
  const [form, setForm] = useState({
    player: data.player || '',
    date: data.date || '',
    startTime: data.startTime || '15:00',
    sessionType: data.sessionType || 'kort',
    surface: data.surface || 'clay',
    durationMinutes: data.durationMinutes || 60,
    title: data.title || '',
    notes: data.notes || '',
    visibleToParent: data.visibleToParent !== false,
    recurrence: 'none',
  })
  const [saving, setSaving] = useState(false)

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }))

  const handleSave = async () => {
    if (!form.player) { toast.error('Wybierz zawodnika'); return }
    if (!form.title.trim()) {
      // Auto-generate title
      const type = SESSION_TYPES.find((t) => t.value === form.sessionType)?.label || form.sessionType
      const playerObj = players.find((p) => p._id === form.player)
      const name = playerObj ? `${playerObj.firstName} ${playerObj.lastName?.[0] || ''}.` : ''
      form.title = `${type} — ${name}`.trim()
    }
    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/sessions/${data._id}`, form)
        toast.success('Sesja zaktualizowana')
      } else if (form.recurrence !== 'none') {
        // Create as activity with recurrence
        const playerObj = players.find((p) => p._id === form.player)
        await api.post('/activities', {
          type: 'training',
          title: form.title,
          date: form.date,
          startTime: form.startTime,
          durationMinutes: form.durationMinutes,
          players: form.player ? [form.player] : [],
          surface: form.surface,
          notes: form.notes,
          visibleToParent: form.visibleToParent,
          recurrence: { type: form.recurrence },
        })
        toast.success('Sesja dodana z powtarzaniem')
      } else {
        await api.post('/sessions', form)
        toast.success('Sesja dodana')
      }
      onSaved()
    } catch {
      toast.error('Nie udalo sie zapisac sesji')
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!window.confirm('Usunac te sesje?')) return
    try {
      await api.delete(`/sessions/${data._id}`)
      toast.success('Sesja usunieta')
      onDeleted()
    } catch {
      toast.error('Nie udalo sie usunac')
    }
  }

  return (
    <div className="ccal-modal-overlay" onClick={onClose}>
      <div className="ccal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ccal-modal-header">
          <h3>{isEdit ? 'Edytuj sesje' : 'Nowa sesja'}</h3>
          <button className="ccal-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="ccal-modal-body">
          {/* Player */}
          <div className="ccal-field">
            <label>Zawodnik</label>
            <select value={form.player} onChange={(e) => handleChange('player', e.target.value)} disabled={isEdit}>
              <option value="">Wybierz...</option>
              {players.map((p) => (
                <option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>
          </div>

          {/* Date + Time + Duration row */}
          <div className="ccal-field-row">
            <div className="ccal-field">
              <label>Data</label>
              <input type="date" value={form.date} onChange={(e) => handleChange('date', e.target.value)} />
            </div>
            <div className="ccal-field">
              <label>Godzina</label>
              <input type="time" value={form.startTime} onChange={(e) => handleChange('startTime', e.target.value)} />
            </div>
            <div className="ccal-field">
              <label>Czas (min)</label>
              <select value={form.durationMinutes} onChange={(e) => handleChange('durationMinutes', Number(e.target.value))}>
                {[30, 45, 60, 75, 90, 120].map((m) => (
                  <option key={m} value={m}>{m} min</option>
                ))}
              </select>
            </div>
          </div>

          {/* Type */}
          <div className="ccal-field">
            <label>Typ</label>
            <div className="ccal-type-row">
              {SESSION_TYPES.map((t) => (
                <button key={t.value}
                  className={`ccal-type-btn ${form.sessionType === t.value ? 'active' : ''}`}
                  style={form.sessionType === t.value ? { background: SESSION_COLORS[t.value], borderColor: SESSION_COLORS[t.value], color: '#fff' } : {}}
                  onClick={() => handleChange('sessionType', t.value)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Detailed fields — only in edit mode */}
          {isEdit && (
            <>
              <div className="ccal-field">
                <label>Nawierzchnia</label>
                <div className="ccal-type-row">
                  {SURFACES.map((s) => (
                    <button key={s.value}
                      className={`ccal-type-btn ${form.surface === s.value ? 'active' : ''}`}
                      style={form.surface === s.value ? { background: 'var(--color-accent)', borderColor: 'var(--color-accent)', color: 'var(--color-accent-contrast)' } : {}}
                      onClick={() => handleChange('surface', s.value)}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ccal-field">
                <label>Notatki</label>
                <textarea rows={2} placeholder="Plan treningu, fokus..." value={form.notes}
                  onChange={(e) => handleChange('notes', e.target.value)} />
              </div>

              <label className="ccal-checkbox">
                <input type="checkbox" checked={form.visibleToParent}
                  onChange={(e) => handleChange('visibleToParent', e.target.checked)} />
                Widoczne dla rodzica
              </label>
            </>
          )}
        </div>

        <div className="ccal-modal-footer">
          {isEdit && (
            <button className="ccal-btn-danger" onClick={handleDelete}><Trash2 size={14} /> Usun</button>
          )}
          <div className="ccal-modal-footer-right">
            <button className="ccal-btn-secondary" onClick={onClose}>Anuluj</button>
            <button className="ccal-btn-primary" onClick={handleSave} disabled={saving}>
              <Save size={14} /> {saving ? 'Zapisywanie...' : 'Zapisz'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Calendar ───

export default function CoachCalendar() {
  const toast = useToast()
  const calendarRef = useRef(null)
  const [events, setEvents] = useState([])
  const [players, setPlayers] = useState([])
  const [modal, setModal] = useState(null) // { mode: 'create'|'edit', data: {} }
  const playersRef = useRef([])

  const fetchEvents = useCallback(async () => {
    try {
      const [actRes, sesRes, plRes] = await Promise.all([
        api.get('/activities', { params: { limit: 200 } }).catch(() => ({ data: { activities: [] } })),
        api.get('/sessions').catch(() => ({ data: [] })),
        api.get('/players').catch(() => ({ data: { players: [] } })),
      ])

      const pl = plRes.data.players || plRes.data || []
      setPlayers(pl)
      playersRef.current = pl
      const playerMap = {}
      for (const p of pl) {
        playerMap[p._id] = `${p.firstName} ${p.lastName?.[0] || ''}.`
      }

      const activities = (actRes.data.activities || []).map((a) => {
        const start = parseTimeToDate(a.date, a.startTime) || new Date(a.date)
        const end = a.endTime ? parseTimeToDate(a.date, a.endTime) : (a.durationMinutes ? addMinutes(start, a.durationMinutes) : addMinutes(start, 60))
        const playerNames = (a.players || []).map((p) => {
          const id = typeof p === 'object' ? p._id : p
          return playerMap[id] || (typeof p === 'object' ? p.firstName : '')
        }).filter(Boolean).join(', ')

        const isCancelled = a.status === 'cancelled'

        return {
          id: `act-${a._id}`,
          title: isCancelled ? `[Odwolane] ${a.title || 'Aktywnosc'}` : (a.title || 'Aktywnosc'),
          start, end,
          backgroundColor: isCancelled ? '#374151' : (TYPE_COLORS[a.type] || '#6b7280'),
          borderColor: isCancelled ? '#ef4444' : 'transparent',
          textColor: isCancelled ? '#9ca3af' : '#fff',
          classNames: isCancelled ? ['ccal-event-cancelled'] : [],
          extendedProps: {
            source: 'activity',
            activityType: a.type,
            playerNames,
            location: a.location,
            _id: a._id,
            status: a.status,
            recurrence: a.recurrence,
          },
        }
      })

      const sessionsRaw = Array.isArray(sesRes.data) ? sesRes.data : sesRes.data.sessions || []
      const sessions = sessionsRaw.map((s) => {
        const start = parseTimeToDate(s.date, s.startTime) || new Date(s.date)
        const end = s.durationMinutes ? addMinutes(start, s.durationMinutes) : addMinutes(start, 60)
        const playerId = typeof s.player === 'object' ? s.player._id : s.player
        const playerName = playerMap[playerId] || (typeof s.player === 'object' ? s.player.firstName : '')

        return {
          id: `ses-${s._id}`,
          title: s.title || 'Sesja',
          start, end,
          backgroundColor: SESSION_COLORS[s.sessionType] || '#6b7280',
          borderColor: 'transparent',
          textColor: '#fff',
          extendedProps: {
            source: 'session', sessionType: s.sessionType, playerNames: playerName, _id: s._id,
            // keep raw data for edit modal
            player: playerId, surface: s.surface, notes: s.notes,
            startTime: s.startTime, durationMinutes: s.durationMinutes,
            visibleToParent: s.visibleToParent,
          },
        }
      })

      setEvents([...activities, ...sessions])
    } catch { /* silent */ }
  }, [])

  const handleEventClick = (info) => {
    const props = info.event.extendedProps
    if (props.source === 'session') {
      setModal({
        mode: 'edit',
        data: {
          _id: props._id,
          player: props.player,
          date: toDateStr(info.event.start),
          startTime: props.startTime || toTimeStr(info.event.start),
          sessionType: props.sessionType,
          surface: props.surface || '',
          durationMinutes: props.durationMinutes || 60,
          title: info.event.title,
          notes: props.notes || '',
          visibleToParent: props.visibleToParent,
        },
      })
    } else if (props.source === 'activity') {
      setModal({
        mode: 'activity',
        data: {
          _id: props._id,
          title: info.event.title.replace('[Odwolane] ', ''),
          status: props.status,
          start: info.event.start,
          recurrence: props.recurrence,
        },
      })
    }
  }

  const handleSelect = (info) => {
    const durationMinutes = Math.round((info.end - info.start) / 60000)
    setModal({
      mode: 'create',
      data: {
        date: toDateStr(info.start),
        startTime: toTimeStr(info.start),
        durationMinutes: durationMinutes || 60,
      },
    })
    // Unselect the range after opening modal
    calendarRef.current?.getApi().unselect()
  }

  const handleEventDrop = async (info) => {
    const props = info.event.extendedProps
    if (props.source !== 'session') { info.revert(); return }
    try {
      const newDate = info.event.start.toISOString()
      const newTime = toTimeStr(info.event.start)
      await api.put(`/sessions/${props._id}`, { date: newDate, startTime: newTime })
      toast.success('Sesja przeniesiona')
    } catch {
      info.revert()
      toast.error('Nie udalo sie przeniesc sesji')
    }
  }

  const handleEventResize = async (info) => {
    const props = info.event.extendedProps
    if (props.source !== 'session') { info.revert(); return }
    try {
      const durationMinutes = Math.round((info.event.end - info.event.start) / 60000)
      await api.put(`/sessions/${props._id}`, { durationMinutes })
      toast.success('Czas trwania zaktualizowany')
    } catch {
      info.revert()
      toast.error('Nie udalo sie zmienic czasu trwania')
    }
  }

  const handleModalClose = () => setModal(null)
  const handleModalSaved = () => { setModal(null); fetchEvents() }
  const handleModalDeleted = () => { setModal(null); fetchEvents() }

  function renderEventContent(eventInfo) {
    const props = eventInfo.event.extendedProps
    return (
      <div className="ccal-event">
        <div className="ccal-event-title">{eventInfo.event.title}</div>
        {props.playerNames && <div className="ccal-event-player">{props.playerNames}</div>}
        {props.location && <div className="ccal-event-location">{props.location}</div>}
      </div>
    )
  }

  const handleNewSession = () => {
    const now = new Date()
    // Round to next full hour
    now.setMinutes(0, 0, 0)
    now.setHours(now.getHours() + 1)
    setModal({
      mode: 'create',
      data: {
        date: toDateStr(now),
        startTime: toTimeStr(now),
      },
    })
  }

  return (
    <div className="coach-calendar-page">
      <div className="ccal-top-bar">
        <button className="ccal-add-btn" onClick={handleNewSession}>
          <Plus size={16} /> Nowa sesja
        </button>
        <span className="ccal-hint">Kliknij na slot w kalendarzu aby dodac sesje w konkretnym terminie</span>
      </div>
      <div className="coach-calendar-wrapper">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridWeek,dayGridMonth,listWeek',
          }}
          buttonText={{ today: 'Dzis', week: 'Tydzien', month: 'Miesiac', list: 'Lista' }}
          locale="pl"
          firstDay={1}
          height="auto"
          contentHeight={700}
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          slotDuration="00:30:00"
          slotLabelInterval="01:00"
          slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          allDaySlot={false}
          nowIndicator
          selectable
          selectMirror
          events={events}
          datesSet={fetchEvents}
          eventClick={handleEventClick}
          select={handleSelect}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventContent={renderEventContent}
          editable
          eventDurationEditable
          dayMaxEvents={4}
          moreLinkText={(n) => `+${n}`}
          noEventsText="Brak wydarzen"
          eventDisplay="block"
        />
      </div>

      {modal && modal.mode === 'activity' && (
        <ActivityModal
          data={modal.data}
          onClose={handleModalClose}
          onChanged={handleModalSaved}
          toast={toast}
        />
      )}

      {modal && (modal.mode === 'create' || modal.mode === 'edit') && (
        <SessionModal
          mode={modal.mode}
          data={modal.data}
          players={players}
          onClose={handleModalClose}
          onSaved={handleModalSaved}
          onDeleted={handleModalDeleted}
          toast={toast}
        />
      )}
    </div>
  )
}
