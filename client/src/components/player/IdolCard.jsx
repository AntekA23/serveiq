import { useState } from 'react'
import { Star, ChevronLeft, ChevronRight, RefreshCw, Edit3, Loader } from 'lucide-react'
import api from '../../api/axios'
import Button from '../ui/Button/Button'
import './IdolCard.css'

export default function IdolCard({ playerId, idol, onUpdate }) {
  const [showModal, setShowModal] = useState(false)
  const [inputName, setInputName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [factIndex, setFactIndex] = useState(0)

  const handleSubmit = async () => {
    if (!inputName.trim()) return
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post(`/ai/idol-facts/${playerId}`, { name: inputName.trim() })
      onUpdate(data.idol)
      setShowModal(false)
      setFactIndex(0)
      setInputName('')
    } catch (err) {
      const msg = err.response?.data?.message || 'Nie udało się wygenerować ciekawostek'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (!idol?.name) return
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post(`/ai/idol-facts/${playerId}`, { name: idol.name })
      onUpdate(data.idol)
      setFactIndex(0)
    } catch (err) {
      setError(err.response?.data?.message || 'Nie udało się odświeżyć')
    } finally {
      setLoading(false)
    }
  }

  const facts = idol?.facts || []
  const currentFact = facts[factIndex % facts.length]

  const prevFact = () => setFactIndex((i) => (i - 1 + facts.length) % facts.length)
  const nextFact = () => setFactIndex((i) => (i + 1) % facts.length)

  // ── Empty state ──
  if (!idol?.name) {
    return (
      <>
        <div className="idol-empty" onClick={() => setShowModal(true)}>
          <Star size={20} className="idol-empty-icon" />
          <div className="idol-empty-body">
            <span className="idol-empty-title">Wybierz idola tenisowego</span>
            <span className="idol-empty-sub">Ciekawostki o ulubionym graczu zmotywują Twoje dziecko</span>
          </div>
        </div>
        {showModal && renderModal()}
      </>
    )
  }

  // ── Display state ──
  return (
    <>
      <div className="idol-card">
        <div className="idol-card-header">
          <Star size={14} className="idol-star" />
          <span className="idol-name">{idol.name}</span>
          <div className="idol-actions">
            <button className="idol-action-btn" onClick={() => { setInputName(idol.name); setShowModal(true) }} title="Zmień">
              <Edit3 size={12} />
            </button>
            <button className="idol-action-btn" onClick={handleRefresh} disabled={loading} title="Odśwież ciekawostki">
              <RefreshCw size={12} className={loading ? 'idol-spin' : ''} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="idol-loading">
            <Loader size={16} className="idol-spin" />
            <span>Generowanie ciekawostek...</span>
          </div>
        ) : currentFact ? (
          <div className="idol-fact-row">
            {facts.length > 1 && (
              <button className="idol-nav" onClick={prevFact}><ChevronLeft size={14} /></button>
            )}
            <p className="idol-fact">{currentFact}</p>
            {facts.length > 1 && (
              <button className="idol-nav" onClick={nextFact}><ChevronRight size={14} /></button>
            )}
          </div>
        ) : (
          <p className="idol-fact idol-fact-empty">Brak ciekawostek — kliknij odśwież.</p>
        )}

        {facts.length > 1 && (
          <div className="idol-dots">
            {facts.map((_, i) => (
              <span key={i} className={`idol-dot ${i === factIndex % facts.length ? 'active' : ''}`} onClick={() => setFactIndex(i)} />
            ))}
          </div>
        )}

        {error && <div className="idol-error">{error}</div>}
      </div>

      {showModal && renderModal()}
    </>
  )

  function renderModal() {
    return (
      <div className="idol-modal-overlay" onClick={() => { setShowModal(false); setError(null) }}>
        <div className="idol-modal" onClick={(e) => e.stopPropagation()}>
          <h3 className="idol-modal-title">
            <Star size={16} className="idol-star" /> Ulubiony tenisista
          </h3>
          <p className="idol-modal-sub">
            Wpisz imię i nazwisko profesjonalnego tenisisty lub tenisistki
          </p>
          <input
            className="idol-input"
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            placeholder="np. Iga Świątek, Carlos Alcaraz..."
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleSubmit()}
          />
          {error && <div className="idol-error">{error}</div>}
          <div className="idol-modal-actions">
            <Button size="sm" onClick={() => { setShowModal(false); setError(null) }}
              style={{ background: 'transparent', color: 'var(--color-text-secondary)' }}>
              Anuluj
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={!inputName.trim() || loading}>
              {loading ? 'Generowanie...' : 'Zapisz i generuj'}
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
