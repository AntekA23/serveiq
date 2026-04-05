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
    scheduledDays: [1, 3, 4, 5, 6],
    focus: ['Serwis', 'Kondycja', 'Taktyka'],
    notes: 'Skupić się na drugim serwisie i grze przy siatce. Przygotowania do turnieju w Warszawie.',
    milestones: [
      { _id: 'ms1', text: 'Turniej Warszawa Open Junior', date: '2026-04-15', description: 'Cel: Top 16. Nawierzchnia clay.', completed: false },
      { _id: 'ms2', text: 'Serwis na poziomie 85%', date: '2026-05-01', description: 'Poprawa drugiego serwisu — wiekszy spin i precyzja.', completed: false },
      { _id: 'ms3', text: 'Ranking PZT top 40', date: '2026-12-31', description: null, completed: false },
      { _id: 'ms4', text: 'Opanowanie kick serve', date: '2026-03-01', description: 'Nowy typ serwisu do arsenalu.', completed: true, completedAt: '2026-03-05T10:00:00.000Z' },
      { _id: 'ms5', text: 'Poprawa woleja do 50%', date: '2026-02-15', description: null, completed: true, completedAt: '2026-02-18T10:00:00.000Z' },
    ],
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


// Session templates for multi-entry days
const SESSION_TEMPLATES = [
  // Training day pattern A: kort + rozciąganie
  [
    { sessionType: 'kort', surface: 'clay', startTime: '10:00', duration: 90, title: 'Trening techniczny', notes: null },
    { sessionType: 'rozciaganie', surface: '', startTime: '11:45', duration: 30, title: 'Rozciaganie po treningu', notes: null },
  ],
  // Pattern B: kondycja + kort + rozciąganie
  [
    { sessionType: 'kondycja', surface: '', startTime: '09:00', duration: 60, title: 'Silownia — gorne partie', notes: null },
    { sessionType: 'kort', surface: 'hard', startTime: '14:00', duration: 90, title: 'Praca nad serwisem', notes: 'Fokus na drugim serwisie.' },
    { sessionType: 'rozciaganie', surface: '', startTime: '15:45', duration: 20, title: 'Mobilnosc', notes: null },
  ],
  // Pattern C: sparing
  [
    { sessionType: 'rozciaganie', surface: '', startTime: '09:30', duration: 20, title: 'Rozgrzewka', notes: null },
    { sessionType: 'sparing', surface: 'clay', startTime: '10:00', duration: 120, title: 'Sparing z Kubą', notes: 'Dobry mecz, Kacper gral agresywnie.' },
  ],
  // Pattern D: kort only
  [
    { sessionType: 'kort', surface: 'indoor-hard', startTime: '16:00', duration: 90, title: 'Trening z trenerem', notes: null },
  ],
  // Pattern E: kondycja + rozciąganie
  [
    { sessionType: 'kondycja', surface: '', startTime: '10:00', duration: 60, title: 'Trening kondycyjny — nogi + agility', notes: null },
    { sessionType: 'rozciaganie', surface: '', startTime: '11:15', duration: 30, title: 'Stretching', notes: null },
  ],
  // Pattern F: mecz
  [
    { sessionType: 'rozciaganie', surface: '', startTime: '08:00', duration: 15, title: 'Rozgrzewka przedmeczowa', notes: null },
    { sessionType: 'mecz', surface: 'clay', startTime: '09:00', duration: 90, title: 'Turniej — runda 1', notes: 'Wygrana 6:3, 6:4' },
  ],
]

// Generate sessions for the current month (multi-entry per day)
function generateSessions() {
  const sessions = []
  const now = new Date()
  let sessionCounter = 0
  for (let i = 30; i >= 0; i--) {
    const d = new Date()
    d.setDate(now.getDate() - i)
    if (!isTrainingDay(d)) continue
    // Future days get no sessions (only scheduled slots)
    if (d > now) continue

    const seed = hashSeed(`session-${d.toISOString().split('T')[0]}`)
    const rng = seededRandom(seed)
    const patternIdx = rngInt(rng, 0, SESSION_TEMPLATES.length - 1)
    const pattern = SESSION_TEMPLATES[patternIdx]
    const isCoach = rng() > 0.3

    for (const tmpl of pattern) {
      sessions.push({
        _id: `session-${sessionCounter++}`,
        player: { _id: 'demo-player-001', firstName: 'Kacper', lastName: 'Kowalski' },
        coach: isCoach ? { _id: 'demo-coach-001', firstName: 'Tomasz', lastName: 'Nowak' } : null,
        createdBy: isCoach ? 'demo-coach-001' : 'demo-parent-001',
        source: isCoach ? 'coach' : 'parent',
        date: d.toISOString(),
        startTime: tmpl.startTime,
        sessionType: tmpl.sessionType,
        surface: tmpl.surface || '',
        durationMinutes: tmpl.duration,
        title: tmpl.title,
        notes: tmpl.notes,
        visibleToParent: true,
      })
    }
  }
  return sessions
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

  // More skill updates for richness
  events.push({ type: 'skill_update', date: new Date(now - 35 * 86400000).toISOString(), title: 'Wolej: 50% -> 55%', description: 'Praca przy siatce z trenerem' })
  events.push({ type: 'skill_update', date: new Date(now - 42 * 86400000).toISOString(), title: 'Serwis: 68% -> 72%', description: 'Pierwszy serwis - wieksza precyzja' })
  events.push({ type: 'skill_update', date: new Date(now - 50 * 86400000).toISOString(), title: 'Forhend: 75% -> 79%', description: 'Forhend z rotacja - nowa technika' })

  // Sort by date descending
  events.sort((a, b) => new Date(b.date) - new Date(a.date))
  return events
}

// --- Demo API response handlers ---
const DEMO_SESSIONS = generateSessions()
const DEMO_TIMELINE = generateTimelineEvents()

export const DEMO_RESPONSES = {
  // GET /players
  'GET /players': { players: [DEMO_PLAYER] },

  // GET /players/:id
  [`GET /players/demo-player-001`]: { player: DEMO_PLAYER },

  // GET /sessions
  'GET /sessions': { sessions: DEMO_SESSIONS },

  // GET /tournaments
  'GET /tournaments': {
    tournaments: [
      // Upcoming
      {
        _id: 'tn-1', player: { _id: 'demo-player-001', firstName: 'Kacper', lastName: 'Kowalski' },
        name: 'Warszawa Open Junior', location: 'KT Arkadia, Warszawa', surface: 'clay',
        startDate: new Date(Date.now() + 12 * 86400000).toISOString(),
        endDate: new Date(Date.now() + 14 * 86400000).toISOString(),
        category: 'U14', drawSize: 32, status: 'planned', source: 'parent', notes: 'Cel: top 8',
      },
      {
        _id: 'tn-2', player: { _id: 'demo-player-001', firstName: 'Kacper', lastName: 'Kowalski' },
        name: 'Puchar Wisly U14', location: 'Tenis Krakow', surface: 'clay',
        startDate: new Date(Date.now() + 28 * 86400000).toISOString(),
        category: 'U14', drawSize: 16, status: 'planned', source: 'parent',
      },
      {
        _id: 'tn-3', player: { _id: 'demo-player-001', firstName: 'Kacper', lastName: 'Kowalski' },
        name: 'PZT Mistrzostwa Regionu', location: 'Hala Arena, Lodz', surface: 'indoor-hard',
        startDate: new Date(Date.now() + 45 * 86400000).toISOString(),
        endDate: new Date(Date.now() + 47 * 86400000).toISOString(),
        category: 'U14', drawSize: 64, status: 'planned', source: 'parent',
      },
      // History
      {
        _id: 'tn-4', player: { _id: 'demo-player-001', firstName: 'Kacper', lastName: 'Kowalski' },
        name: 'Krakow Junior Open', location: 'KS Olsza, Krakow', surface: 'clay',
        startDate: new Date(Date.now() - 7 * 86400000).toISOString(),
        endDate: new Date(Date.now() - 5 * 86400000).toISOString(),
        category: 'U14', drawSize: 32, status: 'completed', source: 'parent',
        result: { round: 'QF', wins: 2, losses: 1, scores: ['6-3', '4-6', '7-5'], rating: 4 },
        notes: 'Swietna gra w cwiercfinale, przegrany tie-break w polfinale',
      },
      {
        _id: 'tn-5', player: { _id: 'demo-player-001', firstName: 'Kacper', lastName: 'Kowalski' },
        name: 'Wroclaw Cup', location: 'Tie Break, Wroclaw', surface: 'hard',
        startDate: new Date(Date.now() - 25 * 86400000).toISOString(),
        category: 'U14', drawSize: 16, status: 'completed', source: 'parent',
        result: { round: 'SF', wins: 3, losses: 1, scores: ['6-2', '6-4'], rating: 4 },
      },
      {
        _id: 'tn-6', player: { _id: 'demo-player-001', firstName: 'Kacper', lastName: 'Kowalski' },
        name: 'Poznan Open Junior', location: 'KT Olimpia, Poznan', surface: 'clay',
        startDate: new Date(Date.now() - 45 * 86400000).toISOString(),
        category: 'U14', drawSize: 32, status: 'completed', source: 'parent',
        result: { round: 'R2', wins: 1, losses: 1, scores: ['6-4', '3-6', '2-6'], rating: 2 },
        notes: 'Slaby dzien, problemy z serwisem',
      },
      {
        _id: 'tn-7', player: { _id: 'demo-player-001', firstName: 'Kacper', lastName: 'Kowalski' },
        name: 'PZT Ranking U14 Katowice', location: 'Hala Spodek, Katowice', surface: 'indoor-hard',
        startDate: new Date(Date.now() - 60 * 86400000).toISOString(),
        endDate: new Date(Date.now() - 58 * 86400000).toISOString(),
        category: 'U14', drawSize: 64, status: 'completed', source: 'parent',
        result: { round: 'R3', wins: 2, losses: 1, scores: ['6-1', '6-3'], rating: 3 },
      },
      {
        _id: 'tn-8', player: { _id: 'demo-player-001', firstName: 'Kacper', lastName: 'Kowalski' },
        name: 'Zimowy Turniej Warszawa', location: 'Mera, Warszawa', surface: 'carpet',
        startDate: new Date(Date.now() - 90 * 86400000).toISOString(),
        category: 'U14', drawSize: 16, status: 'completed', source: 'parent',
        result: { round: 'W', wins: 4, losses: 0, scores: ['6-2', '6-0'], rating: 5 },
        notes: 'Pierwsze zwyciestwo w turnieju!',
      },
    ],
  },

  // GET /payments
  'GET /payments': {
    payments: [
      {
        _id: 'pay-1',
        player: { _id: 'demo-player-001', firstName: 'Kacper', lastName: 'Kowalski' },
        coach: { _id: 'demo-coach-001', firstName: 'Tomasz', lastName: 'Nowak' },
        amount: 450,
        month: '2026-03',
        status: 'pending',
        dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        _id: 'pay-2',
        player: { _id: 'demo-player-001', firstName: 'Kacper', lastName: 'Kowalski' },
        coach: { _id: 'demo-coach-001', firstName: 'Tomasz', lastName: 'Nowak' },
        amount: 450,
        month: '2026-02',
        status: 'paid',
        dueDate: '2026-02-28T23:59:59.000Z',
        paidAt: '2026-02-25T14:30:00.000Z',
        createdAt: '2026-02-01T10:00:00.000Z',
      },
      {
        _id: 'pay-3',
        player: { _id: 'demo-player-001', firstName: 'Kacper', lastName: 'Kowalski' },
        coach: { _id: 'demo-coach-001', firstName: 'Tomasz', lastName: 'Nowak' },
        amount: 450,
        month: '2026-01',
        status: 'paid',
        dueDate: '2026-01-31T23:59:59.000Z',
        paidAt: '2026-01-20T11:00:00.000Z',
        createdAt: '2026-01-01T10:00:00.000Z',
      },
    ],
  },

  // GET /notifications
  'GET /notifications': {
    notifications: [
      {
        _id: 'notif-1',
        type: 'goal_completed',
        title: 'Cel osiagniety - Kacper Kowalski',
        body: 'Kacper Kowalski osiagnal cel: "Opanowanie drop shota". Gratulacje!',
        severity: 'info',
        read: false,
        player: 'demo-player-001',
        actionUrl: '/parent/child/demo-player-001',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: 'notif-2',
        type: 'activity_reminder',
        title: 'Przypomnienie o treningu',
        body: 'Kacper ma zaplanowany trening jutro o 10:00.',
        severity: 'info',
        read: false,
        player: 'demo-player-001',
        actionUrl: '/parent/dashboard',
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: 'notif-3',
        type: 'observation_added',
        title: 'Nowa obserwacja trenera',
        body: 'Trener Tomasz dodal obserwacje dotyczaca serwisu Kacpra.',
        severity: 'info',
        read: true,
        player: 'demo-player-001',
        actionUrl: '/parent/child/demo-player-001',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: 'notif-4',
        type: 'system',
        title: 'Witamy w ServeIQ',
        body: 'Twoje konto zostalo utworzone. Zapraszamy do korzystania z platformy!',
        severity: 'info',
        read: true,
        player: null,
        actionUrl: '/parent/dashboard',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    total: 4,
    limit: 20,
    offset: 0,
  },

  // GET /notifications/unread-count
  'GET /notifications/unread-count': { count: 2 },

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

  // DELETE /auth/account
  'DELETE /auth/account': { message: 'Konto usuniete' },

  // GET /messages/conversations
  'GET /messages/conversations': {
    conversations: [
      {
        _id: 'conv-1',
        userId: 'demo-coach-001',
        firstName: 'Tomasz',
        lastName: 'Nowak',
        role: 'coach',
        lastMessage: {
          text: 'Super, widzimy sie w poniedzialek o 16:00!',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          sender: 'demo-coach-001',
        },
        unreadCount: 1,
      },
    ],
  },

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

  // POST /beta/signup
  'POST /beta/signup': { message: 'Zapisano na liste' },

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

// --- Demo calendar & upcoming generators ---

const DEMO_ACTIVITY_TYPES = ['class', 'camp', 'tournament', 'training', 'match', 'fitness', 'review', 'other']
const DEMO_ACTIVITY_TITLES = {
  class: ['Zajęcia grupowe U14', 'Lekcja tenisa', 'Zajęcia z trenerem'],
  camp: ['Obóz letni Warszawa', 'Camp szkoleniowy'],
  tournament: ['Turniej PZT U14', 'Turniej lokalny', 'Puchar Wisły'],
  training: ['Trening techniczny', 'Praca nad serwisem', 'Trening z trenerem'],
  match: ['Mecz sparingowy', 'Mecz ligowy'],
  fitness: ['Siłownia', 'Trening kondycyjny', 'Agility + bieganie'],
  review: ['Przegląd postępów', 'Analiza wideo'],
  other: ['Stretching', 'Regeneracja'],
}

function generateDemoCalendar(queryStr) {
  const params = new URLSearchParams(queryStr)
  const monthParam = params.get('month')
  const now = new Date()
  const year = monthParam ? parseInt(monthParam.split('-')[0], 10) : now.getFullYear()
  const mon = monthParam ? parseInt(monthParam.split('-')[1], 10) - 1 : now.getMonth()

  const lastDay = new Date(year, mon + 1, 0).getDate()
  const seed = hashSeed(`cal-${year}-${mon}`)
  const rng = seededRandom(seed)

  const days = []
  for (let d = 1; d <= lastDay; d++) {
    const dayDate = new Date(year, mon, d)
    const dow = dayDate.getDay()
    // Skip some days (Sundays mostly quiet)
    if (dow === 0 && rng() > 0.2) continue
    // Random chance of having activities
    if (rng() > 0.6) continue

    const numActivities = rngInt(rng, 1, Math.min(4, dow === 6 ? 2 : 4))
    const activities = []

    for (let i = 0; i < numActivities; i++) {
      const typeIdx = rngInt(rng, 0, DEMO_ACTIVITY_TYPES.length - 1)
      const type = DEMO_ACTIVITY_TYPES[typeIdx]
      const titles = DEMO_ACTIVITY_TITLES[type]
      const title = titles[rngInt(rng, 0, titles.length - 1)]
      const startHour = rngInt(rng, 8, 17)
      const startMin = rng() > 0.5 ? '00' : '30'
      const endHour = Math.min(startHour + rngInt(rng, 1, 2), 20)

      activities.push({
        _id: `demo-act-${year}${mon}${d}-${i}`,
        type,
        title,
        date: dayDate.toISOString(),
        startTime: `${String(startHour).padStart(2, '0')}:${startMin}`,
        endTime: `${String(endHour).padStart(2, '0')}:${startMin}`,
        players: [{ _id: 'demo-player-001', firstName: 'Kacper', lastName: 'Kowalski' }],
        coach: rng() > 0.3 ? { _id: 'demo-coach-001', firstName: 'Tomasz', lastName: 'Nowak' } : null,
        status: dayDate < now ? 'completed' : 'planned',
      })
    }

    const dateStr = `${year}-${String(mon + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({ date: dateStr, activities })
  }

  return { days }
}

function generateDemoUpcoming() {
  const now = new Date()
  const activities = []

  const upcomingItems = [
    { type: 'training', title: 'Trening techniczny', daysAhead: 1, startTime: '10:00' },
    { type: 'fitness', title: 'Siłownia — nogi + agility', daysAhead: 2, startTime: '09:00' },
    { type: 'class', title: 'Zajęcia grupowe U14', daysAhead: 3, startTime: '16:00' },
    { type: 'tournament', title: 'Turniej PZT U14 Warszawa', daysAhead: 7, startTime: '09:00' },
    { type: 'match', title: 'Mecz sparingowy z Kubą', daysAhead: 10, startTime: '14:00' },
  ]

  for (const item of upcomingItems) {
    const d = new Date(now)
    d.setDate(d.getDate() + item.daysAhead)
    activities.push({
      _id: `demo-upcoming-${item.daysAhead}`,
      type: item.type,
      title: item.title,
      date: d.toISOString(),
      startTime: item.startTime,
      players: [{ _id: 'demo-player-001', firstName: 'Kacper', lastName: 'Kowalski' }],
      coach: { _id: 'demo-coach-001', firstName: 'Tomasz', lastName: 'Nowak' },
      status: 'planned',
    })
  }

  return { activities }
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
  // /players/:id/timeline (GET)
  const timelineMatch = path.match(/^\/players\/([^/]+)\/timeline$/)
  if (timelineMatch && upperMethod === 'GET') {
    return { events: DEMO_TIMELINE }
  }

  // /players/:id (GET)
  const playerMatch = path.match(/^\/players\/([^/]+)$/)
  if (playerMatch && upperMethod === 'GET') {
    return { player: DEMO_PLAYER }
  }

  // /players/:id/training-plan (PUT)
  const planMatch = path.match(/^\/players\/([^/]+)\/training-plan$/)
  if (planMatch && upperMethod === 'PUT') {
    return { message: 'Plan treningowy zaktualizowany', trainingPlan: DEMO_PLAYER.trainingPlan }
  }

  // /players/:id/milestones (POST)
  const addMilestoneMatch = path.match(/^\/players\/([^/]+)\/milestones$/)
  if (addMilestoneMatch && upperMethod === 'POST') {
    return { message: 'Kamien milowy dodany', milestone: { _id: 'ms-new-' + Date.now(), text: 'Nowy cel', completed: false } }
  }

  // /players/:id/milestones/:mid (PUT)
  const editMilestoneMatch = path.match(/^\/players\/([^/]+)\/milestones\/([^/]+)$/)
  if (editMilestoneMatch && upperMethod === 'PUT') {
    return { message: 'Kamien milowy zaktualizowany', milestone: { _id: editMilestoneMatch[2] } }
  }

  // /players/:id/milestones/:mid (DELETE)
  if (editMilestoneMatch && upperMethod === 'DELETE') {
    return { message: 'Kamien milowy usuniety' }
  }

  // /players/:id/avatar (PUT)
  const avatarMatch = path.match(/^\/players\/([^/]+)\/avatar$/)
  if (avatarMatch && upperMethod === 'PUT') {
    return { avatarUrl: null, message: 'Avatar zaktualizowany' }
  }

  // DELETE /sessions/:id
  const deleteSessionMatch = path.match(/^\/sessions\/([^/]+)$/)
  if (deleteSessionMatch && upperMethod === 'DELETE') {
    return { message: 'Trening zostal usuniety' }
  }

  // /tournaments (GET with query)
  if (path === '/tournaments' && upperMethod === 'GET') {
    return DEMO_RESPONSES['GET /tournaments']
  }

  // POST /tournaments
  if (path === '/tournaments' && upperMethod === 'POST') {
    return { message: 'Turniej zostal dodany', tournament: { _id: 'tn-new-' + Date.now(), status: 'planned' } }
  }

  // /tournaments/:id (PUT)
  const tournamentMatch = path.match(/^\/tournaments\/([^/]+)$/)
  if (tournamentMatch && upperMethod === 'PUT') {
    return { message: 'Turniej zostal zaktualizowany', tournament: { _id: tournamentMatch[1] } }
  }

  // /tournaments/:id (DELETE)
  if (tournamentMatch && upperMethod === 'DELETE') {
    return { message: 'Turniej zostal usuniety' }
  }

  // POST /sessions (parent adds training)
  if (path === '/sessions' && upperMethod === 'POST') {
    return { message: 'Trening zostal dodany', session: { _id: 'session-new-' + Date.now(), source: 'parent' } }
  }

  // /sessions with query (GET)
  if (path === '/sessions' && upperMethod === 'GET') {
    return { sessions: DEMO_SESSIONS }
  }

  // /messages/conversation/:userId (GET)
  const convMatch = path.match(/^\/messages\/conversation\/([^/]+)$/)
  if (convMatch && upperMethod === 'GET') {
    return {
      messages: [
        { _id: 'msg-1', sender: 'demo-coach-001', text: 'Czesc Aniu! Kacper super sie dzis spisal na treningu.', createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString() },
        { _id: 'msg-2', sender: 'demo-parent-001', text: 'Dziekuje! Cieszymy sie. Jak mu idzie serwis?', createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() },
        { _id: 'msg-3', sender: 'demo-coach-001', text: 'Serwis coraz lepszy, szczegolnie pierwszy. Nad drugim jeszcze pracujemy - brakuje rotacji.', createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
        { _id: 'msg-4', sender: 'demo-parent-001', text: 'Rozumiem. Czy mozemy zwiekszyc ilosc treningow w tym tygodniu? Kacper chce sie przygotowac do turnieju.', createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
        { _id: 'msg-5', sender: 'demo-coach-001', text: 'Jasne, mozemy dodac czwartek o 15:00. Skupimy sie na sparingu.', createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
        { _id: 'msg-6', sender: 'demo-parent-001', text: 'Swietnie, dziekujemy!', createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString() },
        { _id: 'msg-7', sender: 'demo-coach-001', text: 'Super, widzimy sie w poniedzialek o 16:00!', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
      ],
    }
  }

  // /messages/read/:userId (PUT)
  const readMatch = path.match(/^\/messages\/read\/([^/]+)$/)
  if (readMatch && upperMethod === 'PUT') {
    return { message: 'ok' }
  }

  // /messages (POST)
  if (path === '/messages' && upperMethod === 'POST') {
    return { message: { _id: 'msg-new-' + Date.now(), sender: 'demo-parent-001', text: 'Demo', createdAt: new Date().toISOString() } }
  }

  // /payments/:id/checkout (POST)
  const payCheckoutMatch = path.match(/^\/payments\/([^/]+)\/checkout$/)
  if (payCheckoutMatch && upperMethod === 'POST') {
    return { url: '#demo-checkout' }
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

  // /activities/calendar (GET)
  if (path === '/activities/calendar' && upperMethod === 'GET') {
    return generateDemoCalendar(queryStr)
  }

  // /activities/upcoming (GET)
  if (path === '/activities/upcoming' && upperMethod === 'GET') {
    return generateDemoUpcoming()
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
