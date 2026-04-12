import Modal from './Modal/Modal'
import Button from './Button/Button'

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Potwierdzenie',
  message,
  confirmLabel = 'Usuń',
  cancelLabel = 'Anuluj',
  variant = 'danger',
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button onClick={onClose}>{cancelLabel}</Button>
          <Button variant={variant} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{message}</p>
    </Modal>
  )
}
