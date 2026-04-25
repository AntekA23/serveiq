# Performance Pro Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dla zawodników `developmentLevel === 'performance'` dorzucić 3 niezależne features: (A) Match log + opponent scouting, (B) Periodyzacja roczna z A/B/C events, (C) Career trajectory benchmark vs. wybrani idole. Wszystkie warunkowe — zero regresji dla Tennis 10/Junior.

**Architecture:** Dwa nowe modele Mongoose (`Match`, `SeasonPlan`) z kontrolerami CRUD + role-based access. Trzeci feature (career benchmark) bez backendu — statyczny JSON + komponent React. UI: 9 nowych komponentów React (5 dla Match, 2 dla Season, 1 dla Career, 1 wspólny widget H2H) + integracja w `ChildProfile` i `CoachPlayerProfile` (warunkowe sekcje + nowa zakładka "Mecze" w panelu trenera).

**Tech Stack:** Express 4 + Mongoose 8 + Zod (backend), React 18 + Vite + lucide-react (frontend). MongoDB. Bez frameworka testowego — manualna weryfikacja przez `node --check`, `npm run seed`, `vite build`, click-through.

**Spec:** `docs/superpowers/specs/2026-04-26-performance-pro-features-design.md`

**Konwencje (zgodne z codebase i poprzednim sprintem):**
- Controllers: `xxxController.js` (camelCase + `Controller`)
- Routes: `xxx.js` lub `xxx-yyy.js` (kebab-case dla wieloczłonowych)
- Walidacja: Zod inline w controllerach
- Auth: `verifyToken`, `requireRole('coach', 'clubAdmin')`
- Frontend CSS prefix: per-component (np. `mc-` dla MatchCard, `st-` dla SeasonTimeline, `ct-` dla CareerTrajectory)
- UI po polsku
- Commits: `feat:` / `fix:` / `refactor:` / `docs:`

---

## Task 1: Model `Match`

**Files:** Create `server/src/models/Match.js`

- [ ] **Step 1: Utwórz model**

```js
import mongoose from 'mongoose';

const setSchema = new mongoose.Schema(
  {
    playerScore: { type: Number, required: true, min: 0 },
    opponentScore: { type: Number, required: true, min: 0 },
    tiebreak: { type: Number, min: 0 },
  },
  { _id: false }
);

const matchSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: [true, 'Zawodnik jest wymagany'],
    },
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
    tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },
    date: { type: Date, required: [true, 'Data jest wymagana'] },
    surface: {
      type: String,
      enum: ['clay', 'hard', 'indoor-hard', 'grass'],
    },
    durationMinutes: Number,
    round: {
      type: String,
      enum: ['sparing', 'qualif', 'R64', 'R32', 'R16', 'QF', 'SF', 'F', 'final-3rd-place'],
      default: 'sparing',
    },
    opponent: {
      name: { type: String, required: [true, 'Imię rywalki jest wymagane'], trim: true },
      club: String,
      isInternal: { type: Boolean, default: false },
      playerRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
      ranking: {
        pzt: Number,
        te: Number,
        itf: Number,
        wta: Number,
        atp: Number,
      },
    },
    scoutingNotes: { type: String, trim: true },
    result: {
      won: { type: Boolean, required: true },
      sets: { type: [setSchema], default: [] },
      retired: { type: Boolean, default: false },
      walkover: { type: Boolean, default: false },
    },
    stats: {
      firstServePct: Number,
      secondServePct: Number,
      aces: Number,
      doubleFaults: Number,
      winners: Number,
      unforcedErrors: Number,
      breakPointsConverted: Number,
      breakPointsFaced: Number,
      breakPointsSaved: Number,
    },
    keyMoments: { type: [String], default: [] },
    coachDebrief: { type: String, trim: true },
    mentalState: { type: Number, min: 1, max: 5 },
    visibleToParent: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

matchSchema.index({ player: 1, date: -1 });
matchSchema.index({ player: 1, tournament: 1 });
matchSchema.index({ 'opponent.name': 1 });

const Match = mongoose.model('Match', matchSchema);
export default Match;
```

- [ ] **Step 2: Verify**

Run: `node --check server/src/models/Match.js` — Expected: no output

- [ ] **Step 3: Commit**

```bash
git add server/src/models/Match.js
git commit -m "feat: Match model — match log with scouting/stats/debrief"
```

---

## Task 2: Controller `matchController`

**Files:** Create `server/src/controllers/matchController.js`

- [ ] **Step 1: Utwórz controller**

```js
import { z } from 'zod';
import Match from '../models/Match.js';
import Player from '../models/Player.js';

const setSchema = z.object({
  playerScore: z.number().int().min(0),
  opponentScore: z.number().int().min(0),
  tiebreak: z.number().int().min(0).optional(),
});

const opponentSchema = z.object({
  name: z.string().min(1, 'Imię rywalki jest wymagane'),
  club: z.string().optional(),
  isInternal: z.boolean().optional(),
  playerRef: z.string().optional(),
  ranking: z
    .object({
      pzt: z.number().optional(),
      te: z.number().optional(),
      itf: z.number().optional(),
      wta: z.number().optional(),
      atp: z.number().optional(),
    })
    .optional(),
});

const statsSchema = z
  .object({
    firstServePct: z.number().min(0).max(100).optional(),
    secondServePct: z.number().min(0).max(100).optional(),
    aces: z.number().int().min(0).optional(),
    doubleFaults: z.number().int().min(0).optional(),
    winners: z.number().int().min(0).optional(),
    unforcedErrors: z.number().int().min(0).optional(),
    breakPointsConverted: z.number().int().min(0).optional(),
    breakPointsFaced: z.number().int().min(0).optional(),
    breakPointsSaved: z.number().int().min(0).optional(),
  })
  .optional();

const createSchema = z.object({
  player: z.string().min(1),
  club: z.string().optional(),
  tournament: z.string().optional(),
  date: z.string().min(1),
  surface: z.enum(['clay', 'hard', 'indoor-hard', 'grass']).optional(),
  durationMinutes: z.number().int().min(0).optional(),
  round: z.enum(['sparing', 'qualif', 'R64', 'R32', 'R16', 'QF', 'SF', 'F', 'final-3rd-place']).optional(),
  opponent: opponentSchema,
  scoutingNotes: z.string().optional(),
  result: z.object({
    won: z.boolean(),
    sets: z.array(setSchema).optional(),
    retired: z.boolean().optional(),
    walkover: z.boolean().optional(),
  }),
  stats: statsSchema,
  keyMoments: z.array(z.string()).optional(),
  coachDebrief: z.string().optional(),
  mentalState: z.number().int().min(1).max(5).optional(),
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

export const getMatches = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.player) {
      const allowed = await canAccessPlayer(req.user, req.query.player);
      if (!allowed) return res.status(403).json({ message: 'Brak uprawnień' });
      filter.player = req.query.player;
    } else if (req.user.role === 'parent') {
      const childrenIds = req.user.parentProfile?.children || [];
      if (childrenIds.length === 0) return res.json({ matches: [] });
      filter.player = { $in: childrenIds };
      filter.visibleToParent = true;
    } else if (req.user.role === 'coach') {
      const players = await Player.find({
        $or: [{ coach: req.user._id }, { coaches: req.user._id }],
      }).select('_id');
      filter.player = { $in: players.map((p) => p._id) };
    }
    if (req.query.tournament) filter.tournament = req.query.tournament;

    const matches = await Match.find(filter)
      .populate('tournament', 'name location startDate category')
      .populate('opponent.playerRef', 'firstName lastName')
      .sort({ date: -1 });
    res.json({ matches });
  } catch (err) {
    next(err);
  }
};

export const getH2H = async (req, res, next) => {
  try {
    const { player, opponent } = req.query;
    if (!player || !opponent) {
      return res.status(400).json({ message: 'Wymagane: player, opponent' });
    }
    const allowed = await canAccessPlayer(req.user, player);
    if (!allowed) return res.status(403).json({ message: 'Brak uprawnień' });

    const matches = await Match.find({
      player,
      'opponent.name': opponent,
    }).sort({ date: -1 });

    const wins = matches.filter((m) => m.result.won).length;
    const losses = matches.length - wins;
    res.json({ matches, wins, losses });
  } catch (err) {
    next(err);
  }
};

export const getMatch = async (req, res, next) => {
  try {
    const m = await Match.findById(req.params.id)
      .populate('tournament', 'name location startDate category')
      .populate('opponent.playerRef', 'firstName lastName');
    if (!m) return res.status(404).json({ message: 'Nie znaleziono' });
    const allowed = await canAccessPlayer(req.user, m.player);
    if (!allowed) return res.status(403).json({ message: 'Brak uprawnień' });
    res.json({ match: m });
  } catch (err) {
    next(err);
  }
};

export const createMatch = async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const allowed = await canAccessPlayer(req.user, data.player);
    if (!allowed) return res.status(403).json({ message: 'Brak uprawnień' });
    const m = await Match.create({ ...data, createdBy: req.user._id });
    res.status(201).json({ match: m });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.issues[0]?.message || 'Walidacja' });
    }
    next(err);
  }
};

export const updateMatch = async (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    const m = await Match.findById(req.params.id);
    if (!m) return res.status(404).json({ message: 'Nie znaleziono' });
    const allowed = await canAccessPlayer(req.user, m.player);
    if (!allowed) return res.status(403).json({ message: 'Brak uprawnień' });
    Object.assign(m, data);
    await m.save();
    res.json({ match: m });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.issues[0]?.message || 'Walidacja' });
    }
    next(err);
  }
};

export const deleteMatch = async (req, res, next) => {
  try {
    const m = await Match.findById(req.params.id);
    if (!m) return res.status(404).json({ message: 'Nie znaleziono' });
    const allowed = await canAccessPlayer(req.user, m.player);
    if (!allowed) return res.status(403).json({ message: 'Brak uprawnień' });
    await m.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
```

- [ ] **Step 2: Verify**

Run: `node --check server/src/controllers/matchController.js`

- [ ] **Step 3: Commit**

```bash
git add server/src/controllers/matchController.js
git commit -m "feat: matchController — CRUD with H2H endpoint and role-based access"
```

---

## Task 3: Routes `/api/matches`

**Files:** Create `server/src/routes/matches.js`, modify `server/src/index.js`

- [ ] **Step 1: Utwórz routes file**

```js
import { Router } from 'express';
import {
  getMatches,
  getH2H,
  getMatch,
  createMatch,
  updateMatch,
  deleteMatch,
} from '../controllers/matchController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(verifyToken);

// Specific endpoint przed /:id
router.get('/h2h', getH2H);

router.get('/', getMatches);
router.get('/:id', getMatch);
router.post('/', requireRole('coach', 'clubAdmin'), createMatch);
router.put('/:id', requireRole('coach', 'clubAdmin'), updateMatch);
router.delete('/:id', requireRole('coach', 'clubAdmin'), deleteMatch);

export default router;
```

- [ ] **Step 2: Zarejestruj w `server/src/index.js`**

Edit imports — find:
```js
import achievementRoutes from './routes/achievements.js';
```
Replace with:
```js
import achievementRoutes from './routes/achievements.js';
import matchRoutes from './routes/matches.js';
```

Edit registrations — find:
```js
app.use('/api/achievements', achievementRoutes);
```
Replace with:
```js
app.use('/api/achievements', achievementRoutes);
app.use('/api/matches', matchRoutes);
```

- [ ] **Step 3: Verify**

Run: `node --check server/src/routes/matches.js && node --check server/src/index.js`

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/matches.js server/src/index.js
git commit -m "feat: /api/matches routes wired"
```

---

## Task 4: Model `SeasonPlan`

**Files:** Create `server/src/models/SeasonPlan.js`

- [ ] **Step 1: Utwórz model**

```js
import mongoose from 'mongoose';

const phaseSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['build', 'peak', 'taper', 'recovery', 'offseason'],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    intensity: { type: Number, min: 1, max: 5, default: 3 },
    targetEvent: String,
    notes: String,
  },
  { _id: true }
);

const targetEventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    date: { type: Date, required: true },
    priority: { type: String, enum: ['A', 'B', 'C'], required: true },
    tournamentRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },
  },
  { _id: true }
);

const seasonPlanSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
    },
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
    season: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    weeklyHoursTarget: { type: Number, min: 0 },
    phases: { type: [phaseSchema], default: [] },
    targetEvents: { type: [targetEventSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

seasonPlanSchema.index({ player: 1, season: 1, status: 1 });
seasonPlanSchema.index({ player: 1, status: 1 });

const SeasonPlan = mongoose.model('SeasonPlan', seasonPlanSchema);
export default SeasonPlan;
```

- [ ] **Step 2: Verify**

Run: `node --check server/src/models/SeasonPlan.js`

- [ ] **Step 3: Commit**

```bash
git add server/src/models/SeasonPlan.js
git commit -m "feat: SeasonPlan model — yearly periodization (phases + A/B/C events)"
```

---

## Task 5: Controller `seasonPlanController`

**Files:** Create `server/src/controllers/seasonPlanController.js`

- [ ] **Step 1: Utwórz controller**

```js
import { z } from 'zod';
import SeasonPlan from '../models/SeasonPlan.js';
import Player from '../models/Player.js';

const phaseSchema = z.object({
  type: z.enum(['build', 'peak', 'taper', 'recovery', 'offseason']),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  intensity: z.number().int().min(1).max(5).optional(),
  targetEvent: z.string().optional(),
  notes: z.string().optional(),
});

const targetEventSchema = z.object({
  name: z.string().min(1),
  date: z.string().min(1),
  priority: z.enum(['A', 'B', 'C']),
  tournamentRef: z.string().optional(),
});

const createSchema = z.object({
  player: z.string().min(1),
  club: z.string().optional(),
  season: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  weeklyHoursTarget: z.number().min(0).optional(),
  phases: z.array(phaseSchema).optional(),
  targetEvents: z.array(targetEventSchema).optional(),
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

export const getSeasonPlans = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.player) {
      const allowed = await canAccessPlayer(req.user, req.query.player);
      if (!allowed) return res.status(403).json({ message: 'Brak uprawnień' });
      filter.player = req.query.player;
    } else if (req.user.role === 'parent') {
      const childrenIds = req.user.parentProfile?.children || [];
      if (childrenIds.length === 0) return res.json({ seasonPlans: [] });
      filter.player = { $in: childrenIds };
    } else if (req.user.role === 'coach') {
      const players = await Player.find({
        $or: [{ coach: req.user._id }, { coaches: req.user._id }],
      }).select('_id');
      filter.player = { $in: players.map((p) => p._id) };
    }
    if (req.query.season) filter.season = req.query.season;
    if (req.query.status) filter.status = req.query.status;

    const seasonPlans = await SeasonPlan.find(filter).sort({ startDate: -1 });
    res.json({ seasonPlans });
  } catch (err) {
    next(err);
  }
};

export const getSeasonPlan = async (req, res, next) => {
  try {
    const p = await SeasonPlan.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Nie znaleziono' });
    const allowed = await canAccessPlayer(req.user, p.player);
    if (!allowed) return res.status(403).json({ message: 'Brak uprawnień' });
    res.json({ seasonPlan: p });
  } catch (err) {
    next(err);
  }
};

export const createSeasonPlan = async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const allowed = await canAccessPlayer(req.user, data.player);
    if (!allowed) return res.status(403).json({ message: 'Brak uprawnień' });

    // Archiwizuj istniejący active dla tego sezonu
    await SeasonPlan.updateMany(
      { player: data.player, season: data.season, status: 'active' },
      { $set: { status: 'archived' } }
    );

    const p = await SeasonPlan.create({ ...data, status: 'active', createdBy: req.user._id });
    res.status(201).json({ seasonPlan: p });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.issues[0]?.message || 'Walidacja' });
    }
    next(err);
  }
};

export const updateSeasonPlan = async (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    const p = await SeasonPlan.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Nie znaleziono' });
    const allowed = await canAccessPlayer(req.user, p.player);
    if (!allowed) return res.status(403).json({ message: 'Brak uprawnień' });
    Object.assign(p, data);
    await p.save();
    res.json({ seasonPlan: p });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.issues[0]?.message || 'Walidacja' });
    }
    next(err);
  }
};

export const deleteSeasonPlan = async (req, res, next) => {
  try {
    const p = await SeasonPlan.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Nie znaleziono' });
    const allowed = await canAccessPlayer(req.user, p.player);
    if (!allowed) return res.status(403).json({ message: 'Brak uprawnień' });
    await p.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
```

- [ ] **Step 2: Verify + Commit**

```bash
node --check server/src/controllers/seasonPlanController.js
git add server/src/controllers/seasonPlanController.js
git commit -m "feat: seasonPlanController — CRUD with auto-archive of previous active"
```

---

## Task 6: Routes `/api/season-plans`

**Files:** Create `server/src/routes/seasonPlans.js`, modify `server/src/index.js`

- [ ] **Step 1: Utwórz routes**

```js
import { Router } from 'express';
import {
  getSeasonPlans,
  getSeasonPlan,
  createSeasonPlan,
  updateSeasonPlan,
  deleteSeasonPlan,
} from '../controllers/seasonPlanController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(verifyToken);

router.get('/', getSeasonPlans);
router.get('/:id', getSeasonPlan);
router.post('/', requireRole('coach', 'clubAdmin'), createSeasonPlan);
router.put('/:id', requireRole('coach', 'clubAdmin'), updateSeasonPlan);
router.delete('/:id', requireRole('coach', 'clubAdmin'), deleteSeasonPlan);

export default router;
```

- [ ] **Step 2: Zarejestruj**

Edit imports w `server/src/index.js`. Find:
```js
import matchRoutes from './routes/matches.js';
```
Replace:
```js
import matchRoutes from './routes/matches.js';
import seasonPlanRoutes from './routes/seasonPlans.js';
```

Edit registrations. Find:
```js
app.use('/api/matches', matchRoutes);
```
Replace:
```js
app.use('/api/matches', matchRoutes);
app.use('/api/season-plans', seasonPlanRoutes);
```

- [ ] **Step 3: Verify + Commit**

```bash
node --check server/src/routes/seasonPlans.js && node --check server/src/index.js
git add server/src/routes/seasonPlans.js server/src/index.js
git commit -m "feat: /api/season-plans routes wired"
```

---

## Task 7: Komponent `MatchCard`

**Files:** Create `client/src/components/match/MatchCard.jsx` + `.css`

- [ ] **Step 1: MatchCard.jsx**

```jsx
import { Trophy, X, MapPin } from 'lucide-react'
import './MatchCard.css'

const ROUND_LABEL = {
  sparing: 'Sparing',
  qualif: 'Kwalifikacje',
  R64: '1/32',
  R32: '1/16',
  R16: '1/8',
  QF: 'Ćwierćfinał',
  SF: 'Półfinał',
  F: 'Finał',
  'final-3rd-place': 'Mecz o 3. miejsce',
}

function formatSets(sets = []) {
  return sets.map((s) => {
    const main = `${s.playerScore}:${s.opponentScore}`
    return s.tiebreak != null ? `${main}(${s.tiebreak})` : main
  }).join(' ')
}

export default function MatchCard({ match, onClick }) {
  const won = match.result?.won
  const opp = match.opponent || {}
  return (
    <article className={`mc-card ${won ? 'mc-won' : 'mc-lost'}`} onClick={onClick}>
      <div className="mc-result-badge">
        {won ? <Trophy size={14} /> : <X size={14} />}
        {won ? 'W' : 'L'}
      </div>
      <div className="mc-body">
        <div className="mc-top">
          <span className="mc-round">{ROUND_LABEL[match.round] || match.round}</span>
          <span className="mc-date">{new Date(match.date).toLocaleDateString('pl-PL')}</span>
        </div>
        <div className="mc-opponent">
          vs. <strong>{opp.name}</strong>
          {opp.club && <span className="mc-opp-club"> · {opp.club}</span>}
        </div>
        <div className="mc-score">{formatSets(match.result?.sets)}</div>
        {match.tournament?.location && (
          <div className="mc-loc">
            <MapPin size={11} /> {match.tournament.location}
          </div>
        )}
      </div>
    </article>
  )
}
```

- [ ] **Step 2: MatchCard.css**

```css
.mc-card {
  display: flex;
  gap: 12px;
  padding: 12px 14px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  border-left: 4px solid #cbd5e1;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
}
.mc-card:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
.mc-won { border-left-color: #16a34a; }
.mc-lost { border-left-color: #dc2626; }

.mc-result-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  align-self: flex-start;
  white-space: nowrap;
}
.mc-won .mc-result-badge { background: #dcfce7; color: #16a34a; }
.mc-lost .mc-result-badge { background: #fee2e2; color: #dc2626; }

.mc-body { flex: 1; min-width: 0; }
.mc-top { display: flex; justify-content: space-between; font-size: 12px; color: #6b7280; }
.mc-round { font-weight: 600; }
.mc-opponent { font-size: 14px; color: #111827; margin: 4px 0; }
.mc-opp-club { color: #6b7280; font-size: 12px; }
.mc-score { font-family: 'SF Mono', 'Monaco', monospace; font-weight: 700; color: #111827; font-size: 16px; }
.mc-loc { font-size: 11px; color: #6b7280; display: flex; align-items: center; gap: 3px; margin-top: 4px; }
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/match/MatchCard.jsx client/src/components/match/MatchCard.css
git commit -m "feat: MatchCard — single match preview with W/L badge and set scores"
```

---

## Task 8: Komponent `MatchDetail`

**Files:** Create `client/src/components/match/MatchDetail.jsx` + `.css`

- [ ] **Step 1: MatchDetail.jsx**

```jsx
import { X, Trophy, MapPin, Calendar, Brain, FileText } from 'lucide-react'
import './MatchDetail.css'

const ROUND_LABEL = {
  sparing: 'Sparing', qualif: 'Kwalifikacje', R64: '1/32', R32: '1/16',
  R16: '1/8', QF: 'Ćwierćfinał', SF: 'Półfinał', F: 'Finał',
  'final-3rd-place': 'Mecz o 3. miejsce',
}

const SURFACE_LABEL = {
  clay: 'Mączka', hard: 'Twarda', 'indoor-hard': 'Hala (twarda)', grass: 'Trawa',
}

function formatSets(sets = []) {
  return sets.map((s) => {
    const main = `${s.playerScore}:${s.opponentScore}`
    return s.tiebreak != null ? `${main}(${s.tiebreak})` : main
  }).join(', ')
}

export default function MatchDetail({ match, onClose }) {
  if (!match) return null
  const won = match.result?.won
  const opp = match.opponent || {}
  const stats = match.stats || {}
  return (
    <div className="md-overlay" onClick={onClose}>
      <div className="md-modal" onClick={(e) => e.stopPropagation()}>
        <button className="md-close" onClick={onClose}><X size={18} /></button>

        <header className={`md-header ${won ? 'md-won' : 'md-lost'}`}>
          <Trophy size={28} />
          <div>
            <div className="md-result">{won ? 'Wygrana' : 'Porażka'}</div>
            <div className="md-vs">vs. {opp.name}</div>
          </div>
          <div className="md-score">{formatSets(match.result?.sets)}</div>
        </header>

        <div className="md-meta">
          <div><Calendar size={14} /> {new Date(match.date).toLocaleDateString('pl-PL')}</div>
          {match.round && <div>{ROUND_LABEL[match.round]}</div>}
          {match.surface && <div>{SURFACE_LABEL[match.surface]}</div>}
          {match.durationMinutes && <div>{match.durationMinutes} min</div>}
          {match.tournament && <div><MapPin size={14} /> {match.tournament.name}</div>}
        </div>

        {match.scoutingNotes && (
          <section className="md-section">
            <h3><Brain size={14} /> Scouting (przed meczem)</h3>
            <p>{match.scoutingNotes}</p>
          </section>
        )}

        {Object.keys(stats).length > 0 && (
          <section className="md-section">
            <h3>Statystyki</h3>
            <div className="md-stats-grid">
              {stats.firstServePct != null && <div className="md-stat"><span>1. serwis</span><strong>{stats.firstServePct}%</strong></div>}
              {stats.aces != null && <div className="md-stat"><span>Asy</span><strong>{stats.aces}</strong></div>}
              {stats.doubleFaults != null && <div className="md-stat"><span>Double faults</span><strong>{stats.doubleFaults}</strong></div>}
              {stats.winners != null && <div className="md-stat"><span>Winnery</span><strong>{stats.winners}</strong></div>}
              {stats.unforcedErrors != null && <div className="md-stat"><span>Błędy własne</span><strong>{stats.unforcedErrors}</strong></div>}
              {stats.breakPointsConverted != null && stats.breakPointsFaced != null && (
                <div className="md-stat"><span>BP wykorzystane</span><strong>{stats.breakPointsConverted}/{stats.breakPointsFaced}</strong></div>
              )}
            </div>
          </section>
        )}

        {match.keyMoments?.length > 0 && (
          <section className="md-section">
            <h3>Kluczowe momenty</h3>
            <ul className="md-moments">
              {match.keyMoments.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          </section>
        )}

        {match.coachDebrief && (
          <section className="md-section">
            <h3><FileText size={14} /> Debrief trenera</h3>
            <p>{match.coachDebrief}</p>
          </section>
        )}

        {match.mentalState != null && (
          <section className="md-section md-mental">
            <h3>Stan mentalny</h3>
            <div className="md-mental-bar">
              {[1,2,3,4,5].map((n) => (
                <div key={n} className={`md-mental-dot ${n <= match.mentalState ? 'active' : ''}`} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: MatchDetail.css**

```css
.md-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 50; padding: 20px;
}
.md-modal {
  background: white; border-radius: 16px;
  max-width: 600px; width: 100%; max-height: 90vh;
  overflow-y: auto; padding: 24px; position: relative;
}
.md-close {
  position: absolute; top: 12px; right: 12px;
  background: #f3f4f6; border: none; border-radius: 8px;
  padding: 6px; cursor: pointer; color: #4b5563;
}

.md-header {
  display: flex; align-items: center; gap: 14px;
  padding: 16px; border-radius: 12px; margin-bottom: 16px;
}
.md-won { background: linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%); color: #166534; }
.md-lost { background: linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%); color: #991b1b; }
.md-result { font-size: 20px; font-weight: 800; }
.md-vs { font-size: 13px; opacity: 0.85; }
.md-score { margin-left: auto; font-family: monospace; font-size: 18px; font-weight: 800; }

.md-meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px; color: #6b7280; margin-bottom: 16px; }
.md-meta div { display: flex; align-items: center; gap: 4px; }

.md-section { margin: 16px 0; padding: 14px; background: #fafafa; border-radius: 10px; }
.md-section h3 { font-size: 13px; margin: 0 0 8px; display: flex; align-items: center; gap: 4px; color: #374151; text-transform: uppercase; letter-spacing: 0.3px; }
.md-section p { margin: 0; color: #111827; line-height: 1.5; font-size: 14px; }

.md-stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px; }
.md-stat { background: white; padding: 8px 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
.md-stat span { color: #6b7280; }
.md-stat strong { color: #111827; }

.md-moments { margin: 0; padding-left: 18px; }
.md-moments li { margin: 4px 0; font-size: 13px; color: #111827; }

.md-mental-bar { display: flex; gap: 6px; }
.md-mental-dot { width: 24px; height: 8px; border-radius: 4px; background: #e5e7eb; }
.md-mental-dot.active { background: #6366f1; }
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/match/MatchDetail.jsx client/src/components/match/MatchDetail.css
git commit -m "feat: MatchDetail — full modal with scouting/stats/moments/debrief"
```

---

## Task 9: Komponent `RecentMatchesSection`

**Files:** Create `client/src/components/match/RecentMatchesSection.jsx` + `.css`

- [ ] **Step 1: RecentMatchesSection.jsx**

```jsx
import { useEffect, useState } from 'react'
import { Swords } from 'lucide-react'
import api from '../../api/axios'
import MatchCard from './MatchCard'
import MatchDetail from './MatchDetail'
import './RecentMatchesSection.css'

export default function RecentMatchesSection({ playerId }) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    let alive = true
    api.get(`/matches?player=${playerId}`)
      .then((res) => { if (alive) setMatches((res.data.matches || []).slice(0, 3)) })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [playerId])

  if (loading) return null
  if (!matches.length) return null

  return (
    <section className="rms-section">
      <header className="rms-header">
        <Swords size={20} />
        <h2>Ostatnie mecze</h2>
        <span className="rms-count">{matches.length}</span>
      </header>
      <div className="rms-list">
        {matches.map((m) => (
          <MatchCard key={m._id} match={m} onClick={() => setSelected(m)} />
        ))}
      </div>
      {selected && <MatchDetail match={selected} onClose={() => setSelected(null)} />}
    </section>
  )
}
```

- [ ] **Step 2: RecentMatchesSection.css**

```css
.rms-section {
  margin: 24px 0; padding: 20px;
  background: white; border-radius: 16px;
  border: 1px solid #e5e7eb;
}
.rms-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
.rms-header h2 { font-size: 18px; margin: 0; flex: 1; }
.rms-count {
  background: #6366f1; color: white;
  padding: 2px 10px; border-radius: 999px;
  font-size: 13px; font-weight: 600;
}
.rms-list { display: flex; flex-direction: column; gap: 8px; }
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/match/RecentMatchesSection.jsx client/src/components/match/RecentMatchesSection.css
git commit -m "feat: RecentMatchesSection — last 3 matches widget for ChildProfile"
```

---

## Task 10: Komponent `SeasonTimeline`

**Files:** Create `client/src/components/season/SeasonTimeline.jsx` + `.css`

- [ ] **Step 1: SeasonTimeline.jsx**

```jsx
import { useEffect, useState } from 'react'
import { Calendar, Target } from 'lucide-react'
import api from '../../api/axios'
import './SeasonTimeline.css'

const PHASE_COLOR = {
  build: '#3b82f6',
  peak: '#dc2626',
  taper: '#f59e0b',
  recovery: '#10b981',
  offseason: '#6b7280',
}

const PHASE_LABEL = {
  build: 'Build', peak: 'Peak', taper: 'Taper',
  recovery: 'Recovery', offseason: 'Offseason',
}

const MONTHS = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru']

function getPhaseAtMonth(plan, monthIdx, year) {
  // monthIdx = 0..11 (jan..dec); year = liczba roku
  const mid = new Date(year, monthIdx, 15)
  return plan.phases.find((p) => new Date(p.startDate) <= mid && new Date(p.endDate) >= mid)
}

function getEventsInMonth(plan, monthIdx, year) {
  return plan.targetEvents.filter((e) => {
    const d = new Date(e.date)
    return d.getFullYear() === year && d.getMonth() === monthIdx
  })
}

const PRIO_DOT_SIZE = { A: 14, B: 10, C: 7 }

export default function SeasonTimeline({ playerId }) {
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    api.get(`/season-plans?player=${playerId}&status=active`)
      .then((res) => {
        if (!alive) return
        const plans = res.data.seasonPlans || []
        setPlan(plans[0] || null)
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [playerId])

  if (loading) return null
  if (!plan) return null

  const year = new Date(plan.startDate).getFullYear()
  const totalEvents = plan.targetEvents?.length || 0

  return (
    <section className="st-section">
      <header className="st-header">
        <Calendar size={20} />
        <h2>Sezon {plan.season}</h2>
        {plan.weeklyHoursTarget && <span className="st-hours">{plan.weeklyHoursTarget}h/tyg</span>}
        <span className="st-events"><Target size={12} /> {totalEvents}</span>
      </header>

      <div className="st-timeline">
        {MONTHS.map((label, idx) => {
          const phase = getPhaseAtMonth(plan, idx, year)
          const events = getEventsInMonth(plan, idx, year)
          const bg = phase ? PHASE_COLOR[phase.type] : '#f3f4f6'
          const phaseLabel = phase ? PHASE_LABEL[phase.type] : ''
          return (
            <div key={idx} className="st-month" title={phaseLabel}>
              <div className="st-month-label">{label}</div>
              <div className="st-month-bar" style={{ background: bg, opacity: phase ? 0.85 : 0.3 }} />
              <div className="st-events-row">
                {events.map((e) => (
                  <div
                    key={e._id || e.name}
                    className={`st-event-dot st-prio-${e.priority}`}
                    style={{ width: PRIO_DOT_SIZE[e.priority], height: PRIO_DOT_SIZE[e.priority] }}
                    title={`${e.name} — ${new Date(e.date).toLocaleDateString('pl-PL')} (${e.priority})`}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="st-legend">
        {Object.keys(PHASE_LABEL).map((k) => (
          <div key={k} className="st-legend-item">
            <span className="st-legend-dot" style={{ background: PHASE_COLOR[k] }} />
            {PHASE_LABEL[k]}
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: SeasonTimeline.css**

```css
.st-section {
  margin: 24px 0; padding: 20px;
  background: white; border-radius: 16px;
  border: 1px solid #e5e7eb;
}
.st-header { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
.st-header h2 { font-size: 18px; margin: 0; flex: 1; }
.st-hours { font-size: 13px; color: #6b7280; font-weight: 600; }
.st-events {
  display: flex; align-items: center; gap: 4px;
  background: #eef2ff; color: #4338ca;
  padding: 2px 10px; border-radius: 999px;
  font-size: 12px; font-weight: 600;
}

.st-timeline { display: grid; grid-template-columns: repeat(12, 1fr); gap: 4px; margin-bottom: 12px; }
.st-month { text-align: center; }
.st-month-label { font-size: 10px; color: #6b7280; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
.st-month-bar { height: 28px; border-radius: 6px; }
.st-events-row { display: flex; justify-content: center; gap: 3px; height: 18px; align-items: center; margin-top: 4px; }
.st-event-dot { border-radius: 50%; }
.st-prio-A { background: #dc2626; }
.st-prio-B { background: #f59e0b; }
.st-prio-C { background: #6b7280; }

.st-legend { display: flex; gap: 14px; flex-wrap: wrap; padding-top: 12px; border-top: 1px solid #f3f4f6; }
.st-legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #6b7280; }
.st-legend-dot { width: 10px; height: 10px; border-radius: 3px; }
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/season/SeasonTimeline.jsx client/src/components/season/SeasonTimeline.css
git commit -m "feat: SeasonTimeline — 12-month periodization band with A/B/C events"
```

---

## Task 11: Career benchmarks data + komponent

**Files:**
- Create: `client/src/data/careerBenchmarks.json`
- Create: `client/src/components/career/CareerTrajectory.jsx` + `.css`

- [ ] **Step 1: careerBenchmarks.json**

```json
{
  "iga-swiatek": {
    "displayName": "Iga Świątek",
    "country": "🇵🇱",
    "born": "2001-05-31",
    "milestones": [
      { "age": 12, "label": "Pierwsze MP U12 — singel", "year": 2013, "type": "national" },
      { "age": 14, "label": "Pierwszy ITF Junior", "year": 2015, "type": "international" },
      { "age": 16, "label": "Półfinał Wimbledonu juniorek", "year": 2017, "type": "junior-major" },
      { "age": 17, "label": "Wimbledon Juniorki — tytuł", "year": 2018, "type": "junior-major" },
      { "age": 19, "label": "Roland Garros — tytuł", "year": 2020, "type": "grand-slam" },
      { "age": 21, "label": "WTA #1", "year": 2022, "type": "ranking" }
    ]
  },
  "carlos-alcaraz": {
    "displayName": "Carlos Alcaraz",
    "country": "🇪🇸",
    "born": "2003-05-05",
    "milestones": [
      { "age": 13, "label": "Mistrz Hiszpanii U14", "year": 2016, "type": "national" },
      { "age": 15, "label": "Pierwszy ITF Junior", "year": 2018, "type": "international" },
      { "age": 17, "label": "Pierwsze ATP — kwalifikacje Wimbledon", "year": 2020, "type": "pro" },
      { "age": 18, "label": "Pokonanie Nadala (Madryt)", "year": 2021, "type": "milestone" },
      { "age": 19, "label": "US Open — tytuł + ATP #1", "year": 2022, "type": "grand-slam" },
      { "age": 21, "label": "Wimbledon — drugi tytuł GS", "year": 2024, "type": "grand-slam" }
    ]
  },
  "hubert-hurkacz": {
    "displayName": "Hubert Hurkacz",
    "country": "🇵🇱",
    "born": "1997-02-11",
    "milestones": [
      { "age": 13, "label": "MP U14 — finał", "year": 2010, "type": "national" },
      { "age": 16, "label": "Pierwsze ITF Junior", "year": 2013, "type": "international" },
      { "age": 19, "label": "ATP debut", "year": 2016, "type": "pro" },
      { "age": 22, "label": "Pierwszy tytuł ATP (Winston-Salem)", "year": 2019, "type": "pro" },
      { "age": 24, "label": "Półfinał Wimbledonu", "year": 2021, "type": "grand-slam" },
      { "age": 26, "label": "ATP #6 — kariery najwyżej", "year": 2023, "type": "ranking" }
    ]
  }
}
```

- [ ] **Step 2: CareerTrajectory.jsx**

```jsx
import { useState } from 'react'
import { LineChart } from 'lucide-react'
import benchmarks from '../../data/careerBenchmarks.json'
import './CareerTrajectory.css'

const MAX_AGE = 25

function ageAtDate(birth, eventDate) {
  const b = new Date(birth)
  const d = new Date(eventDate)
  return (d - b) / (365.25 * 24 * 60 * 60 * 1000)
}

function playerCurrentAge(player) {
  if (!player?.dateOfBirth) return null
  return ageAtDate(player.dateOfBirth, new Date())
}

function buildPlayerMilestones(player, achievements = []) {
  if (!player?.dateOfBirth) return []
  return achievements
    .filter((a) => a.date)
    .map((a) => ({
      age: ageAtDate(player.dateOfBirth, a.date),
      label: a.title,
      year: a.year,
    }))
    .filter((m) => m.age >= 0 && m.age <= MAX_AGE)
    .sort((a, b) => a.age - b.age)
}

export default function CareerTrajectory({ player, achievements = [] }) {
  const [selected, setSelected] = useState(['iga-swiatek'])

  if (!player?.dateOfBirth) return null

  const playerMs = buildPlayerMilestones(player, achievements)
  const currentAge = playerCurrentAge(player)

  const benchmarkOptions = Object.entries(benchmarks).map(([k, v]) => ({ key: k, label: v.displayName, country: v.country }))

  const toggle = (key) => {
    setSelected((cur) => {
      if (cur.includes(key)) return cur.filter((k) => k !== key)
      if (cur.length >= 2) return [cur[1], key]
      return [...cur, key]
    })
  }

  const renderMilestoneLine = (milestones, color, label) => (
    <div className="ct-line">
      <div className="ct-line-label" style={{ color }}>{label}</div>
      <div className="ct-line-track">
        {milestones.map((m, i) => {
          const left = `${(m.age / MAX_AGE) * 100}%`
          return (
            <div key={i} className="ct-dot" style={{ left, background: color }} title={`${m.label} (${m.year || ''}) — wiek ${m.age.toFixed(1)}`} />
          )
        })}
      </div>
    </div>
  )

  return (
    <section className="ct-section">
      <header className="ct-header">
        <LineChart size={20} />
        <h2>Trajektoria kariery</h2>
      </header>

      <div className="ct-controls">
        <span className="ct-controls-label">Porównaj z:</span>
        {benchmarkOptions.map((b) => (
          <button
            key={b.key}
            className={`ct-chip ${selected.includes(b.key) ? 'active' : ''}`}
            onClick={() => toggle(b.key)}
          >
            {b.country} {b.label}
          </button>
        ))}
      </div>

      <div className="ct-axis">
        {[0, 5, 10, 15, 20, 25].map((y) => (
          <div key={y} className="ct-axis-mark" style={{ left: `${(y / MAX_AGE) * 100}%` }}>
            {y} lat
          </div>
        ))}
        {currentAge != null && (
          <div className="ct-current-age" style={{ left: `${(currentAge / MAX_AGE) * 100}%` }} title={`${player.firstName} ma ${currentAge.toFixed(1)} lat`} />
        )}
      </div>

      <div className="ct-lines">
        {renderMilestoneLine(playerMs, '#6366f1', `${player.firstName}`)}
        {selected.map((key, i) => {
          const b = benchmarks[key]
          if (!b) return null
          const color = i === 0 ? '#dc2626' : '#10b981'
          return (
            <div key={key}>
              {renderMilestoneLine(b.milestones, color, b.displayName)}
            </div>
          )
        })}
      </div>

      <div className="ct-tip">
        Najedź na kropki, aby zobaczyć szczegóły. Pionowa kreska = aktualny wiek.
      </div>
    </section>
  )
}
```

- [ ] **Step 3: CareerTrajectory.css**

```css
.ct-section {
  margin: 24px 0; padding: 20px;
  background: linear-gradient(135deg, #f5f3ff 0%, #fff 100%);
  border-radius: 16px;
  border: 1px solid #ddd6fe;
}
.ct-header { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
.ct-header h2 { font-size: 18px; margin: 0; }

.ct-controls { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-bottom: 18px; }
.ct-controls-label { font-size: 12px; color: #6b7280; margin-right: 4px; }
.ct-chip {
  padding: 4px 12px; border: 1px solid #d1d5db; background: white;
  border-radius: 999px; font-size: 12px; cursor: pointer; color: #374151;
}
.ct-chip.active { background: #6366f1; color: white; border-color: #6366f1; }

.ct-axis {
  position: relative; height: 18px; margin-bottom: 12px;
  border-bottom: 1px dashed #d1d5db;
}
.ct-axis-mark {
  position: absolute; bottom: -2px; transform: translateX(-50%);
  font-size: 10px; color: #6b7280;
}
.ct-current-age {
  position: absolute; top: -10px; bottom: -200px;
  width: 2px; background: #6366f1; transform: translateX(-50%);
  z-index: 1;
}

.ct-lines { display: flex; flex-direction: column; gap: 18px; }
.ct-line { position: relative; }
.ct-line-label { font-size: 12px; font-weight: 700; margin-bottom: 6px; }
.ct-line-track {
  position: relative; height: 14px;
  background: #f3f4f6; border-radius: 7px;
}
.ct-dot {
  position: absolute; top: 50%; transform: translate(-50%, -50%);
  width: 12px; height: 12px; border-radius: 50%;
  border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  cursor: pointer;
}

.ct-tip { font-size: 11px; color: #9ca3af; margin-top: 12px; }
```

- [ ] **Step 4: Commit**

```bash
git add client/src/data/careerBenchmarks.json client/src/components/career/CareerTrajectory.jsx client/src/components/career/CareerTrajectory.css
git commit -m "feat: CareerTrajectory — side-by-side milestones vs Iga/Carlos/Hubi"
```

---

## Task 12: Integracja w `ChildProfile`

**Files:** Modify `client/src/pages/parent/ChildProfile.jsx`

- [ ] **Step 1: Dodaj 3 nowe importy + fetch achievements**

W bloku importów (po istniejących `UpcomingTournaments`), dodaj:

```jsx
import RecentMatchesSection from '../../components/match/RecentMatchesSection'
import SeasonTimeline from '../../components/season/SeasonTimeline'
import CareerTrajectory from '../../components/career/CareerTrajectory'
```

Find the existing `useState`/`useEffect` data block. After `setReviews(revRes.data.reviews || [])`, add achievement fetching for `CareerTrajectory`. Look for the existing `Promise.all([...])` w `fetchData` i ROZSZERZ go o `api.get('/achievements?player=' + id)`. Zapisz result do nowego state'u `achievements`.

Edit by finding the `Promise.all([...])` block. Use Read first to see exact structure. Add achievements fetch + setAchievements state.

Specific guidance: jeśli istniejący kod jest:
```jsx
const [reviews, setReviews] = useState([])
```
Dodaj obok:
```jsx
const [achievements, setAchievements] = useState([])
```

W `Promise.all`:
```jsx
const [playerRes, actRes, revRes] = await Promise.all([
  api.get(`/players/${id}`),
  api.get('/activities?status=planned&limit=3').catch(() => ({ data: { activities: [] } })),
  api.get(`/reviews?player=${id}&status=published&limit=1`).catch(() => ({ data: { reviews: [] } })),
])
```

Zmień na:
```jsx
const [playerRes, actRes, revRes, achRes] = await Promise.all([
  api.get(`/players/${id}`),
  api.get('/activities?status=planned&limit=3').catch(() => ({ data: { activities: [] } })),
  api.get(`/reviews?player=${id}&status=published&limit=1`).catch(() => ({ data: { reviews: [] } })),
  api.get(`/achievements?player=${id}`).catch(() => ({ data: { achievements: [] } })),
])
setChild(playerRes.data.player || playerRes.data)
const now = new Date()
setActivities((actRes.data.activities || []).filter((a) => new Date(a.date) >= now).slice(0, 3))
setReviews(revRes.data.reviews || [])
setAchievements(achRes.data.achievements || [])
```

- [ ] **Step 2: Rozszerz warunkowy blok performance**

Find existing block:
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

Zamień na:
```jsx
{child.developmentLevel === 'performance' && (
  <>
    <PalmaresSection playerId={child._id} />
    <CoachingTeamSection coaches={child.coaches || []} />
    <RankingSummary ranking={child.ranking || {}} />
    <SeasonTimeline playerId={child._id} />
    <UpcomingTournaments playerId={child._id} />
    <RecentMatchesSection playerId={child._id} />
    <CareerTrajectory player={child} achievements={achievements} />
  </>
)}
```

- [ ] **Step 3: Verify**

Run: `cd client && npm run build` — Expected: success.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/parent/ChildProfile.jsx
git commit -m "feat: ChildProfile — Season + RecentMatches + CareerTrajectory sections"
```

---

## Task 13: Komponent `MatchForm` (do edycji w panelu coach)

**Files:** Create `client/src/components/match/MatchForm.jsx` + `.css`

- [ ] **Step 1: MatchForm.jsx**

```jsx
import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import api from '../../api/axios'
import './MatchForm.css'

const ROUNDS = ['sparing', 'qualif', 'R64', 'R32', 'R16', 'QF', 'SF', 'F', 'final-3rd-place']
const SURFACES = ['clay', 'hard', 'indoor-hard', 'grass']

export default function MatchForm({ playerId, match, onSave, onCancel }) {
  const isEdit = !!match?._id
  const [form, setForm] = useState(() => ({
    date: match?.date ? new Date(match.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    round: match?.round || 'sparing',
    surface: match?.surface || 'clay',
    durationMinutes: match?.durationMinutes || '',
    opponent: {
      name: match?.opponent?.name || '',
      club: match?.opponent?.club || '',
      ranking: match?.opponent?.ranking || {},
    },
    scoutingNotes: match?.scoutingNotes || '',
    won: match?.result?.won ?? true,
    sets: match?.result?.sets?.length ? match.result.sets : [{ playerScore: 6, opponentScore: 4 }],
    keyMoments: (match?.keyMoments || []).join('\n'),
    coachDebrief: match?.coachDebrief || '',
    mentalState: match?.mentalState || 3,
    stats: match?.stats || {},
  }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const updateForm = (patch) => setForm((f) => ({ ...f, ...patch }))
  const updateOpp = (patch) => setForm((f) => ({ ...f, opponent: { ...f.opponent, ...patch } }))
  const updateSet = (idx, patch) => setForm((f) => {
    const sets = [...f.sets]
    sets[idx] = { ...sets[idx], ...patch }
    return { ...f, sets }
  })
  const addSet = () => setForm((f) => ({ ...f, sets: [...f.sets, { playerScore: 0, opponentScore: 0 }] }))
  const removeSet = (idx) => setForm((f) => ({ ...f, sets: f.sets.filter((_, i) => i !== idx) }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        player: playerId,
        date: form.date,
        round: form.round,
        surface: form.surface,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
        opponent: {
          name: form.opponent.name,
          club: form.opponent.club || undefined,
          ranking: form.opponent.ranking,
        },
        scoutingNotes: form.scoutingNotes || undefined,
        result: {
          won: form.won,
          sets: form.sets.map((s) => ({
            playerScore: Number(s.playerScore),
            opponentScore: Number(s.opponentScore),
            tiebreak: s.tiebreak != null && s.tiebreak !== '' ? Number(s.tiebreak) : undefined,
          })),
        },
        keyMoments: form.keyMoments.split('\n').map((s) => s.trim()).filter(Boolean),
        coachDebrief: form.coachDebrief || undefined,
        mentalState: form.mentalState ? Number(form.mentalState) : undefined,
        stats: form.stats,
      }
      const res = isEdit
        ? await api.put(`/matches/${match._id}`, payload)
        : await api.post('/matches', payload)
      onSave(res.data.match)
    } catch (err) {
      setError(err.response?.data?.message || 'Błąd zapisu')
    }
    setSaving(false)
  }

  return (
    <div className="mf-overlay" onClick={onCancel}>
      <form className="mf-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <header className="mf-header">
          <h2>{isEdit ? 'Edytuj mecz' : 'Nowy mecz'}</h2>
          <button type="button" className="mf-close" onClick={onCancel}><X size={18} /></button>
        </header>

        <div className="mf-grid">
          <label>Data
            <input type="date" value={form.date} onChange={(e) => updateForm({ date: e.target.value })} required />
          </label>
          <label>Runda
            <select value={form.round} onChange={(e) => updateForm({ round: e.target.value })}>
              {ROUNDS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label>Nawierzchnia
            <select value={form.surface} onChange={(e) => updateForm({ surface: e.target.value })}>
              {SURFACES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label>Czas (min)
            <input type="number" value={form.durationMinutes} onChange={(e) => updateForm({ durationMinutes: e.target.value })} />
          </label>
        </div>

        <fieldset className="mf-fs">
          <legend>Rywalka</legend>
          <input placeholder="Imię i nazwisko" value={form.opponent.name} onChange={(e) => updateOpp({ name: e.target.value })} required />
          <input placeholder="Klub (opcjonalnie)" value={form.opponent.club} onChange={(e) => updateOpp({ club: e.target.value })} />
          <input type="number" placeholder="Ranking PZT" value={form.opponent.ranking?.pzt || ''} onChange={(e) => updateOpp({ ranking: { ...form.opponent.ranking, pzt: e.target.value ? Number(e.target.value) : undefined } })} />
        </fieldset>

        <label>Scouting (przed meczem)
          <textarea rows={3} value={form.scoutingNotes} onChange={(e) => updateForm({ scoutingNotes: e.target.value })} />
        </label>

        <fieldset className="mf-fs">
          <legend>Wynik</legend>
          <label className="mf-switch">
            <input type="checkbox" checked={form.won} onChange={(e) => updateForm({ won: e.target.checked })} />
            Wygrana
          </label>
          {form.sets.map((s, idx) => (
            <div key={idx} className="mf-set-row">
              <span>Set {idx + 1}</span>
              <input type="number" value={s.playerScore} onChange={(e) => updateSet(idx, { playerScore: e.target.value })} />
              <span>:</span>
              <input type="number" value={s.opponentScore} onChange={(e) => updateSet(idx, { opponentScore: e.target.value })} />
              <input type="number" placeholder="TB" value={s.tiebreak ?? ''} onChange={(e) => updateSet(idx, { tiebreak: e.target.value })} />
              <button type="button" className="mf-set-rm" onClick={() => removeSet(idx)}>×</button>
            </div>
          ))}
          <button type="button" className="mf-add-set" onClick={addSet}>+ dodaj set</button>
        </fieldset>

        <label>Kluczowe momenty (po jednym w linii)
          <textarea rows={3} value={form.keyMoments} onChange={(e) => updateForm({ keyMoments: e.target.value })} />
        </label>

        <label>Debrief trenera (po meczu)
          <textarea rows={3} value={form.coachDebrief} onChange={(e) => updateForm({ coachDebrief: e.target.value })} />
        </label>

        <label>Stan mentalny (1-5)
          <input type="number" min={1} max={5} value={form.mentalState} onChange={(e) => updateForm({ mentalState: e.target.value })} />
        </label>

        {error && <div className="mf-error">{error}</div>}

        <footer className="mf-footer">
          <button type="button" onClick={onCancel}>Anuluj</button>
          <button type="submit" disabled={saving}>
            <Save size={14} /> {saving ? 'Zapisuję...' : 'Zapisz'}
          </button>
        </footer>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: MatchForm.css**

```css
.mf-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: flex-start; justify-content: center; z-index: 60; padding: 20px; overflow-y: auto; }
.mf-modal { background: white; border-radius: 16px; max-width: 700px; width: 100%; padding: 24px; }
.mf-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.mf-header h2 { margin: 0; font-size: 20px; }
.mf-close { background: #f3f4f6; border: none; border-radius: 8px; padding: 6px; cursor: pointer; }

.mf-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin-bottom: 14px; }
.mf-modal label { display: flex; flex-direction: column; font-size: 12px; color: #374151; gap: 4px; margin-bottom: 12px; }
.mf-modal input, .mf-modal select, .mf-modal textarea {
  padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 8px;
  font-size: 14px; font-family: inherit;
}
.mf-fs { border: 1px solid #e5e7eb; padding: 12px; border-radius: 10px; margin-bottom: 14px; }
.mf-fs legend { font-size: 12px; font-weight: 700; color: #374151; padding: 0 6px; }
.mf-fs input { display: block; width: 100%; margin-bottom: 8px; }

.mf-switch { flex-direction: row; align-items: center; gap: 8px; margin-bottom: 12px; }

.mf-set-row { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.mf-set-row input { width: 60px; margin: 0; }
.mf-set-row input[placeholder="TB"] { width: 50px; }
.mf-set-rm { background: #fee2e2; color: #dc2626; border: none; border-radius: 6px; padding: 4px 10px; cursor: pointer; }
.mf-add-set { background: #eef2ff; color: #4338ca; border: none; border-radius: 6px; padding: 6px 12px; cursor: pointer; font-size: 13px; }

.mf-error { color: #dc2626; font-size: 13px; margin: 8px 0; }
.mf-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
.mf-footer button { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 6px; }
.mf-footer button[type="button"] { background: #f3f4f6; color: #374151; }
.mf-footer button[type="submit"] { background: #6366f1; color: white; }
.mf-footer button[type="submit"]:disabled { opacity: 0.5; }
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/match/MatchForm.jsx client/src/components/match/MatchForm.css
git commit -m "feat: MatchForm — modal for adding/editing matches with scouting/sets/debrief"
```

---

## Task 14: Komponent `MatchesTab` (zakładka coach)

**Files:** Create `client/src/components/match/MatchesTab.jsx` + `.css`

- [ ] **Step 1: MatchesTab.jsx**

```jsx
import { useEffect, useState } from 'react'
import { Plus, Edit3, Trash2 } from 'lucide-react'
import api from '../../api/axios'
import MatchCard from './MatchCard'
import MatchDetail from './MatchDetail'
import MatchForm from './MatchForm'
import './MatchesTab.css'

export default function MatchesTab({ playerId }) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)

  const reload = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/matches?player=${playerId}`)
      setMatches(res.data.matches || [])
    } catch { /* silent */ }
    setLoading(false)
  }

  useEffect(() => { reload() }, [playerId])

  const handleSave = () => {
    setCreating(false)
    setEditing(null)
    reload()
  }

  const handleDelete = async (m) => {
    if (!window.confirm(`Usunąć mecz vs. ${m.opponent?.name}?`)) return
    try {
      await api.delete(`/matches/${m._id}`)
      reload()
    } catch { /* silent */ }
  }

  if (loading) return <div className="mt-loading">Ładuję mecze...</div>

  return (
    <div className="mt-tab">
      <header className="mt-header">
        <h3>Mecze ({matches.length})</h3>
        <button className="mt-add" onClick={() => setCreating(true)}>
          <Plus size={14} /> Nowy mecz
        </button>
      </header>

      {matches.length === 0 ? (
        <div className="mt-empty">Brak meczy. Kliknij "Nowy mecz" żeby zacząć.</div>
      ) : (
        <div className="mt-list">
          {matches.map((m) => (
            <div key={m._id} className="mt-item">
              <MatchCard match={m} onClick={() => setDetail(m)} />
              <div className="mt-actions">
                <button onClick={() => setEditing(m)} title="Edytuj"><Edit3 size={14} /></button>
                <button onClick={() => handleDelete(m)} title="Usuń"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {detail && <MatchDetail match={detail} onClose={() => setDetail(null)} />}
      {(editing || creating) && (
        <MatchForm
          playerId={playerId}
          match={editing}
          onSave={handleSave}
          onCancel={() => { setCreating(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: MatchesTab.css**

```css
.mt-tab { padding: 16px 0; }
.mt-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.mt-header h3 { font-size: 16px; margin: 0; }
.mt-add {
  display: flex; align-items: center; gap: 6px;
  background: #6366f1; color: white;
  padding: 6px 12px; border: none; border-radius: 8px;
  cursor: pointer; font-size: 13px; font-weight: 600;
}
.mt-list { display: flex; flex-direction: column; gap: 10px; }
.mt-item { display: flex; gap: 8px; align-items: stretch; }
.mt-item > .mc-card { flex: 1; }
.mt-actions { display: flex; flex-direction: column; gap: 4px; }
.mt-actions button {
  padding: 6px; border: 1px solid #e5e7eb;
  background: white; border-radius: 8px; cursor: pointer;
  color: #4b5563; display: flex; align-items: center;
}
.mt-actions button:hover { background: #f3f4f6; }
.mt-empty { padding: 40px; text-align: center; color: #9ca3af; background: #fafafa; border-radius: 12px; }
.mt-loading { padding: 20px; text-align: center; color: #6b7280; }
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/match/MatchesTab.jsx client/src/components/match/MatchesTab.css
git commit -m "feat: MatchesTab — full match list with create/edit/delete for coaches"
```

---

## Task 15: Integracja w `CoachPlayerProfile`

**Files:** Modify `client/src/pages/coach/CoachPlayerProfile.jsx`

- [ ] **Step 1: Dodaj importy + fetch achievements**

W bloku importów (po istniejących UpcomingTournaments etc.), dodaj:
```jsx
import RecentMatchesSection from '../../components/match/RecentMatchesSection'
import SeasonTimeline from '../../components/season/SeasonTimeline'
import CareerTrajectory from '../../components/career/CareerTrajectory'
import MatchesTab from '../../components/match/MatchesTab'
```

W komponencie:
1. Dodaj state: `const [achievements, setAchievements] = useState([])`
2. W istniejącym `useEffect`/`fetchData` rozszerz o `api.get('/achievements?player=' + id)` i `setAchievements(res.data.achievements || [])`. Jeśli używa `Promise.all`, dorzuć tam.

- [ ] **Step 2: Rozszerz warunkowy blok performance**

Find existing block (z poprzedniego sprintu):
```jsx
{player?.developmentLevel === 'performance' && (
  <>
    <PalmaresSection playerId={player._id} />
    <CoachingTeamSection coaches={player.coaches || []} />
    <RankingSummary ranking={player.ranking || {}} />
    <UpcomingTournaments playerId={player._id} />
  </>
)}
```

Zamień na:
```jsx
{player?.developmentLevel === 'performance' && (
  <>
    <PalmaresSection playerId={player._id} />
    <CoachingTeamSection coaches={player.coaches || []} />
    <RankingSummary ranking={player.ranking || {}} />
    <SeasonTimeline playerId={player._id} />
    <UpcomingTournaments playerId={player._id} />
    <RecentMatchesSection playerId={player._id} />
    <CareerTrajectory player={player} achievements={achievements} />
  </>
)}
```

- [ ] **Step 3: Dodaj nową zakładkę "Mecze" w sekcji tabów**

Find existing tabs section in `CoachPlayerProfile.jsx`. Use Grep z patternem `tab|Tab|Skills|Sesje|setActiveTab` żeby znaleźć strukturę zakładek. Tabs są kontrolowane przez state typu `activeTab`. Dodaj nową opcję `'matches'`. W panelu pokaż `<MatchesTab playerId={player._id} />`.

UWAGA: zakładka "Mecze" pokazuje się tylko jeśli `player.developmentLevel === 'performance'` (warunkowo).

Poniższe jest przykładowe — dostosuj do faktycznej struktury pliku:
```jsx
{player.developmentLevel === 'performance' && (
  <button className={activeTab === 'matches' ? 'active' : ''} onClick={() => setActiveTab('matches')}>
    Mecze
  </button>
)}
```

I w panelu treści:
```jsx
{activeTab === 'matches' && <MatchesTab playerId={player._id} />}
```

- [ ] **Step 4: Verify build**

Run: `cd client && npm run build`

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/coach/CoachPlayerProfile.jsx
git commit -m "feat: CoachPlayerProfile — Season + Matches tab + CareerTrajectory"
```

---

## Task 16: Seed — Match (8 meczy Sonii)

**Files:** Modify `server/src/scripts/seed.js`

- [ ] **Step 1: Dodaj import Match**

W bloku importów seed.js, znajdź:
```js
import Achievement from '../models/Achievement.js';
```

Zmień na:
```js
import Achievement from '../models/Achievement.js';
import Match from '../models/Match.js';
```

- [ ] **Step 2: Dodaj `Match.deleteMany({})` do bloku czyszczenia**

W `await Promise.all([...])` z `deleteMany`, znajdź `Achievement.deleteMany({}),` i dodaj zaraz pod:
```js
      Match.deleteMany({}),
```

- [ ] **Step 3: Dodaj sekcję 12.6 MATCHES po sekcji 12.5 ACHIEVEMENTS**

Znajdź:
```js
    console.log(`  9 osiągnięć Sonii (7 MP + 2 międzynarodowe)\n`);
```

Zaraz po tej linii dodaj:

```js

    // ============================================================
    // 12.6 MATCHES — mecze Sonii (z palmaresu + sparingi)
    // ============================================================
    console.log('Tworzenie meczy Sonii...');

    await Match.insertMany([
      {
        player: sonia._id, club: club._id,
        date: new Date('2025-08-17'),
        round: 'F', surface: 'clay', durationMinutes: 95,
        opponent: { name: 'Maja Wiśniewska', club: 'KT Mera Warszawa', ranking: { pzt: 5 } },
        scoutingNotes: 'Lewa zaczynająca. Słabszy bekhend pod presją. Mocny serwis na deuce side.',
        result: { won: true, sets: [{ playerScore: 7, opponentScore: 5 }, { playerScore: 6, opponentScore: 3 }] },
        stats: { firstServePct: 68, aces: 4, doubleFaults: 2, winners: 18, unforcedErrors: 14, breakPointsConverted: 4, breakPointsFaced: 6 },
        keyMoments: ['Break w 11. gemie 1. seta — kluczowy', 'Po przegranym 2:5 w 1. secie comeback do 7:5', 'W 2. secie pełna kontrola od początku'],
        coachDebrief: '7. tytuł mistrzowski. Świetna gra mentalna w 1. secie po stracie 2:5. Plan na MP U16 idzie zgodnie z założeniami.',
        mentalState: 5, visibleToParent: true, createdBy: headCoach._id,
      },
      {
        player: sonia._id, club: club._id,
        date: new Date('2024-12-08'),
        round: 'F', surface: 'indoor-hard', durationMinutes: 78,
        opponent: { name: 'Zuzanna Krawczyk', club: 'KT Górnik Bytom' },
        scoutingNotes: 'Płaska gra z głębi. Słabsza przy zmianie rytmu — kroty.',
        result: { won: true, sets: [{ playerScore: 6, opponentScore: 4 }, { playerScore: 6, opponentScore: 2 }] },
        keyMoments: ['Skuteczny dropshot 7/9 razy', 'Break-back w 4. gemie 1. seta'],
        coachDebrief: 'Najmłodsza mistrzyni halowych U14. Kroty zadziałały świetnie — kontynuować trening tej zagrywki.',
        mentalState: 5, visibleToParent: true, createdBy: headCoach._id,
      },
      {
        player: sonia._id, club: club._id,
        date: new Date('2024-10-12'),
        round: 'F', surface: 'clay', durationMinutes: 142,
        opponent: { name: 'Sofia Costa', club: 'CT Lisboa', ranking: { itf: 280 } },
        scoutingNotes: 'Zawodniczka z ITF top 300. Mocna gra defensywna — bardzo szybka. Trzeba grać agresywnie i krócej.',
        result: { won: false, sets: [{ playerScore: 6, opponentScore: 4 }, { playerScore: 5, opponentScore: 7, tiebreak: 5 }, { playerScore: 4, opponentScore: 6 }] },
        stats: { firstServePct: 61, doubleFaults: 6, winners: 22, unforcedErrors: 31, breakPointsConverted: 5, breakPointsFaced: 12 },
        keyMoments: ['Świetne 1. set — kontrolowała tempo', 'Tie-break 2. seta — błąd na BP', 'W 3. secie zmęczenie fizyczne — straciła pierwszy serwis'],
        coachDebrief: 'Pierwszy międzynarodowy finał. Porażka w 3 setach z bardziej doświadczoną przeciwniczką. Lekcja: wytrzymałość 3-setowa to teraz priorytet.',
        mentalState: 4, visibleToParent: true, createdBy: headCoach._id,
      },
      {
        player: sonia._id, club: club._id,
        date: new Date('2025-10-19'),
        round: 'QF', surface: 'hard', durationMinutes: 105,
        opponent: { name: 'Klara Novak', club: 'TK Sparta Praha', ranking: { itf: 215 } },
        scoutingNotes: 'Czeszka, 16 lat. Mocny return, słabszy serwis w wietrze.',
        result: { won: false, sets: [{ playerScore: 6, opponentScore: 7, tiebreak: 4 }, { playerScore: 4, opponentScore: 6 }] },
        stats: { firstServePct: 58, aces: 2, doubleFaults: 5, winners: 14, unforcedErrors: 22 },
        keyMoments: ['Tie-break 1. seta — przegrany 4:7 po prowadzeniu 4:1', 'Break w 7. gemie 2. seta zakończył mecz'],
        coachDebrief: 'Pierwsza ćwierćfinałowa porażka na ITF. Walka mentalna w tie-breaku — temat na sesje z dr Sokołowskim.',
        mentalState: 3, visibleToParent: true, createdBy: headCoach._id,
      },
      {
        player: sonia._id, club: club._id,
        date: daysAgo(7),
        round: 'sparing', surface: 'clay', durationMinutes: 95,
        opponent: { name: 'Julia Kowalska', club: 'KT Smecz Warszawa', isInternal: true, playerRef: julia._id, ranking: { pzt: 28 } },
        result: { won: true, sets: [{ playerScore: 6, opponentScore: 2 }, { playerScore: 6, opponentScore: 3 }] },
        stats: { firstServePct: 72, aces: 5, winners: 24, unforcedErrors: 11 },
        keyMoments: ['Bardzo agresywne returny — 70% punktów na returnie', 'Świetny serwis+1 — Julia nie miała czasu na ułożenie pozycji'],
        coachDebrief: 'Sparing pokazuje wyraźny dystans poziomu. Sonia konsekwentnie agresywna — zgodnie z planem przed MP U16.',
        mentalState: 5, visibleToParent: true, createdBy: headCoach._id,
      },
      {
        player: sonia._id, club: club._id,
        date: daysAgo(21),
        round: 'sparing', surface: 'clay', durationMinutes: 110,
        opponent: { name: 'Julia Kowalska', club: 'KT Smecz Warszawa', isInternal: true, playerRef: julia._id, ranking: { pzt: 28 } },
        result: { won: true, sets: [{ playerScore: 6, opponentScore: 4 }, { playerScore: 7, opponentScore: 5 }] },
        keyMoments: ['Tie-break-style 7:5 w 2. secie — Julia bliżej', 'Forhend długi line — dziś zadziałał kilkukrotnie'],
        coachDebrief: 'Bliższy mecz niż 2 tygodnie temu — Julia rośnie. Dobra praktyka pod presją.',
        mentalState: 4, visibleToParent: true, createdBy: headCoach._id,
      },
      {
        player: sonia._id, club: club._id, tournament: null,
        date: daysAgo(35),
        round: 'sparing', surface: 'indoor-hard', durationMinutes: 90,
        opponent: { name: 'Wiktoria Lis', club: 'KT Legia Warszawa', ranking: { pzt: 12 } },
        scoutingNotes: 'Lis była 4. na MP U16 w 2024. Bardzo szybka. Słabsza po długich wymianach.',
        result: { won: true, sets: [{ playerScore: 6, opponentScore: 3 }, { playerScore: 4, opponentScore: 6 }, { playerScore: 6, opponentScore: 4 }] },
        keyMoments: ['Pewny 1. set', 'W 2. secie Sonia za bardzo defensywna', 'W 3. secie powrót do agresji = odwrót wyniku'],
        coachDebrief: 'Mecz testowy z mocniejszą rywalką. 2-set "edukacyjny" — zbyt defensywnie. 3-set perfekcyjna reakcja.',
        mentalState: 4, visibleToParent: true, createdBy: headCoach._id,
      },
      {
        player: sonia._id, club: club._id,
        date: daysAgo(60),
        round: 'SF', surface: 'clay', durationMinutes: 100,
        opponent: { name: 'Pola Hejnar', club: 'KT Górnik Wrocław', ranking: { pzt: 8 } },
        scoutingNotes: 'Top-10 PZT, mocna lewa. Praworęczna z dwuręcznym bekhendem.',
        result: { won: true, sets: [{ playerScore: 6, opponentScore: 3 }, { playerScore: 7, opponentScore: 6, tiebreak: 5 }] },
        stats: { firstServePct: 65, aces: 3, doubleFaults: 3, winners: 19, unforcedErrors: 16 },
        keyMoments: ['Skuteczność 1. serwisu kluczowa', 'Tie-break 7:5 — opanowanie pod presją'],
        coachDebrief: 'Półfinał wygrany — drogi do 7. tytułu MP. Tie-break to dowód postępu mentalnego.',
        mentalState: 5, visibleToParent: true, createdBy: headCoach._id,
      },
    ]);

    console.log(`  8 meczy Sonii (4 oficjalne + 4 sparingi)\n`);
```

- [ ] **Step 4: Verify**

```bash
node --check server/src/scripts/seed.js
```

- [ ] **Step 5: Commit**

```bash
git add server/src/scripts/seed.js
git commit -m "feat: seed Sonia matches — 8 matches (4 official + 4 sparrings)"
```

---

## Task 17: Seed — SeasonPlan (1 dla Sonii sezon 2026)

**Files:** Modify `server/src/scripts/seed.js`

- [ ] **Step 1: Dodaj import SeasonPlan**

W imporcie znajdź:
```js
import Match from '../models/Match.js';
```

Zmień na:
```js
import Match from '../models/Match.js';
import SeasonPlan from '../models/SeasonPlan.js';
```

- [ ] **Step 2: Dodaj `SeasonPlan.deleteMany({})` do bloku czyszczenia**

W `await Promise.all([...])` z `deleteMany`, znajdź `Match.deleteMany({}),` i dodaj zaraz pod:
```js
      SeasonPlan.deleteMany({}),
```

- [ ] **Step 3: Dodaj sekcję 12.7 SEASON PLAN po sekcji 12.6 MATCHES**

Znajdź:
```js
    console.log(`  8 meczy Sonii (4 oficjalne + 4 sparingi)\n`);
```

Po tej linii dodaj:

```js

    // ============================================================
    // 12.7 SEASON PLAN — sezon 2026 Sonii
    // ============================================================
    console.log('Tworzenie planu sezonu Sonii...');

    await SeasonPlan.create({
      player: sonia._id, club: club._id,
      season: '2026',
      status: 'active',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      weeklyHoursTarget: 14,
      phases: [
        { type: 'build',     startDate: new Date('2026-01-01'), endDate: new Date('2026-02-28'), intensity: 4, targetEvent: 'MP U16',           notes: 'Bazowe budowanie kondycji + technika serwisu' },
        { type: 'peak',      startDate: new Date('2026-03-01'), endDate: new Date('2026-05-31'), intensity: 5, targetEvent: 'MP U16',           notes: 'Szczyt formy przed głównym celem sezonu' },
        { type: 'taper',     startDate: new Date('2026-06-01'), endDate: new Date('2026-06-15'), intensity: 3, targetEvent: 'MP U16 (12-15.06)', notes: 'Redukcja objętości, świeżość' },
        { type: 'recovery',  startDate: new Date('2026-06-16'), endDate: new Date('2026-07-05'), intensity: 2, notes: 'Aktywna regeneracja po MP' },
        { type: 'peak',      startDate: new Date('2026-07-06'), endDate: new Date('2026-08-31'), intensity: 5, targetEvent: 'ITF J60 Bytom + Pardubice', notes: 'Drugi peak — wyjazdy ITF' },
        { type: 'build',     startDate: new Date('2026-09-01'), endDate: new Date('2026-10-31'), intensity: 4, notes: 'Powrót do bazy + nowe techniki' },
        { type: 'peak',      startDate: new Date('2026-11-01'), endDate: new Date('2026-12-15'), intensity: 4, targetEvent: 'Halowe MP U16',     notes: 'Szczyt na halowe' },
        { type: 'offseason', startDate: new Date('2026-12-16'), endDate: new Date('2026-12-31'), intensity: 1, notes: 'Wakacje + odpoczynek' },
      ],
      targetEvents: [
        { name: 'MP U16',          date: new Date('2026-06-13'), priority: 'A' },
        { name: 'ITF J60 Bytom',   date: new Date('2026-07-10'), priority: 'A' },
        { name: 'ITF J60 Pardubice', date: new Date('2026-08-14'), priority: 'B' },
        { name: 'Tennis Europe U16', date: new Date('2026-09-20'), priority: 'B' },
        { name: 'Halowe MP U16',   date: new Date('2026-12-05'), priority: 'B' },
        { name: 'ITF J30 Trnava',  date: new Date('2026-04-04'), priority: 'C' },
      ],
      createdBy: headCoach._id,
    });

    console.log('  Sezon 2026 Sonii (8 faz, 6 target events)\n');
```

- [ ] **Step 4: Update counts block — dodaj Match i SeasonPlan**

Find the `const counts = await Promise.all([...])` block at the end of seed.js. It contains `Achievement.countDocuments(),` (z poprzedniego sprintu). Use Edit:

old_string:
```
      Achievement.countDocuments(),
    ]);
```

new_string:
```
      Achievement.countDocuments(),
      Match.countDocuments(),
      SeasonPlan.countDocuments(),
    ]);
```

I dodaj odpowiednie console.log'i. Find:
```
    console.log(`  Osiągnięcia:      ${counts[15]}`);
```

Replace with:
```
    console.log(`  Osiągnięcia:      ${counts[15]}`);
    console.log(`  Mecze:            ${counts[16]}`);
    console.log(`  Plany sezonu:     ${counts[17]}`);
```

- [ ] **Step 5: Verify + Commit**

```bash
node --check server/src/scripts/seed.js
git add server/src/scripts/seed.js
git commit -m "feat: seed Sonia season 2026 — 8 phases + 6 A/B/C target events + summary counts"
```

---

## Task 18: Manual smoke test (end-to-end)

**Files:** N/A (manual)

- [ ] **Step 1: Reseed bazy**

```bash
npm run seed
```

Expected output zawiera:
```
Tworzenie palmaresu Sonii...
  9 osiągnięć Sonii (7 MP + 2 międzynarodowe)
Tworzenie meczy Sonii...
  8 meczy Sonii (4 oficjalne + 4 sparingi)
Tworzenie planu sezonu Sonii...
  Sezon 2026 Sonii (8 faz, 6 target events)
```
+ podsumowanie z `Mecze: 8`, `Plany sezonu: 1`.

(counts block dla Match i SeasonPlan dodany w Task 17 step 4.)

- [ ] **Step 2: Vite build**

```bash
cd client && npm run build
```

Expected: success (`✓ built in ...`).

- [ ] **Step 3: Server install (jeśli wymagane)**

```bash
cd server && npm install
```

(Jeśli pre-existing `@anthropic-ai/sdk` nie był zainstalowany.)

- [ ] **Step 4: Start dev**

```bash
npm run dev
```

Server + client startują bez błędów.

- [ ] **Step 5: Login parent3 + verify Sonia profile**

W przeglądarce: login `parent3@serveiq.pl` / `password123`.

Profil Sonii powinien teraz pokazywać 7 sekcji performance:
- Palmares ✅ (z poprzedniego sprintu)
- Zespół trenerów ✅
- Ranking ✅
- **Sezon (SeasonTimeline)** ← NOWE — 12-miesięczny pasek z fazami i kropkami events
- Plan turniejowy ✅
- **Ostatnie mecze (RecentMatchesSection)** ← NOWE — 3 najnowsze, klik = MatchDetail modal
- **Trajektoria kariery (CareerTrajectory)** ← NOWE — Sonia vs. Iga (default), klik chip → toggle benchmarków

- [ ] **Step 6: Login parent (Kacper) — test regresji**

Login `parent@serveiq.pl` / `password123`. Klik profil Kacpra.

Expected: BRAK 3 nowych sekcji (developmentLevel = 'tennis10').

- [ ] **Step 7: Login headCoach + verify Matches tab**

Login `coach.head@serveiq.pl` / `password123`. Klik profil Sonii.

Expected:
- Te same 7 sekcji widoczne
- Nowa zakładka **"Mecze"** w nawigacji tabów
- Klik "Mecze" → lista 8 meczy z ikonkami W/L
- Klik na mecz → MatchDetail modal z pełnym scoutingiem/statystykami/debriefem
- Klik "Nowy mecz" → MatchForm modal — wypełnij testowe dane → zapis działa
- Klik edycja na liście → MatchForm pre-filled → zapis działa

Klik profil Julii (Junior Advanced): brak zakładki "Mecze" (nie performance).

- [ ] **Step 8: Test API smoke**

```bash
# Login
curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"parent3@serveiq.pl","password":"password123"}' | jq -r .accessToken
# Save TOKEN from response.

# Matches list
curl -s http://localhost:5000/api/matches?player=<sonia_id> -H "Authorization: Bearer $TOKEN" | jq '.matches | length'
# Expected: 8

# H2H
curl -s "http://localhost:5000/api/matches/h2h?player=<sonia_id>&opponent=Julia%20Kowalska" -H "Authorization: Bearer $TOKEN" | jq '{wins, losses}'
# Expected: { wins: 2, losses: 0 }

# Season plan
curl -s "http://localhost:5000/api/season-plans?player=<sonia_id>&status=active" -H "Authorization: Bearer $TOKEN" | jq '.seasonPlans[0].phases | length'
# Expected: 8
```

---

## Task 19: SPRINT_STATUS.md update

**Files:** Modify `SPRINT_STATUS.md`

- [ ] **Step 1: Dodaj nowy sprint na górze pliku**

Edit `SPRINT_STATUS.md`. Find:
```
# Sprint — 2026-04-25 — Performance Pathway (Sonia stress test)
```

Insert ABOVE it:

```markdown
# Sprint — 2026-04-26 — Performance Pro Features

## Sprint Goal
Dla zawodników performance dorzucić 3 features podnoszące wartość pro: Match log + opponent scouting, periodyzację roczną z A/B/C events, oraz career trajectory benchmark vs. wybranych idoli.

## Completed
### Backend
- [x] Model `Match` (mecz w turnieju lub sparing) + indexy
- [x] Model `SeasonPlan` (sezon z fazami + target events) + auto-archive
- [x] `matchController` + `seasonPlanController` (CRUD + role-based access)
- [x] `/api/matches` + `/api/season-plans` + endpoint `GET /api/matches/h2h`

### Frontend (9 nowych komponentów)
- [x] Match: `MatchCard`, `MatchDetail`, `MatchForm`, `RecentMatchesSection`, `MatchesTab`
- [x] Season: `SeasonTimeline`
- [x] Career: `CareerTrajectory` + `careerBenchmarks.json` (Iga, Carlos, Hubi)
- [x] `ChildProfile` rozszerzony o 3 nowe sekcje warunkowe
- [x] `CoachPlayerProfile` rozszerzony + nowa zakładka "Mecze"

### Seed
- [x] 8 meczy Sonii (4 oficjalne z palmaresu + 4 sparingi, w tym 2 z Julią)
- [x] SeasonPlan 2026 dla Sonii (8 faz + 6 events A/B/C)

## Quality gates
- [x] `node --check` na nowych plikach
- [x] `npm run seed` — 4 zawodników, 8 meczy, 1 sezon, 0 błędów
- [x] `npm run build` (vite) — 0 errors
- [ ] Manual click-through w przeglądarce (parent3 + headCoach)

## Spec & plan
- Spec: `docs/superpowers/specs/2026-04-26-performance-pro-features-design.md`
- Plan: `docs/superpowers/plans/2026-04-26-performance-pro-features.md`

---

```

(Pozostawia istniejący sprint 2026-04-25 poniżej.)

- [ ] **Step 2: Commit**

```bash
git add SPRINT_STATUS.md docs/superpowers/
git commit -m "docs: SPRINT_STATUS update — performance pro features sprint"
```

---

## Self-review

**1. Spec coverage:**
- Feature A (Match log): Tasks 1-3 (model+controller+routes) + 7-9, 13-14 (UI) + 16 (seed) ✅
- Feature B (SeasonPlan): Tasks 4-6 (backend) + 10 (UI) + 17 (seed) ✅
- Feature C (Career): Task 11 (data + komponent) ✅
- Integracja `ChildProfile`: Task 12 ✅
- Integracja `CoachPlayerProfile` + zakładka Mecze: Task 15 ✅
- Smoke test + status: Tasks 18-19 ✅

**2. Placeholder scan:**
- "{ ... 6 milestones ... }" — w specu, w planie pełne dane Iga/Carlos/Hubi w Task 11 ✅
- Task 15 step 3: "Poniższe jest przykładowe — dostosuj do faktycznej struktury pliku" — to świadome, bo struktura tabów zależy od istniejącego kodu (pre-existing CoachPlayerProfile), engineer musi to znaleźć runtime. Provided general guidance.
- Task 18 step 1: "UWAGA: w bloku counts trzeba dodać countDocuments..." — niedokończenie. **Naprawiam:** dodam to jako explicit step w task 16 i 17.

**3. Type consistency:**
- `Match.opponent.name` (Task 1) — używane w MatchCard, MatchDetail, MatchForm, MatchesTab, seed ✅
- `Match.result.won` (Task 1) — używane w MatchCard, MatchDetail, MatchForm, RecentMatchesSection ✅
- `SeasonPlan.phases[].type` enum (Task 4) — używane w SeasonTimeline `PHASE_COLOR` ✅
- `SeasonPlan.targetEvents[].priority` enum 'A'|'B'|'C' (Task 4) — `PRIO_DOT_SIZE` w SeasonTimeline ✅
- `careerBenchmarks.json` schema (Task 11) — używane w CareerTrajectory ✅

**Fix do zrobienia inline:** counts block w seed (Task 18 wskazuje, że trzeba dodać countDocuments, ale plan tego nie pokazuje explicit). Dodaję teraz jako sub-step w Tasku 17 (po SeasonPlan).
