import { useNavigate } from 'react-router-dom'
import { XCircle } from 'lucide-react'
import Button from '../../components/ui/Button/Button'
import './PaymentCancel.css'

export default function PaymentCancel() {
  const navigate = useNavigate()

  return (
    <div className="payment-cancel-page">
      <div className="payment-cancel-card">
        <div className="payment-cancel-icon">
          <XCircle size={48} />
        </div>
        <div className="payment-cancel-title">
          Płatność anulowana
        </div>
        <div className="payment-cancel-text">
          Płatność nie została zrealizowana. Możesz spróbować ponownie.
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/parent/payments')}
        >
          Wróć do płatności
        </Button>
      </div>
    </div>
  )
}
