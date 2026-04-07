import { useState, useEffect, useRef } from 'react'
import {
  Loader2, Search, Plus, Trash2, Users, Mail, Award,
  Copy, X, UserPlus,
} from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import Avatar from '../../components/ui/Avatar'

export default function CoachesList() {
  const user = useAuthStore((s) => s.user)
  const clubId = user?.club && typeof user.club === 'object' ? user.club._id : user?.club

  const [coaches, setCoaches] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteCode, setInviteCode] = useState('')
  const [copied, setCopied] = useState(false)

  // Search state
  const [showSearch, setShowSearch] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState(null)
  const [removing, setRemoving] = useState(null)
  const searchTimeout = useRef(null)

  const fetchCoaches = async () => {
    try {
      const { data } = await api.get(`/clubs/${clubId}/coaches`)
      setCoaches(data.coaches || [])
    } catch { /* silent */ }
  }

  useEffect(() => {
    if (!clubId) { setLoading(false); return }
    Promise.all([
      fetchCoaches(),
      api.get(`/clubs/${clubId}/invite-code`)
        .then(({ data }) => setInviteCode(data.inviteCode || ''))
        .catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [clubId])

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([])
      return
    }
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const { data } = await api.get(`/clubs/${clubId}/search-coaches?q=${encodeURIComponent(query)}`)
        setResults(data.coaches || [])
      } catch { setResults([]) }
      setSearching(false)
    }, 300)
    return () => clearTimeout(searchTimeout.current)
  }, [query, clubId])

  const handleAdd = async (coachId) => {
    setAdding(coachId)
    try {
      await api.post(`/clubs/${clubId}/coaches`, { coachId })
      await fetchCoaches()
      setResults((prev) => prev.filter((c) => c._id !== coachId))
    } catch { /* silent */ }
    setAdding(null)
  }

  const handleRemove = async (coachId) => {
    setRemoving(coachId)
    try {
      await api.delete(`/clubs/${clubId}/coaches/${coachId}`)
      setCoaches((prev) => prev.filter((c) => c._id !== coachId))
    } catch { /* silent */ }
    setRemoving(null)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-accent)' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!clubId) {
    return (
      <div style={{ padding: '2rem', color: 'var(--color-text-secondary)' }}>
        Nie przypisano klubu do tego konta.
      </div>
    )
  }

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
            Trenerzy
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
            {coaches.length} {coaches.length === 1 ? 'trener' : coaches.length < 5 ? 'trenerów' : 'trenerów'} w klubie
          </p>
        </div>
        <button
          onClick={() => setShowSearch(!showSearch)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '0.6rem 1.2rem', borderRadius: 8, border: 'none',
            background: 'var(--color-accent)', color: '#0B0E14',
            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
          }}
        >
          <UserPlus size={16} />
          Dodaj trenera
        </button>
      </div>

      {/* Invite code banner */}
      {inviteCode && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '0.75rem 1rem',
          borderRadius: 10, marginBottom: '1.5rem',
          background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
          flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 2 }}>
              Kod zaproszenia klubu — trenerzy mogą dołączyć samodzielnie
            </div>
            <span style={{
              fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700,
              color: 'var(--color-accent)', letterSpacing: 2,
            }}>
              {inviteCode}
            </span>
          </div>
          <button
            onClick={handleCopy}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0.4rem 0.8rem', borderRadius: 6, border: 'none',
              background: copied ? 'var(--color-green-bg)' : 'var(--color-bg-tertiary)',
              color: copied ? 'var(--color-green)' : 'var(--color-text-secondary)',
              fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Copy size={14} />
            {copied ? 'Skopiowano!' : 'Kopiuj'}
          </button>
        </div>
      )}

      {/* Search panel */}
      {showSearch && (
        <div style={{
          background: 'var(--color-bg-secondary)', borderRadius: 12,
          border: '1px solid var(--color-accent)', padding: '1.25rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
              Wyszukaj trenera w systemie
            </h2>
            <button
              onClick={() => { setShowSearch(false); setQuery(''); setResults([]) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search size={16} style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--color-text-tertiary)',
            }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj po imieniu, nazwisku lub emailu..."
              autoFocus
              style={{
                width: '100%', padding: '0.6rem 0.6rem 0.6rem 36px', borderRadius: 8,
                border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                color: 'var(--color-text)', fontSize: '0.9rem',
              }}
            />
            {searching && (
              <Loader2 size={16} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                animation: 'spin 1s linear infinite', color: 'var(--color-accent)',
              }} />
            )}
          </div>

          {query.length >= 2 && results.length === 0 && !searching && (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-tertiary)', margin: 0 }}>
              Nie znaleziono trenerów pasujących do "{query}"
            </p>
          )}

          {results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {results.map((coach) => (
                <div key={coach._id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '0.6rem 0.75rem',
                  background: 'var(--color-bg)', borderRadius: 8, border: '1px solid var(--color-border)',
                }}>
                  <Avatar
                    firstName={coach.firstName}
                    lastName={coach.lastName}
                    size={36}
                    role="coach"
                    src={coach.avatarUrl}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.9rem' }}>
                      {coach.firstName} {coach.lastName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      {coach.email}
                      {coach.coachProfile?.specialization && ` · ${coach.coachProfile.specialization}`}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAdd(coach._id)}
                    disabled={adding === coach._id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '0.4rem 0.8rem', borderRadius: 6, border: 'none',
                      background: 'var(--color-accent)', color: '#0B0E14',
                      fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                      opacity: adding === coach._id ? 0.5 : 1,
                    }}
                  >
                    {adding === coach._id ? (
                      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Plus size={14} />
                    )}
                    Dodaj
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Coaches list */}
      {coaches.length === 0 ? (
        <div style={{
          padding: '3rem', textAlign: 'center',
          background: 'var(--color-bg-secondary)', borderRadius: 12,
          border: '1px solid var(--color-border)',
        }}>
          <Users size={40} style={{ color: 'var(--color-text-tertiary)', marginBottom: 12 }} />
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Brak trenerów w klubie. Dodaj trenera przyciskiem powyżej lub udostępnij kod zaproszenia.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {coaches.map((coach) => (
            <div key={coach._id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '1rem 1.25rem',
              background: 'var(--color-bg-secondary)', borderRadius: 12,
              border: '1px solid var(--color-border)',
            }}>
              <Avatar
                firstName={coach.firstName}
                lastName={coach.lastName}
                size={44}
                role="coach"
                src={coach.avatarUrl}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '1rem' }}>
                  {coach.firstName} {coach.lastName}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    <Mail size={12} /> {coach.email}
                  </span>
                  {coach.coachProfile?.specialization && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      <Award size={12} /> {coach.coachProfile.specialization}
                    </span>
                  )}
                  {coach.coachProfile?.itfLevel && (
                    <span style={{
                      fontSize: '0.7rem', padding: '1px 8px', borderRadius: 6,
                      background: 'var(--color-accent-muted)', color: 'var(--color-accent)', fontWeight: 600,
                    }}>
                      {coach.coachProfile.itfLevel}
                    </span>
                  )}
                </div>
              </div>

              {/* Player count */}
              <div style={{ textAlign: 'center', minWidth: 60 }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  {coach.playerCount || 0}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                  zawodników
                </div>
              </div>

              {/* Remove */}
              <button
                onClick={() => handleRemove(coach._id)}
                disabled={removing === coach._id}
                title="Usuń z klubu"
                style={{
                  width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(239,68,68,0.1)', color: '#EF4444',
                  opacity: removing === coach._id ? 0.5 : 1,
                }}
              >
                {removing === coach._id ? (
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Trash2 size={14} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
