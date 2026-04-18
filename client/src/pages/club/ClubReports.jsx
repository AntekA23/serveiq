import { useState, useEffect } from 'react'
import {
  Loader2, BarChart3, Users, TrendingUp, Activity,
} from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'

const MONTH_NAMES = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paz', 'Lis', 'Gru']

export default function ClubReports() {
  const user = useAuthStore((s) => s.user)
  const clubId = user?.club && typeof user.club === 'object' ? user.club._id : user?.club

  const [reports, setReports] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clubId) { setLoading(false); return }
    const fetchReports = async () => {
      try {
        const { data } = await api.get(`/clubs/${clubId}/reports`)
        setReports(data.reports)
      } catch (err) {
        console.error('Blad ladowania raportow:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [clubId])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Loader2 size={32} className="spin" />
      </div>
    )
  }

  if (!reports) {
    return <div className="page-empty">Brak danych raportowych</div>
  }

  const { attendance, coachActivity, pathwayDistribution, retention } = reports

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Statystyki klubu</h1>
      </div>

      {/* RETENCJA */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
        <MetricCard label="Lacznie graczy" value={retention.total} icon={<Users size={18} />} color="var(--color-accent)" />
        <MetricCard label="Aktywni" value={retention.active} icon={<Activity size={18} />} color="var(--color-green)" />
        <MetricCard label="Nieaktywni" value={retention.inactive} icon={<Users size={18} />} color="var(--color-red)" />
        <MetricCard label="Nowi (30 dni)" value={retention.new} icon={<TrendingUp size={18} />} color="var(--color-warning)" />
      </div>

      {/* FREKWENCJA — WYKRES */}
      <div className="card" style={{ marginBottom: 20, padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart3 size={16} /> Frekwencja (ostatnie 6 mies.)
        </h3>
        {attendance.byMonth.length === 0 ? (
          <div style={{ color: 'var(--color-text-tertiary)', fontSize: 13 }}>Brak danych</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160 }}>
            {attendance.byMonth.map((m) => {
              const barHeight = Math.max(m.rate * 1.5, 4)
              return (
                <div key={`${m.year}-${m.month}`} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{m.rate}%</div>
                  <div
                    style={{
                      height: barHeight,
                      background: m.rate >= 70 ? 'var(--color-green)' : m.rate >= 40 ? 'var(--color-warning)' : 'var(--color-red)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s',
                    }}
                  />
                  <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                    {MONTH_NAMES[m.month - 1]}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* FREKWENCJA PER TRENER */}
      <div className="card" style={{ marginBottom: 20, padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
          Frekwencja wg trenera
        </h3>
        {attendance.byCoach.length === 0 ? (
          <div style={{ color: 'var(--color-text-tertiary)', fontSize: 13 }}>Brak danych</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {attendance.byCoach.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 140, fontSize: 13, fontWeight: 500 }}>
                  {c.coach.firstName} {c.coach.lastName}
                </span>
                <div style={{ flex: 1, height: 20, background: 'var(--color-bg-tertiary)', borderRadius: 6, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${c.rate}%`,
                      background: c.rate >= 70 ? 'var(--color-green)' : c.rate >= 40 ? 'var(--color-warning)' : 'var(--color-red)',
                      borderRadius: 6,
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
                <span style={{ width: 50, textAlign: 'right', fontSize: 13, fontWeight: 600 }}>
                  {c.rate}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AKTYWNOSC TRENEROW */}
      <div className="card" style={{ marginBottom: 20, padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
          Aktywnosc trenerow (ten miesiac)
        </h3>
        {coachActivity.length === 0 ? (
          <div style={{ color: 'var(--color-text-tertiary)', fontSize: 13 }}>Brak danych</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th style={thStyle}>Trener</th>
                <th style={thStyle}>Aktywnosci</th>
                <th style={thStyle}>Treningi</th>
                <th style={thStyle}>Przeglady</th>
              </tr>
            </thead>
            <tbody>
              {coachActivity.map((c, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={tdStyle}>{c.coach.firstName} {c.coach.lastName}</td>
                  <td style={tdStyle}>{c.activities}</td>
                  <td style={tdStyle}>{c.sessions}</td>
                  <td style={tdStyle}>{c.reviews}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ROZKLAD PATHWAY */}
      <div className="card" style={{ marginBottom: 20, padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
          Rozklad graczy wg etapu sciezki
        </h3>
        {pathwayDistribution.length === 0 ? (
          <div style={{ color: 'var(--color-text-tertiary)', fontSize: 13 }}>Brak danych</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pathwayDistribution.map((stage) => {
              const maxCount = Math.max(...pathwayDistribution.map((s) => s.count), 1)
              return (
                <div key={stage._id || 'none'} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 200, fontSize: 13, fontWeight: 500 }}>
                    {stage._id || 'Brak etapu'}
                  </span>
                  <div style={{ flex: 1, height: 20, background: 'var(--color-bg-tertiary)', borderRadius: 6, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${(stage.count / maxCount) * 100}%`,
                        background: 'var(--color-accent)',
                        borderRadius: 6,
                        transition: 'width 0.3s',
                        minWidth: 4,
                      }}
                    />
                  </div>
                  <span style={{ width: 40, textAlign: 'right', fontSize: 13, fontWeight: 600 }}>
                    {stage.count}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function MetricCard({ label, value, icon, color }) {
  return (
    <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ color, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-tertiary)', letterSpacing: 0.5 }}>
          {label}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
      </div>
    </div>
  )
}

const thStyle = {
  textAlign: 'left',
  padding: '10px 12px',
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
  letterSpacing: 0.5,
}

const tdStyle = {
  padding: '10px 12px',
}
