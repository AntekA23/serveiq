import { TrendingUp } from 'lucide-react'
import './RankingSummary.css'

export default function RankingSummary({ ranking = {} }) {
  const items = []
  if (ranking.pzt) items.push({ label: 'PZT', val: ranking.pzt, color: '#dc2626' })
  if (ranking.te) items.push({ label: 'Tennis Europe', val: ranking.te, color: '#2563eb' })
  if (ranking.itf) items.push({ label: 'ITF Junior', val: ranking.itf, color: '#16a34a' })
  if (ranking.wta) items.push({ label: 'WTA', val: ranking.wta, color: '#7c3aed' })
  if (ranking.atp) items.push({ label: 'ATP', val: ranking.atp, color: '#ea580c' })

  if (!items.length) return null

  return (
    <section className="rs-section">
      <header className="rs-header">
        <TrendingUp size={20} />
        <h2>Ranking</h2>
      </header>
      <div className="rs-grid">
        {items.map((it) => (
          <div key={it.label} className="rs-card" style={{ borderColor: it.color }}>
            <div className="rs-label">{it.label}</div>
            <div className="rs-value" style={{ color: it.color }}>#{it.val}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
