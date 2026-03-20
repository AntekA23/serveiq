import { useCallback } from 'react'
import useUiStore from '../store/uiStore'

export default function useToast() {
  const { addToast, toasts, removeToast } = useUiStore()

  const success = useCallback(
    (msg) => addToast(msg, 'success'),
    [addToast]
  )

  const error = useCallback(
    (msg) => addToast(msg, 'error'),
    [addToast]
  )

  const info = useCallback(
    (msg) => addToast(msg, 'info'),
    [addToast]
  )

  return { addToast, toasts, removeToast, success, error, info }
}
