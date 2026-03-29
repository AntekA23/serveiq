# Plan treningowy — redesign UX

## Problem

Obecna strona planu treningowego jest przeładowana. Na jednej stronie mamy:
- Przełącznik widoku tydzień/miesiąc z nawigacją
- Podsumowanie tygodnia z breakdown wg typów
- Widok agendowy 7 kolumn (lub kalendarz miesięczny)
- Formularz dodawania treningu (6 typów, godzina, czas, tytuł, notatka)
- Szczegóły dnia (w widoku miesięcznym)
- Zaplanowane dni treningowe (7 przycisków toggle)
- Obszary fokusa z tagami + notatki + tryb edycji
- Kamienie milowe z CRUD + timeline

Rodzic wchodzi pierwszy raz i widzi ścianę kontrolek. Nie wie od czego zacząć. 749 linii JSX w jednym pliku to kolejny sygnał — komponent robi za dużo.

## Diagnoza: co jest źle

### 1. Zbyt wiele funkcji na jednym ekranie
Kalendarz, plan tygodnia, cele, fokus, milestones — to 5 różnych zadań umysłowych naraz. Użytkownik musi w głowie przeskakiwać między "co było" a "co planujemy".

### 2. Widok tygodniowy 7-kolumnowy nie działa na mobile
Na telefonie 7 wąskich kolumn jest nieczytelne. Responsywny fallback (stos pionowy) zamienia agendę w długą listę bez kontekstu.

### 3. Formularz dodawania jest za skomplikowany
6 typów jako karty, time picker, presety czasu trwania, custom input, tytuł, notatka — za dużo dla prostej czynności "dodaj trening". Rodzic chce: "wtorek, kort, 90 minut". Gotowe.

### 4. Konfiguracja planu (scheduledDays, focus, milestones) miesza się z logiem treningów
"Planuję co robić" i "zapisuję co zrobiłem" to dwa różne konteksty. Teraz oba są na jednej stronie, jeden pod drugim, bez wizualnego oddzielenia.

### 5. Plik jest za duży
749 linii w jednym pliku. WeekAgenda, MonthCalendar, AddSessionForm, ScheduledDays, FocusAreas, MilestoneTimeline, WeeklySummary, SessionEntry, DayDetail — 9 komponentów w jednym pliku. Trudne do utrzymania.

---

## Nowy design: 2 zakładki + uproszczony flow

### Architektura strony

Strona `Plan treningowy` dostaje **2 wewnętrzne zakładki** na samej górze:

```
[ Kalendarz ]  [ Moj plan ]
```

**Zakładka "Kalendarz"** — dziennik treningów (co było, co dodaję)
**Zakładka "Moj plan"** — konfiguracja planu (cele, dni, fokus, milestones)

To rozdziela dwa konteksty: "logowanie aktywności" vs "planowanie rozwoju".

---

### Zakładka 1: Kalendarz

#### Widok domyślny: lista tygodniowa (pionowa)

Zamiast 7 kolumn — **pionowa lista 7 dni**, każdy dzień to rozwijany wiersz:

```
╔══════════════════════════════════════════╗
║  Pon 24.03       ●●     2h 30min        ║
║  ┌─ 10:00  Kort           90min  ■ ──┐  ║
║  │  Trening techniczny               │  ║
║  ├─ 11:45  Rozciąganie    30min  ■ ──┤  ║
║  │  Stretching po treningu            │  ║
║  └─                              [+] ─┘  ║
╠══════════════════════════════════════════╣
║  Wt 25.03        ○      wolne           ║
╠══════════════════════════════════════════╣
║  Sr 26.03        ●●●    3h 30min        ║
║  ┌─ 09:00  Kondycja       60min  ■ ──┐  ║
║  ├─ 14:00  Kort           90min  ■ ──┤  ║
║  └─ 15:45  Rozciąganie    20min  ■ ──┘  ║
╠══════════════════════════════════════════╣
║  ...                                     ║
╚══════════════════════════════════════════╝
```

- Każdy dzień: nagłówek z datą, kolorowe kropki typów, suma czasu
- Pod nagłówkiem: lista wpisów (jeśli są) — kompaktowo, czytelnie
- Dni bez wpisów: zwinięte do jednej linii ("wolne" lub "zaplanowany — brak wpisu")
- Przycisk [+] przy każdym dniu — szybkie dodawanie
- Nawigacja: strzałki lewo/prawo przesuwają tydzień
- Opcja: przełącznik na widok miesięczny (mała siatka z kropkami jak teraz)

#### Uproszczone dodawanie treningu

Klik [+] otwiera **uproszczony formularz** w miejscu (inline pod dniem):

```
Typ:    [Kort] [Sparing] [Kondycja] [Rozciąganie] [Mecz] [Inne]
               ^^^^^ (wybrane = podświetlone)
Godz:   [10:00]     Czas:  [30m] [60m] [90m] [2h]
Notatka: ___________________________________  (opcjonalnie)
                              [Zapisz]  [Anuluj]
```

- **Tytuł auto-generowany** z typu — nie pytamy. Rodzic nie musi wymyślać tytułu.
- **Czas: 4 przyciski** (30m / 60m / 90m / 2h) zamiast 6 presetów + custom input
- **Notatka opcjonalna** — jedno pole, nie osobne "tytuł" + "notatka"
- Cały formularz: 3 linijki, zero scrollowania

#### Widok miesięczny

Zostaje jako mniejszy, kompaktowy widok:
- Siatka 7×5 z kolorowymi kropkami
- Klik na dzień → scroll do tego dnia w widoku tygodniowym (lub pokaz listy pod kalendarzem)
- Służy do szybkiego przeglądu miesiąca, nie do edycji

---

### Zakładka 2: Mój plan

Czysta, spokojna strona z ustawieniami planu — edytowana rzadko, nie przy każdej wizycie.

#### Sekcja 1: Cel tygodniowy
```
Treningi na tydzień:  [  5  ]
Godziny na tydzień:   [  8  ]
```
Dwa pola liczbowe. Inline edit (klik → zmiana → auto-zapis).

#### Sekcja 2: Dni treningowe
```
[Pon] [Wt] [Sr] [Czw] [Pt] [Sb] [Nd]
  ✓          ✓    ✓     ✓    ✓
```
7 przycisków toggle. Bez zmian — to działa dobrze.

#### Sekcja 3: Fokus
```
[Serwis ✓] [Forhend] [Bekhend ✓] [Wolej] [Taktyka] [Kondycja ✓]
Notatka: Skupić się na drugim serwisie i grze przy siatce.
```
Tagi z toggle + pole na notatki. Uproszczony tryb edycji — **zawsze widoczne**, bez przycisków "Edytuj/Zapisz". Klik na tag = toggle + auto-zapis. Notatka zapisuje on blur.

#### Sekcja 4: Kamienie milowe
```
○ Turniej Warszawa Open Junior — 15 kwietnia 2026
○ Serwis na poziomie 85% — 1 maja 2026
○ Ranking PZT top 40 — grudzień 2026
──────────────────────────────
✓ Opanowanie kick serve — ukończone 5 marca
✓ Poprawa woleja do 50% — ukończone 18 lutego
                                     [+ Dodaj cel]
```
Timeline jak teraz, ale:
- **Usunięcie przycisków Edit/Delete z widoku** — zamiast tego: long-press lub swipe na mobile, hover-menu na desktop
- **Uproszczony formularz dodawania** — jedno pole "Cel" + opcjonalna data. Bez osobnego "opisu".

---

### Struktura plików (refactor)

Zamiast jednego 749-liniowego pliku:

```
pages/parent/TrainingPlan.jsx          — główny layout z tabami (Kalendarz | Mój plan)
pages/parent/training-plan/
  CalendarTab.jsx                      — lista tygodniowa + widok miesięczny
  PlanTab.jsx                          — cel, dni, fokus, milestones
  WeekList.jsx                         — pionowa lista dni z wpisami
  MonthGrid.jsx                        — siatka miesięczna (kompaktowa)
  AddSessionInline.jsx                 — uproszczony formularz dodawania
  SessionEntry.jsx                     — pojedynczy wpis treningowy
  WeeklySummary.jsx                    — podsumowanie tygodnia
  MilestoneTimeline.jsx                — kamienie milowe CRUD
```

Każdy plik: 80–150 linii. Łatwy do czytania, testowania, modyfikacji.

---

## Kluczowe zmiany UX

| Przed | Po |
|-------|-----|
| Wszystko na jednym ekranie | 2 zakładki: Kalendarz / Mój plan |
| 7-kolumnowy widok tygodnia | Pionowa lista dni (mobile-first) |
| Formularz z 8 polami | 3 pola: typ, godzina+czas, notatka (opcja) |
| Tytuł treningu wymuszony | Auto-generowany z typu |
| 6 presetów czasu + custom | 4 przyciski: 30m / 60m / 90m / 2h |
| Fokus: tryb edycji z przyciskami Save/Cancel | Klik = toggle + auto-zapis |
| Milestones: widoczne Edit/Delete przyciski | Hover/long-press menu |
| 1 plik 749 linii | 8 plików po 80-150 linii |

## Priorytety implementacji

1. **Rozbicie na pliki** — najpierw refactor struktury bez zmiany UI
2. **2 zakładki** — rozdzielenie Kalendarz vs Plan
3. **Nowy widok tygodniowy** — pionowa lista zamiast 7 kolumn
4. **Uproszczony formularz** — 3 pola zamiast 8
5. **Auto-zapis w Mój plan** — fokus tagi + notatka bez Save/Cancel
6. **Czyszczenie CSS** — usunięcie nieużywanych stylów

## Czego NIE robimy

- Nie dodajemy nowych funkcji
- Nie zmieniamy API (te same endpointy)
- Nie zmieniamy modelu danych
- Nie ruszamy innych stron (Dashboard preview, etc.)

To jest czysto UX-owy redesign: mniej na ekranie, mniej kroków, mniej decyzji.
