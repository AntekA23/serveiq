# ServeIQ — Core Workflows v1

> **Purpose**: Step-by-step user flows for both demo scenarios through the core loop.
> **Date**: 2026-04-02 (Week 1)
> **Core loop**: Plan → Communicate → Monitor → Review → Recommend

---

## Scenario A — Tennis 10: Maja (age 7) joins a club

### Context
Maja's parents sign her up for Tennis 10 Red at Klub Tenisowy Arka in Gdynia. Coach Tomek runs the Monday/Wednesday group. Maja has never played tennis before.

---

### A1. ONBOARDING (Day 0)

**Club Admin (Anna):**
1. Logs into ServeIQ as Club Admin
2. Opens "Players" → "Add Player"
3. Enters Maja's info: name, DOB, gender
4. Sets pathway stage: "Tennis 10 — Czerwony"
5. Assigns to Group: "Tennis 10 Red — Pon/Śr 16:00"
6. Assigns Coach: Tomek
7. Sends parent invite (email) to Maja's mother (Ewa)

**Parent (Ewa):**
1. Receives email with invite link
2. Creates account (email, password, name, phone)
3. Sees Maja's profile linked to her account
4. Sees: current stage (Tennis 10 Red), coach (Tomek), schedule (Mon/Wed 16:00)
5. Onboarding complete → lands on Player Journey View

**Coach (Tomek):**
1. Logs in → sees Maja added to his "Tennis 10 Red" group
2. Opens Maja's profile → sees pathway stage, parent linked
3. Can immediately start planning

---

### A2. PLAN (Week 1)

**Coach (Tomek):**
1. Opens Activity Planner
2. Creates recurring class: "Tennis 10 Red — Zajęcia"
   - Type: `class`
   - Group: Tennis 10 Red
   - Day: Monday + Wednesday, 16:00-17:00
   - Surface: clay
   - Status: planned
3. Sets focus areas for next 4 weeks: "koordinacja", "piłka w grze", "zabawa"
4. Creates Development Goal for Maja:
   - Title: "Podstawy koordynacji ręka-oko"
   - Category: `fundamentals`
   - Timeframe: `monthly`
   - Target date: +4 weeks

**What parent sees:**
- Calendar with upcoming Monday/Wednesday classes
- Active goal: "Podstawy koordynacji ręka-oko"
- Current stage: Tennis 10 Red

---

### A3. COMMUNICATE (Week 1-2)

**Coach (Tomek) after Monday class:**
1. Opens Activity → marks as `completed`
2. Takes attendance (Maja: present)
3. Adds coach note: "Maja świetnie się bawiła, dobrze łapie równowagę. Trzeba popracować nad uchwytem rakiety."
4. Adds parent-facing note: "Maja doskonale się dziś bawiła! Ćwiczyliśmy równowagę i pierwsze uderzenia. Proszę zwrócić uwagę na prawidłowy uchwyt rakiety w domu."

**What parent (Ewa) sees in Timeline:**
- Activity completed: "Tennis 10 Red — Zajęcia" (Monday)
- Coach update: "Maja doskonale się dziś bawiła!..."
- Next activity: Wednesday 16:00

**Parent (Ewa) can:**
- Read coach update without needing WhatsApp
- See what's coming next
- Optionally reply via Messages

---

### A4. MONITOR (Week 2-4)

**Coach (Tomek) ongoing:**
1. After each class → completes Activity + attendance
2. Adds quick Observations:
   - Type: `progress` — "Maja zaczyna kontrolować piłkę forehandem"
   - Type: `highlight` — "Świetna energia, motywuje inne dzieci w grupie"
   - Type: `participation` — engagement: 5/5, effort: 4/5, mood: 5/5
3. Links observations to focus areas: "koordinacja", "fundamentals"

**What accumulates in timeline:**
- 8 completed classes
- 4-6 observations
- Engagement/effort trend visible
- Focus areas referenced

**Parent (Ewa) sees weekly:**
- Summary of activities attended
- Coach observations (positive, encouraging)
- Engagement signals (5/5 mood — "she loves it!")
- No WhatsApp needed

---

### A5. REVIEW (End of Month 1)

**Coach (Tomek):**
1. Opens "Reviews" → "Create Review" for Maja
2. Period: last 4 weeks
3. System pre-fills:
   - Activities count: 8 classes attended (of 8 — 100% attendance)
   - Observations: 5 logged
   - Goals: 1 active
4. Coach writes structured review:
   - **What happened**: "Maja uczestniczyła w 8 zajęciach Tennis 10 Red. Ćwiczyliśmy koordynację, piłkę na forehandzie i zabawę z rakietą."
   - **What went well**: "Doskonała frekwencja i energia. Maja szybko łapie nowe ćwiczenia. Świetnie współpracuje z grupą."
   - **What needs focus**: "Uchwyt rakiety wymaga dalszej korekty. Praca nad zmianą kierunku ruchu."
   - **Next steps**: "Kontynuujemy w grupie Czerwonej. Za 2-3 miesiące możliwa rozmowa o przejściu do Pomarańczowej."
5. Publishes review → parent gets notification

**What parent (Ewa) sees:**
- Full monthly review of Maja's journey
- Clear summary: great attendance, loves it, grip needs work
- Next steps: stay in Red, maybe Orange in 2-3 months
- Emotional value: "I know what's happening. I trust this process."

---

### A6. RECOMMEND (End of Month 1)

**Coach (Tomek):**
1. Creates Recommendation:
   - Type: `focus-change`
   - Title: "Dodać ćwiczenia na zmianę kierunku"
   - Priority: medium
   - Description: "Na następne 4 tygodnie dodajemy agility drills do każdych zajęć"
2. (Later, month 3) Creates Recommendation:
   - Type: `pathway-advance`
   - Title: "Przejście do Tennis 10 Pomarańczowy"
   - Priority: high
   - Description: "Maja opanowała podstawy. Gotowa na większy kort i piłki pomarańczowe."

**What parent sees:**
- Recommendation card in Journey View
- Clear indication: "Coach recommends moving to Orange level"
- Parent can acknowledge/discuss

**What club admin sees:**
- Dashboard: "1 player ready for pathway advance"
- Conversion visibility: Red → Orange pipeline

---

### A7. CLUB DASHBOARD VIEW (ongoing)

**Club Admin / Owner sees:**
- Group overview: Tennis 10 Red (8 players), Orange (5 players), Green (3 players)
- Attendance rates per group
- Players needing attention (low engagement, missed classes)
- Pathway pipeline: how many ready to advance
- Recent reviews published
- Recommendations pending action

**Value for club owner:**
- "I can see my junior section is healthy"
- "3 kids ready to move up = revenue continuity"
- "2 kids missed last 3 classes = retention risk"

---

---

## Scenario B — Sonia: Advanced pathway (U14 performance)

### Context
Sonia (age 13) is a National Champion U12 who moved to U14 category. She trains at the club 5 days/week, plays Tennis Europe tournaments, has a head coach (Marek), and her father (Marcin) manages logistics. The support team includes a fitness coach and sports psychologist.

---

### B1. ONBOARDING (Day 0)

**Already in system.** Player profile shows:
- Pathway stage: "Kadra — Performance"
- Development level: `performance`
- Coach: Marek
- Parent: Marcin
- Skills rated (serve: 4/5, forehand: 4/5, etc.)
- Rankings: PZT, Tennis Europe
- Pathway history: Tennis 10 Red → Orange → Green → Junior Beginner → Junior Advanced → Performance

---

### B2. PLAN (Season planning)

**Coach (Marek):**
1. Creates seasonal plan as Activities:
   - **Training blocks** (type: `training`): 5x/week court sessions
   - **Fitness** (type: `fitness`): 3x/week with fitness coach
   - **Tournaments** (type: `tournament`): 8 tournaments planned for season
     - 3x PZT Polish Tour events
     - 2x Tennis Europe
     - 2x regional
     - 1x National Championship
   - **Camps** (type: `camp`): 2 pre-season camps
   - **Reviews** (type: `review`): monthly review meetings

2. Creates Development Goals:
   - "Poprawić pierwszy serwis — procent trafionych >55%" (category: `serve`, quarterly)
   - "Stabilność psychiczna w tie-breakach" (category: `confidence`, seasonal)
   - "Poprawa footworku na korcie ziemnym" (category: `movement`, monthly)
   - "Balans szkoła-tenis: średnia ocen min 4.0" (category: `school-balance`, seasonal)

**What parent (Marcin) sees:**
- Full season calendar: tournaments, training, camps, fitness, reviews
- 4 active development goals with progress tracking
- Clear picture: "I know the whole plan"

---

### B3. COMMUNICATE (daily/weekly)

**Coach (Marek) after training:**
1. Completes Activity → adds notes:
   - Focus areas: "serwis", "return"
   - Coach note: "Pracowaliśmy nad tossem — Sonia zaczyna go kontrolować lepiej. Konsystencja forehandy doskonała."
2. Adds Observation:
   - Type: `progress`
   - Text: "Serwis: toss bardziej stabilny, ale brakuje rotacji w 2. serwisie"
   - Engagement: 5/5, effort: 4/5

**After tournament:**
1. Completes Activity (type: `tournament`):
   - Tournament data: PZT Polish Tour — Wrocław
   - Category: U14
   - Result: SF (wins: 3, losses: 1)
   - Scores: ["6-2", "6-1", "6-4", "3-6 4-6"]
2. Adds Observation:
   - Type: `general`
   - Text: "Świetne 3 mecze. W półfinale widać było zmęczenie po 2. secie. Do pracy nad kondycją w 3-setówkach."
   - Focus areas: "fitness", "mental"

**What parent (Marcin) sees in Timeline:**
- Chronological feed of all training sessions, tournaments, observations
- Quick signals: how was engagement, effort
- Tournament results with coach analysis
- No need to call coach — everything is here

---

### B4. MONITOR (ongoing)

**Coach (Marek) tracks patterns:**
- Observation trends: serve improving, mental strength in big points needs work
- Tournament results: consistent SF/QF, needs to convert to finals
- Goals progress:
  - First serve %: 48% → 52% (on track to 55%)
  - Tie-break mental: 2 wins / 4 played (improving)
  - Footwork: score moved from 3/5 → 4/5
  - School: grades holding at 4.2

**System aggregates:**
- Activities this month: 22 trainings, 3 fitness, 1 tournament, 4 observations
- Total this season: 180 activities, 12 observations, 3 reviews

---

### B5. REVIEW (monthly)

**Coach (Marek) creates monthly review:**
- **What happened**: "Luty: 20 treningów kortowych, 12 fitness, turniej PZT Wrocław (SF). 2 dni chorobowe."
- **What went well**: "Serwis się poprawia — toss stabilniejszy. Forehand konsekwentny. Wygrane 3 mecze na turnieju bez straty seta do SF."
- **What needs focus**: "1) Kondycja w 3. secie — przegrana SF po świetnych 2 meczach. 2) Drugi serwis — brak rotacji. 3) Zarządzanie energią między turniejami."
- **Next steps**: "Dodajemy blok kondycyjny 2x/tyg. Spotkanie z psychologiem nt. rutyny przed meczem. Następny turniej za 3 tygodnie — TE Praga."

**Published → parent gets full review.**

---

### B6. RECOMMEND (quarterly)

**Coach (Marek) creates recommendations:**

1. Type: `workload-adjust`
   - "Zwiększyć trening kondycyjny z 3x na 4x/tydzień"
   - Priority: high
   - Reason: 3-set match endurance

2. Type: `support-need`
   - "Konsultacja z psychologiem sportowym — rutyna przedmeczowa"
   - Priority: high

3. Type: `activity-suggest`
   - "Zgłosić na Tennis Europe — Prague Open i Budapest Cup"
   - Priority: medium

4. Type: `focus-change`
   - "Zmiana priorytetu: z footworku na 2. serwis z rotacją"
   - Priority: medium

---

### B7. WHAT MAKES THIS THE SAME SYSTEM AS TENNIS 10

| Element | Tennis 10 (Maja) | Performance (Sonia) |
|---------|-----------------|---------------------|
| Activity types | class, camp | training, tournament, fitness, camp |
| Goals | 1 simple goal | 4 structured goals |
| Observations | basic (engagement, fun) | detailed (technical, tactical, mental) |
| Reviews | monthly, encouraging | monthly, analytical |
| Recommendations | pathway advance | workload, support, focus |
| Timeline | 2x/week updates | daily updates |
| Parent view | "she's having fun, coach says good" | "full season picture, clear plan" |

**Same data model. Same workflow. Different depth.**

---

---

## Role-Specific Daily Workflows

### Coach — Daily Flow
```
Morning:
  1. Open ServeIQ → see today's activities
  2. Check which players are in today's sessions
  3. Review any pending recommendations

During/After session:
  4. Mark activity as completed
  5. Take attendance (if group class)
  6. Add quick observation (2-3 sentences + engagement score)
  7. Update focus areas if needed

Weekly:
  8. Review group progress
  9. Add observations for players who need attention
  10. Check development goals progress

Monthly:
  11. Write review summaries
  12. Create/update recommendations
  13. Publish reviews → parents notified
```
**Target: steps 4-6 should take <3 minutes per session.**

### Parent — Weekly Flow
```
Anytime:
  1. Open ServeIQ → see Timeline
  2. Read latest coach updates and observations
  3. Check upcoming activities in calendar
  4. Read review when published (monthly)

Occasionally:
  5. Check development goals and progress
  6. Read recommendations
  7. Message coach if needed
```
**Target: parent should feel informed in <2 minutes/week.**

### Club Admin — Weekly Flow
```
Monday:
  1. Open Club Dashboard
  2. Check group attendance overview (last week)
  3. Identify at-risk players (3+ missed sessions)
  4. Check pathway pipeline (who's ready to advance)

Monthly:
  5. Review published reviews count
  6. Check recommendations pending action
  7. Export/share retention metrics with owner
```
**Target: full weekly check in <5 minutes.**

---

## API Endpoints Needed (from workflows)

### Activities
- `POST /api/activities` — create activity
- `GET /api/activities?club=X&date=range` — list activities
- `GET /api/activities/:id` — get activity detail
- `PUT /api/activities/:id` — update activity (complete, add notes)
- `PUT /api/activities/:id/attendance` — update attendance
- `DELETE /api/activities/:id` — cancel/remove
- `GET /api/activities/calendar?player=X` — calendar view
- `GET /api/activities/upcoming?player=X` — next activities

### Development Goals
- `POST /api/goals` — create goal
- `GET /api/goals?player=X&status=active` — player's active goals
- `PUT /api/goals/:id` — update goal (progress, status)

### Observations
- `POST /api/observations` — add observation
- `GET /api/observations?player=X` — player observations feed
- `GET /api/observations?activity=X` — observations for an activity

### Reviews
- `POST /api/reviews` — create review
- `GET /api/reviews?player=X` — player's reviews
- `PUT /api/reviews/:id` — edit/publish review
- `GET /api/reviews/:id/prefill` — get auto-aggregated data for review period

### Recommendations
- `POST /api/recommendations` — create recommendation
- `GET /api/recommendations?player=X&status=pending` — pending recommendations
- `PUT /api/recommendations/:id` — update status

### Timeline
- `GET /api/timeline?player=X&limit=20` — aggregated timeline feed
- `GET /api/timeline?club=X&limit=20` — club-wide feed

### Club / Groups
- `POST /api/clubs` — create club
- `GET /api/clubs/:id` — club detail
- `GET /api/clubs/:id/dashboard` — aggregated dashboard data
- `POST /api/groups` — create group
- `GET /api/groups?club=X` — list groups
- `PUT /api/groups/:id` — update group

### Players (refactored)
- `POST /api/players` — create player (with club, stage, group)
- `GET /api/players?club=X&stage=Y` — filtered player list
- `GET /api/players/:id/journey` — full journey view (stage, goals, recent, reviews)
- `PUT /api/players/:id/pathway` — update pathway stage
