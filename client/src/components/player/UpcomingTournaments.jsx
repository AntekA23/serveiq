import { useEffect, useState } from 'react'
import { Calendar, MapPin } from 'lucide-react'
import api from '../../api/axios'
import './UpcomingTournaments.css'

const STATUS_LABEL = {
  planned: 'Zaplanowany',
  active: 'W trakcie',
  completed: 'Zakończony',
  cancelled: 'Odwołany',
}

export default function UpcomingTournaments({ playerId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    api.get(`/tournaments?player=${playerId}&status=planned`)
      .then((res) => {
        if (!alive) return
        const list = res.data.tournaments || []
        const now = new Date()
        setItems(
          list
            .filter((t) => new Date(t.startDate) >= now)
            .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
            .slice(0, 3)
        )
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [playerId])

  if (loading) return null
  if (!items.length) return null

  return (
    <section className="ut-section">
      <header className="ut-header">
        <Calendar size={20} />
        <h2>Plan turniejowy</h2>
      </header>
      <div className="ut-list">
        {items.map((t) => (
          <article key={t._id} className="ut-card">
            <div className="ut-date">
              <div className="ut-day">{new Date(t.startDate).getDate()}</div>
              <div className="ut-month">{new Date(t.startDate).toLocaleDateString('pl-PL', { month: 'short' })}</div>
            </div>
            <div className="ut-body">
              <div className="ut-name">{t.name}</div>
              <div className="ut-meta">
                <MapPin size={12} /> {t.location}
                {t.category && <> · {t.category}</>}
              </div>
            </div>
            <div className="ut-status">{STATUS_LABEL[t.status] || t.status}</div>
          </article>
        ))}
      </div>
    </section>
  )
}
