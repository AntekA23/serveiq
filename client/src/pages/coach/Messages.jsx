import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Send } from 'lucide-react'
import { io } from 'socket.io-client'
import api from '../../api/axios'
import Avatar from '../../components/ui/Avatar/Avatar'
import Button from '../../components/ui/Button/Button'
import useAuthStore from '../../store/authStore'
import useUiStore from '../../store/uiStore'
import './Messages.css'

function formatTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return hh + ':' + mm
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const dd = String(d.getDate()).padStart(2, '0')
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return dd + '.' + mo + '.' + yyyy
}

export default function Messages() {
  const { userId: paramUserId } = useParams()
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const addToast = useUiStore((s) => s.addToast)

  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(paramUserId || null)
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showConversations, setShowConversations] = useState(!paramUserId)

  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  // Fetch conversations list
  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/messages/conversations')
      setConversations(Array.isArray(res.data) ? res.data : res.data.conversations || [])
    } catch (err) {
      addToast('Nie udało się pobrać konwersacji', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async (userId) => {
    if (!userId) return
    try {
      const res = await api.get('/messages/conversation/' + userId)
      setMessages(Array.isArray(res.data) ? res.data : res.data.messages || [])
      // Mark as read
      await api.put('/messages/read/' + userId).catch(() => {})
    } catch (err) {
      addToast('Nie udało się pobrać wiadomości', 'error')
    }
  }, [addToast])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation)
    }
  }, [activeConversation, fetchMessages])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Socket.io connection
  useEffect(() => {
    const socketUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SOCKET_URL) || '/'
    const socket = io(socketUrl, {
      auth: { token: accessToken },
    })
    socketRef.current = socket

    socket.on('connect', () => {
      if (user?._id) {
        socket.emit('join', user._id)
      }
    })

    socket.on('message', (msg) => {
      setMessages((prev) => [...prev, msg])
      fetchConversations()
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [user, accessToken, fetchConversations])

  const handleSendMessage = async () => {
    if (!messageText.trim() || !activeConversation) return
    setSending(true)
    const text = messageText.trim()
    setMessageText('')

    try {
      // Emit via socket
      if (socketRef.current?.connected) {
        socketRef.current.emit('message', {
          to: activeConversation,
          text,
          token: accessToken,
        })
      }

      // POST as fallback / persistence
      await api.post('/messages', {
        to: activeConversation,
        text,
      })

      fetchMessages(activeConversation)
      fetchConversations()
    } catch (err) {
      addToast('Nie udało się wysłać wiadomości', 'error')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const selectConversation = (userId) => {
    setActiveConversation(userId)
    setShowConversations(false)
  }

  const activeUser = conversations.find((c) => (c.user?._id || c.user) === activeConversation)

  if (loading) {
    return (
      <div className="page-enter">
        <h1 className="page-title">Wiadomości</h1>
        <p className="messages-loading">Ładowanie...</p>
      </div>
    )
  }

  return (
    <div className="page-enter">
      <h1 className="page-title messages-title">Wiadomości</h1>
      <div className="messages-layout">
        {/* Conversations list */}
        <div className={'conversations-list' + (showConversations ? ' show' : '')}>
          {conversations.length === 0 ? (
            <div className="conversations-empty">Brak konwersacji</div>
          ) : (
            conversations.map((conv) => {
              const convUser = conv.user || {}
              const convUserId = convUser._id || conv.user
              const isActive = convUserId === activeConversation
              return (
                <div
                  key={convUserId}
                  className={'conversation-item' + (isActive ? ' active' : '')}
                  onClick={() => selectConversation(convUserId)}
                >
                  <Avatar
                    firstName={convUser.firstName || ''}
                    lastName={convUser.lastName || ''}
                    size={32}
                    role="parent"
                  />
                  <div className="conversation-info">
                    <div className="conversation-name">
                      {convUser.firstName || ''} {convUser.lastName || ''}
                    </div>
                    <div className="conversation-last">
                      {conv.lastMessage?.text || ''}
                    </div>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="conversation-unread">{conv.unreadCount}</div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Chat panel */}
        {activeConversation ? (
          <div className="chat-panel">
            <div className="chat-header">
              <button
                className="chat-back-btn"
                onClick={() => setShowConversations(true)}
              >
                ←
              </button>
              <Avatar
                firstName={activeUser?.user?.firstName || ''}
                lastName={activeUser?.user?.lastName || ''}
                size={28}
                role="parent"
              />
              <span className="chat-header-name">
                {activeUser?.user?.firstName || ''} {activeUser?.user?.lastName || ''}
              </span>
            </div>

            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="chat-empty">Rozpocznij konwersację</div>
              ) : (
                messages.map((msg, idx) => {
                  const isSent = (msg.from === user?._id) || (msg.from?._id === user?._id)
                  return (
                    <div
                      key={msg._id || idx}
                      className={'chat-message' + (isSent ? ' sent' : ' received')}
                    >
                      <div>{msg.text}</div>
                      <div className="chat-message-time">
                        {formatTime(msg.createdAt)}
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input">
              <input
                type="text"
                className="input"
                placeholder="Napisz wiadomość..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button
                variant="primary"
                size="sm"
                icon={Send}
                loading={sending}
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
              >
                Wyślij
              </Button>
            </div>
          </div>
        ) : (
          <div className="chat-panel">
            <div className="chat-empty">
              Wybierz konwersację, aby rozpocząć
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
