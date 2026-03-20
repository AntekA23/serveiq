import { useEffect } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import useUiStore from '../../../store/uiStore'
import './Toast.css'

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
}

function ToastItem({ toast }) {
  const removeToast = useUiStore((s) => s.removeToast)
  const Icon = icons[toast.type] || Info

  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id)
    }, toast.duration || 3000)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, removeToast])

  return (
    <div className={`toast toast-${toast.type}`}>
      <Icon size={18} className="toast-icon" />
      <span>{toast.message}</span>
      <button className="toast-close" onClick={() => removeToast(toast.id)}>
        <X size={14} />
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const toasts = useUiStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
