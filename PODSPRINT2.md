# Sprint 2 — Core Entities + Parent Flow

**Okres**: 6-12 kwietnia 2026
**EPICi**: E1 (Tozsamosc i profile), E2 (Model sciezki gracza)
**Cel sprintu**: Rodzic moze w pelni zarzadzac swoimi dziecmi, gracz ma widoczna sciezke rozwoju z etapami i markerami progresji.

---

## Kontekst — co juz istnieje

### Backend (gotowe)
- `POST /api/players/self` — rodzic tworzy dziecko (playerController.createPlayerSelf)
- `GET /api/players` — lista graczy (filtrowana per rola)
- `GET /api/players/:id` — szczegoly gracza
- `PUT /api/players/:id` — aktualizacja gracza
- Model Player z polami: firstName, lastName, dateOfBirth, gender, coach, coaches[], parents[], skills, trainingPlan, pathwayStage, pathwayHistory, developmentLevel
- Model User z parentProfile.children[]
- Onboarding flow — dodaje 1 dziecko przy rejestracji
- Coach invite code flow — dzialajacy

### Frontend (gotowe)
- Onboarding z krokiem "dodaj dziecko" (tylko przy rejestracji)
- Dashboard rodzica z selektorem dzieci
- Profil dziecka (ChildProfile.jsx) — podstawowy
- Sidebar z linkiem "Moje dzieci" -> placeholder "Sprint 03"

### Czego brakuje
- Strona "Moje dzieci" (CRUD) — placeholder
- Brak mozliwosci dodania dziecka PO onboardingu
- Brak edycji profilu dziecka przez rodzica
- Brak modelu etapow sciezki w UI
- Brak widoku podrozy gracza (player journey)
- Brak markerow progresji w UI

---

## Taski

### Blok A — Rodzic zarzadza dziecmi (priorytet krytyczny)

#### A1. Strona "Moje dzieci" z lista + przycisk dodaj
**Pliki:**
- Nadpisac: `client/src/pages/shared/MyChildren.jsx`

**Co zbudowac:**
- Lista dzieci rodzica z: avatar, imie, nazwisko, wiek, etap rozwoju, przycisk "Zobacz profil"
- Przycisk "Dodaj dziecko" otwierajacy modal/formularz
- Fetch z `GET /api/players` filtrowany po parentProfile.children
- Klikniecie na dziecko -> nawigacja do `/parent/child/:id`

**API:** `GET /api/players` (istnieje)

---

#### A2. Modal/formularz dodawania dziecka
**Pliki:**
- Nowy: `client/src/components/modals/AddChildModal.jsx`
- Modyfikacja: `client/src/pages/shared/MyChildren.jsx`

**Co zbudowac:**
- Formularz: imie (required), nazwisko (required), data urodzenia (date picker), plec (M/F select)
- Walidacja inline
- Submit -> `POST /api/players/self`
- Po sukcesie: odswiezenie listy, toast "Dziecko dodane", zamkniecie modala
- Stan loading na przycisku

**API:** `POST /api/players/self` (istnieje, dziala)

---

#### A3. Edycja profilu dziecka przez rodzica
**Pliki:**
- Modyfikacja: `client/src/pages/parent/ChildProfile.jsx`

**Co zbudowac:**
- Przycisk "Edytuj" na profilu dziecka
- Formularz edycji: imie, nazwisko, data urodzenia, plec, avatar
- Submit -> `PUT /api/players/:id`
- Walidacja: rodzic moze edytowac tylko swoje dzieci (backend juz to sprawdza)

**API:** `PUT /api/players/:id` (istnieje)

---

#### A4. Usuwanie dziecka z listy rodzica
**Pliki:**
- Modyfikacja: `client/src/pages/shared/MyChildren.jsx`
- Modyfikacja backend jesli brak: `server/src/controllers/playerController.js`

**Co zbudowac:**
- Przycisk "Usun" z potwierdzeniem (modal "Czy na pewno chcesz usunac?")
- Endpoint: `DELETE /api/players/:id` (sprawdzic czy istnieje, jesli nie — dodac)
- Usuniecie gracza z Player collection + z parentProfile.children

**Uwaga:** Sprawdzic czy endpoint DELETE istnieje. Jesli nie — dodac w playerController.

---

### Blok B — Model sciezki gracza (pathway)

#### B1. Etapy sciezki w profilu gracza
**Pliki:**
- Modyfikacja: `client/src/pages/parent/ChildProfile.jsx`

**Co zbudowac:**
- Wizualna prezentacja aktualnego etapu (pathwayStage):
  - `beginner` -> Tennis 10 -> `committed` -> `advanced` -> `performance`
- Progressbar lub stepper z podswietlonym aktualnym etapem
- Pod spodem: developmentLevel z modelu Player
- Sekcja "Historia sciezki" z pathwayHistory (jesli istnieje)

**Dane:** Player.pathwayStage, Player.pathwayHistory, Player.developmentLevel (pola istnieja w modelu)

---

#### B2. Widok podrozy gracza (Player Journey Summary)
**Pliki:**
- Nowy: `client/src/components/player/PlayerJourney.jsx`
- Uzycie w: `client/src/pages/parent/ChildProfile.jsx`

**Co zbudowac:**
- Komponent pokazujacy:
  - Aktualny etap sciezki
  - Aktywne cele (z DevelopmentGoal jesli istnieja)
  - Ostatnia aktywnosc/sesja
  - Ostatni przeglad (jesli istnieje)
  - Rekomendowany nastepny krok (pole tekstowe, ustawiane przez trenera)
- Ukladany jako karta w profilu dziecka

---

#### B3. Pole "Nastepny krok" (trener moze ustawic)
**Pliki:**
- Modyfikacja: `server/src/models/Player.js` — dodac pole `nextStep: String`
- Modyfikacja: `server/src/controllers/playerController.js` — pozwolic trenerowi na update tego pola
- Wyswietlanie: w PlayerJourney i ChildProfile

**Co zbudowac:**
- Na backendzie: nowe pole `nextStep` w Player schema
- Trener moze ustawic przez PUT /api/players/:id
- Rodzic widzi w profilu dziecka (read-only)

---

#### B4. Przypisanie/zmiana etapu sciezki (trener)
**Pliki:**
- Modyfikacja: widok trenera profilu gracza (sprawdzic jaki plik)

**Co zbudowac:**
- Trener moze zmienic pathwayStage gracza (dropdown/select)
- Zmiana automatycznie dodaje wpis do pathwayHistory z data i notatka
- Backend: obsluga w PUT /api/players/:id (dodac logike historii)

---

### Blok C — Poprawki UX i nawigacja

#### C1. Aktualizacja Dashboard rodzica
**Pliki:**
- Modyfikacja: `client/src/pages/parent/Dashboard.jsx`

**Co zbudowac:**
- Dodac przycisk "Dodaj dziecko" obok "Dodaj trenera"
- Jesli brak dzieci: zmiana empty state na "Dodaj swoje pierwsze dziecko" z przyciskiem do /my-children
- Wyswietlic etap sciezki dziecka pod imieniem w selektorze

---

#### C2. Aktualizacja Sidebar
**Pliki:**
- Modyfikacja: `client/src/components/layout/Sidebar/Sidebar.jsx`

**Co zbudowac:**
- Upewnic sie ze "Moje dzieci" link dziala (wskazuje na /my-children)
- Rozwazyc dodanie badge z liczba dzieci

---

## Kolejnosc realizacji (priorytet)

| Dzien | Taski | Dlaczego |
|---|---|---|
| Pon 7 kwi | A1, A2 | Krytyczne — rodzic musi moc dodac dzieci |
| Wt 8 kwi | A3, A4 | Pelne CRUD na dzieciach |
| Sr 9 kwi | B1, B3 | Etapy sciezki + pole nastepny krok |
| Czw 10 kwi | B2, B4 | Widok podrozy + trener zmienia etap |
| Pt 11 kwi | C1, C2 | Polish + nawigacja + demo check |

---

## Definition of Done

- [ ] Rodzic moze dodac dziecko z poziomu "Moje dzieci" (nie tylko onboarding)
- [ ] Rodzic moze edytowac profil dziecka
- [ ] Rodzic widzi liste swoich dzieci z podstawowymi info
- [ ] Profil dziecka pokazuje aktualny etap sciezki (stepper/progressbar)
- [ ] Profil dziecka pokazuje "Nastepny krok" ustawiony przez trenera
- [ ] Trener moze zmienic etap sciezki gracza
- [ ] Trener moze ustawic pole "Nastepny krok"
- [ ] Dashboard rodzica ma przycisk "Dodaj dziecko"
- [ ] Empty state Dashboard prowadzi do dodania dziecka
- [ ] `vite build` przechodzi bez bledow

---

## Metryki sukcesu sprintu

**Produkt:** Rodzic moze w pelni zarzadzac dziecmi i widziec ich sciezke rozwoju bez pomocy trenera.

**Demo:** Mozna pokazac pelna podroz: rejestracja rodzica -> dodanie dziecka -> widok sciezki -> trener ustawia etap i nastepny krok -> rodzic widzi aktualizacje.
