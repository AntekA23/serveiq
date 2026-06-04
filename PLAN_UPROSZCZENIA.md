# Plan radykalnego uproszczenia ServeIQ

> Cel: system ma **przestać przytłaczać**. Zostaje tylko najważniejsza funkcjonalność,
> reszta znika lub chowa się głębiej. Każdy ekran ma być prosty, intuicyjny i przejrzysty —
> nawet kosztem radykalnej zmiany UX. Dokument roboczy; decyzje oznaczone 🔶 wymagają Twojej akceptacji.
> Stan wyjścia zweryfikowany audytem wizualnym na żywo (2026-06-03).

---

## 1. Zasada nadrzędna

**Jeden ekran = jedno zadanie = jedno pytanie, na które odpowiada.**
Jeśli ekran odpowiada na dwa pytania — dzielimy albo wycinamy słabsze.
Jeśli dwa ekrany odpowiadają na to samo — scalamy w jeden.

## 2. Reguła decyzyjna (co zostaje)

Funkcja/ekran zostaje tylko, jeśli przechodzi **jeden** z testów:
- **A) Pętla:** służy pętli `Plan → Komunikacja → Monitoring → Ocena → Rekomendacja`.
- **B) Sprzedaż:** buduje historię Tennis 10 / wartość dla klubu (kupującego).

Jeśli nie przechodzi żadnego → **UTNIJ albo schowaj**. Domyślnie tniemy.

---

## 3. Naprawy przekrojowe (dotyczą wszystkich ról)

Te rzeczy psują wrażenie wszędzie naraz — robimy je raz, działa globalnie.

| # | Problem (z audytu) | Naprawa |
|---|---|---|
| P1 | **Pustka na desktopie** — treść w wąskiej kolumnie ~640px, ~40% ekranu czarne. Czuć „niedokończone". | Świadomy layout: wygodna szerokość treści + tam, gdzie sensownie, układ 2-kolumnowy (np. lista + szczegół). Koniec z jedną wąską kolumną na środku. 🔶 |
| P2 | **Surowe etykiety enum** lecą do UI: `tennis10_red`, `developmentLevel`, statusy. | Jedna mapa etykiet PL → ludzkie nazwy („Tennis 10 — czerwony"). Zero kodów w UI. |
| P3 | **Niespójny akcent** — tytuł „OCENY I REKOMENDACJE" ma różowy gradient, reszta limonkowa. | Jeden kolor akcentu (limonka). Usunąć przypadkowe gradienty. |
| P4 | **Landing nieaktualny** — hero „Połącz WHOOP lub Garmin", pozycjonowanie wearable-first, sprzeczne z pivotem na kluby. Sekcje znikają, bo reveal-on-scroll je chowa. | Przepisać landing na historię **Tennis 10 / klub**. Usunąć wątek wearables. Naprawić znikające sekcje. 🔶 |
| P5 | **Stany puste/ładowania/błędu** robione ad-hoc (raz spinner, raz nic, gdzieniegdzie „0" bez etykiety). | Jeden zestaw komponentów: pusty stan (ikona + zdanie + 1 akcja), szkielet ładowania, błąd. Użyć wszędzie. |
| P6 | **Login rate-limiter za ostry** — po kilku próbach „Zbyt wiele zapytań, spróbuj za 15 minut". Blokuje też testy. | Rozluźnić próg logowania (albo liczyć per-konto, nie per-IP). |
| P7 | Przełącznik **DEV** zasłania stopkę paska bocznego (avatar/nazwa użytkownika). | Przenieść widget DEV w prawy dolny róg. |
| P8 | **Mobile niesprawdzony** — rodzic jest „telefon-first". | Osobny przebieg mobilny po skończeniu desktopu. |

---

## 4. RODZIC — najważniejsza rola (punkt zaufania, telefon-first, laik)

**Jedno zadanie rodzica:** „Wiem, co z moim dzieckiem (plan + postęp) i jestem w kontakcie z trenerem."

### Problem główny
**Panel ≈ Profil dziecka** — prawie identyczna treść (hero, plan tygodnia, nadchodzące, ostatnia ocena). Rodzic z jednym dzieckiem ma dwa razy to samo. To czysty szum.

### Decyzja kierunkowa 🔶
**Dziecko = strona startowa.** Kasujemy osobny „Panel". Po wejściu rodzic ląduje od razu na **hubie dziecka**. Przy kilku dzieciach — wąski przełącznik dziecka u góry (już istnieje). „Panel" jako osobny ekran znika.

### Docelowe menu rodzica (z ~7 pozycji → 5)
`[Dziecko/Dzieci] · Płatności · Zespół · Wiadomości · Ustawienia`

### Ekran po ekranie
| Ekran dziś | Decyzja | Docelowo |
|---|---|---|
| **Panel** (`/parent/dashboard`) | **SCAL** w hub dziecka | Znika jako osobny ekran. Treść = hub dziecka. |
| **Profil dziecka** (`/parent/child/:id`) | **ZOSTAW** (to serce) | Jedyny bogaty ekran rodzica. Hub: Plan · Kalendarz · Turnieje · Oceny · Historia · Odznaki (już zrobione) + skróty: plan tygodnia, nadchodzące, ostatnia ocena. |
| **Plan treningowy** (`/parent/training-plan`) | **UPROŚĆ** | Widok „więcej szczegółu" planu — ale ma nie być trzecią kopią siatki tygodnia. Wejście tylko z huba. |
| **Turnieje** (`/parent/tournaments`) | ZOSTAW | Wejście z huba (już z `?child=`). |
| **Oceny** (`/reviews`) | ZOSTAW | Wejście z huba. Czytelne karty rozwijane. |
| **Historia/Timeline** (`/parent/child/:id/timeline`) | ZOSTAW | Wejście z huba. |
| **Odznaki** (`/parent/child/:id/badges`) | ZOSTAW | Wejście z huba. „Dzienniczek osiągnięć". |
| **Płatności** (`/parent/payments`) | ZOSTAW (w menu) | Już odsłonięte. |
| **Zespół** (`/parent/team`) | ZOSTAW | Trenerzy dziecka + „Dodaj trenera". |
| **Dodaj trenera** (`/parent/add-coach`) | ZOSTAW | Wejście z „Zespół". |
| **Moje dzieci** (`/my-children`) | **UPROŚĆ** | Tylko gdy >1 dziecko lub dodawanie. Inaczej schowane (przełącznik załatwia wybór). |
| **Cennik** (`/parent/pricing`) | **UTNIJ z widoku** | Pokazywać tylko przy realnym upsellu, nie jako stała pozycja. |
| Resztki **wearables/zdrowie** | **UTNIJ** | Poza strategią club-first. Usunąć z UI rodzica. 🔶 |

### Drobne (z audytu)
- Hero dziecka: surowe `tennis10_red` → „Tennis 10 — czerwony" (P2).
- Hero: samotne **„0"** bez etykiety (średni wynik umiejętności) — ukryć gdy 0 albo opisać.

---

## 5. TRENER — codzienny użytkownik roboczy

**Jedno zadanie trenera:** „Prowadzę dzień treningowy zawodników: planuję, notuję, oceniam, rozliczam."

Menu już uproszczone (9→6) i działa dobrze (Panel · Kalendarz · Zawodnicy · Wiadomości · Płatności · Ustawienia). Teraz **wnętrze ekranów**.

### Problem główny
**Profil zawodnika jest długą rolką** — przy zwykłym dziecku: plan, sesje, cele, obserwacje, idol, odznaki, oceny. Przy zawodniku „performance" (Sonia) dochodzi 7 dodatkowych sekcji (palmares, sztab, ranking, sezon, mecze, trajektoria). Gęsto i przytłaczająco.

### Decyzja kierunkowa 🔶
Profil zawodnika **na zakładki zamiast jednej rolki**: `Przegląd · Plan · Postępy · Oceny`. Sekcje „performance" tylko dla zawodnika performance (już warunkowe) i schowane pod zakładką „Kariera". Zwykłe dziecko widzi 4 proste zakładki, nie 11 sekcji.

### Ekran po ekranie
| Ekran dziś | Decyzja | Docelowo |
|---|---|---|
| **Panel** (`/coach/dashboard`) | ZOSTAW | „Dziś" + alerty (płatności, prośby rodziców) + skrót do zawodników. Dobry stan pusty już jest. |
| **Kalendarz** (`/coach/calendar` + zakładki Treningi/Turnieje) | ZOSTAW | Jeden dom czasu (zrobione). |
| **Zawodnicy** (`/players`) | ZOSTAW | Lista → profil. |
| **Profil zawodnika** (`/coach/player/:id`) | **UPROŚĆ (zakładki)** | 4 zakładki; sekcje performance schowane pod „Kariera" i tylko dla performance. |
| **Nowy/edycja sesji, nowy zawodnik, nowa ocena** | ZOSTAW | Formularze — ujednolicić styl (P5). |
| **Oceny** (`/coach/reviews`) | ZOSTAW (poza menu) | Dostępne z profilu (zrobione). |
| **Płatności** (`/coach/payments`) | ZOSTAW | OK. |
| **Wiadomości** | ZOSTAW | Dodać kontekst zawodnika w rozmowie (drobne). |
| **Prośby rodziców** (`/coach/requests`) | ZOSTAW | Alert na Panelu (zrobione). |

---

## 6. KLUB / WŁAŚCICIEL — kupujący (rzadkie, ale ważne użycie)

**Jedno zadanie klubu:** „Widzę, że klub rośnie i jest zdrowy; zarządzam ludźmi i pieniędzmi."

Menu już naprawione (Raporty i Ustawienia klubu odsłonięte, Infrastruktura schowana). Teraz redukcja i wnętrze.

### Decyzja kierunkowa 🔶
**Panel = zdrowie klubu = w dużej mierze Raporty.** Rozważyć **scalenie „Raporty" w „Panel"** (dashboard pokazuje kluczowe wskaźniki + trendy), zamiast dwóch osobnych ekranów. Klub kupuje „mniej chaosu", nie kolejne zakładki.

### Docelowe menu klubu (z 8 → 6-7)
`Panel(+Raporty) · Zawodnicy · Trenerzy · Płatności · Ustawienia klubu · Wiadomości · [Ustawienia konta]`

### Ekran po ekranie
| Ekran dziś | Decyzja | Docelowo |
|---|---|---|
| **Panel** (`/club/dashboard`) | **UPROŚĆ + ew. wchłonąć Raporty** | Zdrowie klubu na jednym ekranie: ilu zawodników/trenerów, frekwencja, „wymagają uwagi", trend retencji. |
| **Raporty** (`/club/reports`) | 🔶 **SCAL w Panel** albo zostaw jako „głębia" | Decyzja: jeden ekran zdrowia czy dwa. Rekomendacja: scalić. |
| **Zawodnicy** (`/club/players`) | ZOSTAW | Lista + przypisz trenera + etap. |
| **Trenerzy** (`/coaches`) | ZOSTAW | Lista + dodaj + kod zaproszeń. |
| **Płatności** (`/club/payments`) | ZOSTAW | Statystyki + eksport CSV. |
| **Ustawienia klubu** (`/club/settings`) | ZOSTAW | Dane, etapy ścieżki, kod, + link Infrastruktura (zrobione). |
| **Infrastruktura** (`/club/facility`) | ZOSTAW (poza menu) | Kreator z Ustawień klubu (zrobione). |

---

## 7. Decyzje do potwierdzenia 🔶 (najbardziej radykalne)

Zanim wdrożę, potwierdź kierunki — to są „punkty bez łatwego odwrotu" w UX:

1. **Rodzic: skasować osobny „Panel" i zrobić hub dziecka stroną startową?** (rekomendacja: tak — kończy déjà-vu)
2. **Rodzic: całkowicie usunąć resztki wearables/zdrowia z UI?** (rekomendacja: tak — poza strategią)
3. **Trener: profil zawodnika na 4 zakładki zamiast długiej rolki?** (rekomendacja: tak)
4. **Klub: scalić „Raporty" w „Panel"?** (rekomendacja: tak — jeden ekran zdrowia)
5. **Landing: przepisać na Tennis 10 / klub i wyciąć wearables?** (rekomendacja: tak)
6. **Layout desktop: szerszy/2-kolumnowy zamiast wąskiej kolumny?** (rekomendacja: tak)

---

## 8. Kolejność prac (fazy)

| Faza | Zakres | Ryzyko | Efekt |
|---|---|---|---|
| **F1 — Przekrojowe** | P2 etykiety, P3 akcent, P5 stany, P6 rate-limit, P7 DEV | Niskie | Natychmiastowy wzrost „dopracowania" wszędzie |
| **F2 — Layout** | P1 szerokość/2 kolumny (wszystkie role) | Średnie | Koniec pustki na desktopie |
| **F3 — Rodzic** | Scalenie Panel→hub, usunięcie wearables, dopieszczenie huba | Średnie | Najprostsza, najczęściej używana rola |
| **F4 — Trener** | Profil zawodnika na zakładki | Średnie | Mniej gęstości u power-usera |
| **F5 — Klub** | Scalenie Raporty→Panel, dopieszczenie | Niskie | Czystszy panel kupującego |
| **F6 — Landing** | P4 przepisanie pozycjonowania | Średnie | Spójność produktu z pivotem |
| **F7 — Mobile** | P8 przebieg telefonowy wszystkich ról | Średnie | Rodzic telefon-first |

Każdą fazę robimy jako osobny, odwracalny krok z buildem i (gdy baza żyje) podglądem na żywo.

---

## 9. Czego NIE ruszamy teraz (świadomie)

- **Modele danych / backend** — bez zmian (Activity/Session/Tournament, Review/ReviewSummary, Goal/DevelopmentGoal). To głęboki dług pojęciowy na osobny, ryzykowny etap.
- **Stripe / Resend / Claude / wearable OAuth** — zaślepki czekają na klucze, nie na UX.
- **Nowe funkcje** — to plan upraszczania, nie rozbudowy. Feature gate (§2) obowiązuje.
