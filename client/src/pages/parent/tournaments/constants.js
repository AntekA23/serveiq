export const SURFACES = {
  clay: { label: 'Maczka', emoji: '🟤' },
  hard: { label: 'Hard', emoji: '🔵' },
  grass: { label: 'Trawa', emoji: '🟢' },
  carpet: { label: 'Dywan', emoji: '🟡' },
  'indoor-hard': { label: 'Hala', emoji: '⚪' },
}

export const CATEGORIES = ['U10', 'U12', 'U14', 'U16', 'U18', 'Open', 'ITF Junior', 'PZT']
export const DRAW_SIZES = [8, 16, 32, 64, 128]
export const ROUNDS = [
  { value: 'R1', label: 'Runda 1' },
  { value: 'R2', label: 'Runda 2' },
  { value: 'R3', label: 'Runda 3' },
  { value: 'QF', label: 'Cwiercfinal' },
  { value: 'SF', label: 'Polfinał' },
  { value: 'F', label: 'Final' },
  { value: 'W', label: 'Zwyciestwo' },
]

export function daysUntil(dateStr) {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function formatDateRange(start, end) {
  const s = new Date(start)
  const opts = { day: 'numeric', month: 'short' }
  if (!end) return s.toLocaleDateString('pl-PL', opts)
  const e = new Date(end)
  if (s.getMonth() === e.getMonth()) return `${s.getDate()}-${e.toLocaleDateString('pl-PL', opts)}`
  return `${s.toLocaleDateString('pl-PL', opts)} — ${e.toLocaleDateString('pl-PL', opts)}`
}
