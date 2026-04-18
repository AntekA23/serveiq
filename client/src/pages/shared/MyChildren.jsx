import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Users,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Loader2,
  UserPlus,
  ChevronRight,
} from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'

/* ───────────── helpers ───────────── */

function calcAge(dateOfBirth) {
  if (!dateOfBirth) return null
  const diff = Date.now() - new Date(dateOfBirth).getTime()
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
}

function initials(firstName, lastName) {
  return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase()
}

/* ───────────── styles ───────────── */

const styles = {
  page: {
    padding: '2rem',
    maxWidth: 960,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--color-text)',
    margin: 0,
  },
  addBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 20px',
    background: 'var(--color-accent)',
    color: '#0B0E14',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 16,
  },
  card: {
    background: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border-md)',
    borderRadius: 12,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  cardTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: '50%',
    background: 'var(--color-accent-muted)',
    color: 'var(--color-accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 18,
    flexShrink: 0,
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--color-text)',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    background: 'var(--color-accent-muted)',
    color: 'var(--color-accent)',
  },
  badgeGender: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    background: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border-md)',
    color: 'var(--color-text-secondary)',
  },
  ageTxt: {
    fontSize: 13,
    color: 'var(--color-text-secondary)',
  },
  coachTxt: {
    fontSize: 13,
    color: 'var(--color-text-tertiary)',
    marginTop: 2,
  },
  cardActions: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '8px 14px',
    background: 'var(--color-accent)',
    color: '#0B0E14',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '8px 14px',
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    border: '1px solid var(--color-border-md)',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  btnDanger: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '8px 14px',
    background: 'transparent',
    color: 'var(--color-error)',
    border: '1px solid var(--color-error)',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },

  /* empty state */
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: '4rem 2rem',
    textAlign: 'center',
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    background: 'var(--color-accent-muted)',
    color: 'var(--color-accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--color-text)',
    margin: 0,
  },
  emptyDesc: {
    fontSize: 14,
    color: 'var(--color-text-tertiary)',
    margin: 0,
    maxWidth: 340,
  },

  /* loading / error */
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '4rem 2rem',
    color: 'var(--color-text-secondary)',
    fontSize: 15,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 16px',
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid var(--color-error)',
    borderRadius: 8,
    color: 'var(--color-error)',
    fontSize: 14,
    marginBottom: 16,
  },

  /* modal overlay */
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 16,
  },
  modal: {
    background: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border-md)',
    borderRadius: 12,
    padding: 28,
    width: '100%',
    maxWidth: 440,
    position: 'relative',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--color-text)',
    margin: '0 0 20px 0',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    background: 'none',
    border: 'none',
    color: 'var(--color-text-tertiary)',
    cursor: 'pointer',
    padding: 4,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    borderRadius: 8,
    border: '1px solid var(--color-border-md)',
    background: 'var(--color-bg-secondary)',
    color: 'var(--color-text)',
    outline: 'none',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    borderRadius: 8,
    border: '1px solid var(--color-border-md)',
    background: 'var(--color-bg-secondary)',
    color: 'var(--color-text)',
    outline: 'none',
    boxSizing: 'border-box',
    cursor: 'pointer',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 24,
  },
  formError: {
    fontSize: 12,
    color: 'var(--color-error)',
    marginTop: 4,
  },

  /* confirm dialog */
  confirmText: {
    fontSize: 15,
    color: 'var(--color-text)',
    margin: '0 0 24px 0',
    lineHeight: 1.5,
  },
  confirmActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
  },
}

/* ───────────── ChildFormModal ───────────── */

function ChildFormModal({ child, onClose, onSaved }) {
  const isEdit = !!child
  const [form, setForm] = useState({
    firstName: child?.firstName || '',
    lastName: child?.lastName || '',
    dateOfBirth: child?.dateOfBirth
      ? new Date(child.dateOfBirth).toISOString().slice(0, 10)
      : '',
    gender: child?.gender || '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')

  const validate = () => {
    const errs = {}
    if (!form.firstName.trim()) errs.firstName = 'Imie jest wymagane'
    if (!form.lastName.trim()) errs.lastName = 'Nazwisko jest wymagane'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setApiError('')
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
      }
      if (form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth
      if (form.gender) payload.gender = form.gender

      if (isEdit) {
        await api.put(`/players/${child._id}`, payload)
      } else {
        await api.post('/players/self', payload)
      }
      onSaved()
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (isEdit ? 'Nie udalo sie zaktualizowac danych' : 'Nie udalo sie dodac dziecka')
      setApiError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="Zamknij">
          <X size={20} />
        </button>

        <h2 style={styles.modalTitle}>
          {isEdit ? 'Edytuj dziecko' : 'Dodaj dziecko'}
        </h2>

        {apiError && (
          <div style={styles.errorBox}>
            <AlertCircle size={16} />
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Imie *</label>
              <input
                style={{
                  ...styles.input,
                  borderColor: errors.firstName ? 'var(--color-error)' : undefined,
                }}
                value={form.firstName}
                onChange={handleChange('firstName')}
                placeholder="Kacper"
                autoFocus
              />
              {errors.firstName && (
                <div style={styles.formError}>{errors.firstName}</div>
              )}
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Nazwisko *</label>
              <input
                style={{
                  ...styles.input,
                  borderColor: errors.lastName ? 'var(--color-error)' : undefined,
                }}
                value={form.lastName}
                onChange={handleChange('lastName')}
                placeholder="Kowalski"
              />
              {errors.lastName && (
                <div style={styles.formError}>{errors.lastName}</div>
              )}
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Data urodzenia</label>
            <input
              type="date"
              style={styles.input}
              value={form.dateOfBirth}
              onChange={handleChange('dateOfBirth')}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Plec</label>
            <select
              style={styles.select}
              value={form.gender}
              onChange={handleChange('gender')}
            >
              <option value="">-- Wybierz --</option>
              <option value="M">Chlopiec</option>
              <option value="F">Dziewczynka</option>
            </select>
          </div>

          <div style={styles.formActions}>
            <button
              type="button"
              style={styles.btnSecondary}
              onClick={onClose}
              disabled={submitting}
            >
              Anuluj
            </button>
            <button
              type="submit"
              style={{
                ...styles.btnPrimary,
                opacity: submitting ? 0.7 : 1,
                pointerEvents: submitting ? 'none' : 'auto',
              }}
              disabled={submitting}
            >
              {submitting && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
              {isEdit ? 'Zapisz' : 'Dodaj'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ───────────── DeleteConfirmModal ───────────── */

function DeleteConfirmModal({ child, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    setDeleting(true)
    setError('')
    try {
      await api.delete(`/players/${child._id}`)
      onConfirm()
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Nie udalo sie usunac zawodnika'
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="Zamknij">
          <X size={20} />
        </button>

        <h2 style={styles.modalTitle}>Usun dziecko</h2>

        {error && (
          <div style={styles.errorBox}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <p style={styles.confirmText}>
          Czy na pewno chcesz usunac{' '}
          <strong>
            {child.firstName} {child.lastName}
          </strong>
          ? Tej operacji nie mozna cofnac.
        </p>

        <div style={styles.confirmActions}>
          <button
            type="button"
            style={styles.btnSecondary}
            onClick={onClose}
            disabled={deleting}
          >
            Anuluj
          </button>
          <button
            type="button"
            style={{
              ...styles.btnDanger,
              opacity: deleting ? 0.7 : 1,
              pointerEvents: deleting ? 'none' : 'auto',
            }}
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
            Usun
          </button>
        </div>
      </div>
    </div>
  )
}

/* ───────────── ChildCard ───────────── */

function ChildCard({ child, onEdit, onDelete, navigate }) {
  const age = calcAge(child.dateOfBirth)

  const coachName = child.coach
    ? typeof child.coach === 'object'
      ? `${child.coach.firstName || ''} ${child.coach.lastName || ''}`.trim()
      : null
    : null

  return (
    <div style={{ ...styles.card, cursor: 'pointer' }} onClick={() => navigate(`/parent/child/${child._id}`)}>
      <div style={styles.cardTop}>
        <div style={styles.avatar}>{initials(child.firstName, child.lastName)}</div>
        <div style={styles.cardInfo}>
          <h3 style={styles.name}>
            {child.firstName} {child.lastName}
          </h3>
          <div style={styles.meta}>
            {age !== null && <span style={styles.ageTxt}>{age} lat</span>}
            {child.pathwayStage && <span style={styles.badge}>{child.pathwayStage}</span>}
          </div>
          {coachName && (
            <div style={styles.coachTxt}>Trener: {coachName}</div>
          )}
        </div>
        <ChevronRight size={16} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
      </div>
    </div>
  )
}

/* ───────────── MyChildren (main) ───────────── */

export default function MyChildren() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showAddModal, setShowAddModal] = useState(false)
  const [editChild, setEditChild] = useState(null)
  const [deleteChild, setDeleteChild] = useState(null)

  const fetchChildren = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const { data } = await api.get('/players')
      const players = Array.isArray(data) ? data : data.players || []
      const childIds = user?.parentProfile?.children || []
      const myChildren =
        childIds.length > 0
          ? players.filter((p) => childIds.includes(p._id))
          : players
      setChildren(myChildren)
    } catch {
      setError('Nie udalo sie zaladowac listy zawodnikow')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchChildren()
  }, [fetchChildren])

  const handleSaved = () => {
    setShowAddModal(false)
    setEditChild(null)
    fetchChildren()
  }

  const handleDeleted = () => {
    setDeleteChild(null)
    fetchChildren()
  }

  /* ── spin keyframes (injected once) ── */
  useEffect(() => {
    const id = 'mychildren-spin-keyframes'
    if (document.getElementById(id)) return
    const style = document.createElement('style')
    style.id = id
    style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`
    document.head.appendChild(style)
  }, [])

  /* ── render ── */

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Zawodnicy</h1>
        {!loading && children.length > 0 && children.length < 2 && (
          <button style={styles.addBtn} onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Dodaj zawodnika
          </button>
        )}
      </div>

      {error && (
        <div style={styles.errorBox}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {loading && (
        <div style={styles.center}>
          <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
          Ladowanie...
        </div>
      )}

      {!loading && !error && children.length === 0 && (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>
            <Users size={32} />
          </div>
          <h2 style={styles.emptyTitle}>Brak zawodników</h2>
          <p style={styles.emptyDesc}>
            Dodaj swojego pierwszego zawodnika, aby rozpocząć śledzenie
            postępów tenisowych.
          </p>
          <button style={styles.addBtn} onClick={() => setShowAddModal(true)}>
            <UserPlus size={16} />
            Dodaj zawodnika
          </button>
        </div>
      )}

      {!loading && children.length > 0 && (
        <div style={styles.grid}>
          {children.map((child) => (
            <ChildCard
              key={child._id}
              child={child}
              onEdit={setEditChild}
              onDelete={setDeleteChild}
              navigate={navigate}
            />
          ))}
        </div>
      )}

      {/* Add modal */}
      {showAddModal && (
        <ChildFormModal onClose={() => setShowAddModal(false)} onSaved={handleSaved} />
      )}

      {/* Edit modal */}
      {editChild && (
        <ChildFormModal
          child={editChild}
          onClose={() => setEditChild(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirm */}
      {deleteChild && (
        <DeleteConfirmModal
          child={deleteChild}
          onClose={() => setDeleteChild(null)}
          onConfirm={handleDeleted}
        />
      )}
    </div>
  )
}
