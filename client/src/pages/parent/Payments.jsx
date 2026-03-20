import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Button from '../../components/ui/Button/Button'
import PaymentCard from '../../components/shared/PaymentCard/PaymentCard'
import './Payments.css'

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payingId, setPayingId] = useState(null)

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true)
        const { data } = await api.get('/payments')
        setPayments(Array.isArray(data) ? data : data.payments || [])
      } catch (err) {
        setError('Nie udało się załadować płatności')
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [])

  const handlePay = async (paymentId) => {
    setPayingId(paymentId)
    try {
      const { data } = await api.post(`/payments/${paymentId}/checkout`)
      window.location.href = data.url
    } catch {
      setError('Nie udało się utworzyć sesji płatności')
      setPayingId(null)
    }
  }

  const pending = payments.filter(
    (p) => p.status === 'pending' || p.status === 'overdue'
  )
  const history = payments.filter(
    (p) => p.status === 'paid' || p.status === 'cancelled'
  )

  if (loading) {
    return (
      <div className="parent-payments">
        <h1 className="page-title">Płatności</h1>
        <div className="parent-payments-empty">Ładowanie...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="parent-payments">
        <h1 className="page-title">Płatności</h1>
        <div className="parent-payments-error">{error}</div>
      </div>
    )
  }

  return (
    <div className="parent-payments">
      <h1 className="page-title">Płatności</h1>

      <div className="parent-payments-section">
        <div className="parent-payments-section-title">Oczekujące</div>
        {pending.length === 0 ? (
          <div className="parent-payments-empty">Brak oczekujących płatności</div>
        ) : (
          pending.map((payment) => (
            <PaymentCard
              key={payment._id}
              payment={payment}
              actions={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handlePay(payment._id)}
                  loading={payingId === payment._id}
                >
                  Zapłać
                </Button>
              }
            />
          ))
        )}
      </div>

      <div className="parent-payments-section">
        <div className="parent-payments-section-title">Historia</div>
        {history.length === 0 ? (
          <div className="parent-payments-empty">Brak historii płatności</div>
        ) : (
          history.map((payment) => (
            <PaymentCard key={payment._id} payment={payment} />
          ))
        )}
      </div>
    </div>
  )
}
