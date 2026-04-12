import { useState } from 'react'
import { X } from 'lucide-react'

export default function TagInput({ value = [], onChange, placeholder = 'Wpisz i naciśnij Enter...' }) {
  const [input, setInput] = useState('')

  const addTag = (text) => {
    const tag = text.trim()
    if (tag && !value.includes(tag)) {
      onChange([...value, tag])
    }
    setInput('')
  }

  const removeTag = (idx) => {
    onChange(value.filter((_, i) => i !== idx))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value.length - 1)
    }
  }

  return (
    <div className="tag-input-wrap">
      {value.map((tag, i) => (
        <span key={i} className="tag-input-tag">
          {tag}
          <button type="button" className="tag-input-remove" onClick={() => removeTag(i)}>
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        className="tag-input-field"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => input && addTag(input)}
        placeholder={value.length === 0 ? placeholder : ''}
      />
    </div>
  )
}
