# Sprint 5 — Development Logic

**Okres**: 27 kwietnia - 3 maja 2026
**EPIC**: E5 (Cele i obserwacje)
**Cel sprintu**: Cele rozwojowe, focus areas i obserwacje dzialajace — trener definiuje cele, loguje postep, rodzic widzi rozwoj dziecka.

---

## Taski

### A1. Cele rozwojowe per gracz
**Pliki:**
- Sprawdzic: `server/src/models/DevelopmentGoal.js` (istnieje)
- Frontend: sekcja celow w profilu gracza (widok trenera + rodzica)

**Co zbudowac:**
- Trener moze tworzyc cele rozwojowe:
  - Tytul (np. "Poprawic serwis plaski")
  - Kategoria (technika, taktyka, kondycja, mentalnosc, inne)
  - Timeframe (daty od-do)
  - Status (aktywny, osiagniety, porzucony)
  - Opis/notatki
- Cele widoczne w profilu gracza
- Rodzic widzi cele (read-only)

---

### A2. Focus areas per gracz
**Pliki:**
- Modyfikacja Player model jesli trzeba
- Frontend w profilu gracza

**Co zbudowac:**
- Aktywne focus areas (max 3-5) — krotkie tagi/etykiety
- Trener ustawia, rodzic widzi
- Wyswietlane prominentnie w profilu i player journey
- Przyklady: "Forehand topspinowy", "Poruszanie sie na korcie", "Pewnosc siebie"

---

### A3. Wpisy obserwacji / postepu
**Pliki:**
- Sprawdzic: `server/src/models/Observation.js` (istnieje)
- Frontend: formularz obserwacji w profilu gracza (trener)

**Co zbudowac:**
- Trener moze dodac obserwacje:
  - Tekst
  - Powiazany cel (opcjonalnie)
  - Powiazana aktywnosc (opcjonalnie)
  - Typ: obserwacja / postep / wyzwanie
- Obserwacje pojawiaja sie w timeline
- Rodzic widzi obserwacje oznaczone jako widoczne

---

### A4. Focus + obserwacja w Player Journey
**Pliki:**
- Modyfikacja: `client/src/components/player/PlayerJourney.jsx`

**Co zbudowac:**
- Sekcja "Aktywne cele" z postepem
- Sekcja "Aktualny focus" z tagami
- Ostatnia obserwacja z data i autorem
- Czytelne karty dla rodzica

---

### A5. Proste markery progresji
**Pliki:**
- Frontend w profilu gracza

**Co zbudowac:**
- Wizualne markery: ile celow osiagnietych vs aktywnych
- Mini-chart lub progress bar per cel
- "Streak" — ile tygodni z kolei byla aktywnosc

---

### A6. Realne demo discovery
**Zadanie manualne:**
- Przeprowadzic 3-5 demo discovery z cieplymy prospektami
- Zbierac reakcje w formacie: bol, pilnosc, brakujace elementy, gotowosc do pilotu
- Dokumentowac w prostym doc/sheet

---

## Kolejnosc realizacji

| Dzien | Taski |
|---|---|
| Pon 28 kwi | A1 (cele rozwojowe — backend + frontend) |
| Wt 29 kwi | A2 (focus areas) |
| Sr 30 kwi | A3 (obserwacje) |
| Czw 1 maj | A4 (player journey update) |
| Pt 2 maj | A5 (markery) + A6 (demo discovery) |

---

## Definition of Done

- [ ] Trener moze tworzyc, edytowac i zamykac cele rozwojowe
- [ ] Focus areas widoczne w profilu gracza
- [ ] Trener moze logowac obserwacje powiazane z celami
- [ ] Player Journey pokazuje cele, focus, ostatnia obserwacje
- [ ] Rodzic widzi postep dziecka bez zargonu
- [ ] Przeprowadzono min. 2 demo discovery
- [ ] `vite build` przechodzi bez bledow
