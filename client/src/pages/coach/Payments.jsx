import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus } from 'lucide-react'
import api from '../../api/axios'
import Button from '../../components/ui/Button/Button'
import Input from '../../components/ui/Input/Input'
import Modal from '../../components/ui/Modal/Modal'
import PaymentCard from '../../components/shared/PaymentCard/PaymentCard'
import useUiStore from '../../store/uiStore'
import './Payments.css'

const paymentSchema = z.object({
  player: z.string().min(1, 'Wybierz zawodnika'),
  amount: z.union([z.string(), z.number()]).transform((v) => Number(v)).refine((v) => v >= 1, 'Kwota musi wynosić min. 1 zł'),
  description: z.string().min(1, 'Opis jest wymagany'),
  dueDate: z.string().min(1, 'Termin jest wymagany'),
})

export default function Payments() {
  const addToast = useUiStore((s) => s.addToast)

  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState([])
  const [stats, setStats] = useState(null)
  const [players, setPlayers] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      player: '',
      amount: '',
      description: '',
      dueDate: '',
    },
  })

  const watchedPlayer = watch('player')

  const fetchData = useCallback(async () => {
    try {
      const [paymentsRes, statsRes] = await Promise.all([
        api.get('/payments'),
        api.get('/payments/stats'),
      ])
      setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : paymentsRes.data.payments || [])
      setStats(statsRes.data.stats || statsRes.data)
    } catch (err) {
      addToast('Nie udało się pobrać płatności', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    fetchData()
    api.get('/players').then((res) => setPlayers(Array.isArray(res.data) ? res.data : res.data.players || [])).catch(() => {})
  }, [fetchData])

  const selectedPlayer = players.find((p) => p._id === watchedPlayer)

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      const payload = {
        player: data.player,
        amount: Number(data.amount),
        description: data.description,
        dueDate: data.dueDate,
      }

      // Auto-fill parent from selected player
      if (selectedPlayer?.parentId) {
        payload.parent = selectedPlayer.parentId
      }

      await api.post('/payments', payload)
      addToast('Faktura została utworzona', 'success')
      setModalOpen(false)
      reset()
      fetchData()
    } catch (err) {
      addToast(err.response?.data?.message || 'Błąd podczas tworzenia faktury', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Sort: pending/overdue first, paid last
  const sortedPayments = [...payments].sort((a, b) => {
    const order = { overdue: 0, pending: 1, paid: 2 }
    return (order[a.status] || 1) - (order[b.status] || 1)
  })

  const monthlyRevenue = stats?.monthly?.length
    ? stats.monthly[stats.monthly.length - 1]?.amount || 0
    : 0

  if (loading) {
    return (
      <div className="page-enter">
        <h1 className="page-title">Płatności</h1>
        <p className="payments-loading">Ładowanie...</p>
      </div>
    )
  }

  return (
    <div className="page-enter">
      <div className="payments-header">
        <h1 className="page-title">Płatności</h1>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setModalOpen(true)}>
          Nowa faktura
        </Button>
      </div>

      <div className="payments-stats">
        <div className="metric">
          <div className="metric-label">Opłacone</div>
          <div className="metric-value payments-stat-green">{stats?.paid || 0}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Oczekujące</div>
          <div className="metric-value payments-stat-amber">{stats?.pending || 0}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Przychód miesiąca</div>
          <div className="metric-value payments-stat-blue">{monthlyRevenue} zł</div>
        </div>
      </div>

      <div className="payments-list">
        {sortedPayments.length === 0 ? (
          <p className="payments-empty">Brak płatności</p>
        ) : (
          sortedPayments.map((payment) => (
            <PaymentCard key={payment._id} payment={payment} />
          ))
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          reset()
        }}
        title="Nowa faktura"
        footer={
          <div className="modal-actions">
            <Button onClick={() => { setModalOpen(false); reset() }}>Anuluj</Button>
            <Button
              variant="primary"
              loading={submitting}
              onClick={handleSubmit(onSubmit)}
            >
              Utwórz
            </Button>
          </div>
        }
      >
        <form className="payment-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="input-group">
            <label className="input-label">Zawodnik *</label>
            <select className="input" {...register('player')}>
              <option value="">Wybierz zawodnika...</option>
              {players.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
            {errors.player && (
              <span className="input-error-text">{errors.player.message}</span>
            )}
            {selectedPlayer?.parentEmail && (
              <span className="payment-parent-info">
                Rodzic: {selectedPlayer.parentEmail}
              </span>
            )}
          </div>
          <Input
            label="Kwota (zł) *"
            type="number"
            placeholder="500"
            register={register('amount')}
            error={errors.amount?.message}
          />
          <Input
            label="Opis *"
            placeholder="np. Opłata za marzec 2026"
            register={register('description')}
            error={errors.description?.message}
          />
          <Input
            label="Termin płatności *"
            type="date"
            register={register('dueDate')}
            error={errors.dueDate?.message}
          />
        </form>
      </Modal>
    </div>
  )
}
