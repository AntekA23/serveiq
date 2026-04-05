# Sprint 9 — Pilot Onboarding Readiness

**Okres**: 25-31 maja 2026
**Cel sprintu**: Produkt mozna wdrozyc u prawdziwego klienta — onboarding, import danych, redukcja tarcia.

---

## Taski

### A1. Onboarding flow dla klubu
**Nowy:** `client/src/pages/club/ClubSetup.jsx`

**Wizard 4 kroki:**
1. **Dane klubu**: nazwa, miasto, adres, telefon, email, nawierzchnie, liczba kortow
   - API: `POST /api/clubs` (istnieje, tworzy z domyslnymi pathwayStages)
2. **Zaproszenie trenerow**: lista email -> wysylka zaproszen
   - Rozszerzyc backend: endpoint zaproszenia trenerow do klubu (email + rola coach)
   - Trener dostaje email z linkiem do rejestracji z przypisaniem do klubu
3. **Tworzenie grup**: nazwa, trener (z zaproszonych), pathwayStage, maxPlayers
   - API: `POST /api/groups` (istnieje)
4. **Podsumowanie**: co stworzono, nastepne kroki (dodanie graczy)

**Route:** `/club/setup` — dostepne po rejestracji clubAdmin jesli !club

---

### A2. Import graczy (CSV lub batch)
**Nowy:** `client/src/pages/club/ImportPlayers.jsx`
**Backend:** `server/src/controllers/playerController.js` — nowy endpoint

**Endpoint:** `POST /api/players/batch`
**Body:**
```json
{
  "players": [
    { "firstName": "Jan", "lastName": "Kowalski", "dateOfBirth": "2018-05-15", "gender": "M", "parentEmail": "jan.rodzic@email.com", "group": "groupId", "pathwayStage": "beginner" }
  ]
}
```

**Logika:**
- Dla kazdego gracza: stworz Player, opcjonalnie stworz/linkuj rodzica
- Jesli parentEmail istnieje i user nie istnieje: stworz konto z inviteToken, wyslij email
- Jesli parentEmail istnieje i user istnieje: dodaj gracza do parentProfile.children
- Przypisz do grupy jesli podana
- Zwroc raport: created, linked, errors

**Frontend:**
- Upload CSV z mappingiem kolumn (drag-drop lub file picker)
- Lub formularz tabelaryczny: wiersz per gracz, przycisk "Dodaj wiersz"
- Preview przed importem
- Raport po imporcie: "Dodano 15 graczy, wyslano 12 zaproszen, 1 blad"

---

### A3. Admin shortcuts
**Modyfikacja:** Groups page + Activities page

- **Szybkie dodanie graczy do grupy**: multi-select graczy -> "Dodaj do grupy" -> PUT /api/groups/:id z { players }
- **Szybkie przypisanie trenera do grupy**: select trenera w edycji grupy
- **Kopiowanie aktywnosci**: przycisk "Kopiuj" na aktywnosci -> formularz z prefilled danymi, nowa data
- **Powtarzajace sie zajecia**: przy tworzeniu aktywnosci: toggle "Powtarzaj tygodniowo" + ile tygodni -> backend tworzy N aktywnosci

---

### A4. Fix friction z demo
**Na podstawie feedbacku z demo (Sprint 8):**
- Lista zgloszoych problemow
- Priorytetyzacja: P1 (blokuje uzycie), P2 (irytujace), P3 (nice-to-have)
- Fix P1 i P2 w tym sprincie

**Typowe friction points do sprawdzenia:**
- Czy formularz aktywnosci jest za dlugi? -> skroc, domyslne wartosci
- Czy rodzic rozumie co widzi? -> dodaj tooltips/opisy
- Czy trener moze szybko dodac notatke? -> max 2 klikniecia
- Czy nawigacja jest intuicyjna? -> breadcrumbs jesli brak

---

### A5. Rozmowy pilotowe
**Zadanie komercyjne:**
- 2-3 kandydatow na pilota zidentyfikowanych z outboundu (Sprint 8)
- Draft umowy pilotowej wyslany
- Pilot success criteria zdefiniowane:
  - Min. 5 trenerow korzysta tygodniowo
  - Min. 10 rodzicow sprawdza profil dziecka
  - Min. 1 przeglad opublikowany
  - Feedback zebrane po 4 tygodniach

---

## Kolejnosc realizacji

| Dzien | Taski | Co powstaje |
|---|---|---|
| Pon 26 maj | A1 (club setup wizard) | Klub moze byc setup-owany |
| Wt 27 maj | A2 (batch import — backend + frontend) | Import graczy |
| Sr 28 maj | A3 (admin shortcuts) | Szybsze operacje |
| Czw 29 maj | A4 (friction fixes) | Gladsza UX |
| Pt 30 maj | A5 (pilot conversations) | Komercja |

---

## Definition of Done

- [ ] Klub moze byc setup-owany w < 30 minut (wizard 4 kroki)
- [ ] Import batch graczy dziala (min. formularz tabelaryczny)
- [ ] Szybkie dodanie do grupy, kopiowanie aktywnosci
- [ ] Top friction points z demo naprawione
- [ ] Min. 2 kandydatow pilotowych w aktywnych rozmowach
- [ ] `vite build` przechodzi bez bledow
