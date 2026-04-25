import { useEffect, useState } from 'react'
import { Trophy, Medal, Award } from 'lucide-react'
import api from '../../api/axios'
import './PalmaresSection.css'

const RESULT_LABEL = {
  gold: 'Mistrz',
  silver: 'Wicemistrz',
  bronze: '3. miejsce',
  finalist: 'Finalista',
  semifinal: 'Półfinał',
  quarterfinal: 'Ćwierćfinał',
  other: 'Wynik',
}

const CATEGORY_LABEL = {
  mp: 'Mistrzostwa Polski',
  international: 'Międzynarodowe',
  national: 'Krajowe',
  ranking: 'Ranking',
  callup: 'Powołanie',
  other: 'Inne',
}

function ResultIcon({ result }) {
  if (result === 'gold') return <Trophy className="ps-icon ps-gold" size={28} />
  if (result === 'silver') return <Medal className="ps-icon ps-silver" size={28} />
  if (result === 'bronze') return <Medal className="ps-icon ps-bronze" size={28} />
  return <Award className="ps-icon ps-other" size={28} />
}

export default function PalmaresSection({ playerId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    api.get(`/achievements?player=${playerId}`)
      .then((res) => { if (alive) setItems(res.data.achievements || []) })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [playerId])

  if (loading) return null
  if (!items.length) return null

  const byYear = items.reduce((acc, a) => {
    (acc[a.year] = acc[a.year] || []).push(a)
    return acc
  }, {})
  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a))

  return (
    <section className="ps-section">
      <header className="ps-header">
        <Trophy size={20} />
        <h2>Palmares</h2>
        <span className="ps-count">{items.length}</span>
      </header>
      <div className="ps-years">
        {years.map((year) => (
          <div key={year} className="ps-year-block">
            <div className="ps-year-label">{year}</div>
            <div className="ps-cards">
              {byYear[year].map((a) => (
                <article key={a._id} className={`ps-card ps-card-${a.result}`}>
                  <ResultIcon result={a.result} />
                  <div className="ps-card-body">
                    <div className="ps-card-title">{a.title}</div>
                    <div className="ps-card-meta">
                      {CATEGORY_LABEL[a.category]}
                      {a.ageCategory && ` · ${a.ageCategory}`}
                      {a.discipline && ` · ${a.discipline}`}
                    </div>
                    {a.location && <div className="ps-card-loc">{a.location}</div>}
                  </div>
                  <div className="ps-card-result">{RESULT_LABEL[a.result]}</div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
