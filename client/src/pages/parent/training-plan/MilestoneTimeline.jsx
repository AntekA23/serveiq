import { useState } from 'react'
import { Award, CheckCircle2, Circle, Plus, Trash2, Save } from 'lucide-react'
import api from '../../../api/axios'
import Button from '../../../components/ui/Button/Button'

export default function MilestoneTimeline({ milestones, childId, onUpdate }) {
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState('')
  const [date, setDate] = useState('')
  const [saving, setSaving] = useState(false)

  const handleAdd = async () => {
    if (!text.trim()) return
    setSaving(true)
    try {
      await api.post(`/players/${childId}/milestones`, { text, date: date || null })
      onUpdate()
      setText('')
      setDate('')
      setAdding(false)
    } catch {}
    setSaving(false)
  }

  const handleToggle = async (m) => {
    try { await api.put(`/players/${childId}/milestones/${m._id}`, { completed: !m.completed }); onUpdate() } catch {}
  }

  const handleDelete = async (m) => {
    try { await api.delete(`/players/${childId}/milestones/${m._id}`); onUpdate() } catch {}
  }

  const active = (milestones || []).filter((m) => !m.completed)
  const completed = (milestones || []).filter((m) => m.completed)

  return (
    <div className="tp-section">
      <div className="tp-section-head">
        <h3><Award size={16} /> Kamienie milowe</h3>
        {!adding && <button className="tp-icon-btn" onClick={() => setAdding(true)}><Plus size={14} /></button>}
      </div>

      {adding && (
        <div className="tp-ms-form">
          <input placeholder="Cel..." value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()} autoFocus />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <div className="tp-ms-form-actions">
            <Button variant="primary" size="sm" onClick={handleAdd} loading={saving}><Save size={14} /> Dodaj</Button>
            <button className="tp-cancel" onClick={() => { setAdding(false); setText(''); setDate('') }}>Anuluj</button>
          </div>
        </div>
      )}

      {active.length === 0 && completed.length === 0 && !adding && (
        <div className="tp-empty">Dodaj cel aby sledzic postepy</div>
      )}

      <div className="tp-ms-list">
        {active.map((m) => (
          <div key={m._id} className="tp-ms">
            <button className="tp-ms-check" onClick={() => handleToggle(m)}><Circle size={16} /></button>
            <div className="tp-ms-body">
              <span className="tp-ms-text">{m.text}</span>
              {m.date && <span className="tp-ms-date">{new Date(m.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}</span>}
            </div>
            <button className="tp-ms-del" onClick={() => handleDelete(m)}><Trash2 size={12} /></button>
          </div>
        ))}
        {completed.map((m) => (
          <div key={m._id} className="tp-ms done">
            <button className="tp-ms-check" onClick={() => handleToggle(m)}><CheckCircle2 size={16} /></button>
            <div className="tp-ms-body">
              <span className="tp-ms-text">{m.text}</span>
            </div>
            <button className="tp-ms-del" onClick={() => handleDelete(m)}><Trash2 size={12} /></button>
          </div>
        ))}
      </div>
    </div>
  )
}
