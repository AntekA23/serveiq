import { useState, useEffect, useCallback } from 'react'
import {
  Calendar,
  Eye,
  FileText,
  Compass,
  Pin,
  Clock,
  User,
  Loader,
} from 'lucide-react'
import api from '../../api/axios'

// ─── Source config ──────────────────────────────────────────
const SOURCE_CONFIG = {
  activity: { icon: Calendar, color: '#3b82f6', label: 'Aktywnosc' },
  observation: { icon: Eye, color: '#6b7280', label: 'Obserwacja' },
  review: { icon: FileText, color: '#6366f1', label: 'Przeglad' },
  recommendation: { icon: Compass, color: '#8b5cf6', label: 'Rekomendacja' },
}

const OBSERVATION_TYPE_COLORS = {
  progress: '#22c55e',
  concern: '#ef4444',
  highlight: '#eab308',
  general: '#6b7280',
}

const PRIORITY_COLORS = {
  high: '#ef4444',
  medium: '#eab308',
  low: '#6b7280',
}

const STATUS_LABELS = {
  scheduled: 'Zaplanowane',
  completed: 'Zakonczone',
  cancelled: 'Anulowane',
  draft: 'Szkic',
  active: 'Aktywna',
  done: 'Zrealizowana',
  dismissed: 'Odrzucona',
}

const ROLE_LABELS = {
  coach: 'Trener',
  parent: 'Rodzic',
  clubAdmin: 'Admin klubu',
}

// ─── Helpers ────────────────────────────────────────────────
function getIconColor(entry) {
  if (entry.source === 'observation') {
    return OBSERVATION_TYPE_COLORS[entry.type] || '#6b7280'
  }
  return SOURCE_CONFIG[entry.source]?.color || '#6b7280'
}

function formatRelativeDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    // Future date
    return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  if (diffDays === 0) return 'Dzis'
  if (diffDays === 1) return 'Wczoraj'
  if (diffDays === 2) return '2 dni temu'
  if (diffDays === 3) return '3 dni temu'
  if (diffDays === 4) return '4 dni temu'
  if (diffDays === 5) return '5 dni temu'
  if (diffDays === 6) return '6 dni temu'
  return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
}

function truncate(text, max = 200) {
  if (!text) return ''
  return text.length > max ? text.slice(0, max) + '...' : text
}

function formatDuration(minutes) {
  if (!minutes) return null
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

function formatPeriod(start, end) {
  if (!start && !end) return null
  const fmt = (d) => new Date(d).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })
  if (start && end) return `${fmt(start)} — ${fmt(end)}`
  if (end) return `do ${fmt(end)}`
  return `od ${fmt(start)}`
}

// ─── Dot rating (1-5) ───────────────────────────────────────
function DotRating({ label, value, color = 'var(--color-accent, #6366f1)' }) {
  if (value == null) return null
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontSize: '0.75rem',
      color: 'var(--color-text-secondary, #6b7280)',
    }}>
      <span style={{ fontWeight: 500 }}>{label}</span>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: i <= value ? color : 'var(--color-border, #e5e7eb)',
            display: 'inline-block',
          }}
        />
      ))}
    </span>
  )
}

// ─── Badge ──────────────────────────────────────────────────
function Badge({ children, color = '#6b7280', filled = false }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: 999,
      fontSize: '0.6875rem',
      fontWeight: 600,
      lineHeight: 1.4,
      background: filled ? color : `${color}18`,
      color: filled ? '#fff' : color,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}

// ─── Chip ───────────────────────────────────────────────────
function Chip({ children }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: 6,
      fontSize: '0.6875rem',
      fontWeight: 500,
      background: 'var(--color-bg-secondary, #f3f4f6)',
      color: 'var(--color-text-secondary, #6b7280)',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}

// ─── Source metadata renderers ───────────────────────────────
function ActivityMeta({ metadata }) {
  if (!metadata) return null
  const metaStyle = { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }

  return (
    <div style={metaStyle}>
      {metadata.status && (
        <Badge color={metadata.status === 'completed' ? '#22c55e' : metadata.status === 'cancelled' ? '#ef4444' : '#3b82f6'}>
          {STATUS_LABELS[metadata.status] || metadata.status}
        </Badge>
      )}
      {metadata.durationMinutes && (
        <Chip>{formatDuration(metadata.durationMinutes)}</Chip>
      )}
      {metadata.focusAreas?.length > 0 && metadata.focusAreas.map((area, i) => (
        <Chip key={i}>{area}</Chip>
      ))}
    </div>
  )
}

function ObservationMeta({ metadata }) {
  if (!metadata) return null
  const hasRating = metadata.engagement != null || metadata.effort != null || metadata.mood != null

  if (!hasRating) return null

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
      <DotRating label="Zaangazowanie" value={metadata.engagement} color="#3b82f6" />
      <DotRating label="Wysilek" value={metadata.effort} color="#22c55e" />
      <DotRating label="Nastroj" value={metadata.mood} color="#eab308" />
    </div>
  )
}

function ReviewMeta({ metadata }) {
  if (!metadata) return null
  const period = formatPeriod(metadata.periodStart, metadata.periodEnd)

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
      {period && <Chip>{period}</Chip>}
      {metadata.activitiesCount != null && (
        <Chip>{metadata.activitiesCount} aktywnosci</Chip>
      )}
    </div>
  )
}

function RecommendationMeta({ metadata }) {
  if (!metadata) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
      {metadata.priority && (
        <Badge color={PRIORITY_COLORS[metadata.priority] || '#6b7280'}>
          {metadata.priority === 'high' ? 'Wysoki' : metadata.priority === 'medium' ? 'Sredni' : 'Niski'}
        </Badge>
      )}
      {metadata.status && (
        <Badge color="#6b7280">
          {STATUS_LABELS[metadata.status] || metadata.status}
        </Badge>
      )}
    </div>
  )
}

const META_RENDERERS = {
  activity: ActivityMeta,
  observation: ObservationMeta,
  review: ReviewMeta,
  recommendation: RecommendationMeta,
}

// ─── Skeleton ───────────────────────────────────────────────
function SkeletonCard() {
  const pulseKeyframes = `
    @keyframes timeline-pulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }
  `

  const barStyle = (width, height = 12) => ({
    width,
    height,
    borderRadius: 4,
    background: 'var(--color-border, #e5e7eb)',
    animation: 'timeline-pulse 1.5s ease-in-out infinite',
  })

  return (
    <div style={{ display: 'flex', gap: 16, paddingLeft: 24 }}>
      <style>{pulseKeyframes}</style>
      <div style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: 'var(--color-border, #e5e7eb)',
        flexShrink: 0,
        animation: 'timeline-pulse 1.5s ease-in-out infinite',
      }} />
      <div style={{
        flex: 1,
        padding: 16,
        borderRadius: 10,
        border: '1px solid var(--color-border, #e5e7eb)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        <div style={barStyle('40%', 10)} />
        <div style={barStyle('70%', 14)} />
        <div style={barStyle('90%')} />
        <div style={barStyle('60%')} />
      </div>
    </div>
  )
}

// ─── Timeline Entry ─────────────────────────────────────────
function TimelineEntry({ entry }) {
  const config = SOURCE_CONFIG[entry.source] || SOURCE_CONFIG.activity
  const Icon = config.icon
  const iconColor = getIconColor(entry)
  const MetaRenderer = META_RENDERERS[entry.source]

  const cardStyle = {
    flex: 1,
    padding: '14px 16px',
    borderRadius: 10,
    border: '1px solid var(--color-border, #e5e7eb)',
    background: entry.pinned
      ? 'var(--color-accent-muted, #eef2ff)'
      : 'var(--color-surface, #fff)',
    transition: 'box-shadow 0.15s',
  }

  return (
    <div style={{ display: 'flex', gap: 16, paddingLeft: 24, position: 'relative' }}>
      {/* Icon circle */}
      <div style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: `${iconColor}18`,
        border: `2px solid ${iconColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
        zIndex: 1,
      }}>
        <Icon size={16} style={{ color: iconColor }} />
      </div>

      {/* Card */}
      <div style={cardStyle}>
        {/* Top row: date + pin */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 4,
        }}>
          <span style={{
            fontSize: '0.75rem',
            color: 'var(--color-text-tertiary, #9ca3af)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <Clock size={12} />
            {formatRelativeDate(entry.date)}
          </span>
          {entry.pinned && (
            <Pin size={14} style={{ color: 'var(--color-accent, #6366f1)' }} />
          )}
        </div>

        {/* Title */}
        <div style={{
          fontWeight: 700,
          fontSize: '0.9375rem',
          color: 'var(--color-text, #111827)',
          lineHeight: 1.3,
          marginBottom: 4,
        }}>
          {entry.title}
        </div>

        {/* Summary */}
        {entry.summary && (
          <div style={{
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary, #6b7280)',
            lineHeight: 1.5,
            marginBottom: 4,
          }}>
            {truncate(entry.summary)}
          </div>
        )}

        {/* Author */}
        {entry.author && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.75rem',
            color: 'var(--color-text-tertiary, #9ca3af)',
            marginTop: 4,
          }}>
            <User size={12} />
            <span>{entry.author.name}</span>
            {entry.author.role && (
              <Badge color="#6366f1">
                {ROLE_LABELS[entry.author.role] || entry.author.role}
              </Badge>
            )}
          </div>
        )}

        {/* Source-specific metadata */}
        {MetaRenderer && <MetaRenderer metadata={entry.metadata} />}
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────
export default function PlayerTimeline({ playerId, limit = 20 }) {
  const [entries, setEntries] = useState([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  const fetchTimeline = useCallback(async (currentOffset = 0, append = false) => {
    if (!playerId) return
    try {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }

      const { data } = await api.get(`/timeline?player=${playerId}&limit=${limit}&offset=${currentOffset}`)
      const items = data.timeline || []

      if (append) {
        setEntries((prev) => [...prev, ...items])
      } else {
        setEntries(items)
      }
      setTotal(data.total || 0)
      setOffset(currentOffset + items.length)
    } catch {
      if (!append) setError('Nie udalo sie zaladowac osi czasu')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [playerId, limit])

  useEffect(() => {
    setEntries([])
    setOffset(0)
    setTotal(0)
    setError('')
    fetchTimeline(0, false)
  }, [fetchTimeline])

  const handleLoadMore = () => {
    fetchTimeline(offset, true)
  }

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>
        {/* Timeline line */}
        <div style={{
          position: 'absolute',
          left: 41,
          top: 18,
          bottom: 18,
          width: 2,
          background: 'var(--color-border, #e5e7eb)',
        }} />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  // ── Error ──
  if (error) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '2rem 1rem',
        color: 'var(--color-text-secondary, #6b7280)',
        fontSize: '0.875rem',
      }}>
        {error}
      </div>
    )
  }

  // ── Empty state ──
  if (entries.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem 1rem',
        color: 'var(--color-text-secondary, #6b7280)',
      }}>
        <Calendar size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
        <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Brak wpisow na osi czasu</div>
        <div style={{ fontSize: '0.8125rem', marginTop: 4 }}>
          Aktywnosci, obserwacje i przeglady pojawia sie tutaj
        </div>
      </div>
    )
  }

  // ── Timeline ──
  const hasMore = entries.length < total

  return (
    <div style={{ position: 'relative' }}>
      {/* Vertical timeline line */}
      <div style={{
        position: 'absolute',
        left: 41,
        top: 18,
        bottom: hasMore ? 70 : 18,
        width: 2,
        background: 'var(--color-border, #e5e7eb)',
        zIndex: 0,
      }} />

      {/* Entries */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'relative' }}>
        {entries.map((entry) => (
          <TimelineEntry key={`${entry.source}-${entry.id}`} entry={entry} />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 24px',
              borderRadius: 8,
              border: '1px solid var(--color-border, #e5e7eb)',
              background: 'var(--color-surface, #fff)',
              color: 'var(--color-text, #111827)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: loadingMore ? 'wait' : 'pointer',
              opacity: loadingMore ? 0.6 : 1,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { if (!loadingMore) e.currentTarget.style.background = 'var(--color-bg-secondary, #f3f4f6)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-surface, #fff)' }}
          >
            {loadingMore ? (
              <>
                <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Ladowanie...
              </>
            ) : (
              `Zaladuj wiecej (${entries.length} z ${total})`
            )}
          </button>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </div>
  )
}
