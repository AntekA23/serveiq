# Sprint 6 — Reviews & Recommendations

**Okres**: 4-10 maja 2026
**EPIC**: E6 (Przeglady i rekomendacje)
**Cel sprintu**: Pelna petla przeglad+rekomendacja — trener tworzy okresowe podsumowania, AI wspiera drafty, rodzic widzi czytelne podsumowanie.

---

## Taski

### A1. Model podsumowania przegladu
**Pliki:**
- Sprawdzic: `server/src/models/ReviewSummary.js` (istnieje)
- Controller: `server/src/controllers/reviewController.js`

**Szablon przegladu:**
- Co sie dzialo (opis okresu)
- Co poszlo dobrze
- Na czym skupic
- Nastepny krok / rekomendacja
- Okres (od-do)
- Gracz, trener, status (draft/published)

**Do sprawdzenia:** Czy istniejacy model pokrywa te pola. Rozszerzyc jesli nie.

---

### A2. Tworzenie przegladu — frontend trenera
**Pliki:**
- Sprawdzic istniejacy: `client/src/pages/coach/CoachNewReview.jsx` lub CoachReviews.jsx

**Co zbudowac:**
- Formularz tworzenia przegladu z sekcjami:
  - Wybor gracza
  - Okres
  - 4 pola tekstowe (co sie dzialo, co dobrze, co skupic, nastepny krok)
- Zapisz jako draft / Opublikuj
- AI-assisted draft: przycisk "Wygeneruj draft z AI" ktory:
  - Bierze ostatnie aktywnosci, obserwacje, cele gracza
  - Wysyla do AI z promptem
  - Wypelnia pola formularz
  - Trener edytuje i publikuje

---

### A3. Model rekomendacji
**Pliki:**
- Sprawdzic: `server/src/models/Recommendation.js` (istnieje)
- Controller: `server/src/controllers/recommendationController.js`

**Co zbudowac:**
- Rekomendacja moze byc niezalezna od przegladu (np. szybka rekomendacja)
- Pola: tekst, typ (nastepny etap, focus, aktywnosc, inne), gracz, trener, data
- Widocznosc w timeline i player journey

---

### A4. Widok przegladu dla rodzica
**Pliki:**
- Modyfikacja profilu dziecka lub nowy widok

**Co zbudowac:**
- Rodzic widzi opublikowane przeglady:
  - Karta z 4 sekcjami
  - Data i autor
  - Czytelny, spokojny format
- Lista przegladow (historia)
- Najnowszy przeglad prominentnie w profilu

---

### A5. Rekomendacja w Player Journey + Timeline
**Pliki:**
- Modyfikacja PlayerJourney.jsx i PlayerTimeline.jsx

**Co zbudowac:**
- Rekomendacja jako wyrozniajaca sie karta w timeline
- W Player Journey: sekcja "Rekomendowany nastepny krok" z ostatnia rekomendacja
- Ikona/kolor odrozniejacy od zwyklych wpisow

---

### A6. Pakiet pilotowy — draft struktury
**Zadanie manualne:**
- Przygotowac draft struktury pilota:
  - Czas trwania: 8-10 tygodni
  - Grupa docelowa: 10-30 juniorow z klubu
  - Co zawiera: setup, konfiguracja, onboarding, wsparcie
  - Oczekiwane rezultaty
  - Cena: 8,000-15,000 PLN
- Przygotowac 1-pager do wyslania prospektom

---

## Kolejnosc realizacji

| Dzien | Taski |
|---|---|
| Pon 5 maj | A1 (model przegladu — weryfikacja + rozszerzenie) |
| Wt 6 maj | A2 (formularz przegladu + AI draft) |
| Sr 7 maj | A3 (rekomendacje), A5 (journey + timeline) |
| Czw 8 maj | A4 (widok rodzica) |
| Pt 9 maj | A6 (pakiet pilotowy) + polish |

---

## Definition of Done

- [ ] Trener moze tworzyc przeglad z 4 sekcjami (draft + publikacja)
- [ ] AI-assisted draft dziala (generuje tekst z danych gracza)
- [ ] Rodzic widzi opublikowane przeglady czytelnie
- [ ] Rekomendacje widoczne w timeline i player journey
- [ ] Draft struktury pilota gotowy
- [ ] `vite build` przechodzi bez bledow

**CHECKPOINT: MVP v0.2 — Pelna petla Plan -> Komunikacja -> Monitoring -> Przeglad -> Rekomendacja**
