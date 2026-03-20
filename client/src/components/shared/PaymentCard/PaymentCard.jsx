import Badge from '../../ui/Badge/Badge'
import './PaymentCard.css'

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}

const statusMap = {
  paid: { label: 'Opłacone', variant: 'green' },
  pending: { label: 'Oczekujące', variant: 'amber' },
  overdue: { label: 'Zaległe', variant: 'red' },
}

export default function PaymentCard({ payment }) {
  const playerName = payment.player?.firstName
    ? `${payment.player.firstName} ${payment.player.lastName}`
    : ''
  const parentName = payment.parent?.firstName
    ? `${payment.parent.firstName} ${payment.parent.lastName}`
    : ''
  const status = statusMap[payment.status] || statusMap.pending

  return (
    <div className="payment-card card">
      <div className="payment-card-main">
        <div className="payment-card-left">
          <div className="payment-card-description">{payment.description}</div>
          <div className="payment-card-meta">
            {playerName && <span>{playerName}</span>}
            {parentName && <span>{parentName}</span>}
            <span>Termin: {formatDate(payment.dueDate)}</span>
          </div>
        </div>
        <div className="payment-card-right">
          <div className="payment-card-amount">{payment.amount} zł</div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </div>
    </div>
  )
}
