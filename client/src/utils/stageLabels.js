// Single source of truth for turning stored pathway-stage codes
// (e.g. "tennis10_red") into human-readable Polish labels.
// Use everywhere a stage is shown to a user — never render the raw code.
export const PATHWAY_STAGES = [
  { value: 'beginner', label: 'Początkujący' },
  { value: 'tennis10_red', label: 'Czerwony kort' },
  { value: 'tennis10_orange', label: 'Pomarańczowy kort' },
  { value: 'tennis10_green', label: 'Zielony kort' },
  { value: 'committed', label: 'Zawodnik' },
  { value: 'advanced', label: 'Zaawansowany' },
  { value: 'performance', label: 'Performance' },
]

const MAP = Object.fromEntries(PATHWAY_STAGES.map((s) => [s.value, s.label]))

export function stageLabel(value) {
  if (!value) return ''
  return MAP[value] || value
}
