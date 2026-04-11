# Czyszczenie Frontendu ServeIQ — Audyt UX i Plan Przebudowy

## Problem

Aplikacja w obecnej formie bombarduje uzytkownika informacjami od pierwszej sekundy.
Kazdy ekran probuje pokazac **wszystko naraz** zamiast prowadzic uzytkownika przez logiczna sciezke.
Efekt: poczucie przytloczenia niezaleznie od roli (trener, rodzic, wlasciciel klubu).

### Kluczowe przyczyny:
1. **Brak hierarchii wizualnej** — wszystkie elementy maja ten sam "waga" wizualny
2. **Za duzo sekcji na jednym ekranie** — np. CoachPlayerProfile: 7 zakladek, 1501 linii kodu
3. **Brak progressive disclosure** — dane sa wyswietlane "bo istnieja", nie "bo sa teraz potrzebne"
4. **Niespojny design system** — rozne style przyciskow, kart, badgy, kolorow na roznych stronach
5. **Inline styles + CSS classes** — mieszanka podejsc utrudnia utrzymanie spojnosci
6. **Brak paginacji** — dluge listy ladowane w calosci (Activities: 801 linii bez limitu)

---

## Filozofia Redesignu

> **"Pokaz jedno. Podpowiedz nastepne. Ukryj reszta."**

Kazdy ekran powinien miec:
- **1 glowna akcje** (primary action) — to co uzytkownik przyszedl zrobic
- **2-3 wspierajace informacje** — kontekst potrzebny do podjecia decyzji
- **Dostep do reszty** — ale przez klikniecie, nie przez scrollowanie

### Styl wizualny:
- **Tonacja:** Spokojna, profesjonalna, ale ciepla — platforma dla dzieci i rodzicow, nie trading floor
- **Przestrzen:** Duze marginesy, oddychajacy layout — mniej elementow = wiecej spokoju
- **Typografia:** Wyrazna hierarchia — tytuly duze i boldowe, dane liczbowe wyeksponowane, reszta subtelna
- **Kolor:** Stonowana paleta z 1-2 akcentami. Kolory uzywane semantycznie (sukces/ostrzezenie/blad), nie dekoracyjnie
- **Karty:** Maksymalnie 3-4 elementy informacji na karte. Jesli wiecej — to osobna strona
- **Animacje:** Subtelne przejscia (fade-in, slide-up), zero "bouncy" efektow

---

# ROLA: TRENER (Coach)

## Dashboard (`CoachDashboard.jsx` — 283 linii)

### Co jest teraz:
- Hero header + 2 przyciski akcji
- 4 karty statystyk (Zawodnicy, Sesje/msc, Godziny, Sredni skill)
- 2 alerty (platnosci + drafty recenzji)
- Sekcja join requests (nieograniczona lista)
- Karta ostatnich zawodnikow (5) z ringami skill
- Karta ostatnich sesji (6) z kolorami typow

### Problem:
**6 roznych sekcji walczy o uwage.** Trener wchodzi i nie wie na co najpierw patrzec. Join requests sa wymieszane z sesjami i statystykami. Alerty sa bannerami ale latwo je przeoczyc pomiedzy innymi elementami.

### Co jest realnie potrzebne:
- **Dzisiejszy plan** — co trener ma dzis na kalendarzu (to jest nr 1 informacja dla trenera!)
- **Pilne powiadomienia** — platnosci, oczekujace prosby, drafty do opublikowania
- **Szybki dostep do ostatnich zawodnikow** — 3-4 najczesciej otwieranych

### Co usunac/przeniesc:
| Element | Decyzja | Dlaczego |
|---------|---------|----------|
| 4 karty statystyk | **Usunac z dashboardu** | Statystyki nie pomagaja w codziennej pracy. Przeniesc do osobnej sekcji "Raporty" |
| Ring skills na kartach zawodnikow | **Uproscic** | Kolo procentowe obok nazwiska to szum. Wystarczy imie + ostatnia sesja |
| Kolorowe dots typow sesji | **Uproscic** | 6 kolorow na jednej karcie to za duzo. Typ sesji jako tekst wystarczy |
| Join requests na dashboardzie | **Przeniesc** | Osobna strona lub sekcja powiadomien. Na dashboardzie max badge z liczba |
| Alerty bannerowe | **Przerobic** | Powinny byc JEDYNYM elementem u gory — nie wmieszane z reszta |

### Nowy layout dashboardu trenera:

```
+------------------------------------------+
|  [Alerty: 2 platnosci, 1 prosba]         |  <-- jedyny gorny element jesli sa alerty
+------------------------------------------+
|                                           |
|  Dzisiaj (Piatek, 11 kwietnia)            |  <-- glowna sekcja
|                                           |
|  10:00  Kort — Jan Kowalski (90 min)      |
|  12:00  Sparing — Sonia Nowak (60 min)    |
|  15:00  Kondycja — Grupa U12 (45 min)     |
|                                           |
|  [+ Dodaj sesje]                          |
|                                           |
+------------------------------------------+
|                                           |
|  Ostatni zawodnicy        [Zobacz wszystko]|
|                                           |
|  [Avatar] Jan K.   ostatnia sesja: wczoraj|
|  [Avatar] Sonia N. ostatnia sesja: 3 dni  |
|  [Avatar] Piotr M. ostatnia sesja: tydzien|
|                                           |
+------------------------------------------+
```

**Redukcja: z 6 sekcji do 3. Z ~20 elementow informacji do ~10.**

---

## Profil Zawodnika (`CoachPlayerProfile.jsx` — 1501 linii)

### Co jest teraz:
- Header z avatarem, nazwa, wiekiem, rankingiem, statusem, 3-4 przyciskami akcji
- **7 zakladek:** Plany, Umiejetnosci, Sesje, Cele, Obserwacje, Zdrowie, Oceny
- Kazda zakladka to w zasadzie osobna strona z wlasna logika
- Tab "Obserwacje" ma formularz z 6 typami, 3 sliderami (1-5), referencjami do celow/aktywnosci
- Tab "Cele" ma podsekcje per kategoria, kazda z wlasnym formularzem dodawania
- Tab "Umiejetnosci" ma inline editing z wieloma przyciskami poziomow

### Problem:
**To jest najgorszy ekran w aplikacji.** 1501 linii kodu w jednym pliku. 7 zakladek. Kazda zakladka jest osobnym swiatem. Trener otwiera profil zawodnika i jest przytloczony od razu — nawet header ma za duzo elementow.

### WYMAGA CALKOWITEJ PRZEBUDOWY.

### Nowa struktura:

**Header — uproszczony:**
```
+------------------------------------------+
|  <- Wstecz                                |
|                                           |
|  [Avatar]  Jan Kowalski, 12 lat           |
|            U12 • PZT #47                  |
|                                           |
|  [Napisz recenzje]  [Dodaj obserwacje]    |
+------------------------------------------+
```

**Zamiast 7 zakladek — 4 sekcje na jednej stronie (scroll):**

```
1. PODSUMOWANIE (domyslnie rozwiniety)
   - 6 umiejetnosci jako prostych paskow (nie edytowalnych tutaj)
   - Aktywne cele (max 3, z linkiem "wszystkie")
   - Ostatnia sesja + kolejna sesja

2. PLAN TRENINGOWY (domyslnie zwiniety)
   - Tygodniowy harmonogram
   - Edycja przez przejscie do dedykowanej strony

3. OSTATNIE AKTYWNOSCI (domyslnie zwiniety)
   - 5 ostatnich sesji/turniejow
   - Link do pelnej historii

4. OBSERWACJE (domyslnie zwiniety)
   - Lista 5 ostatnich
   - Przycisk "Dodaj" otwiera modal/osobna strone
```

**Usunac z profilu:**
- Tab "Zdrowie" (wearable) — przeniesc do osobnej strony `/coach/player/:id/health` (bardzo niszowe)
- Tab "Oceny" — przeniesc do osobnej strony `/coach/player/:id/reviews`
- Inline editing umiejetnosci — edycja przez modal lub dedykowana strone
- AI Recommendations button z headera — przeniesc do tworzenia recenzji

**Redukcja: z 7 zakladek + header do 4 zwijalnych sekcji. Z ~1500 linii do ~400.**

---

## Kalendarz Trenera (`CoachCalendar.jsx` — 608 linii)

### Co jest teraz:
- FullCalendar z widokiem tygodniowym
- Modal sesji z 15+ polami formularza (gracz, data, czas, czas trwania, 6 typow sesji jako przyciski, 4 nawierzchnie, tytul, notatki, widocznosc, powtarzalnosc)
- Osobny modal dla aktywnosci (anulowanie/przywracanie)

### Problem:
Modal tworzenia sesji jest **za dlugi**. 15+ pol w jednym modalu wymaga scrollowania. Przyciski typow sesji (6) + nawierzchni (4) + powtarzalnosci (4) = 14 przyciskow grid w jednym formularzu.

### Co zmienic:
- **Uproscic modal** — tylko kluczowe pola: gracz, data/czas, typ, czas trwania
- **Przenies szczegoly** do edycji po utworzeniu (nawierzchnia, notatki, powtarzalnosc)
- **Zmniejsz gridy przyciskow** — typ sesji jako dropdown zamiast 6 przyciskow
- **Nawierzchnia** — pokazuj tylko gdy typ to kort/sparing/mecz (warunkowe wyswietlanie juz jest, ale moze byc dropdownem)

### Redukcja: z 15+ pol do 5 pol w modalu tworzenia. Reszta w edycji.

---

## Sesje Trenera (`CoachSessions.jsx`)

### Status: **OK — do drobnych poprawek**
- Grupowanie po dacie: dobre
- Nawigacja miesieczna: dobra
- 4 statystyki miesiac: zbedne na tym ekranie — przeniesc do raportow

### Zmiana: usunac stats bar, zostawic czysta liste sesji z nawigacja.

---

## Lista Zawodnikow (`CoachPlayers.jsx` — 177 linii)

### Status: **OK — do drobnych poprawek**
- Karty z 8+ data points per zawodnik (avatar, imie, wiek, etap, ranking, 4 umiejetnosci, sredni skill, rodzice)

### Zmiana:
- Zmniejsz karte do: avatar + imie + wiek + ostatnia sesja
- Usun skill chips z listy — to informacja na profilu, nie na liscie
- Usun "sredni skill badge" — metryka bez kontekstu

---

## Platnosci Trenera (`CoachPayments.jsx` — 258 linii)

### Problem:
- Formularz nowej platnosci inline na stronie (toggle) zamiast modalu
- 4 karty statystyk na gorze (total zaplacone, oczekujace, przeterminowane, wszystkie)
- Podwojne wskazniki statusu (kolorowa ikona + kolorowy tekst)

### Zmiana:
- Stats przeniesc do raportow
- Formularz jako modal
- Jeden wskaznik statusu (kolorowy badge wystarczy)

---

## Recenzje Trenera (`CoachReviews.jsx`)

### Status: **DOBRZE ZAPROJEKTOWANE** — wzor do nasladowania
- Czysta lista, prosty filtr, jasna hierarchia

---

## Tworzenie Recenzji (`CoachNewReview.jsx` — 415 linii)

### Problem:
- 7+ sekcji z nested collapsible content
- Prefill stats + obserwacje + cele = do 10 elementow w sekcji
- 4 duze pola tekstowe (co sie dzialo, co poszlo dobrze, na czym skupic, nastepne kroki)
- AI generowanie + prefill to osobne akcje ale ten sam intent

### Zmiana:
- Polaczyc AI + prefill w jedno: "Przygotuj draft"
- Zmniejszyc 4 pola do 2: "Podsumowanie okresu" + "Rekomendacje"
- Prefill data jako tooltip/sidebar, nie inline sekcja

---

## Edycja Sesji (`CoachEditSession.jsx` — 302 linii)

### Problem:
- Sekcja "Skill Updates" to osobny swiat w formularzu — grid przyciskow umiejetnosci + before/after selektory per skill = ogromna ilosc elementow
- Formularz ma 10+ pol z wieloma gridami przyciskow

### Zmiana:
- Skill updates przeniesc do osobnego ekranu/modalu
- Uproscic glowny formularz do kluczowych pol

---

## Turnieje (`Tournaments.jsx` — 388 linii)

### Status: **OK** — grupowanie po miesiach czytelne, badge nawierzchni pomagaja

### Drobna zmiana: wynik turnieju pokazywac inline zamiast w modalu (jesli prosty)

---

## Grupy (`Groups.jsx` — 1215 linii)

### Problem:
**Drugi najgorszy ekran.** Rozwijalne karty z zagniezdzonymi harmonogramami, lista czlonkow, edycja inline.

### WYMAGA CALKOWITEJ PRZEBUDOWY.

### Nowa struktura:
- Lista grup jako proste karty: nazwa + liczba graczy + dni + trener
- Klikniecie → osobna strona grupy z pelnym widokiem
- Edycja/dodawanie czlonkow na stronie grupy, nie w modalu na liscie

---

## Prosby o Dolaczenie (`CoachRequests.jsx`)

### Status: **DOBRZE ZAPROJEKTOWANE** — wzor do nasladowania. Proste karty z accept/reject.

---

# ROLA: RODZIC (Parent)

## Dashboard Rodzica (`ParentDashboard.jsx` — 260 linii)

### Co jest teraz:
- Selektor dzieci (buttony)
- 2 przyciski akcji (Dodaj dziecko, Dodaj trenera)
- Hero z danymi dziecka (avatar, imie, wiek, 4 rankingi)
- Preview planu treningowego (kamienie milowe, siatka tygodnia z dniami i typami sesji)

### Problem:
Relatywnie dobrze zaprojektowany — ale hero section zajmuje za duzo miejsca, a 4 rankingi (PZT, TE, ATP, WTA) sa przesada dla wiekszosci rodzicow (ich dzieci nie maja rankingu ATP/WTA).

### Co zmienic:
- **Ranking** — pokazuj tylko te ktore istnieja (nie puste)
- **Plan preview** — uproscic: zamiast siatki 7 dni z kodami typow, pokaz: "Nastepna sesja: Kort, czwartek 15:00"
- **Dodaj trenera** — przeniesc do ustawien, nie na dashboard
- **Hero** — zmniejszyc, dodac "Nastepna sesja" jako glowna informacje

### Nowy layout:

```
+------------------------------------------+
|  [Jan] [Sonia] [+ Dodaj dziecko]          |
+------------------------------------------+
|                                           |
|  [Avatar]  Jan Kowalski                   |
|            12 lat • PZT #47              |
|                                           |
|  Nastepna sesja:                          |
|  Czwartek 15:00 — Kort z Trenerem K.     |
|                                           |
+------------------------------------------+
|                                           |
|  Ten tydzien                              |
|  Pon: Kort (90min) • Sr: Sparing (60min) |
|  Pt: Kondycja (45min)                     |
|                                           |
+------------------------------------------+
|                                           |
|  Ostatnia recenzja          [Zobacz]      |
|  "Jan robi swietne postepy..." — 3 dni   |
|                                           |
+------------------------------------------+
```

---

## Profil Dziecka (`ChildProfile.jsx` — 447 linii)

### Co jest teraz:
- Back + Hero (avatar, imie, wiek, plec, 4 rankingi)
- Timeline link
- PathwayStepper (wizualizacja etapu)
- DevelopmentProgramTab (zagniezdony komponent z trenera!)
- BadgeGrid (odznaki)
- PlayerJourney (wizualizacja sciezki)
- UpcomingActivities (lista z kolorami typow)
- Recent Updates (lista aktualizacji)
- Tennis Skills (6 umiejetnosci z poziomami)
- Goals (aktywne + ukonczone)

### Problem:
**10 roznych sekcji na jednej stronie!** PathwayStepper + PlayerJourney + DevelopmentProgramTab to 3 rozne wizualizacje tego samego konceptu (sciezka rozwoju). UpcomingActivities uzywa systemu 8 kolorow ktory nie jest nigdzie wytlumaczony. Kazda sekcja "walczy" o uwage.

### WYMAGA CALKOWITEJ PRZEBUDOWY.

### Co rodzic naprawde chce wiedziec:
1. **Jak radzi sobie moje dziecko?** → prosty wskaznik postepu (nie 6 osobnych skill barow)
2. **Co dalej?** → nastepna sesja/turniej
3. **Co powiedzial trener?** → ostatnia recenzja/obserwacja

### Nowa struktura:

```
+------------------------------------------+
|  <- Wstecz                                |
|                                           |
|  [Avatar]  Jan Kowalski, 12 lat           |
|            Etap: U12 Zaawansowany         |
|                                           |
+------------------------------------------+
|                                           |
|  Postepy                   [Szczegoly]    |
|  ████████████░░░░░ 68/100                 |
|  (srednia umiejetnosci)                   |
|                                           |
+------------------------------------------+
|                                           |
|  Nadchodzace                              |
|  Czw 15:00 — Kort z Trenerem K.          |
|  Sob 10:00 — Turniej Warszawa Junior      |
|                                           |
+------------------------------------------+
|                                           |
|  Ostatnia recenzja          [Wszystkie]   |
|  "Jan swietnie sie rozwinol..."           |
|  — Trener Kowalski, 3 dni temu           |
|                                           |
+------------------------------------------+
|                                           |
|  Cele                       [Wszystkie]   |
|  [x] Serwis > 70 pkt                     |
|  [ ] Ranking PZT top 30                   |
|                                           |
+------------------------------------------+
```

**Usunac z glownego profilu:**
- PathwayStepper + PlayerJourney + DevelopmentProgramTab → jedna uproszczona wizualizacja etapu w headerze
- BadgeGrid → osobna podstrona "Odznaki"
- 8-kolorowy system aktywnosci → typ jako tekst, nie kolor
- Szczegolowe umiejetnosci → podstrona "Szczegoly postepu" (SkillProgress.jsx juz istnieje!)

**Redukcja: z 10 sekcji do 5. Z 447 linii do ~200.**

---

## Moje Dzieci (`MyChildren.jsx` — 780 linii)

### Problem:
- 780 linii z modalami dodawania/edycji/usuwania
- Karty pokazuja: avatar, imie, wiek, plec badge, etap badge, trener
- 3 przyciski akcji per karta (profil, edytuj, usun)

### Zmiana:
- Modalne formularze wydzielic do osobnych komponentow
- Karta dziecka: avatar + imie + wiek + "Ostatnia sesja: 2 dni temu"
- 1 przycisk na karcie (klikniecie → profil), edycja/usuwanie w profilu

---

## Ustawienia (`Settings.jsx` — 792 linii)

### Problem:
**Najdluzszy plik wsr. stron.** 5 zakladek: Profil, Kod zaproszenia (trener), Klub, Bezpieczenstwo, Powiadomienia. Kazda zakladka ma inny typ contentu.

### WYMAGA ISTOTNEGO UPROSZCZENIA.

### Zmiana:
- **Profil** — zostawic (imie, nazwisko, telefon, email)
- **Kod zaproszenia** — przeniesc do osobnej strony `/coach/invite` (to feature trenera, nie ustawienie)
- **Klub** — przeniesc do osobnej strony `/club/membership`
- **Bezpieczenstwo** — zostawic (zmiana hasla + usun konto)
- **Powiadomienia** — uproscic: 2 toggle + quiet hours

**Redukcja: z 5 zakladek do 3 (Profil, Bezpieczenstwo, Powiadomienia). Z 792 do ~300 linii.**

---

## Aktywnosci (`Activities.jsx` — 801 linii)

### Problem:
- Rozwijalne karty z zagniezdzonymi danymi (lokalizacja, nawierzchnia, trener, grupa, focus areas, notatki, attendance grid)
- Brak paginacji — wszystkie aktywnosci ladowane naraz
- 3-4 filtry na gorze
- Kazda rozwinieta karta ma 8-10 pol informacji

### WYMAGA CALKOWITEJ PRZEBUDOWY.

### Zmiana:
- **Paginacja** — max 20 elementow na strone
- **Karta zwijajaca** — tylko: data + typ + gracz/grupa + czas trwania
- **Klikniecie** → osobna strona aktywnosci ze szczegolami
- **Attendance** → osobna sekcja na stronie aktywnosci, nie w rozwijalnej karcie

---

## Chat Rodzica (`Chat.jsx` — 250 linii)

### Status: **OK — funkcjonalny**

### Drobne poprawki:
- Dodac grupowanie wiadomosci po dacie
- Dodac wskaznik "pisze..."
- Pusty stan lepiej podpowiedziec nastepny krok

---

## Recenzje Rodzica (`Reviews.jsx` — 177 linii)

### Status: **DOBRZE ZAPROJEKTOWANE** — rozwijalne karty z progressive disclosure

---

## SkillProgress (`SkillProgress.jsx` — 257 linii)

### Status: **OK** — radar chart + linie trendow to wartosc dodana

### Drobna zmiana: uproscic radar do prostszego wykresu (6 paskow), radar jest trudny do interpretacji

---

## Timeline (`Timeline.jsx` — 189 linii)

### Status: **DOBRZE ZAPROJEKTOWANE** — chronologiczna os czasu z filtrami

---

## Platnosci Rodzica (`Payments.jsx` — 105 linii)

### Status: **OK** — proste 2 sekcje (oczekujace + historia)

---

## Onboarding (`Onboarding.jsx` — 285 linii)

### Status: **DOBRZE ZAPROJEKTOWANE** — multi-step wizard, czytelny progress bar

---

# ROLA: WLASCICIEL KLUBU (Club Admin)

## Dashboard Klubu (`ClubDashboard.jsx` — 335 linii)

### Co jest teraz:
- Header z nazwa klubu
- 4 karty metryk (Zawodnicy, Aktywnosci/msc, Przegady/msc, Attendance %)
- Wykres slupkowy "Zawodnicy per Etap"
- 3 pierscienie procentowe "Ciaglosc Sciezki" (cele, przegady, aktywnosci)
- Lista "Zawodnicy wymagajacy uwagi" z kolorowymi badge powodow (4 typy)
- Lista "Nadchodzace aktywnosci"

### Problem:
**Najbardziej przeladowany dashboard.** 6 sekcji wlacznie z wykresami i listami. Pierscienie procentowe "Ciaglosc Sciezki" to metryka ktora jest nieczytelna bez kontekstu. Wykres slupkowy i pierscienie obok siebie tworzac chaos wizualny.

### Co wlasciciel klubu naprawde potrzebuje:
1. **Czy cos wymaga mojej uwagi?** → lista problemow
2. **Jak wyglada dzisiejszy dzien?** → dzisiejsze aktywnosci
3. **Ogolne zdrowie klubu** → 2-3 kluczowe metryki (nie 4 + 3 pierscienie + wykres)

### WYMAGA ISTOTNEJ PRZEBUDOWY.

### Nowy layout:

```
+------------------------------------------+
|  Klub Tenisowy Warszawa                   |
+------------------------------------------+
|                                           |
|  Do obslugi (3)               [Zobacz]    |
|                                           |
|  ! Jan K. — brak aktywnosci >14 dni      |
|  ! Sonia N. — brak przeglaqu >30 dni     |
|  ! Piotr M. — brak celow                 |
|                                           |
+------------------------------------------+
|                                           |
|  Dzisiaj                                  |
|  10:00 — Grupa U10 (Kort 1, Trener K.)   |
|  14:00 — Kort indywidualny (Kort 2)      |
|                                           |
+------------------------------------------+
|                                           |
|  Klub w liczbach                          |
|  47 zawodnikow • 12 aktywnosci/tyg       |
|  6 trenerow • 89% attendance             |
|                                           |
+------------------------------------------+
```

**Usunac:**
- Wykres slupkowy "Zawodnicy per Etap" → przeniesc do raportow
- 3 pierscienie "Ciaglosc Sciezki" → usunac calkowicie (metryka nieczytelna)
- 4 osobne karty metryk → zredukopwac do 1 sekcji z 4 liczbami inline

---

## Ustawienia Klubu (`ClubSettings.jsx` — 411 linii)

### Problem:
Duzy formularz z wieloma sekcjami. Miksa zarzadzanie trenerami z ustawieniami klubu.

### Zmiana:
- Oddzielic "Zarzadzanie trenerami" do osobnej strony
- Uproscic formularz do: nazwa, adres, kontakt, opis

---

## Infrastruktura (`ClubFacility.jsx` — 513 linii)

### Status: **OK** — lista kortow z edycja

### Drobna zmiana: uproscic formularz dodawania (za duzo pol jak na dodanie kortu)

---

## Zawodnicy Klubu (`ClubPlayers.jsx` — 346 linii)

### Problem:
Karta gracza pokazuje: avatar, imie, wiek, etap, trener, status subskrypcji, 3 przyciski akcji.

### Zmiana:
- Usun status subskrypcji z listy (to dane finansowe, nie treningowe)
- Zmniejsz do: imie + wiek + trener + etap

---

## Platnosci Klubu (`ClubPayments.jsx` — 242 linii)

### Status: **OK** — lista z filtrami, czytelny layout

---

## Raporty (`ClubReports.jsx` — 224 linii)

### Status: **OK** — taby z raportami. Tutaj powinny trafic wszystkie statystyki usunie z dashboardow.

---

## Lista Trenerow (`CoachesList.jsx` — 349 linii)

### Status: **OK** — prosta lista

---

# STRONY WSPOLDZIELONE

## Grupy (`Groups.jsx` — 1215 linii)

### WYMAGA CALKOWITEJ PRZEBUDOWY (opisane w sekcji Trenera)

---

## Aktywnosci (`Activities.jsx` — 801 linii)

### WYMAGA CALKOWITEJ PRZEBUDOWY (opisane w sekcji Trenera)

---

## Kalendarz (`Calendar.jsx` — 185 linii)

### Status: **OK** — FullCalendar z legenda kolorow

---

## Wiadomosci (`Messages.jsx` / `Chat.jsx`)

### Status: **OK — funkcjonalny**

---

# PRIORYTETYZACJA PRZEBUDOWY

## Faza 1 — Krytyczne (natychmiastowy wplyw na UX)

| # | Strona | Akcja | Estymata trudnosci |
|---|--------|-------|-------------------|
| 1 | **CoachPlayerProfile** | Calkowita przebudowa: 7 tabow → 4 sekcje zwijaln + osobne podstrony | Duze |
| 2 | **ChildProfile** | Calkowita przebudowa: 10 sekcji → 5 prostych blokow | Duze |
| 3 | **CoachDashboard** | Przebudowa: "dzisiejszy plan" jako centrum + alerty | Srednie |
| 4 | **ClubDashboard** | Przebudowa: "do obslugi" + "dzisiaj" + uproszczone metryki | Srednie |

## Faza 2 — Wazne (czytelnosc i nawigacja)

| # | Strona | Akcja | Estymata trudnosci |
|---|--------|-------|-------------------|
| 5 | **Groups** | Przebudowa: lista → osobne strony grup | Duze |
| 6 | **Activities** | Przebudowa: paginacja + osobne strony aktywnosci | Duze |
| 7 | **Settings** | Redukcja: 5 tabow → 3 + wydzielenie feature-ow | Srednie |
| 8 | **CoachCalendar modal** | Uproszczenie: 15 pol → 5 pol w tworzeniu | Male |

## Faza 3 — Polerowanie (spójnosc i detale)

| # | Strona | Akcja | Estymata trudnosci |
|---|--------|-------|-------------------|
| 9 | **CoachPlayers** | Uproszczenie kart: usunac skill chips | Male |
| 10 | **CoachPayments** | Formularz jako modal, usunac stats | Male |
| 11 | **CoachNewReview** | Polaczyc AI/prefill, zredukowac pola | Srednie |
| 12 | **MyChildren** | Uproscic karty, 1 akcja per karta | Male |
| 13 | **ParentDashboard** | Uproscic hero, dodac "nastepna sesja" | Male |

---

# SYSTEMOWE ZMIANY (przekrojowe)

## 1. Design System — jednolity styl

**Problem:** Kazda strona ma wlasne inline styles. Brak spojnosci miedzy kartami, przyciskami, badge'ami.

**Rozwiazanie:** Stworzyc plik `design-tokens.css` z:
- Ustandaryzowane karty (`.card-sm`, `.card-md`, `.card-lg`)
- Jedna paleta kolorow semantycznych (success/warning/danger/info)
- Jedna hierarchia typografii (h1/h2/h3/body/caption)
- Ustandaryzowane badge'e (`.badge-status`, `.badge-type`)
- Ustandaryzowane formularze (`.form-group`, `.form-row`)

## 2. Progressive Disclosure

**Problem:** Wszystko widoczne od razu.

**Rozwiazanie:**
- Listy: max 5 elementow + "Zobacz wszystko" link
- Formularze: kluczowe pola widoczne, "Wiecej opcji" rozwijane
- Profile: podsumowanie widoczne, szczegoly na podstronach
- Dashboardy: 3 sekcje max na ekranie

## 3. Paginacja

**Problem:** Activities, Sessions, Reviews — laduja wszystko naraz.

**Rozwiazanie:** Implementacja paginacji server-side (20 elementow per strona) dla wszystkich list.

## 4. Nawigacja

**Problem:** Sidebar ma 7-12 pozycji. Niektorae sciezki sa niespojne (`/players` vs `/coach/players`).

**Rozwiazanie:**
- Trener: 5 pozycji (Panel, Kalendarz, Zawodnicy, Wiadomosci, Ustawienia)
- Rodzic: 4 pozycje (Panel, Moje Dzieci, Wiadomosci, Ustawienia)
- Klub: 5 pozycji (Panel, Zawodnicy, Trenerzy, Finanse, Ustawienia)
- Grupy, Recenzje, Raporty — dostepne z poziomu stron, nie sidebaru

## 5. Responsywnosc mobilna

**Problem:** Multi-kolumnowe layouty, szerokie formularze, male przyciski.

**Rozwiazanie:**
- Karty zawsze single-column na mobile
- Formularze pelnoekranowe na mobile
- Touch-friendly przyciski (min 44px)
- Bottom navigation zamiast sidebar na mobile

---

# METRYKI SUKCESU

Po przebudowie kazdy ekran powinien spelnic:

| Kryterium | Cel |
|-----------|-----|
| Sekcji na ekranie | Max 3-4 (bez scrollowania) |
| Pol w formularzu tworzenia | Max 5-6 (reszta w edycji) |
| Elementow informacji per karta | Max 3-4 |
| Linii kodu per strona | Max 300-400 |
| Czas do pierwszej akcji | < 3 sekundy (uzytkownik wie co robic) |
| Pozycji w sidebarze | Max 5-6 per rola |

---

# PODSUMOWANIE

| Rola | Ekranow do przebudowy | Ekranow OK | Priorytet |
|------|----------------------|------------|-----------|
| **Trener** | 5 (profil, dashboard, grupy, aktywnosci, ustawienia) | 6 (sesje, recenzje, lista graczy, prosby, turnieje, kalendarz) | Najwyzszy — trener uzywa apki codziennie |
| **Rodzic** | 3 (profil dziecka, moje dzieci, dashboard) | 7 (recenzje, timeline, chat, platnosci, pricing, onboarding, skill progress) | Wysoki — rodzic musi czuc sie komfortowo |
| **Klub** | 2 (dashboard, ustawienia) | 4 (zawodnicy, platnosci, raporty, trenerzy) | Sredni — mniej uzytkownikow, ale wazni |
| **Wspolne** | 2 (grupy, aktywnosci) | 2 (kalendarz, wiadomosci) | Wysoki — te ekrany widza wszyscy |

**Laczna skala przebudowy:** 12 ekranow wymaga istotnych zmian, 19 ekranow jest OK lub wymaga drobnych poprawek.

**Glowna zasada:** Nie dodawaj wiecej — zabieraj. Kazdy element ktory usuniesz z ekranu sprawia ze pozostale staja sie bardziej widoczne i wartosciowe.
