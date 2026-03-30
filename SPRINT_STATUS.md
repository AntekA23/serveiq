# Sprint — 2026-03-30

## Sprint Goal
Rebuild Training Plan + enable Coach Panel + polish parent UX

## All Tasks Completed

### 1. Training Plan Rebuild (user request)
- [x] Backend: `weeklySchedule` in Player model (planned sessions per day: type, duration, time, notes)
- [x] Backend: API auto-derives `scheduledDays` + `weeklyGoal` from schedule
- [x] Frontend: PlanTab rebuilt as interactive weekly schedule builder
- [x] Frontend: Overview banner (total sessions, hours, active days, save state)
- [x] Frontend: CalendarTab shows planned sessions as ghost items (dashed border + "plan" badge)
- [x] Frontend: WeeklySummary shows adherence tracking (actual/planned, per-type breakdown)
- [x] Frontend: WeekList shows "X/Y z planu" + ghost planned entries for empty days
- [x] Frontend: MonthGrid shows planned sessions in day detail view
- [x] Seed: Kacper has 7-session weekly schedule + milestones + focus areas

### 2. Coach Panel (6 new pages)
- [x] **CoachDashboard** — 4 stat cards, player list with skill bars, recent sessions
- [x] **CoachPlayers** — search, skill chips, rankings, parent info
- [x] **CoachPlayerProfile** — 3 tabs (skills with slider editing, session history, goals)
- [x] **CoachSessions** — month nav, player filter, grouped by date
- [x] **CoachNewSession** — full form with skill updates + visibility toggle
- [x] **CoachNewPlayer** — name, DOB, gender, rate, parent invite email
- [x] **Sidebar** — role-based nav (coach: Dashboard, Players, Sessions, Messages, Settings)
- [x] **Routing** — 9 coach routes, CoachDisabled removed
- [x] **Coach.css** — complete responsive stylesheet

### 3. Parent UX Polish
- [x] Dashboard PlanPreview shows weekly schedule breakdown (days + types)
- [x] ChildProfile shows "Recent Sessions" section (last 5 with type, date, time, coach badge)
- [x] Timeline enhanced: shows training sessions + filters by type + grouped by month
- [x] Timeline backend: returns session events alongside skill updates
- [x] Seed: richer data (session types/surfaces/times, coach-parent messages, 2 tournaments, onboarding complete)

## Quality Gates
- [x] `vite build` — 0 errors (3.8s)
- [x] Server modules parse correctly
- [x] No broken imports
- [x] Existing conventions followed (Polish UI, camelCase, Bebas Neue headings)
- [x] Responsive CSS for all new components

## Files Changed

### New (7 files):
- `client/src/pages/coach/CoachDashboard.jsx`
- `client/src/pages/coach/CoachPlayers.jsx`
- `client/src/pages/coach/CoachPlayerProfile.jsx`
- `client/src/pages/coach/CoachSessions.jsx`
- `client/src/pages/coach/CoachNewSession.jsx`
- `client/src/pages/coach/CoachNewPlayer.jsx`
- `client/src/pages/coach/Coach.css`

### Modified (16 files):
- `server/src/models/Player.js` — weeklySchedule schema
- `server/src/controllers/playerController.js` — weeklySchedule CRUD + auto-derive
- `server/src/controllers/healthController.js` — timeline includes sessions
- `server/src/scripts/seed.js` — rich demo data
- `client/src/App.jsx` — coach routes
- `client/src/components/layout/Sidebar/Sidebar.jsx` — role-based nav
- `client/src/pages/parent/training-plan/PlanTab.jsx` — rebuilt
- `client/src/pages/parent/training-plan/CalendarTab.jsx` — planned sessions
- `client/src/pages/parent/training-plan/WeekList.jsx` — ghost items + adherence
- `client/src/pages/parent/training-plan/WeeklySummary.jsx` — adherence tracking
- `client/src/pages/parent/training-plan/MonthGrid.jsx` — planned in detail view
- `client/src/pages/parent/TrainingPlan.css` — schedule builder styles
- `client/src/pages/parent/Dashboard.jsx` — schedule preview
- `client/src/pages/parent/Dashboard.css` — schedule styles
- `client/src/pages/parent/ChildProfile.jsx` — recent sessions
- `client/src/pages/parent/ChildProfile.css` — session row styles
- `client/src/pages/parent/Timeline.jsx` — rebuilt with filters + grouping
- `client/src/pages/parent/Timeline.css` — filter + group styles

### Config (2 files):
- `CLAUDE.md` — created
- `SPRINT_STATUS.md` — created

## Setup Steps
1. `npm run install:all`
2. Create `.env` with `MONGO_URL`
3. `npm run seed`
4. `npm run dev`
5. Coach: coach@serveiq.pl / password123
6. Parent: parent@serveiq.pl / password123

## Suggested Next Sprint
1. Coach session editing
2. Coach payments/invoicing UI
3. Reviews & recommendations (coach → parent)
4. Progress visualization (skill charts over time)
5. Mobile responsive polish
6. E2E testing
