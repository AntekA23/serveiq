# ServeIQ — Master Sprint Plan (90 dni)

**Start**: 30 marca 2026
**MVP Checkpoint**: 27 kwietnia 2026 (tydzien 4)
**Pilot-ready**: 22 czerwca 2026 (tydzien 13)
**Cel**: Zwalidowac ze ServeIQ pomaga klubom tenisowym zarzadzac sciezka rozwoju juniorow przez jeden wspolny workflow: Plan -> Komunikacja -> Monitoring -> Przeglad -> Rekomendacja

---

## Pozycjonowanie

**ServeIQ pomaga klubom tenisowym rozwijac uczestnictwo juniorow, angazowac rodziny i budowac widoczna sciezke od Tennis 10 do dlugookresowego rozwoju gracza.**

### Dwa scenariusze walidacyjne

| Scenariusz | Cel | Uzytkownik |
|---|---|---|
| **Tennis 10 / Klub** | Sprzedaz klubom — retencja, zaangazowanie rodzin, ciaglosc sciezki | Wlasciciel klubu, koordynator, trener, rodzic |
| **Sonia / Zaawansowana sciezka** | Walidacja architektury — zaawansowany rozwoj gracza | Trener glowny, rodzic, zawodnik, team ekspertow |

---

## EPICi

| # | EPIC | Opis |
|---|---|---|
| E1 | Tozsamosc, role, profile | User, Player, Parent, Coach, Club, role-based access |
| E2 | Model sciezki gracza | Etapy rozwoju, pathway stages, historia, progresja |
| E3 | Planowanie aktywnosci | Generyczny model aktywnosci (klasa, oboz, turniej, trening, mecz, fitness, przeglad) |
| E4 | Timeline i komunikacja | Wspolna os czasu, notatki, aktualizacje, widocznosc per rola |
| E5 | Cele i obserwacje | Cele rozwojowe, focus areas, obserwacje, markery postepu |
| E6 | Przeglady i rekomendacje | Podsumowania okresowe, co poszlo dobrze, na czym skupic, nastepny krok, AI draft |
| E7 | Dashboard klubu | Widok grup, etapow, aktywnosci, graczy wymagajacych uwagi |
| E8 | Demo i gotowsc pilotowa | Dane demo, scenariusze, onboarding, feedback loop |

---

## Plan tygodniowy

### Faza 1 — Fundament + Wewnetrzne MVP (Tygodnie 1-4)

#### Tydzien 1 (30 mar - 5 kwi) — Zamrozenie kierunku
**Status: W TRAKCIE**
- [x] Zamrozenie definicji MVP
- [x] Model danych v1 (User, Player, Club, Group, Activity, Observation, Goal, Review, Recommendation)
- [x] Auth + role-based access
- [x] Podstawowy shell UI (Sidebar, AppShell, routing)
- [x] Profile: Player, Parent, Coach
- [x] Relacje: parent-child, coach-player linking (invite code flow)
- [x] Ustawienia per rola (trener: profil + kod zaproszenia, rodzic: profil)
- [ ] Wireframes 5 kluczowych ekranow
- [ ] Lista 20 prospektow

#### Tydzien 2 (6-12 kwi) — Core entities + parent flow
**EPIC: E1, E2**
- [ ] **Rodzic moze dodawac dzieci** (strona /my-children z CRUD)
- [ ] Rodzic moze edytowac profil dziecka
- [ ] Widok profilu dziecka z aktualnymi danymi
- [ ] Etapy sciezki (pathway stages) — model + przypisanie
- [ ] Historia etapow gracza
- [ ] Widok podrozy gracza (player journey summary)
- [ ] Podstawowe pole "rekomendowany nastepny krok"
- [ ] Markery progresji (beginner -> tennis10 -> committed -> advanced -> performance)
- [ ] Soft outreach do 5 cieplyh kontaktow

#### Tydzien 3 (13-19 kwi) — Planning backbone
**EPIC: E3**
- [ ] Generyczny model aktywnosci (typy: klasa, oboz, turniej, trening, mecz, fitness, przeglad, inne)
- [ ] CRUD aktywnosci (tworzenie, edycja, usuwanie)
- [ ] Przypisywanie aktywnosci do graczy
- [ ] Renderowanie timeline/listy aktywnosci
- [ ] Walidacja modelu vs scenariusz Tennis 10 i Sonia
- [ ] 2 konkretne user journeys do demo

#### Tydzien 4 (20-26 kwi) — Wewnetrzne MVP v0.1
**EPIC: E4**
- [ ] Wspolny timeline/feed per gracz
- [ ] Timeline ciagnie: aktywnosci, notatki, aktualizacje
- [ ] Lekkie notatki trenera
- [ ] Format aktualizacji dla rodzica
- [ ] Polish 3 kluczowych ekranow
- [ ] Wewnetrzny skrypt demo
- [ ] Zaplanowanie 3-5 prawdziwych demo

**CHECKPOINT: Wewnetrzne MVP — Plan + Komunikacja + Lekki monitoring**

---

### Faza 2 — Wartosc + Demowalnosc (Tygodnie 5-8)

#### Tydzien 5 (27 kwi - 3 maj) — Development logic
**EPIC: E5**
- [ ] Cele rozwojowe / focus areas
- [ ] Aktywne focus areas per gracz
- [ ] Wpisy obserwacji / postepu
- [ ] Focus + ostatnia obserwacja w widoku podrozy gracza
- [ ] Proste markery progresji
- [ ] Realne demo discovery z cieplymy prospektami

#### Tydzien 6 (4-10 maj) — Reviews & recommendations
**EPIC: E6**
- [ ] Model podsumowania przegladu (co sie dzialo, co poszlo dobrze, na czym skupic, nastepny krok)
- [ ] Model rekomendacji
- [ ] Rekomendacja w widoku podrozy + timeline
- [ ] AI-assisted draft przegladu (jesli wykonalne)
- [ ] Pakiet pilotowy — draft struktury

**CHECKPOINT: MVP v0.2 — Pelna petla: Plan -> Komunikacja -> Monitoring -> Przeglad -> Rekomendacja**

#### Tydzien 7 (11-17 maj) — Club relevance
**EPIC: E7**
- [ ] Dashboard klubu/grup
- [ ] Grupowanie graczy wg etapu/grupy
- [ ] Ostatnia aktywnosc / nastepna aktywnosc
- [ ] Gracze wymagajacy uwagi
- [ ] Wskazniki ciaglosci sciezki
- [ ] Narracja Tennis 10 w UI

#### Tydzien 8 (18-24 maj) — Demo readiness
**EPIC: E8**
- [ ] Wysokiej jakosci dane demo
- [ ] 2 dopracowane scenariusze demo (Tennis 10 + Sonia light)
- [ ] Dopracowane widoki per rola
- [ ] Oczyszczenie UX
- [ ] Finalizacja 10-minutowego demo
- [ ] Krotki deck (problem -> ServeIQ -> scenariusze -> model pilotowy)

**CHECKPOINT: Demo-ready MVP**

---

### Faza 3 — Sprzedawalnosc + Pilot (Tygodnie 9-13)

#### Tydzien 9 (25-31 maj) — Pilot onboarding
- [ ] Onboarding dla rzeczywistego pilota
- [ ] Latwe wprowadzanie danych dla pierwszego klubu
- [ ] Skroty admin do setup
- [ ] Fix friction points z wczesnych demo
- [ ] Rozmowy pilotowe z 2-3 kandydatami

#### Tydzien 10 (1-7 cze) — Stabilizacja
- [ ] Bug fixing
- [ ] Redukcja tarcia UX
- [ ] Uproszczenie formularzy
- [ ] Szybkosc core loop dla trenera
- [ ] Czytelnosc widoku rodzica
- [ ] Fokusowane demo z mocniejszym ask: "Czy chcesz pilotowac?"

#### Tydzien 11 (8-14 cze) — Przygotowanie pilota
- [ ] Tweaki pilotowe
- [ ] Wsparcie importu/setup
- [ ] Feedback capture
- [ ] Finalny pass na scenariusze
- [ ] Minimalne analytics/logging

#### Tydzien 12 (15-21 cze) — Walidacja zewnetrzna
- [ ] Wsparcie onboardingu pilota
- [ ] Szybki fix krytycznych issues
- [ ] Tylko to co blokuje uzycie lub sprzedaz
- [ ] Kick-off pilota lub finalne spotkania commitmentowe

#### Tydzien 13 (22-28 cze) — Checkpoint 90 dni
- [ ] Stabilizacja finalnego buildu MVP
- [ ] Dokumentacja scope MVP + roadmapa nastepnej fazy
- [ ] Podsumowanie learningow z pierwszych 90 dni
- [ ] Przeglad pipeline (prospekci, piloty, obiekcje, konwersja)
- [ ] Decyzja o kierunku nastepnych 90 dni

**CHECKPOINT FINALNY: Walidacja komercyjna + jasny nastepny krok**

---

## Kryteria sukcesu

### Produkt
- Klub moze uzyc workflow dla Tennis 10 / juniorow
- Rodzic rozumie plan i ostatni postep bez zewnetrznego chaosu
- Trener moze szybko dodawac aktualizacje
- Scenariusz Sonia dziala bez lamia modelu

### Komercja
- Wlasciciel klubu widzi wartosc w zaangazowaniu rodzin i ciaglosci sciezki
- Produkt mozna zademonst w ponizej 10 minut
- Przynajmniej kilku prospektow mowi "to rozwiazuje prawdziwy problem"
- Gotowosc do rozmowy o pilocie/wspolpracy

---

## Model cenowy 2026

| Oferta | Cena | Opis |
|---|---|---|
| Pilot klubowy (8-10 tyg) | 8,000-15,000 PLN | Setup + konfiguracja + onboarding + wsparcie |
| Subskrypcja klubowa | 1,500-3,500 PLN/mies | Po pilocie, ongoing access |
| Pakiet premium rodzina | 500-1,200 PLN/mies | Zaawansowana sciezka, team ekspertow |

---

## Co jest poza scope MVP

- Pelny silnik bookingu
- Zintegrowane platnosci
- Transakcje marketplace
- Integracje wearables
- Zaawansowane dashboardy analityczne
- Social media automation
- Raportowanie federacyjne
- Zaawansowana analityka meczy
- Open chat replacement
