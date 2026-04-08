# Gamification Badges Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a badge/achievement system where players earn SVG badges for training milestones, skill progress, tournaments, and goals — displayed to parents on the ChildProfile page.

**Architecture:** Badges are defined as static data (no DB collection for definitions). A `PlayerBadge` Mongoose model stores earned badges per player. A `badgeEngine` service evaluates badge eligibility after key events (session create, skill update, tournament complete, goal complete). The frontend renders a grid of all possible badges on ChildProfile — earned ones are colorful SVGs, unearned are grayed out with progress indicators.

**Tech Stack:** Mongoose (PlayerBadge model), Express (badges API route), React (BadgeGrid component), inline SVG components (15 custom badge icons), existing Notification model for new-badge alerts.

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `server/src/models/PlayerBadge.js` | Schema for earned badges |
| Create | `server/src/services/badgeEngine.js` | Badge definitions + evaluation logic |
| Create | `server/src/routes/badges.js` | GET /api/badges/:playerId |
| Create | `server/src/controllers/badgeController.js` | Route handler |
| Modify | `server/src/index.js` | Mount badges route |
| Modify | `server/src/controllers/sessionController.js:105-180` | Call badgeEngine after session create |
| Modify | `server/src/controllers/sessionController.js:216-268` | Call badgeEngine after session update (skill changes) |
| Create | `client/src/components/badges/BadgeIcon.jsx` | 15 SVG badge components |
| Create | `client/src/components/badges/BadgeGrid.jsx` | Grid display with earned/unearned states |
| Create | `client/src/components/badges/BadgeGrid.css` | Styling |
| Modify | `client/src/pages/parent/ChildProfile.jsx` | Add BadgeGrid section |
| Modify | `client/src/pages/parent/ChildProfile.css` | Badge section styles |
| Modify | `server/src/scripts/seed.js` | Add sample badges for demo players |

---

### Task 1: PlayerBadge Model

**Files:**
- Create: `server/src/models/PlayerBadge.js`

- [ ] **Step 1: Create the PlayerBadge Mongoose schema**

```js
import mongoose from 'mongoose';

const playerBadgeSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
    },
    badgeSlug: {
      type: String,
      required: true,
    },
    earnedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// One badge per player — prevent duplicates
playerBadgeSchema.index({ player: 1, badgeSlug: 1 }, { unique: true });

const PlayerBadge = mongoose.model('PlayerBadge', playerBadgeSchema);

export default PlayerBadge;
```

- [ ] **Step 2: Verify model loads**

Run: `node -e "import('./server/src/models/PlayerBadge.js').then(() => console.log('OK')).catch(e => console.error(e.message))"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add server/src/models/PlayerBadge.js
git commit -m "feat: add PlayerBadge model for gamification"
```

---

### Task 2: Badge Engine Service

**Files:**
- Create: `server/src/services/badgeEngine.js`

This is the core logic. Contains badge definitions (static array) and evaluation function.

- [ ] **Step 1: Create badgeEngine with all 15 badge definitions and evaluate function**

```js
import PlayerBadge from '../models/PlayerBadge.js';
import Session from '../models/Session.js';
import Tournament from '../models/Tournament.js';
import DevelopmentGoal from '../models/DevelopmentGoal.js';
import Player from '../models/Player.js';
import Notification from '../models/Notification.js';

/**
 * Badge definitions — static, no DB collection needed.
 * Each badge has: slug, name, description, category, icon (maps to SVG component),
 * and a check() function that returns { earned: boolean, progress: { current, target } }
 */
export const BADGE_DEFINITIONS = [
  // ── TRENINGOWE ──
  {
    slug: 'first-session',
    name: 'Pierwszy Trening',
    description: 'Ukoncz pierwszy trening',
    category: 'training',
    icon: 'firstSession',
    check: async (playerId) => {
      const count = await Session.countDocuments({ player: playerId });
      return { earned: count >= 1, progress: { current: Math.min(count, 1), target: 1 } };
    },
  },
  {
    slug: 'regular-player',
    name: 'Regularny Gracz',
    description: 'Ukoncz 10 treningow',
    category: 'training',
    icon: 'regularPlayer',
    check: async (playerId) => {
      const count = await Session.countDocuments({ player: playerId });
      return { earned: count >= 10, progress: { current: Math.min(count, 10), target: 10 } };
    },
  },
  {
    slug: 'training-machine',
    name: 'Maszyna Treningowa',
    description: 'Ukoncz 50 treningow',
    category: 'training',
    icon: 'trainingMachine',
    check: async (playerId) => {
      const count = await Session.countDocuments({ player: playerId });
      return { earned: count >= 50, progress: { current: Math.min(count, 50), target: 50 } };
    },
  },
  {
    slug: 'weekly-streak',
    name: 'Tygodniowa Seria',
    description: '3 treningi w jednym tygodniu',
    category: 'training',
    icon: 'weeklyStreak',
    check: async (playerId) => {
      // Check if any ISO week has 3+ sessions
      const sessions = await Session.find({ player: playerId }).select('date').lean();
      const weekMap = {};
      for (const s of sessions) {
        const d = new Date(s.date);
        const yearWeek = `${d.getFullYear()}-W${String(getISOWeek(d)).padStart(2, '0')}`;
        weekMap[yearWeek] = (weekMap[yearWeek] || 0) + 1;
      }
      const maxInWeek = Math.max(0, ...Object.values(weekMap));
      return { earned: maxInWeek >= 3, progress: { current: Math.min(maxInWeek, 3), target: 3 } };
    },
  },
  {
    slug: 'streak-master',
    name: 'Mistrz Serii',
    description: '5 treningow w jednym tygodniu',
    category: 'training',
    icon: 'streakMaster',
    check: async (playerId) => {
      const sessions = await Session.find({ player: playerId }).select('date').lean();
      const weekMap = {};
      for (const s of sessions) {
        const d = new Date(s.date);
        const yearWeek = `${d.getFullYear()}-W${String(getISOWeek(d)).padStart(2, '0')}`;
        weekMap[yearWeek] = (weekMap[yearWeek] || 0) + 1;
      }
      const maxInWeek = Math.max(0, ...Object.values(weekMap));
      return { earned: maxInWeek >= 5, progress: { current: Math.min(maxInWeek, 5), target: 5 } };
    },
  },

  // ── UMIEJETNOSCI ──
  {
    slug: 'first-step',
    name: 'Pierwszy Krok',
    description: 'Dowolna umiejetnosc na poziomie Poznaje',
    category: 'skills',
    icon: 'firstStep',
    check: async (playerId) => {
      const player = await Player.findById(playerId).select('skills').lean();
      if (!player?.skills) return { earned: false, progress: { current: 0, target: 1 } };
      const skills = Object.values(player.skills);
      const atLevel = skills.filter((s) => (s?.score || 0) >= 2).length;
      return { earned: atLevel >= 1, progress: { current: Math.min(atLevel, 1), target: 1 } };
    },
  },
  {
    slug: 'practitioner',
    name: 'Cwiczacy',
    description: 'Dowolna umiejetnosc na poziomie Cwiczy',
    category: 'skills',
    icon: 'practitioner',
    check: async (playerId) => {
      const player = await Player.findById(playerId).select('skills').lean();
      if (!player?.skills) return { earned: false, progress: { current: 0, target: 1 } };
      const skills = Object.values(player.skills);
      const atLevel = skills.filter((s) => (s?.score || 0) >= 3).length;
      return { earned: atLevel >= 1, progress: { current: Math.min(atLevel, 1), target: 1 } };
    },
  },
  {
    slug: 'stable-player',
    name: 'Stabilny Gracz',
    description: 'Dowolna umiejetnosc na poziomie Stabilne',
    category: 'skills',
    icon: 'stablePlayer',
    check: async (playerId) => {
      const player = await Player.findById(playerId).select('skills').lean();
      if (!player?.skills) return { earned: false, progress: { current: 0, target: 1 } };
      const skills = Object.values(player.skills);
      const atLevel = skills.filter((s) => (s?.score || 0) >= 4).length;
      return { earned: atLevel >= 1, progress: { current: Math.min(atLevel, 1), target: 1 } };
    },
  },
  {
    slug: 'strong-skill',
    name: 'Mocna Strona',
    description: 'Dowolna umiejetnosc na poziomie Mocne',
    category: 'skills',
    icon: 'strongSkill',
    check: async (playerId) => {
      const player = await Player.findById(playerId).select('skills').lean();
      if (!player?.skills) return { earned: false, progress: { current: 0, target: 1 } };
      const skills = Object.values(player.skills);
      const atLevel = skills.filter((s) => (s?.score || 0) >= 5).length;
      return { earned: atLevel >= 1, progress: { current: Math.min(atLevel, 1), target: 1 } };
    },
  },
  {
    slug: 'all-rounder',
    name: 'Wszechstronny',
    description: '4 umiejetnosci na poziomie Cwiczy lub wyzej',
    category: 'skills',
    icon: 'allRounder',
    check: async (playerId) => {
      const player = await Player.findById(playerId).select('skills').lean();
      if (!player?.skills) return { earned: false, progress: { current: 0, target: 4 } };
      const skills = Object.values(player.skills);
      const atLevel = skills.filter((s) => (s?.score || 0) >= 3).length;
      return { earned: atLevel >= 4, progress: { current: Math.min(atLevel, 4), target: 4 } };
    },
  },

  // ── TURNIEJOWE I SPECJALNE ──
  {
    slug: 'tournament-debut',
    name: 'Debiut Turniejowy',
    description: 'Wez udzial w pierwszym turnieju',
    category: 'tournament',
    icon: 'tournamentDebut',
    check: async (playerId) => {
      const count = await Tournament.countDocuments({
        player: playerId,
        status: { $in: ['completed', 'in-progress'] },
      });
      return { earned: count >= 1, progress: { current: Math.min(count, 1), target: 1 } };
    },
  },
  {
    slug: 'winner',
    name: 'Zwyciezca',
    description: 'Wygraj mecz w turnieju',
    category: 'tournament',
    icon: 'winner',
    check: async (playerId) => {
      const tournaments = await Tournament.find({
        player: playerId,
        status: 'completed',
        'result.wins': { $gte: 1 },
      }).lean();
      return { earned: tournaments.length >= 1, progress: { current: Math.min(tournaments.length, 1), target: 1 } };
    },
  },
  {
    slug: 'court-traveler',
    name: 'Kortowy Podroznik',
    description: 'Graj na 3 roznych nawierzchniach',
    category: 'tournament',
    icon: 'courtTraveler',
    check: async (playerId) => {
      const sessions = await Session.find({ player: playerId, surface: { $ne: '' } })
        .select('surface')
        .lean();
      const surfaces = new Set(sessions.map((s) => s.surface));
      return { earned: surfaces.size >= 3, progress: { current: Math.min(surfaces.size, 3), target: 3 } };
    },
  },
  {
    slug: 'goal-achieved',
    name: 'Cel Osiagniety',
    description: 'Ukoncz pierwszy cel rozwojowy',
    category: 'special',
    icon: 'goalAchieved',
    check: async (playerId) => {
      const count = await DevelopmentGoal.countDocuments({ player: playerId, status: 'completed' });
      return { earned: count >= 1, progress: { current: Math.min(count, 1), target: 1 } };
    },
  },
  {
    slug: 'three-goals',
    name: 'Trzy Cele',
    description: 'Ukoncz 3 cele rozwojowe',
    category: 'special',
    icon: 'threeGoals',
    check: async (playerId) => {
      const count = await DevelopmentGoal.countDocuments({ player: playerId, status: 'completed' });
      return { earned: count >= 3, progress: { current: Math.min(count, 3), target: 3 } };
    },
  },
];

/**
 * ISO week number helper
 */
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

/**
 * Evaluate all badges for a player.
 * Awards new badges and sends notifications for newly earned ones.
 * Returns full badge status list.
 */
export async function evaluateBadges(playerId, parentIds = []) {
  const existing = await PlayerBadge.find({ player: playerId }).lean();
  const earnedSlugs = new Set(existing.map((b) => b.badgeSlug));

  const results = [];
  const newlyEarned = [];

  for (const def of BADGE_DEFINITIONS) {
    if (earnedSlugs.has(def.slug)) {
      results.push({
        ...def,
        earned: true,
        earnedAt: existing.find((b) => b.badgeSlug === def.slug)?.earnedAt,
        progress: { current: def.slug === 'training-machine' ? 50 : 1, target: 1 },
      });
      continue;
    }

    const { earned, progress } = await def.check(playerId);

    if (earned) {
      try {
        await PlayerBadge.create({ player: playerId, badgeSlug: def.slug });
        newlyEarned.push(def);
      } catch (err) {
        // Duplicate key — already exists, ignore
        if (err.code !== 11000) throw err;
      }
    }

    results.push({
      slug: def.slug,
      name: def.name,
      description: def.description,
      category: def.category,
      icon: def.icon,
      earned,
      earnedAt: earned ? new Date() : null,
      progress,
    });
  }

  // Send notifications for newly earned badges
  for (const badge of newlyEarned) {
    for (const parentId of parentIds) {
      await Notification.create({
        user: parentId,
        type: 'system',
        title: 'Nowa odznaka!',
        body: `${badge.name} — ${badge.description}`,
        severity: 'info',
        player: playerId,
        actionUrl: `/parent/child/${playerId}`,
      });
    }
  }

  return results;
}

/**
 * Get badge status for a player (read-only, no evaluation).
 */
export async function getBadgeStatus(playerId) {
  const existing = await PlayerBadge.find({ player: playerId }).lean();
  const earnedSlugs = new Set(existing.map((b) => b.badgeSlug));

  const results = [];

  for (const def of BADGE_DEFINITIONS) {
    if (earnedSlugs.has(def.slug)) {
      results.push({
        slug: def.slug,
        name: def.name,
        description: def.description,
        category: def.category,
        icon: def.icon,
        earned: true,
        earnedAt: existing.find((b) => b.badgeSlug === def.slug)?.earnedAt,
        progress: null,
      });
    } else {
      const { earned, progress } = await def.check(playerId);
      results.push({
        slug: def.slug,
        name: def.name,
        description: def.description,
        category: def.category,
        icon: def.icon,
        earned,
        earnedAt: null,
        progress,
      });
    }
  }

  return results;
}
```

- [ ] **Step 2: Verify module loads**

Run: `node -e "import('./server/src/services/badgeEngine.js').then(m => console.log(m.BADGE_DEFINITIONS.length + ' badges defined')).catch(e => console.error(e.message))"`
Expected: `15 badges defined`

- [ ] **Step 3: Commit**

```bash
git add server/src/services/badgeEngine.js
git commit -m "feat: add badge engine with 15 badge definitions and evaluation logic"
```

---

### Task 3: Badge API Route + Controller

**Files:**
- Create: `server/src/controllers/badgeController.js`
- Create: `server/src/routes/badges.js`
- Modify: `server/src/index.js`

- [ ] **Step 1: Create badge controller**

```js
// server/src/controllers/badgeController.js
import { getBadgeStatus, evaluateBadges } from '../services/badgeEngine.js';
import Player from '../models/Player.js';

/**
 * GET /api/badges/:playerId
 * Returns all badge statuses for a player.
 * Parents see their children's badges, coaches see their players' badges.
 */
export const getPlayerBadges = async (req, res, next) => {
  try {
    const { playerId } = req.params;

    const player = await Player.findById(playerId).select('parents coaches coach').lean();
    if (!player) {
      return res.status(404).json({ message: 'Gracz nie znaleziony' });
    }

    // Authorization: parent of player, or coach of player, or clubAdmin
    const userId = req.user._id.toString();
    const isParent = (player.parents || []).map(String).includes(userId);
    const isCoach = player.coach?.toString() === userId ||
      (player.coaches || []).map(String).includes(userId);
    const isAdmin = req.user.role === 'clubAdmin';

    if (!isParent && !isCoach && !isAdmin) {
      return res.status(403).json({ message: 'Brak dostepu' });
    }

    const badges = await getBadgeStatus(playerId);
    res.json({ badges });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/badges/:playerId/evaluate
 * Force-evaluate badges (used by badge engine triggers, also callable manually).
 */
export const evaluatePlayerBadges = async (req, res, next) => {
  try {
    const { playerId } = req.params;

    const player = await Player.findById(playerId).select('parents').lean();
    if (!player) {
      return res.status(404).json({ message: 'Gracz nie znaleziony' });
    }

    const parentIds = (player.parents || []).map(String);
    const badges = await evaluateBadges(playerId, parentIds);
    res.json({ badges });
  } catch (error) {
    next(error);
  }
};
```

- [ ] **Step 2: Create badges route**

```js
// server/src/routes/badges.js
import { Router } from 'express';
import { getPlayerBadges, evaluatePlayerBadges } from '../controllers/badgeController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.use(verifyToken);

router.get('/:playerId', getPlayerBadges);
router.post('/:playerId/evaluate', evaluatePlayerBadges);

export default router;
```

- [ ] **Step 3: Mount route in server/src/index.js**

Add alongside existing route imports:

```js
import badgeRoutes from './routes/badges.js';
```

Add alongside existing route mounts (after other `/api/` routes):

```js
app.use('/api/badges', badgeRoutes);
```

- [ ] **Step 4: Verify server starts**

Run: `cd server && npm run dev` (check for no import errors, kill after startup)

- [ ] **Step 5: Commit**

```bash
git add server/src/controllers/badgeController.js server/src/routes/badges.js server/src/index.js
git commit -m "feat: add badges API endpoints"
```

---

### Task 4: Hook Badge Evaluation into Session Creation

**Files:**
- Modify: `server/src/controllers/sessionController.js:105-180` (createSession)

- [ ] **Step 1: Add import at top of sessionController.js**

Add after the existing imports:

```js
import { evaluateBadges } from '../services/badgeEngine.js';
```

- [ ] **Step 2: Add badge evaluation after session creation**

In `createSession`, after the notification loop (around line 167, before `const populatedSession`), add:

```js
    // Evaluate badges after new session
    const parentIds = (player.parents || []).map(String);
    evaluateBadges(player._id, parentIds).catch(() => {});
```

Note: fire-and-forget (`.catch(() => {})`) so badge evaluation doesn't slow down the response.

- [ ] **Step 3: Also add badge eval after skill updates in updateSession**

In `updateSession`, after `await session.save();` and the skill update block (around line 255), add:

```js
    // Evaluate badges after skill changes
    const playerForBadges = await Player.findById(session.player).select('parents').lean();
    if (playerForBadges) {
      const parentIds = (playerForBadges.parents || []).map(String);
      evaluateBadges(session.player, parentIds).catch(() => {});
    }
```

- [ ] **Step 4: Commit**

```bash
git add server/src/controllers/sessionController.js
git commit -m "feat: trigger badge evaluation on session create/update"
```

---

### Task 5: SVG Badge Icons Component

**Files:**
- Create: `client/src/components/badges/BadgeIcon.jsx`

- [ ] **Step 1: Create BadgeIcon.jsx with all 15 SVG badge icons**

Each badge is a 64x64 SVG with a circular background, icon graphic, and consistent style. The `earned` prop controls whether it's colorful or grayed out.

```jsx
// client/src/components/badges/BadgeIcon.jsx

const BADGE_COLORS = {
  training: { bg: '#3B82F6', accent: '#60A5FA', ring: '#2563EB' },
  skills: { bg: '#8B5CF6', accent: '#A78BFA', ring: '#7C3AED' },
  tournament: { bg: '#EF4444', accent: '#F87171', ring: '#DC2626' },
  special: { bg: '#F59E0B', accent: '#FBBF24', ring: '#D97706' },
}

const GRAY = { bg: '#374151', accent: '#4B5563', ring: '#1F2937' }

function BadgeShell({ category, earned, children, size = 64 }) {
  const c = earned ? BADGE_COLORS[category] || BADGE_COLORS.training : GRAY

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer ring */}
      <circle cx="32" cy="32" r="30" stroke={c.ring} strokeWidth="2" fill="none" opacity={earned ? 1 : 0.4} />
      {/* Background circle */}
      <circle cx="32" cy="32" r="27" fill={c.bg} opacity={earned ? 1 : 0.15} />
      {/* Inner highlight */}
      <circle cx="32" cy="26" r="18" fill={c.accent} opacity={earned ? 0.2 : 0.05} />
      {/* Icon content */}
      <g opacity={earned ? 1 : 0.3}>
        {children}
      </g>
      {/* Shine effect when earned */}
      {earned && (
        <circle cx="22" cy="20" r="6" fill="white" opacity="0.15" />
      )}
    </svg>
  )
}

// ── Training badges ──

function FirstSession({ earned, size }) {
  return (
    <BadgeShell category="training" earned={earned} size={size}>
      {/* Tennis ball */}
      <circle cx="32" cy="32" r="10" fill="#CDFF50" stroke="#A3CC40" strokeWidth="1.5" />
      <path d="M25 26c4 4 10 4 14 0" stroke="#A3CC40" strokeWidth="1.5" fill="none" />
      <path d="M25 38c4-4 10-4 14 0" stroke="#A3CC40" strokeWidth="1.5" fill="none" />
    </BadgeShell>
  )
}

function RegularPlayer({ earned, size }) {
  return (
    <BadgeShell category="training" earned={earned} size={size}>
      {/* Racket */}
      <ellipse cx="30" cy="27" rx="8" ry="10" stroke="white" strokeWidth="2" fill="none" />
      <line x1="30" y1="37" x2="34" y2="46" stroke="white" strokeWidth="2" strokeLinecap="round" />
      {/* "10" text */}
      <text x="30" y="31" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">10</text>
    </BadgeShell>
  )
}

function TrainingMachine({ earned, size }) {
  return (
    <BadgeShell category="training" earned={earned} size={size}>
      {/* Gear/cog */}
      <circle cx="32" cy="32" r="6" stroke="white" strokeWidth="2" fill="none" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180
        const x1 = 32 + Math.cos(rad) * 8
        const y1 = 32 + Math.sin(rad) * 8
        const x2 = 32 + Math.cos(rad) * 11
        const y2 = 32 + Math.sin(rad) * 11
        return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="2" strokeLinecap="round" />
      })}
      <text x="32" y="35" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">50</text>
    </BadgeShell>
  )
}

function WeeklyStreak({ earned, size }) {
  return (
    <BadgeShell category="training" earned={earned} size={size}>
      {/* Calendar with 3 checks */}
      <rect x="22" y="22" width="20" height="18" rx="2" stroke="white" strokeWidth="1.5" fill="none" />
      <line x1="22" y1="27" x2="42" y2="27" stroke="white" strokeWidth="1.5" />
      {/* 3 checkmarks */}
      <path d="M26 32l2 2 3-4" stroke="#CDFF50" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M31 32l2 2 3-4" stroke="#CDFF50" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M36 32l2 2 3-4" stroke="#CDFF50" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </BadgeShell>
  )
}

function StreakMaster({ earned, size }) {
  return (
    <BadgeShell category="training" earned={earned} size={size}>
      {/* Fire/flame */}
      <path
        d="M32 20c0 0-8 8-8 15c0 5 3.5 8 8 8s8-3 8-8c0-7-8-15-8-15z"
        fill={earned ? '#FBBF24' : 'white'}
        opacity={earned ? 0.9 : 0.6}
      />
      <path
        d="M32 28c0 0-4 4-4 8c0 2.5 1.8 4 4 4s4-1.5 4-4c0-4-4-8-4-8z"
        fill={earned ? '#EF4444' : 'white'}
        opacity={earned ? 0.8 : 0.4}
      />
    </BadgeShell>
  )
}

// ── Skill badges ──

function FirstStep({ earned, size }) {
  return (
    <BadgeShell category="skills" earned={earned} size={size}>
      {/* Footstep / shoe print */}
      <path d="M28 38c-2-8 0-14 4-16c4 2 6 8 4 16" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="30" cy="24" r="2" fill="white" />
    </BadgeShell>
  )
}

function Practitioner({ earned, size }) {
  return (
    <BadgeShell category="skills" earned={earned} size={size}>
      {/* Repeat/loop arrows */}
      <path d="M24 30a8 8 0 0 1 14-4" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M40 34a8 8 0 0 1-14 4" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
      <polygon points="38,24 40,28 36,28" fill="white" />
      <polygon points="26,40 24,36 28,36" fill="white" />
    </BadgeShell>
  )
}

function StablePlayer({ earned, size }) {
  return (
    <BadgeShell category="skills" earned={earned} size={size}>
      {/* Shield */}
      <path
        d="M32 22l-10 4v8c0 6 4 10 10 12c6-2 10-6 10-12v-8l-10-4z"
        stroke="white" strokeWidth="2" fill="none"
      />
      <path d="M28 33l3 3 6-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </BadgeShell>
  )
}

function StrongSkill({ earned, size }) {
  return (
    <BadgeShell category="skills" earned={earned} size={size}>
      {/* Lightning bolt */}
      <path
        d="M34 20l-6 14h6l-2 12 8-16h-6l4-10z"
        fill={earned ? '#FBBF24' : 'white'}
        stroke={earned ? '#F59E0B' : 'white'}
        strokeWidth="1"
        opacity={earned ? 1 : 0.6}
      />
    </BadgeShell>
  )
}

function AllRounder({ earned, size }) {
  return (
    <BadgeShell category="skills" earned={earned} size={size}>
      {/* 4-pointed star / compass */}
      <path
        d="M32 20l3 9 9 3-9 3-3 9-3-9-9-3 9-3z"
        fill={earned ? '#A78BFA' : 'white'}
        stroke="white"
        strokeWidth="1.5"
        opacity={earned ? 0.9 : 0.5}
      />
    </BadgeShell>
  )
}

// ── Tournament & Special badges ──

function TournamentDebut({ earned, size }) {
  return (
    <BadgeShell category="tournament" earned={earned} size={size}>
      {/* Trophy */}
      <path d="M26 24h12v6c0 4-2.5 7-6 8c-3.5-1-6-4-6-8v-6z" stroke="white" strokeWidth="2" fill="none" />
      <line x1="32" y1="38" x2="32" y2="42" stroke="white" strokeWidth="2" />
      <line x1="28" y1="42" x2="36" y2="42" stroke="white" strokeWidth="2" strokeLinecap="round" />
      {/* Handles */}
      <path d="M26 26c-3 0-5 2-5 4s2 4 5 4" stroke="white" strokeWidth="1.5" fill="none" />
      <path d="M38 26c3 0 5 2 5 4s-2 4-5 4" stroke="white" strokeWidth="1.5" fill="none" />
    </BadgeShell>
  )
}

function Winner({ earned, size }) {
  return (
    <BadgeShell category="tournament" earned={earned} size={size}>
      {/* Medal with star */}
      <circle cx="32" cy="34" r="8" stroke="white" strokeWidth="2" fill="none" />
      <path d="M32 28l1.5 3 3.5 0.5-2.5 2.5 0.5 3.5-3-1.5-3 1.5 0.5-3.5-2.5-2.5 3.5-0.5z" fill="white" />
      {/* Ribbon */}
      <line x1="28" y1="22" x2="30" y2="28" stroke="white" strokeWidth="2" />
      <line x1="36" y1="22" x2="34" y2="28" stroke="white" strokeWidth="2" />
    </BadgeShell>
  )
}

function CourtTraveler({ earned, size }) {
  return (
    <BadgeShell category="tournament" earned={earned} size={size}>
      {/* Globe / compass */}
      <circle cx="32" cy="32" r="10" stroke="white" strokeWidth="2" fill="none" />
      <ellipse cx="32" cy="32" rx="5" ry="10" stroke="white" strokeWidth="1" fill="none" />
      <line x1="22" y1="32" x2="42" y2="32" stroke="white" strokeWidth="1" />
      <line x1="32" y1="22" x2="32" y2="42" stroke="white" strokeWidth="1" />
    </BadgeShell>
  )
}

function GoalAchieved({ earned, size }) {
  return (
    <BadgeShell category="special" earned={earned} size={size}>
      {/* Target with arrow */}
      <circle cx="32" cy="32" r="10" stroke="white" strokeWidth="1.5" fill="none" />
      <circle cx="32" cy="32" r="6" stroke="white" strokeWidth="1.5" fill="none" />
      <circle cx="32" cy="32" r="2" fill="white" />
      {/* Arrow */}
      <line x1="40" y1="24" x2="34" y2="30" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <polyline points="37,24 40,24 40,27" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </BadgeShell>
  )
}

function ThreeGoals({ earned, size }) {
  return (
    <BadgeShell category="special" earned={earned} size={size}>
      {/* 3 targets stacked */}
      <circle cx="26" cy="30" r="5" stroke="white" strokeWidth="1.5" fill="none" />
      <circle cx="26" cy="30" r="2" fill="white" />
      <circle cx="38" cy="30" r="5" stroke="white" strokeWidth="1.5" fill="none" />
      <circle cx="38" cy="30" r="2" fill="white" />
      <circle cx="32" cy="38" r="5" stroke="white" strokeWidth="1.5" fill="none" />
      <circle cx="32" cy="38" r="2" fill="white" />
    </BadgeShell>
  )
}

// ── Map slug → component ──

const BADGE_COMPONENTS = {
  firstSession: FirstSession,
  regularPlayer: RegularPlayer,
  trainingMachine: TrainingMachine,
  weeklyStreak: WeeklyStreak,
  streakMaster: StreakMaster,
  firstStep: FirstStep,
  practitioner: Practitioner,
  stablePlayer: StablePlayer,
  strongSkill: StrongSkill,
  allRounder: AllRounder,
  tournamentDebut: TournamentDebut,
  winner: Winner,
  courtTraveler: CourtTraveler,
  goalAchieved: GoalAchieved,
  threeGoals: ThreeGoals,
}

export default function BadgeIcon({ icon, earned = false, size = 64 }) {
  const Component = BADGE_COMPONENTS[icon]
  if (!Component) return null
  return <Component earned={earned} size={size} />
}

export { BADGE_COMPONENTS }
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/badges/BadgeIcon.jsx
git commit -m "feat: add 15 SVG badge icon components"
```

---

### Task 6: BadgeGrid Component + CSS

**Files:**
- Create: `client/src/components/badges/BadgeGrid.jsx`
- Create: `client/src/components/badges/BadgeGrid.css`

- [ ] **Step 1: Create BadgeGrid.css**

```css
/* ─── Badge Grid ─── */
.badge-grid-section {
  background: var(--color-surface, #fff);
  border-radius: 12px;
  border: 1px solid var(--color-border, #e5e7eb);
  padding: 1.25rem;
  margin-top: 1.25rem;
}

.badge-grid-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.badge-grid-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 16px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  margin: 0;
}

.badge-grid-title svg {
  color: var(--color-accent);
}

.badge-grid-count {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-left: auto;
}

.badge-grid-category {
  margin-bottom: 1rem;
}

.badge-grid-category:last-child {
  margin-bottom: 0;
}

.badge-grid-category-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-tertiary);
  margin-bottom: 0.5rem;
}

.badge-grid-items {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.badge-grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 80px;
  cursor: default;
  position: relative;
}

.badge-grid-item-icon {
  position: relative;
}

.badge-grid-item-name {
  font-size: 10px;
  font-weight: 600;
  text-align: center;
  color: var(--color-text-secondary);
  line-height: 1.2;
}

.badge-grid-item.locked .badge-grid-item-name {
  color: var(--color-text-tertiary);
}

.badge-grid-progress {
  width: 48px;
  height: 3px;
  background: var(--color-bg-tertiary);
  border-radius: 2px;
  overflow: hidden;
}

.badge-grid-progress-fill {
  height: 100%;
  border-radius: 2px;
  background: var(--color-accent);
  transition: width 0.3s ease;
}

/* Tooltip on hover */
.badge-grid-tooltip {
  display: none;
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 8px 12px;
  min-width: 140px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 10;
  pointer-events: none;
}

.badge-grid-item:hover .badge-grid-tooltip {
  display: block;
}

.badge-grid-tooltip-name {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 2px;
}

.badge-grid-tooltip-desc {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.badge-grid-tooltip-date {
  font-size: 10px;
  color: var(--color-accent);
  margin-top: 4px;
}

/* Earned animation */
@keyframes badgeEarned {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.badge-grid-item.earned .badge-grid-item-icon {
  animation: badgeEarned 0.5s ease;
}

@media (max-width: 480px) {
  .badge-grid-items {
    gap: 8px;
  }
  .badge-grid-item {
    width: 68px;
  }
}
```

- [ ] **Step 2: Create BadgeGrid.jsx**

```jsx
// client/src/components/badges/BadgeGrid.jsx
import { useState, useEffect } from 'react'
import { Award } from 'lucide-react'
import api from '../../api/axios'
import BadgeIcon from './BadgeIcon'
import './BadgeGrid.css'

const CATEGORY_LABELS = {
  training: 'Treningowe',
  skills: 'Umiejetnosci',
  tournament: 'Turniejowe',
  special: 'Specjalne',
}

const CATEGORY_ORDER = ['training', 'skills', 'tournament', 'special']

export default function BadgeGrid({ playerId }) {
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!playerId) return
    const fetchBadges = async () => {
      try {
        setLoading(true)
        const { data } = await api.get(`/badges/${playerId}`)
        setBadges(data.badges || [])
      } catch {
        setBadges([])
      } finally {
        setLoading(false)
      }
    }
    fetchBadges()
  }, [playerId])

  if (loading) return null

  const earnedCount = badges.filter((b) => b.earned).length
  const totalCount = badges.length

  // Group by category
  const grouped = {}
  for (const badge of badges) {
    if (!grouped[badge.category]) grouped[badge.category] = []
    grouped[badge.category].push(badge)
  }

  return (
    <div className="badge-grid-section">
      <div className="badge-grid-header">
        <h2 className="badge-grid-title">
          <Award size={16} style={{ color: 'var(--color-accent)', marginRight: 6, verticalAlign: 'middle' }} />
          Odznaki
        </h2>
        <span className="badge-grid-count">
          {earnedCount} / {totalCount}
        </span>
      </div>

      {CATEGORY_ORDER.map((cat) => {
        const items = grouped[cat]
        if (!items || items.length === 0) return null

        return (
          <div key={cat} className="badge-grid-category">
            <div className="badge-grid-category-label">
              {CATEGORY_LABELS[cat]}
            </div>
            <div className="badge-grid-items">
              {items.map((badge) => (
                <div
                  key={badge.slug}
                  className={`badge-grid-item ${badge.earned ? 'earned' : 'locked'}`}
                >
                  <div className="badge-grid-item-icon">
                    <BadgeIcon icon={badge.icon} earned={badge.earned} size={56} />
                  </div>
                  <span className="badge-grid-item-name">{badge.name}</span>

                  {!badge.earned && badge.progress && badge.progress.target > 1 && (
                    <div className="badge-grid-progress">
                      <div
                        className="badge-grid-progress-fill"
                        style={{ width: `${(badge.progress.current / badge.progress.target) * 100}%` }}
                      />
                    </div>
                  )}

                  {/* Tooltip */}
                  <div className="badge-grid-tooltip">
                    <div className="badge-grid-tooltip-name">{badge.name}</div>
                    <div className="badge-grid-tooltip-desc">{badge.description}</div>
                    {badge.earned && badge.earnedAt && (
                      <div className="badge-grid-tooltip-date">
                        Zdobyta: {new Date(badge.earnedAt).toLocaleDateString('pl-PL')}
                      </div>
                    )}
                    {!badge.earned && badge.progress && (
                      <div className="badge-grid-tooltip-date">
                        Postep: {badge.progress.current} / {badge.progress.target}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/badges/BadgeGrid.jsx client/src/components/badges/BadgeGrid.css
git commit -m "feat: add BadgeGrid component with category grouping and progress indicators"
```

---

### Task 7: Integrate BadgeGrid into ChildProfile

**Files:**
- Modify: `client/src/pages/parent/ChildProfile.jsx`

- [ ] **Step 1: Add import at top of ChildProfile.jsx**

Add after the existing imports (after the `import './ChildProfile.css'` line):

```jsx
import BadgeGrid from '../../components/badges/BadgeGrid'
```

- [ ] **Step 2: Add BadgeGrid section between PathwayStepper and PlayerJourney**

In the JSX return, after `<PathwayStepper ... />` and before `<PlayerJourney ... />`, add:

```jsx
      {/* Badges / Gamification */}
      <BadgeGrid playerId={child._id} />
```

- [ ] **Step 3: Verify the page renders**

Run dev server, navigate to a parent's child profile and verify the badge grid appears.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/parent/ChildProfile.jsx
git commit -m "feat: add badge grid section to ChildProfile page"
```

---

### Task 8: Seed Data for Badges

**Files:**
- Modify: `server/src/scripts/seed.js`

- [ ] **Step 1: Read the current seed.js to understand the structure**

Read the file and find where players are created, and how the seed script ends.

- [ ] **Step 2: Add PlayerBadge import and seed data**

Add import at top:

```js
import PlayerBadge from '../models/PlayerBadge.js';
```

Add cleanup to the existing cleanup section:

```js
await PlayerBadge.deleteMany({});
```

At the end, after players/sessions are created, add badge seeding for the demo players:

```js
// ── Seed badges ──
// Give first player some earned badges for demo
const firstPlayer = createdPlayers[0]; // or however the seed references players
if (firstPlayer) {
  await PlayerBadge.insertMany([
    { player: firstPlayer._id, badgeSlug: 'first-session', earnedAt: new Date('2026-03-01') },
    { player: firstPlayer._id, badgeSlug: 'regular-player', earnedAt: new Date('2026-03-15') },
    { player: firstPlayer._id, badgeSlug: 'weekly-streak', earnedAt: new Date('2026-03-20') },
    { player: firstPlayer._id, badgeSlug: 'first-step', earnedAt: new Date('2026-03-10') },
    { player: firstPlayer._id, badgeSlug: 'practitioner', earnedAt: new Date('2026-03-25') },
    { player: firstPlayer._id, badgeSlug: 'tournament-debut', earnedAt: new Date('2026-04-01') },
  ]);
  console.log('  ✓ Badges seeded for', firstPlayer.firstName);
}
```

Note: The exact variable names for players will depend on the current seed.js structure. Read the file first and adapt accordingly.

- [ ] **Step 3: Run seed to verify**

Run: `cd server && npm run seed`
Expected: No errors, "Badges seeded" message appears.

- [ ] **Step 4: Commit**

```bash
git add server/src/scripts/seed.js
git commit -m "feat: add badge seed data for demo players"
```

---

### Task 9: Final Integration Test + Polish

**Files:** No new files — verify everything works end-to-end.

- [ ] **Step 1: Run seed data**

```bash
cd server && npm run seed
```

- [ ] **Step 2: Start dev server**

```bash
npm run dev
```

- [ ] **Step 3: Manual verification checklist**

1. Login as parent@serveiq.pl (password123)
2. Navigate to child profile
3. Verify badge grid appears below PathwayStepper
4. Verify earned badges show colorful SVGs (6 should be earned from seed)
5. Verify unearned badges show grayed-out icons
6. Verify progress bars appear on multi-step unearned badges
7. Verify hover tooltips work
8. Check responsive layout on narrow viewport

- [ ] **Step 4: Final commit with any polish fixes**

```bash
git add -A
git commit -m "fix: polish badge grid display and responsive layout"
```
