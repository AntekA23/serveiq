# Performance Pro Features — Match log, Periodyzacja, Career trajectory

**Data:** 2026-04-26
**Status:** Design approved — gotowy do planu implementacji
**Poprzedni sprint:** `2026-04-25-sonia-performance-pathway` (Sonia jako stress test). Ten sprint dorzuca 3 features nadbudowujące tor performance.

## Cel

Dla zawodników z `developmentLevel === 'performance'` dodać 3 niezależne, ortogonalne feature'y, które przesuwają platformę z "lepszy CRM dla trenera" w stronę "operating system zawodnika pro track":

- **A. Match log + opponent scouting** — pełen ślad każdego meczu (scouting, statystyki, kluczowe momenty, debrief)
- **B. Periodyzacja roczna** — macrocykl sezonowy (build/peak/taper/recovery) z A/B/C events
- **C. Career trajectory benchmark** — porównanie kariery Sonii vs. wybranych idoli (Iga, Carlos, Hubi)

Wszystkie 3 widoczne tylko dla `developmentLevel === 'performance'` — zero regresji dla Tennis 10 / Junior.

## Decyzje (z brainstormingu)

| # | Pytanie | Wybór |
|---|---------|-------|
| 1 | Match-Tournament relacja | `tournament` jest **opcjonalne** — pozwala na standalone sparingi (np. z Julią Kowalską) |
| 2 | Opponent jako User | `name` zawsze wymagany; `playerRef` opcjonalny dla joinów wewnątrz platformy |
| 3 | SeasonPlan: jeden czy wiele | Jeden aktywny `(player, season, status: 'active')` + historia archived |

## Feature A — Match log + opponent scouting

### Model `Match`

```js
{
  player: ObjectId (ref Player, required),
  club: ObjectId (ref Club),
  tournament: ObjectId (ref Tournament, optional),  // null = sparing
  date: Date (required),
  surface: enum 'clay' | 'hard' | 'indoor-hard' | 'grass',
  durationMinutes: Number,
  round: enum 'sparing' | 'R64' | 'R32' | 'R16' | 'QF' | 'SF' | 'F' | 'final-3rd-place' | 'qualif',
  opponent: {
    name: String (required),
    club: String,
    isInternal: Boolean (default false),
    playerRef: ObjectId (ref Player, optional — jeśli isInternal),
    ranking: { pzt: Number, te: Number, itf: Number, wta: Number, atp: Number },
  },
  scoutingNotes: String,             // PRZED meczem — co wiemy o rywalce
  result: {
    won: Boolean,
    sets: [{ playerScore: Number, opponentScore: Number, tiebreak: Number? }],
    retired: Boolean,
    walkover: Boolean,
  },
  stats: {                           // wszystko opcjonalne
    firstServePct: Number,           // 0-100
    secondServePct: Number,
    aces: Number,
    doubleFaults: Number,
    winners: Number,
    unforcedErrors: Number,
    breakPointsConverted: Number,
    breakPointsFaced: Number,
    breakPointsSaved: Number,
  },
  keyMoments: [String],              // 3-5 bullet points
  coachDebrief: String,              // 3-4 zdania od trenera PO meczu
  mentalState: Number (1-5),         // jak Sonia czuła się mentalnie
  visibleToParent: Boolean (default true),
  createdBy: ObjectId (ref User),
  timestamps: true
}

// Indexy
{ player: 1, date: -1 }
{ player: 1, tournament: 1 }
{ 'opponent.name': 1 }   // do H2H lookup
```

### API `/api/matches`

```
GET    /api/matches?player=X[&tournament=Y]   # lista meczy zawodnika (lub w turnieju)
GET    /api/matches/:id                        # szczegóły meczu
POST   /api/matches                            # body: { player, ... }
PUT    /api/matches/:id
DELETE /api/matches/:id
GET    /api/matches/h2h?player=X&opponent=NAME # historia H2H
```

Autoryzacja:
- `GET` — coach (jeśli `coaches[]`/`coach`), parent (jeśli `parents[]`), clubAdmin
- `POST/PUT/DELETE` — coach lub clubAdmin
- H2H = ten sam dostęp co `GET`

### UI

**Dla parent (`ChildProfile`):**
- Sekcja "Ostatnie mecze" (`<RecentMatchesSection playerId>`) — 3 najnowsze, kolorowy badge wynik (zielony/czerwony), tytuł, opponent, set scores. Klik = modal z pełnym debriefem.

**Dla coach (`CoachPlayerProfile`):**
- Zakładka **"Mecze"** w sekcji performance — pełna lista + filtr po turnieju/surface/wyniku, sort po dacie. Edycja przez modal `MatchForm` — coach może dodać/edytować scouting przed meczem, statystyki + debrief po.
- Lista pokazuje: data, opponent (z ikonką jeśli internal), round, set scores, won/lost badge.

**Komponenty (nowe):**
- `client/src/components/match/MatchCard.jsx` — karta meczu (do listy)
- `client/src/components/match/MatchDetail.jsx` — szczegóły (modal/strona)
- `client/src/components/match/MatchForm.jsx` — formularz add/edit (Zod schema)
- `client/src/components/match/RecentMatchesSection.jsx` — widget na ChildProfile/CoachPlayerProfile
- `client/src/components/match/MatchesTab.jsx` — pełna lista meczy (zakładka coach)
- `client/src/components/match/H2HBadge.jsx` — pasek H2H "vs. Anna Kowalska: 2-1"

## Feature B — Periodyzacja roczna (macrocycle)

### Model `SeasonPlan`

```js
{
  player: ObjectId (ref Player, required),
  club: ObjectId (ref Club),
  season: String,                  // np. '2026' lub '2026-spring'
  status: enum 'active' | 'archived' (default 'active'),
  startDate: Date (required),
  endDate: Date (required),
  weeklyHoursTarget: Number,       // średnia h/tyg dla całego sezonu
  phases: [{
    type: enum 'build' | 'peak' | 'taper' | 'recovery' | 'offseason' (required),
    startDate: Date (required),
    endDate: Date (required),
    intensity: Number (1-5),       // względna intensywność
    targetEvent: String,           // np. 'MP U16'
    notes: String,
  }],
  targetEvents: [{
    name: String (required),
    date: Date (required),
    priority: enum 'A' | 'B' | 'C' (required),
    tournamentRef: ObjectId (ref Tournament, optional),
  }],
  createdBy: ObjectId (ref User),
  timestamps: true
}

// Indexy
{ player: 1, season: 1, status: 1 }
{ player: 1, status: 1 }

// Constraint: unique(player, season, status='active')
// Implementowany na poziomie controllera (przy create/update — sprawdź czy inny active istnieje)
```

### API `/api/season-plans`

```
GET    /api/season-plans?player=X[&season=Y][&status=active]
GET    /api/season-plans/:id
POST   /api/season-plans                    # tworzy nowy + jeśli istnieje active dla tego sezonu, archiwizuje stary
PUT    /api/season-plans/:id
DELETE /api/season-plans/:id
```

### UI

**`SeasonTimeline` komponent** — wstęga 12-miesięczna:
- Header: nazwa sezonu, łączna liczba h, target events count
- Bar 12 kolumn (po jednej kolumnie na miesiąc), na górze nazwy miesięcy
- Tło każdego miesiąca pokolorowane wg `phase.type` (build niebieski / peak czerwony / taper żółty / recovery zielony / offseason szary)
- Kropki wewnątrz miesiąca = `targetEvents` (rozmiar zależny od priority — A duża, B średnia, C mała)
- Hover na kropce = tooltip "MP U16 — 12.06.2026 (priorytet A)"
- Hover na pasku = tooltip z fazą + datami + intensity 1-5

**Pokazywany w:** `ChildProfile` i `CoachPlayerProfile` (warunkowo).

**Edycja** (tylko coach): przycisk "Edytuj sezon" → `SeasonPlanForm` modal z:
- listą faz (add/remove/reorder, każda z datami i typem)
- listą target events (add/remove)

**Komponenty (nowe):**
- `client/src/components/season/SeasonTimeline.jsx` — read-only wstęga
- `client/src/components/season/SeasonPlanForm.jsx` — modal edycji

## Feature C — Career trajectory benchmark

### Dane = statyczny JSON (bez backendu)

`client/src/data/careerBenchmarks.json`:

```json
{
  "iga-swiatek": {
    "displayName": "Iga Świątek",
    "country": "PL",
    "born": "2001-05-31",
    "milestones": [
      { "age": 12, "label": "Pierwsze MP U12", "year": 2013, "type": "national" },
      { "age": 14, "label": "Pierwszy turniej ITF Junior", "year": 2015, "type": "international" },
      { "age": 16, "label": "WTA Tour debut", "year": 2017, "type": "pro" },
      { "age": 17, "label": "Pierwszy tytuł WTA (Lugano)", "year": 2018, "type": "pro" },
      { "age": 19, "label": "Roland Garros — tytuł", "year": 2020, "type": "grand-slam" },
      { "age": 21, "label": "WTA #1", "year": 2022, "type": "ranking" }
    ]
  },
  "carlos-alcaraz": { "displayName": "Carlos Alcaraz", "country": "ES", "born": "2003-05-05", "milestones": [/* 6 — pełne dane w planie */] },
  "hubert-hurkacz": { "displayName": "Hubert Hurkacz", "country": "PL", "born": "1997-02-11", "milestones": [/* 6 — pełne dane w planie */] }
}
```

### UI — `CareerTrajectory` komponent

- Dropdown wyboru benchmarku (multi-select max 2)
- Oś pozioma 0-25 lat
- Górna linia: kropki Sonii (z `Achievement` z `date` + `pathwayHistory` major transitions)
- Dolna linia: kropki wybranych benchmarków
- Hover na kropce = label + rok
- Header: "Sonia ma X lat. W tym wieku Iga była Y, Carlos był Z."

**Algorytm wieku Sonii w punkcie milestone:**
- Z `Achievement.date` + `Player.dateOfBirth` → wiek z dokładnością do roku
- Renderuj jako kropkę na osi

**Pokazywany w:** `ChildProfile` i `CoachPlayerProfile` (warunkowo).

**Komponenty (nowe):**
- `client/src/components/career/CareerTrajectory.jsx`
- `client/src/data/careerBenchmarks.json`

Bez backendu — czysto frontend.

## Integracja z istniejącym `ChildProfile` / `CoachPlayerProfile`

**Obecny warunkowy blok performance (z poprzedniego sprintu):**
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

**Po sprincie:**
```jsx
{child.developmentLevel === 'performance' && (
  <>
    <PalmaresSection playerId={child._id} />
    <CoachingTeamSection coaches={child.coaches || []} />
    <RankingSummary ranking={child.ranking || {}} />
    <SeasonTimeline playerId={child._id} />              {/* NEW B */}
    <UpcomingTournaments playerId={child._id} />
    <RecentMatchesSection playerId={child._id} />        {/* NEW A */}
    <CareerTrajectory player={child} />                  {/* NEW C */}
  </>
)}
```

W `CoachPlayerProfile` dodatkowo nowa zakładka "Mecze" w istniejącej strukturze tabów.

## Seed (rozszerzenie Sonii)

Dodajemy do `seed.js`:

**Match (8 meczy Sonii):**
- 4 z palmares-affiliated turniejów: po jednym SF/F z każdego MP 2025/2024 (ekstrahujemy "ostatni mecz" turnieju jako Match)
- 2 ze sparingów: vs. Julia Kowalska (internal, 2 razy: 6:2 6:3 i 6:4 7:5)
- 2 z nadchodzącej historii: ostatnio przegrany 1/4 finał i ostatnio wygrany 1/8 z poprzedniego turnieju

**SeasonPlan (1 dla Sonii sezon 2026):**
- Phase: jan-feb build, mar-may peak (przed MP U16 czerwiec), jun taper-peak, lip recovery, sie-paź build, lis-gru offseason
- Target events: MP U16 jun (A), ITF J60 Bytom lip (A), MP U16 halowe gru (B), 2-3 ITF wyjazdowe (C)
- weeklyHoursTarget: 14

**careerBenchmarks.json:** Iga, Carlos, Hubi z 6-7 milestones każdy.

## Plan migracji / wdrożenia

1. **Backend Match:** model + controller + routes + register
2. **Backend SeasonPlan:** model + controller + routes + register
3. **Frontend Match komponenty:** 6 komponentów (MatchCard, MatchDetail, MatchForm, RecentMatchesSection, MatchesTab, H2HBadge)
4. **Frontend SeasonTimeline:** 2 komponenty (Timeline + Form)
5. **Frontend Career:** 1 komponent + JSON data file
6. **Integracja w ChildProfile:** dodać 3 nowe sekcje warunkowe
7. **Integracja w CoachPlayerProfile:** sekcje + nowa zakładka Mecze
8. **Seed:** Match (8) + SeasonPlan (1) — benchmarks już w kodzie
9. **Sanity check:** seed bez błędów, vite build OK, manual click parent3@serveiq.pl

## Estymacja

~12-15h pracy, ~16 nowych plików, ~6 modyfikacji.

## Out of scope (V2)

- Match video/photo upload
- Per-game shot-by-shot scoring
- AI auto-debrief generation z statystyk
- Periodyzacja mikrocyklowa (tygodniowe ładowanie)
- Auto-aktualizacja `weeklyHoursTarget` na podstawie aktualnej fazy
- Benchmark profil edytowalny w UI (V2 — admin)
- Live leaderboard międzyklubowy
