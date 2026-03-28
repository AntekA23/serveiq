import { useNavigate } from 'react-router-dom'
import { Construction, ArrowLeft } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import './CoachDisabled.css'

export default function CoachDisabled() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="coach-disabled">
      <div className="coach-disabled-card">
        <div className="coach-disabled-icon">
          <Construction size={48} />
        </div>
        <h1 className="coach-disabled-title">Panel trenera w przebudowie</h1>
        <p className="coach-disabled-text">
          Pracujemy nad nowa wersja platformy ServeIQ. Panel trenera jest tymczasowo
          niedostepny. Wkrotce wracamy z jeszcze lepszymi funkcjami!
        </p>
        <p className="coach-disabled-subtext">
          Jesli jestes rodzicem, zaloguj sie na swoje konto rodzica.
        </p>
        <div className="coach-disabled-actions">
          <button className="coach-disabled-btn primary" onClick={handleLogout}>
            <ArrowLeft size={16} />
            Wyloguj sie
          </button>
        </div>
      </div>
    </div>
  )
}
