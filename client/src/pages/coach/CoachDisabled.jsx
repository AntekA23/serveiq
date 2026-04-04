import { useNavigate } from 'react-router-dom'
import './CoachDisabled.css'

export default function CoachDisabled() {
  const navigate = useNavigate()

  return (
    <div className="coach-disabled">
      <div className="coach-disabled-card">
        <div className="coach-disabled-icon">
          <span style={{ fontSize: 36 }}>🚫</span>
        </div>
        <h1 className="coach-disabled-title">Konto trenera nieaktywne</h1>
        <p className="coach-disabled-text">
          Twoje konto trenera nie zostało jeszcze aktywowane przez administratora klubu.
        </p>
        <p className="coach-disabled-subtext">
          Skontaktuj się z administratorem klubu, aby aktywować dostęp.
        </p>
        <div className="coach-disabled-actions">
          <button
            className="coach-disabled-btn primary"
            onClick={() => navigate('/')}
          >
            Wróć do strony głównej
          </button>
        </div>
      </div>
    </div>
  )
}
