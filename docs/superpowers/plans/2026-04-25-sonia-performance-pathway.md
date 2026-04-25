# Sonia Antczak — Performance Pathway Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wprowadzić do ServeIQ pełny "tor wyczynowy" (Sonia Antczak — U14, 7× MP, 4-osobowy sztab) jako stress test architektoniczny: nowy model `Achievement`, pole `teamRole` w `User.coachProfile`, 4 nowe sekcje w `ChildProfile` widoczne tylko dla `developmentLevel === 'performance'`, oraz pełny seed demo.

**Architecture:** Plecak danych zostaje — używamy istniejących pól `Player.coaches[]` i `Player.developmentLevel`. Dorzucamy jeden nowy model (`Achievement`) i jedno pole (`teamRole`). UI rozszerzamy *warunkowo*: nowe sekcje renderują się tylko dla zawodników performance, więc Tennis 10 / Junior nie widzą zmian — zero regresji.

**Tech Stack:** Express 4 + Mongoose 8 + Zod (backend), React 18 + Vite + lucide-react (frontend), MongoDB. Bez frameworka testowego — weryfikacja przez `npm run seed` + manual click-through.

**Spec:** `docs/superpowers/specs/2026-04-25-sonia-performance-pathway-design.md`

**Konwencje istniejące, których trzymamy się:**
- Controllers: `xxxController.js` (camelCase + sufiks `Controller`), NIE `xxx.controller.js`
- Routes: `xxx.js` (l.mn.)
- Walidacja: Zod schemy inline w kontrolerach
- Auth middleware: `verifyToken`, `requireRole('coach', 'clubAdmin')`
- Frontend CSS prefix: `cp-` w ChildProfile (parent), `coach-` w panelu trenera
- UI po polsku
- Commits: `feat:`, `fix:`, `refactor:`, `chore:` prefiksy (po commits z `git log`)

**Brak automated tests w projekcie** — każda "weryfikacja" = manualne `npm run seed` + sprawdzenie w przeglądarce.

---

## Task 1: Model `Achievement`

**Files:**
- Create: `server/src/models/Achievement.js`

- [ ] **Step 1: Utwórz model Achievement**

Plik `server/src/models/Achievement.js`:

```js
import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: [true, 'Zawodnik jest wymagany'],
    },
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
    },
    category: {
      type: String,
      enum: ['mp', 'international', 'national', 'ranking', 'callup', 'other'],
      required: [true, 'Kategoria osiągnięcia jest wymagana'],
    },
    title: {
      type: String,
      required: [true, 'Tytuł osiągnięcia jest wymagany'],
      trim: true,
    },
    ageCategory: {
      type: String,
      enum: ['U10', 'U12', 'U14', 'U16', 'U18', 'open'],
    },
    discipline: {
      type: String,
      enum: ['singel', 'debel', 'mix', 'druzynowe'],
      default: 'singel',
    },
    year: {
      type: Number,
      required: [true, 'Rok jest wymagany'],
    },
    date: Date,
    location: { type: String, trim: true },
    result: {
      type: String,
      enum: ['gold', 'silver', 'bronze', 'finalist', 'semifinal', 'quarterfinal', 'other'],
      required: [true, 'Wynik jest wymagany'],
    },
    description: { type: String, trim: true },
    imageUrl: String,
    visibleToParent: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

achievementSchema.index({ player: 1, year: -1 });
achievementSchema.index({ player: 1, category: 1 });

const Achievement = mongoose.model('Achievement', achievementSchema);

export default Achievement;
```

- [ ] **Step 2: Smoke test importu**

Run: `node -e "import('./server/src/models/Achievement.js').then(m => console.log(m.default.modelName))"`
Expected: `Achievement` (jeśli mongoose nie jest połączony, OK — tylko sprawdzamy że plik się parsuje)

- [ ] **Step 3: Commit**

```bash
git add server/src/models/Achievement.js
git commit -m "feat: Achievement model — career palmares for performance players"
```

---

## Task 2: Pole `teamRole` w `User.coachProfile`

**Files:**
- Modify: `server/src/models/User.js:45-59`

- [ ] **Step 1: Dodaj pole `teamRole` do schematu**

W `server/src/models/User.js`, w `coachProfile` (linie 45-59), DODAJ pole `teamRole` zaraz po `bio`. Zmieniony fragment:

```js
    coachProfile: {
      specialization: String,
      itfLevel: String,
      bio: String,
      teamRole: {
        type: String,
        enum: ['head', 'assistant', 'fitness', 'mental', 'physio', 'nutrition'],
        default: 'head',
      },
      assignedGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
      inviteCode: {
        type: String,
        unique: true,
        sparse: true,
      },
      inviteActive: {
        type: Boolean,
        default: true,
      },
    },
```

- [ ] **Step 2: Smoke test parsowania**

Run: `node --check server/src/models/User.js`
Expected: brak outputu (plik parsuje się OK)

- [ ] **Step 3: Commit**

```bash
git add server/src/models/User.js
git commit -m "feat: User.coachProfile.teamRole — head/assistant/fitness/mental/physio/nutrition"
```

---

## Task 3: Controller `achievementController`

**Files:**
- Create: `server/src/controllers/achievementController.js`

- [ ] **Step 1: Utwórz kontroler**

Plik `server/src/controllers/achievementController.js`:

```js
import { z } from 'zod';
import Achievement from '../models/Achievement.js';
import Player from '../models/Player.js';

const createSchema = z.object({
  player: z.string().min(1, 'Zawodnik jest wymagany'),
  club: z.string().optional(),
  category: z.enum(['mp', 'international', 'national', 'ranking', 'callup', 'other']),
  title: z.string().min(1, 'Tytuł jest wymagany'),
  ageCategory: z.enum(['U10', 'U12', 'U14', 'U16', 'U18', 'open']).optional(),
  discipline: z.enum(['singel', 'debel', 'mix', 'druzynowe']).optional(),
  year: z.number().int().min(1900).max(2100),
  date: z.string().optional(),
  location: z.string().optional(),
  result: z.enum(['gold', 'silver', 'bronze', 'finalist', 'semifinal', 'quarterfinal', 'other']),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  visibleToParent: z.boolean().optional(),
});

const updateSchema = createSchema.partial().omit({ player: true });

const canAccessPlayer = async (user, playerId) => {
  const player = await Player.findById(playerId);
  if (!player) return false;
  if (user.role === 'clubAdmin') return true;
  if (user.role === 'coach') {
    return (
      player.coach?.toString() === user._id.toString() ||
      (player.coaches || []).some((c) => c.toString() === user._id.toString())
    );
  }
  if (user.role === 'parent') {
    return (player.parents || []).some((p) => p.toString() === user._id.toString());
  }
  return false;
};

export const getAchievements = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.player) {
      const allowed = await canAccessPlayer(req.user, req.query.player);
      if (!allowed) return res.status(403).json({ message: 'Brak uprawnień' });
      filter.player = req.query.player;
    } else if (req.user.role === 'parent') {
      const childrenIds = req.user.parentProfile?.children || [];
      if (childrenIds.length === 0) return res.json({ achievements: [] });
      filter.player = { $in: childrenIds };
      filter.visibleToParent = true;
    } else if (req.user.role === 'coach') {
      const players = await Player.find({
        $or: [{ coach: req.user._id }, { coaches: req.user._id }],
      }).select('_id');
      filter.player = { $in: players.map((p) => p._id) };
    }
    if (req.query.category) filter.category = req.query.category;
    if (req.query.year) filter.year = Number(req.query.year);

    const achievements = await Achievement.find(filter).sort({ year: -1, date: -1 });
    res.json({ achievements });
  } catch (err) {
    next(err);
  }
};

export const getAchievement = async (req, res, next) => {
  try {
    const a = await Achievement.findById(req.params.id);
    if (!a) return res.status(404).json({ message: 'Nie znaleziono' });
    const allowed = await canAccessPlayer(req.user, a.player);
    if (!allowed) return res.status(403).json({ message: 'Brak uprawnień' });
    res.json({ achievement: a });
  } catch (err) {
    next(err);
  }
};

export const createAchievement = async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const allowed = await canAccessPlayer(req.user, data.player);
    if (!allowed) return res.status(403).json({ message: 'Brak uprawnień' });
    const a = await Achievement.create({ ...data, createdBy: req.user._id });
    res.status(201).json({ achievement: a });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.issues[0]?.message || 'Walidacja' });
    }
    next(err);
  }
};

export const updateAchievement = async (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    const a = await Achievement.findById(req.params.id);
    if (!a) return res.status(404).json({ message: 'Nie znaleziono' });
    const allowed = await canAccessPlayer(req.user, a.player);
    if (!allowed) return res.status(403).json({ message: 'Brak uprawnień' });
    Object.assign(a, data);
    await a.save();
    res.json({ achievement: a });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.issues[0]?.message || 'Walidacja' });
    }
    next(err);
  }
};

export const deleteAchievement = async (req, res, next) => {
  try {
    const a = await Achievement.findById(req.params.id);
    if (!a) return res.status(404).json({ message: 'Nie znaleziono' });
    const allowed = await canAccessPlayer(req.user, a.player);
    if (!allowed) return res.status(403).json({ message: 'Brak uprawnień' });
    await a.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
```

- [ ] **Step 2: Smoke test parsowania**

Run: `node --check server/src/controllers/achievementController.js`
Expected: brak outputu

- [ ] **Step 3: Commit**

```bash
git add server/src/controllers/achievementController.js
git commit -m "feat: achievementController — CRUD with role-based access"
```

---

## Task 4: Routes `achievements`

**Files:**
- Create: `server/src/routes/achievements.js`
- Modify: `server/src/index.js:18-38, 101-121`

- [ ] **Step 1: Utwórz plik routes**

Plik `server/src/routes/achievements.js`:

```js
import { Router } from 'express';
import {
  getAchievements,
  getAchievement,
  createAchievement,
  updateAchievement,
  deleteAchievement,
} from '../controllers/achievementController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(verifyToken);

router.get('/', getAchievements);
router.get('/:id', getAchievement);
router.post('/', requireRole('coach', 'clubAdmin'), createAchievement);
router.put('/:id', requireRole('coach', 'clubAdmin'), updateAchievement);
router.delete('/:id', requireRole('coach', 'clubAdmin'), deleteAchievement);

export default router;
```

- [ ] **Step 2: Zarejestruj routes w `server/src/index.js`**

W `server/src/index.js` DODAJ import (po linii 38, po `import aiRoutes from './routes/ai.js';`):

```js
import achievementRoutes from './routes/achievements.js';
```

I rejestrację (po linii 121, po `app.use('/api/ai', aiRoutes);`):

```js
app.use('/api/achievements', achievementRoutes);
```

- [ ] **Step 3: Smoke test serwera**

Run: `cd server && node --check src/index.js && node --check src/routes/achievements.js`
Expected: brak outputu

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/achievements.js server/src/index.js
git commit -m "feat: /api/achievements routes wired"
```

---

## Task 5: Populate `teamRole` w `playerController`

**Files:**
- Modify: `server/src/controllers/playerController.js` (znajdź `populate('coaches'`)

- [ ] **Step 1: Znajdź wszystkie miejsca z `populate('coaches'`)**

Run: `grep -n "populate.*coaches" C:/Users/Marcin/Desktop/serveiq/server/src/controllers/playerController.js`
Zapisz wszystkie linie. Każda musi mieć rozszerzony select.

- [ ] **Step 2: Zmień każde wystąpienie tak, by `select` zawierało `coachProfile.teamRole`**

Każde `.populate('coaches', '...select string...')` zamień tak, żeby `select string` zawierało:
`firstName lastName email avatarUrl coachProfile.teamRole coachProfile.specialization`

Jeśli istniejący select nie ma w ogóle `coachProfile.teamRole`, dopisz to pole. Jeśli używa skróconej formy `populate('coaches')` bez selectu, zmień na pełną formę z selectem powyżej.

Również znajdź `populate('coach'` (legacy, singular) i zaktualizuj analogicznie.

Run: `grep -n "populate.*coach" C:/Users/Marcin/Desktop/serveiq/server/src/controllers/playerController.js`

- [ ] **Step 3: Smoke test parsowania**

Run: `node --check server/src/controllers/playerController.js`
Expected: brak outputu

- [ ] **Step 4: Commit**

```bash
git add server/src/controllers/playerController.js
git commit -m "feat: include coachProfile.teamRole in player coaches populate"
```

---

## Task 6: Komponent `PalmaresSection`

**Files:**
- Create: `client/src/components/player/PalmaresSection.jsx`
- Create: `client/src/components/player/PalmaresSection.css`

- [ ] **Step 1: Utwórz komponent**

Plik `client/src/components/player/PalmaresSection.jsx`:

```jsx
import { useEffect, useState } from 'react'
import { Trophy, Medal, Award } from 'lucide-react'
import api from '../../api/axios'
import './PalmaresSection.css'

const RESULT_LABEL = {
  gold: 'Mistrz',
  silver: 'Wicemistrz',
  bronze: '3. miejsce',
  finalist: 'Finalista',
  semifinal: 'Półfinał',
  quarterfinal: 'Ćwierćfinał',
  other: 'Wynik',
}

const CATEGORY_LABEL = {
  mp: 'Mistrzostwa Polski',
  international: 'Międzynarodowe',
  national: 'Krajowe',
  ranking: 'Ranking',
  callup: 'Powołanie',
  other: 'Inne',
}

function ResultIcon({ result }) {
  if (result === 'gold') return <Trophy className="ps-icon ps-gold" size={28} />
  if (result === 'silver') return <Medal className="ps-icon ps-silver" size={28} />
  if (result === 'bronze') return <Medal className="ps-icon ps-bronze" size={28} />
  return <Award className="ps-icon ps-other" size={28} />
}

export default function PalmaresSection({ playerId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    api.get(`/achievements?player=${playerId}`)
      .then((res) => { if (alive) setItems(res.data.achievements || []) })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [playerId])

  if (loading) return null
  if (!items.length) return null

  const byYear = items.reduce((acc, a) => {
    (acc[a.year] = acc[a.year] || []).push(a)
    return acc
  }, {})
  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a))

  return (
    <section className="ps-section">
      <header className="ps-header">
        <Trophy size={20} />
        <h2>Palmares</h2>
        <span className="ps-count">{items.length}</span>
      </header>
      <div className="ps-years">
        {years.map((year) => (
          <div key={year} className="ps-year-block">
            <div className="ps-year-label">{year}</div>
            <div className="ps-cards">
              {byYear[year].map((a) => (
                <article key={a._id} className={`ps-card ps-card-${a.result}`}>
                  <ResultIcon result={a.result} />
                  <div className="ps-card-body">
                    <div className="ps-card-title">{a.title}</div>
                    <div className="ps-card-meta">
                      {CATEGORY_LABEL[a.category]}
                      {a.ageCategory && ` · ${a.ageCategory}`}
                      {a.discipline && ` · ${a.discipline}`}
                    </div>
                    {a.location && <div className="ps-card-loc">{a.location}</div>}
                  </div>
                  <div className="ps-card-result">{RESULT_LABEL[a.result]}</div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Utwórz CSS**

Plik `client/src/components/player/PalmaresSection.css`:

```css
.ps-section {
  margin: 24px 0;
  padding: 20px;
  background: linear-gradient(135deg, #fff8e1 0%, #fff 100%);
  border-radius: 16px;
  border: 1px solid #fde68a;
}

.ps-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}
.ps-header h2 {
  font-size: 18px;
  margin: 0;
  flex: 1;
}
.ps-count {
  background: #f59e0b;
  color: white;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}

.ps-years { display: flex; flex-direction: column; gap: 16px; }
.ps-year-label {
  font-weight: 700;
  color: #92400e;
  font-size: 15px;
  margin-bottom: 8px;
}
.ps-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }

.ps-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: white;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.ps-card-gold { border-left: 4px solid #f59e0b; }
.ps-card-silver { border-left: 4px solid #94a3b8; }
.ps-card-bronze { border-left: 4px solid #b45309; }
.ps-card-finalist, .ps-card-semifinal, .ps-card-quarterfinal { border-left: 4px solid #6366f1; }

.ps-icon.ps-gold { color: #f59e0b; }
.ps-icon.ps-silver { color: #94a3b8; }
.ps-icon.ps-bronze { color: #b45309; }
.ps-icon.ps-other { color: #6366f1; }

.ps-card-body { flex: 1; min-width: 0; }
.ps-card-title { font-weight: 600; color: #111827; margin-bottom: 2px; }
.ps-card-meta { font-size: 12px; color: #6b7280; }
.ps-card-loc { font-size: 11px; color: #9ca3af; margin-top: 2px; }
.ps-card-result {
  font-size: 12px;
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
}
```

- [ ] **Step 3: Smoke test**

Run: `cd client && node --check src/components/player/PalmaresSection.jsx 2>&1 || true`
Note: JSX nie zadziała bez babela — pomijamy strict check, polegamy na `vite build` na końcu.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/player/PalmaresSection.jsx client/src/components/player/PalmaresSection.css
git commit -m "feat: PalmaresSection — career trophies grouped by year"
```

---

## Task 7: Komponent `CoachingTeamSection`

**Files:**
- Create: `client/src/components/player/CoachingTeamSection.jsx`
- Create: `client/src/components/player/CoachingTeamSection.css`

- [ ] **Step 1: Utwórz komponent**

Plik `client/src/components/player/CoachingTeamSection.jsx`:

```jsx
import { useNavigate } from 'react-router-dom'
import { Users, MessageCircle } from 'lucide-react'
import './CoachingTeamSection.css'

const ROLE_BADGE = {
  head: { label: 'Trener główny', emoji: '🎾', color: '#3b82f6' },
  assistant: { label: 'Asystent', emoji: '🤝', color: '#06b6d4' },
  fitness: { label: 'Kondycja', emoji: '💪', color: '#10b981' },
  mental: { label: 'Mental', emoji: '🧠', color: '#8b5cf6' },
  physio: { label: 'Fizjo', emoji: '🩺', color: '#ef4444' },
  nutrition: { label: 'Dieta', emoji: '🥗', color: '#84cc16' },
}

function initials(c) {
  return `${(c.firstName || '?')[0] || '?'}${(c.lastName || '?')[0] || '?'}`.toUpperCase()
}

export default function CoachingTeamSection({ coaches = [] }) {
  const navigate = useNavigate()
  if (!coaches.length) return null

  const sorted = [...coaches].sort((a, b) => {
    const order = ['head', 'assistant', 'fitness', 'mental', 'physio', 'nutrition']
    const ai = order.indexOf(a.coachProfile?.teamRole || 'head')
    const bi = order.indexOf(b.coachProfile?.teamRole || 'head')
    return ai - bi
  })

  return (
    <section className="cts-section">
      <header className="cts-header">
        <Users size={20} />
        <h2>Zespół trenerów</h2>
        <span className="cts-count">{coaches.length}</span>
      </header>
      <div className="cts-grid">
        {sorted.map((c) => {
          const role = c.coachProfile?.teamRole || 'head'
          const meta = ROLE_BADGE[role] || ROLE_BADGE.head
          return (
            <article key={c._id} className="cts-card">
              <div className="cts-avatar" style={{ background: meta.color }}>
                {c.avatarUrl ? <img src={c.avatarUrl} alt="" /> : <span>{initials(c)}</span>}
              </div>
              <div className="cts-card-body">
                <div className="cts-name">{c.firstName} {c.lastName}</div>
                <div className="cts-role" style={{ color: meta.color }}>
                  <span>{meta.emoji}</span> {meta.label}
                </div>
                {c.coachProfile?.specialization && (
                  <div className="cts-spec">{c.coachProfile.specialization}</div>
                )}
              </div>
              <button className="cts-msg-btn" onClick={() => navigate(`/parent/messages?to=${c._id}`)}>
                <MessageCircle size={16} />
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Utwórz CSS**

Plik `client/src/components/player/CoachingTeamSection.css`:

```css
.cts-section {
  margin: 24px 0;
  padding: 20px;
  background: linear-gradient(135deg, #f0f9ff 0%, #fff 100%);
  border-radius: 16px;
  border: 1px solid #bae6fd;
}
.cts-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
.cts-header h2 { font-size: 18px; margin: 0; flex: 1; }
.cts-count {
  background: #0ea5e9;
  color: white;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}

.cts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }

.cts-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}
.cts-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
}
.cts-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }

.cts-card-body { flex: 1; min-width: 0; }
.cts-name { font-weight: 600; color: #111827; }
.cts-role { font-size: 12px; font-weight: 600; margin-top: 2px; }
.cts-spec { font-size: 11px; color: #6b7280; margin-top: 2px; line-height: 1.3; }

.cts-msg-btn {
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  color: #4b5563;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.cts-msg-btn:hover { background: #e5e7eb; color: #111827; }
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/player/CoachingTeamSection.jsx client/src/components/player/CoachingTeamSection.css
git commit -m "feat: CoachingTeamSection — 4-role team grid with chat CTAs"
```

---

## Task 8: Komponenty `RankingSummary` + `UpcomingTournaments`

**Files:**
- Create: `client/src/components/player/RankingSummary.jsx`
- Create: `client/src/components/player/RankingSummary.css`
- Create: `client/src/components/player/UpcomingTournaments.jsx`
- Create: `client/src/components/player/UpcomingTournaments.css`

- [ ] **Step 1: Utwórz `RankingSummary.jsx`**

Plik `client/src/components/player/RankingSummary.jsx`:

```jsx
import { TrendingUp } from 'lucide-react'
import './RankingSummary.css'

export default function RankingSummary({ ranking = {} }) {
  const items = []
  if (ranking.pzt) items.push({ label: 'PZT', val: ranking.pzt, color: '#dc2626' })
  if (ranking.te) items.push({ label: 'Tennis Europe', val: ranking.te, color: '#2563eb' })
  if (ranking.itf) items.push({ label: 'ITF Junior', val: ranking.itf, color: '#16a34a' })
  if (ranking.wta) items.push({ label: 'WTA', val: ranking.wta, color: '#7c3aed' })
  if (ranking.atp) items.push({ label: 'ATP', val: ranking.atp, color: '#ea580c' })

  if (!items.length) return null

  return (
    <section className="rs-section">
      <header className="rs-header">
        <TrendingUp size={20} />
        <h2>Ranking</h2>
      </header>
      <div className="rs-grid">
        {items.map((it) => (
          <div key={it.label} className="rs-card" style={{ borderColor: it.color }}>
            <div className="rs-label">{it.label}</div>
            <div className="rs-value" style={{ color: it.color }}>#{it.val}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Utwórz `RankingSummary.css`**

Plik `client/src/components/player/RankingSummary.css`:

```css
.rs-section { margin: 24px 0; padding: 20px; background: white; border-radius: 16px; border: 1px solid #e5e7eb; }
.rs-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
.rs-header h2 { font-size: 18px; margin: 0; }
.rs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
.rs-card {
  padding: 14px;
  border-radius: 12px;
  background: #fafafa;
  border: 2px solid #e5e7eb;
  text-align: center;
}
.rs-label { font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.rs-value { font-size: 28px; font-weight: 800; margin-top: 4px; }
```

- [ ] **Step 3: Utwórz `UpcomingTournaments.jsx`**

Plik `client/src/components/player/UpcomingTournaments.jsx`:

```jsx
import { useEffect, useState } from 'react'
import { Calendar, MapPin } from 'lucide-react'
import api from '../../api/axios'
import './UpcomingTournaments.css'

const STATUS_LABEL = {
  planned: 'Zaplanowany',
  active: 'W trakcie',
  completed: 'Zakończony',
  cancelled: 'Odwołany',
}

export default function UpcomingTournaments({ playerId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    api.get(`/tournaments?player=${playerId}&status=planned`)
      .then((res) => {
        if (!alive) return
        const list = res.data.tournaments || []
        const now = new Date()
        setItems(
          list
            .filter((t) => new Date(t.startDate) >= now)
            .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
            .slice(0, 3)
        )
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [playerId])

  if (loading) return null
  if (!items.length) return null

  return (
    <section className="ut-section">
      <header className="ut-header">
        <Calendar size={20} />
        <h2>Plan turniejowy</h2>
      </header>
      <div className="ut-list">
        {items.map((t) => (
          <article key={t._id} className="ut-card">
            <div className="ut-date">
              <div className="ut-day">{new Date(t.startDate).getDate()}</div>
              <div className="ut-month">{new Date(t.startDate).toLocaleDateString('pl-PL', { month: 'short' })}</div>
            </div>
            <div className="ut-body">
              <div className="ut-name">{t.name}</div>
              <div className="ut-meta">
                <MapPin size={12} /> {t.location}
                {t.category && <> · {t.category}</>}
              </div>
            </div>
            <div className="ut-status">{STATUS_LABEL[t.status] || t.status}</div>
          </article>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Utwórz `UpcomingTournaments.css`**

Plik `client/src/components/player/UpcomingTournaments.css`:

```css
.ut-section { margin: 24px 0; padding: 20px; background: white; border-radius: 16px; border: 1px solid #e5e7eb; }
.ut-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
.ut-header h2 { font-size: 18px; margin: 0; }
.ut-list { display: flex; flex-direction: column; gap: 10px; }
.ut-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  background: #fafafa;
  border-radius: 12px;
  border-left: 4px solid #6366f1;
}
.ut-date {
  text-align: center;
  min-width: 56px;
  padding: 6px 8px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}
.ut-day { font-weight: 800; font-size: 22px; line-height: 1; color: #111827; }
.ut-month { font-size: 11px; color: #6b7280; text-transform: uppercase; margin-top: 2px; }
.ut-body { flex: 1; min-width: 0; }
.ut-name { font-weight: 600; color: #111827; }
.ut-meta { font-size: 12px; color: #6b7280; display: flex; align-items: center; gap: 4px; margin-top: 2px; }
.ut-status {
  padding: 4px 10px;
  background: #eef2ff;
  color: #4338ca;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
```

- [ ] **Step 5: Commit**

```bash
git add client/src/components/player/
git commit -m "feat: RankingSummary + UpcomingTournaments components"
```

---

## Task 9: Rozszerzenie `Player.ranking` o pole `itf`

**Files:**
- Modify: `server/src/models/Player.js:81-86`

- [ ] **Step 1: Dodaj `itf` do schemy**

W `server/src/models/Player.js`, w polu `ranking` (linie 81-86), DODAJ pole `itf`. Zmieniony fragment:

```js
    ranking: {
      pzt: Number,
      te: Number,
      itf: Number,
      wta: Number,
      atp: Number,
    },
```

- [ ] **Step 2: Smoke test**

Run: `node --check server/src/models/Player.js`
Expected: brak outputu

- [ ] **Step 3: Commit**

```bash
git add server/src/models/Player.js
git commit -m "feat: Player.ranking.itf — ITF Junior ranking field"
```

---

## Task 10: Integracja w `ChildProfile` (parent)

**Files:**
- Modify: `client/src/pages/parent/ChildProfile.jsx`

- [ ] **Step 1: Dodaj importy**

W `client/src/pages/parent/ChildProfile.jsx`, w bloku importów (linie 1-10), DODAJ:

```jsx
import PalmaresSection from '../../components/player/PalmaresSection'
import CoachingTeamSection from '../../components/player/CoachingTeamSection'
import RankingSummary from '../../components/player/RankingSummary'
import UpcomingTournaments from '../../components/player/UpcomingTournaments'
```

- [ ] **Step 2: Znajdź miejsce w JSX, gdzie kończy się hero (avatar + imię)**

Run: `grep -n "cp-hero\|cp-name\|cp-rank\|cp-rankings" C:/Users/Marcin/Desktop/serveiq/client/src/pages/parent/ChildProfile.jsx`

Zidentyfikuj sekcję hero (najprawdopodobniej koło linii 90-130). Sekcje performance wstawiamy ZARAZ PO zamknięciu hero, PRZED istniejącymi sekcjami "skills" / "training plan" / "goals".

- [ ] **Step 3: Wstaw warunkowy blok**

Po sekcji hero, DODAJ:

```jsx
{child.developmentLevel === 'performance' && (
  <>
    <PalmaresSection playerId={child._id} />
    <CoachingTeamSection coaches={child.coaches || []} />
    <RankingSummary ranking={child.ranking || {}} />
    <UpcomingTournaments playerId={child._id} />
  </>
)}
```

- [ ] **Step 4: Smoke test — vite build**

Run: `cd client && npm run build`
Expected: kończy się sukcesem (`✓ built in ...`), brak błędów importu/JSX

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/parent/ChildProfile.jsx
git commit -m "feat: ChildProfile — performance sections (palmares/team/ranking/tournaments)"
```

---

## Task 11: Integracja w `CoachPlayerProfile` (coach)

**Files:**
- Modify: `client/src/pages/coach/CoachPlayerProfile.jsx`

- [ ] **Step 1: Dodaj te same importy**

W `client/src/pages/coach/CoachPlayerProfile.jsx` w bloku importów DODAJ:

```jsx
import PalmaresSection from '../../components/player/PalmaresSection'
import CoachingTeamSection from '../../components/player/CoachingTeamSection'
import RankingSummary from '../../components/player/RankingSummary'
import UpcomingTournaments from '../../components/player/UpcomingTournaments'
```

- [ ] **Step 2: Znajdź miejsce po hero**

Run: `grep -n "developmentLevel\|player\.coaches\|hero" C:/Users/Marcin/Desktop/serveiq/client/src/pages/coach/CoachPlayerProfile.jsx`

Wstaw warunkowy blok zaraz po hero, przed pierwszymi tabami / sekcjami:

```jsx
{(player?.developmentLevel === 'performance') && (
  <>
    <PalmaresSection playerId={player._id} />
    <CoachingTeamSection coaches={player.coaches || []} />
    <RankingSummary ranking={player.ranking || {}} />
    <UpcomingTournaments playerId={player._id} />
  </>
)}
```

UWAGA: nazwa zmiennej state może być inna niż `player` — sprawdź `useState` na początku komponentu i użyj właściwej nazwy. Jeśli w pliku jest np. `const [child, setChild]`, użyj `child` zamiast `player`.

- [ ] **Step 3: Vite build**

Run: `cd client && npm run build`
Expected: sukces

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/coach/CoachPlayerProfile.jsx
git commit -m "feat: CoachPlayerProfile — performance sections (DRY with parent view)"
```

---

## Task 12: Seed — 4 trenerzy + parent3

**Files:**
- Modify: `server/src/scripts/seed.js`

- [ ] **Step 1: Znajdź sekcję tworzenia userów (linia ~84)**

Run: `grep -n "USERS\|coach = await User.create\|admin = await User.create" C:/Users/Marcin/Desktop/serveiq/server/src/scripts/seed.js`

- [ ] **Step 2: Dodaj 4 nowych trenerów + parent3 + przypisz `teamRole` istniejącemu coachowi**

Po `const admin = await User.create({...})` (koło linii 134), DODAJ:

```js
    // Performance team — 4 trenerzy Sonii
    const headCoach = await User.create({
      email: 'coach.head@serveiq.pl',
      password: 'password123',
      role: 'coach',
      firstName: 'Marek',
      lastName: 'Wojciechowski',
      phone: '+48 604 500 600',
      isActive: true,
      onboardingCompleted: true,
      coachProfile: {
        teamRole: 'head',
        specialization: 'Trener główny — sztab Sonii Antczak',
        itfLevel: 'ITF Level 3',
        bio: '22 lata doświadczenia. Były trener kadry juniorskiej PZT. Specjalizacja: zawodnicy wyczynowi.',
      },
    });

    const fitnessCoach = await User.create({
      email: 'coach.fitness@serveiq.pl',
      password: 'password123',
      role: 'coach',
      firstName: 'Agnieszka',
      lastName: 'Lewandowska',
      phone: '+48 605 600 700',
      isActive: true,
      onboardingCompleted: true,
      coachProfile: {
        teamRole: 'fitness',
        specialization: 'Przygotowanie motoryczne',
        itfLevel: 'NSCA-CSCS',
        bio: 'Mgr AWF. Specjalistka od przygotowania kondycyjnego juniorek tenisowych.',
      },
    });

    const mentalCoach = await User.create({
      email: 'coach.mental@serveiq.pl',
      password: 'password123',
      role: 'coach',
      firstName: 'Paweł',
      lastName: 'Sokołowski',
      phone: '+48 606 700 800',
      isActive: true,
      onboardingCompleted: true,
      coachProfile: {
        teamRole: 'mental',
        specialization: 'Psychologia sportowa',
        itfLevel: 'Dr nauk',
        bio: 'Dr psychologii sportowej. Pracował z reprezentacją Polski w tenisie.',
      },
    });

    const physioCoach = await User.create({
      email: 'coach.physio@serveiq.pl',
      password: 'password123',
      role: 'coach',
      firstName: 'Karolina',
      lastName: 'Mazur',
      phone: '+48 607 800 900',
      isActive: true,
      onboardingCompleted: true,
      coachProfile: {
        teamRole: 'physio',
        specialization: 'Fizjoterapia sportowa',
        itfLevel: 'Mgr fizjoterapii',
        bio: 'Specjalistka McKenzie/FMS. 10 lat z młodymi tenisistami.',
      },
    });

    const parent3 = await User.create({
      email: 'parent3@serveiq.pl',
      password: 'password123',
      role: 'parent',
      firstName: 'Anna',
      lastName: 'Antczak',
      phone: '+48 608 900 100',
      isActive: true,
      onboardingCompleted: true,
    });
```

- [ ] **Step 3: Dodaj `teamRole: 'head'` do istniejącego `coach`**

Znajdź `const coach = await User.create({` (linia ~84). W `coachProfile`, DODAJ `teamRole: 'head',` jako pierwsze pole. Zmieniony fragment:

```js
      coachProfile: {
        teamRole: 'head',
        specialization: 'Praca z mlodzieża',
        itfLevel: 'ITF Level 2',
        bio: 'Trener tenisa z 15-letnim doswiadczeniem. Specjalizacja: praca z mlodzieża.',
      },
```

- [ ] **Step 4: Zaktualizuj listę trenerów klubu**

Znajdź `coaches: [coach._id]` w `Club.create` (koło linii 195). ZMIEŃ na:

```js
      coaches: [coach._id, headCoach._id, fitnessCoach._id, mentalCoach._id, physioCoach._id],
```

I po `await Promise.all([admin.save(), coach.save()]);` (linia ~201), DODAJ:

```js
    headCoach.club = club._id;
    fitnessCoach.club = club._id;
    mentalCoach.club = club._id;
    physioCoach.club = club._id;
    await Promise.all([
      headCoach.save(), fitnessCoach.save(), mentalCoach.save(), physioCoach.save(),
    ]);
```

- [ ] **Step 5: Zaktualizuj logi konsolowe**

Znajdź `console.log('  Trener:  coach@serveiq.pl   (password123)');` (linia ~136). DODAJ pod nim:

```js
    console.log(`  Head:    coach.head@serveiq.pl    (password123) — Marek (sztab Sonii)`);
    console.log(`  Fitness: coach.fitness@serveiq.pl (password123) — Agnieszka`);
    console.log(`  Mental:  coach.mental@serveiq.pl  (password123) — dr Paweł`);
    console.log(`  Physio:  coach.physio@serveiq.pl  (password123) — Karolina`);
    console.log(`  Rodzic3: parent3@serveiq.pl       (password123) — Anna Antczak (rodzic Sonii)`);
```

- [ ] **Step 6: Smoke test parsowania**

Run: `node --check server/src/scripts/seed.js`
Expected: brak outputu

- [ ] **Step 7: Commit**

```bash
git add server/src/scripts/seed.js
git commit -m "feat: seed performance team — 4 coaches with teamRole + parent3"
```

---

## Task 13: Seed — Sonia + jej dane

**Files:**
- Modify: `server/src/scripts/seed.js`

- [ ] **Step 1: Dodaj import modelu `Achievement`**

W `server/src/scripts/seed.js`, na początku (linia ~17), DODAJ:

```js
import Achievement from '../models/Achievement.js';
```

- [ ] **Step 2: Dodaj `Achievement.deleteMany({})` do listy czyszczenia**

Znajdź blok `await Promise.all([User.deleteMany({}), ...])` (linie ~47-64). DODAJ wewnątrz tablicy:

```js
      Achievement.deleteMany({}),
```

- [ ] **Step 3: Dodaj zawodniczkę Sonię po sekcji Antoniego**

Znajdź `const antoni = await Player.create({` (linia ~309). Po jego zamknięciu (i przed `// Link parents`), DODAJ:

```js
    // Demo Record D — Sonia (Performance pathway — stress test)
    const sonia = await Player.create({
      firstName: 'Sonia',
      lastName: 'Antczak',
      dateOfBirth: new Date('2012-06-14'),
      gender: 'F',
      coach: headCoach._id,
      coaches: [headCoach._id, fitnessCoach._id, mentalCoach._id, physioCoach._id],
      parents: [parent3._id],
      club: club._id,
      pathwayStage: 'performance',
      pathwayHistory: [
        { stage: 'tennis10_red', startDate: new Date('2018-09-01'), endDate: new Date('2019-08-31') },
        { stage: 'tennis10_orange', startDate: new Date('2019-09-01'), endDate: new Date('2020-08-31') },
        { stage: 'tennis10_green', startDate: new Date('2020-09-01'), endDate: new Date('2021-08-31') },
        { stage: 'committed', startDate: new Date('2021-09-01'), endDate: new Date('2023-08-31') },
        { stage: 'advanced', startDate: new Date('2023-09-01'), endDate: new Date('2024-08-31') },
        { stage: 'performance', startDate: new Date('2024-09-01'), notes: 'Przejście na ścieżkę wyczynową — sponsoring klubowy + program PZT' },
      ],
      developmentLevel: 'performance',
      ranking: { pzt: 3, te: 180, itf: 320 },
      trainingPlan: {
        weeklySchedule: [
          { day: 1, sessionType: 'kort', durationMinutes: 90, startTime: '15:00', notes: 'Technika + serwis+1' },
          { day: 1, sessionType: 'kondycja', durationMinutes: 60, startTime: '17:30', notes: 'Siła + szybkość' },
          { day: 2, sessionType: 'kort', durationMinutes: 120, startTime: '15:00', notes: 'Taktyka' },
          { day: 2, sessionType: 'inne', durationMinutes: 30, startTime: '18:00', notes: 'Sesja mentalna' },
          { day: 3, sessionType: 'kort', durationMinutes: 90, startTime: '15:00', notes: 'Return + gra zaczepna' },
          { day: 3, sessionType: 'rozciaganie', durationMinutes: 60, startTime: '17:30', notes: 'Fizjo + regeneracja' },
          { day: 4, sessionType: 'sparing', durationMinutes: 120, startTime: '14:00', notes: 'Sparing meczowy' },
          { day: 4, sessionType: 'kondycja', durationMinutes: 45, startTime: '17:00', notes: 'Interwały' },
          { day: 5, sessionType: 'kort', durationMinutes: 90, startTime: '15:00', notes: 'Specjalistyka — gra' },
          { day: 5, sessionType: 'inne', durationMinutes: 30, startTime: '17:30', notes: 'Rutyny meczowe' },
          { day: 6, sessionType: 'sparing', durationMinutes: 180, startTime: '10:00', notes: 'Turniej / sparing dlugi' },
          { day: 7, sessionType: 'rozciaganie', durationMinutes: 45, startTime: '11:00', notes: 'Regeneracja' },
        ],
        weeklyGoal: { sessionsPerWeek: 12, hoursPerWeek: 14 },
        focus: ['Plaski serwis', 'Taktyka serwis+1', 'Wytrzymałość 3-setowa', 'Rutyny meczowe', 'Mentalność turniejowa'],
        notes: 'Sponsoring klubowy KT Smecz + program PZT pokrywa koszty treningów i wyjazdów. Cel sezonu 2026: kwalifikacja do ITF Junior tour.',
      },
      nextStep: {
        text: 'MP U16 (czerwiec 2026), potem ITF J60 Pardubice. Cel: wejście do top 200 ITF Junior.',
        updatedAt: new Date(),
        updatedBy: headCoach._id,
      },
      idol: {
        name: 'Iga Świątek',
        facts: [
          'Iga Świątek była pierwszą Polką, która zdobyła numer 1 w rankingu WTA, i utrzymała tę pozycję przez ponad rok.',
          'Iga zaczęła grać w tenisa mając zaledwie 5 lat, inspirowana przez ojca — wioślarza olimpijskiego.',
          'Iga pracuje z psychologiem sportowym od 16. roku życia — uważa, że siła mentalna jest równie ważna jak technika.',
          'W 2020 roku Iga wygrała Roland Garros nie tracąc ani jednego seta w całym turnieju — miała wtedy 19 lat.',
        ],
        generatedAt: new Date(),
      },
    });

    // Linkuj Sonię do parent3
    parent3.parentProfile = { children: [sonia._id] };
    await parent3.save();

    console.log(`  Sonia Antczak — Performance (Demo Record D — Sonia full / stress test)\n`);
```

- [ ] **Step 4: Smoke test parsowania**

Run: `node --check server/src/scripts/seed.js`
Expected: brak outputu

- [ ] **Step 5: Commit**

```bash
git add server/src/scripts/seed.js
git commit -m "feat: seed Sonia Antczak — Demo Record D performance pathway"
```

---

## Task 14: Seed — Palmares Sonii (9 achievementów)

**Files:**
- Modify: `server/src/scripts/seed.js`

- [ ] **Step 1: Dodaj sekcję ACHIEVEMENTS po sekcji TOURNAMENTS**

Znajdź `console.log(\`  3 turnieje (2 Julia, 1 Kacper)\\n\`);` (linia ~1073). PO niej, PRZED sekcją PAYMENTS, DODAJ:

```js
    // ============================================================
    // 12.5 ACHIEVEMENTS — palmares Sonii
    // ============================================================
    console.log('Tworzenie palmaresu Sonii...');

    await Achievement.insertMany([
      { player: sonia._id, club: club._id, category: 'mp', title: 'Mistrzostwa Polski U10 — singel', ageCategory: 'U10', discipline: 'singel', year: 2021, date: new Date('2021-08-15'), location: 'Bydgoszcz', result: 'gold', description: 'Pierwszy tytuł mistrzowski. Finał wygrany 6:2 6:1.', visibleToParent: true, createdBy: headCoach._id },
      { player: sonia._id, club: club._id, category: 'mp', title: 'Mistrzostwa Polski U10 — debel', ageCategory: 'U10', discipline: 'debel', year: 2022, date: new Date('2022-04-20'), location: 'Sopot', result: 'gold', description: 'Mistrzostwo w deblu z partnerką z KT Mera.', visibleToParent: true, createdBy: headCoach._id },
      { player: sonia._id, club: club._id, category: 'mp', title: 'Mistrzostwa Polski U12 — singel', ageCategory: 'U12', discipline: 'singel', year: 2022, date: new Date('2022-08-12'), location: 'Wrocław', result: 'gold', description: 'Drugi tytuł singlowy w wieku zaledwie 10 lat.', visibleToParent: true, createdBy: headCoach._id },
      { player: sonia._id, club: club._id, category: 'mp', title: 'Mistrzostwa Polski U12 — debel', ageCategory: 'U12', discipline: 'debel', year: 2023, date: new Date('2023-04-18'), location: 'Łódź', result: 'gold', visibleToParent: true, createdBy: headCoach._id },
      { player: sonia._id, club: club._id, category: 'mp', title: 'Halowe Mistrzostwa Polski U12', ageCategory: 'U12', discipline: 'singel', year: 2023, date: new Date('2023-12-09'), location: 'Poznań', result: 'gold', description: 'Bez straty seta w całym turnieju.', visibleToParent: true, createdBy: headCoach._id },
      { player: sonia._id, club: club._id, category: 'mp', title: 'Halowe Mistrzostwa Polski U14', ageCategory: 'U14', discipline: 'singel', year: 2024, date: new Date('2024-12-08'), location: 'Warszawa', result: 'gold', description: 'Najmłodsza mistrzyni U14 halowych w historii klubu.', visibleToParent: true, createdBy: headCoach._id },
      { player: sonia._id, club: club._id, category: 'mp', title: 'Mistrzostwa Polski U14 — singel', ageCategory: 'U14', discipline: 'singel', year: 2025, date: new Date('2025-08-17'), location: 'Kraków', result: 'gold', description: 'Siódmy tytuł mistrzowski. Finał 7:5 6:3.', visibleToParent: true, createdBy: headCoach._id },
      { player: sonia._id, club: club._id, category: 'international', title: 'Tennis Europe U14 — Bratislava', ageCategory: 'U14', discipline: 'singel', year: 2024, date: new Date('2024-10-12'), location: 'Bratysława', result: 'finalist', description: 'Pierwszy międzynarodowy finał. Porażka w 3 setach.', visibleToParent: true, createdBy: headCoach._id },
      { player: sonia._id, club: club._id, category: 'international', title: 'ITF J60 Pardubice', ageCategory: 'U18', discipline: 'singel', year: 2025, date: new Date('2025-10-19'), location: 'Pardubice', result: 'quarterfinal', description: 'Pierwszy turniej ITF Junior — ćwierćfinał na poziomie J60.', visibleToParent: true, createdBy: headCoach._id },
    ]);

    console.log(`  9 osiągnięć Sonii (7 MP + 2 międzynarodowe)\n`);
```

- [ ] **Step 2: Smoke test parsowania**

Run: `node --check server/src/scripts/seed.js`
Expected: brak outputu

- [ ] **Step 3: Commit**

```bash
git add server/src/scripts/seed.js
git commit -m "feat: seed Sonia palmares — 7 MP + 2 international achievements"
```

---

## Task 15: Seed — cele rozwojowe, obserwacje, turnieje, sesje, review, badge, wiadomości Sonii

**Files:**
- Modify: `server/src/scripts/seed.js`

- [ ] **Step 1: Dodaj cele Sonii (po `goalA1`)**

Znajdź `const goalA1 = await DevelopmentGoal.create({...})` (linia ~752-765). PO niej, PRZED `console.log(`  7 celow...`);`, DODAJ:

```js
    // Sonia — performance goals
    const goalS1 = await DevelopmentGoal.create({
      player: sonia._id,
      club: club._id,
      createdBy: headCoach._id,
      title: 'Plaski serwis 170 km/h',
      description: 'Sonia musi zwiększyć prędkość pierwszego serwisu do 170+ km/h przy 60% trafień.',
      category: 'serve',
      timeframe: 'quarterly',
      startDate: new Date('2026-01-01'),
      targetDate: new Date('2026-09-30'),
      status: 'active',
      progress: 60,
      visibleToParent: true,
    });

    const goalS2 = await DevelopmentGoal.create({
      player: sonia._id,
      club: club._id,
      createdBy: fitnessCoach._id,
      title: 'Wytrzymałość — mecze 3-setowe na pełnej intensywności',
      description: 'Cel: utrzymać poziom intensywności w 3. secie identyczny jak w 1. (HR avg, prędkość biegu).',
      category: 'fitness',
      timeframe: 'quarterly',
      startDate: new Date('2026-01-01'),
      targetDate: new Date('2026-06-30'),
      status: 'active',
      progress: 70,
      visibleToParent: true,
    });

    const goalS3 = await DevelopmentGoal.create({
      player: sonia._id,
      club: club._id,
      createdBy: headCoach._id,
      title: 'Wejście do ITF Junior tour 2027',
      description: 'Kwalifikacja do regularnych turniejów ITF Junior. Cel: top 200 ITF Junior do końca 2026.',
      category: 'pathway',
      timeframe: 'seasonal',
      startDate: new Date('2026-01-01'),
      targetDate: new Date('2026-12-31'),
      status: 'active',
      progress: 35,
      visibleToParent: true,
    });
```

I zaktualizuj log `console.log(`  7 celow...`);` na `console.log(`  10 celow rozwojowych (3 Kacper, 3 Julia, 1 Antoni, 3 Sonia)\n`);`.

- [ ] **Step 2: Dodaj obserwacje Sonii (po `obs7`)**

Znajdź `const obs7 = await Observation.create({...})` (linia ~878-893). PO niej, PRZED log `console.log(`  7 obserwacji ...`);`, DODAJ:

```js
    // Sonia observations — różne od każdego z 4 trenerów
    const obsS1 = await Observation.create({
      player: sonia._id, club: club._id, author: headCoach._id, type: 'progress',
      text: 'Plaski serwis Sonii notuje 158 km/h średnio (poprzedni miesiąc 152). Pracujemy nad ułożeniem barku — pierwszy ruch.',
      engagement: 5, effort: 5, mood: 4, focusAreas: ['serwis', 'technika'], goalRef: goalS1._id, visibleToParent: true,
      createdAt: daysAgo(2), updatedAt: daysAgo(2),
    });
    const obsS2 = await Observation.create({
      player: sonia._id, club: club._id, author: fitnessCoach._id, type: 'progress',
      text: 'Test Coopera: 3120m (poprzedni 3050m). VO2max stabilny 52 ml/kg/min. Core wyraźnie mocniejszy.',
      engagement: 4, effort: 5, mood: 4, focusAreas: ['kondycja', 'wytrzymalosc'], goalRef: goalS2._id, visibleToParent: true,
      createdAt: daysAgo(4), updatedAt: daysAgo(4),
    });
    const obsS3 = await Observation.create({
      player: sonia._id, club: club._id, author: mentalCoach._id, type: 'highlight',
      text: 'Sesja 30min — rutyny tie-break. Sonia bardzo świadoma swoich emocji, sama identyfikuje moment „spadku" w 2. secie. Doskonała refleksja.',
      engagement: 5, effort: 5, mood: 5, focusAreas: ['mentalnosc', 'rutyny'], visibleToParent: true,
      createdAt: daysAgo(1), updatedAt: daysAgo(1),
    });
    const obsS4 = await Observation.create({
      player: sonia._id, club: club._id, author: physioCoach._id, type: 'concern',
      text: 'Drobne napięcie m. czworogłowego prawego po sparingu. Obserwacja, masaż + rolowanie. Nie ograniczać obciążeń, ale monitorować przez tydzień.',
      engagement: 3, effort: 4, mood: 3, focusAreas: ['regeneracja', 'kontuzje'], visibleToParent: true, pinned: true,
      createdAt: daysAgo(3), updatedAt: daysAgo(3),
    });
    const obsS5 = await Observation.create({
      player: sonia._id, club: club._id, author: headCoach._id, type: 'highlight',
      text: 'Sparing z Julią Kowalską (Junior Advanced). Sonia wygrywa 6:2 6:3 — agresywne returny, świetny serwis+1. Widać dystans poziomu.',
      engagement: 5, effort: 5, mood: 5, focusAreas: ['gra', 'serwis-1', 'taktyka'], visibleToParent: true,
      createdAt: daysAgo(7), updatedAt: daysAgo(7),
    });
    const obsS6 = await Observation.create({
      player: sonia._id, club: club._id, author: headCoach._id, type: 'progress',
      text: 'Tygodniowe podsumowanie: 12 sesji, 14h pracy. Plan zrealizowany w 100%. Forma rośnie przed MP U16.',
      engagement: 5, effort: 5, mood: 4, focusAreas: ['plan', 'dyscyplina'], visibleToParent: true,
      createdAt: daysAgo(0), updatedAt: daysAgo(0),
    });
```

I zaktualizuj log `console.log(`  7 obserwacji...`);` na `console.log(`  13 obserwacji (2 Kacper, 4 Julia, 1 Antoni, 6 Sonia)\n`);`.

- [ ] **Step 3: Dodaj turnieje Sonii (po `Turniej Tennis 10 — Warszawa`)**

Znajdź `await Tournament.create({` z `name: 'Turniej Tennis 10 — Warszawa'` (linia ~1057-1071). PO nim, PRZED log `console.log(`  3 turnieje...`);`, DODAJ:

```js
    await Tournament.create({
      player: sonia._id, coach: headCoach._id, createdBy: headCoach._id, source: 'coach',
      name: 'Mistrzostwa Polski U16',
      location: 'Sopot, KT Arka',
      surface: 'clay',
      startDate: new Date('2026-06-12'),
      endDate: new Date('2026-06-15'),
      category: 'U16',
      drawSize: 32,
      status: 'planned',
      notes: 'Cel: półfinał. Sonia rozstawiona z 3.',
    });

    await Tournament.create({
      player: sonia._id, coach: headCoach._id, createdBy: headCoach._id, source: 'coach',
      name: 'ITF J60 Bytom',
      location: 'Bytom, KT Górnik',
      surface: 'hard',
      startDate: new Date('2026-07-08'),
      endDate: new Date('2026-07-13'),
      category: 'ITF Junior J60',
      drawSize: 64,
      status: 'planned',
      notes: 'Drugi start ITF. Cel: ćwierćfinał + punkty rankingowe.',
    });
```

I zaktualizuj log `console.log(`  3 turnieje...`);` na `console.log(`  5 turniejow (2 Julia, 1 Kacper, 2 Sonia)\n`);`.

- [ ] **Step 4: Dodaj sesje Sonii (po `sessionsData` for-loop)**

Znajdź `for (const sData of sessionsData) { await Session.create(...) }` (linie ~635-651). PO zamknięciu pętli, PRZED log `console.log(`  ${sessionsData.length} sesji...`);`, DODAJ:

```js
    // Sonia sessions
    const soniaSessionsData = [
      { title: 'Trening techniczny — serwis + return', sessionType: 'kort', surface: 'clay', startTime: '15:00', daysAgo: 1, durationMinutes: 90, notes: 'Plaski serwis 60% trafień. Return z bekhendu agresywny.', focusAreas: ['serwis', 'return'], coachId: 0 },
      { title: 'Sparing meczowy — symulacja MP', sessionType: 'sparing', surface: 'clay', startTime: '14:00', daysAgo: 7, durationMinutes: 120, notes: 'Sparing z Julią Kowalską. Sonia 6:2 6:3.', focusAreas: ['gra', 'taktyka'], coachId: 0 },
      { title: 'Trening kondycyjny — interwały + siła', sessionType: 'kondycja', startTime: '17:00', daysAgo: 4, durationMinutes: 60, notes: 'Test Coopera 3120m. Core wzmocniony.', focusAreas: ['wydolnosc', 'sila'], coachId: 1 },
      { title: 'Sesja mentalna — rutyny tie-break', sessionType: 'inne', startTime: '17:30', daysAgo: 1, durationMinutes: 30, notes: 'Praca nad rytuałem między punktami.', focusAreas: ['mentalnosc', 'rutyny'], coachId: 2 },
      { title: 'Fizjoterapia + regeneracja', sessionType: 'rozciaganie', startTime: '17:30', daysAgo: 3, durationMinutes: 60, notes: 'Masaż m. czworogłowego, rolowanie, mobilizacja stawów.', focusAreas: ['regeneracja', 'kontuzje'], coachId: 3 },
    ];

    const soniaCoaches = [headCoach, fitnessCoach, mentalCoach, physioCoach];
    for (const sd of soniaSessionsData) {
      await Session.create({
        player: sonia._id,
        coach: soniaCoaches[sd.coachId]._id,
        createdBy: soniaCoaches[sd.coachId]._id,
        source: 'coach',
        date: daysAgo(sd.daysAgo),
        sessionType: sd.sessionType,
        surface: sd.surface || '',
        startTime: sd.startTime || '',
        durationMinutes: sd.durationMinutes,
        title: sd.title,
        notes: sd.notes,
        focusAreas: sd.focusAreas,
        visibleToParent: true,
      });
    }
```

I zaktualizuj log `console.log(`  ${sessionsData.length} sesji...`);` na `console.log(`  ${sessionsData.length + soniaSessionsData.length} sesji treningowych\n`);`.

- [ ] **Step 5: Dodaj ReviewSummary kwartalny dla Sonii (po `reviewSum2`)**

Znajdź `const reviewSum2 = await ReviewSummary.create({...})` (linia ~924-942). PO niej, PRZED log `console.log(`  2 przeglady...`);`, DODAJ:

```js
    const reviewSumS = await ReviewSummary.create({
      player: sonia._id, club: club._id, author: headCoach._id,
      title: 'Przegląd kwartalny Q1/2026 — Sonia',
      periodType: 'quarterly',
      periodStart: new Date('2026-01-01'),
      periodEnd: new Date('2026-03-31'),
      whatHappened: 'Sonia zrealizowała 156h treningów (plan 168h, 93%). 4 sparingi turniejowe, sesje fizjo regularnie. Brak kontuzji.',
      whatWentWell: 'Plaski serwis: progres 152→158 km/h. Test Coopera +70m. Stabilność emocji w sparingach — widać efekt pracy z dr Sokołowskim.',
      whatNeedsFocus: 'Tie-breaki — wciąż obszar do pracy. Return z prawej strony wymaga większej agresji. Drobne napięcie m. czworogłowego — monitoring.',
      nextSteps: 'Przygotowanie do MP U16 (czerwiec). Intensyfikacja serwis+1, kontynuacja sesji mentalnych 2x/tydz, regularne wizyty u fizjoterapeuty.',
      activitiesCount: 156,
      goalsReviewed: [goalS1._id, goalS2._id, goalS3._id],
      observations: [obsS1._id, obsS2._id, obsS3._id, obsS4._id, obsS5._id, obsS6._id],
      status: 'published',
      publishedAt: daysAgo(5),
      visibleToParent: true,
    });
```

I zaktualizuj log na `console.log(`  3 przeglady (Kacper marzec, Julia marzec, Sonia Q1)\n`);`.

- [ ] **Step 6: Dodaj odznaki Sonii (po sekcji "Antoni: 1 odznaka")**

Znajdź `await PlayerBadge.insertMany([{ player: antoni._id, badgeSlug: 'first-session', earnedAt: new Date('2026-04-02') }]);` (linia ~1244-1246). PO niej, PRZED PODSUMOWANIE (linia ~1249), DODAJ:

```js
    // Sonia — najwięcej odznak (performance pathway)
    await PlayerBadge.insertMany([
      { player: sonia._id, badgeSlug: 'first-session', earnedAt: new Date('2018-09-15') },
      { player: sonia._id, badgeSlug: 'regular-player', earnedAt: new Date('2019-01-10') },
      { player: sonia._id, badgeSlug: 'session-25', earnedAt: new Date('2019-06-01') },
      { player: sonia._id, badgeSlug: 'training-machine', earnedAt: new Date('2020-09-15') },
      { player: sonia._id, badgeSlug: 'hours-10', earnedAt: new Date('2019-04-01') },
      { player: sonia._id, badgeSlug: 'hours-50', earnedAt: new Date('2020-01-01') },
      { player: sonia._id, badgeSlug: 'weekly-streak', earnedAt: new Date('2019-09-01') },
      { player: sonia._id, badgeSlug: 'streak-master', earnedAt: new Date('2020-06-01') },
      { player: sonia._id, badgeSlug: 'tournament-debut', earnedAt: new Date('2020-05-01') },
      { player: sonia._id, badgeSlug: 'winner', earnedAt: new Date('2021-08-15') },
      { player: sonia._id, badgeSlug: 'tournament-5', earnedAt: new Date('2022-04-01') },
      { player: sonia._id, badgeSlug: 'finalist', earnedAt: new Date('2024-10-12') },
      { player: sonia._id, badgeSlug: 'court-traveler', earnedAt: new Date('2021-09-01') },
      { player: sonia._id, badgeSlug: 'goal-achieved', earnedAt: new Date('2021-08-15') },
      { player: sonia._id, badgeSlug: 'three-goals', earnedAt: new Date('2022-12-01') },
      { player: sonia._id, badgeSlug: 'pathway-advance', earnedAt: new Date('2024-09-01') },
      { player: sonia._id, badgeSlug: 'coach-mvp', earnedAt: new Date('2025-08-17'), type: 'manual', awardedBy: headCoach._id, awardedNote: '7. tytuł mistrzowski — niesamowita konsekwencja!' },
      { player: sonia._id, badgeSlug: 'coach-sportsmanship', earnedAt: new Date('2024-12-08'), type: 'manual', awardedBy: headCoach._id, awardedNote: 'Wzór fair play w trudnym finale.' },
    ]);
    console.log('  Sonia: 18 odznak (w tym 2 ręczne)');
```

- [ ] **Step 7: Dodaj wiadomości parent3 ↔ headCoach**

Znajdź tablicę `messagesData = [...]` (linia ~1133). DODAJ na końcu tablicy (przed zamykającą `];`):

```js
      { from: headCoach._id, to: parent3._id, text: 'Pani Anno, Sonia świetnie pracowała w tym tygodniu. Plan przed MP U16 idzie zgodnie z założeniami.', daysAgo: 4 },
      { from: parent3._id, to: headCoach._id, text: 'Dziękuję! Jak Pan ocenia jej formę? Czy myśli Pan o dodatkowych startach przed MP?', daysAgo: 3 },
      { from: headCoach._id, to: parent3._id, text: 'Forma rosnąca. Sugeruję jeszcze ITF J60 Bytom (lipiec) i ewentualnie sparing wyjazdowy z KT Legia. Na MP U16 jesteśmy dobrze przygotowani.', daysAgo: 2 },
      { from: parent3._id, to: headCoach._id, text: 'Świetnie. A co z lekkim napięciem w nodze, o którym pisała Karolina?', daysAgo: 1 },
      { from: headCoach._id, to: parent3._id, text: 'Pod kontrolą. Karolina zaleciła monitoring + masaż 2x/tydz. Bez ograniczeń obciążeń.', daysAgo: 1 },
```

- [ ] **Step 8: Aktualizuj final podsumowanie**

Znajdź `console.log(`  Zawodnicy:        ${counts[1]} (Kacper, Julia, Antoni)`);` (koło linii 1273). ZMIEŃ na:

```js
    console.log(`  Zawodnicy:        ${counts[1]} (Kacper, Julia, Antoni, Sonia)`);
```

I znajdź `console.log('Demo Records:');` (koło linii 1295). DODAJ pod `console.log('  C) Antoni Wisniewski — Tennis 10 Red (nowy)\\n');`:

```js
    console.log('  D) Sonia Antczak — Performance (Sonia full / stress test)\n');
```

- [ ] **Step 9: Dodaj `Achievement.countDocuments()` do podsumowania**

Znajdź tablicę `const counts = await Promise.all([...])` (linia ~1252). DODAJ:

```js
      Achievement.countDocuments(),
```

I dodaj log w bloku podsumowania (po linii z `Programy rozwoju`):

```js
    console.log(`  Osiągnięcia:      ${counts[15]}`);
```

- [ ] **Step 10: Smoke test parsowania**

Run: `node --check server/src/scripts/seed.js`
Expected: brak outputu

- [ ] **Step 11: Commit**

```bash
git add server/src/scripts/seed.js
git commit -m "feat: seed Sonia full — goals/observations/tournaments/sessions/review/badges/messages"
```

---

## Task 16: Manualny smoke test — `npm run seed` + UI

**Files:** N/A (manualna weryfikacja)

- [ ] **Step 1: Uruchom seed**

Run: `npm run seed`
Expected output:
```
Zawodnicy:        4 (Kacper, Julia, Antoni, Sonia)
Osiągnięcia:      9
Sesje:            ...
... (bez błędów)
Seed zakonczony pomyslnie!
```

Jeśli FAIL — sprawdź log błędu, najprawdopodobniej brakujący import `Achievement` lub literówka.

- [ ] **Step 2: Uruchom server + client**

Run: `npm run dev`
Expected: oba serwisy startują, brak błędów w konsoli.

- [ ] **Step 3: Login parent3 (rodzic Sonii)**

W przeglądarce: `http://localhost:5173`. Login: `parent3@serveiq.pl` / `password123`.
Sprawdź:
- Dashboard pokazuje Sonię
- Klik "Profil" Sonii → pokazują się 4 NOWE sekcje: Palmares (9 trofeów), Zespół trenerów (4 karty), Ranking (3 mini-karty), Plan turniejowy (2 nadchodzące)
- Reszta sekcji (Skills, Goals, Reviews, Health, Training Plan) — bez zmian

- [ ] **Step 4: Login parent (Kacper/Antoni — REGRESJA)**

Login: `parent@serveiq.pl` / `password123`. Klik na profil Kacpra.
Expected: BRAK sekcji Palmares/Zespół/Ranking/Plan turniejowy. Wszystko jak wcześniej.

Klik na profil Antoniego: też bez nowych sekcji.

- [ ] **Step 5: Login headCoach**

Login: `coach.head@serveiq.pl` / `password123`.
Sprawdź:
- Dashboard pokazuje Sonię
- Klik na profil Sonii w panelu trenera → te same 4 nowe sekcje pojawiają się
- Klik na profil Julii (jeśli ma do niej dostęp) → bez nowych sekcji

- [ ] **Step 6: Login fitnessCoach**

Login: `coach.fitness@serveiq.pl` / `password123`.
Sprawdź:
- Może zalogować się
- Widzi Sonię (jest w `coaches[]`)
- Profil Sonii pokazuje sekcje performance

- [ ] **Step 7: Sprawdź endpoint API**

Run: `curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"email":"parent3@serveiq.pl","password":"password123"}'`
Expected: zwraca `accessToken`. Skopiuj go.

Run: `curl http://localhost:5000/api/achievements -H "Authorization: Bearer <TOKEN>"`
Expected: zwraca 9 osiągnięć Sonii.

- [ ] **Step 8: Vite build (final check)**

Run: `cd client && npm run build`
Expected: `✓ built in ...`, brak błędów.

- [ ] **Step 9: Commit summary (opcjonalnie)**

Jeśli wszystko pas — żaden commit nie jest potrzebny (już commitowaliśmy w taskach). Jeśli coś trzeba było poprawić, popraw + commit.

---

## Task 17: Aktualizacja `SPRINT_STATUS.md`

**Files:**
- Modify: `SPRINT_STATUS.md`

- [ ] **Step 1: Dodaj wpis o sprincie performance pathway**

Otwórz `SPRINT_STATUS.md`. DODAJ na górze nową sekcję (przed istniejącym "Sprint — 2026-03-30"):

```markdown
# Sprint — 2026-04-25

## Sprint Goal
Performance pathway (Sonia stress test) — model Achievement, teamRole, ChildProfile sekcje warunkowe, full seed Sonii

## Completed
- [x] Model `Achievement` + indexy
- [x] Pole `User.coachProfile.teamRole` (head/assistant/fitness/mental/physio/nutrition)
- [x] Controller + routes `/api/achievements` (CRUD + role-based access)
- [x] `playerController` populate teamRole
- [x] 4 komponenty player: PalmaresSection, CoachingTeamSection, RankingSummary, UpcomingTournaments
- [x] ChildProfile + CoachPlayerProfile — sekcje warunkowe (`developmentLevel === 'performance'`)
- [x] Seed: 4 trenerzy + parent3 + Sonia + 9 achievementów + 3 cele + 6 obserwacji + 2 turnieje + 5 sesji + 1 review + 18 badges + 5 wiadomości

## Demo accounts (NEW)
- coach.head@serveiq.pl — Marek Wojciechowski (head)
- coach.fitness@serveiq.pl — Agnieszka Lewandowska (fitness)
- coach.mental@serveiq.pl — dr Paweł Sokołowski (mental)
- coach.physio@serveiq.pl — Karolina Mazur (physio)
- parent3@serveiq.pl — Anna Antczak (rodzic Sonii)

## Quality gates
- [x] `node --check` na wszystkich nowych/zmienionych plikach JS
- [x] `vite build` — 0 errors
- [x] `npm run seed` — 4 zawodników, 9 achievementów, 0 błędów
- [x] Manual smoke test: parent3, parent, headCoach, fitnessCoach
- [x] Regresja: Kacper/Julia/Antoni — bez nowych sekcji
```

- [ ] **Step 2: Commit**

```bash
git add SPRINT_STATUS.md
git commit -m "docs: SPRINT_STATUS update — performance pathway sprint"
```

---

## Self-review

Plan komplet — sprawdziłem:

**1. Spec coverage:**
- Sekcja 1 specu (profil Sonii — domain) → Tasks 12, 13
- Sekcja 2 specu (modele) → Tasks 1, 2, 9 (rozszerzenie Player.ranking.itf)
- Sekcja 3 specu (zespół trenerów) → Task 12
- Sekcja 4 specu (UI sekcje warunkowe) → Tasks 6, 7, 8, 10, 11
- Sekcja 5 specu (seed) → Tasks 12, 13, 14, 15
- API → Tasks 3, 4, 5
- Plan migracji → wszystkie taski w kolejności + Task 16 (smoke) + Task 17 (status)

Każda decyzja ze specu ma swoje miejsce w planie. Brak luk.

**2. Placeholder scan:** Brak TBD/TODO/„fill in details". Każdy step ma konkretny kod lub konkretną komendę. Tylko Task 5 ma quasi-placeholder ("każde wystąpienie populate('coaches'") — ale to świadome, bo nie znamy a priori liczby wystąpień; engineer musi je znaleźć i każde wynik ma jasną instrukcję ("dopisz coachProfile.teamRole do select").

**3. Type consistency:**
- `Achievement` schema (Task 1) — pola używane w Task 3 (controller schema), Task 6 (komponent), Task 14 (seed) — **zgodne**.
- `teamRole` enum (Task 2) — używane w Task 7 (`ROLE_BADGE`), Task 12 (seed) — **zgodne**.
- `coaches[]` populate (Task 5) — używane w Task 7 (`coachProfile.teamRole`) — **zgodne**.

OK, plan gotowy.
