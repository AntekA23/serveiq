/**
 * Skill level scale (Opcja C) — descriptive, pathway-aligned
 * Replaces percentage-based skill display across the app.
 */

export const SKILL_LEVELS = [
  { value: 1, label: 'Nowe',     color: 'var(--color-text-tertiary)', bg: 'var(--color-bg-tertiary)',   dot: '#505870' },
  { value: 2, label: 'Poznaje',  color: 'var(--color-blue)',          bg: 'var(--color-blue-bg)',       dot: '#4DA6FF' },
  { value: 3, label: 'Ćwiczy',   color: 'var(--color-amber)',         bg: 'var(--color-amber-bg)',      dot: '#F59E0B' },
  { value: 4, label: 'Stabilne', color: 'var(--color-green)',         bg: 'var(--color-green-bg)',       dot: '#22C55E' },
  { value: 5, label: 'Mocne',    color: '#8B5CF6',                    bg: 'rgba(139,92,246,0.12)',       dot: '#8B5CF6' },
]

export const SKILL_NAMES = {
  serve: 'Serwis',
  forehand: 'Forhend',
  backhand: 'Bekhend',
  volley: 'Wolej',
  movement: 'Ruch',
  tactics: 'Taktyka',
  mental: 'Mental',
  fitness: 'Kondycja',
}

export function getSkillLevel(score) {
  const rounded = Math.round(score || 0)
  return SKILL_LEVELS.find((l) => l.value === rounded) || SKILL_LEVELS[0]
}
