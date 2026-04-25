import { useEffect, useState } from 'react'
import { Calendar, Target } from 'lucide-react'
import api from '../../api/axios'
import './SeasonTimeline.css'

const PHASE_COLOR = {
  build: '#3b82f6',
  peak: '#dc2626',
  taper: '#f59e0b',
  recovery: '#10b981',
  offseason: '#6b7280',
}

const PHASE_LABEL = {
  build: 'Build', peak: 'Peak', taper: 'Taper',
  recovery: 'Recovery', offseason: 'Offseason',
}

const MONTHS = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru']

function getPhaseAtMonth(plan, monthIdx, year) {
  const mid = new Date(year, monthIdx, 15)
  return plan.phases.find((p) => new Date(p.startDate) <= mid && new Date(p.endDate) >= mid)
}

function getEventsInMonth(plan, monthIdx, year) {
  return plan.targetEvents.filter((e) => {
    const d = new Date(e.date)
    return d.getFullYear() === year && d.getMonth() === monthIdx
  })
}

const PRIO_DOT_SIZE = { A: 14, B: 10, C: 7 }

export default function SeasonTimeline({ playerId }) {
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    api.get(`/season-plans?player=${playerId}&status=active`)
      .then((res) => {
        if (!alive) return
        const plans = res.data.seasonPlans || []
        setPlan(plans[0] || null)
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [playerId])

  if (loading) return null
  if (!plan) return null

  const year = new Date(plan.startDate).getFullYear()
  const totalEvents = plan.targetEvents?.length || 0

  return (
    <section className="st-section">
      <header className="st-header">
        <Calendar size={20} />
        <h2>Sezon {plan.season}</h2>
        {plan.weeklyHoursTarget && <span className="st-hours">{plan.weeklyHoursTarget}h/tyg</span>}
        <span className="st-events"><Target size={12} /> {totalEvents}</span>
      </header>

      <div className="st-timeline">
        {MONTHS.map((label, idx) => {
          const phase = getPhaseAtMonth(plan, idx, year)
          const events = getEventsInMonth(plan, idx, year)
          const bg = phase ? PHASE_COLOR[phase.type] : '#f3f4f6'
          const phaseLabel = phase ? PHASE_LABEL[phase.type] : ''
          return (
            <div key={idx} className="st-month" title={phaseLabel}>
              <div className="st-month-label">{label}</div>
              <div className="st-month-bar" style={{ background: bg, opacity: phase ? 0.85 : 0.3 }} />
              <div className="st-events-row">
                {events.map((e) => (
                  <div
                    key={e._id || e.name}
                    className={`st-event-dot st-prio-${e.priority}`}
                    style={{ width: PRIO_DOT_SIZE[e.priority], height: PRIO_DOT_SIZE[e.priority] }}
                    title={`${e.name} — ${new Date(e.date).toLocaleDateString('pl-PL')} (${e.priority})`}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="st-legend">
        {Object.keys(PHASE_LABEL).map((k) => (
          <div key={k} className="st-legend-item">
            <span className="st-legend-dot" style={{ background: PHASE_COLOR[k] }} />
            {PHASE_LABEL[k]}
          </div>
        ))}
      </div>
    </section>
  )
}
