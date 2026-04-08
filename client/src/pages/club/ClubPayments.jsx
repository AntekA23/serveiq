import { useState, useEffect } from 'react'
import {
  Loader2, CreditCard, AlertTriangle, TrendingUp, Clock,
  Filter, Download,
} from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'

const STATUS_CONFIG = {
  pending: { label: 'Oczekuje', color: 'var(--color-warning)' },
  paid: { label: 'Zaplacona', color: 'var(--color-green)' },
  overdue: { label: 'Zalegla', color: 'var(--color-red)' },
  cancelled: { label: 'Anulowana', color: 'var(--color-text-tertiary)' },
}

export default function ClubPayments() {
  const user = useAuthStore((s) => s.user)
  const clubId = user?.club && typeof user.club === 'object' ? user.club._id : user?.club

  const [payments, setPayments] = useState([])
  const [stats, setStats] = useState({})
  const [coaches, setCoaches] = useState([])
  const [loading, setLoading] = useState(true)

  const [filterCoach, setFilterCoach] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPeriod, setFilterPeriod] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (!clubId) { setLoading(false); return }
    fetchData()
  }, [clubId])

  const fetchData = async () => {
    try {
      const [paymentsRes, coachesRes] = await Promise.all([
        api.get(`/clubs/${clubId}/payments`),
        api.get(`/clubs/${clubId}/coaches`),
      ])
      setPayments(paymentsRes.data.payments || [])
      setStats(paymentsRes.data.stats || {})
      setCoaches(coachesRes.data.coaches || [])
    } catch (err) {
      console.error('Blad ladowania platnosci:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = payments.filter((p) => {
    if (filterCoach && p.coach?._id !== filterCoach) return false
    if (filterStatus && p.status !== filterStatus) return false
    return true
  })

  const exportCsv = () => {
    const header = 'Gracz,Trener,Rodzic,Kwota,Waluta,Status,Termin,Opis\n'
    const rows = filtered.map((p) =>
      [
        `${p.player?.firstName || ''} ${p.player?.lastName || ''}`,
        `${p.coach?.firstName || ''} ${p.coach?.lastName || ''}`,
        `${p.parent?.firstName || ''} ${p.parent?.lastName || ''}`,
        p.amount,
        p.currency,
        STATUS_CONFIG[p.status]?.label || p.status,
        p.dueDate ? new Date(p.dueDate).toLocaleDateString('pl-PL') : '',
        (p.description || '').replace(/,/g, ';'),
      ].join(',')
    ).join('\n')

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `platnosci-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Loader2 size={32} className="spin" />
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Platnosci klubu</h1>
        <button className="btn btn-ghost" onClick={exportCsv}>
          <Download size={14} /> Eksport CSV
        </button>
      </div>

      {/* Statystyki */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Przychod (miesiac)"
          value={`${(stats.monthlyRevenue || 0).toLocaleString('pl-PL')} PLN`}
          color="var(--color-green)"
        />
        <StatCard
          icon={<CreditCard size={20} />}
          label="Przychod (lacznie)"
          value={`${(stats.totalRevenue || 0).toLocaleString('pl-PL')} PLN`}
          color="var(--color-accent)"
        />
        <StatCard
          icon={<Clock size={20} />}
          label="Oczekujace"
          value={`${(stats.pending || 0).toLocaleString('pl-PL')} PLN`}
          color="var(--color-warning)"
        />
        <StatCard
          icon={<AlertTriangle size={20} />}
          label={`Zaleglosci (${stats.overdueCount || 0})`}
          value={`${(stats.overdue || 0).toLocaleString('pl-PL')} PLN`}
          color="var(--color-red)"
        />
      </div>

      {/* Filtry */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          className={`btn ${showFilters ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={14} /> Filtry
        </button>
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', alignSelf: 'center' }}>
          {filtered.length} platnosci
        </span>
      </div>

      {showFilters && (
        <div className="card" style={{ marginBottom: 16, padding: 16 }}>
          <div className="form-grid-2" style={{ gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Trener</label>
              <select className="form-input" value={filterCoach} onChange={(e) => setFilterCoach(e.target.value)}>
                <option value="">Wszyscy</option>
                {coaches.map((c) => (
                  <option key={c._id} value={c._id}>{c.firstName} {c.lastName}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">Wszystkie</option>
                <option value="pending">Oczekuje</option>
                <option value="paid">Zaplacona</option>
                <option value="overdue">Zalegla</option>
                <option value="cancelled">Anulowana</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Lista platnosci */}
      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <th style={thStyle}>Gracz</th>
              <th style={thStyle}>Trener</th>
              <th style={thStyle}>Kwota</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Termin</th>
              <th style={thStyle}>Opis</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-tertiary)' }}>
                  Brak platnosci
                </td>
              </tr>
            )}
            {filtered.map((p) => {
              const statusCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending
              return (
                <tr key={p._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={tdStyle}>{p.player?.firstName} {p.player?.lastName}</td>
                  <td style={tdStyle}>{p.coach?.firstName} {p.coach?.lastName}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{p.amount} {p.currency}</td>
                  <td style={tdStyle}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      padding: '2px 8px', borderRadius: 10,
                      background: `${statusCfg.color}20`, color: statusCfg.color,
                    }}>
                      {statusCfg.label}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {p.dueDate ? new Date(p.dueDate).toLocaleDateString('pl-PL') : '-'}
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--color-text-secondary)' }}>{p.description || '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ color, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>
          {label}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
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
