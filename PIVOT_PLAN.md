# ServeIQ - PIVOT PLAN: Parent-First Tennis Monitoring Platform

**Data utworzenia:** 2026-03-28
**Status:** W trakcie implementacji
**Wersja:** 1.0

---

## 1. Podsumowanie Pivotu

### Dotychczasowy model
ServeIQ bylo platformo loczoco trenerow tenisa z rodzicami. Trener byl glownym uzytkownikiem - zarzodzal zawodnikami, sesjami treningowymi, platnosiami i komunikacja. Rodzic mial role drugorzedna - podglod postepo dziecka i oplacanie faktur.

### Nowy model
ServeIQ staje sie **platforma monitoringu dla rodzicow mlodych tenisistow**. Rodzic jest teraz **glownym uzytkownikiem**. Aplikacja integruje sie z urzadzeniami wearable (WHOOP, Garmin) aby dostarczac rodzicom dane o zdrowiu, regeneracji i aktywnosci fizycznej ich dzieci w kontekscie treningu tenisowego.

### Kluczowe zmiany
1. **Focus na rodzicach** - rodzic jest primary user, nie trener
2. **Integracja z wearables** - WHOOP i Garmin jako zrodla danych zdrowotnych
3. **Dashboard zdrowia dziecka** - HR, HRV, sen, obciazenie, regeneracja
4. **Plan treningowy** - widocznosc planu na przyszlosc
5. **Profil dziecka** - zdjecie, dane z urzadzen, statystyki
6. **Wylaczenie modulu trenera** - tymczasowe, focus na rodzicach

---

## 2. Architektura Nowej Aplikacji

### 2.1 Schemat ogolny

```
[Rodzic (Primary User)]
    |
    +-- Dashboard
    |   +-- Karta dziecka (zdjecie, imie, wiek)
    |   +-- Dane z Whoop/Garmin (live metrics)
    |   +-- Podsumowanie regeneracji
    |   +-- Nadchodzace treningi/plan
    |
    +-- Profil Dziecka
    |   +-- Zdjecie i dane osobowe
    |   +-- Historia metryk zdrowotnych
    |   +-- Wykresy (HR, HRV, sen w czasie)
    |   +-- Ranking tenisowy
    |
    +-- Urzadzenia
    |   +-- Podlaczenie Whoop
    |   +-- Podlaczenie Garmin
    |   +-- Status synchronizacji
    |   +-- Ostatnie dane
    |
    +-- Plan Treningowy
    |   +-- Kalendarz treningow
    |   +-- Cele krotko- i dlugoterminowe
    |   +-- Osia czasu postepu
    |   +-- Rekomendacje treningowe
    |
    +-- Platnosci (existing)
    |   +-- Oczekujace platnosci
    |   +-- Historia
    |
    +-- Wiadomosci (existing)
        +-- Chat z trenerem
```

### 2.2 Stack Technologiczny

**Bez zmian (zachowujemy):**
- React 18 + Vite (frontend)
- Express + MongoDB (backend)
- JWT auth (accessToken + refreshToken)
- Socket.io (real-time)
- Stripe (platnosci)
- Zustand (state management)

**Nowe elementy:**
- Mock API dla Whoop/Garmin (backend)
- Nowy model `WearableDevice` (MongoDB)
- Nowy model `WearableData` (MongoDB) - dane z urzadzen
- Nowe API endpoints `/api/wearables`
- Nowe komponenty wykresow (CSS-based, bez zewnetrznych libek)

### 2.3 Struktura folderow po zmianach

```
client/src/
  pages/
    auth/           # Bez zmian
    parent/
      Dashboard.jsx        # NOWY - glowny dashboard z wearable data
      ChildProfile.jsx     # NOWY - profil dziecka ze zdjeciem
      Devices.jsx          # NOWY - polaczenie Whoop/Garmin
      TrainingPlan.jsx     # NOWY - plan i cele treningowe
      Payments.jsx         # Istniejacy (minimalne zmiany)
      Chat.jsx             # Istniejacy (bez zmian)
    coach/              # WYLACZONY - pliki zostaja, routes disabled

  components/
    shared/
      WearableCard/        # NOWY - karta z danymi wearable
      DeviceStatus/        # NOWY - status urzadzenia
      MetricChart/         # NOWY - mini wykres metryki
      HealthRing/          # NOWY - kolowe wskazniki zdrowia
      TrainingCalendar/    # NOWY - kalendarz treningow

server/src/
  models/
    WearableDevice.js      # NOWY - polaczone urzadzenia
    WearableData.js        # NOWY - dane z urzadzen
  controllers/
    wearableController.js  # NOWY - obsluga wearable API
  routes/
    wearables.js           # NOWY - /api/wearables
  services/
    whoopMockService.js    # NOWY - mock danych Whoop
    garminMockService.js   # NOWY - mock danych Garmin
```

---

## 3. Modele Danych

### 3.1 WearableDevice (nowy model)

```javascript
{
  player: ObjectId<Player>,       // Dziecko ktore nosi urzadzenie
  parent: ObjectId<User>,         // Rodzic ktory polaczyl urzadzenie
  provider: enum['whoop', 'garmin'],
  deviceName: String,             // np. "WHOOP 4.0", "Garmin Venu 3"
  deviceId: String,               // Identyfikator urzadzenia (mock)
  connected: Boolean,
  lastSyncAt: Date,
  accessToken: String,            // Mock OAuth token
  refreshToken: String,           // Mock OAuth refresh
  settings: {
    syncInterval: Number,         // minuty
    notifications: Boolean,
  }
}
```

### 3.2 WearableData (nowy model)

```javascript
{
  player: ObjectId<Player>,
  device: ObjectId<WearableDevice>,
  provider: enum['whoop', 'garmin'],
  date: Date,                     // Dzien danych
  type: enum['daily_summary', 'workout', 'sleep', 'recovery'],

  // Metryki zdrowotne
  metrics: {
    // Tetno
    heartRate: {
      resting: Number,            // Spoczynkowe HR (bpm)
      max: Number,                // Max HR w ciagu dnia
      avg: Number,                // Srednie HR
    },

    // Zmiennosc tetna
    hrv: {
      value: Number,              // HRV w ms (RMSSD)
      trend: enum['up', 'down', 'stable'],
    },

    // Sen
    sleep: {
      totalMinutes: Number,
      deepMinutes: Number,
      remMinutes: Number,
      lightMinutes: Number,
      awakeMinutes: Number,
      quality: Number,            // 0-100
      bedtime: String,            // "22:30"
      wakeTime: String,           // "06:45"
    },

    // Obciazenie / Strain (Whoop)
    strain: {
      value: Number,              // 0-21 (Whoop scale)
      calories: Number,
      activityMinutes: Number,
    },

    // Regeneracja / Recovery
    recovery: {
      score: Number,              // 0-100
      status: enum['green', 'yellow', 'red'],
      recommendation: String,     // "Gotowy na intensywny trening"
    },

    // Aktywnosc (Garmin)
    activity: {
      steps: Number,
      distance: Number,           // km
      activeMinutes: Number,
      calories: Number,
      trainingLoad: Number,       // Garmin Training Load
      vo2max: Number,
    },

    // Stres (Garmin)
    stress: {
      avg: Number,                // 0-100
      max: Number,
      restMinutes: Number,
    },

    // Body Battery (Garmin)
    bodyBattery: {
      current: Number,            // 0-100
      high: Number,
      low: Number,
    },
  }
}
```

### 3.3 Zmiany w istniejacych modelach

**Player - dodane pola:**
```javascript
{
  // ... istniejace pola
  avatarUrl: String,              // Juz istnieje - bedzieme uzywac do zdjecia
  wearableDevices: [ObjectId<WearableDevice>],

  // Plan treningowy
  trainingPlan: {
    weeklyGoal: {
      sessionsPerWeek: Number,    // Cel treningow tygodniowo
      hoursPerWeek: Number,       // Cel godzin tygodniowo
    },
    focus: [String],              // Obszary fokusa np. ["serve", "fitness"]
    notes: String,                // Notatki trenera
    nextMilestone: {
      text: String,
      date: Date,
    },
  },
}
```

---

## 4. API Endpoints (nowe)

### 4.1 Wearable Endpoints

```
GET    /api/wearables/devices              # Lista polaczonych urzadzen
POST   /api/wearables/connect              # Polacz nowe urzadzenie (mock OAuth)
DELETE /api/wearables/devices/:id          # Odlacz urzadzenie
POST   /api/wearables/devices/:id/sync    # Wymuss synchronizacje

GET    /api/wearables/data/:playerId       # Dane z urzadzen dla dziecka
       ?type=daily_summary|workout|sleep|recovery
       &from=2026-03-01
       &to=2026-03-28

GET    /api/wearables/data/:playerId/latest  # Najnowsze dane (dashboard)
GET    /api/wearables/data/:playerId/trends  # Trendy (7/30 dni)
```

### 4.2 Player Endpoints (rozszerzone)

```
PUT    /api/players/:id/avatar             # Upload zdjecia dziecka
PUT    /api/players/:id/training-plan      # Aktualizacja planu treningowego
```

---

## 5. Widoki UI - Szczegolowy Opis

### 5.1 Parent Dashboard (glowny widok)

**Layout:**
```
+--------------------------------------------------+
|  [Dziecko Selector - jesli wiele dzieci]         |
+--------------------------------------------------+
|                                                    |
|  +------------------+  +------------------------+ |
|  |   ZDJECIE        |  |  RECOVERY RING    87%  | |
|  |   Imie Nazwisko  |  |  Status: Gotowy        | |
|  |   Wiek: 14 lat   |  |  [zielony/zolty/czer]  | |
|  |   Ranking: #45    |  |                        | |
|  +------------------+  +------------------------+ |
|                                                    |
|  +------+ +------+ +------+ +------+              |
|  | HR   | | HRV  | | Sen  | |Strain|              |
|  | 62   | | 78ms | | 8.2h | | 14.2 |              |
|  | bpm  | | +3%  | | 92%  | | /21  |              |
|  +------+ +------+ +------+ +------+              |
|                                                    |
|  +-- Urzadzenia --------------------------------+ |
|  |  [WHOOP] Polaczony  | Ostatnia sync: 5min    | |
|  |  [Garmin] Polaczony  | Ostatnia sync: 12min   | |
|  +----------------------------------------------+ |
|                                                    |
|  +-- Plan na przyszlosc -------------------------+ |
|  |  Nastepny trening: Poniedzialek 10:00         | |
|  |  Cel tygodniowy: 4/6 treningow               | |
|  |  Nastepny kamien milowy: Turniej Warszawa     | |
|  |  Data: 15.04.2026                             | |
|  +----------------------------------------------+ |
|                                                    |
+--------------------------------------------------+
```

**Karty metryk:**
- Kazdaa metryka ma ikone, wartosc, jednostke i trend (strzalka gora/dol)
- Kolory: zielony (dobry), zolty (sredni), czerwony (uwaga)
- Klikniecie otwiera szczegoly

### 5.2 Profil Dziecka

```
+--------------------------------------------------+
|  [Duze zdjecie / Avatar]                          |
|  Imie Nazwisko                                    |
|  Wiek: 14 lat | Plec: M | Ranking PZT: #45       |
+--------------------------------------------------+
|                                                    |
|  === Metryki zdrowotne (ostatnie 7 dni) ===       |
|  [Wykres HR]     min/avg/max tetno               |
|  [Wykres HRV]    trend zmiennosci tetna          |
|  [Wykres Snu]    jakosc snu w czasie             |
|  [Wykres Recovery] regeneracja w czasie           |
|                                                    |
|  === Umiejetnosci tenisowe ===                    |
|  Serwis:   ████████░░ 80%                        |
|  Forhend:  ███████░░░ 72%                        |
|  Bekhend:  ██████░░░░ 65%                        |
|  ...                                              |
|                                                    |
|  === Cele ===                                     |
|  [x] Poprawic serwis do 85%                      |
|  [ ] Turniej Warszawa - top 16                    |
|  [ ] Ranking PZT top 40                           |
+--------------------------------------------------+
```

### 5.3 Strona Urzadzen

```
+--------------------------------------------------+
|  Polaczone urzadzenia                             |
+--------------------------------------------------+
|                                                    |
|  +-- WHOOP 4.0 ---------------------------------+ |
|  |  [Logo WHOOP]                                 | |
|  |  Status: Polaczony                            | |
|  |  Ostatnia synchronizacja: 5 min temu          | |
|  |  Bateria: 67%                                 | |
|  |  [Synchronizuj]  [Odlacz]                     | |
|  +----------------------------------------------+ |
|                                                    |
|  +-- Garmin Venu 3 -----------------------------+ |
|  |  [Logo Garmin]                                | |
|  |  Status: Polaczony                            | |
|  |  Ostatnia synchronizacja: 12 min temu         | |
|  |  Bateria: 82%                                 | |
|  |  [Synchronizuj]  [Odlacz]                     | |
|  +----------------------------------------------+ |
|                                                    |
|  +-- Dodaj urzadzenie ---------------------------+ |
|  |  [+ WHOOP]    [+ Garmin]                      | |
|  +----------------------------------------------+ |
+--------------------------------------------------+
```

### 5.4 Plan Treningowy

```
+--------------------------------------------------+
|  Plan treningowy - [Imie dziecka]                 |
+--------------------------------------------------+
|                                                    |
|  +-- Cele tygodniowe ---------------------------+ |
|  |  Treningi: 4/6 ten tydzien                    | |
|  |  Godziny: 6.5/8h ten tydzien                  | |
|  |  [pasek postepu]                              | |
|  +----------------------------------------------+ |
|                                                    |
|  +-- Kalendarz ---------------------------------+ |
|  |  Pon  Wt   Sr   Czw  Pt   Sb   Nd            | |
|  |  [T]  [.]  [T]  [.]  [T]  [T]  [R]           | |
|  |  T=trening, R=regeneracja, .=wolne            | |
|  +----------------------------------------------+ |
|                                                    |
|  +-- Kamienie milowe ----------------------------+ |
|  |  >> Turniej Warszawa (15.04.2026)             | |
|  |     Cel: Top 16                               | |
|  |  >> Oboz letni (01.07.2026)                   | |
|  |     3 tygodnie intensywnego treningu          | |
|  |  >> Ranking PZT Top 30 (do konca 2026)        | |
|  +----------------------------------------------+ |
|                                                    |
|  +-- Obszary fokusa -----------------------------+ |
|  |  [Serwis] [Kondycja] [Taktyka]                | |
|  |  Notatki trenera:                             | |
|  |  "Skupic sie na drugim serwisie..."           | |
|  +----------------------------------------------+ |
+--------------------------------------------------+
```

---

## 6. Mock Data - Whoop & Garmin

### 6.1 Strategia mockowania

Zamiast prawdziwej integracji OAuth z Whoop/Garmin API (co wymaga partnerstwa i certyfikacji), tworzymy **realistyczne dane mockowe** ktore:

1. Generuja sie automatycznie na podstawie daty
2. Symuluja realistyczne wzorce (lepszy sen = lepsza regeneracja)
3. Maja wariacjie dziennie - nie sa statyczne
4. Reasponuja na "synchronizacje" generujac nowe dane

### 6.2 Algorytm generowania danych

```
Dla kazdego dnia:
  1. Bazowe HR spoczynkowe: 55-65 bpm (zalezne od wieku)
  2. HRV: 60-90 ms (korelacja z jakosc snu)
  3. Sen: 6.5-9h (losowy z tendencja)
  4. Recovery: obliczany z HR + HRV + sen
  5. Strain: 8-18 (dni treningowe wyzszy)
  6. Body Battery: 30-95 (odwrotnie do strain)
```

### 6.3 Flow polaczenia urzadzenia (mock)

```
1. Rodzic klika "Polacz WHOOP" lub "Polacz Garmin"
2. Otwiera sie modal z mock OAuth (symulacja)
3. Rodzic "autoryzuje" dostep
4. System tworzy WearableDevice z mock tokenem
5. Automatycznie generuje dane historyczne (30 dni)
6. Dashboard zaczyna pokazywac metryki
```

---

## 7. Nawigacja i Routing

### 7.1 Nowa struktura routow

```javascript
// Parent routes (ACTIVE - primary)
/parent/dashboard          -> Dashboard (glowny widok)
/parent/child/:id          -> Profil dziecka
/parent/devices            -> Zarzadzanie urzadzeniami
/parent/training-plan      -> Plan treningowy
/parent/payments           -> Platnosci (istniejacy)
/parent/messages           -> Wiadomosci (istniejacy)
/parent/messages/:userId   -> Konwersacja

// Coach routes (DISABLED - temporarily)
/coach/*                   -> Redirect to maintenance page

// Auth routes (ACTIVE - bez zmian)
/login
/register
/forgot-password
/reset-password/:token
/accept-invite/:token
```

### 7.2 Nowa nawigacja sidebar

```javascript
const parentNav = [
  { to: '/parent/dashboard',      label: 'Pulpit',          icon: LayoutDashboard },
  { to: '/parent/child',          label: 'Profil dziecka',  icon: User },
  { to: '/parent/devices',        label: 'Urzadzenia',      icon: Watch },
  { to: '/parent/training-plan',  label: 'Plan treningowy', icon: Calendar },
  { to: '/parent/payments',       label: 'Platnosci',       icon: CreditCard },
  { to: '/parent/messages',       label: 'Wiadomosci',      icon: MessageSquare },
]
```

---

## 8. Plan Implementacji (kolejnosc)

### Faza 1: Fundament (Task 1-4)
1. [x] Utworzenie tego pliku
2. [ ] Wylaczenie routow trenera
3. [ ] Nowe modele danych (WearableDevice, WearableData)
4. [ ] Mock service dla Whoop/Garmin
5. [ ] API endpoints /api/wearables

### Faza 2: Frontend Core (Task 5-8)
6. [ ] Nowy Parent Dashboard z danymi wearable
7. [ ] Strona zarzadzania urzadzeniami
8. [ ] Profil dziecka ze zdjeciem i wykresami
9. [ ] Aktualizacja sidebar

### Faza 3: Rozszerzenia (Task 9)
10. [ ] Strona planu treningowego
11. [ ] Kalendarz treningow
12. [ ] Kamienie milowe

### Faza 4: Polish
13. [ ] Responsywnosc mobilna
14. [ ] Animacje i transitions
15. [ ] Testy i bug fixes

---

## 9. Design System - Rozszerzenia

### 9.1 Nowe kolory (do tokens.css)

```css
/* Wearable brand colors */
--color-whoop: #FF3B30;
--color-whoop-bg: rgba(255,59,48,0.12);
--color-garmin: #007CC3;
--color-garmin-bg: rgba(0,124,195,0.12);

/* Health metric colors */
--color-recovery-green: #22C55E;
--color-recovery-yellow: #F59E0B;
--color-recovery-red: #EF4444;
--color-heart: #FF4757;
--color-sleep: #7C5CFC;
--color-strain: #FF6B35;
```

### 9.2 Nowe komponenty UI

- **HealthRing** - kolowy wskaznik (recovery, sleep quality)
- **MetricCard** - karta z ikona, wartoscia, trendem
- **MiniChart** - mini wykres liniowy (sparkline) CSS-only
- **DeviceCard** - karta urzadzenia z logo i statusem
- **CalendarGrid** - siatka kalendarza treningow
- **MilestoneTimeline** - osia czasu z kamieniami milowymi

---

## 10. Przyszle integracje (poza scope mockupu)

### 10.1 Prawdziwa integracja WHOOP
- WHOOP Developer API (https://developer.whoop.com)
- OAuth 2.0 z PKCE
- Webhooks dla real-time data
- Wymagane: Partnerstwo z WHOOP

### 10.2 Prawdziwa integracja Garmin
- Garmin Health API / Connect IQ
- OAuth 1.0a
- Push notifications z urzadzenia
- Wymagane: Garmin Developer Account

### 10.3 Dodatkowe integracje (przyszlosc)
- Apple Health / HealthKit
- Google Fit
- Polar
- Suunto
- Catapult (profesjonalne GPS tracking)

---

## 11. Metryki sukcesu

Po wdrozeniu pivotu, kluczowe metryki:
1. **Engagement rodzicow** - dzienny login rate
2. **Device connection rate** - % rodzicow z polaczonym urzadzeniem
3. **Dashboard views** - ile razy dziennie sprawdzany dashboard
4. **Retention** - 7/30 day retention rate
5. **NPS** - Net Promoter Score od rodzicow

---

## 12. Ryzyka i mitygacja

| Ryzyko | Prawdopodobienstwo | Wplyw | Mitygacja |
|--------|-------------------|-------|-----------|
| WHOOP/Garmin API changes | Srednie | Wysoki | Abstrakcja warstwy danych |
| Prywatnosc danych zdrowotnych dzieci | Wysokie | Krytyczny | RODO/GDPR compliance, szyfrowanie |
| Rodzice nie maja WHOOP/Garmin | Wysokie | Sredni | App dziala bez urzadzen, dane manualne |
| Performance przy duzej ilosci danych | Niskie | Sredni | Agregacja, pagination, caching |
| Trenerzy odchodza z platformy | Srednie | Sredni | Przywrocenie modulu trenera w fazie 2 |

---

*Ten dokument jest zywym dokumentem i bedzie aktualizowany w miarze postepu prac.*
