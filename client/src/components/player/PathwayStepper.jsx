import { Check } from 'lucide-react'
import './PathwayStepper.css'

const DEFAULT_STAGES = [
  { key: 'beginner', label: 'Poczatkujacy', color: '#ef4444' },
  { key: 'tennis10_red', label: 'Czerwony kort', color: '#ef4444' },
  { key: 'tennis10_orange', label: 'Pomaranczowy kort', color: '#f97316' },
  { key: 'tennis10_green', label: 'Zielony kort', color: '#22c55e' },
  { key: 'committed', label: 'Zawodnik', color: '#3b82f6' },
  { key: 'advanced', label: 'Zaawansowany', color: '#8b5cf6' },
  { key: 'performance', label: 'Performance', color: '#eab308' },
]

export default function PathwayStepper({ currentStage, pathwayHistory }) {
  const stages = DEFAULT_STAGES
  const currentIndex = stages.findIndex((s) => s.key === currentStage)

  return (
    <div className="pathway-stepper">
      <div className="pathway-stepper-track">
        {stages.map((stage, idx) => {
          const isCompleted = currentIndex > idx
          const isCurrent = currentIndex === idx
          const isFuture = currentIndex < idx

          return (
            <div key={stage.key} className="pathway-stepper-item">
              {idx > 0 && (
                <div
                  className={`pathway-stepper-line ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                />
              )}
              <div
                className={`pathway-stepper-circle ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isFuture ? 'future' : ''}`}
                style={
                  isCurrent
                    ? { background: stage.color, borderColor: stage.color }
                    : isCompleted
                      ? { background: 'var(--color-green)', borderColor: 'var(--color-green)' }
                      : {}
                }
              >
                {isCompleted && <Check size={12} strokeWidth={3} />}
              </div>
              <span
                className={`pathway-stepper-label ${isCurrent ? 'current' : ''} ${isFuture ? 'future' : ''}`}
              >
                {stage.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
