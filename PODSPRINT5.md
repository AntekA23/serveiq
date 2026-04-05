# Sprint 5 — Development Logic (Goals + Observations)

**Okres**: 27 kwietnia - 3 maja 2026
**EPIC**: E5 (Cele i obserwacje)
**Cel sprintu**: Pelny workflow celow rozwojowych i obserwacji — trener definiuje, monitoruje, rodzic widzi postep.

---

## Stan zastany

### Backend — GOTOWE (pelne!)
- DevelopmentGoal model: player, title, description, category (11 opcji), timeframe, status (active/completed/paused/dropped), progress (0-100), startDate, targetDate, visibleToParent
- goalController: getGoals, createGoal, updateGoal, deleteGoal
- Observation model: player, activity, author, type (5 opcji), text, engagement/effort/mood (1-5), focusAreas[], goalRef, visibleToParent, pinned
- observationController: full CRUD
- Player model ma: skills (8 umiejetnosci), trainingPlan.focus[]

### Frontend — CZESCIOWO
- CoachPlayerProfile ma tab "Goals" z addGoal/toggleGoal (proste)
- ChildProfile ma sekcje goals (read-only, podstawowe)
- Brak pelnej strony zarzadzania celami
- Brak widoku obserwacji dla rodzica
- Brak powiazania obserwacji z celami w UI
- Brak wizualizacji postepu

---

## Taski

### A1. Frontend: Pelny widok celow w CoachPlayerProfile
**Modyfikacja:** `client/src/pages/coach/CoachPlayerProfile.jsx` — tab Goals

**Rozszerzyc o:**
- Formularz tworzenia celu: tytul, opis, kategoria (select z 11 opcji), timeframe (select), data docelowa, widocznosc dla rodzica
- API: `POST /api/goals` (istnieje)
- Lista celow z: tytul, kategoria badge, progress bar (0-100), status badge, data docelowa
- Slider/input do aktualizacji progress (PUT /api/goals/:id z { progress })
- Przyciski statusu: "Osiagniety", "Wstrzymany", "Porzucony"
- Filtr: aktywne / osiagniete / wszystkie

---

### A2. Frontend: Widok celow dla rodzica w ChildProfile
**Modyfikacja:** `client/src/pages/parent/ChildProfile.jsx`

**Rozszerzyc sekcje Goals:**
- Fetch: `GET /api/goals?player=:id` (backend juz filtruje visibleToParent)
- Karty celow: tytul + kategoria badge + progress bar + status
- Podpis: "Cel ustawiony przez [trener]"
- Sekcja "Osiagniete cele" (collapsed, expand)
- Motywujacy empty state: "Trener wkrotce ustawi cele rozwojowe"

---

### A3. Frontend: Obserwacje w CoachPlayerProfile
**Modyfikacja:** `client/src/pages/coach/CoachPlayerProfile.jsx`

**Dodac tab "Obserwacje" lub rozszerzyc istniejacy:**
- Lista obserwacji z filtrami: typ, data
- Kazda obserwacja: tekst + typ badge + data + engagement/effort/mood dots
- Jesli powiazana z celem: link "[Cel: tytul]"
- Jesli powiazana z aktywnoscia: link "[Aktywnosc: tytul]"
- Przycisk "pin" (oznacz wazne)
- Rozszerzony formularz dodawania (z A4 z Sprint 4): + powiazanie z celem (select z aktywnych celow), + powiazanie z aktywnoscia (select z ostatnich)

---

### A4. Frontend: Focus areas editor
**Modyfikacja:** `client/src/pages/coach/CoachPlayerProfile.jsx`

**Dodac w sekcji profilu gracza:**
- Tag input "Focus areas" — max 5 tagow
- Dane: Player.trainingPlan.focus[]
- Save: `PUT /api/players/:id/training-plan` z updated focus
- Rodzic widzi tagi w PlayerJourney (z Sprint 2)

---

### A5. Frontend: Wizualizacja postepu
**Modyfikacja:** ChildProfile.jsx + PlayerJourney.jsx

**Dodac:**
- Mini progress ring per cel (SVG jak skill ring w dashboardzie trenera)
- Podsumowanie: "3 z 5 celow aktywnych, 2 osiagniete"
- Streak: "Aktywnosc w 4 z ostatnich 5 tygodni" (obliczone z activities)
- Engagement trend: sredni engagement z obserwacji ostatnich 4 tygodni (jesli dane sa)

---

### A6. Demo discovery
- Przeprowadzic 3-5 demo discovery z prospektami
- Format zbierania: bol, pilnosc, brakujace elementy, gotowosc do pilotu
- Udokumentowac w prostym formacie

---

## Kolejnosc realizacji

| Dzien | Taski | Co powstaje |
|---|---|---|
| Pon 28 kwi | A1 (coach goals full UI) | Pelne zarzadzanie celami |
| Wt 29 kwi | A3 (coach observations UI) | Pelne obserwacje z powiazaniami |
| Sr 30 kwi | A2 (parent goals view) + A4 (focus areas) | Rodzic widzi cele + focus |
| Czw 1 maj | A5 (wizualizacja postepu) | Progress rings, streaks |
| Pt 2 maj | A6 (demo discovery) + polish | Feedback z rynku |

---

## Definition of Done

- [ ] Trener moze tworzyc cele z kategoria, timeframe, data docelowa
- [ ] Trener moze aktualizowac progress celu (0-100)
- [ ] Trener moze zmieniac status celu (completed/paused/dropped)
- [ ] Obserwacje sa powiazane z celami i aktywnosciami
- [ ] Focus areas edytowalne przez trenera
- [ ] Rodzic widzi cele z progress bar i statusem
- [ ] Wizualizacja: progress rings, streak, podsumowanie
- [ ] Min. 2 demo discovery przeprowadzone
- [ ] `vite build` przechodzi bez bledow
