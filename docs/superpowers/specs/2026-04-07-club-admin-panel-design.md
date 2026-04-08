# Club Admin Panel — Full Design Spec

## Kontekst
Rozbudowa panelu admina klubu (`clubAdmin`) w ServeIQ. Admin = super-trener + zarządca klubu. Podejście: rozszerzenie istniejącego panelu, reużycie komponentów trenerskich z szerszym zakresem danych.

## Sekcja 1: Nawigacja i struktura sidebar

Sidebar pogrupowany w sekcje z nagłówkami:

```
KLUB
  Panel Klubu (dashboard — istnieje)
  Ustawienia Klubu (nowe)
  Infrastruktura (istnieje)

LUDZIE
  Zawodnicy (rozszerzone — wszyscy gracze klubu)
  Trenerzy (istnieje)
  Grupy (istnieje)

TRENING
  Kalendarz (istnieje)
  Przeglądy (istnieje)

FINANSE
  Płatności (nowe)

RAPORTY
  Statystyki (nowe)

KOMUNIKACJA
  Wiadomości (istnieje)
```

- Sekcje z wyszarzonymi etykietami nad grupami linków
- Ustawienia profilu przeniesione do menu avatara w topbarze
- Admin operacyjny: Kalendarz, Przeglądy, Zawodnicy działają jak u trenera ale z pełnym zakresem danych klubowych

## Sekcja 2: Ustawienia Klubu (nowa strona `/club/settings`)

**Dane podstawowe:** nazwa, skrócona nazwa, miasto, adres, telefon, email, www, logo (upload)

**Pathway stages:** CRUD etapów rozwoju (nazwa, opis, zakres wiekowy, kolor, kolejność). Przyciski góra/dół do zmiany kolejności.

**Kod zaproszeniowy:** wyświetlenie + regeneracja (przeniesione z listy trenerów)

**Ustawienia domyślne:** waluta, strefa czasowa, język

**Backend:** `PUT /api/clubs/:id/settings`, `POST /api/clubs/:id/logo`

## Sekcja 3: Zawodnicy — rozszerzony widok klubowy (`/players`)

**Lista:** tabela/karty — imię, wiek, etap pathway, trener, ostatnia aktywność, status (aktywny/nieaktywny/nowy). Filtrowanie po trenerze, etapie, grupie, statusie. Wyszukiwanie + sortowanie.

**Akcje admina:** przypisanie/zmiana trenera, zmiana etapu pathway, przejście do profilu (reużycie CoachPlayerProfile), dezaktywacja (soft).

**Operacyjnie:** admin dodaje sesje, recenzje, cele — jak trener. Endpointy trenerskie akceptują `clubAdmin`.

**Backend:** `GET /api/clubs/:id/players`, `PUT /api/clubs/:id/players/:playerId/assign-coach`, `PUT /api/clubs/:id/players/:playerId/pathway-stage`. Rozszerzenie `requireRole` na endpointach trenerskich.

## Sekcja 4: Finanse klubu (nowa strona `/club/payments`)

Przegląd finansowy klubu — agregacja istniejącego modelu Payment:
- Podsumowanie: łączne przychody (miesiąc/kwartał), zaległości, oczekujące
- Lista płatności z filtrami: trener, gracz, status, okres
- Widok zaległości z opcją przypomnienia (notyfikacja do rodzica)
- Eksport do CSV

**Backend:** `GET /api/clubs/:id/payments` z agregacją + filtrami

## Sekcja 5: Raporty i statystyki (nowa strona `/club/reports`)

Dashboard raportowy:
- Frekwencja: ogólna + per trener + per grupa (wykresy)
- Postępy: rozkład umiejętności graczy, średnie per grupa/etap
- Aktywność trenerów: ile sesji, recenzji, wiadomości w okresie
- Retencja: gracze aktywni vs nieaktywni w czasie
- Pathway: rozkład graczy po etapach, przejścia między etapami

**Backend:** `GET /api/clubs/:id/reports/:type` (attendance, progress, coaches, retention, pathway)
