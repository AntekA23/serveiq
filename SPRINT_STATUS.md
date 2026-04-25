# Sprint — 2026-04-26 — Performance Pro Features

## Sprint Goal
Dla zawodników performance dorzucić 3 features podnoszące wartość pro: Match log + opponent scouting, periodyzację roczną z A/B/C events, oraz career trajectory benchmark vs. wybranych idoli.

## Completed (19 commits + smoke test)

### Backend
- [x] Model `Match` (mecz w turnieju lub sparing) + indexy + Polish error messages
- [x] Model `SeasonPlan` (sezon z fazami + target events) + auto-archive previous active
- [x] `matchController` + `seasonPlanController` (CRUD + role-based access)
- [x] `/api/matches` + `/api/season-plans` + endpoint `GET /api/matches/h2h`

### Frontend (9 nowych komponentów)
- [x] **Match:** `MatchCard`, `MatchDetail` (modal), `MatchForm` (modal edycji), `RecentMatchesSection` (widget), `MatchesTab` (CRUD lista coach)
- [x] **Season:** `SeasonTimeline` (12-miesięczny pasek z fazami)
- [x] **Career:** `CareerTrajectory` + `careerBenchmarks.json` (Iga, Carlos, Hubi)
- [x] `ChildProfile` rozszerzony o 3 nowe sekcje warunkowe
- [x] `CoachPlayerProfile` rozszerzony + nowa sekcja "Mecze" (collapsible Section, nie tab — istniejąca konwencja)

### Seed
- [x] 8 meczy Sonii (4 oficjalne z palmaresu + 4 sparingi z Julią/Wiktorią/Polą)
- [x] SeasonPlan 2026 dla Sonii (8 faz: build/peak/taper/recovery/peak/build/peak/offseason + 6 events: MP U16/ITF Bytom/Pardubice/Tennis Europe/halowe/Trnava)

## Quality gates
- [x] `node --check` na wszystkich nowych/zmienionych plikach
- [x] `npm run seed` — 4 zawodników, 9 osiągnięć, 8 meczy, 1 sezon, 0 błędów
- [x] `npm run build` (vite) — 0 errors (~7.6s)
- [ ] Manual click-through w przeglądarce (parent3 + headCoach)

## Spec & plan
- Spec: `docs/superpowers/specs/2026-04-26-performance-pro-features-design.md`
- Plan: `docs/superpowers/plans/2026-04-26-performance-pro-features.md`

---

# Sprint — 2026-04-25 — Performance Pathway (Sonia stress test)

## Sprint Goal
Wprowadzenie pełnego "toru wyczynowego" (Sonia Antczak — U14, 7× MP) jako stress test architektoniczny: nowy model Achievement, pole `teamRole` w User.coachProfile, 4 sekcje warunkowe w ChildProfile/CoachPlayerProfile (`developmentLevel === 'performance'`), pełny seed Sonii z 4-osobowym sztabem trenerskim.

## Completed (16 commits na master)

### Backend
- [x] `Achievement` model (palmares: 7 MP + 2 międzynarodowe)
- [x] `User.coachProfile.teamRole` enum: head/assistant/fitness/mental/physio/nutrition
- [x] `Player.ranking.itf` (ranking ITF Junior)
- [x] `DevelopmentGoal.category.pathway` (nowa wartość enum)
- [x] `achievementController` — CRUD z role-based access (Zod walidacja)
- [x] `/api/achievements` routes (verifyToken + requireRole na POST/PUT/DELETE)
- [x] `playerController` — populate `coach` + `coaches` z `coachProfile.teamRole`

### Frontend (4 nowe komponenty)
- [x] `PalmaresSection` — gablota trofeów grupowana po latach (gold/silver/bronze badges)
- [x] `CoachingTeamSection` — siatka 4-osobowego zespołu z badge'ami ról
- [x] `RankingSummary` — mini-karty PZT/TE/ITF/WTA/ATP
- [x] `UpcomingTournaments` — 3 nadchodzące turnieje z osi czasu
- [x] Integracja warunkowa w `ChildProfile.jsx` i `CoachPlayerProfile.jsx`

### Seed (Demo Record D — Sonia)
- [x] 4 nowe konta trenerów (head/fitness/mental/physio) z `teamRole`
- [x] `parent3@serveiq.pl` (Anna Antczak) — rodzic Sonii
- [x] Sonia Player: U14, 12 sesji/tydz, ranking PZT #3 / TE #180 / ITF #320, idol Świątek
- [x] 9 osiągnięć: 7 MP (2021-2025, U10/U12/U14, single+deble) + Tennis Europe finalista + ITF J60 ćwierćfinał
- [x] 3 cele: serwis 170 km/h, wytrzymałość 3-set, ITF Junior tour 2027
- [x] 6 obserwacji — po jednej od każdego z 4 trenerów + 2 od heada
- [x] 2 turnieje nadchodzące: MP U16 Sopot + ITF J60 Bytom
- [x] 5 sesji różnych typów (kort/sparing/kondycja/mental/regeneracja)
- [x] 1 ReviewSummary kwartalny Q1/2026
- [x] 18 odznak (16 auto + 2 ręczne od heada)
- [x] 5 wiadomości parent3 ↔ headCoach

## Konta demo (NOWE)
- `coach.head@serveiq.pl` / `password123` — Marek Wojciechowski (head)
- `coach.fitness@serveiq.pl` / `password123` — Agnieszka Lewandowska (fitness)
- `coach.mental@serveiq.pl` / `password123` — dr Paweł Sokołowski (mental)
- `coach.physio@serveiq.pl` / `password123` — Karolina Mazur (physio)
- `parent3@serveiq.pl` / `password123` — Anna Antczak (rodzic Sonii)

## Quality gates
- [x] `node --check` na wszystkich nowych/zmienionych plikach JS
- [x] `npm run seed` — 4 zawodników, 9 osiągnięć, 0 błędów
- [x] `npm run build` (vite) — `✓ built in 7.46s`, 0 errors
- [ ] Manual click-through w przeglądarce — wymaga `cd server && npm install` (brakuje @anthropic-ai/sdk z pre-existing) i `npm run dev`

## Następny krok — manual smoke test
1. `cd server && npm install` (brakujące deps)
2. `npm run dev`
3. Login `parent3@serveiq.pl` → profil Sonii → 4 sekcje performance widoczne
4. Login `parent@serveiq.pl` → profil Kacpra → bez nowych sekcji (regresja OK)
5. Login `coach.head@serveiq.pl` → te same sekcje w widoku trenera

## Spec & plan
- Spec: `docs/superpowers/specs/2026-04-25-sonia-performance-pathway-design.md`
- Plan: `docs/superpowers/plans/2026-04-25-sonia-performance-pathway.md`

## Commits
```
aab6b86 fix: add 'pathway' to DevelopmentGoal category enum
59d777e feat: seed Sonia full — goals/observations/tournaments/sessions/review/badges/messages
e33521f feat: seed Sonia palmares — 7 MP + 2 international achievements
001fdb6 feat: seed Sonia Antczak — Demo Record D performance pathway
3751909 feat: seed performance team — 4 coaches with teamRole + parent3
deba85d feat: CoachPlayerProfile — performance sections (DRY with parent view)
7110662 feat: ChildProfile — performance sections (palmares/team/ranking/tournaments)
d0bceb7 feat: Player.ranking.itf — ITF Junior ranking field
a5ab527 feat: RankingSummary + UpcomingTournaments components
07ed01c feat: CoachingTeamSection — 4-role team grid with chat CTAs
7b28a19 feat: PalmaresSection — career trophies grouped by year
01e4f96 feat: populate coach + coaches with teamRole in player endpoints
a227a3b feat: /api/achievements routes wired
b057a33 feat: achievementController — CRUD with role-based access
c92768d feat: User.coachProfile.teamRole — head/assistant/fitness/mental/physio/nutrition
2dd1635 feat: Achievement model — career palmares for performance players
```

---

# Sprint — 2026-03-30

## Sprint Goal
Full coach panel + reviews + progress viz + AI coaching + design polish + health visibility

## Completed (all pushed to master)

### Core Features
- [x] Coach Panel — 12 pages (dashboard, players, calendar, sessions, edit session, reviews, new review, payments, player profile, new player, new session, messages)
- [x] Reviews & Recommendations — full stack with draft/publish, AI generation, parent view
- [x] Progress Visualization — radar chart + per-skill line charts
- [x] Coach Payments — stats, CRUD, mark-as-paid
- [x] Coach Calendar — monthly grid with all players, click-to-expand day detail
- [x] AI Coaching Assistant — Claude API for recommendations + review drafts
- [x] Training Plan — coach + parent can edit, weekly schedule builder
- [x] Health Data — coach can see player recovery, HRV, HR, sleep (was parent-only)
- [x] Event Notifications — session created, skills updated, goal completed, plan changed

### Design & Polish
- [x] CoachDashboard redesign — stat cards with colors, SVG skill rings, recovery dots
- [x] Parent Dashboard polish — gradient hero, colored metric glows, hover lifts
- [x] ChildProfile polish — colored skill bars, gradient hero, improved nav links
- [x] CoachPlayers — group stats, sorting (name/skill/ranking/age), colored skill chips
- [x] CoachSessions — monthly stats summary bar
- [x] Mobile responsive — all coach pages, ChildProfile nav links
- [x] 404 page

### Bug Fixes
- [x] Tournament form error handling (silent → toast)
- [x] Date validation on tournaments
- [x] Error toast 5s duration
- [x] Goal completion toggle
- [x] Session date prefill from calendar
- [x] Wearable API access for coaches (was 403)

## Quality Gates
- [x] `vite build` — 0 errors
- [x] Server modules parse OK
- [x] All conventions followed

## Commits (20+)
```
d56b541 feat: monthly stats summary on coach sessions page
1a815e8 feat: enhanced coach players list with group stats, sorting, skill rings
d6230e4 feat: health tab in coach player profile with sparkline charts
25c44ff design: polish ChildProfile
1bae67f feat: coach calendar view + 404 page
e49e224 design: redesign coach dashboard + polish parent dashboard
0885a22 feat: coach health visibility + event notifications
be6854e feat: coach training plan management + parent dashboard review preview
baa1a89 feat: AI coaching assistant with Claude API integration
aea429b feat: manual mark-as-paid for coach payments
e831735 feat: coach payments/invoicing UI with stats dashboard
7c51450 fix: error handling + UX improvements
fc67f40 feat: reviews tab in player profile + mobile polish
b5a5dc7 feat: reviews & recommendations + session editing + skill progress charts
13237ff feat: coach panel + training plan rebuild + parent UX polish
```

## Next Priorities
1. E2E testing
2. PDF export of reviews
3. Push notifications
4. Club/group analytics view
5. Real wearable OAuth integration
