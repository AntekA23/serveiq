import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronRight } from 'lucide-react'
import api from '../../api/axios'
import Button from '../../components/ui/Button/Button'
import PlayerCard from '../../components/shared/PlayerCard/PlayerCard'
import SessionItem from '../../components/shared/SessionItem/SessionItem'
import useUiStore from '../../store/uiStore'
import './Dashboard.css'

function InviteCodeCard() {
  const [code, setCode] = useState('')
  const [active, setActive] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      api.get('/coach-links/my-code'),
      api.get('/coach-links/requests?status=pending')
    ]).then(([codeRes, reqRes]) => {
      setCode(codeRes.data.inviteCode || '')
      setActive(codeRes.data.inviteActive)
      setPendingCount(reqRes.data.requests.length)
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReset = async () => {
    try {
      const res = await api.post('/coach-links/reset-code')
      setCode(res.data.inviteCode)
    } catch { /* silent */ }
  }

  const handleToggle = async () => {
    try {
      const res = await api.patch('/coach-links/toggle-code')
      setActive(res.data.inviteActive)
    } catch { /* silent */ }
  }

  if (!loaded) return null

  return (
    <div className="dashboard-section" style={{ marginBottom: 20 }}>
      <div className="dashboard-section-title">
        <span>Kod zaproszenia dla rodziców</span>
        {pendingCount > 0 && (
          <Button size="sm" onClick={() => navigate('/coach/requests')}>
            {pendingCount} oczekujących <ChevronRight size={14} />
          </Button>
        )}
      </div>
      {active ? (
        <>
          <div style={{
            fontSize: 28, fontWeight: 700, letterSpacing: 6, textAlign: 'center',
            padding: '18px 0', background: 'var(--color-bg-secondary, #1a1d24)',
            borderRadius: 8, marginBottom: 12, fontFamily: 'monospace',
            border: '1px solid var(--color-border, #2a2d35)'
          }}>{code}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="primary" size="sm" onClick={handleCopy} style={{ flex: 1 }}>
              {copied ? 'Skopiowano!' : 'Kopiuj kod'}
            </Button>
            <Button size="sm" onClick={handleReset}>Nowy kod</Button>
            <Button size="sm" onClick={handleToggle}>Wyłącz</Button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 12 }}>
            Kod jest dezaktywowany — rodzice nie mogą się dołączyć
          </p>
          <Button variant="primary" size="sm" onClick={handleToggle}>Aktywuj kod</Button>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const addToast = useUiStore((s) => s.addToast)
  const [loading, setLoading] = useState(true)
  const [players, setPlayers] = useState([])
  const [sessions, setSessions] = useState([])
  const [paymentStats, setPaymentStats] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = new Date()
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

        const [playersRes, sessionsRes, statsRes] = await Promise.all([
          api.get('/players'),
          api.get(`/sessions?month=${month}`),
          api.get('/payments/stats'),
        ])

        const playersData = playersRes.data
        setPlayers(Array.isArray(playersData) ? playersData : playersData.players || [])
        const sessionsData = sessionsRes.data
        setSessions(Array.isArray(sessionsData) ? sessionsData : sessionsData.sessions || [])
        setPaymentStats(statsRes.data.stats || statsRes.data)
      } catch (err) {
        addToast('Nie udało się pobrać danych', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [addToast])

  if (loading) {
    return (
      <div className="page-enter">
        <h1 className="page-title">Pulpit</h1>
        <p className="dashboard-loading">Ładowanie...</p>
      </div>
    )
  }

  const monthlyBreakdown = paymentStats?.monthlyBreakdown || []
  const monthlyRevenue = monthlyBreakdown.length
    ? monthlyBreakdown[0]?.total || 0
    : 0

  return (
    <div className="page-enter">
      <div className="dashboard-header">
        <h1 className="page-title">Pulpit</h1>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => navigate('/coach/sessions/new')}>
          Dodaj trening
        </Button>
      </div>

      <div className="dashboard-metrics">
        <div className="metric">
          <div className="metric-label">Zawodnicy</div>
          <div className="metric-value">{players.length}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Treningi w tym miesiącu</div>
          <div className="metric-value">{sessions.length}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Przychód miesiąca</div>
          <div className="metric-value">{monthlyRevenue} zł</div>
        </div>
        <div className="metric">
          <div className="metric-label">Oczekujące płatności</div>
          <div className="metric-value">{paymentStats?.pending?.count || 0}</div>
        </div>
      </div>

      <InviteCodeCard />

      <div className="dashboard-sections">
        <div className="dashboard-section">
          <div className="dashboard-section-title">
            <span>Ostatni zawodnicy</span>
            <Button size="sm" onClick={() => navigate('/coach/players')}>
              Zobacz wszystkich
            </Button>
          </div>
          {players.length === 0 ? (
            <p className="dashboard-empty">Brak zawodników</p>
          ) : (
            <div className="dashboard-players-grid">
              {players.slice(0, 2).map((player) => (
                <PlayerCard key={player._id} player={player} />
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-section">
          <div className="dashboard-section-title">
            <span>Ostatnie treningi</span>
            <Button size="sm" onClick={() => navigate('/coach/sessions')}>
              Zobacz wszystkie
            </Button>
          </div>
          {sessions.length === 0 ? (
            <p className="dashboard-empty">Brak treningów w tym miesiącu</p>
          ) : (
            <div className="dashboard-sessions-list">
              {sessions.slice(0, 3).map((session) => (
                <SessionItem key={session._id} session={session} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
