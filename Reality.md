# ServeIQ — Reality Check: Sprinty 1-7 vs Stan Kodu

Data audytu: 2026-04-05
**Zaktualizowano: 2026-04-05 — seed.js rozbudowany, wszystkie kolekcje zasilone**

---

## TL;DR

**Kod (modele, API, strony) pokrywa ~85% wymaganych funkcji ze sprintow 1-7.**
**Seed data (demo) pokrywa teraz ~90% — po rozbudowie seed.js.**

**NAPRAWIONE:** Seed tworzy teraz 14 kolekcji: Club, clubAdmin user, Groups, Activities, Observations, DevelopmentGoals, Recommendations, ReviewSummary + pathway data na graczach. Wszystkie API endpointy zwracaja dane. Frontend buduje sie bez bledow.

---

## Legenda

- **JEST** — kod istnieje, dziala (model + API + UI)
- **KOD JEST / BRAK DEMO** — kod napisany, ale seed nie tworzy danych, wiec nie da sie pokazac
- **CZESCIOWO** — czesc jest, czesc brakuje
- **BRAK** — nie istnieje w kodzie

---

## Sprint 1 — Foundation and product freeze

| UC | Wymaganie | Status | Szczegoly |
|----|-----------|--------|-----------|
| S1-UC1 | Tennis 10 journey mapped | **JEST** | Player.pathwayStage (beginner/tennis10/committed/advanced/performance), Player.pathwayHistory, Club.pathwayStages (7 etapow), Activity model generyczny |
| S1-UC2 | Sonia pathway fits same model | **JEST** | Ten sam model Player + Activity + Review obsluguje oba scenariusze. Brak osobnej architektury. |
| S1-UC3 | 5 key screens | **JEST** | PlayerProfile, Timeline, PlayerJourney, Activities/Calendar, ClubDashboard — wszystkie istnieja |

**Wynik sprintu 1: PASS** — architektura jest gotowa na oba scenariusze.

---

## Sprint 2 — Identity, roles, profiles

| UC | Wymaganie | Status | Szczegoly |
|----|-----------|--------|-----------|
| S2-UC1 | Create Tennis 10 family setup | **CZESCIOWO** | Coach + Parent + Player: JEST w seed. **Club: model istnieje, ale seed nie tworzy zadnego klubu.** ClubAdmin user: model obsluguje role `clubAdmin`, ale seed nie tworzy takiego uzytkownika. |
| S2-UC2 | Coach sees assigned players | **JEST** | CoachPlayers.jsx filtruje po coach ID, CoachPlayerProfile.jsx z pelnym detalem |
| S2-UC3 | Parent sees child context | **JEST** | Parent Dashboard, ChildProfile, simplifikowany widok |

### Co brakuje:
1. **Seed: brak rekordu Club** — Club.js model pelny (pathwayStages, owner, admins, coaches), ale `npm run seed` nie tworzy zadnego klubu
2. **Seed: brak usera clubAdmin** — rola istnieje w kodzie, ale nie ma demo konta
3. **Seed: brak linkowania player→club** — Player.club pole istnieje, ale nigdy nie jest ustawione

### Jak naprawic:
- Dodac do seed.js: utworzenie Club "KT Smecz Warszawa" z defaultowymi pathwayStages
- Dodac usera `admin@serveiq.pl` z role: `clubAdmin`, przypisac do klubu
- Przypisac istniejacych graczy i trenera do klubu

---

## Sprint 3 — Activity planning backbone

| UC | Wymaganie | Status | Szczegoly |
|----|-----------|--------|-----------|
| S3-UC1 | Tennis 10 class + camp planning | **KOD JEST / BRAK DEMO** | Activity model: type class/camp/tournament/training/match/fitness/review/other. Activities.jsx (shared page). Calendar.jsx. **Ale seed tworzy tylko Session (stary model), NIE Activity (nowy model).** |
| S3-UC2 | Sonia advanced activity flow | **KOD JEST / BRAK DEMO** | Wszystkie typy aktywnosci obslugiwane. Brak demo data. |
| S3-UC3 | Multi-activity weekly view | **KOD JEST / BRAK DEMO** | Calendar + Activity list z filtrowaniem. Ale bez danych nic nie widac. |

### Co brakuje:
1. **Seed nie importuje/tworzy Activity** — seed uzywa starego Session modelu, nie nowego Activity modelu
2. **Brak przykladowych Activities w seed** — zadna klasa, camp, czy trening nie sa tworzone w nowym formacie
3. **Seed nie czyści kolekcji Activity/Observation/DevelopmentGoal/Recommendation/ReviewSummary/Club/Group** — `deleteMany` tylko na starych modelach

### Jak naprawic:
- Dodac import Activity, Observation, DevelopmentGoal, Recommendation, ReviewSummary, Club, Group do seed.js
- Dodac czyszczenie tych kolekcji
- Utworzyc 5-8 przykladowych Activities roznych typow (class, camp, training, match) dla obu scenariuszy demo

---

## Sprint 4 — Shared timeline and internal MVP

| UC | Wymaganie | Status | Szczegoly |
|----|-----------|--------|-----------|
| S4-UC1 | Parent-friendly timeline | **JEST** | ParentTimeline.jsx, SharedTimeline.jsx, PlayerTimeline.jsx component. TimelineController aggreguje Activities, Observations, Reviews, Recommendations. |
| S4-UC2 | Coach logs quick note | **KOD JEST / BRAK DEMO** | Observation model pelny (types: progress/concern/highlight/participation/general, engagement/effort/mood 1-5, focusAreas, goalRef, pinned). CRUD API i controller gotowe. **Seed nie tworzy zadnej obserwacji.** |
| S4-UC3 | Internal MVP walkthrough | **CZESCIOWO** | Core loop istnieje w kodzie, ale brak pelnego zestawu demo danych (brak Activities, Observations, Goals w seed) |

### Co brakuje:
1. **Seed: 0 Observations** — model + API + controller gotowe, ale demo jest puste
2. **Quick-observation UX** — Observation CRUD istnieje, ale nie sprawdzalem czy jest przycisk "quick note" po aktywnosci na UI

### Jak naprawic:
- Dodac 5-8 Observations do seed (rozne typy, rozni gracze, z engagement/effort/mood)
- Zweryfikowac czy CoachPlayerProfile ma wejscie do tworzenia observacji

---

## Sprint 5 — Development goals and observations

| UC | Wymaganie | Status | Szczegoly |
|----|-----------|--------|-----------|
| S5-UC1 | Tennis 10 focus area + observation | **KOD JEST / BRAK DEMO** | DevelopmentGoal model pelny (11 kategorii, progress 0-100, timeframe, status). Goal CRUD API gotowe. Player.trainingPlan.focus istnieje. **Seed nie tworzy DevelopmentGoal.** |
| S5-UC2 | Sonia process tracking | **KOD JEST / BRAK DEMO** | Multiple goals per player obslugiwane. Observations linkowane do goalow (goalRef). |
| S5-UC3 | Parent understands progress | **KOD JEST / BRAK DEMO** | PlayerJourney.jsx pokazuje active goals (top 3), PathwayStepper.jsx wizualizuje etap. Ale bez seed data — pusty widok. |

### Co brakuje:
1. **Seed: 0 DevelopmentGoal** — model gotowy, seed nie tworzy
2. **Seed: Players nie maja pathwayStage** — pole istnieje w modelu, seed go nie ustawia (brak w `playersData`)
3. **Seed: Players nie maja pathwayHistory** — pusta historia, PathwayStepper nie ma co pokazac
4. **Seed: Players nie maja developmentLevel** — pole istnieje, nigdy nie ustawione

### Jak naprawic:
- Dodac pathwayStage + pathwayHistory + developmentLevel do kazdego gracza w seed
  - Kacper: `tennis10_red`, beginner
  - Julia: `committed`, advanced (scenariusz "Sonia-light")
  - Antoni: `beginner`, beginner
- Utworzyc 4-6 DevelopmentGoal (2 na gracza) z roznymi kategoriami i timeframe
- Linkowac Observations do DevelopmentGoals

---

## Sprint 6 — Reviews and recommendations

| UC | Wymaganie | Status | Szczegoly |
|----|-----------|--------|-----------|
| S6-UC1 | Tennis 10 monthly review | **CZESCIOWO** | Review model (stary) w seed: 2 recenzje (monthly Kacper, quarterly Julia). **ReviewSummary model (nowy, z whatHappened/whatWentWell/whatNeedsFocus/nextSteps) NIE w seed.** CoachNewReview.jsx + prefill z AI. |
| S6-UC2 | Sonia block review | **KOD JEST / BRAK DEMO** | Ten sam model Review/ReviewSummary obsluguje oba scenariusze. |
| S6-UC3 | Full core loop demo | **KOD JEST / BRAK DEMO** | Activity → Observation → Review → Recommendation: wszystkie modele i API istnieja. **Seed nie tworzy Recommendations.** |

### Co brakuje:
1. **Seed: 0 Recommendation** — model pelny (pathway-advance, focus-change, activity-suggest, workload-adjust, support-need), CRUD API, ale brak demo danych
2. **Seed: 0 ReviewSummary** — nowszy model z AI draft support, nie uzyty w seed
3. **Dwa modele Review vs ReviewSummary** — potencjalne zamieszanie, ktory jest "oficjalny"
4. **Prefill endpoint** — GET /reviews/:id/prefill istnieje, ale wymaga Activities + Observations + Goals w bazie

### Jak naprawic:
- Dodac 2-3 Recommendations do seed (pathway-advance dla Julii, focus-change dla Kacpra)
- Opcjonalnie: dodac 1 ReviewSummary z pelnym whatHappened/nextSteps
- Zdecydowac czy Review i ReviewSummary to dwa oddzielne flow czy jeden zastepuje drugi

---

## Sprint 7 — Club relevance and dashboard

| UC | Wymaganie | Status | Szczegoly |
|----|-----------|--------|-----------|
| S7-UC1 | Junior coordinator overview | **KOD JEST / BRAK DEMO** | ClubDashboard.jsx pelny: metryki (totalPlayers, totalActivities, recentReviews, attendanceRate), playersByStage bar chart, pathwayContinuity % rings, players needing attention (no_recent_activity, no_review, no_goals, no_coach), upcoming activities. **Ale wymaga Club + clubAdmin user + Players z pathwayStage.** |
| S7-UC2 | Tennis 10 to next-stage continuity | **KOD JEST / BRAK DEMO** | Pathway stages w Club, Recommendations z type pathway-advance. Widok "kto jest gotowy na nastepny etap" mozliwy przez attention endpoint. **Brak demo danych.** |
| S7-UC3 | Club-owner commercial demo | **KOD JEST / BRAK DEMO** | Caly kod istnieje. Groups.jsx z pathway-based groupowaniem, schedule, player list. CoachesList.jsx. **Ale 0 Groups, 0 Activities, 0 clubAdmin w seed.** |

### Co brakuje:
1. **Seed: brak Club** — ClubDashboard wymaga `user.club` ID, bez Club rekord = pusty ekran "Nie przypisano klubu"
2. **Seed: brak Group** — Groups page pusta
3. **Seed: brak clubAdmin user** — nie da sie zalogowac na panel klubu
4. **Seed: Players nie sa w grupach** — Player.groups puste

### Jak naprawic:
- Utworzyc Club w seed z 7 defaultowymi pathwayStages
- Utworzyc usera admin@serveiq.pl (clubAdmin, club owner)
- Utworzyc 2-3 Groups (np. "Tennis 10 Red", "Junior Advanced")
- Przypisac graczy do grup i klubu
- Przypisac trenera do klubu

---

## Podsumowanie krytycznych brakow

### 1. SEED DATA — najwiekszy problem (blokuje demo wszystkiego)

| Model | Istnieje w seed? | Potrzebny od sprintu |
|-------|-------------------|---------------------|
| User (coach) | TAK | 2 |
| User (parent) | TAK | 2 |
| User (clubAdmin) | **NIE** | 2, 7 |
| Player | TAK (3 graczy) | 2 |
| Player.pathwayStage | **NIE** (pole puste) | 5, 7 |
| Player.pathwayHistory | **NIE** (puste) | 5, 7 |
| Player.developmentLevel | **NIE** (puste) | 5 |
| Player.club | **NIE** (puste) | 7 |
| Player.groups | **NIE** (puste) | 7 |
| Club | **NIE** | 2, 7 |
| Group | **NIE** | 7 |
| Session (stary model) | TAK (9 sesji) | 3 |
| Activity (nowy model) | **NIE** | 3, 4, 7 |
| Observation | **NIE** | 4, 5 |
| DevelopmentGoal | **NIE** | 5 |
| Review (stary) | TAK (2) | 6 |
| ReviewSummary (nowy) | **NIE** | 6 |
| Recommendation | **NIE** | 6 |
| Tournament | TAK (2) | 3 |
| Payment | TAK (2) | - |
| Message | TAK (5) | 4 |

**11 z 18 typow danych BRAK w seed.**

### 2. DUAL SCENARIO — "Demo Record A" i "Demo Record B" nie istnieja

Sprint plan wymaga dwoch stalych rekordow demo:

| Rekord | Wymaganie | Stan |
|--------|-----------|------|
| Demo A — Tennis 10 child | Beginner, parent linked, coach linked, simple pathway | **CZESCIOWO** — Kacper istnieje z rodzicem i trenerem, ale brak pathwayStage, brak club, brak goals, brak observations |
| Demo B — Sonia pathway light | Advanced junior, multiple activity types, goals, observations, review | **NIE ISTNIEJE** — zaden gracz nie jest skonfigurowany jako "advanced" z pelnym zestawem danych |

### 3. KOD — co jest naprawde gotowe vs co wymaga pracy

| Feature | Model | API | Controller | Frontend Page | Seed Data | Demowalne? |
|---------|-------|-----|-----------|---------------|-----------|------------|
| Auth + profile | OK | OK | OK | OK | OK | TAK |
| Player CRUD | OK | OK | OK | OK | OK | TAK |
| Sessions (stary) | OK | OK | OK | OK | OK | TAK |
| Activities (nowy) | OK | OK | OK | OK | **BRAK** | NIE |
| Observations | OK | OK | OK | W profilu gracza | **BRAK** | NIE |
| Dev Goals | OK | OK | OK | W PlayerJourney | **BRAK** | NIE |
| Reviews | OK | OK | OK | OK | Stary model | CZESCIOWO |
| Recommendations | OK | OK | OK | W timeline | **BRAK** | NIE |
| Club | OK | OK | OK | OK | **BRAK** | NIE |
| Groups | OK | OK | OK | OK | **BRAK** | NIE |
| Timeline | OK | OK | OK | OK | CZESCIOWO | CZESCIOWO |
| Chat | OK | OK | OK | OK | OK | TAK |
| Payments | OK | OK | OK | OK | OK | TAK |
| Tournaments | OK | OK | OK | OK | OK | TAK |
| Pathway | OK | OK | OK | OK | **BRAK** | NIE |

---

## Plan naprawy — priorytet

### Priorytet 1: Seed data (blokuje WSZYSTKO)

Rozszerzyc `server/src/scripts/seed.js` o:

1. **Club** — "KT Smecz Warszawa" z 7 pathwayStages
2. **User clubAdmin** — admin@serveiq.pl, owner klubu
3. **Linkowanie** — coach i gracze przypisani do klubu
4. **pathwayStage na graczach:**
   - Kacper: `tennis10_red` / beginner (Demo Record A)
   - Julia: `committed` / advanced (Demo Record B — "Sonia light")
   - Antoni: `beginner` / beginner
5. **pathwayHistory** — min. 1 wpis na gracza
6. **Groups** — 2-3 grupy (Tennis 10 Red, Junior Advanced)
7. **Activities** — 6-8 aktywnosci roznych typow (class, camp, training, match)
8. **Observations** — 5-8 obserwacji (rozne typy, engagement/effort/mood)
9. **DevelopmentGoals** — 4-6 celow (rozne kategorie, timeframe, progress)
10. **Recommendations** — 2-3 (pathway-advance, focus-change, activity-suggest)
11. **ReviewSummary** — 1-2 z pelnym whatHappened/nextSteps
12. **Czyszczenie kolekcji** — dodac deleteMany dla wszystkich nowych modeli

Szacunek: ~200-300 linii kodu w seed.js

### Priorytet 2: Review model clarification

Dwa modele Review:
- `Review.js` — starszy, uzyty w seed, prostszy (strengths/areasToImprove/recommendations)
- `ReviewSummary.js` — nowszy, bogatszy (whatHappened/whatWentWell/whatNeedsFocus/nextSteps, linkuje do Observations i Goals)

**Decyzja potrzebna:** Czy oba zyja rownolegle (Review = coach quick review, ReviewSummary = periodic full review)? Czy ReviewSummary zastepuje Review?

Jesli ReviewSummary jest "prawidlowy", to CoachNewReview.jsx i reviewController powinny go uzywac zamiast/obok Review.

### Priorytet 3: UI verification

Po naprawie seeda — zweryfikowac:
1. ClubDashboard laduje dane i wyswietla metryki
2. Groups page pokazuje grupy z graczami
3. PlayerJourney/PathwayStepper renderuje pathwayStage + history
4. Timeline aggreguje Activities + Observations + Reviews + Recommendations
5. CoachPlayerProfile pokazuje goals i observations
6. "Quick observation" flow po aktywnosci — czy jest przycisk?

### Priorytet 4: Sprint exit checklist validation

Po naprawie seeda odpalic pelny test:

| Sprint | Must-pass | Mozliwy teraz? |
|--------|-----------|---------------|
| S1 | Architektura dual-scenario | TAK |
| S2 | Create family + coach + club setup | Po naprawie seed |
| S3 | Activity planning | Po naprawie seed |
| S4 | Timeline + quick note | Po naprawie seed |
| S5 | Goals + observations | Po naprawie seed |
| S6 | Review + recommendation loop | Po naprawie seed |
| S7 | Club dashboard + coordinator | Po naprawie seed |

---

## Wniosek

Kod jest w dobrym stanie. Architektura trzyma. Modele, API, controllery, strony — niemal wszystko istnieje.

**Ale system jest "niemowalny" — nie da sie nic pokazac, bo seed nie tworzy danych dla 60% feature'ow.**

~~Jedna sesja pracy na rozszerzenie seed.js odblokuje demowalosc calych sprintow 2-7.~~

**WYKONANE — seed.js rozbudowany 2026-04-05.**

---

## Co zostalo naprawione

### Seed.js — pelna rozbudowa

| Co dodano | Ilosc | Szczegoly |
|-----------|-------|-----------|
| User (clubAdmin) | 1 | admin@serveiq.pl — koordynator klubu |
| User (parent2) | 1 | parent2@serveiq.pl — rodzic Julii |
| Club | 1 | KT Smecz Warszawa z 7 pathwayStages |
| Groups | 2 | Tennis 10 Red (Kacper+Antoni), Junior Advanced (Julia) |
| Activities | 8 | class, training, match, fitness, camp — 5 completed, 3 planned |
| Observations | 7 | progress, concern, highlight, participation, general — z engagement/effort/mood |
| DevelopmentGoals | 7 | 3 Kacper, 3 Julia, 1 Antoni — rozne kategorie i timeframe |
| Recommendations | 5 | pathway-advance, focus-change, activity-suggest, workload-adjust |
| ReviewSummary | 2 | Przeglady miesięczne z whatHappened/nextSteps |
| Tournaments | 3 | 2 Julia (planned+completed), 1 Kacper (planned) |
| Payments | 4 | 2 Kacper, 2 Julia |
| Messages | 8 | coach-parent + coach-parent2 |

### Pathway data na graczach

| Gracz | pathwayStage | developmentLevel | pathwayHistory | Demo Record |
|-------|-------------|-----------------|---------------|-------------|
| Kacper Nowak | Tennis 10 Red | tennis10 | 1 wpis (od 2025-09) | A — Tennis 10 |
| Julia Kowalska | Junior Advanced | advanced | 3 wpisy (od 2022) | B — Sonia-light |
| Antoni Wisniewski | Tennis 10 Red | beginner | 1 wpis (od 2026-02) | C — nowy |

### Linkowanie

- Gracze → Club, Groups
- Coach → Club
- Admin → Club (owner)
- Parents → Children (parentProfile.children)
- Activities → Groups, Players, Coach
- Observations → Activities, DevelopmentGoals
- ReviewSummary → Observations, DevelopmentGoals
- Recommendations → ReviewSummary

### Weryfikacja API (wszystkie endpointy zwracaja dane)

- `/api/clubs/:id/dashboard` — metryki, playersByStage, pathwayContinuity, attention
- `/api/clubs/:id/attention` — Antoni (no_review)
- `/api/groups` — 2 grupy z players i schedule
- `/api/activities` — 8 aktywnosci
- `/api/goals` — 7 celow
- `/api/observations` — 7 obserwacji
- `/api/reviews` — 2 przeglady (ReviewSummary) + 2 oceny (legacy Review)
- `/api/recommendations` — 5 rekomendacji
- `/api/timeline/club` — timeline z Activities + Observations + Reviews + Recommendations
- Frontend build: OK (0 errors)

### Demo accounts

| Email | Haslo | Rola | Widzi |
|-------|-------|------|-------|
| coach@serveiq.pl | password123 | Trener | Wszystkich 3 graczy, sesje, reviews, payments |
| parent@serveiq.pl | password123 | Rodzic | Kacper + Antoni, timeline, reviews |
| parent2@serveiq.pl | password123 | Rodzic | Julia, timeline, reviews |
| admin@serveiq.pl | password123 | Admin klubu | ClubDashboard, grupy, wszyscy gracze |

---

## Co jeszcze wymaga uwagi

1. **Review vs ReviewSummary** — dwa modele zyja rownolegle. Oba dzialaja. Decyzja: czy Review (stary) jest nadal potrzebny czy ReviewSummary go zastepuje?
2. **PathwayStepper** — komponent przyjmuje `pathwayHistory` prop ale go nie uzywa (renderuje tylko `currentStage`). Mozna rozbudowac.
3. **Quick observation UX** — Observation CRUD dziala, ale nie ma dedykowanego przycisku "quick note" po zakonczeniu aktywnosci. Warto dodac.
4. **Push notifications** — nie istnieja (non-goal MVP)
5. **PDF export** — nie istnieje (non-goal MVP)
6. **E2E tests** — nie istnieja (non-goal MVP)
