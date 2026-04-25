import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Plus, UserPlus } from 'lucide-react'
import api from '../../api/axios'
import CoachingTeamSection from '../../components/player/CoachingTeamSection'
import './Team.css'

export default function Team() {
  const navigate = useNavigate()
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    api.get('/players')
      .then(({ data }) => {
        if (!alive) return
        const list = Array.isArray(data) ? data : data.players || []
        setChildren(list)
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  if (loading) {
    return (
      <div className="team-page">
        <div className="team-loading">Ładuję zespół...</div>
      </div>
    )
  }

  const totalCoaches = children.reduce((sum, c) => sum + (c.coaches?.length || (c.coach ? 1 : 0)), 0)

  return (
    <div className="team-page">
      <header className="team-header">
        <div className="team-header-info">
          <Users size={26} />
          <div>
            <h1>Zespół</h1>
            <p>Trenerzy i specjaliści pracujący z Twoim zawodnikiem</p>
          </div>
        </div>
        <button className="team-add-btn" onClick={() => navigate('/parent/add-coach')}>
          <Plus size={16} /> Dodaj trenera
        </button>
      </header>

      {children.length === 0 ? (
        <div className="team-empty">
          <UserPlus size={32} />
          <h2>Brak zawodników</h2>
          <p>Najpierw dodaj zawodnika, aby zarządzać jego zespołem trenerów.</p>
        </div>
      ) : totalCoaches === 0 ? (
        <div className="team-empty">
          <UserPlus size={32} />
          <h2>Brak trenerów</h2>
          <p>Dodaj pierwszego trenera za pomocą kodu zaproszenia, aby rozpocząć współpracę.</p>
          <button className="team-empty-cta" onClick={() => navigate('/parent/add-coach')}>
            <Plus size={16} /> Dodaj trenera
          </button>
        </div>
      ) : (
        children.map((child) => {
          const allCoaches = []
          if (child.coach) {
            const inArray = (child.coaches || []).some((c) => c._id === child.coach._id || c._id === child.coach)
            if (!inArray && typeof child.coach === 'object') {
              allCoaches.push(child.coach)
            }
          }
          (child.coaches || []).forEach((c) => allCoaches.push(c))

          if (allCoaches.length === 0) {
            return (
              <section key={child._id} className="team-child-section">
                <h2 className="team-child-name">{child.firstName} {child.lastName}</h2>
                <div className="team-child-empty">
                  Brak przypisanych trenerów dla tego zawodnika.
                </div>
              </section>
            )
          }

          return (
            <section key={child._id} className="team-child-section">
              <h2 className="team-child-name">
                {child.firstName} {child.lastName}
                <span className="team-child-count">{allCoaches.length} {allCoaches.length === 1 ? 'trener' : 'trenerów'}</span>
              </h2>
              <CoachingTeamSection coaches={allCoaches} />
            </section>
          )
        })
      )}
    </div>
  )
}
