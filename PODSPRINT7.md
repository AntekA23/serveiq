# Sprint 7 — Club Relevance

**Okres**: 11-17 maja 2026
**EPIC**: E7 (Dashboard klubu)
**Cel sprintu**: Wlasciciel klubu widzi wartosc — dashboard z grupami, etapami, metrykam ciaglosci sciezki, graczami wymagajacymi uwagi.

---

## Stan zastany

### Backend — CZESCIOWO
- Club model z pathwayStages[] (7 domyslnych etapow z kolorami i age ranges)
- clubController: createClub, getClub, updateClub, getDashboard
- **getDashboard** (GET /clubs/:id/dashboard) juz zwraca:
  - playersByStage (aggregation)
  - attendanceRate (biezacy miesiac)
  - pendingRecommendations (count)
  - recentReviews (count)
  - totalPlayers
  - totalActivities
- Group model z: coach, players[], schedule, maxPlayers, pathwayStage
- groupController: full CRUD

### Frontend — CZESCIOWO
- ClubDashboard.jsx (istnieje ale moze byc placeholder)
- CoachesList.jsx (istnieje)
- Groups.jsx — placeholder

### Co trzeba zbudowac
- Rozbudowac ClubDashboard o metryki ciaglosci sciezki
- Backend: endpoint "gracze wymagajacy uwagi"
- Frontend: pelny widok grup
- Frontend: narracja Tennis 10

---

## Taski

### A1. Backend: Gracze wymagajacy uwagi
**Plik:** `server/src/controllers/clubController.js`

**Nowy endpoint:** `GET /api/clubs/:id/attention`

**Logika:**
```
Gracz "wymaga uwagi" jesli spelnia jedno z:
1. Brak aktywnosci w ostatnich 14 dniach
2. Brak przegladu w ostatnich 30 dniach
3. Brak aktywnego celu rozwojowego
4. Etap "beginner" lub pierwszy etap > 90 dni bez zmiany
5. Brak trenera przypisanego
```

**Response:**
```json
{
  "players": [
    {
      "_id": "...",
      "firstName": "Jan",
      "lastName": "Kowalski",
      "pathwayStage": "beginner",
      "reasons": ["no_recent_activity", "no_goals"],
      "lastActivity": "2026-03-15",
      "coach": { "firstName": "Adam" }
    }
  ]
}
```

**Route:** Dodac w `server/src/routes/clubs.js`:
```
router.get('/:id/attention', requireRole('clubAdmin'), getPlayersNeedingAttention)
```

---

### A2. Backend: Metryki ciaglosci sciezki
**Rozszerzyc:** `getDashboard` w clubController

**Dodac do response:**
```json
{
  "pathwayContinuity": {
    "playersWithActiveGoal": 18,
    "playersWithRecentReview": 12,
    "playersWithUpcomingActivity": 22,
    "totalPlayers": 30,
    "conversions": {
      "beginner_to_tennis10": 5,
      "tennis10_to_committed": 3,
      "committed_to_advanced": 1
    }
  }
}
```

**Logika:**
- playersWithActiveGoal: DevelopmentGoal.distinct('player', { club, status: 'active' }).length
- playersWithRecentReview: ReviewSummary.distinct('player', { club, status: 'published', publishedAt > 30 days ago }).length
- playersWithUpcomingActivity: Activity.distinct('players', { club, date > now, status: 'planned' }).length
- conversions: count z Player.pathwayHistory where stage changed w ostatnich 90 dniach

---

### A3. Frontend: Rozbudowa ClubDashboard
**Modyfikacja:** `client/src/pages/club/ClubDashboard.jsx`

**Sekcje:**

**1. Metryki glowne (4 karty):**
- Gracze (total) + ikona
- Aktywnosci (biezacy miesiac) + ikona
- Przeglady (biezacy miesiac) + ikona
- Obecnosc (%) + ikona

**2. Gracze wg etapu (horizontal bar chart lub karty):**
- Kazdy etap z Club.pathwayStages: nazwa + kolor + liczba graczy
- Klikniecie -> filtrowana lista graczy

**3. Ciaglosc sciezki (3 metryki procentowe):**
- "% graczy z aktywnym celem" — ring chart
- "% graczy z przegladem (30 dni)" — ring chart
- "% graczy z zaplanowana aktywnoscia" — ring chart

**4. Konwersje sciezki:**
- "Beginner -> Tennis 10: 5 graczy" (ostatnie 90 dni)
- Prosta lista z licznikami

**5. Gracze wymagajacy uwagi (alert section):**
- Fetch: `GET /api/clubs/:id/attention`
- Lista: avatar + imie + powod (badge) + link do profilu
- Powody przetlumaczone: "Brak aktywnosci > 14 dni", "Brak celow", etc.

**6. Nadchodzace aktywnosci:**
- Fetch: `GET /api/activities?club=:id&status=planned` (limit 5, sort date asc)
- Lista: typ badge + tytul + data + trener

---

### A4. Frontend: Strona Grupy
**Nadpisac:** `client/src/pages/shared/Groups.jsx`

**Widok per rola:**

**Coach/ClubAdmin:**
- Lista grup z: nazwa, trener, liczba graczy, pathwayStage badge, schedule
- Przycisk "Nowa grupa" -> formularz: nazwa, opis, trener (select), pathwayStage (select), maxPlayers
- Klikniecie na grupe: lista graczy, edycja, dodawanie/usuwanie graczy
- API: `GET /api/groups`, `POST /api/groups`, `PUT /api/groups/:id`

**Parent:**
- Lista grup swoich dzieci (read-only)
- Kazda grupa: nazwa, trener, harmonogram, inni gracze (imiona)

---

### A5. Narracja Tennis 10 w UI
**Modyfikacje jezykowe:**
- ClubDashboard: "Programy juniorskie" nie "Etapy"
- Pathway stages: uzywac nazw z Club.pathwayStages (np. "Czerwony kort", "Pomaranczowy kort") zamiast technicznych
- Empty states: "Dodaj pierwszego gracza do programu Tennis 10" nie "Brak graczy"
- Metryki: "Rodziny" nie "Uzytkownicy", "Sciezka rozwoju" nie "Pipeline"
- Sekcja "Gracze wymagajacy uwagi" -> "Wymagaja Twojej uwagi"

---

## Kolejnosc realizacji

| Dzien | Taski | Co powstaje |
|---|---|---|
| Pon 12 maj | A1 (backend attention endpoint) + A2 (continuity metrics) | Backend gotowy |
| Wt 13 maj | A3 (ClubDashboard — metryki + etapy + ciaglosc) | Dashboard skeleton |
| Sr 14 maj | A3 cont (attention section + nadchodzace) | Dashboard pelny |
| Czw 15 maj | A4 (Groups page) | Zarzadzanie grupami |
| Pt 16 maj | A5 (narracja Tennis 10) + polish | Jezyk klubowy |

---

## Definition of Done

- [ ] ClubAdmin widzi dashboard z 4 metrykam glownymi
- [ ] Gracze pogrupowani wg etapow z Club.pathwayStages
- [ ] Metryki ciaglosci sciezki: % z celami, % z przegladami, % z aktywnosciami
- [ ] Konwersje sciezki widoczne (ile graczy awansowalo)
- [ ] Lista "Wymagaja uwagi" z powodami
- [ ] Strona Grupy dziala z CRUD (coach/admin) i read-only (parent)
- [ ] Jezyk UI dopasowany do kontekstu klubu Tennis 10
- [ ] `vite build` przechodzi bez bledow
