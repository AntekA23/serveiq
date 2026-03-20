import { useState, useEffect, useRef, useCallback } from 'react'
import { Send } from 'lucide-react'
import { io } from 'socket.io-client'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import Avatar from '../../components/ui/Avatar/Avatar'
import Button from '../../components/ui/Button/Button'
import './Chat.css'

function formatTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function Chat() {
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const socketRef = useRef(null)

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Load conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true)
        const { data } = await api.get('/messages/conversations')
        const convos = data.conversations || data || []
        setConversations(convos)

        // Auto-select first conversation
        if (convos.length > 0 && !activeConversation) {
          setActiveConversation(convos[0])
        }
      } catch {
        // no conversations yet
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [])

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConversation) return

    const fetchMessages = async () => {
      try {
        const userId = activeConversation.userId || activeConversation._id
        const { data } = await api.get(`/messages/conversation/${userId}`)
        setMessages(data.messages || data || [])

        // Mark as read
        await api.put(`/messages/read/${userId}`).catch(() => {})
      } catch {
        setMessages([])
      }
    }

    fetchMessages()
  }, [activeConversation])

  // Socket.io connection
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || window.location.origin
    const socket = io(socketUrl, {
      auth: { token: accessToken },
    })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('join', { userId: user?._id })
    })

    socket.on('message', (message) => {
      setMessages((prev) => [...prev, message])
    })

    return () => {
      socket.disconnect()
    }
  }, [accessToken, user])

  const handleSend = async () => {
    if (!newMessage.trim() || !activeConversation) return

    setSending(true)
    try {
      const recipientId = activeConversation.userId || activeConversation._id
      const { data } = await api.post('/messages', {
        recipientId,
        content: newMessage.trim(),
      })
      const msg = data.message || data
      setMessages((prev) => [...prev, msg])
      setNewMessage('')
    } catch {
      // failed to send
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (loading) {
    return (
      <div className="parent-chat">
        <div className="parent-chat-empty">Ładowanie...</div>
      </div>
    )
  }

  if (conversations.length === 0 && !activeConversation) {
    return (
      <div className="parent-chat">
        <div className="parent-chat-empty">
          Brak konwersacji. Trener skontaktuje się z Tobą wkrótce.
        </div>
      </div>
    )
  }

  const coach = activeConversation

  return (
    <div className="parent-chat">
      <div className="parent-chat-header">
        <Avatar
          firstName={coach?.firstName || coach?.name?.split(' ')[0] || ''}
          lastName={coach?.lastName || coach?.name?.split(' ')[1] || ''}
          size={36}
          role="coach"
        />
        <span className="parent-chat-header-name">
          {coach?.firstName
            ? `${coach.firstName} ${coach.lastName || ''}`
            : coach?.name || 'Trener'}
        </span>
      </div>

      <div className="parent-chat-messages">
        {messages.length === 0 && (
          <div className="parent-chat-no-messages">
            Brak wiadomości. Napisz pierwszą wiadomość!
          </div>
        )}
        {messages.map((msg, idx) => {
          const isSent = msg.sender === user?._id || msg.senderId === user?._id
          return (
            <div
              key={msg._id || idx}
              className={`parent-chat-message ${isSent ? 'sent' : 'received'}`}
            >
              <div>{msg.content || msg.text}</div>
              <div className="parent-chat-message-time">
                {formatTime(msg.createdAt || msg.timestamp)}
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="parent-chat-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Napisz wiadomość..."
          disabled={sending}
        />
        <Button
          variant="primary"
          size="sm"
          onClick={handleSend}
          disabled={!newMessage.trim()}
          loading={sending}
          icon={Send}
        >
          Wyślij
        </Button>
      </div>
    </div>
  )
}
