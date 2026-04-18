import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Button from '../../components/ui/Button/Button'
import './CoachRequests.css'

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

  if (loading) return <div className="coach-req-loading">Ładowanie...</div>

  return (
    <div className="coach-req-page">
      <h1 className="coach-req-title">
        Oczekujące prośby ({requests.length})
      </h1>

      {requests.length === 0 ? (
        <p className="coach-req-empty">Brak oczekujących próśb.</p>
      ) : (
        <div className="coach-req-list">
          {requests.map(req => (
            <div key={req._id} className="coach-req-card">
              <div className="coach-req-name">
                {req.parent?.firstName} {req.parent?.lastName}
              </div>
              <div className="coach-req-email">{req.parent?.email}</div>

              <div className="coach-req-children">
                <span className="coach-req-children-label">Zawodnicy: </span>
                {req.players?.map(p => `${p.firstName} ${p.lastName}`).join(', ')}
              </div>

              {req.message && (
                <div className="coach-req-message">
                  &ldquo;{req.message}&rdquo;
                </div>
              )}

              <div className="coach-req-actions">
                <Button
                  variant="primary"
                  onClick={() => handleRespond(req._id, 'accepted')}
                  loading={responding === req._id}
                  className="coach-req-accept"
                >Akceptuj</Button>
                <Button
                  onClick={() => handleRespond(req._id, 'rejected')}
                  loading={responding === req._id}
                  className="coach-req-reject"
                >Odrzuć</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
