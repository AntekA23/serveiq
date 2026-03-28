import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, AlertTriangle, AlertCircle, Info, Check, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../../api/axios'
import './NotificationBell.css'

const SEVERITY_CONFIG = {
  critical: {
    icon: AlertCircle,
    className: 'notif-severity-critical',
  },
  warning: {
    icon: AlertTriangle,
    className: 'notif-severity-warning',
  },
  info: {
    icon: Info,
    className: 'notif-severity-info',
  },
}

function timeAgo(dateStr) {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now - date) / 1000)

  if (diff < 60) return 'teraz'
  if (diff < 3600) return `${Math.floor(diff / 60)} min temu`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h temu`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d temu`
  return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })
}

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  // Pobierz liczbe nieprzeczytanych na mount
  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications/unread-count')
      setUnreadCount(data.count ?? 0)
    } catch {
      // Ignoruj bledy (np. demo mode)
    }
  }, [])

  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  // Pobierz powiadomienia gdy dropdown sie otwiera
  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/notifications?limit=10')
      setNotifications(data.notifications ?? data ?? [])
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleToggle = () => {
    const opening = !isOpen
    setIsOpen(opening)
    if (opening) {
      fetchNotifications()
    }
  }

  // Zamknij dropdown po kliknieciu na zewnatrz
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Oznacz jedno powiadomienie jako przeczytane i nawiguj
  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      try {
        await api.put(`/notifications/${notif._id}/read`)
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch {
        // ignoruj
      }
    }
    if (notif.actionUrl) {
      navigate(notif.actionUrl)
      setIsOpen(false)
    }
  }

  // Oznacz wszystkie jako przeczytane
  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all')
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {
      // ignoruj
    }
  }

  return (
    <div className="notif-bell-wrapper" ref={dropdownRef}>
      <button
        className="topbar-icon-btn notif-bell-btn"
        onClick={handleToggle}
        title="Powiadomienia"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notif-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <span className="notif-dropdown-title">Powiadomienia</span>
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={handleMarkAllRead}>
                <Check size={14} />
                Oznacz wszystkie jako przeczytane
              </button>
            )}
          </div>

          <div className="notif-dropdown-list">
            {loading && (
              <div className="notif-empty">Ladowanie...</div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="notif-empty">Brak powiadomien</div>
            )}

            {!loading &&
              notifications.map((notif) => {
                const config = SEVERITY_CONFIG[notif.severity] || SEVERITY_CONFIG.info
                const Icon = config.icon

                return (
                  <button
                    key={notif._id}
                    className={`notif-item ${notif.read ? '' : 'notif-item-unread'}`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className={`notif-item-icon ${config.className}`}>
                      <Icon size={16} />
                    </div>
                    <div className="notif-item-content">
                      <div className="notif-item-title">{notif.title}</div>
                      <div className="notif-item-body">{notif.body}</div>
                      <div className="notif-item-time">{timeAgo(notif.createdAt)}</div>
                    </div>
                    {!notif.read && <div className="notif-item-dot" />}
                  </button>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
