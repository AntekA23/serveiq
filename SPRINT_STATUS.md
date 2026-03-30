# Sprint — 2026-03-30

## Sprint Goal
Complete Coach Panel features + Reviews & Recommendations + Progress Visualization + Bug fixes

## All Tasks Completed

### 1. Training Plan Rebuild (previous sprint)
- [x] Backend: `weeklySchedule` in Player model
- [x] Frontend: PlanTab, CalendarTab, WeeklySummary, WeekList, MonthGrid
- [x] Seed: Kacper has 7-session weekly schedule

### 2. Coach Panel (previous sprint + enhancements)
- [x] **CoachDashboard** — stats, player list, recent sessions, payment/review alerts
- [x] **CoachPlayers** — search, skill chips, rankings
- [x] **CoachPlayerProfile** — 4 tabs (skills, sessions, goals with toggle, reviews)
- [x] **CoachSessions** — month nav, player filter, clickable cards for editing
- [x] **CoachNewSession** — full form with skill updates
- [x] **CoachEditSession** — edit existing sessions with delete
- [x] **CoachNewPlayer** — name, DOB, gender, rate, parent invite
- [x] **Sidebar** — role-based nav with 7 coach items

### 3. Reviews & Recommendations (NEW)
- [x] **Review model** — player, coach, period, type, structured assessment, skill snapshot, overall rating, draft/published status
- [x] **Review controller** — CRUD with parent notification on publish
- [x] **Review routes** — GET/POST/PUT/DELETE with role-based access
- [x] **CoachReviews** — list page with player filter, status badges, star ratings
- [x] **CoachNewReview** — create/edit form with structured fields (strengths, areas to improve, recommendations), star rating, skill snapshot, draft/publish workflow, player query param support
- [x] **Parent Reviews** — expandable review cards with full assessment details and skill charts
- [x] **Reviews tab** in CoachPlayerProfile with quick "Ocena" action button
- [x] **Navigation** — links from ChildProfile, coach sidebar, player profile
- [x] **Seed data** — 2 reviews (monthly + quarterly) with skill snapshots

### 4. Progress Visualization (NEW)
- [x] **Skill history API** — `/api/players/:id/skill-history` endpoint
- [x] **SkillProgress page** — radar chart for current skills + per-skill line charts
- [x] **SVG charts** — gradient area fills, data points, date labels, trend indicators
- [x] **Navigation** — "Wykresy postepu" link from ChildProfile
- [x] **Seed data** — sessions with skillUpdates for chart demo data

### 5. Coach Payments/Invoicing (NEW)
- [x] **CoachPayments** — full page with stats dashboard (paid/pending/overdue)
- [x] **Payment creation form** — auto-fill from player monthly rate, parent auto-select
- [x] **Status filter** — all/pending/overdue/paid
- [x] **Payment cards** — status icons, amounts, player/parent names, dates
- [x] **Navigation** — sidebar "Platnosci" item

### 6. Session Editing (NEW)
- [x] **CoachEditSession** — full edit form reusing session form patterns
- [x] **Session update schema** — added startTime, sessionType, surface fields
- [x] **Clickable session cards** in CoachSessions and CoachPlayerProfile
- [x] **Delete confirmation** with toast feedback

### 7. Bug Fixes & UX Improvements
- [x] Tournament forms: added toast error notifications (previously silent)
- [x] Tournament form: date range validation (end >= start)
- [x] Error toast duration increased to 5s for better visibility
- [x] Goal completion toggle in CoachPlayerProfile
- [x] Mobile responsive improvements for ChildProfile nav links
- [x] Clickable session details with hover states

### 8. Dashboard Enhancements
- [x] Coach dashboard: pending payments count with link
- [x] Coach dashboard: draft reviews count with link
- [x] Alert badges with accent styling

## Quality Gates
- [x] `vite build` — 0 errors
- [x] Server modules parse correctly (all new controllers, models, routes)
- [x] No broken imports
- [x] Existing conventions followed (Polish UI, camelCase, Bebas Neue headings)
- [x] Responsive CSS for all new components

## Files Changed

### New (14 files):
- `client/src/pages/coach/CoachEditSession.jsx`
- `client/src/pages/coach/CoachReviews.jsx`
- `client/src/pages/coach/CoachNewReview.jsx`
- `client/src/pages/coach/CoachPayments.jsx`
- `client/src/pages/parent/Reviews.jsx`
- `client/src/pages/parent/Reviews.css`
- `client/src/pages/parent/SkillProgress.jsx`
- `client/src/pages/parent/SkillProgress.css`
- `server/src/models/Review.js`
- `server/src/controllers/reviewController.js`
- `server/src/routes/reviews.js`

### Modified (12 files):
- `server/src/index.js` — review routes registration
- `server/src/controllers/sessionController.js` — expanded update schema
- `server/src/controllers/playerController.js` — skill-history endpoint
- `server/src/routes/players.js` — skill-history route
- `server/src/scripts/seed.js` — reviews + session skillUpdates seed data
- `client/src/App.jsx` — 8 new routes
- `client/src/components/layout/Sidebar/Sidebar.jsx` — 3 new coach nav items
- `client/src/pages/coach/Coach.css` — payments, reviews, alerts, clickable styles
- `client/src/pages/coach/CoachSessions.jsx` — clickable session cards
- `client/src/pages/coach/CoachPlayerProfile.jsx` — reviews tab, goal toggle, session click
- `client/src/pages/coach/CoachDashboard.jsx` — payment/review alerts
- `client/src/pages/parent/ChildProfile.jsx` — progress + reviews nav links
- `client/src/pages/parent/ChildProfile.css` — mobile responsive fixes
- `client/src/pages/parent/tournaments/AddTournamentForm.jsx` — error handling
- `client/src/pages/parent/tournaments/ResultForm.jsx` — error handling
- `client/src/hooks/useToast.js` — error duration 5s

## Setup Steps
1. `npm run install:all`
2. Create `.env` with `MONGO_URL`
3. `npm run seed`
4. `npm run dev`
5. Coach: coach@serveiq.pl / password123
6. Parent: parent@serveiq.pl / password123

## Suggested Next Sprint
1. Coach session creation from calendar (click on date)
2. PDF export of reviews
3. Mobile responsive deep polish (360px breakpoint)
4. E2E testing
5. Push notifications (Firebase/OneSignal)
6. AI coaching assistant integration
7. Club/group view for coaches
