import { Target, Swords, Dumbbell, Heart, Trophy, Circle } from 'lucide-react'

export const SESSION_TYPES = {
  kort:        { label: 'Kort',        color: 'var(--color-green)',           bg: 'var(--color-green-bg)',  icon: Target },
  sparing:     { label: 'Sparing',     color: 'var(--color-amber)',           bg: 'var(--color-amber-bg)',  icon: Swords },
  kondycja:    { label: 'Kondycja',    color: 'var(--color-blue)',            bg: 'var(--color-blue-bg)',   icon: Dumbbell },
  rozciaganie: { label: 'Rozciaganie', color: 'var(--color-purple)',          bg: 'var(--color-purple-bg)', icon: Heart },
  mecz:        { label: 'Mecz',        color: 'var(--color-heart)',           bg: 'var(--color-heart-bg)',  icon: Trophy },
  inne:        { label: 'Inne',        color: 'var(--color-text-tertiary)',   bg: 'var(--color-bg-tertiary)', icon: Circle },
}

export const SURFACES = {
  clay:         { label: 'Maczka', emoji: '🟤' },
  hard:         { label: 'Hard',   emoji: '🔵' },
  grass:        { label: 'Trawa',  emoji: '🟢' },
  carpet:       { label: 'Dywan',  emoji: '🟡' },
  'indoor-hard': { label: 'Hala',  emoji: '⚪' },
}

// Typy sesji dla których nawierzchnia ma sens
export const SURFACE_TYPES = ['kort', 'sparing', 'mecz']

export const DAY_NAMES = ['Pon', 'Wt', 'Sr', 'Czw', 'Pt', 'Sb', 'Nd']
export const DAY_NAMES_FULL = ['Poniedzialek', 'Wtorek', 'Sroda', 'Czwartek', 'Piatek', 'Sobota', 'Niedziela']
export const DAY_NUMBERS = [1, 2, 3, 4, 5, 6, 7]
export const MONTH_NAMES = [
  'Styczen', 'Luty', 'Marzec', 'Kwiecien', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpien', 'Wrzesien', 'Pazdziernik', 'Listopad', 'Grudzien',
]

export function dateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getWeekStart(date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  d.setHours(0, 0, 0, 0)
  return d
}

export function sessionsForDate(sessions, d) {
  const ds = dateStr(d)
  return sessions
    .filter((s) => dateStr(new Date(s.date)) === ds)
    .sort((a, b) => (a.startTime || '99:99').localeCompare(b.startTime || '99:99'))
}

export function totalMinutes(entries) {
  return entries.reduce((sum, s) => sum + (s.durationMinutes || 0), 0)
}

export function formatDuration(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}
