import { useState, useEffect } from 'react'
import api from '../../api/axios'

export default function CoachRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState(null)

  const fetchRequests = async () => {
    try {
      const res = await api.get('/coach-links/requests?status=pending')
      setRequests(res.data.requests)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRequests() }, [])

  const handleRespond = async (id, status) => {
    setResponding(id)
    try {
      await api.put(`/coach-links/requests/${id}`, { status })
      setRequests(prev => prev.filter(r => r._id !== id))
    } catch {
      // ignore
    } finally {
      setResponding(null)
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Ładowanie...</div>

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
        Oczekujące prośby ({requests.length})
      </h1>

      {requests.length === 0 ? (
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
          Brak oczekujących próśb.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {requests.map(req => (
            <div
              key={req._id}
              style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border-md)',
                borderRadius: 12, padding: 20
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                {req.parent?.firstName} {req.parent?.lastName}
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                {req.parent?.email}
              </div>

              <div style={{ fontSize: 13, marginBottom: 8 }}>
                <span style={{ color: 'var(--color-text-tertiary)' }}>Dzieci: </span>
                {req.players?.map(p => `${p.firstName} ${p.lastName}`).join(', ')}
              </div>

              {req.message && (
                <div style={{
                  fontSize: 13, color: 'var(--color-text-secondary)',
                  fontStyle: 'italic', marginBottom: 12,
                  padding: '8px 12px', background: 'var(--color-bg)',
                  borderRadius: 6
                }}>
                  &ldquo;{req.message}&rdquo;
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleRespond(req._id, 'accepted')}
                  disabled={responding === req._id}
                  style={{
                    flex: 1, padding: '10px 0', background: 'var(--color-accent)',
                    color: '#0B0E14', border: 'none', borderRadius: 8,
                    fontWeight: 600, fontSize: 14, cursor: 'pointer'
                  }}
                >Akceptuj</button>
                <button
                  onClick={() => handleRespond(req._id, 'rejected')}
                  disabled={responding === req._id}
                  style={{
                    flex: 1, padding: '10px 0', background: 'transparent',
                    color: 'var(--color-text)', border: '1px solid var(--color-border-md)',
                    borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer'
                  }}
                >Odrzuć</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
