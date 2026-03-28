/**
 * Demo mode - lokalne dane testowe, bez backendu.
 */

const DEMO_USER = {
  _id: 'demo-parent-001',
  email: 'demo@serveiq.pl',
  firstName: 'Anna',
  lastName: 'Kowalska',
  role: 'parent',
  onboardingCompleted: true,
  subscription: {
    plan: 'premium',
    status: 'trialing',
    trialEndsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
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

// --- Generate extended history (90 days) for trends ---
function generateExtendedHistory(days = 90) {
  const data = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const dayData = generateDayMetrics(dateStr)
    // Add light/awake minutes for sleep detail
    const sleep = dayData.metrics.sleep
    const lightMin = Math.max(0, sleep.totalMinutes - sleep.deepMinutes - sleep.remMinutes - Math.round(sleep.totalMinutes * 0.05))
    const awakeMin = Math.round(sleep.totalMinutes * 0.05)
    sleep.lightMinutes = lightMin
    sleep.awakeMinutes = awakeMin
    data.push({ ...dayData, type: 'daily_summary', _id: `wd-${i}`, provider: 'whoop' })
  }
  return data
}

function generateTrendsData(range = 7) {
  const allData = generateExtendedHistory(range * 2)
  const currentData = allData.slice(range)
  const prevData = allData.slice(0, range)

  function avg(arr) { return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : 0 }
  function min(arr) { return arr.length ? Math.min(...arr) : 0 }
  function max(arr) { return arr.length ? Math.max(...arr) : 0 }
  function delta(cur, prev) { return prev ? Math.round((cur - prev) / prev * 1000) / 10 : 0 }

  function extract(data) {
    const hr = [], hrv = [], sleep = [], recovery = [], strain = []
    data.forEach(d => {
      const m = d.metrics
      if (m.heartRate?.resting) hr.push(m.heartRate.resting)
      if (m.hrv?.value) hrv.push(m.hrv.value)
      if (m.sleep?.quality) sleep.push(m.sleep.quality)
      if (m.recovery?.score) recovery.push(m.recovery.score)
      if (m.strain?.value) strain.push(m.strain.value)
    })
    return { hr, hrv, sleep, recovery, strain }
  }

  const cur = extract(currentData)
  const prev = extract(prevData)

  const chartData = currentData.map(d => ({
    date: d.date,
    hr: d.metrics?.heartRate?.resting || null,
    hrv: d.metrics?.hrv?.value || null,
    sleep: d.metrics?.sleep?.quality || null,
    recovery: d.metrics?.recovery?.score || null,
    strain: d.metrics?.strain?.value || null,
  }))

  const sleepDetail = currentData.map(d => ({
    date: d.date,
    deep: d.metrics?.sleep?.deepMinutes || 0,
    rem: d.metrics?.sleep?.remMinutes || 0,
    light: d.metrics?.sleep?.lightMinutes || 0,
    awake: d.metrics?.sleep?.awakeMinutes || 0,
  }))

  return {
    range,
    chartData,
    sleepDetail,
    metrics: {
      hr: { current: { min: min(cur.hr), avg: avg(cur.hr), max: max(cur.hr) }, previous: { min: min(prev.hr), avg: avg(prev.hr), max: max(prev.hr) }, delta: delta(avg(cur.hr), avg(prev.hr)) },
      hrv: { current: { min: min(cur.hrv), avg: avg(cur.hrv), max: max(cur.hrv) }, previous: { min: min(prev.hrv), avg: avg(prev.hrv), max: max(prev.hrv) }, delta: delta(avg(cur.hrv), avg(prev.hrv)) },
      sleep: { current: { min: min(cur.sleep), avg: avg(cur.sleep), max: max(cur.sleep) }, previous: { min: min(prev.sleep), avg: avg(prev.sleep), max: max(prev.sleep) }, delta: delta(avg(cur.sleep), avg(prev.sleep)) },
      recovery: { current: { min: min(cur.recovery), avg: avg(cur.recovery), max: max(cur.recovery) }, previous: { min: min(prev.recovery), avg: avg(prev.recovery), max: max(prev.recovery) }, delta: delta(avg(cur.recovery), avg(prev.recovery)) },
      strain: { current: { min: min(cur.strain), avg: avg(cur.strain), max: max(cur.strain) }, previous: { min: min(prev.strain), avg: avg(prev.strain), max: max(prev.strain) }, delta: delta(avg(cur.strain), avg(prev.strain)) },
    },
  }
}

function generateCompareData(p1From, p1To, p2From, p2To) {
  function getMetrics(from, to) {
    const start = new Date(from)
    const end = new Date(to)
    const hr = [], hrv = [], sleep = [], recovery = [], strain = []
    let days = 0
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const dayData = generateDayMetrics(dateStr)
      const m = dayData.metrics
      hr.push(m.heartRate.resting)
      hrv.push(m.hrv.value)
      sleep.push(m.sleep.quality)
      recovery.push(m.recovery.score)
      strain.push(m.strain.value)
      days++
    }
    function avg(a) { return a.length ? Math.round(a.reduce((s,v)=>s+v,0)/a.length*10)/10 : 0 }
    function mn(a) { return a.length ? Math.min(...a) : 0 }
    function mx(a) { return a.length ? Math.max(...a) : 0 }
    return {
      hr: { min: mn(hr), avg: avg(hr), max: mx(hr) },
      hrv: { min: mn(hrv), avg: avg(hrv), max: mx(hrv) },
      sleep: { min: mn(sleep), avg: avg(sleep), max: mx(sleep) },
      recovery: { min: mn(recovery), avg: avg(recovery), max: mx(recovery) },
      strain: { min: mn(strain), avg: avg(strain), max: mx(strain) },
      days,
    }
  }
  const p1 = getMetrics(p1From, p1To)
  const p2 = getMetrics(p2From, p2To)
  function delta(cur, prev) { return prev ? Math.round((cur - prev) / prev * 1000) / 10 : 0 }
  return {
    period1: { from: p1From, to: p1To, ...p1 },
    period2: { from: p2From, to: p2To, ...p2 },
    deltas: {
      hr: delta(p1.hr.avg, p2.hr.avg),
      hrv: delta(p1.hrv.avg, p2.hrv.avg),
      sleep: delta(p1.sleep.avg, p2.sleep.avg),
      recovery: delta(p1.recovery.avg, p2.recovery.avg),
      strain: delta(p1.strain.avg, p2.strain.avg),
    },
  }
}

function generateTimelineEvents() {
  const events = []
  const now = new Date()

  // Skill updates
  events.push({ type: 'skill_update', date: new Date(now - 2 * 86400000).toISOString(), title: 'Serwis: 72% -> 78%', description: 'Trening techniczny - praca nad drugim serwisem' })
  events.push({ type: 'skill_update', date: new Date(now - 5 * 86400000).toISOString(), title: 'Forhend: 79% -> 82%', description: 'Sparing - intensywna praca z forhenda' })
  events.push({ type: 'skill_update', date: new Date(now - 9 * 86400000).toISOString(), title: 'Kondycja: 82% -> 85%', description: 'Trening kondycyjny' })
  events.push({ type: 'skill_update', date: new Date(now - 14 * 86400000).toISOString(), title: 'Taktyka: 67% -> 70%', description: 'Praca nad czytaniem gry przeciwnika' })
  events.push({ type: 'skill_update', date: new Date(now - 21 * 86400000).toISOString(), title: 'Bekhend: 62% -> 65%', description: 'Bekhend jedoreczny - poprawa techniki' })

  // Tournaments
  events.push({ type: 'tournament', date: new Date(now - 7 * 86400000).toISOString(), title: 'Turniej Krakow Junior Open - #8', description: 'Krakow, nawierzchnia: clay' })
  events.push({ type: 'tournament', date: new Date(now - 25 * 86400000).toISOString(), title: 'Turniej Wroclaw Cup - #12', description: 'Wroclaw, nawierzchnia: hard' })
  events.push({ type: 'tournament', date: new Date(now - 45 * 86400000).toISOString(), title: 'Turniej Poznan Open Junior - #16', description: 'Poznan, nawierzchnia: clay' })

  // Goals completed
  events.push({ type: 'goal_completed', date: '2026-03-10T10:00:00.000Z', title: 'Cel osiagniety', description: 'Opanowanie drop shota' })
  events.push({ type: 'goal_completed', date: '2026-02-20T10:00:00.000Z', title: 'Cel osiagniety', description: 'Poprawa backhanda do 60%' })

  // Health trends
  events.push({ type: 'health_trend', date: new Date(now - 3 * 86400000).toISOString(), title: 'HRV wzroslo o 12%', description: 'Srednie HRV: 78 ms (vs 69 ms tydzien wczesniej)' })
  events.push({ type: 'health_trend', date: new Date(now - 12 * 86400000).toISOString(), title: 'Regeneracja poprawila sie o 8%', description: 'Sredni wynik regeneracji: 74% (vs 68% tydzien wczesniej)' })
  events.push({ type: 'health_trend', date: new Date(now - 20 * 86400000).toISOString(), title: 'Jakosc snu spadla o 6%', description: 'Srednia jakosc snu: 71% (vs 76% tydzien wczesniej)' })

  // Device connected
  events.push({ type: 'device_connected', date: new Date(now - 30 * 86400000).toISOString(), title: 'Polaczono WHOOP 4.0', description: 'Urzadzenie rozpoczelo zbieranie danych' })
  events.push({ type: 'device_connected', date: new Date(now - 28 * 86400000).toISOString(), title: 'Polaczono Garmin Forerunner 265', description: 'Urzadzenie rozpoczelo zbieranie danych' })

  // More skill updates for richness
  events.push({ type: 'skill_update', date: new Date(now - 35 * 86400000).toISOString(), title: 'Wolej: 50% -> 55%', description: 'Praca przy siatce z trenerem' })
  events.push({ type: 'skill_update', date: new Date(now - 42 * 86400000).toISOString(), title: 'Serwis: 68% -> 72%', description: 'Pierwszy serwis - wieksza precyzja' })
  events.push({ type: 'skill_update', date: new Date(now - 50 * 86400000).toISOString(), title: 'Forhend: 75% -> 79%', description: 'Forhend z rotacja - nowa technika' })

  // Sort by date descending
  events.sort((a, b) => new Date(b.date) - new Date(a.date))
  return events
}

// --- Demo API response handlers ---
const DEMO_HISTORY = generateHistory()
const DEMO_SESSIONS = generateSessions()
const DEMO_TIMELINE = generateTimelineEvents()

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

  // GET /notifications
  'GET /notifications': {
    notifications: [
      {
        _id: 'notif-1',
        type: 'recovery_low',
        title: 'Krytyczna regeneracja - Kacper Kowalski',
        body: 'Wynik regeneracji: 28%. Zalecany odpoczynek i lzejszy trening.',
        severity: 'critical',
        read: false,
        player: 'demo-player-001',
        actionUrl: '/parent/player/demo-player-001/health',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: 'notif-2',
        type: 'health_alert',
        title: 'Za malo snu - Kacper Kowalski',
        body: 'Czas snu: 5h 20min (minimum: 6h). Niewystarczajacy sen moze wplynac na regeneracje.',
        severity: 'warning',
        read: false,
        player: 'demo-player-001',
        actionUrl: '/parent/player/demo-player-001/health',
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: 'notif-3',
        type: 'recovery_high',
        title: 'Swietna regeneracja - Kacper Kowalski',
        body: 'Wynik regeneracji: 92%. Organizm gotowy na intensywny trening!',
        severity: 'info',
        read: false,
        player: 'demo-player-001',
        actionUrl: '/parent/player/demo-player-001/health',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: 'notif-4',
        type: 'milestone',
        title: 'Cel osiagniety - Kacper Kowalski',
        body: 'Kacper Kowalski osiagnal cel: "Opanowanie drop shota". Gratulacje!',
        severity: 'info',
        read: true,
        player: 'demo-player-001',
        actionUrl: '/parent/player/demo-player-001',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: 'notif-5',
        type: 'device_disconnected',
        title: 'Brak synchronizacji - WHOOP 4.0',
        body: 'Urzadzenie WHOOP 4.0 (Kacper Kowalski) nie synchronizowalo sie od ponad 24 godzin. Sprawdz polaczenie.',
        severity: 'warning',
        read: true,
        player: 'demo-player-001',
        actionUrl: '/parent/devices',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: 'notif-6',
        type: 'weekly_summary',
        title: 'Tygodniowe podsumowanie',
        body: 'Podsumowanie tygodnia zostalo wyslane na demo@serveiq.pl.',
        severity: 'info',
        read: true,
        player: null,
        actionUrl: '/parent/dashboard',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    total: 6,
    limit: 20,
    offset: 0,
  },

  // GET /notifications/unread-count
  'GET /notifications/unread-count': { count: 3 },

  // POST /wearables (connect)
  'POST /wearables': { message: 'Urzadzenie zostalo polaczone', device: DEMO_DEVICES[0] },

  // POST /wearables/:id/sync
  'POST /wearables/demo-device-whoop/sync': { message: 'Synchronizacja zakonczona', lastSyncAt: new Date().toISOString(), battery: 70, recordsGenerated: 4 },
  'POST /wearables/demo-device-garmin/sync': { message: 'Synchronizacja zakonczona', lastSyncAt: new Date().toISOString(), battery: 83, recordsGenerated: 4 },

  // POST /players/self (create child from onboarding)
  'POST /players/self': DEMO_PLAYER,

  // PUT /auth/profile
  'PUT /auth/profile': { user: DEMO_USER },

  // PUT /auth/onboarding
  'PUT /auth/onboarding': { message: 'Onboarding zakończony' },

  // PUT /auth/change-password
  'PUT /auth/change-password': { message: 'Hasło zmienione' },

  // PUT /auth/notification-settings
  'PUT /auth/notification-settings': { message: 'Zapisano' },

  // PUT /notifications/read-all
  'PUT /notifications/read-all': { message: 'ok' },

  // DELETE /wearables/:id
  'DELETE /wearables/demo-device-whoop': { message: 'Urzadzenie zostalo odlaczone' },
  'DELETE /wearables/demo-device-garmin': { message: 'Urzadzenie zostalo odlaczone' },

  // DELETE /auth/account
  'DELETE /auth/account': { message: 'Konto usuniete' },

  // GET /messages/conversations
  'GET /messages/conversations': [],

  // GET /subscriptions
  'GET /subscriptions': {
    subscription: {
      plan: 'premium',
      status: 'trialing',
      trialEndsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    },
  },

  // POST /subscriptions/checkout
  'POST /subscriptions/checkout': { url: '#demo-checkout' },

  // POST /subscriptions/portal
  'POST /subscriptions/portal': { url: '#demo-portal' },

  // POST /subscriptions/cancel
  'POST /subscriptions/cancel': {
    message: 'Subskrypcja zostanie anulowana na koniec okresu rozliczeniowego',
    subscription: {
      plan: 'premium',
      status: 'trialing',
      cancelAtPeriodEnd: true,
      currentPeriodEnd: null,
    },
  },
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
  const upperMethod = method.toUpperCase()

  const key = `${upperMethod} ${path}`

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

  // /wearables/data/:playerId/trends
  const trendsMatch = path.match(/^\/wearables\/data\/([^/]+)\/trends$/)
  if (trendsMatch && upperMethod === 'GET') {
    const params = new URLSearchParams(queryStr)
    const range = parseInt(params.get('range')) || 7
    return generateTrendsData(range)
  }

  // /wearables/data/:playerId/compare
  const compareMatch = path.match(/^\/wearables\/data\/([^/]+)\/compare$/)
  if (compareMatch && upperMethod === 'GET') {
    const params = new URLSearchParams(queryStr)
    const p1From = params.get('p1_from')
    const p1To = params.get('p1_to')
    const p2From = params.get('p2_from')
    const p2To = params.get('p2_to')
    if (p1From && p1To && p2From && p2To) {
      return generateCompareData(p1From, p1To, p2From, p2To)
    }
    // Fallback defaults
    const now = new Date()
    const d7 = new Date(now - 7 * 86400000).toISOString().split('T')[0]
    const d14 = new Date(now - 14 * 86400000).toISOString().split('T')[0]
    return generateCompareData(d7, now.toISOString().split('T')[0], d14, d7)
  }

  // /wearables/data/:playerId
  const dataMatch = path.match(/^\/wearables\/data\/([^/]+)$/)
  if (dataMatch) {
    return DEMO_RESPONSES['GET /wearables/data/demo-player-001']
  }

  // /players/:id/timeline (GET)
  const timelineMatch = path.match(/^\/players\/([^/]+)\/timeline$/)
  if (timelineMatch && upperMethod === 'GET') {
    return { events: DEMO_TIMELINE }
  }

  // /players/:id (GET)
  const playerMatch = path.match(/^\/players\/([^/]+)$/)
  if (playerMatch && upperMethod === 'GET') {
    return DEMO_PLAYER
  }

  // /players/:id/avatar (PUT)
  const avatarMatch = path.match(/^\/players\/([^/]+)\/avatar$/)
  if (avatarMatch && upperMethod === 'PUT') {
    return { avatarUrl: null, message: 'Avatar zaktualizowany' }
  }

  // /wearables/:id/sync
  const syncMatch = path.match(/^\/wearables\/([^/]+)\/sync$/)
  if (syncMatch) {
    return { message: 'Synchronizacja zakonczona', lastSyncAt: new Date().toISOString(), battery: 70, recordsGenerated: 4 }
  }

  // /wearables/:id (DELETE)
  const deleteWearableMatch = path.match(/^\/wearables\/([^/]+)$/)
  if (deleteWearableMatch && upperMethod === 'DELETE') {
    return { message: 'Urzadzenie zostalo odlaczone' }
  }

  // /sessions with query
  if (path === '/sessions') {
    return { sessions: DEMO_SESSIONS }
  }

  // /notifications/unread-count
  if (path === '/notifications/unread-count' && upperMethod === 'GET') {
    return DEMO_RESPONSES['GET /notifications/unread-count']
  }

  // /notifications/:id/read (PUT)
  const notifReadMatch = path.match(/^\/notifications\/([^/]+)\/read$/)
  if (notifReadMatch && upperMethod === 'PUT') {
    return { message: 'Oznaczono jako przeczytane' }
  }

  // /notifications/:id (DELETE)
  const notifDeleteMatch = path.match(/^\/notifications\/([^/]+)$/)
  if (notifDeleteMatch && upperMethod === 'DELETE') {
    return { message: 'Powiadomienie zostalo usuniete' }
  }

  // /notifications
  if (path === '/notifications' && upperMethod === 'GET') {
    return DEMO_RESPONSES['GET /notifications']
  }

  // /notifications/read-all
  if (path === '/notifications/read-all' && upperMethod === 'PUT') {
    return { message: 'ok' }
  }

  // /auth/profile (PUT)
  if (path === '/auth/profile' && upperMethod === 'PUT') {
    return { user: DEMO_USER }
  }

  // /auth/onboarding (PUT)
  if (path === '/auth/onboarding' && upperMethod === 'PUT') {
    return { message: 'Onboarding zakończony' }
  }

  // /auth/change-password (PUT)
  if (path === '/auth/change-password' && upperMethod === 'PUT') {
    return { message: 'Hasło zmienione' }
  }

  // /auth/notification-settings (PUT)
  if (path === '/auth/notification-settings' && upperMethod === 'PUT') {
    return { message: 'Zapisano' }
  }

  // /auth/account (DELETE)
  if (path === '/auth/account' && upperMethod === 'DELETE') {
    return { message: 'Konto usuniete' }
  }

  return null
}
