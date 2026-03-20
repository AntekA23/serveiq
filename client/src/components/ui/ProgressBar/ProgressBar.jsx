import './ProgressBar.css'

export default function ProgressBar({ value = 0, color = 'blue', label, showValue }) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className="progress-bar">
      {(label || showValue) && (
        <div className="progress-bar-label">
          {label && <span className="progress-bar-label-text">{label}</span>}
          {showValue && <span className="progress-bar-value">{clamped}%</span>}
        </div>
      )}
      <div className="progress-bar-track">
        <div
          className={`progress-bar-fill progress-bar-fill-${color}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
