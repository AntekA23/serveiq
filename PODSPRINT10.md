# Sprint 10 — Stabilization

**Okres**: 1-7 czerwca 2026
**Cel sprintu**: Stabilnosc, szybkosc, czytelnosc — zero krytycznych bugow, plynny UX.

---

## Taski

### A1. Bug audit i fix
**Przejsc kazda sciezke uzytkownika:**

**Rodzic:**
- [ ] Rejestracja -> onboarding -> dodanie dziecka -> dashboard
- [ ] Dodanie trenera (invite code flow)
- [ ] Przeglad profilu dziecka (pathway, cele, timeline, aktywnosci)
- [ ] Przeglad reviews
- [ ] Ustawienia profilu
- [ ] Logout -> login -> dane zachowane

**Trener:**
- [ ] Rejestracja -> dashboard
- [ ] Dodanie gracza -> profil gracza
- [ ] Tworzenie aktywnosci -> attendance
- [ ] Notatka/obserwacja
- [ ] Tworzenie przegladu z AI draft
- [ ] Ustawienie pathwayStage + nextStep
- [ ] Cele rozwojowe CRUD
- [ ] Invite code w ustawieniach

**ClubAdmin:**
- [ ] Rejestracja -> setup klubu
- [ ] Dashboard z metrykam
- [ ] Grupy CRUD
- [ ] Import graczy

**Crossplatform:**
- [ ] Chrome desktop
- [ ] Safari desktop
- [ ] Chrome mobile (Android)
- [ ] Safari mobile (iOS)

---

### A2. Performance
- [ ] Lazy loading komponentow stron (React.lazy + Suspense) — zmniejszy initial bundle (528kb!)
- [ ] API: dodac indeksy MongoDB jesli brakuje (sprawdzic slow queries)
- [ ] Obrazki: avatary cached, lazy loaded
- [ ] Pagination na listach > 20 elementow

---

### A3. UX simplification
- [ ] Formularz aktywnosci: domyslne wartosci (typ=training, czas=60min, widoczny=true)
- [ ] Quick actions na dashboardzie trenera: "Nowa notatka", "Nowa aktywnosc" (1-click)
- [ ] Breadcrumbs na podstronach (Profil gracza -> powrot do listy)
- [ ] Keyboard shortcuts: Enter=submit na formularzach
- [ ] Auto-focus na pierwszym polu w modalach

---

### A4. Widok rodzica — clarity review
Przejsc caly flow rodzica z perspektywy osoby ktora nigdy nie uzywala ServeIQ:
- [ ] Czy dashboard jasno komunikuje "co sie dzieje z moim dzieckiem"?
- [ ] Czy profil dziecka jest czytelny bez instrukcji?
- [ ] Czy przeglad od trenera jest zrozumialy?
- [ ] Czy nawigacja jest oczywista?
- [ ] Czy empty states prowadza za reke?
- [ ] Usunac jargon techniczny — "visibleToParent", "pathwayStage" nie powinny pojawiac sie w UI

---

### A5. Demo z mocniejszym ask
- Demo z pytaniem: "Czy chcesz pilotowac to w swoim klubie?"
- Zbieranie obiekcji:
  - "Za drogie" -> dostosowac pilot
  - "Brakuje X" -> zapisac do backlogu
  - "Nie teraz" -> ustalić kiedy
  - "Tak" -> ustalić harmonogram

---

## Kolejnosc realizacji

| Dzien | Taski |
|---|---|
| Pon 2 cze | A1 (bug audit — przejsc wszystkie sciezki) |
| Wt 3 cze | A1 (fix krytycznych bugow) |
| Sr 4 cze | A2 (performance) + A3 (UX simplification) |
| Czw 5 cze | A4 (clarity review) + fixy |
| Pt 6 cze | A5 (demo z ask) |

---

## Definition of Done

- [ ] Zero krytycznych bugow na kluczowych sciezkach (P1)
- [ ] Core loop trenera: < 5 klikniec do notatki
- [ ] Core loop rodzica: 1 ekran do zrozumienia statusu dziecka
- [ ] Lazy loading zmniejszyl initial load
- [ ] Mobile dziala na iOS Safari i Android Chrome
- [ ] Min. 1 prospekt na poziomie "tak, chce pilotowac"
- [ ] `vite build` przechodzi bez bledow
