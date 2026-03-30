import { useState, useEffect } from 'react'
import { Plus, DollarSign, AlertCircle, CheckCircle, Clock, Send } from 'lucide-react'
import api from '../../api/axios'
import Button from '../../components/ui/Button/Button'
import useToast from '../../hooks/useToast'
import './Coach.css'

const STATUS_CONFIG = {
  paid: { label: 'Oplacona', color: 'var(--color-green)', icon: CheckCircle },
  pending: { label: 'Oczekujaca', color: 'var(--color-amber)', icon: Clock },
  overdue: { label: 'Przeterminowana', color: 'var(--color-heart)', icon: AlertCircle },
}

const MONTH_NAMES = [
  'Styczen', 'Luty', 'Marzec', 'Kwiecien', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpien', 'Wrzesien', 'Pazdziernik', 'Listopad', 'Grudzien',
]

export default function CoachPayments() {
  const toast = useToast()
  const [payments, setPayments] = useState([])
  const [stats, setStats] = useState(null)
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')

  // Form state
  const [form, setForm] = useState({
    player: '',
    parent: '',
    amount: '',
    description: '',
    dueDate: '',
  })
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    try {
      const [payRes, statsRes, plRes] = await Promise.all([
        api.get('/payments'),
        api.get('/payments/stats'),
        api.get('/players'),
      ])
      setPayments(payRes.data.payments || [])
      setStats(statsRes.data.stats || null)
      setPlayers(plRes.data.players || plRes.data || [])
    } catch { /* silent */ }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))

    // Auto-fill parent when player is selected
    if (field === 'player' && value) {
      const player = players.find((p) => p._id === value)
      const parentId = player?.parents?.[0]?._id || player?.parents?.[0]
      if (parentId) {
        setForm((prev) => ({ ...prev, player: value, parent: parentId }))
      }
      // Auto-fill amount from monthly rate
      if (player?.monthlyRate) {
        setForm((prev) => ({
          ...prev,
          amount: prev.amount || String(player.monthlyRate),
          description: prev.description || `Treningi tenisowe — ${MONTH_NAMES[new Date().getMonth()]} ${new Date().getFullYear()}`,
        }))
      }
    }
  }

  const handleSubmit = async () => {
    if (!form.player || !form.amount || !form.dueDate) {
      toast.error('Wypelnij wymagane pola')
      return
    }
    if (!form.parent) {
      toast.error('Zawodnik nie ma przypisanego rodzica')
      return
    }
    setSaving(true)
    try {
      await api.post('/payments', {
        player: form.player,
        parent: form.parent,
        amount: Number(form.amount),
        description: form.description || undefined,
        dueDate: form.dueDate,
      })
      toast.success('Platnosc utworzona')
      setShowForm(false)
      setForm({ player: '', parent: '', amount: '', description: '', dueDate: '' })
      fetchData()
    } catch {
      toast.error('Nie udalo sie utworzyc platnosci')
    }
    setSaving(false)
  }

  const handleMarkPaid = async (paymentId) => {
    try {
      await api.put(`/payments/${paymentId}/mark-paid`)
      toast.success('Platnosc oznaczona jako oplacona')
      fetchData()
    } catch {
      toast.error('Nie udalo sie oznaczyc platnosci')
    }
  }

  const filtered = filterStatus
    ? payments.filter((p) => p.status === filterStatus)
    : payments

  if (loading) {
    return <div className="coach-page"><h1 className="page-title">Platnosci</h1><div className="coach-loading">Ladowanie...</div></div>
  }

  return (
    <div className="coach-page">
      <div className="coach-header">
        <h1 className="page-title">Platnosci</h1>
        <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} /> Nowa platnosc
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="coach-stats">
          <div className="coach-stat" style={{ '--stat-color': 'var(--color-green)' }}>
            <div className="coach-stat-icon"><CheckCircle size={18} /></div>
            <div className="coach-stat-value">{stats.totalPaid?.toLocaleString('pl-PL') || 0}</div>
            <div className="coach-stat-label">Oplacone (PLN)</div>
          </div>
          <div className="coach-stat" style={{ '--stat-color': 'var(--color-amber)' }}>
            <div className="coach-stat-icon"><Clock size={18} /></div>
            <div className="coach-stat-value">{stats.pending?.total?.toLocaleString('pl-PL') || 0}</div>
            <div className="coach-stat-label">Oczekujace ({stats.pending?.count || 0})</div>
          </div>
          <div className="coach-stat" style={{ '--stat-color': 'var(--color-heart)' }}>
            <div className="coach-stat-icon"><AlertCircle size={18} /></div>
            <div className="coach-stat-value">{stats.overdue?.total?.toLocaleString('pl-PL') || 0}</div>
            <div className="coach-stat-label">Przeterminowane ({stats.overdue?.count || 0})</div>
          </div>
          <div className="coach-stat" style={{ '--stat-color': 'var(--color-accent)' }}>
            <div className="coach-stat-icon"><DollarSign size={18} /></div>
            <div className="coach-stat-value">{payments.length}</div>
            <div className="coach-stat-label">Wszystkie platnosci</div>
          </div>
        </div>
      )}

      {/* New payment form */}
      {showForm && (
        <div className="coach-card" style={{ marginBottom: 20 }}>
          <div className="coach-card-header"><h2>Nowa platnosc</h2></div>
          <div style={{ padding: 16 }}>
            <div className="coach-form">
              <div className="coach-form-group">
                <label>Zawodnik *</label>
                <select value={form.player} onChange={(e) => handleChange('player', e.target.value)}>
                  <option value="">Wybierz zawodnika...</option>
                  {players.map((p) => (
                    <option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="coach-form-row">
                <div className="coach-form-group">
                  <label>Kwota (PLN) *</label>
                  <input type="number" min={1} value={form.amount}
                    onChange={(e) => handleChange('amount', e.target.value)} placeholder="np. 800" />
                </div>
                <div className="coach-form-group">
                  <label>Termin platnosci *</label>
                  <input type="date" value={form.dueDate}
                    onChange={(e) => handleChange('dueDate', e.target.value)} />
                </div>
              </div>
              <div className="coach-form-group">
                <label>Opis</label>
                <input type="text" value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="np. Treningi tenisowe — marzec 2026" />
              </div>
              <div className="coach-form-actions">
                <Button variant="primary" onClick={handleSubmit} loading={saving}>
                  <Send size={14} /> Wystaw platnosc
                </Button>
                <button className="tp-cancel" onClick={() => setShowForm(false)}>Anuluj</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="coach-session-controls">
        <select className="coach-filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Wszystkie statusy</option>
          <option value="pending">Oczekujace</option>
          <option value="overdue">Przeterminowane</option>
          <option value="paid">Oplacone</option>
        </select>
      </div>

      {/* Payment list */}
      <div className="coach-payments-list">
        {filtered.length === 0 ? (
          <div className="coach-empty">
            <DollarSign size={32} />
            Brak platnosci
          </div>
        ) : (
          filtered.map((p) => {
            const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending
            const StatusIcon = cfg.icon
            const playerName = p.player
              ? `${p.player.firstName || ''} ${p.player.lastName || ''}`.trim()
              : 'Zawodnik'
            const parentName = p.parent
              ? `${p.parent.firstName || ''} ${p.parent.lastName || ''}`.trim()
              : ''

            return (
              <div key={p._id} className="coach-payment-card">
                <div className="coach-payment-status" style={{ color: cfg.color }}>
                  <StatusIcon size={16} />
                </div>
                <div className="coach-payment-body">
                  <div className="coach-payment-top">
                    <span className="coach-payment-amount">{p.amount} {p.currency || 'PLN'}</span>
                    <span className="coach-payment-player">{playerName}</span>
                    {parentName && <span className="coach-payment-parent">{parentName}</span>}
                  </div>
                  {p.description && <div className="coach-payment-desc">{p.description}</div>}
                  <div className="coach-payment-meta">
                    <span className="coach-payment-status-text" style={{ color: cfg.color }}>{cfg.label}</span>
                    <span>Termin: {new Date(p.dueDate).toLocaleDateString('pl-PL')}</span>
                    {p.paidAt && <span>Oplacona: {new Date(p.paidAt).toLocaleDateString('pl-PL')}</span>}
                  </div>
                </div>
                {(p.status === 'pending' || p.status === 'overdue') && (
                  <button className="coach-payment-mark-btn" onClick={() => handleMarkPaid(p._id)} title="Oznacz jako oplacona">
                    <CheckCircle size={16} />
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
