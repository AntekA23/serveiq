# Sprint 7 — Club Relevance

**Okres**: 11-17 maja 2026
**EPIC**: E7 (Dashboard klubu)
**Cel sprintu**: Wlasciciel klubu widzi wartosc — dashboard z widokiem grup, etapow, aktywnosci i graczy wymagajacych uwagi.

---

## Taski

### A1. Dashboard klubu / grup
**Pliki:**
- Modyfikacja: `client/src/pages/club/ClubDashboard.jsx`
- Backend: `server/src/controllers/clubController.js`

**Co zbudowac:**
- Widok glowny dla clubAdmin:
  - Liczba graczy (total, per etap)
  - Liczba aktywnych trenerow
  - Nadchodzace aktywnosci
  - Gracze bez aktywnosci w ostatnich 2 tygodniach
  - Mini-chart: nowi gracze / miesiac

---

### A2. Grupowanie graczy wg etapu
**Pliki:**
- Nowy komponent lub sekcja w ClubDashboard

**Co zbudowac:**
- Tabela/karty grupujace graczy po pathwayStage:
  - Beginner | Tennis 10 | Committed | Advanced | Performance
- Dla kazdej grupy: liczba graczy, sredni wiek, ostatnia aktywnosc
- Klikniecie na grupe -> lista graczy

---

### A3. Ostatnia aktywnosc / nastepna aktywnosc
**Pliki:**
- ClubDashboard lub osobna sekcja

**Co zbudowac:**
- Lista nadchodzacych aktywnosci klubu (wszystkie typy)
- Filtr po typie i trenerze
- Lista ostatnich aktywnosci z uczestnictwem

---

### A4. Gracze wymagajacy uwagi
**Pliki:**
- Backend: nowy endpoint lub logika w clubController
- Frontend: sekcja w ClubDashboard

**Co zbudowac:**
- Algorytm "wymaga uwagi":
  - Brak aktywnosci > 14 dni
  - Brak przegladu > 30 dni
  - Brak celu rozwojowego
  - Etap "beginner" > 3 miesiace bez zmiany
- Lista z imieniem, powodem, przyciskiem "Zobacz profil"

---

### A5. Wskazniki ciaglosci sciezki (pathway continuity)
**Pliki:**
- ClubDashboard

**Co zbudowac:**
- Metryki:
  - % graczy z aktywnym celem
  - % graczy z przegladem w ostatnich 30 dniach
  - % graczy z zaplanowana nastepna aktywnoscia
  - Konwersja: beginner -> tennis10 -> committed (liczby)
- Proste liczby/karty, bez skomplikowanych chartow

---

### A6. Narracja Tennis 10 w UI
**Zadanie design:**
- Upewnic sie ze dashboard "mowi jezykiem klubu":
  - "Program Tennis 10" nie "Etap beginner"
  - "Rodziny" nie "Uzytkownicy"
  - "Sciezka rozwoju" nie "Pipeline"
- Dostosowac etykiety i empty states

---

## Kolejnosc realizacji

| Dzien | Taski |
|---|---|
| Pon 12 maj | A1 (dashboard skeleton + metryki) |
| Wt 13 maj | A2 (grupowanie po etapach) |
| Sr 14 maj | A3 (aktywnosci klubu) |
| Czw 15 maj | A4 (gracze wymagajacy uwagi) |
| Pt 16 maj | A5 (wskazniki ciaglosci) + A6 (narracja) |

---

## Definition of Done

- [ ] ClubAdmin widzi dashboard z metrykamii grup
- [ ] Gracze pogrupowani wg etapu sciezki
- [ ] Widoczne nadchodzace i ostatnie aktywnosci
- [ ] Lista graczy wymagajacych uwagi z powodami
- [ ] Wskazniki ciaglosci sciezki wyswietlone
- [ ] Jezyk UI dopasowany do kontekstu klubu
- [ ] `vite build` przechodzi bez bledow
