import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../../hooks/useAuth'
import useAuthStore from '../../../store/authStore'
import './DevAccountSwitcher.css'

// Seed accounts (server/src/scripts/seed.js) — all use password123.
// This widget only renders in dev (gated in App.jsx by import.meta.env.DEV),
// and performs REAL logins through the normal auth flow — no faked data.
const ACCOUNTS = [
  { group: 'Trener', email: 'coach@serveiq.pl', label: 'Trener (główny)' },
  { group: 'Rodzic', email: 'parent@serveiq.pl', label: 'Kacper / Antoni' },
  { group: 'Rodzic', email: 'parent2@serveiq.pl', label: 'Julia' },
  { group: 'Rodzic', email: 'parent3@serveiq.pl', label: 'Sonia (Anna)' },
  { group: 'Klub', email: 'admin@serveiq.pl', label: 'Admin klubu' },
  { group: 'Sztab Sonii', email: 'coach.head@serveiq.pl', label: 'Head — Marek' },
  { group: 'Sztab Sonii', email: 'coach.fitness@serveiq.pl', label: 'Fitness — Agnieszka' },
  { group: 'Sztab Sonii', email: 'coach.mental@serveiq.pl', label: 'Mental — dr Paweł' },
  { group: 'Sztab Sonii', email: 'coach.physio@serveiq.pl', label: 'Physio — Karolina' },
]

const GROUPS = ['Trener', 'Rodzic', 'Klub', 'Sztab Sonii']
const DEST = { coach: '/coach/dashboard', clubAdmin: '/club/dashboard', parent: '/parent/dashboard' }

export default function DevAccountSwitcher() {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)

  const switchTo = async (email) => {
    setBusy(email)
    setError('')
    try {
      const data = await login(email, 'password123')
      const role = data?.user?.role || useAuthStore.getState().user?.role
      navigate(DEST[role] || '/')
      setOpen(false)
    } catch (e) {
      setError(e?.response?.data?.message || 'Logowanie nieudane — czy baza działa i czy puściłeś seed?')
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="dev-switcher">
      {open && (
        <div className="dev-switcher-panel">
          <div className="dev-switcher-head">
            <span>Przełącz konto (dev)</span>
            <button className="dev-switcher-x" onClick={() => setOpen(false)} aria-label="Zamknij">×</button>
          </div>

          {currentUser && (
            <div className="dev-switcher-current">
              Zalogowany: <strong>{currentUser.email}</strong>
            </div>
          )}

          {error && <div className="dev-switcher-error">{error}</div>}

          {GROUPS.map((g) => (
            <div key={g} className="dev-switcher-group">
              <div className="dev-switcher-group-label">{g}</div>
              {ACCOUNTS.filter((a) => a.group === g).map((a) => (
                <button
                  key={a.email}
                  className={`dev-switcher-acc${currentUser?.email === a.email ? ' active' : ''}`}
                  disabled={!!busy}
                  onClick={() => switchTo(a.email)}
                >
                  {busy === a.email ? 'Logowanie…' : a.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      <button className="dev-switcher-toggle" onClick={() => setOpen((v) => !v)}>
        ⚡ DEV
      </button>
    </div>
  )
}
