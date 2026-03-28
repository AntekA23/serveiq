import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle } from 'lucide-react'
import Button from '../../components/ui/Button/Button'
import './DeviceCallback.css'

/**
 * Strona callbacku OAuth dla urządzeń wearable.
 * Wyświetlana po przekierowaniu z Garmin/WHOOP OAuth.
 *
 * Parametry URL:
 * - provider: 'garmin' | 'whoop'
 * - success: 'true' | 'false'
 * - state: stan OAuth (do weryfikacji)
 * - error: komunikat błędu (opcjonalnie)
 * - code: kod autoryzacyjny (opcjonalnie — dla flow po stronie klienta)
 */
export default function DeviceCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('')

  const provider = searchParams.get('provider') || 'nieznany'
  const success = searchParams.get('success')
  const error = searchParams.get('error')

  useEffect(() => {
    // Jeśli backend już przetworzył callback i przekierował z wynikiem
    if (success === 'true') {
      setStatus('success')
    } else if (success === 'false') {
      setStatus('error')
      setErrorMessage(error || 'Nieznany błąd autoryzacji')
    } else {
      // Brak parametru success — coś poszło nie tak
      setStatus('error')
      setErrorMessage('Nieprawidłowe parametry callbacku OAuth')
    }
  }, [success, error])

  // Automatyczne przekierowanie po 3 sekundach w przypadku sukcesu
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        navigate('/parent/devices')
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [status, navigate])

  const providerLabel = provider.toUpperCase()

  return (
    <div className="device-callback-page">
      <div className="device-callback-card">
        <div className="device-callback-provider">
          {providerLabel}
        </div>

        {status === 'loading' && (
          <>
            <div className="device-callback-icon device-callback-icon--loading">
              <div className="device-callback-spinner" />
            </div>
            <div className="device-callback-title">
              Łączenie z {providerLabel}...
            </div>
            <div className="device-callback-text">
              Trwa autoryzacja urządzenia. Proszę czekać.
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="device-callback-icon device-callback-icon--success">
              <CheckCircle size={48} />
            </div>
            <div className="device-callback-title">
              Urządzenie podłączone!
            </div>
            <div className="device-callback-text">
              Pomyślnie połączono z {providerLabel}. Dane zostaną
              automatycznie zsynchronizowane.
              Za chwilę nastąpi przekierowanie...
            </div>
            <Button
              variant="primary"
              onClick={() => navigate('/parent/devices')}
            >
              Wróć do urządzeń
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="device-callback-icon device-callback-icon--error">
              <XCircle size={48} />
            </div>
            <div className="device-callback-title">
              Błąd autoryzacji
            </div>
            <div className="device-callback-text">
              Nie udało się połączyć z {providerLabel}.
              {errorMessage && (
                <>
                  <br />
                  Szczegóły: {errorMessage}
                </>
              )}
            </div>
            <Button
              variant="primary"
              onClick={() => navigate('/parent/devices')}
            >
              Wróć do urządzeń
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
