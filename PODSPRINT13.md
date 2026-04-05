# Sprint 13 — 90-Day Checkpoint

**Okres**: 22-28 czerwca 2026
**Cel sprintu**: Podsumowanie 90 dni. Co zadzialo, co nie. Jasna decyzja o nastepnym kroku.

---

## Taski

### A1. Stabilizacja finalnego buildu
- [ ] Ostatnie bug fixy z pilota
- [ ] Clean-up: dead code, unused imports, console.logs
- [ ] README update z instrukcja deploy, setup, env variables
- [ ] Dokumentacja: co jest zbudowane (lista features per rola)
- [ ] Dokumentacja: co jest w backlogu (priorytezowane)
- [ ] Tag git: `v0.1.0-mvp`

### A2. Podsumowanie 90 dni
**Dokument:** `docs/90_DAY_REVIEW.md`

**Sekcje:**

**Co zbudowano:**
- Lista features per EPIC (E1-E8) z statusem (done/partial/not started)
- Stack technologiczny finalny
- Liczba commitow, plikow, linii kodu

**Co zadzialo najlepiej:**
- Ktore features uzytkownicy docenili
- Ktore workflow sa najczesciej uzywane
- Co wywolalo reakcje "wow" na demo

**Co nie zadzialo / bylo za trudne:**
- Features ktore nie byly uzywane
- Workflow ktore byly nieintuicyjne
- Techniczne dlug ktory sie nagromadzil

**Najwazniejsze obiekcje od prospektow:**
- Lista obiekcji z demo/rozmow
- Czestotliwosc kazdej obiekcji
- Czy obiekcja jest feature gap vs positioning vs timing

**Co bylo overengineered vs co brakowalo:**
- Features ktore budowalismy za dlugo a nie daly wartosci
- Features ktore dodalismy szybko a okazaly sie kluczowe

### A3. Pipeline review
**Dokument lub tabela:**

| Metryka | Wartosc |
|---|---|
| Prospektow kontaktowanych | ? |
| Demo przeprowadzonych | ? |
| Zainteresowanych pilotem | ? |
| Pilotow rozpoczetych | ? |
| Pilotow zakonczonych | ? |
| Glowne powody odmowy | ? |
| Konwersja kontakt -> demo | ?% |
| Konwersja demo -> pilot | ?% |

### A4. Decyzja o kierunku nastepnych 90 dni

**Opcja A: Skalowanie klubow**
- Wiecej pilotow z podobnym profilem
- Features najbardziej wymagane przez kluby (z feedbacku)
- Self-service onboarding (mniej recznej pracy)
- Cel: 4-6 platacych klubow do konca Q3

**Opcja B: Poglebienie sciezki zaawansowanej**
- Pelny model Sonia/performance
- Expert team layer (fitness, psycholog, sparingpartner)
- Collaboration workflow miedzy ekspertami
- Cel: 2-3 premium rodziny + 1-2 akademie performance

**Opcja C: Hybrid (najbardziej prawdopodobny)**
- Kontynuacja klubow Tennis 10 (main revenue)
- Rownolegly development zaawansowanej sciezki
- Expert profiles (read-only na poczatek)
- Cel: 3-4 kluby + 5-8 premium rodzin

**Opcja D: Pivot**
- Jesli walidacja nie zadziala — co zmienic
- Inny ICP? Inny pricing? Inny feature set?
- Co z feedbacku sugeruje zmiane kierunku?

### A5. Backlog nastepnej fazy
**Prioryzowany na podstawie:**
1. Feedback z pilota (must-have)
2. Obiekcje z demo (deal-breakers)
3. Architektura na przyszlosc (nice-to-have)

**Kandydaci na nastepna faze:**
- Powiadomienia push (email + browser)
- PDF export przegladow
- Zaawansowane analytics (wykresy, trendy)
- Expert team profiles
- Integracja z kalendarzem (Google/Apple)
- Multi-language support
- Self-service club onboarding
- Stripe integration for payments
- Mobile app (React Native)
- Federation reporting layer

---

## Kolejnosc realizacji

| Dzien | Taski |
|---|---|
| Pon 23 cze | A1 (stabilizacja + cleanup + tag) |
| Wt 24 cze | A2 (podsumowanie 90 dni — dokument) |
| Sr 25 cze | A3 (pipeline review) |
| Czw 26 cze | A4 (decyzja o kierunku) |
| Pt 27 cze | A5 (backlog nastepnej fazy) |

---

## Definition of Done

- [ ] MVP stabilny, otagowany v0.1.0-mvp
- [ ] Podsumowanie 90 dni napisane
- [ ] Pipeline review przeprowadzony
- [ ] Kierunek nastepnych 90 dni WYBRANY (decyzja podjeta)
- [ ] Backlog nastepnej fazy prioryzowany
- [ ] README aktualny

---

## Revenue checkpoint 2026

### Konserwatywny (~34k PLN)
- 2 piloty klubowe x 10k PLN = 20k
- 1 klub subskrypcja x 3 mies x 2k = 6k
- 4 rodziny premium x 3 mies x 700 PLN = 8.4k

### Bazowy (~89k PLN)
- 4 piloty x 12k = 48k
- 2 kluby subskrypcja x 3 mies x 2.5k = 15k
- 8 rodzin x 4 mies x 800 PLN = 25.6k

### Optymistyczny (~151k PLN)
- 6 pilotow x 12k = 72k
- 3 kluby x 4 mies x 3k = 36k
- 12 rodzin x 4 mies x 900 PLN = 43.2k

**CHECKPOINT FINALNY: Walidacja komercyjna + jasna decyzja o nastepnym kroku**
