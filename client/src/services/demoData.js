/**
 * Demo mode - lokalne dane testowe, bez backendu.
 */

const DEMO_USER = {
  _id: 'demo-parent-001',
  email: 'demo@serveiq.pl',
  firstName: 'Anna',
  lastName: 'Kowalska',
  role: 'parent',
  parentProfile: {
    children: ['demo-player-001'],
  },
}

const DEMO_PLAYER = {
  _id: 'demo-player-001',
  firstName: 'Kacper',
  lastName: 'Kowalski',
  dateOfBirth: '2012-05-15',
  gender: 'M',
  coach: 'demo-coach-001',
  parents: ['demo-parent-001'],
  avatarUrl: null,
  active: true,
  ranking: {
    pzt: 45,
    te: 128,
  },
  skills: {
    serve: { score: 78, notes: 'Dobry pierwszy serwis, pracujemy nad drugim' },
    forehand: { score: 82, notes: 'Mocny forhend z rotacja' },
    backhand: { score: 65, notes: 'Bekhend jednoręczny wymaga pracy' },
    volley: { score: 55, notes: 'Wolej do poprawy - za mało pewności przy siatce' },
    tactics: { score: 70, notes: 'Coraz lepsze czytanie gry' },
    fitness: { score: 85, notes: 'Świetna kondycja, szybki na korcie' },
  },
  goals: [
    { _id: 'g1', text: 'Poprawa serwisu do 85%', dueDate: '2026-05-01', completed: false },
    { _id: 'g2', text: 'Turniej Warszawa - top 16', dueDate: '2026-04-15', completed: false },
    { _id: 'g3', text: 'Ranking PZT top 40', dueDate: '2026-12-31', completed: false },
    { _id: 'g4', text: 'Opanowanie drop shota', completedAt: '2026-03-10', completed: true },
    { _id: 'g5', text: 'Poprawa backhanda do 60%', completedAt: '2026-02-20', completed: true },
  ],
  trainingPlan: {
    weeklyGoal: {
      sessionsPerWeek: 5,
      hoursPerWeek: 8,
    },
    focus: ['Serwis', 'Kondycja', 'Taktyka'],
    notes: 'Skupić się na drugim serwisie i grze przy siatce. Przygotowania do turnieju w Warszawie.',
    nextMilestone: {
      text: 'Turniej Warszawa Open Junior',
      date: '2026-04-15',
    },
  },
}

// --- Seeded PRNG (same as backend) ---
function seededRandom(seed) {
  let t = seed | 0
  return function () {
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function hashSeed(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function rngRange(rng, min, max) { return min + rng() * (max - min) }
function rngInt(rng, min, max) { return Math.floor(rngRange(rng, min, max + 1)) }

function isTrainingDay(date) {
  return [1, 3, 5, 6].includes(date.getDay())
}

function generateDayMetrics(dateStr) {
  const seed = hashSeed(`demo-player-001-${dateStr}`)
  const rng = seededRandom(seed)
  const date = new Date(dateStr)
  const training = isTrainingDay(date)

  const sleepTotal = rngInt(rng, 420, 570)
  const deepPct = rngRange(rng, 0.15, 0.25)
  const remPct = rngRange(rng, 0.20, 0.28)
  const sleepQuality = Math.round(Math.min(100, Math.max(60, (sleepTotal / 540 * 0.5 + deepPct / 0.25 * 0.5) * 100 * rngRange(rng, 0.85, 1.05))))

  const restingHR = rngInt(rng, 55, 68)
  const hrvValue = Math.round(Math.min(95, Math.max(55, rngRange(rng, 55, 95) + (sleepQuality - 70) / 3)))
  const trendRoll = rng()
  const hrvTrend = trendRoll < 0.33 ? 'up' : trendRoll < 0.66 ? 'stable' : 'down'

  const recoveryBase = (sleepQuality / 100 * 0.5 + (hrvValue - 55) / 40 * 0.5) * 100
  const recoveryScore = Math.round(Math.min(98, Math.max(30, recoveryBase * rngRange(rng, 0.85, 1.15))))
  const recoveryStatus = recoveryScore >= 67 ? 'green' : recoveryScore >= 40 ? 'yellow' : 'red'
  const recoveryRec = recoveryScore >= 67
    ? 'Organizm w pelni zregenerowany. Mozesz trenowac intensywnie.'
    : recoveryScore >= 40
    ? 'Umiarkowana regeneracja. Zalecany lejszy trening.'
    : 'Niska regeneracja. Zalecany odpoczynek.'

  const strainValue = training
    ? Math.round(rngRange(rng, 5, 18) * 10) / 10
    : Math.round(rngRange(rng, 2, 8) * 10) / 10

  return {
    date: dateStr,
    metrics: {
      heartRate: { resting: restingHR, max: training ? rngInt(rng, 175, 198) : rngInt(rng, 120, 155), avg: training ? rngInt(rng, 85, 110) : rngInt(rng, 68, 85) },
      hrv: { value: hrvValue, trend: hrvTrend },
      sleep: { totalMinutes: sleepTotal, deepMinutes: Math.round(sleepTotal * deepPct), remMinutes: Math.round(sleepTotal * remPct), quality: sleepQuality, bedtime: `${rngInt(rng, 21, 22)}:${String(rngInt(rng, 0, 59)).padStart(2, '0')}`, wakeTime: `${rngInt(rng, 6, 7)}:${String(rngInt(rng, 0, 45)).padStart(2, '0')}` },
      strain: { value: strainValue, calories: training ? rngInt(rng, 1800, 3200) : rngInt(rng, 1200, 1800), activityMinutes: training ? rngInt(rng, 90, 180) : rngInt(rng, 20, 60) },
      recovery: { score: recoveryScore, status: recoveryStatus, recommendation: recoveryRec },
      activity: { steps: training ? rngInt(rng, 8000, 15000) : rngInt(rng, 5000, 9000) },
      bodyBattery: { current: rngInt(rng, 40, 85), high: rngInt(rng, 70, 95), low: rngInt(rng, 25, 50) },
    },
  }
}

// Generate 30 days of history
function generateHistory() {
  const data = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    data.push({ ...generateDayMetrics(dateStr), type: 'daily_summary', _id: `wd-${i}`, provider: 'whoop' })
  }
  return data
}

const DEMO_DEVICES = [
  {
    _id: 'demo-device-whoop',
    player: 'demo-player-001',
    parent: 'demo-parent-001',
    provider: 'whoop',
    deviceName: 'WHOOP 4.0',
    deviceId: 'WHOOP-A1B2C3D4',
    connected: true,
    lastSyncAt: new Date(Date.now() - 5 * 60000).toISOString(),
    battery: 72,
    settings: { syncInterval: 15, notifications: true },
  },
  {
    _id: 'demo-device-garmin',
    player: 'demo-player-001',
    parent: 'demo-parent-001',
    provider: 'garmin',
    deviceName: 'Garmin Forerunner 265',
    deviceId: 'GARMIN-E5F6G7H8',
    connected: true,
    lastSyncAt: new Date(Date.now() - 12 * 60000).toISOString(),
    battery: 85,
    settings: { syncInterval: 15, notifications: true },
  },
]

// Generate sessions for the current month
function generateSessions() {
  const sessions = []
  const now = new Date()
  for (let i = 30; i >= 0; i--) {
    const d = new Date()
    d.setDate(now.getDate() - i)
    if (isTrainingDay(d)) {
      sessions.push({
        _id: `session-${i}`,
        player: 'demo-player-001',
        coach: 'demo-coach-001',
        date: d.toISOString(),
        durationMinutes: [60, 90, 90, 120][Math.floor(Math.random() * 4)],
        title: ['Trening techniczny', 'Sparing', 'Kondycja + kort', 'Praca nad serwisem'][Math.floor(Math.random() * 4)],
        visibleToParent: true,
      })
    }
  }
  return sessions
}

const todayMetrics = generateDayMetrics(new Date().toISOString().split('T')[0])

// --- Demo API response handlers ---
const DEMO_HISTORY = generateHistory()
const DEMO_SESSIONS = generateSessions()

export const DEMO_RESPONSES = {
  // GET /players
  'GET /players': { players: [DEMO_PLAYER] },

  // GET /players/:id
  [`GET /players/demo-player-001`]: DEMO_PLAYER,

  // GET /wearables
  'GET /wearables': { devices: DEMO_DEVICES },

  // GET /wearables/data/:playerId/latest
  'GET /wearables/data/demo-player-001/latest': {
    latest: {
      daily_summary: { type: 'daily_summary', metrics: todayMetrics.metrics },
      sleep: { type: 'sleep', metrics: { sleep: todayMetrics.metrics.sleep, hrv: todayMetrics.metrics.hrv, heartRate: { resting: todayMetrics.metrics.heartRate.resting } } },
      recovery: { type: 'recovery', metrics: { recovery: todayMetrics.metrics.recovery, hrv: todayMetrics.metrics.hrv, heartRate: { resting: todayMetrics.metrics.heartRate.resting }, sleep: { quality: todayMetrics.metrics.sleep.quality, totalMinutes: todayMetrics.metrics.sleep.totalMinutes } } },
    },
    devices: DEMO_DEVICES,
  },

  // GET /wearables/data/:playerId
  'GET /wearables/data/demo-player-001': { data: DEMO_HISTORY },

  // GET /sessions
  'GET /sessions': { sessions: DEMO_SESSIONS },

  // GET /payments
  'GET /payments': { payments: [] },

  // POST /wearables (connect)
  'POST /wearables': { message: 'Urzadzenie zostalo polaczone', device: DEMO_DEVICES[0] },

  // POST /wearables/:id/sync
  'POST /wearables/demo-device-whoop/sync': { message: 'Synchronizacja zakonczona', lastSyncAt: new Date().toISOString(), battery: 70, recordsGenerated: 4 },
  'POST /wearables/demo-device-garmin/sync': { message: 'Synchronizacja zakonczona', lastSyncAt: new Date().toISOString(), battery: 83, recordsGenerated: 4 },

  // DELETE /wearables/:id
  'DELETE /wearables/demo-device-whoop': { message: 'Urzadzenie zostalo odlaczone' },
  'DELETE /wearables/demo-device-garmin': { message: 'Urzadzenie zostalo odlaczone' },

  // GET /messages/conversations
  'GET /messages/conversations': [],
}

export const DEMO_TOKEN = 'demo-token-serveiq'

export function getDemoUser() {
  return DEMO_USER
}

/**
 * Match a demo response for a given method + url
 */
export function matchDemoResponse(method, url) {
  // Strip /api prefix and query params for matching
  let path = url.replace(/^.*\/api/, '').split('?')[0]
  const queryStr = url.split('?')[1] || ''

  const key = `${method.toUpperCase()} ${path}`

  // Exact match
  if (DEMO_RESPONSES[key]) {
    return DEMO_RESPONSES[key]
  }

  // Pattern matching for dynamic IDs
  // /wearables/data/:playerId/latest
  const latestMatch = path.match(/^\/wearables\/data\/([^/]+)\/latest$/)
  if (latestMatch) {
    return DEMO_RESPONSES['GET /wearables/data/demo-player-001/latest']
  }

  // /wearables/data/:playerId
  const dataMatch = path.match(/^\/wearables\/data\/([^/]+)$/)
  if (dataMatch) {
    return DEMO_RESPONSES['GET /wearables/data/demo-player-001']
  }

  // /players/:id
  const playerMatch = path.match(/^\/players\/([^/]+)$/)
  if (playerMatch && method.toUpperCase() === 'GET') {
    return DEMO_PLAYER
  }

  // /wearables/:id/sync
  const syncMatch = path.match(/^\/wearables\/([^/]+)\/sync$/)
  if (syncMatch) {
    return { message: 'Synchronizacja zakonczona', lastSyncAt: new Date().toISOString(), battery: 70, recordsGenerated: 4 }
  }

  // /wearables/:id (DELETE)
  const deleteMatch = path.match(/^\/wearables\/([^/]+)$/)
  if (deleteMatch && method.toUpperCase() === 'DELETE') {
    return { message: 'Urzadzenie zostalo odlaczone' }
  }

  // /sessions with query
  if (path === '/sessions') {
    return { sessions: DEMO_SESSIONS }
  }

  return null
}
