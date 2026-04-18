import { useState, useEffect } from 'react'
import { Clock, ChevronDown, Users } from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import PlayerTimeline from '../../components/player/PlayerTimeline'
import Avatar from '../../components/ui/Avatar/Avatar'

// ─── Styles ─────────────────────────────────────────────────
const pageStyle = {
  padding: '1.5rem',
  maxWidth: 800,
}

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: '1.25rem',
}

const titleStyle = {
  fontSize: '1.5rem',
  fontWeight: 700,
  color: 'var(--color-text, #111827)',
  margin: 0,
}

const tabBarStyle = {
  display: 'flex',
  gap: 4,
  marginBottom: '1.25rem',
  borderBottom: '2px solid var(--color-border, #e5e7eb)',
  overflowX: 'auto',
}

const tabStyle = (active) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '10px 16px',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: active ? 700 : 500,
  color: active ? 'var(--color-accent, #6366f1)' : 'var(--color-text-secondary, #6b7280)',
  borderBottom: active ? '2px solid var(--color-accent, #6366f1)' : '2px solid transparent',
  marginBottom: -2,
  whiteSpace: 'nowrap',
  transition: 'color 0.15s, border-color 0.15s',
})

const dropdownWrapStyle = {
  position: 'relative',
  marginBottom: '1.25rem',
}

const dropdownBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 16px',
  borderRadius: 10,
  border: '1px solid var(--color-border, #e5e7eb)',
  background: 'var(--color-surface, #fff)',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: 'var(--color-text, #111827)',
  width: '100%',
  maxWidth: 360,
  justifyContent: 'space-between',
}

const dropdownListStyle = (open) => ({
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  maxWidth: 360,
  marginTop: 4,
  background: 'var(--color-surface, #fff)',
  border: '1px solid var(--color-border, #e5e7eb)',
  borderRadius: 10,
  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
  zIndex: 50,
  maxHeight: 320,
  overflowY: 'auto',
  display: open ? 'block' : 'none',
})

const dropdownItemStyle = (active) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 14px',
  cursor: 'pointer',
  fontSize: '0.8125rem',
  fontWeight: active ? 700 : 500,
  color: active ? 'var(--color-accent, #6366f1)' : 'var(--color-text, #111827)',
  background: active ? 'var(--color-accent-muted, #eef2ff)' : 'transparent',
  transition: 'background 0.1s',
  borderBottom: '1px solid var(--color-border, #e5e7eb)',
})

const emptyStyle = {
  textAlign: 'center',
  padding: '3rem 1rem',
  color: 'var(--color-text-secondary, #6b7280)',
}

const loadingStyle = {
  textAlign: 'center',
  padding: '2rem',
  color: 'var(--color-text-secondary, #6b7280)',
  fontSize: '0.875rem',
}

// ─── Player Dropdown (for coach / clubAdmin) ────────────────
function PlayerDropdown({ players, selectedId, onSelect }) {
  const [open, setOpen] = useState(false)
  const selected = players.find((p) => p._id === selectedId)

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    const handler = () => setOpen(false)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [open])

  return (
    <div style={dropdownWrapStyle}>
      <button
        style={dropdownBtnStyle}
        onClick={(e) => { e.stopPropagation(); setOpen((prev) => !prev) }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {selected ? (
            <>
              <Avatar firstName={selected.firstName} lastName={selected.lastName} size={24} role="player" />
              {selected.firstName} {selected.lastName}
            </>
          ) : (
            <>
              <Users size={16} />
              Wybierz zawodnika
            </>
          )}
        </span>
        <ChevronDown size={16} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
      <div style={dropdownListStyle(open)}>
        {players.map((p) => (
          <div
            key={p._id}
            style={dropdownItemStyle(p._id === selectedId)}
            onClick={() => { onSelect(p._id); setOpen(false) }}
            onMouseEnter={(e) => { if (p._id !== selectedId) e.currentTarget.style.background = 'var(--color-bg-secondary, #f3f4f6)' }}
            onMouseLeave={(e) => { if (p._id !== selectedId) e.currentTarget.style.background = 'transparent' }}
          >
            <Avatar firstName={p.firstName} lastName={p.lastName} size={24} role="player" />
            <span>{p.firstName} {p.lastName}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Child Tabs (for parent with multiple children) ─────────
function ChildTabs({ children, selectedId, onSelect }) {
  return (
    <div style={tabBarStyle}>
      {children.map((child) => (
        <button
          key={child._id}
          style={tabStyle(child._id === selectedId)}
          onClick={() => onSelect(child._id)}
        >
          <Avatar firstName={child.firstName} lastName={child.lastName} size={22} role="player" />
          {child.firstName}
        </button>
      ))}
    </div>
  )
}

// ─── Main Page Component ────────────────────────────────────
export default function Timeline() {
  const user = useAuthStore((s) => s.user)
  const role = user?.role
  const [players, setPlayers] = useState([])
  const [selectedPlayerId, setSelectedPlayerId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true)
        const { data: raw } = await api.get('/players')
        const list = Array.isArray(raw) ? raw : raw.players || []

        if (role === 'parent') {
          const childIds = user?.parentProfile?.children || []
          const myChildren = childIds.length > 0
            ? list.filter((p) => childIds.includes(p._id))
            : list
          setPlayers(myChildren)
          if (myChildren.length > 0) {
            setSelectedPlayerId(myChildren[0]._id)
          }
        } else {
          // coach or clubAdmin
          setPlayers(list)
          if (list.length > 0) {
            setSelectedPlayerId(list[0]._id)
          }
        }
      } catch {
        // silent — empty state will show
      } finally {
        setLoading(false)
      }
    }

    fetchPlayers()
  }, [role, user?.parentProfile?.children])

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={headerStyle}>
          <Clock size={24} style={{ color: 'var(--color-accent, #6366f1)' }} />
          <h1 style={titleStyle}>Historia</h1>
        </div>
        <div style={loadingStyle}>Ladowanie...</div>
      </div>
    )
  }

  if (players.length === 0) {
    return (
      <div style={pageStyle}>
        <div style={headerStyle}>
          <Clock size={24} style={{ color: 'var(--color-accent, #6366f1)' }} />
          <h1 style={titleStyle}>Historia</h1>
        </div>
        <div style={emptyStyle}>
          <Users size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
            {role === 'parent' ? 'Nie znaleziono dzieci' : 'Brak zawodnikow'}
          </div>
          <div style={{ fontSize: '0.8125rem', marginTop: 4 }}>
            {role === 'parent'
              ? 'Dodaj zawodnika, aby zobaczyć historię'
              : 'Dodaj zawodnika, aby zobaczyc os czasu'}
          </div>
        </div>
      </div>
    )
  }

  // Parent with single child — show timeline directly
  const isParentSingle = role === 'parent' && players.length === 1
  // Parent with multiple children — tabs
  const isParentMulti = role === 'parent' && players.length > 1
  // Coach / clubAdmin — dropdown
  const isSelector = role === 'coach' || role === 'clubAdmin'

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <Clock size={24} style={{ color: 'var(--color-accent, #6366f1)' }} />
        <h1 style={titleStyle}>Historia</h1>
      </div>

      {/* Parent multi-child tabs */}
      {isParentMulti && (
        <ChildTabs
          children={players}
          selectedId={selectedPlayerId}
          onSelect={setSelectedPlayerId}
        />
      )}

      {/* Coach / clubAdmin dropdown */}
      {isSelector && (
        <PlayerDropdown
          players={players}
          selectedId={selectedPlayerId}
          onSelect={setSelectedPlayerId}
        />
      )}

      {/* Timeline */}
      {selectedPlayerId && (
        <PlayerTimeline key={selectedPlayerId} playerId={selectedPlayerId} />
      )}
    </div>
  )
}
