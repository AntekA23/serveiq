# Sprint 3 — Planning Backbone

**Okres**: 13-19 kwietnia 2026
**EPIC**: E3 (Planowanie aktywnosci)
**Cel sprintu**: Generyczny model aktywnosci dzialajacy end-to-end — trener i rodzic moga planowac, przegladac i zarzadzac aktywnosciami przypisanymi do graczy.

---

## Kontekst

Model Activity juz istnieje (`server/src/models/Activity.js`), controller (`activityController.js`), route (`activities.js`). Trzeba zweryfikowac kompletnosc i zbudowac pelny frontend.

---

## Taski

### A1. Weryfikacja i rozszerzenie modelu Activity
**Pliki:** `server/src/models/Activity.js`, `server/src/controllers/activityController.js`

**Wymagane typy aktywnosci:**
- `class` (zajecia)
- `camp` (oboz)
- `tournament` (turniej)
- `training` (trening)
- `match` (mecz)
- `fitness` (kondycja)
- `review` (przeglad)
- `other` (inne)

**Wymagane pola:**
- title, type, date, startTime, endTime, durationMinutes
- players[] (ref Player)
- coach (ref User)
- notes, status (planned/completed/cancelled)
- location (opcjonalnie)

**Do sprawdzenia:** Czy istniejacy model pokrywa wszystkie typy i pola. Jesli nie — rozszerzyc.

---

### A2. CRUD aktywnosci — frontend trenera
**Pliki:**
- Nowy: `client/src/pages/coach/Activities.jsx` lub modyfikacja istniejacego
- Sprawdzic czy `client/src/pages/shared/Activities.jsx` jest placeholderem

**Co zbudowac:**
- Lista aktywnosci trenera (filtrowanie po typie, dacie)
- Formularz tworzenia aktywnosci (typ, tytul, data, czas, gracze, notatki)
- Edycja istniejaceej aktywnosci
- Usuwanie z potwierdzeniem
- Multi-select graczy przy tworzeniu

---

### A3. Widok aktywnosci dla rodzica
**Pliki:**
- Modyfikacja: `client/src/pages/parent/ChildProfile.jsx` lub nowa sekcja

**Co zbudowac:**
- Lista nadchodzacych aktywnosci dziecka (read-only)
- Historia aktywnosci (ostatnie)
- Filtr po typie
- Klikniecie -> szczegoly aktywnosci

---

### A4. Przypisywanie aktywnosci do graczy
**Pliki:** controller + frontend

**Co zbudowac:**
- Przy tworzeniu aktywnosci: checkbox lista graczy trenera
- Mozliwosc dodania/usuniecia graczy po fakcie (edycja)
- Widok "Kto uczestniczy" w szczegolach aktywnosci

---

### A5. Timeline/lista aktywnosci per gracz
**Pliki:**
- Modyfikacja: `client/src/pages/parent/ChildProfile.jsx`
- Komponent: reuzywalna lista aktywnosci

**Co zbudowac:**
- Sekcja "Nadchodzace" i "Ostatnie" w profilu dziecka
- Kolorowe kropki wg typu (jak w SessionRow na dashboardzie trenera)
- Sortowanie po dacie

---

### A6. Walidacja modelu vs scenariusze
**Zadanie manualne:**
- Sprawdzic czy model obsluguje scenariusz Tennis 10 (klasy, obozy, eventy)
- Sprawdzic czy model obsluguje scenariusz Sonia (treningi, turnieje, fitness, przeglady)
- Udokumentowac luki jesli sa

---

## Kolejnosc realizacji

| Dzien | Taski | Dlaczego |
|---|---|---|
| Pon 14 kwi | A1 | Fundament — model musi byc kompletny |
| Wt 15 kwi | A2 (lista + tworzenie) | Trener musi moc planowac |
| Sr 16 kwi | A2 (edycja + usuwanie), A4 | Pelny CRUD + przypisanie graczy |
| Czw 17 kwi | A3, A5 | Rodzic widzi aktywnosci dziecka |
| Pt 18 kwi | A6 + polish | Walidacja scenariuszy + czyszczenie |

---

## Definition of Done

- [ ] Trener moze tworzyc aktywnosci z wyborem typu i przypisaniem graczy
- [ ] Trener moze edytowac i usuwac aktywnosci
- [ ] Rodzic widzi nadchodzace i ostatnie aktywnosci dziecka
- [ ] Aktywnosci wyswietlaja sie w profilu gracza
- [ ] Model obsluguje wszystkie 8 typow aktywnosci
- [ ] Scenariusze Tennis 10 i Sonia sa pokryte
- [ ] `vite build` przechodzi bez bledow
