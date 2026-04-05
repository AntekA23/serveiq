# Sprint 11 — Pilot Preparation

**Okres**: 8-14 czerwca 2026
**Cel sprintu**: Pierwszy pilot moze realistycznie wystartowac — setup danych pilotowego klubu, materialy onboardingowe, feedback loop.

---

## Taski

### A1. Pilot-specific config
- [ ] Dostosowanie pathwayStages jesli klub uzywa wlasnych nazw (edycja Club.pathwayStages)
- [ ] Konfiguracja grup pilota zgodnie ze struktura klubu
- [ ] Setup kont trenerow pilotowego klubu (rejestracja + przypisanie do klubu)
- [ ] Weryfikacja ze role i uprawnienia dzialaja dla struktury pilota

### A2. Import danych pilota
- [ ] Import graczy z listy pilota (CSV lub batch) — 10-30 graczy
- [ ] Import/tworzenie kont rodzicow — wyslanie zaproszen email
- [ ] Weryfikacja linkowania: kazdy gracz <-> rodzic <-> trener <-> grupa
- [ ] Testowy login jako kazda rola — potwiedzenie widocznosci danych

### A3. Materialy onboardingowe
**Stworzyc:**
- [ ] Guide "Dla trenera — jak zaczac" (1 strona):
  - Logowanie, dashboard, dodanie notatki, tworzenie aktywnosci, przeglad
- [ ] Guide "Dla rodzica — jak zaczac" (1 strona):
  - Logowanie, profil dziecka, timeline, przeglad od trenera
- [ ] Guide "Dla admina — jak zarzadzac" (1 strona):
  - Dashboard, grupy, import, metryki
- [ ] Krotkie video walkthrough (opcjonalnie — Loom 3 min)

### A4. Feedback mechanism
- [ ] Przycisk "Zglos problem / Daj feedback" w sidebar (obie role)
  - Otwiera formularz: tekst + typ (bug/sugestia/pytanie) + screenshot (opcja)
  - Submit: email do zespolu lub POST do prostego endpointu
- [ ] Lub: link do Google Form / Notion form w sidebar
- [ ] Cotygodniowy check-in zaplanowany z kluczowymi uzytkownikami pilota

### A5. Finalny pass scenariuszy
- [ ] Przejsc Tennis 10 scenariusz jako klub pilotowy:
  - Admin setup -> dodanie trenerow -> grupy -> import graczy -> pierwsze zajecia -> notatki -> przeglad
- [ ] Przejsc Sonia scenariusz:
  - Zaawansowany gracz -> treningi + turnieje -> obserwacje -> cele -> przeglad -> rekomendacja
- [ ] Udokumentowac luki i blokers

### A6. Analytics/logging
- [ ] Logowanie kluczowych akcji (prosty middleware lub serwis):
  - Login (user, role, timestamp)
  - Tworzenie aktywnosci
  - Dodanie obserwacji/notatki
  - Publikacja przegladu
  - Zmiana pathwayStage
- [ ] Prosty endpoint `GET /api/analytics/summary` dla admina:
  - Aktywni uzytkownicy (7 dni)
  - Aktywnosci stworzone
  - Notatki dodane
  - Przeglady opublikowane
- [ ] Lub eksport do CSV/prostego dashboardu

---

## Kolejnosc realizacji

| Dzien | Taski |
|---|---|
| Pon 9 cze | A1 (pilot config) + A2 (import danych) |
| Wt 10 cze | A2 cont (weryfikacja linkowania) + A3 (guides) |
| Sr 11 cze | A4 (feedback mechanism) + A6 (analytics) |
| Czw 12 cze | A5 (finalny pass scenariuszy) |
| Pt 13 cze | Fixes + finalizacja przygotowan |

---

## Definition of Done

- [ ] Pilot klubowy moze wystartowac technicznie (dane, konta, grupy)
- [ ] Dane pilota zaimportowane i zweryfikowane (kazdy gracz ma rodzica i trenera)
- [ ] Materialy onboardingowe gotowe (3 guides)
- [ ] Feedback mechanism na miejscu
- [ ] Analytics loguja min. 5 kluczowych akcji
- [ ] Oba scenariusze przeszly finalny pass
- [ ] `vite build` przechodzi bez bledow
