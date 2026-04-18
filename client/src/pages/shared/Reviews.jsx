import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  FileText,
  ChevronDown,
  ChevronUp,
  Calendar,
  Filter,
  User,
  Activity,
  Clock,
} from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'

// ─── Constants ───────────────────────────────────────────────────────

const PERIOD_LABELS = {
  weekly: 'Tygodniowy',
  monthly: 'Miesięczny',
  quarterly: 'Kwartalny',
  seasonal: 'Sezonowy',
  'ad-hoc': 'Ad-hoc',
}

const STATUS_CONFIG = {
  draft: { label: 'Szkic', bg: 'rgba(234,179,8,0.12)', color: '#ca8a04' },
  published: { label: 'Opublikowany', bg: 'rgba(34,197,94,0.12)', color: '#16a34a' },
  archived: { label: 'Archiwum', bg: 'rgba(107,114,128,0.12)', color: '#6b7280' },
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

const cardStyle = {
  background: 'var(--color-bg-secondary)',
  border: '1px solid var(--color-border-md)',
  borderRadius: 12,
  marginBottom: 12,
  overflow: 'hidden',
  transition: 'box-shadow 0.15s',
}

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

const sectionBlock = (borderColor) => ({
  marginTop: 16,
  paddingLeft: 14,
  borderLeft: `3px solid ${borderColor}`,
})

const sectionTitle = {
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-text-secondary)',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
}

const sectionBody = {
  fontSize: 14,
  color: 'var(--color-text)',
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
}

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

const chipsRow = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  marginTop: 14,
}

const chip = (bg, color) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 10px',
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 600,
  background: bg,
  color: color,
})

// ─── Helpers ─────────────────────────────────────────────────────────

function formatPeriod(start, end) {
  const s = new Date(start)
  const e = new Date(end)
  const opts = { month: 'long', year: 'numeric' }
  const startStr = s.toLocaleDateString('pl-PL', opts)
  const endStr = e.toLocaleDateString('pl-PL', opts)
  // If same month, show just one
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    // Capitalize first letter
    return startStr.charAt(0).toUpperCase() + startStr.slice(1)
  }
  const capStart = startStr.charAt(0).toUpperCase() + startStr.slice(1)
  const capEnd = endStr.charAt(0).toUpperCase() + endStr.slice(1)
  return `${capStart} - ${capEnd}`
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function playerName(player) {
  if (!player) return 'Zawodnik'
  return `${player.firstName || ''} ${player.lastName || ''}`.trim() || 'Zawodnik'
}

function authorName(author) {
  if (!author) return 'Trener'
  return `${author.firstName || ''} ${author.lastName || ''}`.trim() || 'Trener'
}

// ─── Component ───────────────────────────────────────────────────────

export default function Reviews() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isCoach = user?.role === 'coach'
  const isClubAdmin = user?.role === 'clubAdmin'
  const isParent = user?.role === 'parent'

  // State
  const [reviews, setReviews] = useState([])
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  // Filters
  const [filterPlayer, setFilterPlayer] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Fetch children for parent's child selector
  const fetchPlayers = useCallback(async () => {
    try {
      const { data: raw } = await api.get('/players')
      const list = Array.isArray(raw) ? raw : raw.players || []
      if (isParent) {
        const childIds = user?.parentProfile?.children || []
        const children = list.filter((p) => childIds.includes(p._id))
        setPlayers(children)
      } else {
        setPlayers(list)
      }
    } catch {
      // silent
    }
  }, [isParent, user])

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams()
      if (filterPlayer) params.set('player', filterPlayer)
      if (filterStatus && (isCoach || isClubAdmin)) params.set('status', filterStatus)
      const qs = params.toString()
      const { data } = await api.get(`/reviews${qs ? `?${qs}` : ''}`)
      setReviews(data.reviews || [])
    } catch {
      setError('Nie udalo sie zaladowac przegladow')
    } finally {
      setLoading(false)
    }
  }, [filterPlayer, filterStatus, isCoach, isClubAdmin])

  useEffect(() => {
    fetchPlayers()
  }, [fetchPlayers])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  // Toggle expand for parent view
  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  // ─── PARENT VIEW ──────────────────────────────────────────────────

  if (isParent) {
    // Group reviews by child
    const childIds = players.map((p) => p._id)
    const filteredReviews = filterPlayer
      ? reviews.filter((r) => {
          const pid = typeof r.player === 'string' ? r.player : r.player?._id
          return pid === filterPlayer
        })
      : reviews

    return (
      <div style={pageStyle}>
        {/* Header */}
        <div style={headerRow}>
          <h1 style={pageTitleStyle}>Przeglądy</h1>
        </div>

        {/* Child selector (if multiple children) */}
        {players.length > 1 && (
          <div style={filtersRow}>
            <User size={14} style={{ color: 'var(--color-text-tertiary)' }} />
            <select
              value={filterPlayer}
              onChange={(e) => setFilterPlayer(e.target.value)}
              style={filterSelect}
            >
              <option value="">Wszyscy zawodnicy</option>
              {players.map((p) => (
                <option key={p._id} value={p._id}>
                  {playerName(p)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Loading */}
        {loading && <div style={loadingStyle}>Ladowanie przegladow...</div>}

        {/* Error */}
        {!loading && error && (
          <div style={{ ...emptyState, color: '#ef4444' }}>
            <p>{error}</p>
            <button
              onClick={fetchReviews}
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
        {!loading && !error && filteredReviews.length === 0 && (
          <div style={emptyState}>
            <FileText size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
            <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>
              Brak przegladow
            </p>
            <p style={{ fontSize: 13, margin: 0, color: 'var(--color-text-tertiary)' }}>
              Trener opublikuje je wkrotce
            </p>
          </div>
        )}

        {/* Review list */}
        {!loading &&
          !error &&
          filteredReviews.map((review) => {
            const isExpanded = expandedId === review._id
            const pName = playerName(review.player)
            const aName = authorName(review.author)
            const periodLabel = formatPeriod(review.periodStart, review.periodEnd)
            const periodBadge = PERIOD_LABELS[review.periodType] || review.periodType

            return (
              <div key={review._id} style={cardStyle}>
                {/* Card header */}
                <div style={cardHeader} onClick={() => toggleExpand(review._id)}>
                  <div style={cardHeaderLeft}>
                    <div style={cardTitleRow}>
                      {players.length > 1 && (
                        <h3 style={cardTitle}>{pName}</h3>
                      )}
                      <span style={badge('rgba(59,130,246,0.12)', '#2563eb')}>
                        {periodBadge}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
                        {periodLabel}
                      </span>
                    </div>
                    <div style={metaRow}>
                      <span style={metaItem}>
                        <User size={13} />
                        {aName}
                      </span>
                      {review.publishedAt && (
                        <span style={metaItem}>
                          <Calendar size={13} />
                          {formatDate(review.publishedAt)}
                        </span>
                      )}
                      {review.activitiesCount > 0 && (
                        <span style={metaItem}>
                          <Activity size={13} />
                          {review.activitiesCount} {review.activitiesCount === 1 ? 'aktywnosc' : review.activitiesCount < 5 ? 'aktywnosci' : 'aktywnosci'}
                        </span>
                      )}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={18} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
                  ) : (
                    <ChevronDown size={18} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
                  )}
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={expandedSection}>
                    {/* Chips row */}
                    <div style={chipsRow}>
                      {review.activitiesCount > 0 && (
                        <span style={chip('rgba(59,130,246,0.10)', '#2563eb')}>
                          <Activity size={12} />
                          {review.activitiesCount} aktywnosci
                        </span>
                      )}
                      {review.publishedAt && (
                        <span style={chip('rgba(107,114,128,0.10)', '#6b7280')}>
                          <Clock size={12} />
                          Opublikowano {formatDate(review.publishedAt)}
                        </span>
                      )}
                    </div>

                    {/* Section: whatHappened */}
                    {review.whatHappened && (
                      <div style={sectionBlock('var(--color-text-secondary, #6b7280)')}>
                        <div style={sectionTitle}>Co sie dzialo</div>
                        <div style={sectionBody}>{review.whatHappened}</div>
                      </div>
                    )}

                    {/* Section: whatWentWell - green */}
                    {review.whatWentWell && (
                      <div style={sectionBlock('#22c55e')}>
                        <div style={sectionTitle}>Co poszlo dobrze</div>
                        <div style={sectionBody}>{review.whatWentWell}</div>
                      </div>
                    )}

                    {/* Section: whatNeedsFocus - amber */}
                    {review.whatNeedsFocus && (
                      <div style={sectionBlock('#eab308')}>
                        <div style={sectionTitle}>Na czym skupic</div>
                        <div style={sectionBody}>{review.whatNeedsFocus}</div>
                      </div>
                    )}

                    {/* Section: nextSteps - accent */}
                    {review.nextSteps && (
                      <div style={sectionBlock('var(--color-accent, #3b82f6)')}>
                        <div style={sectionTitle}>Nastepne kroki</div>
                        <div style={sectionBody}>{review.nextSteps}</div>
                      </div>
                    )}

                    {/* No content at all */}
                    {!review.whatHappened && !review.whatWentWell && !review.whatNeedsFocus && !review.nextSteps && (
                      <p style={{ marginTop: 16, fontSize: 13, color: 'var(--color-text-tertiary)' }}>
                        Brak tresci w tym przegladzie.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
      </div>
    )
  }

  // ─── COACH / CLUB ADMIN VIEW ──────────────────────────────────────

  // Client-side status filter (backend already handles it, but also support client-side)
  const displayReviews = filterStatus
    ? reviews.filter((r) => r.status === filterStatus)
    : reviews

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerRow}>
        <h1 style={pageTitleStyle}>Przeglądy</h1>
        {isCoach && (
          <button style={addBtn} onClick={() => navigate('/coach/reviews/new')}>
            <Plus size={16} /> Nowy przeglad
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={filtersRow}>
        <Filter size={14} style={{ color: 'var(--color-text-tertiary)' }} />
        <select
          value={filterPlayer}
          onChange={(e) => setFilterPlayer(e.target.value)}
          style={filterSelect}
        >
          <option value="">Wszyscy zawodnicy</option>
          {players.map((p) => (
            <option key={p._id} value={p._id}>
              {playerName(p)}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={filterSelect}
        >
          <option value="">Wszystkie statusy</option>
          <option value="draft">Szkice</option>
          <option value="published">Opublikowane</option>
          <option value="archived">Archiwum</option>
        </select>
      </div>

      {/* Loading */}
      {loading && <div style={loadingStyle}>Ladowanie przegladow...</div>}

      {/* Error */}
      {!loading && error && (
        <div style={{ ...emptyState, color: '#ef4444' }}>
          <p>{error}</p>
          <button
            onClick={fetchReviews}
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
      {!loading && !error && displayReviews.length === 0 && (
        <div style={emptyState}>
          <FileText size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
          <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>
            Brak przegladow
          </p>
          <p style={{ fontSize: 13, margin: 0, color: 'var(--color-text-tertiary)' }}>
            {isCoach
              ? 'Kliknij "Nowy przeglad" aby utworzyc pierwszy.'
              : 'Przeglady pojawia sie tutaj.'}
          </p>
          {isCoach && (
            <button
              style={{ ...addBtn, marginTop: 16 }}
              onClick={() => navigate('/coach/reviews/new')}
            >
              <Plus size={16} /> Utworz pierwszy przeglad
            </button>
          )}
        </div>
      )}

      {/* Review cards */}
      {!loading &&
        !error &&
        displayReviews.map((review) => {
          const pName = playerName(review.player)
          const periodLabel = formatPeriod(review.periodStart, review.periodEnd)
          const periodBadge = PERIOD_LABELS[review.periodType] || review.periodType
          const statusCfg = STATUS_CONFIG[review.status] || STATUS_CONFIG.draft
          const dateLabel = review.publishedAt
            ? formatDate(review.publishedAt)
            : formatDate(review.updatedAt || review.createdAt)

          return (
            <div
              key={review._id}
              style={{
                ...cardStyle,
                cursor: 'pointer',
              }}
              onClick={() => navigate(`/coach/reviews/${review._id}/edit`)}
            >
              <div style={cardHeader}>
                <div style={cardHeaderLeft}>
                  <div style={cardTitleRow}>
                    <h3 style={cardTitle}>{pName}</h3>
                    <span style={badge('rgba(59,130,246,0.12)', '#2563eb')}>
                      {periodBadge}
                    </span>
                    <span style={badge(statusCfg.bg, statusCfg.color)}>
                      {statusCfg.label}
                    </span>
                  </div>
                  <div style={metaRow}>
                    <span style={{ fontSize: 14, color: 'var(--color-text)' }}>
                      {periodLabel}
                    </span>
                    <span style={metaItem}>
                      <Calendar size={13} />
                      {dateLabel}
                    </span>
                  </div>
                </div>
                <ChevronDown
                  size={18}
                  style={{
                    color: 'var(--color-text-tertiary)',
                    flexShrink: 0,
                    transform: 'rotate(-90deg)',
                  }}
                />
              </div>
            </div>
          )
        })}
    </div>
  )
}
