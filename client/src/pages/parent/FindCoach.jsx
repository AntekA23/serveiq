import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Send, CheckCircle, Clock, ArrowLeft, UserPlus } from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import Button from '../../components/ui/Button/Button'
import useToast from '../../hooks/useToast'
import './FindCoach.css'

export default function FindCoach() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const toast = useToast()

  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [search, setSearch] = useState('')
  const [coaches, setCoaches] = useState([])
  const [searching, setSearching] = useState(false)
  const [sending, setSending] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/players')
        const players = Array.isArray(data) ? data : data.players || []
        const childIds = user?.parentProfile?.children || []
        const myChildren = childIds.length > 0
          ? players.filter((p) => childIds.includes(p._id))
          : players
        setChildren(myChildren)
        // Pre-select first child without a coach
        const noCoach = myChildren.find((c) => !c.coach)
        if (noCoach) setSelectedChild(noCoach)
        else if (myChildren.length > 0) setSelectedChild(myChildren[0])
      } catch { /* silent */ }
      setLoading(false)
    }
    fetch()
  }, [user])

  const handleSearch = async () => {
    if (search.trim().length < 2) return
    setSearching(true)
    try {
      const { data } = await api.get(`/players/coaches/search?q=${encodeURIComponent(search)}`)
      setCoaches(data.coaches || [])
    } catch {
      toast.error('Blad wyszukiwania')
    }
    setSearching(false)
  }

  const handleRequest = async (coachId) => {
    if (!selectedChild) {
      toast.error('Wybierz zawodnika')
      return
    }
    if (selectedChild.coach) {
      toast.error('Ten zawodnik ma juz trenera')
      return
    }
    setSending(coachId)
    try {
      await api.post(`/players/${selectedChild._id}/request-coach`, {
        coachId,
        message: message || undefined,
      })
      toast.success('Prosba wyslana do trenera!')
      // Refresh child data
      const { data } = await api.get(`/players/${selectedChild._id}`)
      const updated = data.player || data
      setSelectedChild(updated)
      setChildren((prev) => prev.map((c) => c._id === updated._id ? updated : c))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Nie udalo sie wyslac prosby')
    }
    setSending(null)
  }

  const childHasPendingRequest = selectedChild?.coachRequest?.status === 'pending'
  const childHasCoach = !!selectedChild?.coach

  if (loading) {
    return <div className="fc-page"><div className="fc-loading">Ladowanie...</div></div>
  }

  return (
    <div className="fc-page">
      <button className="fc-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Powrot
      </button>

      <h1 className="page-title">Znajdz trenera</h1>

      {/* Child selector */}
      {children.length > 1 && (
        <div className="fc-child-select">
          <label>Zawodnik:</label>
          <select value={selectedChild?._id || ''} onChange={(e) => {
            const c = children.find((ch) => ch._id === e.target.value)
            setSelectedChild(c)
          }}>
            {children.map((c) => (
              <option key={c._id} value={c._id}>
                {c.firstName} {c.lastName} {c.coach ? '(ma trenera)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Status */}
      {childHasCoach && (
        <div className="fc-status fc-status-ok">
          <CheckCircle size={16} />
          {selectedChild.firstName} ma juz przypisanego trenera
        </div>
      )}
      {childHasPendingRequest && (
        <div className="fc-status fc-status-pending">
          <Clock size={16} />
          Prosba o dolaczenie wyslana — oczekuje na akceptacje trenera
        </div>
      )}

      {/* Search */}
      {!childHasCoach && !childHasPendingRequest && (
        <>
          <div className="fc-search-bar">
            <Search size={16} />
            <input
              placeholder="Szukaj trenera po nazwisku lub klubie..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button size="sm" onClick={handleSearch} loading={searching}>
              Szukaj
            </Button>
          </div>

          {/* Optional message */}
          <div className="fc-message">
            <label>Wiadomosc do trenera (opcjonalnie):</label>
            <input
              placeholder="np. Chcielibysmy dolaczyc do treningow..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {/* Results */}
          <div className="fc-results">
            {coaches.length === 0 && search.length >= 2 && !searching && (
              <div className="fc-empty">Nie znaleziono trenerow</div>
            )}
            {coaches.map((c) => (
              <div key={c._id} className="fc-coach-card">
                <div className="fc-coach-info">
                  <span className="fc-coach-name">{c.firstName} {c.lastName}</span>
                  {c.coachProfile?.club && <span className="fc-coach-club">{c.coachProfile.club}</span>}
                  {c.coachProfile?.bio && <span className="fc-coach-bio">{c.coachProfile.bio}</span>}
                </div>
                <Button variant="primary" size="sm" onClick={() => handleRequest(c._id)} loading={sending === c._id}>
                  <Send size={12} /> Wyslij prosbe
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
