# ServeIQ — Single Source of Truth

> **This file is the ONLY project document.** It describes what ServeIQ *actually is* today,
> not what it was once planned to be. If reality and this file ever disagree, fix this file.
> Verified against the codebase on **2026-06-03**.
>
> All previous docs (STRATEGY.md, REAL_FEATURES_PLAN.md, SPRINT_STATUS.md, STAN_APLIKACJI.txt,
> docs/roadmap.md, docs/superpowers/**) were stale or contradictory and have been removed.
> Their still-valid essence is folded into this file.

---

## 1. What ServeIQ is

ServeIQ is a **junior tennis development operating system for clubs**.

- **Core loop:** `Plan → Communicate → Monitor → Review → Recommend next step`
- **Commercial wedge:** Tennis 10 / junior club growth and pathway continuity (kids 8–16).
- **Architectural moat:** the same workflow scales up to an advanced-player support team
  (the "Sonia" scenario — head coach + fitness + mental + physio around one player).
- **Guiding principle:** *Sell the simple story (Tennis 10). Build the stronger spine (full pathway).*

### Strategic pivot (already reflected in the code)
The project pivoted from a *parent-first wearable-health app* to a *club-first development OS*.
The codebase has followed: it now has `clubAdmin` role, Clubs, Groups, generic Activities,
Observations, Development Goals, Review Summaries, Recommendations, Season Plans, Matches,
Badges and Development Programs. Wearables/health-monitoring still exist in code but are **no
longer the product centre** — treat them as a secondary/legacy feature.

### Two demo scenarios (both seeded, both must keep working)
- **Scenario A — Tennis 10 / Junior club:** club coordinator + coach + parents managing
  ordinary junior players (Kacper, Julia, Antoni).
- **Scenario B — Sonia / Advanced pathway:** one player (Sonia) with a full support team and
  richer planning, proving the model stretches to high performance.

### Commercial frame (for product decisions)
- Buyers, in priority: **club owner → premium family → independent coach**.
- The person who suffers most from chaos is the **club admin / junior coordinator** — saving
  them time is the fastest way to demonstrate value.
- Pricing direction: Academy Pilot (one-off, clubs) · Club Subscription (monthly) ·
  Family Premium (monthly). Stripe exists but billing is **not** the validation priority.
- **Feature gate:** every feature must either (A) make a club owner immediately see Tennis 10 /
  pathway value, or (B) be essential to the shared spine the Sonia pathway needs later.
  If neither → it waits.

---

## 2. Tech stack

| Layer | Technology |
|-------|-----------|
| Backend | Express.js 4.x on Node.js (ESM, `"type": "module"`) |
| Database | MongoDB + Mongoose 8.x |
| Auth | JWT (access + refresh) + bcryptjs + httpOnly cookies + localStorage |
| Real-time | Socket.io 4.x |
| Frontend | React 18.x + Vite 5.x |
| Routing | React Router 6.x |
| State | Zustand |
| HTTP client | Axios (interceptors for token refresh) |
| Validation | Zod (client + server) |
| File upload | Multer → local `/server/uploads` (Cloudinary scaffolded, unused) |
| Payments | Stripe (scaffolded, needs keys) |
| Email | Resend (scaffolded, logs to console in dev) |
| AI | Claude API (`@anthropic-ai/sdk`) — coaching recs + review drafts |
| Security | Helmet, CORS, rate limiting |
| Deploy | Railway via Dockerfile |
| UI language | **Polish** (all user-facing text) |

---

## 3. Roles

The `User.role` enum is: **`coach` · `parent` · `clubAdmin` · `player`**.

| Role | Panel | Notes |
|------|-------|-------|
| `parent` | `/parent/*` | Manages their child's journey, plan, tournaments, payments, chat |
| `coach` | `/coach/*` | Manages players, sessions, reviews, payments; chats with parents |
| `clubAdmin` | `/club/*` | Club dashboard, players, payments, reports, coaches, facility setup |
| `player` | (light) | Exists in the model; minimal dedicated UI in MVP |

---

## 4. Real architecture (verified 2026-06-03)

### Backend — `server/src/`
Everything below is **wired up and mounted** in `server/src/index.js` unless flagged.

**Mounted API routes (24):**
```
/api/auth          /api/players       /api/sessions      /api/payments
/api/tournaments   /api/messages      /api/subscriptions /api/notifications
/api/beta          /api/clubs         /api/groups        /api/activities
/api/goals         /api/observations  /api/reviews       /api/recommendations
/api/timeline      /api/coach-links   /api/badges        /api/development-programs
/api/ai            /api/achievements  /api/matches       /api/season-plans
```
Plus an inline `GET /api/health`.

**Controllers (25):** auth, player, session, payment, tournament, message, subscription,
notification, beta, club, group, activity, goal, observation, review, recommendation,
timeline, coachLink, badge, developmentProgram, ai, achievement, match, seasonPlan,
healthController. *(`healthController.js` is misnamed — it only exports `getTimeline()`,
consumed by the players route. See Tech debt.)*

**Models (20):** User, Player, Session, Tournament, Message, Payment, Club, Group, Activity,
Observation, DevelopmentGoal, Recommendation, Notification, PlayerBadge, DevelopmentProgram,
Achievement, Match, SeasonPlan, BetaSignup, CoachRequest, ReviewSummary.
*(Reviews use **`ReviewSummary.js`**. The old `Review.js` was dead and has been deleted.)*

**Services (7):** emailService (Resend), stripeService, subscriptionService,
aiCoachingService (Claude), alertEngine (wearable alerts), badgeEngine, weeklyEmailService.

**Background jobs (`jobs/index.js` → started at boot):**
- `weeklyRunner.js` — weekly summary email (sends Mon 07:00)
- `trialChecker.js` — trial expiry (24h)
- `stageChecker.js` — development-stage transitions (evaluates Mon 08:00)

**Middleware (4):** `auth.js` (`verifyToken`, `requireRole`), `errorHandler.js`,
`rateLimiter.js`, `subscription.js` (`requireFeature` — defined but currently unused).

**Socket:** `socket/chatHandler.js` — real-time chat + notification push.

**Scripts:** `scripts/seed.js` (demo data), `scripts/seedDevelopmentPrograms.js` (ITF/PZT/TE pathways).

### Frontend — `client/src/`
Routes are defined in `client/src/App.jsx`. Pages live under `pages/<role>/`.

- `pages/auth/` — Login, Register, ForgotPassword, ResetPassword, AcceptInvite
- `pages/parent/` — Dashboard, ChildProfile, Timeline, TrainingPlan, Tournaments, Payments,
  Chat, Onboarding, Settings, Pricing, AddCoach, Team, PaymentSuccess, PaymentCancel
  (+ `training-plan/` and `tournaments/` sub-component folders)
- `pages/coach/` — Dashboard, CoachPlayers, CoachDisabled, CoachRequests, CoachPlayerProfile,
  CoachNewPlayer, CoachSessions, CoachNewSession, CoachEditSession, CoachReviews,
  CoachNewReview, CoachPayments, CoachCalendar, Tournaments, Messages
- `pages/club/` — ClubDashboard, FacilityWizard, ClubSettings, ClubPlayers, ClubPayments,
  ClubReports, CoachesList
- `pages/shared/` — Groups, Activities, Reviews, Timeline, Calendar, MyChildren, BadgePage
- top-level — Landing, NotFound, legal/(Terms, Privacy)

> **Rule:** if you add a page, add its route to `App.jsx` in the same change. Orphan pages
> (components never referenced in `App.jsx`) are how this project accumulated chaos before.

---

## 5. What works vs. what's scaffolded

### Works end-to-end (MongoDB-backed)
Auth (register/login/refresh/reset/invite) · parent onboarding · player management
(skills 0–100, goals, rankings, milestones) · sessions CRUD · tournaments CRUD ·
generic activities · observations · development goals · review summaries (draft→publish,
AI draft) · recommendations · clubs · groups · badges/achievements · season plans · matches ·
real-time chat · notifications · background jobs · avatar upload (local disk) ·
Docker + Railway deploy · seed demo data.

### Scaffolded — needs API keys (code is ready)
- **Stripe** — checkout/webhooks/portal; needs `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs.
- **Resend email** — logs to console in dev; needs `RESEND_API_KEY`.
- **Claude AI** — review drafts + coaching recs; needs `CLAUDE_API_KEY`. Degrades gracefully (503).
- **Cloudinary** — scaffolded; UI currently uses local upload / initials.
- **WHOOP/Garmin** — mock data only; real OAuth not wired (and no longer a product priority).

---

## 6. How to run

```bash
npm run install:all      # installs root + server + client
# create server/.env from .env.example (min: MONGO_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET)
npm run seed             # demo data (see accounts below)
npm run dev              # server (:3001) + client (:5173) concurrently
```

- **Ports:** server `3001`, client `5173`. Vite proxies `/api` and `/socket.io` → `:3001`.
  The server now **defaults to 3001** so dev works even without `PORT` set in `.env`.
- **Production:** Dockerfile sets `NODE_ENV=production` and `PORT=5000`; Railway runs
  `node server/src/index.js` and serves the built client from `client/dist`.

### Demo accounts (all `password123`)
| Email | Role | Who |
|-------|------|-----|
| `coach@serveiq.pl` | coach | Main coach (Tennis 10 scenario) |
| `parent@serveiq.pl` | parent | Parent of Kacper / Antoni |
| `parent2@serveiq.pl` | parent | Parent of Julia |
| `parent3@serveiq.pl` | parent | Anna Antczak — parent of **Sonia** |
| `admin@serveiq.pl` | clubAdmin | Club coordinator |
| `coach.head@serveiq.pl` | coach | Marek — Sonia's head coach |
| `coach.fitness@serveiq.pl` | coach | Agnieszka — fitness |
| `coach.mental@serveiq.pl` | coach | dr Paweł — mental |
| `coach.physio@serveiq.pl` | coach | Karolina — physio |

**Dev account switcher:** in `npm run dev` only, a floating "⚡ DEV" widget (bottom-left,
`components/dev/DevAccountSwitcher`) one-click logs in as any seed account via the real auth
flow and routes to that role's dashboard — so you can jump between coach/parent/club without
manually logging out. Gated by `import.meta.env.DEV`, so it never renders in production.
(Tokens already live 7 days / refresh 30 days, so a session itself persists across restarts —
the switcher is purely for hopping between roles.)

---

## 7. Known tech debt / cleanup backlog

Kept visible on purpose — controlled, not hidden.

- **`healthController.js` is misnamed** — it only holds `getTimeline()` used by the players
  route. Fold it into `timelineController`/`playerController` and delete the file.
- **`subscription.js` middleware (`requireFeature`) is unused** — either gate premium features
  with it or remove it.
- **Cloudinary** is half-wired — decide: finish it or drop the env vars + scaffolding.
- **Wearables/health** (alertEngine, mock providers, health charts) are legacy relative to the
  club-first pivot — decide whether to keep as a secondary feature or retire.
- **Socket auth** passes the JWT in the message payload rather than reading the secure cookie.
- **No automated tests / CI** yet.

---

## 8. Code conventions

- Backend controllers: `exports.methodName = async (req, res, next) => { ... }`.
- Routes: `router.get/post/put/delete` guarded by `verifyToken` / `requireRole`.
- Frontend: functional React + hooks; pages under `pages/<role>/`; Zustand stores in `store/`.
- API calls via the configured Axios instance in `client/src/api/axios.js`.
- Validation with Zod on both client and server.
- **All user-facing text in Polish.** camelCase JS, kebab-case CSS classes.
- Follow the patterns already in the file you're editing.

---

## 9. How to work in this repo (operating rules)

- **Keep this file true.** Any change that adds/removes a route, model, role, or major feature
  must update the relevant section here in the same commit.
- Prefer a thin vertical slice that actually works over isolated half-built components.
- Don't reintroduce orphan pages or dead models — wire it up or don't add it.
- Don't rebuild what already works (Section 5). Don't expand scope past the feature gate (Section 1).
- Keep changes small, coherent, and runnable: `npm run dev` must start cleanly,
  `npm run seed` + the demo accounts must keep working.
- Ask before irreversible decisions; otherwise make the call that preserves MVP speed and the
  shared spine, and keep going.

---

## 10. Clarity simplification (in progress)

The product had grown too complex for its users (parents, coaches, club) — too many top-level
nav entries and the same data shown across many overlapping screens. We are simplifying **one
role at a time**, reorganising navigation only (no backend/model changes), reversible.

### Coach — DONE (first pass)
Coach sidebar reduced from **9 → 6** entries: Panel · Kalendarz · Zawodnicy · Wiadomości ·
Płatności · Ustawienia.
- **Kalendarz is the single "time" home.** The three date-based views — Calendar
  (`/coach/calendar`), session list (`/coach/sessions`), tournaments (`/coach/tournaments`) —
  now share a tab strip (`components/coach/TimeTabs`) and only "Kalendarz" appears in the
  sidebar. The three pages are otherwise unchanged.
- **Reviews** (`/coach/reviews`) removed from the sidebar; reached from the player profile
  (the `+ Ocena` button and the per-player review link).
- **Pending parent requests** (`/coach/requests`, previously reachable only by typing the URL)
  now surface as an alert chip on the coach dashboard.
- **Player profile tabbed (2026-06-04):** `CoachPlayerProfile` went from an 11-section scroll to
  four tabs — Przegląd · Plan · Postępy · Oceny — with the dense performance-only sections
  (palmares, coaching team, season, matches, career) tucked under a fifth **Kariera** tab shown
  only for `developmentLevel === 'performance'`. The header (stage selector, +Cel/+AI/+Ocena)
  stays fixed above the tabs.

### Parent — DONE (first pass)
The parent model is now **child-centric**: the child profile is the single hub for everything
about one child, and parent-level concerns live in the sidebar.
- **Płatności** added to the parent sidebar (it was previously unreachable — no nav entry and
  no button anywhere; same for Turnieje).
- **Child hub:** `ChildProfile` gained one clean link row under the hero —
  Plan · Kalendarz · Turnieje · Oceny · Historia · Odznaki — replacing the old bottom
  quick-links and the duplicated per-section "Wszystkie"/"Pełny plan" buttons (Reviews had 4
  entry points, Badges 3; now one each).
- **Child context carries over:** hub links pass `?child=<id>`; TrainingPlan, Tournaments and
  the shared Reviews page now preselect that child instead of always defaulting to the first.
- **Radical pass (2026-06-04):** the separate parent dashboard was removed entirely — the
  child's page (`/parent/child/:id`) is now the home. "Panel" is gone from the sidebar (children
  ARE the nav; switching child = clicking another child). `/parent/dashboard` redirects to the
  first child. `pages/parent/Dashboard.*` deleted; orphan `HealthHistory.css` pruned.

### Club — DONE (first pass)
The club panel's problem was discoverability, not size: two fully-working pages were
reachable only by typing the URL, and a one-time wizard sat in the daily nav.
- **Raporty** (`/club/reports` — retention, attendance, coach activity, pathway distribution)
  **merged into the Panel (2026-06-04):** `ClubReports` gained an `embedded` mode and now
  renders as a "Statystyki klubu" section at the bottom of `ClubDashboard`, so the club has one
  "health" screen. "Raporty" removed from the sidebar (the `/club/reports` route still resolves).
- **Ustawienia klubu** (`/club/settings` — PZT licence, pathway stages, logo, invite code)
  added to the sidebar (was URL-only). Distinct from "Ustawienia" (`/settings`, the admin's
  personal account, which already works and has a Club tab).
- **Infrastruktura** (`FacilityWizard`, a one-time court-setup wizard) removed from the
  permanent nav and linked instead from inside Ustawienia klubu.

All three role panels (coach, parent, club) have now had a first clarity pass. Next natural
step: walk each panel live with seed data and refine wording/ordering from real use.

### Known follow-ups (deferred)
- Dashboard vs ChildProfile overlap — **RESOLVED** (2026-06-04): the separate parent dashboard
  was removed; the child hub is the home.
- No global "selected child" store yet; preselection is via `?child=` query + sidebar nav.
- Minor wearable/health text remnants still in `parent/Timeline.jsx` (health/device event types)
  and onboarding/pricing copy — prune in a later pass.
- See `PLAN_UPROSZCZENIA.md` for the full radical-simplification plan (phases F1–F7).
