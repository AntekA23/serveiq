# ServeIQ — Plan Urealnienia Funkcjonalnosci

**Data:** 2026-03-29
**Cel:** Przejscie z demo/mock do dzialajacego produktu gotowego na beta testerow

---

## Status obecny — co jest prawdziwe, a co nie

### DZIALA NAPRAWDE (z backendem + MongoDB)
- Rejestracja i logowanie (JWT, bcrypt, refresh tokeny)
- Tworzenie konta rodzica i dodawanie dziecka (onboarding)
- Zapis umiejetnosci, celow, planu treningowego do bazy
- Chat real-time (Socket.io + MongoDB)
- System powiadomien (zapis do bazy, socket push)
- Alert engine (sprawdza dane zdrowotne, tworzy powiadomienia)
- Background joby (sync co 15min, alerty co 30min, trial check co 24h)
- Upload avatara dziecka (multer, zapis na dysk)
- Landing page (statyczna, nie wymaga backendu)

### MOCK / FAKE — wyglada jakby dzialalo, ale nie dziala
- **Dane z wearables** — generowane przez seeded RNG, nie z prawdziwego urzadzenia (decyzja: zostawiamy mock na beta)
- **Tryb demo** — caly frontend dziala bez backendu, ale dane sa fake
- **Stripe subskrypcje** — kod jest, ale uzywa placeholder price ID (`price_premium_placeholder`)
- **Emiale** — w dev mode loguja do konsoli zamiast wysylac
- **Polaczenie z urzadzeniem** — modal mowi "polaczono" ale tworzy mock dane

### NIE DZIALA W OGOLE (brak .env)
- **Cala aplikacja z backendem** — nie ma pliku .env, serwer nie startuje
- **MongoDB** — nie ma connection stringa
- **Stripe platnosci** — brak kluczy API
- **Wysylka emaili** — brak klucza Resend

---

## Co trzeba zrobic — po kolei

### ETAP 1: Infrastruktura (bez tego nic nie ruszy)

- [ ] **1.1 MongoDB Atlas** — Stworzyc klaster (darmowy M0 wystarczy na start)
  - Wejdz na mongodb.com/atlas → Create Cluster → Get Connection String
  - Zapisz jako MONGO_URL w .env

- [ ] **1.2 Plik .env** — stworzyc na podstawie .env.example z prawdziwymi wartosciami:
  ```
  PORT=3001
  NODE_ENV=development
  MONGO_URL=mongodb+srv://USER:PASS@cluster.mongodb.net/serveiq
  JWT_ACCESS_SECRET=<wygeneruj 64 losowe znaki>
  JWT_REFRESH_SECRET=<wygeneruj 64 losowe znaki>
  CLIENT_URL=http://localhost:5173
  ```

- [ ] **1.3 Uruchom backend** — `npm run dev` powinno wystartowac serwer + klienta
- [ ] **1.4 Przetestuj rejestracje** — stworz konto, przejdz onboarding, sprawdz czy dane sa w bazie

### ETAP 2: Stripe (platnosci i subskrypcje)

- [ ] **2.1 Konto Stripe** — zarejestruj na stripe.com (darmowe, tryb testowy)
- [ ] **2.2 Stworz produkty w Stripe Dashboard:**
  - Produkt "ServeIQ Premium" → Cena 39 PLN/miesiac → zapisz `price_xxx` ID
  - Produkt "ServeIQ Family" → Cena 59 PLN/miesiac → zapisz `price_xxx` ID
- [ ] **2.3 Dodaj do .env:**
  ```
  STRIPE_SECRET_KEY=sk_test_xxx
  STRIPE_WEBHOOK_SECRET=whsec_xxx
  STRIPE_PREMIUM_PRICE_ID=price_xxx
  STRIPE_FAMILY_PRICE_ID=price_xxx
  ```
- [ ] **2.4 Stripe CLI** — zainstaluj i uruchom webhook forwarding:
  ```
  stripe listen --forward-to localhost:3001/api/subscriptions/webhook
  ```
- [ ] **2.5 Przetestuj** — kliknij "Wybierz Premium" na stronie cennika, przejdz przez Stripe Checkout (karta testowa: 4242 4242 4242 4242)

### ETAP 3: Email (powiadomienia i komunikacja)

- [ ] **3.1 Konto Resend** — zarejestruj na resend.com (darmowe, 3000 emaili/miesiac)
- [ ] **3.2 Zweryfikuj domene** — lub uzyj domyslnej resend.dev do testow
- [ ] **3.3 Dodaj do .env:**
  ```
  RESEND_API_KEY=re_xxx
  FROM_EMAIL=noreply@serveiq.pl
  ```
- [ ] **3.4 Zmien NODE_ENV** — ustaw `NODE_ENV=production` zeby emaile faktycznie sie wysylaly (lub zmodyfikuj emailService zeby wysylal tez w dev)
- [ ] **3.5 Przetestuj** — zarejestruj sie, sprawdz czy email powitalny doszedl

### ETAP 4: Testy end-to-end calego flow

Po ustawieniu .env przetestuj CALY flow uzytkownika:

- [ ] **4.1 Rejestracja** — nowy uzytkownik, email + haslo
- [ ] **4.2 Onboarding** — dodaj dziecko, pomin urzadzenie
- [ ] **4.3 Dashboard** — czy wyswietla dane dziecka (bez wearable = puste metryki, to OK)
- [ ] **4.4 Profil dziecka** — edycja umiejetnosci, celow
- [ ] **4.5 Upload zdjecia** — wgraj avatar dziecka
- [ ] **4.6 Urzadzenia** — polacz mock WHOOP → czy dane pojawiaja sie na dashboardzie
- [ ] **4.7 Historia zdrowia** — wykresy, porownanie okresow
- [ ] **4.8 Timeline** — czy pokazuje wydarzenia
- [ ] **4.9 Powiadomienia** — czy bell w topbar pokazuje alerty
- [ ] **4.10 Ustawienia** — zmiana hasla, progi powiadomien
- [ ] **4.11 Cennik** — kliknij Premium → Stripe Checkout → plac karta testowa
- [ ] **4.12 Landing page** — otworz jako niezalogowany, sprawdz wszystkie sekcje
- [ ] **4.13 Regulamin i prywatnosc** — czy strony sie otwieraja

### ETAP 5: Naprawa bledow z testow

Po etapie 4 nieuchronnie znajda sie bledy. Typowe problemy do naprawienia:

- [ ] **5.1** API endpoints zwracaja dane w innym formacie niz frontend oczekuje
- [ ] **5.2** Onboarding nie przekierowuje poprawnie po zakonczeniu
- [ ] **5.3** Paywall blokuje cos czego nie powinien (lub odwrotnie)
- [ ] **5.4** Powiadomienia nie docieraja w real-time (Socket.io)
- [ ] **5.5** Wykresy nie renderuja sie gdy brak danych
- [ ] **5.6** Trial banner pokazuje zle daty
- [ ] **5.7** Responsive — sprawdz mobile (sidebar, wykresy, landing)

### ETAP 6: Deploy na produkcje

- [ ] **6.1 Railway** — stworz projekt na railway.app, polacz z repo GitHub
- [ ] **6.2 Zmienne srodowiskowe** — dodaj wszystkie z .env do Railway
- [ ] **6.3 Domena** — kup domene (np. serveiq.pl) i podlacz do Railway
- [ ] **6.4 SSL** — Railway daje automatycznie z Let's Encrypt
- [ ] **6.5 Build** — sprawdz czy `npm run build` + `npm start` dziala na Railway
- [ ] **6.6 Smoke test** — przejdz caly flow na produkcji

---

## Co zostawiamy jako mock (swiadoma decyzja)

| Funkcja | Dlaczego mock | Kiedy urealnic |
|---------|--------------|----------------|
| Dane WHOOP | Wymaga partnerstwa z WHOOP | Gdy bedzie > 50 platiacych userow |
| Dane Garmin | Wymaga umowy partnerskiej | Gdy bedzie > 50 platiacych userow |
| Polaczenie urzadzenia | Mock OAuth + mock dane | Razem z powyzszymi |
| Apple Health / Google Fit | Nie zaimplementowane | Alternatywa dla WHOOP/Garmin |

**Wazne:** Mock dane sa realistyczne i deterministyczne. Dla beta testerow mozna to komunikowac jako "dane demonstracyjne" dopoki prawdziwe integracje nie beda gotowe.

---

## Co musi dzialac NAPRAWDE na beta launch

1. Rejestracja i logowanie
2. Onboarding (dodawanie dziecka)
3. Dashboard z danymi (mock wearable OK)
4. Profil dziecka z umiejetnosciami i celami
5. Upload zdjecia
6. Plan treningowy
7. Powiadomienia i alerty
8. Stripe subskrypcje (trial → platnosc)
9. Landing page
10. Regulamin + polityka prywatnosci
11. Responsywnosc mobile
12. Emiale (powitalny, tygodniowy, platnosci)

---

## Kolejnosc priorytetow

```
ETAP 1 (infrastruktura)     ← BEZ TEGO NIC NIE DZIALA
  ↓
ETAP 2 (Stripe)             ← BEZ TEGO NIE ZARABIASZ
  ↓
ETAP 3 (email)              ← BEZ TEGO BRAK KOMUNIKACJI
  ↓
ETAP 4 (testy E2E)          ← BEZ TEGO NIE WIESZ CO JEST ZEPSUTE
  ↓
ETAP 5 (bug fixy)           ← BEZ TEGO BETA TESTERZY UCIEKNA
  ↓
ETAP 6 (deploy)             ← BEZ TEGO NIKT NIE WEJDZIE
```

**Szacowany czas:** 2-3 dni na etapy 1-3 (glownie konfiguracja), 2-3 dni na etapy 4-5 (testowanie i naprawy), 1 dzien na etap 6 (deploy).
