import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'

export default function AddCoach() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [code, setCode] = useState('')
  const [coach, setCoach] = useState(null)
  const [children, setChildren] = useState([])
  const [selectedChildren, setSelectedChildren] = useState([])
  const [message, setMessage] = useState('')
  const [step, setStep] = useState('code')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/players').then(res => {
      const parentChildren = user?.parentProfile?.children || []
      const mine = res.data.filter(p => parentChildren.includes(p._id))
      setChildren(mine)
    }).catch(() => {})
  }, [user])

  const handleValidateCode = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await api.get(`/coach-links/validate?code=${code.trim()}`)
      setCoach(res.data.coach)
      setStep('select')
    } catch (err) {
      setError(err.response?.data?.error || 'Nieprawidłowy kod')
    } finally {
      setLoading(false)
    }
  }

  const toggleChild = (id) => {
    setSelectedChildren(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    if (!selectedChildren.length) {
      setError('Wybierz przynajmniej jedno dziecko')
      return
    }
    setError('')
    setLoading(true)
    try {
      await api.post('/coach-links/join', {
        code: code.trim(),
        playerIds: selectedChildren,
        message
      })
      setStep('sent')
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd wysyłania prośby')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Dodaj trenera</h1>

      {error && (
        <div style={{
          background: 'var(--color-error-bg, #2a1215)',
          color: 'var(--color-error, #f87171)',
          padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14
        }}>{error}</div>
      )}

      {step === 'code' && (
        <>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 16, fontSize: 14 }}>
            Wpisz kod zaproszenia otrzymany od trenera
          </p>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="np. ABCD1234"
            maxLength={8}
            style={{
              width: '100%', padding: '12px 14px', fontSize: 18, letterSpacing: 4,
              textAlign: 'center', fontWeight: 700, textTransform: 'uppercase',
              background: 'var(--color-bg-secondary)', color: 'var(--color-text)',
              border: '1px solid var(--color-border-md)', borderRadius: 8,
              marginBottom: 16, boxSizing: 'border-box'
            }}
          />
          <button
            onClick={handleValidateCode}
            disabled={code.length < 4 || loading}
            style={{
              width: '100%', padding: '12px 0', background: 'var(--color-accent)',
              color: '#0B0E14', border: 'none', borderRadius: 8, fontWeight: 600,
              fontSize: 15, cursor: code.length < 4 ? 'not-allowed' : 'pointer',
              opacity: code.length < 4 ? 0.5 : 1
            }}
          >
            {loading ? 'Sprawdzanie...' : 'Sprawdź kod'}
          </button>
        </>
      )}

      {step === 'select' && coach && (
        <>
          <div style={{
            background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-md)',
            borderRadius: 12, padding: 20, marginBottom: 20
          }}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>
              {coach.firstName} {coach.lastName}
            </div>
            {coach.specialization && (
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                {coach.specialization}
              </div>
            )}
            {coach.itfLevel && (
              <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                ITF: {coach.itfLevel}
              </div>
            )}
            {coach.bio && (
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 8 }}>
                {coach.bio}
              </p>
            )}
          </div>

          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
            Wybierz dzieci do przypisania:
          </h3>

          {children.length === 0 ? (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
              Najpierw dodaj dziecko w panelu.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {children.map(child => (
                <label
                  key={child._id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    background: selectedChildren.includes(child._id)
                      ? 'var(--color-accent-muted)' : 'var(--color-bg-secondary)',
                    border: `1px solid ${selectedChildren.includes(child._id)
                      ? 'var(--color-accent)' : 'var(--color-border-md)'}`,
                    borderRadius: 8, cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedChildren.includes(child._id)}
                    onChange={() => toggleChild(child._id)}
                  />
                  <span style={{ fontWeight: 600 }}>{child.firstName} {child.lastName}</span>
                </label>
              ))}
            </div>
          )}

          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Wiadomość do trenera (opcjonalnie)"
            maxLength={500}
            rows={3}
            style={{
              width: '100%', padding: '10px 14px', fontSize: 14, resize: 'vertical',
              background: 'var(--color-bg-secondary)', color: 'var(--color-text)',
              border: '1px solid var(--color-border-md)', borderRadius: 8,
              marginBottom: 16, boxSizing: 'border-box'
            }}
          />

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => { setStep('code'); setCoach(null); setError('') }}
              style={{
                flex: 1, padding: '12px 0', background: 'transparent',
                color: 'var(--color-text)', border: '1px solid var(--color-border-md)',
                borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer'
              }}
            >Wstecz</button>
            <button
              onClick={handleSubmit}
              disabled={!selectedChildren.length || loading}
              style={{
                flex: 2, padding: '12px 0', background: 'var(--color-accent)',
                color: '#0B0E14', border: 'none', borderRadius: 8, fontWeight: 600,
                fontSize: 15, cursor: !selectedChildren.length ? 'not-allowed' : 'pointer',
                opacity: !selectedChildren.length ? 0.5 : 1
              }}
            >
              {loading ? 'Wysyłanie...' : 'Wyślij prośbę'}
            </button>
          </div>
        </>
      )}

      {step === 'sent' && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Prośba wysłana!</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 24 }}>
            Trener otrzyma powiadomienie. Poczekaj na akceptację.
          </p>
          <button
            onClick={() => navigate('/parent/dashboard')}
            style={{
              padding: '12px 32px', background: 'var(--color-accent)',
              color: '#0B0E14', border: 'none', borderRadius: 8,
              fontWeight: 600, fontSize: 15, cursor: 'pointer'
            }}
          >Wróć do panelu</button>
        </div>
      )}
    </div>
  )
}
