# Sonia Antczak — Performance Pathway (architectural stress test)

**Data:** 2026-04-25
**Autor:** Lead engineer (sesja brainstormingowa z user)
**Status:** Design approved — gotowy do implementacji

## Cel

Wprowadzić do ServeIQ pełny "tor wyczynowy" (`developmentLevel: 'performance'`) używając **Sonii Antczak** jako 4. zawodniczki demo: U14, 7-krotna mistrzyni Polski, z 4-osobowym sztabem trenerskim. Sonia ma być stress-testem architektonicznym — sprawdzeniem, czy obecna struktura danych i UI skaluje się od początkujących Tennis 10 aż do zawodników z aspiracjami międzynarodowymi.

Zgodnie z `CLAUDE.md`:
- "Architectural stress test: Advanced player pathway (Sonia scenario)"
- "Design backbone must support advanced player pathway later"
- "Demoability — 2 scenarios: Tennis 10 family journey + Sonia advanced pathway"

## Decyzje (z brainstormingu)

| # | Decyzja | Wybór |
|---|---------|-------|
| 1 | Zakres zmian | **C** — pełna ścieżka Performance: seed + rozszerzenie modeli + nowy widok |
| 2 | Skład zespołu trenerów | **B** — 4 osoby: head, fitness, mental, physio |
| 3 | Modelowanie osiągnięć | **B** — nowy model `Achievement` (osobny od `Tournament`) |
| 4 | Forma widoku | **A** — rozszerzony `ChildProfile` z sekcjami warunkowymi (`developmentLevel === 'performance'`) |
| 5 | Status trenerów | **A** — wszyscy 4 to pełnoprawne konta `User` z loginem i rolą w zespole |

## Zmiany w modelach danych

### Nowy model — `server/src/models/Achievement.js`

Trofea kariery zawodnika — osobne od bieżących turniejów (`Tournament`). Powód separacji: turnieje to nadchodzące/aktywne wydarzenia z planami i obserwacjami; achievementy to trwała historia osiągnięć — inne UI, inne filtry, inny lifecycle.

```js
{
  player: ObjectId,        // ref Player (required)
  club: ObjectId,          // ref Club
  category: String,        // enum: 'mp', 'international', 'national', 'ranking', 'callup'
  title: String,           // "Mistrzostwa Polski U14 — singel"
  ageCategory: String,     // enum: 'U10', 'U12', 'U14', 'U16', 'U18', 'open'
  discipline: String,      // enum: 'singel', 'debel', 'mix', 'druzynowe'
  year: Number,            // 2025
  date: Date,              // pełna data jeśli znana, opcjonalne
  location: String,        // "Kraków, KS Olsza"
  result: String,          // enum: 'gold', 'silver', 'bronze', 'finalist', 'semifinal', 'quarterfinal', 'other'
  description: String,     // notatka trenera / krótki opis
  imageUrl: String,        // opcjonalnie (zdjęcie z trofeum)
  visibleToParent: Boolean,
  createdBy: ObjectId,     // ref User
  timestamps: true
}

// indexy
{ player: 1, year: -1 }
{ player: 1, category: 1 }
```

### Rozszerzenie — `User.coachProfile.teamRole`

Pojedyncze pole. Zero migracji — istniejący trener (`coach@serveiq.pl`) dostanie `teamRole: 'head'` w seedzie. Pozostałe konta dostaną wartość przy tworzeniu.

```js
coachProfile: {
  // ...istniejące pola...
  teamRole: {
    type: String,
    enum: ['head', 'assistant', 'fitness', 'mental', 'physio', 'nutrition'],
    default: 'head',
  }
}
```

### `Player` — bez zmian schematu

Pole `coaches: [ObjectId]` już istnieje (multi-coach support). Pole `developmentLevel: 'performance'` już istnieje w enumie. Wystarczy użyć.

## Sonia — dane domenowe

| Pole | Wartość |
|------|---------|
| Imię/Nazwisko | Sonia Antczak |
| DOB | 2012-06-14 (13 lat na dziś 2026-04-25, kategoria U14) |
| Płeć | F |
| Klub | KT Smecz Warszawa |
| `developmentLevel` | `performance` |
| `pathwayStage` | `performance` |
| Ranking | PZT: 3, TE: 180, ITF Junior: 320 |
| `coach` (legacy) | head coach (Marek Wojciechowski) |
| `coaches[]` | wszyscy 4 |
| Stawka miesięczna | brak (sponsoring klubowy + program PZT) |
| Idol | Iga Świątek (reuse istniejących `idol.facts` z Kacpra lub generated) |

### Plan tygodniowy (11 sesji, ~13h)

| Dzień | Sesje |
|-------|-------|
| Pn | kort 90' (15:00) + kondycja 60' (17:30) |
| Wt | kort 120' (15:00) + mental 30' (18:00) |
| Śr | kort 90' (15:00) + fizjo/regeneracja 60' (17:30) |
| Cz | sparing 120' (14:00) + kondycja 45' (17:00) |
| Pt | kort 90' (15:00) + mental 30' (17:30) |
| Sb | turniej/sparing 180' (10:00) |
| Nd | regeneracja 45' |

**Focus:** plaski serwis, taktyka serwis+1, wytrzymałość 3-setowa, rutyny tie-break, mentalność turniejowa.

### Cele rozwojowe (3)

1. **Plaski serwis 170 km/h** — quarterly, kategoria `serve`, postęp 60%
2. **Wytrzymałość 3-godz. mecze** — quarterly, kategoria `fitness`, postęp 70%
3. **Przejście do ITF Junior tour 2027** — yearly, kategoria `pathway`, postęp 35%

### Palmares (9 wpisów `Achievement`)

| Rok | Tytuł | Kategoria | Konkurencja | Wynik | Lokalizacja |
|-----|-------|-----------|-------------|-------|-------------|
| 2021 | MP U10 | mp | singel | gold | Bydgoszcz |
| 2022 | MP U10 deble | mp | debel | gold | Sopot |
| 2022 | MP U12 | mp | singel | gold | Wrocław |
| 2023 | MP U12 deble | mp | debel | gold | Łódź |
| 2023 | MP U12 halowe | mp | singel | gold | Poznań |
| 2024 | MP U14 halowe | mp | singel | gold | Warszawa |
| 2025 | MP U14 | mp | singel | gold | Kraków |
| 2024 | Tennis Europe U14 Bratislava | international | singel | finalist | Bratysława |
| 2025 | ITF J60 Pardubice | international | singel | quarterfinal | Pardubice |

**= 7 mistrzostw Polski + 2 międzynarodowe.**

### Zespół trenerów (4 nowe konta `User`)

| Email | Imię i nazwisko | `teamRole` | Specjalizacja |
|---|---|---|---|
| coach.head@serveiq.pl | Marek Wojciechowski | `head` | ITF Level 3, 22 lata doświadczenia, były trener kadry juniorskiej PZT |
| coach.fitness@serveiq.pl | Agnieszka Lewandowska | `fitness` | Mgr AWF, certyfikat NSCA, przygotowanie motoryczne |
| coach.mental@serveiq.pl | Dr Paweł Sokołowski | `mental` | Dr psychologii sportowej, pracował z reprezentacją PL |
| coach.physio@serveiq.pl | Karolina Mazur | `physio` | Mgr fizjoterapii, McKenzie/FMS, fizjo sportowa |

Wszystkie konta: `password123`, `club: KT Smecz`, `role: 'coach'`, `onboardingCompleted: true`. Avatary = inicjały (kolor tła z palety) — generowanie zdjęć opcjonalne na później.

`Sonia.coach = Marek._id` (legacy field), `Sonia.coaches = [Marek, Agnieszka, Paweł, Karolina]`.

## UI: rozszerzenia `ChildProfile`

Wszystkie nowe sekcje **warunkowe** — render tylko gdy `player.developmentLevel === 'performance'`. Dla Kacpra/Julii/Antoniego niewidoczne, zero regresji.

**Kolejność na stronie po hero:**

1. **🏆 Palmares** — gablota trofeów
   - Layout: poziome karty grupowane po latach DESC
   - Każda karta: ikona medalu (gold/silver/bronze/SVG), tytuł, lokalizacja, kategoria wieku, konkurencja, wynik
   - Click karty = modal/szczegóły (description, date)
   - Empty state: sekcja ukryta (nie renderujemy nagłówka)

2. **👥 Zespół trenerów** — siatka 2×2
   - Każda karta: avatar (inicjały lub zdjęcie), imię i nazwisko, kolorowy badge roli (🎾 Trener główny / 💪 Kondycja / 🧠 Mental / 🩺 Fizjo), specjalizacja (1 linia)
   - CTA: "Napisz wiadomość" → otwiera istniejący `Chat` z preselected odbiorcą

3. **📈 Ranking** — 3 mini-karty PZT/TE/ITF
   - Aktualna wartość + delta vs. 6 miesięcy temu (jeśli mamy historię — w MVP bez historii, tylko aktualne)
   - Sparkline ukryty w MVP (sekcja "ranking historyczny" → V2)

4. **🎯 Plan turniejowy** — 3 najbliższe `Tournament`
   - Oś czasu: data, nazwa, lokalizacja, kategoria, status badge
   - Reuse istniejących danych — tylko nowy widget agregujący

5. **Pozostałe sekcje** (Skills/Sessions/Goals/Reviews/Health) — bez zmian.

### Pliki UI do zmiany

- `client/src/pages/parent/ChildProfile.jsx` — dodanie 4 sekcji warunkowych
- `client/src/pages/parent/ChildProfile.css` — nowe style (palmares grid, team grid, ranking cards)
- `client/src/components/PalmaresSection.jsx` (nowy) — gablota trofeów
- `client/src/components/CoachingTeamSection.jsx` (nowy) — siatka trenerów
- `client/src/components/RankingSummary.jsx` (nowy) — 3 mini-karty
- `client/src/components/UpcomingTournaments.jsx` (nowy) — oś czasu turniejów

Identyczne sekcje (Palmares, Team) pojawią się też w `client/src/pages/coach/CoachPlayerProfile.jsx` (DRY przez współdzielone komponenty).

## API

### Nowe endpointy

```
GET    /api/achievements?playerId=...   # lista achievementów zawodnika
GET    /api/achievements/:id            # szczegóły
POST   /api/achievements                # body: { player, category, title, ... }
PUT    /api/achievements/:id
DELETE /api/achievements/:id
```

Autoryzacja:
- `GET` — coach (jeśli ma w `coaches[]`) lub parent (jeśli `parents[]`) lub clubAdmin
- `POST/PUT/DELETE` — coach lub clubAdmin

Kontroler: `server/src/controllers/achievements.controller.js`
Trasy: `server/src/routes/achievements.routes.js`
Rejestracja w `server/src/index.js`: `app.use('/api/achievements', achievementsRoutes)`

### Modyfikacje istniejących endpointów

`GET /api/players/:id` — populate `coaches` razem z `coachProfile.teamRole`:

```js
.populate('coaches', 'firstName lastName email avatarUrl coachProfile.teamRole coachProfile.specialization')
```

## Seed (`server/src/scripts/seed.js`)

Nowa sekcja **15. SONIA — PERFORMANCE PATHWAY**, wstawiona przed sekcją "PODSUMOWANIE":

1. **4 nowe konta `User`** (head/fitness/mental/physio), z `teamRole`, hasła `password123`
2. **1 nowe konto rodzica** `parent3@serveiq.pl` (Anna Antczak) — przypisane do Sonii via `parentProfile.children`
3. **Player Sonia** — pełne dane domenowe powyżej
4. **9 `Achievement`** (palmares — 7 MP + 2 międzynarodowe). MP U14 Kraków 2025 jest tylko tutaj (nie w `Tournament`) — palmares jest źródłem prawdy dla zakończonych turniejów-mistrzostw.
5. **3 `DevelopmentGoal`** (serwis/wytrzymałość/ITF tour)
6. **6 `Observation`** — po jednej od każdego z 4 trenerów + 2 dodatkowe od heada (różne aktywności)
7. **2 `Tournament`** — wyłącznie nadchodzące: 1 MP U16 (planowany) + 1 ITF J60 zagraniczny. Zakończone turnieje-mistrzostwa idą do `Achievement`, nie do `Tournament`.
8. **5 `Session`** — różne typy (kort/sparing/kondycja/mental/regeneracja)
9. **1 `ReviewSummary`** kwartalny
10. **~20 `PlayerBadge`** (championship-streak, podium-master, hours-100, tournament-10, finalist, winner, itd.)
11. **3-5 `Message`** (parent3 ↔ head coach)
12. **Płatność**: pomijamy (sponsoring klubowy + program PZT — w polu notatki w `Player.trainingPlan.notes` opis finansowania)

Aktualizacja podsumowania na końcu seeda: dodać "Sonia Antczak — Performance (Demo Record D — Performance pathway)".

## Plan migracji / wdrożenia

1. **Backend models**: `Achievement.js` + dopisek `teamRole` w `User.js`
2. **Backend API**: controller + routes + rejestracja w `index.js`
3. **Backend players controller**: rozszerz populate `coaches` o `coachProfile.teamRole`
4. **Frontend components**: 4 nowe komponenty (Palmares, CoachingTeam, RankingSummary, UpcomingTournaments)
5. **Frontend ChildProfile**: dodanie sekcji warunkowych
6. **Frontend CoachPlayerProfile**: te same sekcje (DRY)
7. **CSS**: palmares grid, team grid, ranking cards, badge styles dla `teamRole`
8. **Seed**: pełna sekcja Sonii — 4 konta + Player + Achievements + Goals + Obs + Tournaments + Sessions + Reviews + Badges + Messages
9. **Sanity check**:
   - `npm run seed` bez błędów
   - login każdym z 4 trenerów + rodzicem Sonii
   - `ChildProfile` Sonii pokazuje wszystkie nowe sekcje
   - `ChildProfile` Kacpra/Julii/Antoniego — bez zmian (regresja)
   - `vite build` bez błędów

## Estymacja

~4-6h pracy, ~10 plików zmienionych, ~6 nowych.

## Plik konta demo (po wdrożeniu)

| Konto | Hasło | Rola |
|-------|-------|------|
| coach@serveiq.pl | password123 | Trener Tomasz (Kacper, Julia, Antoni) |
| coach.head@serveiq.pl | password123 | Marek — head coach Sonii |
| coach.fitness@serveiq.pl | password123 | Agnieszka — fitness coach |
| coach.mental@serveiq.pl | password123 | Dr Paweł — mental coach |
| coach.physio@serveiq.pl | password123 | Karolina — fizjoterapeutka |
| parent@serveiq.pl | password123 | Anna (Kacper + Antoni) |
| parent2@serveiq.pl | password123 | Marta (Julia) |
| parent3@serveiq.pl | password123 | (rodzic Sonii — nowe konto) |
| admin@serveiq.pl | password123 | Piotr — clubAdmin |

## Demo records

- A) Kacper Nowak — Tennis 10 Red (beginner)
- B) Julia Kowalska — Junior Advanced (Sonia-light)
- C) Antoni Wiśniewski — Tennis 10 Red (nowy)
- **D) Sonia Antczak — Performance (Sonia full / stress test)** ← nowe

## Out of scope (V2)

- Generowanie zdjęć profilowych trenerów (avatary = inicjały na MVP)
- Sparkline rankingów historycznych (tylko aktualne)
- Endpoint `PATCH /api/players/:id/coaches` — drag-and-drop zarządzania zespołem (manual przez seed)
- Powiadomienia push o zmianach w teamie
- PDF export "press kit" Sonii
