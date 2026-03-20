import { useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import Button from '../../components/ui/Button/Button'
import './PaymentSuccess.css'

export default function PaymentSuccess() {
  const navigate = useNavigate()

  return (
    <div className="payment-success-page">
      <div className="payment-success-card">
        <div className="payment-success-icon">
          <CheckCircle size={48} />
        </div>
        <div className="payment-success-title">
          Płatność zakończona pomyślnie!
        </div>
        <div className="payment-success-text">
          Dziękujemy za dokonanie płatności. Potwierdzenie zostanie wysłane na Twój adres email.
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
