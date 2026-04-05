# Sprint 2 — Core Entities + Parent Flow

**Okres**: 6-12 kwietnia 2026
**EPICi**: E1 (Tozsamosc i profile), E2 (Model sciezki gracza)
**Cel sprintu**: Rodzic moze w pelni zarzadzac swoimi dziecmi po onboardingu. Gracz ma widoczna sciezke rozwoju z etapami i progresja.

---

## Stan zastaany (co juz istnieje)

### Backend — GOTOWE
- `POST /api/players/self` — rodzic tworzy dziecko (createPlayerSelf, playerController:483-516)
- `GET /api/players` — lista graczy filtrowana per rola
- `GET /api/players/:id` — szczegoly gracza
- `PUT /api/players/:id` — aktualizacja gracza (coach only!)
- `DELETE /api/players/:id` — soft delete (active=false, coach only!)
- Model Player ma: pathwayStage, pathwayHistory[], developmentLevel
- Model Club ma: pathwayStages[] z 7 domyslnymi etapami (Czerwony -> Dorosly Rekreacja)
- Model DevelopmentGoal — pelny CRUD w goalController

### Backend — BRAKUJE
- Rodzic NIE MOZE edytowac gracza (PUT /players/:id sprawdza `coach` role)
- Rodzic NIE MOZE usunac gracza
- Brak pola `nextStep` na Player (rekomendowany nastepny krok)
- Brak endpointu do zmiany pathwayStage z automatycznym wpisem do pathwayHistory

### Frontend — GOTOWE
- Onboarding z krokiem "dodaj dziecko" (Onboarding.jsx:124-223)
- Dashboard z selektorem dzieci i przyciskiem "Dodaj trenera"
- ChildProfile.jsx — hero + skills + goals (podstawowy)

### Frontend — BRAKUJE
- `MyChildren.jsx` — placeholder "Sprint 03"
- Brak mozliwosci dodania dziecka po onboardingu
- Brak edycji profilu dziecka przez rodzica
- Brak widoku etapow sciezki (pathway stepper)
- Brak PlayerJourney component
- Brak wyswietlania "nastepny krok" od trenera

---

## Taski

### A1. Backend: Rodzic moze edytowac i usuwac swoje dziecko
**Plik:** `server/src/controllers/playerController.js`

**Co zmienic:**
- Funkcja `updatePlayer` (~linia 350) — obecnie sprawdza `if (req.user.role !== 'coach')`. Dodac warunek: jesli `parent` i gracz jest w `parentProfile.children`, pozwol na edycje **ograniczonego zestawu pol**: firstName, lastName, dateOfBirth, gender, avatarUrl.
- Funkcja `deletePlayer` (~linia 440) — obecnie coach only. Dodac: jesli `parent` i gracz jest w `parentProfile.children` i gracz NIE MA przypisanego coach, pozwol na soft delete. Usunac tez z `parentProfile.children`.

**Dokladna zmiana w updatePlayer:**
```
// Przed: if (req.user.role !== 'coach') return 403
// Po:
if (req.user.role === 'parent') {
  const isMyChild = req.user.parentProfile?.children?.some(c => c.toString() === req.params.id)
  if (!isMyChild) return res.status(403).json({ message: 'Brak dostepu' })
  // Rodzic moze zmieniac tylko podstawowe pola
  const { firstName, lastName, dateOfBirth, gender } = req.body
  const player = await Player.findByIdAndUpdate(req.params.id,
    { firstName, lastName, dateOfBirth, gender }, { new: true })
  return res.json(player)
}
```

---

### A2. Backend: Pole nextStep na Player
**Plik:** `server/src/models/Player.js`

**Dodac pole:**
```
nextStep: {
  text: String,
  updatedAt: Date,
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}
```

**Plik:** `server/src/controllers/playerController.js`
- W `updatePlayer` dla coach: pozwolic na update `nextStep`
- Przy ustawieniu nextStep: automatycznie ustawic updatedAt = Date.now, updatedBy = req.user._id

---

### A3. Backend: Zmiana pathwayStage z historia
**Plik:** `server/src/controllers/playerController.js`

**W updatePlayer dla coach, dodac logike:**
```
if (body.pathwayStage && body.pathwayStage !== player.pathwayStage) {
  // Zamknij poprzedni etap
  if (player.pathwayHistory?.length > 0) {
    const last = player.pathwayHistory[player.pathwayHistory.length - 1]
    if (!last.endDate) last.endDate = new Date()
  }
  // Dodaj nowy etap
  player.pathwayHistory.push({
    stage: body.pathwayStage,
    startDate: new Date(),
    notes: body.pathwayStageNotes || ''
  })
  player.pathwayStage = body.pathwayStage
}
```

---

### A4. Frontend: Strona "Moje dzieci" z lista + dodawanie
**Nadpisac:** `client/src/pages/shared/MyChildren.jsx`

**Struktura komponentu:**
```
MyChildren
  ├── Naglowek "Moje dzieci" + przycisk "Dodaj dziecko"
  ├── Lista dzieci (karty):
  │     ├── Avatar + imie + nazwisko
  │     ├── Wiek (obliczony z dateOfBirth)
  │     ├── Etap sciezki (pathwayStage badge)
  │     ├── Trener (coach.firstName jesli przypisany, "Brak" jesli nie)
  │     ├── Przycisk "Zobacz profil" -> /parent/child/:id
  │     └── Przycisk "Edytuj" -> otwiera modal
  ├── Empty state: "Dodaj swoje pierwsze dziecko" jesli brak
  └── AddChildModal (formularz dodawania)
```

**API calls:**
- `GET /api/players` — fetch listy, filtruj po parentProfile.children
- `POST /api/players/self` — dodanie nowego dziecka (body: firstName, lastName, dateOfBirth, gender)

**Formularz AddChildModal:**
- Pola: imie (required, min 2), nazwisko (required, min 2), data urodzenia (date input), plec (select M/F)
- Przycisk "Dodaj" z loading state
- Po sukcesie: odswiezenie listy, toast, zamkniecie

---

### A5. Frontend: Edycja profilu dziecka
**Nowy:** `client/src/components/modals/EditChildModal.jsx`
**Uzycie w:** MyChildren.jsx

**Formularz:**
- Pola: imie, nazwisko, data urodzenia, plec (prefilled z danych dziecka)
- Submit -> `PUT /api/players/:id`
- Po sukcesie: odswiezenie listy, toast

---

### A6. Frontend: Pathway stepper w ChildProfile
**Modyfikacja:** `client/src/pages/parent/ChildProfile.jsx`

**Co dodac:**
- Komponent wizualny pod hero section:
  - 7 etapow z Club.pathwayStages (lub hardcoded defaults):
    `Czerwony -> Pomaranczowy -> Zielony -> Tennis 10 Open -> Zawodnik -> Performance -> Dorosly`
  - Aktualny etap podswietlony (accent color)
  - Poprzednie etapy zaznaczone jako ukonczone
  - Przyszle etapy wyszarzone
- Pod stepperem: `developmentLevel` badge

**Dane:** Player.pathwayStage, Player.developmentLevel (juz w modelu)

---

### A7. Frontend: Player Journey Summary
**Nowy:** `client/src/components/player/PlayerJourney.jsx`
**Uzycie w:** ChildProfile.jsx

**Struktura:**
```
PlayerJourney
  ├── Karta "Aktualny etap" — pathwayStage + od kiedy (z pathwayHistory)
  ├── Karta "Aktywne cele" — fetch z GET /api/goals?player=X&status=active
  │     └── Lista: tytul + kategoria badge + progress bar
  ├── Karta "Aktualny focus" — Player.trainingPlan.focus[] jako tagi
  ├── Karta "Nastepny krok" — Player.nextStep.text (read-only, ustawiony przez trenera)
  │     └── "Ustawiony przez [imie trenera] dnia [data]"
  └── Karta "Ostatnia obserwacja" — fetch z GET /api/observations?player=X (limit 1, sort desc)
```

**API calls:**
- `GET /api/goals?player=:id&status=active`
- `GET /api/observations?player=:id` (limit 1)
- Dane z Player object: pathwayStage, pathwayHistory, trainingPlan.focus, nextStep

---

### A8. Frontend: Przycisk "Dodaj dziecko" na Dashboard
**Modyfikacja:** `client/src/pages/parent/Dashboard.jsx`

**Co zmienic:**
- Obok istniejacego "Dodaj trenera" dodac "Dodaj dziecko" (link do /my-children)
- Empty state (brak dzieci): zmienic tekst z "Poprosu trenera..." na "Dodaj swoje pierwsze dziecko" z przyciskiem -> /my-children

---

### A9. Frontend: Trener moze ustawic nextStep i pathwayStage
**Modyfikacja:** `client/src/pages/coach/CoachPlayerProfile.jsx`

**Co dodac:**
- W headerze gracza: dropdown do zmiany pathwayStage (select z etapami)
- Nowa sekcja/tab "Sciezka" z:
  - Aktualny etap
  - Input "Nastepny krok" (textarea) z przyciskiem "Zapisz"
  - Historia etapow (pathwayHistory lista)
- Submit -> `PUT /api/players/:id` z body `{ pathwayStage, nextStep: { text } }`

---

## Kolejnosc realizacji

| Dzien | Taski | Co powstaje |
|---|---|---|
| Pon 7 kwi | A1, A2, A3 | Backend gotowy: parent CRUD + nextStep + pathway history |
| Wt 8 kwi | A4 (MyChildren + AddChildModal) | Rodzic dodaje dzieci |
| Sr 9 kwi | A5 (EditChildModal) + A8 (Dashboard button) | Pelny CRUD + nawigacja |
| Czw 10 kwi | A6 (Pathway stepper) + A7 (PlayerJourney) | Widok sciezki gracza |
| Pt 11 kwi | A9 (Trener: nextStep + pathwayStage) + testy | Zamknieta petla trener-rodzic |

---

## Definition of Done

- [ ] Rodzic moze dodac dziecko z /my-children (nie tylko onboarding)
- [ ] Rodzic moze edytowac imie/nazwisko/date/plec dziecka
- [ ] Lista "Moje dzieci" wyswietla wszystkie dzieci z info
- [ ] Profil dziecka pokazuje pathway stepper z aktualnym etapem
- [ ] PlayerJourney pokazuje: etap, cele, focus, nastepny krok, obserwacje
- [ ] Trener moze zmienic pathwayStage (z automatyczna historia)
- [ ] Trener moze ustawic nextStep widoczny dla rodzica
- [ ] Dashboard rodzica ma "Dodaj dziecko" + lepszy empty state
- [ ] `vite build` przechodzi bez bledow
