import { useNavigate } from 'react-router-dom'
import { Users, MessageCircle } from 'lucide-react'
import './CoachingTeamSection.css'

const ROLE_BADGE = {
  head: { label: 'Trener główny', emoji: '🎾', color: '#3b82f6' },
  assistant: { label: 'Asystent', emoji: '🤝', color: '#06b6d4' },
  fitness: { label: 'Kondycja', emoji: '💪', color: '#10b981' },
  mental: { label: 'Mental', emoji: '🧠', color: '#8b5cf6' },
  physio: { label: 'Fizjo', emoji: '🩺', color: '#ef4444' },
  nutrition: { label: 'Dieta', emoji: '🥗', color: '#84cc16' },
}

function initials(c) {
  return `${(c.firstName || '?')[0] || '?'}${(c.lastName || '?')[0] || '?'}`.toUpperCase()
}

export default function CoachingTeamSection({ coaches = [] }) {
  const navigate = useNavigate()
  if (!coaches.length) return null

  const sorted = [...coaches].sort((a, b) => {
    const order = ['head', 'assistant', 'fitness', 'mental', 'physio', 'nutrition']
    const ai = order.indexOf(a.coachProfile?.teamRole || 'head')
    const bi = order.indexOf(b.coachProfile?.teamRole || 'head')
    return ai - bi
  })

  return (
    <section className="cts-section">
      <header className="cts-header">
        <Users size={20} />
        <h2>Zespół trenerów</h2>
        <span className="cts-count">{coaches.length}</span>
      </header>
      <div className="cts-grid">
        {sorted.map((c) => {
          const role = c.coachProfile?.teamRole || 'head'
          const meta = ROLE_BADGE[role] || ROLE_BADGE.head
          return (
            <article key={c._id} className="cts-card">
              <div className="cts-avatar" style={{ background: meta.color }}>
                {c.avatarUrl ? <img src={c.avatarUrl} alt="" /> : <span>{initials(c)}</span>}
              </div>
              <div className="cts-card-body">
                <div className="cts-name">{c.firstName} {c.lastName}</div>
                <div className="cts-role" style={{ color: meta.color }}>
                  <span>{meta.emoji}</span> {meta.label}
                </div>
                {c.coachProfile?.specialization && (
                  <div className="cts-spec">{c.coachProfile.specialization}</div>
                )}
              </div>
              <button className="cts-msg-btn" onClick={() => navigate(`/parent/messages?to=${c._id}`)}>
                <MessageCircle size={16} />
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
