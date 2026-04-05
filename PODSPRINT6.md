# Sprint 6 — Reviews & Recommendations

**Okres**: 4-10 maja 2026
**EPIC**: E6 (Przeglady i rekomendacje)
**Cel sprintu**: Pelna petla przeglad+rekomendacja. AI wspiera drafty. Rodzic widzi czytelne podsumowania.

---

## Stan zastany

### Backend — GOTOWE (pelne!)
- ReviewSummary model: player, author, periodType, periodStart/End, whatHappened, whatWentWell, whatNeedsFocus, nextSteps, activitiesCount, goalsReviewed[], observations[], aiGenerated, aiDraft, status (draft/published), visibleToParent
- reviewController: getReviews, createReview, getReview, updateReview, prefillReview
- **prefillReview** (GET /reviews/:id/prefill) — auto-agreguje aktywnosci, obserwacje, cele, attendance za okres!
- Recommendation model: player, author, review ref, type (6 opcji), title, description, priority, status, visibleToParent
- recommendationController: getRecommendations, createRecommendation, updateRecommendation
- AI routes: POST /ai/review-draft/:playerId (coach only), POST /ai/recommendations/:playerId

### Frontend — CZESCIOWO
- CoachReviews.jsx — lista przegladow (107 linii)
- CoachNewReview.jsx — formularz tworzenia (istnieje, trzeba sprawdzic kompletnosc)
- CoachPlayerProfile: tab Reviews (podstawowa lista)
- Brak widoku przegladow dla RODZICA
- Brak widoku rekomendacji w UI
- Brak integracji AI draft w formularzu

---

## Taski

### A1. Sprawdzenie i rozszerzenie CoachNewReview
**Plik:** `client/src/pages/coach/CoachNewReview.jsx`

**Sprawdzic czy ma:**
- Wybor gracza
- Okres (periodStart, periodEnd, periodType)
- 4 pola tekstowe: whatHappened, whatWentWell, whatNeedsFocus, nextSteps
- Status draft/published
- visibleToParent toggle

**Dodac jesli brakuje:**
- Przycisk "Wypelnij danymi" -> `GET /api/reviews/:id/prefill`
  - Auto-wypelnia activitiesCount, podpowiada obserwacje i cele
- Przycisk "Wygeneruj draft AI" -> `POST /api/ai/review-draft/:playerId`
  - Body: { periodStart, periodEnd }
  - Odpowiedz wypelnia 4 pola tekstowe
  - Trener edytuje i publikuje
- Dodawanie rekomendacji przy przeglodzie:
  - Pod formularzem przegladu: sekcja "Rekomendacje"
  - Dodaj rekomendacje: typ (select), tytul, opis, priorytet
  - Save: `POST /api/recommendations` z { review: reviewId }

---

### A2. Widok przegladow dla rodzica
**Nowy:** `client/src/pages/parent/Reviews.jsx` lub sekcja w ChildProfile

**Struktura:**
- Lista opublikowanych przegladow dziecka
- Fetch: `GET /api/reviews?player=:id` (backend filtruje status=published dla parent)
- Karta przegladu:
  - Okres (np. "Styczen 2026")
  - Autor (trener)
  - 4 sekcje: Co sie dzialo | Co poszlo dobrze | Na czym skupic | Nastepne kroki
  - Czytelny, spokojny format z ikonami per sekcja
- Klikniecie rozwija pelna tresc

---

### A3. Widok rekomendacji
**Modyfikacja:** ChildProfile.jsx (rodzic) + CoachPlayerProfile.jsx (trener)

**Dla rodzica w ChildProfile:**
- Sekcja "Rekomendacje trenera" — fetch: `GET /api/recommendations?player=:id`
- Lista: priorytet badge (high=czerwony, medium=zolty, low=szary) + typ badge + tytul + opis
- Status: pending/accepted/in-progress/completed

**Dla trenera w CoachPlayerProfile:**
- Tab lub sekcja rekomendacji
- CRUD: tworzenie, edycja statusu, dismiss
- Filtr: status, priorytet

---

### A4. Rekomendacje i przeglady w Timeline
**Modyfikacja:** PlayerTimeline.jsx (z Sprint 4)

**Upewnic sie ze:**
- Review opublikowany pojawia sie jako karta z ikonka + "Przeglad za [okres]"
- Rekomendacja pojawia sie z priorytetem i typem
- Klikniecie na review otwiera pelny widok

---

### A5. Strona Reviews (shared)
**Nadpisac:** `client/src/pages/shared/Reviews.jsx`

**Widok per rola:**
- Coach: lista wszystkich swoich reviews, filtr per gracz, status (draft/published)
- Parent: lista opublikowanych reviews swoich dzieci
- Klikniecie -> szczegoly review

---

### A6. Pakiet pilotowy — finalizacja
**Dokument:**
- Struktura pilota: 8-10 tygodni
- Co zawiera: setup, konfiguracja, onboarding trenerow, onboarding rodzicow, dane demo
- Grupa docelowa: 10-30 juniorow z 1 klubu
- Oczekiwane rezultaty: lepsze zaangazowanie rodzicow, widoczna sciezka, mniej chaosu
- Cennik: 8,000-15,000 PLN
- 1-pager PDF gotowy do wyslania

---

## Kolejnosc realizacji

| Dzien | Taski | Co powstaje |
|---|---|---|
| Pon 5 maj | A1 (CoachNewReview rozszerzenie + AI draft) | Trener tworzy review z AI |
| Wt 6 maj | A2 (rodzic widzi reviews) + A5 (shared Reviews page) | Rodzic widzi przeglady |
| Sr 7 maj | A3 (rekomendacje w UI) | Rekomendacje dla obu rol |
| Czw 8 maj | A4 (timeline integration) + polish | Spojny timeline |
| Pt 9 maj | A6 (pilot package) | Gotowoc komercyjna |

---

## Definition of Done

- [ ] Trener tworzy przeglad z 4 sekcjami (draft -> published)
- [ ] Prefill dziala — auto-agregacja danych za okres
- [ ] AI draft generuje tekst z danych gracza
- [ ] Trener moze dodac rekomendacje przy przeglodzie
- [ ] Rodzic widzi opublikowane przeglady (czytelny format)
- [ ] Rodzic widzi rekomendacje trenera
- [ ] Reviews i rekomendacje pojawiaja sie w timeline
- [ ] Shared Reviews page dziala per rola
- [ ] Pakiet pilotowy gotowy (1-pager)
- [ ] `vite build` przechodzi bez bledow

**CHECKPOINT: MVP v0.2 — Pelna petla Plan -> Komunikacja -> Monitoring -> Przeglad -> Rekomendacja**
