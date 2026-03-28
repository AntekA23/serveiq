# ServeIQ - Roadmap Rozwoju Produktu SaaS

**Data utworzenia:** 2026-03-28
**Model biznesowy:** SaaS, trial 14 dni + subskrypcja miesięczna
**Docelowy klient:** Rodzic mlodego tenisisty (B2C start, B2B skalowanie do klubow)
**Core value:** Pelny obraz rozwoju dziecka + spokoj rodzica
**Timeline:** ~8 tygodni do beta launch
**Status:** Aktywny

---

## Spis tresci

1. [Faza 0 — Fundament SaaS](#faza-0--fundament-saas-tydzien-1)
2. [Faza 1 — Prawdziwe integracje wearable](#faza-1--prawdziwe-integracje-wearable-tydzien-2-3)
3. [Faza 2 — Pelny obraz rozwoju dziecka](#faza-2--pelny-obraz-rozwoju-dziecka-tydzien-3-4)
4. [Faza 3 — Inteligentne alerty i rekomendacje](#faza-3--inteligentne-alerty-i-rekomendacje-tydzien-4-5)
5. [Faza 4 — Subskrypcje i billing](#faza-4--subskrypcje-i-billing-tydzien-5-6)
6. [Faza 5 — Landing page i beta launch](#faza-5--landing-page-i-beta-launch-tydzien-7-8)
7. [Architektura techniczna](#architektura-techniczna)
8. [Metryki sukcesu](#metryki-sukcesu)
9. [Ryzyka i mitygacja](#ryzyka-i-mitygacja)

---

## Faza 0 — Fundament SaaS (Tydzien 1)

### Cel fazy
Rodzic musi moc samodzielnie zarejestrowac sie, dodac dziecko, wgrac mu zdjecie i zaczac korzystac z aplikacji BEZ pomocy trenera. Dzis rejestracja rodzica wymaga zaproszenia od trenera — to bloker dla modelu SaaS.

### 0.1 Samodzielna rejestracja rodzica

**Obecny stan:** Rodzic moze sie zarejestrowac tylko przez zaproszenie trenera (accept-invite flow). Formularz rejestracji wymaga roli coach/parent, ale parent nie moze nic zrobic bez przypisanego dziecka.

**Docelowy stan:** Rodzic rejestruje sie samodzielnie, od razu trafia na onboarding wizard ktory prowadzi go przez konfiguracje.

**Zadania:**
- [ ] Zmodyfikowac strone `/register` — usunac wybor roli, domyslnie `parent`
- [ ] Dodac walidacje emaila (unikalnsc juz istnieje w modelu)
- [ ] Po rejestracji automatycznie logowac i przekierowac do onboardingu
- [ ] Dodac endpoint `POST /api/auth/register` — akceptuje rejestracje rodzica bez invite tokena
- [ ] Wyslac email powitalny po rejestracji (szablon w Resend)
- [ ] Dodac pole `onboardingCompleted: Boolean` do modelu User

### 0.2 Onboarding wizard

**Flow:** 4 kroki, kazdy na osobnym ekranie z progress barem.

**Krok 1 — Twoje dane**
- Imie, nazwisko (juz z rejestracji)
- Numer telefonu (opcjonalny)
- Zdjecie profilowe (opcjonalne, na pozniej)

**Krok 2 — Dodaj dziecko**
- Imie i nazwisko dziecka (wymagane)
- Data urodzenia (wymagane)
- Plec (M/F)
- Zdjecie dziecka (opcjonalne, upload lub pozniej)

**Krok 3 — Polacz urzadzenie**
- Ekran z dwoma kartami: WHOOP / Garmin
- Mozliwosc pominiecia ("Polacze pozniej")
- Jesli kliknie — otwiera flow polaczenia (istniejacy mock, pozniej prawdziwy OAuth)

**Krok 4 — Gotowe!**
- Ekran potwierdzenia z animacja
- Przycisk "Przejdz do dashboardu"
- Oznacz `onboardingCompleted = true`

**Zadania:**
- [ ] Stworzyc komponent `OnboardingWizard` z 4 krokami i progress barem
- [ ] Stworzyc strone `/parent/onboarding` (chroniona, tylko dla nowych userow)
- [ ] Dodac route guard — jesli `onboardingCompleted === false`, przekieruj na onboarding
- [ ] Stworzyc formularz dodawania dziecka (krok 2)
- [ ] Endpoint `POST /api/players/self` — rodzic sam dodaje dziecko (bez przypisanego trenera)
- [ ] Zmodyfikowac model Player — `coach` nie jest juz `required` (moze byc null)
- [ ] Integracja z istniejacym flow polaczenia urzadzen (krok 3)

### 0.3 Upload zdjecia dziecka

**Obecny stan:** Pole `avatarUrl` istnieje w modelu Player, ale nie ma uploadu. Uzywane sa inicjaly.

**Docelowy stan:** Rodzic moze wgrac zdjecie dziecka (JPEG/PNG, max 5MB). Zdjecie przechowywane w Cloudinary (juz w zaleznosiciach serwera) lub lokalnie na poczatek.

**Zadania:**
- [ ] Stworzyc komponent `AvatarUpload` — drag & drop lub klikniecie, podglad, crop (prosty)
- [ ] Endpoint `PUT /api/players/:id/avatar` z multer middleware (juz zainstalowany)
- [ ] Integracja z Cloudinary (jesli klucze dostepne) lub zapis lokalny w `/uploads`
- [ ] Walidacja: JPEG/PNG, max 5MB, resize do 400x400
- [ ] Wyswietlanie zdjecia w Avatar component (fallback na inicjaly jesli brak)
- [ ] Aktualizacja dashboardu i profilu dziecka aby wyswietlaly prawdziwe zdjecie

### 0.4 Zarzadzanie profilem rodzica

**Zadania:**
- [ ] Stworzyc strone `/parent/settings` z zakladkami: Profil, Bezpieczenstwo, Powiadomienia
- [ ] Zakladka Profil: edycja imienia, nazwiska, telefonu, zdjecia
- [ ] Zakladka Bezpieczenstwo: zmiana hasla, usuwanie konta
- [ ] Endpoint `PUT /api/auth/profile` — aktualizacja danych uzytkownika
- [ ] Endpoint `PUT /api/auth/change-password` — zmiana hasla
- [ ] Endpoint `DELETE /api/auth/account` — soft delete konta (deaktywacja)
- [ ] Dodac link "Ustawienia" do sidebara

### Checkpointy Fazy 0

Wszystkie ponizsze musza byc spelnione przed przejsciem do Fazy 1:

- [ ] **CP-0.1** Nowy uzytkownik moze sie zarejestrowac bez zaproszenia trenera
- [ ] **CP-0.2** Po rejestracji uruchamia sie onboarding wizard (4 kroki)
- [ ] **CP-0.3** Rodzic moze dodac dziecko z imieniem, nazwiskiem, data urodzenia
- [ ] **CP-0.4** Upload zdjecia dziecka dziala (wyswietla sie na dashboardzie i profilu)
- [ ] **CP-0.5** Pominiecie polaczenia urzadzenia nie blokuje onboardingu
- [ ] **CP-0.6** Po zakonczeniu onboardingu rodzic trafia na dashboard z danymi dziecka
- [ ] **CP-0.7** Strona ustawien profilu dziala (edycja danych, zmiana hasla)
- [ ] **CP-0.8** Demo mode nadal dziala poprawnie po zmianach
- [ ] **CP-0.9** Wszystkie istniejace testy i build przechodzoa bez bledow

---

## Faza 1 — Prawdziwe integracje wearable (Tydzien 2-3)

### Cel fazy
Zamienic mockowe dane na prawdziwe dane z WHOOP i Garmin. To jest core value proposition — bez prawdziwych danych aplikacja nie ma sensu jako produkt SaaS.

### 1.1 Integracja Garmin Connect API

**Dlaczego Garmin najpierw:** Garmin ma znacznie wieksza baze uzytkownikow wsrod mlodych sportowcow. Zegarki Garmin sa dostepne w cenach 800-2000 PLN (vs WHOOP 1200 PLN + subskrypcja). Garmin Health API jest dobrze udokumentowane.

**Architektura:**
```
Rodzic klika "Polacz Garmin"
    → Frontend otwiera Garmin OAuth consent screen
    → Uzytkownik autoryzuje dostep
    → Garmin redirectuje z auth code
    → Backend wymienia code na access_token + refresh_token
    → Backend zapisuje tokeny w WearableDevice
    → Backend odpytuje Garmin Health API o dane historyczne
    → Dane zapisywane w WearableData
    → Webhook od Garmin push'uje nowe dane automatycznie
```

**Garmin Health API — dane ktore pobieramy:**
- Daily Summary: HR spoczynkowe, kroki, kalorie, dystans, aktywne minuty
- Sleep: fazy snu, czas snu, jakosc
- Stress: sredni, max, minuty odpoczynku
- Body Battery: aktualny, max, min
- Heart Rate: spoczynkowe, max, srednie, timeline
- Activities/Workouts: typ, czas trwania, HR strefy, kalorie
- Training Status: VO2max, training load, recovery time

**Zadania:**
- [ ] Zarejestrowac aplikacje w Garmin Developer Portal (https://developer.garmin.com)
- [ ] Stworzyc serwis `server/src/services/garminService.js`:
  - `getAuthUrl()` — generowanie URL OAuth
  - `exchangeCode(code)` — wymiana kodu na tokeny
  - `refreshToken(refreshToken)` — odswiezanie tokenow
  - `getDailySummary(token, date)` — pobranie dziennego podsumowania
  - `getSleepData(token, date)` — dane snu
  - `getHeartRate(token, date)` — dane tetna
  - `getStress(token, date)` — dane stresu
  - `getBodyBattery(token, date)` — Body Battery
  - `getActivities(token, startDate, endDate)` — aktywnosci
- [ ] Stworzyc endpoint OAuth callback: `GET /api/wearables/garmin/callback`
- [ ] Stworzyc endpoint inicjacji OAuth: `GET /api/wearables/garmin/auth?playerId=xxx`
- [ ] Zaimplementowac Garmin Push API (webhook) do odbierania nowych danych
- [ ] Endpoint webhook: `POST /api/wearables/garmin/webhook`
- [ ] Mapper danych Garmin → WearableData schema (transformacja formatu)
- [ ] Job do synchronizacji historycznych danych (backfill ostatnich 30 dni)
- [ ] Obsluga odswiezania tokenow (cron lub lazy refresh przy zapytaniu)
- [ ] Testy integracyjne z Garmin API (z mock serverem)

### 1.2 Integracja WHOOP API

**WHOOP Developer API** (https://developer.whoop.com):
- OAuth 2.0 z PKCE
- Dane: recovery, strain, sleep, workouts, cycles
- Rate limits: 100 req/min

**Dane ktore pobieramy:**
- Recovery: score (0-100), HRV (RMSSD), resting HR, status (green/yellow/red)
- Strain: day strain (0-21), calories, active duration
- Sleep: performance %, duration, efficiency, disturbances, respiratory rate
- Workouts: sport, strain, avg HR, max HR, calories, zones

**Zadania:**
- [ ] Zarejestrowac aplikacje w WHOOP Developer Portal
- [ ] Stworzyc serwis `server/src/services/whoopService.js`:
  - `getAuthUrl()` — generowanie URL OAuth z PKCE
  - `exchangeCode(code, codeVerifier)` — wymiana kodu na tokeny
  - `refreshToken(refreshToken)` — odswiezanie tokenow
  - `getRecovery(token, startDate, endDate)` — dane regeneracji
  - `getSleep(token, startDate, endDate)` — dane snu
  - `getStrain(token, startDate, endDate)` — obciazenie
  - `getWorkouts(token, startDate, endDate)` — treningi
- [ ] Endpoint OAuth: `GET /api/wearables/whoop/auth` i `/whoop/callback`
- [ ] Mapper danych WHOOP → WearableData schema
- [ ] Webhook handler: `POST /api/wearables/whoop/webhook`
- [ ] Backfill historii (30 dni)
- [ ] Token refresh logic
- [ ] Fallback na mock dane gdy API niedostepne (graceful degradation)

### 1.3 Refaktor istniejacego kodu wearable

**Zadania:**
- [ ] Wydzielic wspolny interfejs `WearableProvider` — metody: `auth()`, `callback()`, `sync()`, `getData()`
- [ ] Refaktor `wearableController.js` — uzycie provider pattern zamiast if/else
- [ ] Zachowac mock provider jako fallback i dla trybu demo
- [ ] Dodac pole `authState` do WearableDevice: `pending | connected | expired | error`
- [ ] Dodac cron job do automatycznej synchronizacji (co 15 min dla polaczonych urzadzen)
- [ ] Obsluga bledow API: retry z exponential backoff, rate limit handling
- [ ] Logowanie synchronizacji (ostatnia udana sync, bledy, liczba rekordow)

### 1.4 Frontend — prawdziwy OAuth flow

**Zadania:**
- [ ] Zamienic mock modal na prawdziwy OAuth redirect (okno przegladarki)
- [ ] Stworzyc strone callback `/parent/devices/callback` — obsluga powrotu z OAuth
- [ ] Dodac stany: "Laczenie...", "Polaczono!", "Blad polaczenia"
- [ ] Pokazac reaslne dane po polaczeniu (zastapic mock)
- [ ] Dodac status synchronizacji z prawdziwym `lastSyncAt` z backendu
- [ ] Obsluga wygasniecia tokenow — komunikat "Wymagana ponowna autoryzacja"

### Checkpointy Fazy 1

- [ ] **CP-1.1** Garmin OAuth flow dziala end-to-end (autoryzacja → dane na dashboardzie)
- [ ] **CP-1.2** WHOOP OAuth flow dziala end-to-end
- [ ] **CP-1.3** Dane zdrowotne na dashboardzie pochodza z prawdziwego API (nie mock)
- [ ] **CP-1.4** Automatyczna synchronizacja dziala (co 15 min)
- [ ] **CP-1.5** Token refresh dziala — sesja nie wygasa po godzinie
- [ ] **CP-1.6** Blad API nie crashuje aplikacji — graceful fallback
- [ ] **CP-1.7** Mock provider nadal dziala dla trybu demo
- [ ] **CP-1.8** Przynajmniej 1 prawdziwe urzadzenie przetestowane z prawdziwymi danymi

---

## Faza 2 — Pelny obraz rozwoju dziecka (Tydzien 3-4)

### Cel fazy
Dac rodzicowi "wow moment" — widzi jak dziecko sie rozwija w czasie. Wykresy historyczne, porownanie okresow, timeline postepu. To jest glowny powod dla ktorego rodzic placi subskrypcje.

### 2.1 Ekran historii zdrowia

**Nowa strona:** `/parent/child/:id/health`

**Layout:**
```
+--------------------------------------------------+
|  [Kacper Kowalski] > Historia zdrowia             |
+--------------------------------------------------+
|  Zakres: [7 dni] [30 dni] [90 dni] [Rok] [Custom]|
+--------------------------------------------------+
|                                                    |
|  === Tetno spoczynkowe ===                        |
|  [Duzy wykres liniowy 7/30/90 dni]                |
|  Min: 54  Srednie: 61  Max: 68                    |
|  Trend: -2 bpm vs poprzedni okres                 |
|                                                    |
|  === HRV (RMSSD) ===                              |
|  [Duzy wykres liniowy]                            |
|  Srednie: 72ms | Trend: +5% vs poprzedni okres    |
|                                                    |
|  === Jakosc snu ===                               |
|  [Wykres slupkowy — fazy snu kazda noc]           |
|  Srednia jakosc: 82% | Sredni czas: 8.2h          |
|                                                    |
|  === Regeneracja ===                              |
|  [Wykres z kolorowymi strefami green/yellow/red]  |
|  Dni w zielonej strefie: 21/30 (70%)             |
|                                                    |
|  === Obciazenie treningowe ===                    |
|  [Wykres strain z zaznaczonymi treningami]        |
|  Sredni strain: 12.4 | Najwyzszy: 18.7           |
+--------------------------------------------------+
```

**Zadania:**
- [ ] Zainstalowac lekka biblioteke wykresow (recharts lub uplot — maly bundle)
- [ ] Stworzyc strone `/parent/child/:id/health` z wyborem zakresu czasowego
- [ ] Komponent `HealthChart` — wykres liniowy z tooltipem, min/max/avg
- [ ] Komponent `SleepChart` — stacked bar chart (fazy snu)
- [ ] Komponent `RecoveryTimeline` — kolorowy pasek green/yellow/red
- [ ] Komponent `StrainChart` — wykres z ikonkami treningow
- [ ] Endpoint `GET /api/wearables/data/:playerId/trends?range=7|30|90|365`
  - Zwraca agregowane dane: min, max, avg, trend vs poprzedni okres
- [ ] Endpoint `GET /api/wearables/data/:playerId/history?metric=hr|hrv|sleep|recovery|strain&from=&to=`
  - Zwraca dane dzienne do wykresow
- [ ] Logika porownania z poprzednim okresem (np. ostatnie 30 dni vs 30 dni wczesniej)
- [ ] Responsywnosc — wykresy dzialaja na mobile
- [ ] Dodac link "Historia zdrowia" do profilu dziecka i dashboardu

### 2.2 Timeline postepu

**Nowa strona:** `/parent/child/:id/timeline`

Chronologiczna osia czasu laczaca wydarzenia z roznych zrodel:
- Zmiany umiejetnosci (skill updates z sesji treningowych)
- Wyniki turniejowe
- Kamienie milowe (cele osiagniete)
- Zmiany w metrykach zdrowotnych (np. "HRV wzroslo o 10% w ostatnim miesiacu")
- Polaczenie/odlaczenie urzadzen

**Zadania:**
- [ ] Stworzyc strone `/parent/child/:id/timeline`
- [ ] Komponent `TimelineEvent` — rozne typy eventow z ikonami i kolorami
- [ ] Endpoint `GET /api/players/:id/timeline?from=&to=&limit=`
  - Agreguje dane z Session (skill updates), Tournament (wyniki), Player (goals completed), WearableData (trendy)
- [ ] Filtrowanie po typie eventu
- [ ] Infinite scroll lub pagination
- [ ] Link do timeline z profilu dziecka

### 2.3 Porownanie okresow

**Widok na stronie historii zdrowia** — sekcja "Porownaj okresy":

Rodzic wybiera 2 okresy (np. "Styczen vs Luty") i widzi porownanie side-by-side:
- Srednie HR, HRV, jakosc snu, recovery
- Liczba treningow i laczny strain
- Delta procentowa kazdej metryki

**Zadania:**
- [ ] Komponent `PeriodComparison` — 2 kolumny z metrykami i deltami
- [ ] Date range picker (2 zakresy)
- [ ] Endpoint `GET /api/wearables/data/:playerId/compare?period1_from=&period1_to=&period2_from=&period2_to=`
- [ ] Wizualizacja delty: zielona strzalka (poprawa), czerwona (pogorszenie)

### 2.4 Eksport raportu

Rodzic moze wygenerowac raport PDF z podsumowaniem okresu — do druku, do trenera, do lekarza sportowego.

**Zawartosc raportu:**
- Dane dziecka (imie, wiek, ranking)
- Podsumowanie metryk za wybrany okres
- Wykresy (renderowane server-side)
- Cele i postepy
- Rekomendacje

**Zadania:**
- [ ] Endpoint `GET /api/players/:id/report?from=&to=&format=pdf`
- [ ] Generowanie PDF server-side (puppeteer lub pdfkit)
- [ ] Szablon raportu z logo ServeIQ i profesjonalnym formatowaniem
- [ ] Przycisk "Eksportuj raport" na stronie historii zdrowia
- [ ] Mozliwosc wyslania raportu emailem

### Checkpointy Fazy 2

- [ ] **CP-2.1** Strona historii zdrowia wyswietla wykresy HR, HRV, snu, recovery, strain
- [ ] **CP-2.2** Przelaczanie zakresow (7/30/90/365 dni) dziala poprawnie
- [ ] **CP-2.3** Kazdy wykres pokazuje min/max/avg i trend vs poprzedni okres
- [ ] **CP-2.4** Timeline postepu pokazuje chronologiczne wydarzenia
- [ ] **CP-2.5** Porownanie 2 okresow dziala i pokazuje delty
- [ ] **CP-2.6** Eksport PDF generuje czytelny, profesjonalny raport
- [ ] **CP-2.7** Wykresy sa responsywne i dzialaja na mobile
- [ ] **CP-2.8** Wszystkie nowe endpointy maja walidacje i obsluge bledow

---

## Faza 3 — Inteligentne alerty i rekomendacje (Tydzien 4-5)

### Cel fazy
Aktywnie informowac rodzica o waznych zmianach — nie tylko czekac az otworzy aplikacje. Alerty i rekomendacje buduja nawyk i pokazuja wartosc subskrypcji.

### 3.1 System powiadomien (in-app)

**Model Notification:**
```javascript
{
  user: ObjectId<User>,
  type: enum['health_alert', 'recovery_low', 'recovery_high', 'milestone',
             'weekly_summary', 'device_disconnected', 'sync_error', 'system'],
  title: String,
  body: String,
  severity: enum['info', 'warning', 'critical'],
  read: Boolean,
  player: ObjectId<Player>,      // opcjonalne — dotyczy dziecka
  actionUrl: String,             // link do odpowiedniego ekranu
  metadata: Mixed,               // dodatkowe dane (np. wartosc metryki)
  createdAt: Date,
}
```

**Zadania:**
- [ ] Stworzyc model `Notification` w MongoDB
- [ ] Endpoint `GET /api/notifications` — lista powiadomien uzytkownika (pagination)
- [ ] Endpoint `PUT /api/notifications/:id/read` — oznacz jako przeczytane
- [ ] Endpoint `PUT /api/notifications/read-all` — oznacz wszystkie
- [ ] Komponent `NotificationBell` w Topbar — ikonka z licznikiem nieprzeczytanych
- [ ] Dropdown z lista powiadomien (klik otwiera panel)
- [ ] Stworzyc strone `/parent/notifications` z pelna lista
- [ ] Real-time powiadomienia przez Socket.io (istniejacy setup)

### 3.2 Alerty zdrowotne

**Reguly alertow (engine):**

| Trigger | Severity | Tytul | Przyklad |
|---------|----------|-------|----------|
| Recovery < 33% | critical | Niska regeneracja | "Kacper ma regeneracje 28%. Zalecany odpoczynek." |
| Recovery < 50% | warning | Umiarkowana regeneracja | "Kacper ma regeneracje 45%. Lzejszy trening." |
| Recovery > 85% | info | Swietna regeneracja | "Kacper w pelni zregenerowany (92%). Gotowy na intensywny trening!" |
| Sen < 6h | warning | Krotki sen | "Kacper spal tylko 5.5h. Monitoruj jakosc snu." |
| HRV spadek > 15% (7-day avg) | warning | Spadek HRV | "HRV Kacpra spadlo o 18% w ostatnim tygodniu." |
| HR spoczynkowe wzrost > 10% | warning | Wzrost tetna | "Tetno spoczynkowe Kacpra wzroslo — mozliwe przemeczenie." |
| Urzadzenie brak sync > 24h | warning | Brak synchronizacji | "WHOOP Kacpra nie synchronizowal sie od 26h." |
| Cel osiagniety | info | Cel osiagniety! | "Kacper osiagnal cel: Poprawa serwisu do 85%!" |

**Zadania:**
- [ ] Stworzyc serwis `server/src/services/alertEngine.js`
  - Funkcja `evaluateAlerts(playerId)` — sprawdza reguly i tworzy powiadomienia
  - Konfiguracja progow per uzytkownik (przechowywana w User.notificationSettings)
- [ ] Uruchamiac alert engine po kazdej synchronizacji danych
- [ ] Deduplikacja — nie wysylaj tego samego alertu 2x w ciagu 24h
- [ ] Logowanie alertow (audyt)

### 3.3 Powiadomienia push (Web Push)

**Zadania:**
- [ ] Zaimplementowac Web Push API (service worker + VAPID keys)
- [ ] Endpoint `POST /api/notifications/subscribe` — zapisanie push subscription
- [ ] Wysylanie push przy alertach critical i warning
- [ ] Przycisk "Wlacz powiadomienia" w ustawieniach i przy pierwszym alercie
- [ ] Obsluga permissji przegladarki (ask → granted/denied)
- [ ] Fallback — jesli push niedostepny, polegaj na in-app + email

### 3.4 Tygodniowe podsumowanie emailem

**Email wysylany co poniedzialek rano (7:00):**
```
Temat: Tydzien Kacpra — podsumowanie 21-27 marca

Czeeo Anna,

Oto podsumowanie tygodnia Kacpra:

Regeneracja:  Srednia 78% (↑ 5% vs zeszly tydzien)
Sen:          Srednia 8.1h, jakosc 84%
Tetno:        Spoczynkowe 62 bpm (stabilne)
Treningi:     4 sesje, laczny strain 52.3

Rekomendacja: Kacper miał swietny tydzien! Regeneracja w zielonej
strefie przez 6/7 dni. Mozna kontynuowac intensywny trening.

[Zobacz pelne statystyki →]
```

**Zadania:**
- [ ] Stworzyc szablon email `weeklyReport` w emailService
- [ ] Cron job: poniedzialki 7:00 — generuje i wysyla podsumowania
- [ ] Endpoint danych: `GET /api/wearables/data/:playerId/weekly-summary`
- [ ] Ustawienia: rodzic moze wylaczyc tygodniowy email
- [ ] Logika generowania rekomendacji na podstawie danych tygodnia

### 3.5 Ustawienia powiadomien

**Strona:** `/parent/settings` zakladka "Powiadomienia"

**Konfigurowalne progi:**
- Recovery alert threshold (domyslnie: < 33% critical, < 50% warning)
- Minimalny czas snu (domyslnie: 6h)
- HRV spadek threshold (domyslnie: 15%)
- Email tygodniowy: wlacz/wylacz
- Push notifications: wlacz/wylacz
- Cisza nocna: nie wysylaj push miedzy 22:00 a 7:00

**Zadania:**
- [ ] Dodac `notificationSettings` do modelu User
- [ ] UI do konfiguracji progow (suwaki i toggle)
- [ ] Endpoint `PUT /api/auth/notification-settings`
- [ ] Alert engine czyta ustawienia uzytkownika (nie hardcodowane progi)

### Checkpointy Fazy 3

- [ ] **CP-3.1** Powiadomienia in-app dzialaja — bell z licznikiem w topbar
- [ ] **CP-3.2** Alert engine generuje powiadomienia na podstawie danych zdrowotnych
- [ ] **CP-3.3** Alerty krytyczne (recovery < 33%) pojawiaja sie w ciagu 5 min od sync
- [ ] **CP-3.4** Web Push notifications dzialaja w Chrome i Firefox
- [ ] **CP-3.5** Tygodniowy email jest wysylany i zawiera poprawne dane
- [ ] **CP-3.6** Rodzic moze konfigurowac progi alertow w ustawieniach
- [ ] **CP-3.7** Deduplikacja dziala — brak spam alertow
- [ ] **CP-3.8** Socket.io powiadomienia real-time dzialaja

---

## Faza 4 — Subskrypcje i billing (Tydzien 5-6)

### Cel fazy
Wdrozyc model subskrypcji: 14 dni trial, potem platna subskrypcja. Stripe Subscriptions zamiast jednorazowych platnosci. Paywall na premium funkcje.

### 4.1 Model subskrypcji

**Plany:**

| Plan | Cena | Funkcje |
|------|------|---------|
| **Free** | 0 zl | Dashboard (dzisiejsze dane), 1 dziecko, brak historii |
| **Premium** | 39 zl/mies | Pelna historia, wykresy, alerty, email raporty, 3 dzieci, eksport PDF |
| **Family** | 59 zl/mies | Wszystko z Premium + 5 dzieci, priorytetowy support |

**Trial:** 14 dni Premium za darmo po rejestracji. Po wygasnieciu — degradacja do Free (dane zachowane, ale ukryte za paywall).

**Zmiany w modelu User:**
```javascript
{
  // ... istniejace pola
  subscription: {
    plan: enum['free', 'premium', 'family'],
    status: enum['trialing', 'active', 'past_due', 'cancelled', 'expired'],
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    trialEndsAt: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: Boolean,
  }
}
```

**Zadania:**
- [ ] Dodac `subscription` do modelu User
- [ ] Ustawic domyslny plan `premium` ze statusem `trialing` i `trialEndsAt = now + 14 dni`
- [ ] Middleware `checkSubscription` — sprawdza plan i blokuje premium funkcje dla free
- [ ] Stworzyc helper `hasFeatureAccess(user, feature)` do sprawdzania dostepu
- [ ] Cron job: codziennie sprawdzaj wygasle triale → zmiana na `free`

### 4.2 Stripe Subscriptions

**Zadania:**
- [ ] Stworzyc produkty i ceny w Stripe Dashboard (lub via API):
  - `serveiq_premium` — 39 zl/mies
  - `serveiq_family` — 59 zl/mies
- [ ] Endpoint `POST /api/subscriptions/checkout` — tworzy Stripe Checkout Session (subscription mode)
- [ ] Endpoint `POST /api/subscriptions/portal` — otwiera Stripe Customer Portal (zarzadzanie subskrypcja)
- [ ] Webhook `POST /api/subscriptions/webhook` — obsluga eventow:
  - `checkout.session.completed` → aktywuj subskrypcje
  - `invoice.paid` → przedluz okres
  - `invoice.payment_failed` → status `past_due`, wyslij email
  - `customer.subscription.deleted` → status `cancelled`
  - `customer.subscription.updated` → zmiana planu
- [ ] Stworzyc serwis `server/src/services/subscriptionService.js`
- [ ] Obsluga webhook signature verification (STRIPE_WEBHOOK_SECRET)

### 4.3 Paywall i ograniczenia

**Co jest za paywallem (Free vs Premium):**

| Funkcja | Free | Premium | Family |
|---------|------|---------|--------|
| Dashboard (dzisiejsze dane) | Tak | Tak | Tak |
| 1 dziecko | Tak | Tak | Tak |
| Wiecej dzieci | Nie | Do 3 | Do 5 |
| Historia zdrowia (wykresy) | 7 dni | Pelna | Pelna |
| Porownanie okresow | Nie | Tak | Tak |
| Alerty zdrowotne | Podstawowe | Pelne | Pelne |
| Tygodniowy email | Nie | Tak | Tak |
| Eksport PDF | Nie | Tak | Tak |
| Push notifications | Nie | Tak | Tak |
| Priorytetowy support | Nie | Nie | Tak |

**Zadania:**
- [ ] Komponent `PaywallGate` — opakowuje premium content, wyswietla upgrade prompt
- [ ] Komponent `UpgradeModal` — porownanie planow z przyciskiem "Rozpocznij subskrypcje"
- [ ] Ograniczyc dodawanie dzieci (max 1 dla free, 3 dla premium, 5 dla family)
- [ ] Ograniczyc zakres wykresow (7 dni dla free, pelny dla premium)
- [ ] Zablokowac eksport PDF dla free
- [ ] Pokazywac banner "Twoj trial konczy sie za X dni" na dashboardzie
- [ ] Pokazywac banner "Przejdz na Premium" po wygasnieciu triala

### 4.4 Strona cennikowa (in-app)

**Strona:** `/parent/pricing`

**Zadania:**
- [ ] Stworzyc strone porownania planow (tabela, 3 kolumny)
- [ ] Przycisk "Wybierz plan" → Stripe Checkout
- [ ] Wyroznic aktualny plan uzytkownika
- [ ] FAQ sekcja na dole (najczesciejsze pytania o billing)
- [ ] Link do cennika w sidebar i w paywall modalach

### 4.5 Zarzadzanie subskrypcja

**W ustawieniach:** `/parent/settings` nowa zakladka "Subskrypcja"

**Zadania:**
- [ ] Wyswietlic aktualny plan, status, nastepna platnosc
- [ ] Przycisk "Zmien plan" → Stripe Customer Portal
- [ ] Przycisk "Anuluj subskrypcje" → potwierdzenie + Stripe cancel
- [ ] Wyswietlic historie platnosci (z Stripe)
- [ ] Obsluga `past_due` — komunikat "Platnosc nie powiodla sie" z linkiem do aktualizacji karty

### Checkpointy Fazy 4

- [ ] **CP-4.1** Nowy uzytkownik zaczyna z 14-dniowym trialem Premium
- [ ] **CP-4.2** Po wygasnieciu triala uzytkownik jest zdegradowany do Free
- [ ] **CP-4.3** Paywall blokuje premium funkcje dla uzytkownikow Free
- [ ] **CP-4.4** Stripe Checkout dziala — uzytkownik moze wykupic subskrypcje
- [ ] **CP-4.5** Webhook poprawnie obsluguje: aktywacje, platnosc, failure, cancel
- [ ] **CP-4.6** Stripe Customer Portal dziala (zmiana planu, anulowanie, karta)
- [ ] **CP-4.7** Strona cennikowa wyswietla plany i pozwala wybrac
- [ ] **CP-4.8** Banner trialu wyswietla sie z poprawnym licznikiem dni
- [ ] **CP-4.9** Ograniczenie liczby dzieci dziala per plan

---

## Faza 5 — Landing page i beta launch (Tydzien 7-8)

### Cel fazy
Publiczna strona marketingowa, beta signup, analytics. Przygotowanie do pierwszych platiacych uzytkownikow.

### 5.1 Landing page

**Osobna strona (nie wymaga logowania):** Moze byc w tym samym projekcie jako route `/` lub osobny subdomena.

**Sekcje landing page:**
1. **Hero** — headline, subheadline, CTA "Rozpocznij za darmo", screenshot dashboardu
2. **Problem** — "Nie wiesz co dzieje sie z Twoim dzieckiem na treningu?"
3. **Rozwiazanie** — 3 ikony: Monitoring zdrowia, Pelny obraz rozwoju, Inteligentne alerty
4. **Jak to dziala** — 3 kroki: Zarejestruj sie → Polacz urzadzenie → Monitoruj
5. **Features showcase** — screenshoty/mockupy dashboardu, wykresow, alertow
6. **Integracje** — loga WHOOP i Garmin + "Wiecej wkrotce"
7. **Cennik** — 3 plany z CTA
8. **Testimoniale** — (na poczatek placeholder lub cytaty z beta testerow)
9. **FAQ** — 8-10 najczesciejszych pytan
10. **Footer** — kontakt, social media, regulamin, polityka prywatnosci

**Zadania:**
- [ ] Stworzyc strone `/landing` (lub osobny route `/` dla niezalogowanych)
- [ ] Sekcja Hero z animowanym screenshotem
- [ ] Sekcja Problem → Rozwiazanie
- [ ] Sekcja "Jak to dziala" (3 kroki)
- [ ] Sekcja Features z mockupami
- [ ] Sekcja Cennik (reuse komponentu z in-app)
- [ ] Sekcja FAQ (accordion)
- [ ] Footer z linkami
- [ ] Responsywnosc — mobile first
- [ ] SEO: meta tags, Open Graph, structured data
- [ ] Animacje scroll (intersection observer, proste fade-in)

### 5.2 Beta signup i waitlist

**Zadania:**
- [ ] Formularz "Dolacz do beta" na landing page (email + imie)
- [ ] Model `BetaSignup` w MongoDB: email, name, source, createdAt
- [ ] Endpoint `POST /api/beta/signup`
- [ ] Email potwierdzajacy zapis na liste
- [ ] Admin view: lista zapisanych (prosta strona lub export CSV)
- [ ] Mozliwosc wyslania zaproszen do beta testerow (email z linkiem do rejestracji)

### 5.3 Analytics

**Zadania:**
- [ ] Integracja PostHog (self-hosted lub cloud) lub Mixpanel
- [ ] Eventy do sledzenia:
  - `user.registered` — rejestracja
  - `user.onboarding_completed` — zakonczenie onboardingu
  - `device.connected` — polaczenie urzadzenia
  - `dashboard.viewed` — wyswietlenie dashboardu
  - `health_history.viewed` — wyswietlenie historii zdrowia
  - `alert.received` — odebranie alertu
  - `subscription.started` — rozpoczecie subskrypcji
  - `subscription.cancelled` — anulowanie
  - `report.exported` — eksport raportu
- [ ] Funnel: Rejestracja → Onboarding → Device Connected → Dashboard View → Subscription
- [ ] Retention tracking: daily/weekly active users
- [ ] Dodac `<PostHogProvider>` do App.jsx (lub odpowiednik)

### 5.4 Prawne i compliance

**Zadania:**
- [ ] Stworzyc strone "Regulamin" `/terms`
- [ ] Stworzyc strone "Polityka prywatnosci" `/privacy`
- [ ] RODO/GDPR:
  - Checkbox zgody przy rejestracji
  - Mozliwosc pobrania swoich danych (`GET /api/auth/export-data`)
  - Mozliwosc usuniecia konta i danych (`DELETE /api/auth/account`)
  - Informacja o przetwarzaniu danych zdrowotnych dzieci (wymaga szczegolnej ochrony!)
- [ ] Cookie banner (jesli uzywasz analytics cookies)
- [ ] Dane zdrowotne dzieci — upewnic sie ze zgodne z lokalnymi regulacjami

### 5.5 Onboarding flow (refinement)

**Zadania:**
- [ ] A/B test roznych wersji onboardingu (przez feature flagi)
- [ ] Dodac tooltips / coach marks na dashboardzie dla nowych uzytkownikow
- [ ] "Empty states" — ladne komunikaty gdy brak danych (zamiast pustych ekranow)
- [ ] Email onboardingowy: seria 3 emaili (dzien 1, 3, 7) z poradami

### 5.6 Performance i infrastruktura

**Zadania:**
- [ ] Audit performance (Lighthouse score > 90)
- [ ] Lazy loading routes (React.lazy + Suspense)
- [ ] Optymalizacja obrazkow (WebP, responsive images)
- [ ] CDN dla statycznych assets
- [ ] MongoDB indexy — audit i optymalizacja zapytan
- [ ] Rate limiting dostosowany do produkcji
- [ ] Error monitoring (Sentry lub podobne)
- [ ] Health checks i uptime monitoring

### Checkpointy Fazy 5

- [ ] **CP-5.1** Landing page jest publicznie dostepna i wyglada profesjonalnie
- [ ] **CP-5.2** Landing page jest responsywna (mobile, tablet, desktop)
- [ ] **CP-5.3** SEO: meta tags, Open Graph, poprawny tytul i opis
- [ ] **CP-5.4** Formularz beta signup dziala i wysyla email potwierdzajacy
- [ ] **CP-5.5** Analytics trackuja kluczowe eventy (rejestracja, onboarding, dashboard)
- [ ] **CP-5.6** Regulamin i polityka prywatnosci sa dostepne
- [ ] **CP-5.7** RODO: eksport danych i usuwanie konta dzialaja
- [ ] **CP-5.8** Lighthouse performance score > 90
- [ ] **CP-5.9** Error monitoring jest aktywny
- [ ] **CP-5.10** Aplikacja jest deployed i dostepna pod domena produkcyjna

---

## Architektura techniczna

### Schemat systemu (docelowy)

```
                    ┌──────────────────┐
                    │   Landing Page   │
                    │   (public)       │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │   React SPA      │
                    │   (Vite + React) │
                    └────────┬─────────┘
                             │ HTTPS
                    ┌────────▼─────────┐
                    │   Express API    │
                    │   + Socket.io    │
                    └──┬───┬───┬───┬───┘
                       │   │   │   │
          ┌────────────┘   │   │   └────────────┐
          │                │   │                │
  ┌───────▼────┐  ┌───────▼───▼───┐  ┌────────▼────────┐
  │  MongoDB   │  │  Stripe API   │  │  Wearable APIs  │
  │  Atlas     │  │  (billing)    │  │  Garmin / WHOOP  │
  └────────────┘  └───────────────┘  └─────────────────┘
                                              │
                                     ┌────────▼────────┐
                                     │  Cron Jobs      │
                                     │  - Sync (15min) │
                                     │  - Alerts       │
                                     │  - Weekly email  │
                                     │  - Trial check   │
                                     └─────────────────┘
```

### Kluczowe wzorce

**Provider Pattern (wearables):**
```
WearableProvider (interface)
  ├── GarminProvider
  ├── WhoopProvider
  └── MockProvider (demo + fallback)
```

**Feature Access Control:**
```
Middleware: checkSubscription
  → hasFeatureAccess(user, 'health_history')
  → hasFeatureAccess(user, 'pdf_export')
  → hasFeatureAccess(user, 'push_notifications')
```

**Alert Engine:**
```
Sync Data → Evaluate Rules → Create Notification → Deliver (in-app + push + email)
```

### Baza danych — nowe kolekcje

| Kolekcja | Faza | Opis |
|----------|------|------|
| User (rozszerzony) | 0, 4 | + onboarding, subscription, notificationSettings |
| Player (rozszerzony) | 0 | coach opcjonalny, avatarUrl upload |
| WearableDevice | juz istnieje | + authState |
| WearableData | juz istnieje | bez zmian |
| Notification | 3 | powiadomienia uzytkownika |
| BetaSignup | 5 | zapisy na beta |

---

## Metryki sukcesu

### North Star Metric
**Weekly Active Parents (WAP)** — rodzice ktorzy otworzy dashboard min. 1x w tygodniu.

### Kluczowe metryki per faza

| Metryka | Faza | Cel |
|---------|------|-----|
| Rejestracja → Onboarding complete | 0 | > 80% |
| Onboarding → Device connected | 0-1 | > 50% |
| Device connected → Daily dashboard view | 1-2 | > 60% |
| 7-day retention | 2 | > 40% |
| 30-day retention | 3 | > 25% |
| Trial → Paid conversion | 4 | > 5% |
| Landing page → Registration | 5 | > 3% |
| NPS score | 5 | > 40 |

---

## Ryzyka i mitygacja

| # | Ryzyko | Wplyw | Mitygacja |
|---|--------|-------|-----------|
| R1 | Garmin/WHOOP odrzuci aplikacje developerska | Krytyczny | Wczesna rejestracja, mock jako fallback, Apple Health jako alternatywa |
| R2 | Rodzice nie maja wearable devices | Wysoki | App dziala bez urzadzen (umiejetnosci, cele, plan), cennik uwzglednia |
| R3 | RODO — dane zdrowotne dzieci | Krytyczny | Konsultacja prawna przed launch, szyfrowanie, zgody |
| R4 | Niska konwersja trial→paid | Wysoki | A/B testy paywall, value showcase w trialu, email nurturing |
| R5 | Performance przy duzej ilosci danych wearable | Sredni | Agregacja danych starszych niz 90 dni, indeksy, caching |
| R6 | Konkurencja (inne apki dla rodzicow sportowcow) | Sredni | Focus na tenis, integracje + inteligentne rekomendacje jako moat |

---

*Ostatnia aktualizacja: 2026-03-28*
*Nastepny review: po zakonczeniu Fazy 0*
