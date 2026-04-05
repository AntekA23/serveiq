# Sprint 4 — Internal MVP v0.1 (Timeline + Communication)

**Okres**: 20-26 kwietnia 2026
**EPIC**: E4 (Timeline i komunikacja)
**Cel sprintu**: Wspolny timeline per gracz ciagnacy z wielu zrodel. Trener dodaje notatki, rodzic widzi aktualizacje. Pierwsze wewnetrzne demo.

---

## Stan zastany

### Backend — GOTOWE
- Observation model z typami: progress, concern, highlight, participation, general
- observationController: CRUD + filtry per player, activity
- Pola: text, engagement/effort/mood (1-5), focusAreas[], goalRef, visibleToParent, pinned
- Recommendation model z typami: pathway-advance, focus-change, activity-suggest, workload-adjust, support-need, general
- recommendationController: CRUD
- Activity, DevelopmentGoal — pelne CRUD
- `GET /api/players/:id/timeline` — endpoint istnieje (w healthController), ale **trzeba sprawdzic co zwraca**

### Backend — BRAKUJE / DO SPRAWDZENIA
- Endpoint timeline moze byc niekompletny (pochodzi ze starego healthControllera)
- Brak agregacji timeline z wielu zrodel (activities + observations + recommendations + pathwayHistory + goals)

### Frontend — BRAKUJE
- `client/src/pages/shared/Timeline.jsx` — placeholder
- Brak komponentu PlayerTimeline
- Brak szybkiego formularza notatki/obserwacji w profilu gracza

---

## Taski

### A1. Backend: Unified Timeline endpoint
**Plik:** `server/src/controllers/timelineController.js` (istnieje — sprawdzic i rozszerzyc)

**Endpoint:** `GET /api/timeline?player=:id&limit=20&offset=0`

**Co powinien zwrocic (posortowane po dacie desc):**
```json
{
  "items": [
    { "type": "activity", "date": "...", "data": { ...activity } },
    { "type": "observation", "date": "...", "data": { ...observation } },
    { "type": "recommendation", "date": "...", "data": { ...recommendation } },
    { "type": "review", "date": "...", "data": { ...review } },
    { "type": "goal_created", "date": "...", "data": { ...goal } },
    { "type": "goal_completed", "date": "...", "data": { ...goal } },
    { "type": "pathway_change", "date": "...", "data": { stage, notes } },
    { "type": "next_step", "date": "...", "data": { text, updatedBy } }
  ],
  "total": 42,
  "hasMore": true
}
```

**Logika:**
1. Fetch z 5 kolekcji rownolegle (Promise.all):
   - Activity.find({ players: playerId })
   - Observation.find({ player: playerId })
   - Recommendation.find({ player: playerId })
   - ReviewSummary.find({ player: playerId, status: 'published' }) — dla parent
   - DevelopmentGoal.find({ player: playerId })
2. Player.pathwayHistory i Player.nextStep
3. Merge, sortuj po dacie, paginuj
4. Dla rodzica: filtruj visibleToParent=true

---

### A2. Frontend: Komponent PlayerTimeline
**Nowy:** `client/src/components/player/PlayerTimeline.jsx`

**Struktura:**
```
PlayerTimeline ({ playerId })
  ├── Fetch: GET /api/timeline?player=:id
  ├── Lista elementow (vertical timeline):
  │     ├── activity: ikona typu + tytul + data + gracze
  │     ├── observation: ikona typu (progress=zielony, concern=czerwony, highlight=zolty) + tekst + autor
  │     ├── recommendation: ikona priorytetu + tytul + opis + status badge
  │     ├── review: ikona + "Przeglad [okres]" + status
  │     ├── goal_created: ikona + "Nowy cel: [tytul]"
  │     ├── goal_completed: ikona checkmark + "Cel osiagniety: [tytul]"
  │     ├── pathway_change: ikona strzalki + "Zmiana etapu na [stage]"
  │     └── next_step: ikona kompasu + "[tekst]" + "ustawiony przez [imie]"
  ├── Data separators (dzien/tydzien)
  └── "Zaladuj wiecej" button (jesli hasMore)
```

**Kolory per typ:**
- activity: blue
- observation.progress: green
- observation.concern: red
- observation.highlight: amber
- recommendation: purple
- review: accent
- goal: teal
- pathway_change: accent
- next_step: accent-muted

---

### A3. Frontend: Strona Timeline
**Nadpisac:** `client/src/pages/shared/Timeline.jsx`

**Widok:**
- Dla rodzica: wybor dziecka (jesli wiele) + PlayerTimeline
- Dla trenera: wybor gracza (dropdown) + PlayerTimeline
- Filtr: typ wpisu (checkbox multi-select)

---

### A4. Frontend: Szybka notatka trenera (Quick Observation)
**Modyfikacja:** `client/src/pages/coach/CoachPlayerProfile.jsx`

**Dodac na gorze profilu gracza:**
- Pole textarea "Szybka notatka..." + select typu (progress/concern/highlight/general)
- Opcjonalny: engagement/effort/mood (1-5 stars/dots)
- Toggle "Widoczne dla rodzica"
- Przycisk "Dodaj"
- Submit: `POST /api/observations` z body { player, text, type, engagement, effort, mood, visibleToParent }
- Po dodaniu: notatka pojawia sie w timeline ponizej

---

### A5. Frontend: Parent-friendly timeline w ChildProfile
**Modyfikacja:** `client/src/pages/parent/ChildProfile.jsx`

**Dodac sekcje "Ostatnie aktualizacje":**
- Uzycie komponentu PlayerTimeline z limit=5
- Link "Zobacz pelna historie" -> /timeline
- Filtrowanie: tylko visibleToParent=true (backend juz to robi)

---

### A6. Polish 3 kluczowych ekranow
1. **Dashboard rodzica** — czyste karty, spojny styl, responsive
2. **ChildProfile** — pathway stepper + journey + timeline + aktywnosci (wszystko z S2-S4)
3. **CoachPlayerProfile** — quick note + timeline + skills + goals + plan

**Checklist:**
- Empty states z CTA
- Loading skeletony (nie pusty ekran)
- Error toast na kazdy failed fetch
- Mobile: sidebar zamyka sie, karty stackuja sie

---

### A7. Demo prep
**Przygotowac:**
- Scenariusz demo 10 min (dokument)
- Dane demo w bazie (kilku graczy, aktywnosci, obserwacje, cele)
- 3-5 terminow demo umowionych

---

## Kolejnosc realizacji

| Dzien | Taski | Co powstaje |
|---|---|---|
| Pon 21 kwi | A1 (backend unified timeline) | Endpoint agregujacy timeline |
| Wt 22 kwi | A2 (PlayerTimeline component) | Komponent timeline |
| Sr 23 kwi | A3 (Timeline page) + A4 (quick observation) | Strona + notatki trenera |
| Czw 24 kwi | A5 (ChildProfile integration) + A6 (polish) | Spojne UI |
| Pt 25 kwi | A7 (demo prep) + finalne testy | Gotowoc do demo |

---

## Definition of Done

- [ ] Unified timeline endpoint zwraca dane z 5+ zrodel posortowane po dacie
- [ ] PlayerTimeline renderuje rozne typy wpisow z kolorami/ikonami
- [ ] Strona Timeline dziala dla trenera (wybor gracza) i rodzica (wybor dziecka)
- [ ] Trener moze dodac szybka notatke z profilu gracza
- [ ] ChildProfile ma sekcje "Ostatnie aktualizacje"
- [ ] 3 ekrany dopracowane (responsive, empty states, loading)
- [ ] Skrypt demo gotowy + dane demo w bazie
- [ ] 3-5 demo zaplanowanych
- [ ] `vite build` przechodzi bez bledow

**CHECKPOINT: Wewnetrzne MVP v0.1 — Plan + Komunikacja + Monitoring**
