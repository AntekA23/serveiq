# Sprint 3 — Planning Backbone

**Okres**: 13-19 kwietnia 2026
**EPIC**: E3 (Planowanie aktywnosci)
**Cel sprintu**: Aktywnosci dzialaja end-to-end — trener tworzy/zarzadza, rodzic widzi plan dziecka, kalendarz dziala.

---

## Stan zastany

### Backend — GOTOWE (pelne!)
- Model Activity z 8 typami: class, camp, tournament, training, match, fitness, review, other
- activityController: getActivities, createActivity, getActivity, updateActivity, deleteActivity, updateAttendance, getCalendar, getUpcoming
- Routes: GET/POST/PUT/DELETE + /calendar + /upcoming + /:id/attendance
- Attendance tracking z statusami: present, absent, late, excused
- Zod walidacja: createActivitySchema, updateActivitySchema
- Filtry: per klub, gracz, typ, miesiac, grupa
- visibleToParent field
- tournamentData embedded (category, drawSize, result)

### Frontend — BRAKUJE (placeholder "Aktywnosci")
- `client/src/pages/shared/Activities.jsx` — placeholder
- `client/src/pages/shared/Calendar.jsx` — placeholder
- Brak formularza tworzenia aktywnosci (trener)
- Brak widoku aktywnosci w profilu dziecka (rodzic)
- Brak kalendarza

---

## Taski

### A1. Strona Aktywnosci dla trenera
**Nadpisac:** `client/src/pages/shared/Activities.jsx`

**Struktura:**
```
Activities (widok zalezny od roli)
  ├── Naglowek + przycisk "Nowa aktywnosc" (tylko coach/clubAdmin)
  ├── Filtry: typ (select multi), miesiac (date picker), gracz (select)
  ├── Lista aktywnosci:
  │     ├── Kolorowa kropka wg typu (class=zielony, camp=niebieski, tournament=czerwony, training=zolty, match=fiolet, fitness=pomarancz)
  │     ├── Tytul + typ badge
  │     ├── Data + czas + czas trwania
  │     ├── Gracze (avatary/inicjaly, max 5 + "+N")
  │     ├── Status badge (planned/completed/cancelled)
  │     └── Klikniecie -> szczegoly/edycja
  └── Empty state: "Zaplanuj pierwsza aktywnosc"
```

**API:** `GET /api/activities` (istnieje, filtry: type, month, player)

**Widok per rola:**
- Coach: widzi swoje aktywnosci, moze tworzyc/edytowac/usuwac
- Parent: widzi aktywnosci swoich dzieci z visibleToParent=true
- ClubAdmin: widzi wszystkie aktywnosci klubu

---

### A2. Formularz tworzenia/edycji aktywnosci
**Nowy:** `client/src/components/activities/ActivityForm.jsx`

**Pola formularza:**
- Typ (select z 8 opcji) — required
- Tytul (text) — required
- Data (date) — required
- Czas start (time) — opcjonalny
- Czas konca (time) — opcjonalny
- Czas trwania w minutach (number) — opcjonalny, auto-calculated z start/end
- Gracze (multi-select z listy graczy trenera) — required min 1
- Grupa (select z grup trenera) — opcjonalny, auto-wypelnia graczy
- Lokalizacja (text) — opcjonalny
- Nawierzchnia (select: clay, hard, grass, carpet, indoor-hard) — opcjonalny
- Focus areas (tag input) — opcjonalny
- Notatki trenera (textarea) — opcjonalny
- Notatki dla rodzicow (textarea) — opcjonalny, pole parentNotes
- Widoczne dla rodzica (toggle) — default true

**Dla turniejow (typ=tournament) dodatkowe pola:**
- Kategoria
- Wielkosc drabinki (drawSize)

**API:**
- Tworzenie: `POST /api/activities`
- Edycja: `PUT /api/activities/:id`

---

### A3. Szczegoly aktywnosci + attendance
**Nowy:** `client/src/components/activities/ActivityDetail.jsx`

**Sekcje:**
- Header: typ badge + tytul + data/czas
- Info: lokalizacja, nawierzchnia, czas trwania, focus areas
- Lista graczy z attendance:
  - Kazdy gracz: avatar + imie + status (present/absent/late/excused)
  - Trener moze zmienic status -> `PUT /api/activities/:id/attendance`
- Notatki trenera
- Notatki dla rodzicow
- Przyciski: Edytuj, Usun (z potwierdzeniem), Zmien status (completed/cancelled)

---

### A4. Kalendarz aktywnosci
**Nadpisac:** `client/src/pages/shared/Calendar.jsx`

**Struktura:**
- Widok miesieczny (siatka 7x5/6)
- Kazdy dzien: kolorowe kropki wg aktywnosci
- Klikniecie na dzien: lista aktywnosci tego dnia
- Nawigacja: poprzedni/nastepny miesiac
- Filtr per typ (opcjonalny)

**API:** `GET /api/activities/calendar?month=2026-04` (istnieje, grupuje po dacie)

**Widok per rola:**
- Trener: wszystkie swoje aktywnosci
- Rodzic: aktywnosci swoich dzieci
- ClubAdmin: wszystkie aktywnosci klubu

---

### A5. Nadchodzace aktywnosci w profilu dziecka
**Modyfikacja:** `client/src/pages/parent/ChildProfile.jsx`

**Dodac sekcje "Nadchodzace":**
- Fetch: `GET /api/activities/upcoming?player=:id&limit=5` (endpoint istnieje!)
- Lista: typ badge + tytul + data + czas
- Link "Zobacz wszystkie" -> /calendar

**Dodac sekcje "Ostatnie aktywnosci":**
- Fetch: `GET /api/activities?player=:id&month=current` z filtrem status=completed
- Lista: typ badge + tytul + data + attendance status dziecka

---

### A6. Walidacja scenariuszy
**Zadanie manualne — sprawdzic:**

**Scenariusz Tennis 10:**
- Trener tworzy aktywnosc typ "class" dla grupy Tennis 10
- Przypisuje 8 dzieci
- Rodzic widzi zajecia w kalendarzu i profilu dziecka
- Trener oznacza obecnosc
- Rodzic widzi "nastepne zajecia" w profilu

**Scenariusz Sonia:**
- Trener tworzy: training (pon, sr, pt), fitness (wt), tournament (weekend)
- Rozne focus areas per aktywnosc
- Turniej z danymi: kategoria, wynik
- Rodzic widzi pelny tydzien w kalendarzu

---

## Kolejnosc realizacji

| Dzien | Taski | Co powstaje |
|---|---|---|
| Pon 14 kwi | A2 (ActivityForm) | Trener moze tworzyc aktywnosci |
| Wt 15 kwi | A1 (Activities page + lista) | Pelna strona aktywnosci z filtrami |
| Sr 16 kwi | A3 (ActivityDetail + attendance) | Szczegoly + obecnosc |
| Czw 17 kwi | A4 (Calendar) | Kalendarz miesieczny |
| Pt 18 kwi | A5 (ChildProfile integration) + A6 (walidacja) | Aktywnosci w profilu dziecka |

---

## Definition of Done

- [ ] Trener moze tworzyc aktywnosci z wyborem typu, graczy, daty
- [ ] Trener moze edytowac, usuwac, zmienic status aktywnosci
- [ ] Trener moze zaznaczac obecnosc graczy
- [ ] Rodzic widzi aktywnosci dziecka (nadchodzace + ostatnie) w profilu
- [ ] Kalendarz miesieczny dziala dla obu rol
- [ ] 8 typow aktywnosci jest obsluzone
- [ ] visibleToParent kontroluje widocznosc dla rodzica
- [ ] Scenariusze Tennis 10 i Sonia zwalidowane
- [ ] `vite build` przechodzi bez bledow
