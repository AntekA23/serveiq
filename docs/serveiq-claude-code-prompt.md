# ServeIQ — Claude Code Build Prompt

## Cel projektu

Zbuduj **ServeIQ** — aplikację webową dla trenerów tenisa i rodziców zawodników, która umożliwia planowanie treningów, śledzenie postępów, zarządzanie turniejami i obsługę płatności. Aplikacja musi być w pełni funkcjonalna, gotowa do wdrożenia na Railway z bazą MongoDB.

---

## Stack technologiczny

### Backend (`/server`)
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Baza danych**: MongoDB + Mongoose (ODM)
- **Autentykacja**: JWT (access token 15min + refresh token 7dni, httpOnly cookies)
- **Płatności**: Stripe (checkout sessions + webhooks)
- **Email**: Nodemailer + Resend (potwierdzenia, reset hasła)
- **Walidacja**: Zod
- **Upload plików**: Multer + Cloudinary (avatary)
- **Bezpieczeństwo**: helmet, cors, express-rate-limit, bcryptjs
- **Środowisko**: dotenv

### Frontend (`/client`)
- **Framework**: React 18 + Vite
- **Routing**: React Router v6
- **State management**: Zustand
- **HTTP**: Axios z interceptorami (auto refresh token)
- **Formularze**: React Hook Form + Zod
- **Komponenty UI**: własne, bez żadnych bibliotek komponentów (Shadcn, MUI itp.)
- **Style**: CSS Modules lub czysty CSS z CSS Variables — BEZ Tailwind
- **Czat real-time**: Socket.io-client
- **Powiadomienia toast**: własna implementacja
- **Ikony**: Lucide React (jedyna dozwolona biblioteka ikon)

### Infrastruktura
- Struktura `/client` + `/server` w monorepo
- `package.json` w root z `scripts` do uruchamiania obu serwisów
- Railway-ready: `Procfile` lub `railway.json`, zmienne środowiskowe przez `.env.example`
- CORS skonfigurowany dla produkcji i developmentu

---

## Struktura projektu

```
serveiq/
├── package.json                    # root — concurrently dev scripts
├── .env.example
├── railway.json
│
├── server/
│   ├── package.json
│   ├── src/
│   │   ├── index.js                # entry point
│   │   ├── config/
│   │   │   ├── db.js               # mongoose connect
│   │   │   └── stripe.js
│   │   ├── middleware/
│   │   │   ├── auth.js             # verifyToken, requireRole
│   │   │   ├── errorHandler.js
│   │   │   └── rateLimiter.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Player.js
│   │   │   ├── Session.js          # trening (nie HTTP session)
│   │   │   ├── Payment.js
│   │   │   ├── Tournament.js
│   │   │   └── Message.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── users.js
│   │   │   ├── players.js
│   │   │   ├── sessions.js
│   │   │   ├── payments.js
│   │   │   ├── tournaments.js
│   │   │   └── messages.js
│   │   ├── controllers/            # logika biznesowa oddzielona od routes
│   │   ├── services/
│   │   │   ├── emailService.js
│   │   │   └── stripeService.js
│   │   └── socket/
│   │       └── chatHandler.js      # Socket.io events
│
└── client/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── styles/
        │   ├── global.css          # CSS variables, reset, typography
        │   └── tokens.css          # design tokens
        ├── store/
        │   ├── authStore.js        # Zustand
        │   └── uiStore.js
        ├── api/
        │   └── axios.js            # instance z interceptorami
        ├── hooks/
        │   ├── useAuth.js
        │   └── useToast.js
        ├── components/
        │   ├── ui/                 # design system atoms
        │   │   ├── Button/
        │   │   ├── Input/
        │   │   ├── Badge/
        │   │   ├── Avatar/
        │   │   ├── Modal/
        │   │   ├── Toast/
        │   │   └── ProgressBar/
        │   ├── layout/
        │   │   ├── Sidebar/
        │   │   ├── Topbar/
        │   │   └── AppShell/
        │   └── shared/
        │       ├── PlayerCard/
        │       ├── SessionItem/
        │       └── PaymentCard/
        └── pages/
            ├── auth/
            │   ├── Login.jsx
            │   ├── Register.jsx
            │   └── ForgotPassword.jsx
            ├── coach/
            │   ├── Dashboard.jsx
            │   ├── Players.jsx
            │   ├── PlayerDetail.jsx
            │   ├── Sessions.jsx
            │   ├── NewSession.jsx
            │   ├── Payments.jsx
            │   └── Tournaments.jsx
            └── parent/
                ├── Dashboard.jsx
                ├── Progress.jsx
                ├── Payments.jsx
                └── Chat.jsx
```

---

## Modele danych (MongoDB / Mongoose)

### User
```js
{
  _id, email, password (bcrypt), role: 'coach' | 'parent',
  firstName, lastName, phone, avatarUrl,
  // dla trenera:
  coachProfile: { club, itfLevel, bio },
  // dla rodzica:
  parentProfile: { children: [ref Player] },
  refreshToken, resetPasswordToken, resetPasswordExpires,
  createdAt, updatedAt
}
```

### Player
```js
{
  _id, firstName, lastName, dateOfBirth, gender,
  coach: ref User, parents: [ref User],
  ranking: { pzt: Number, wta: Number, atp: Number },
  avatarUrl,
  skills: {
    serve: { score: 0-100, notes: String },
    forehand: { score: 0-100, notes: String },
    backhand: { score: 0-100, notes: String },
    volley: { score: 0-100, notes: String },
    tactics: { score: 0-100, notes: String },
    fitness: { score: 0-100, notes: String }
  },
  goals: [{
    text: String, dueDate: Date,
    completed: Boolean, completedAt: Date
  }],
  monthlyRate: Number,
  active: Boolean,
  createdAt, updatedAt
}
```

### Session (trening)
```js
{
  _id, player: ref Player, coach: ref User,
  date: Date, durationMinutes: Number,
  title: String, notes: String,
  focusAreas: [String],          // ['Backhand', 'Taktyka', 'Serwis']
  skillUpdates: [{               // zmiany w skill scores po treningu
    skill: String, scoreBefore: Number, scoreAfter: Number
  }],
  visibleToParent: Boolean,      // czy rodzic widzi notatki (domyślnie true)
  createdAt
}
```

### Payment
```js
{
  _id, player: ref Player, coach: ref User, parent: ref User,
  amount: Number, currency: 'PLN',
  description: String,
  dueDate: Date,
  status: 'pending' | 'paid' | 'overdue' | 'cancelled',
  stripePaymentIntentId, stripeCheckoutSessionId,
  paidAt: Date,
  createdAt
}
```

### Tournament
```js
{
  _id, player: ref Player, coach: ref User,
  name: String, location: String, surface: 'hard' | 'clay' | 'grass' | 'indoor',
  startDate: Date, endDate: Date,
  category: String,              // 'ITF Junior', 'PZT U16', itd.
  drawSize: Number,
  result: { round: String, wins: Number, losses: Number },
  notes: String,
  createdAt
}
```

### Message
```js
{
  _id, from: ref User, to: ref User, player: ref Player,
  text: String, read: Boolean,
  createdAt
}
```

---

## API Endpoints

### Auth (`/api/auth`)
```
POST /register          — rejestracja (coach lub parent)
POST /login             — logowanie, zwraca accessToken + httpOnly refreshToken cookie
POST /refresh           — nowy accessToken z refreshToken cookie
POST /logout            — usuwa refreshToken cookie
POST /forgot-password   — wysyła email z linkiem reset
POST /reset-password/:token
GET  /me                — dane zalogowanego usera
```

### Players (`/api/players`) — tylko coach
```
GET    /                — wszyscy zawodnicy trenera
POST   /                — dodaj zawodnika + wyślij zaproszenie emailem do rodzica
GET    /:id             — szczegóły zawodnika
PUT    /:id             — aktualizuj dane, skills, cele
DELETE /:id             — archiwizuj (soft delete)
POST   /:id/goals       — dodaj cel
PUT    /:id/goals/:goalId — oznacz cel jako ukończony
```

### Sessions (`/api/sessions`) — coach tworzy, parent czyta swoje
```
GET    /                — lista (coach: wszyscy, parent: własne dzieci)
POST   /                — utwórz trening
GET    /:id
PUT    /:id
DELETE /:id
```

### Payments (`/api/payments`)
```
GET    /                — lista (coach: wszystkie, parent: własne)
POST   /                — coach tworzy fakturę dla rodzica
POST   /:id/checkout    — tworzy Stripe Checkout Session, zwraca URL
POST   /webhook         — Stripe webhook (status paid)
GET    /stats           — przychody coach (sum, monthly breakdown)
```

### Tournaments (`/api/tournaments`)
```
GET    /
POST   /
GET    /:id
PUT    /:id
DELETE /:id
```

### Messages (`/api/messages`)
```
GET    /conversations       — lista konwersacji (coach widzi wszystkich rodziców)
GET    /conversation/:userId — historia wiadomości z danym userem
POST   /                    — wyślij wiadomość (fallback HTTP, primary Socket.io)
PUT    /read/:userId         — oznacz jako przeczytane
```

---

## Autentykacja — szczegóły implementacji

1. **Rejestracja trenera**: standardowa, od razu aktywne konto
2. **Rejestracja rodzica**: przez link zaproszeniowy wysłany przez trenera przy dodawaniu zawodnika (token w emailu → rodzic ustawia hasło)
3. **JWT**: `ACCESS_TOKEN_SECRET` (15min), `REFRESH_TOKEN_SECRET` (7 dni)
4. **Refresh token** zapisany w MongoDB na userze + wysyłany jako `httpOnly; secure; sameSite=strict` cookie
5. **Axios interceptor** na frontendzie: przy 401 automatycznie wywołuje `/api/auth/refresh` i ponawia request
6. **Route guards** w React Router: `<ProtectedRoute role="coach">` i `<ProtectedRoute role="parent">`

---

## Design System — KRYTYCZNE

To jest najważniejsza część. Aplikacja musi wyglądać **dokładnie jak ten styl**:

### Filozofia wizualna
- **Czysta, minimalna, jak Notion/Linear** — zero dekoracji, maksimum treści
- Flat UI, zero gradientów, zero cieni (poza focus ringiem)
- Białe karty z cienkimi borderami `0.5px solid` na subtelnym tle
- Generous whitespace, wszystko oddycha

### Typografia
- Font główny: **"DM Sans"** (Google Fonts) — ładuje się z CDN
- Font display (nagłówki stron): **"DM Serif Display"** dla dużych tytułów
- Rozmiary: 11px (meta), 12px (notatki), 13px (body), 15px (tytuły kart), 22px (page title)
- Weight: tylko 400 i 500 — nigdy 600, 700 (za ciężkie)

### CSS Variables (global.css)
```css
:root {
  --color-bg: #ffffff;
  --color-bg-secondary: #f7f6f3;
  --color-bg-tertiary: #f0efe9;
  --color-border: rgba(0,0,0,0.10);
  --color-border-md: rgba(0,0,0,0.18);
  --color-text: #1a1a18;
  --color-text-secondary: #6b6b67;
  --color-text-tertiary: #a0a09a;

  /* Akcenty semantyczne */
  --color-blue: #378ADD;
  --color-blue-bg: #E6F1FB;
  --color-blue-text: #185FA5;
  --color-green: #639922;
  --color-green-bg: #EAF3DE;
  --color-green-text: #3B6D11;
  --color-amber: #EF9F27;
  --color-amber-bg: #FAEEDA;
  --color-amber-text: #854F0B;
  --color-red: #E24B4A;
  --color-red-bg: #FCEBEB;
  --color-red-text: #A32D2D;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  --sidebar-width: 220px;
  --topbar-height: 56px;
}

[data-theme="dark"] {
  --color-bg: #1a1a18;
  --color-bg-secondary: #222220;
  --color-bg-tertiary: #2a2a27;
  --color-border: rgba(255,255,255,0.08);
  --color-border-md: rgba(255,255,255,0.14);
  --color-text: #f0efe9;
  --color-text-secondary: #9a9a94;
  --color-text-tertiary: #666660;
}
```

### Layout aplikacji (AppShell)
```
[Sidebar 220px fixed] | [Main: Topbar 56px + scrollable Content]
```

### Sidebar
- Tło: `var(--color-bg-secondary)`
- Logo "ServeIQ" górą, drobna czcionka
- Nav items: 36px high, `border-radius: var(--radius-md)`, aktywny = biały bg + border
- Na dole: avatar + imię + rola
- Na mobile: sidebar chowa się, hamburger menu

### Karty (Card)
```css
.card {
  background: var(--color-bg);
  border: 0.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 14px 16px;
}
```

### Metric cards (stat boxes)
```css
.metric {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: 12px 14px;
}
.metric-label { font-size: 11px; color: var(--color-text-tertiary); }
.metric-value { font-size: 20px; font-weight: 500; color: var(--color-text); }
```

### Buttons
```css
.btn { padding: 6px 14px; font-size: 13px; border-radius: var(--radius-md); border: 0.5px solid var(--color-border-md); background: transparent; cursor: pointer; font-family: inherit; transition: background 0.1s; }
.btn:hover { background: var(--color-bg-secondary); }
.btn-primary { background: var(--color-text); color: var(--color-bg); border-color: transparent; }
.btn-primary:hover { opacity: 0.85; }
```

### Progress bars
- Height: 4px, border-radius: 2px
- Track: `var(--color-bg-secondary)`
- Fill: kolor zależny od umiejętności (serwis=blue, forehand=blue, backhand=amber, taktyka=green)

### Badges / Tags
- Font-size: 10-11px, padding: 3px 8px, border-radius: full
- Kolory z palet semantycznych (bg + text z tej samej palety)

### Avatary
- Okrągłe, 28-44px zależnie od kontekstu
- Inicjały, kolor bg zależny od roli (coach=blue-bg/text, parent=green-bg/text)

### Animacje
- Page transition: `opacity 0.15s ease` przy zmianie widoku
- Hover na kartach: `border-color` przechodzi do `var(--color-border-md)`
- Żadnych bounce, żadnych slide — subtelność

---

## Funkcjonalności do zaimplementowania

### 1. Auth flow
- [ ] Strona logowania (email + hasło)
- [ ] Rejestracja trenera (imię, nazwisko, email, hasło, klub, poziom ITF)
- [ ] Reset hasła przez email (formularz → email → nowe hasło)
- [ ] Persistent login (refresh token w cookie)
- [ ] Wylogowanie (usuwa cookie, czyści store)

### 2. Coach — Dashboard
- [ ] 4 metryki: liczba zawodników, treningi w bieżącym miesiącu, przychód miesiąca, oczekujące płatności
- [ ] Grid 2 ostatnich zawodników z paskami postępu
- [ ] Lista 3 ostatnich treningów
- [ ] Quick action: "Dodaj trening"

### 3. Coach — Zawodnicy
- [ ] Grid kart zawodników (imię, wiek, ranking PZT, 3 paski postępu)
- [ ] Formularz dodawania zawodnika (dane + zaproszenie emailem do rodzica)
- [ ] Strona szczegółów zawodnika:
  - Edytowalne skill scores (slider 0-100 dla każdej umiejętności)
  - Lista celów z możliwością dodania i oznaczenia jako ukończone
  - Historia treningów tego zawodnika
  - Nadchodzące turnieje
  - Przycisk "Napisz do rodzica"

### 4. Coach — Treningi
- [ ] Lista chronologiczna wszystkich treningów
- [ ] Formularz nowego treningu: wybierz zawodnika, data, czas trwania, tytuł, notatki, tagi umiejętności, aktualizacja skill scores
- [ ] Edycja i usuwanie treningu
- [ ] Filtrowanie po zawodniku i miesiącu

### 5. Coach — Płatności
- [ ] Lista wszystkich płatności z statusami (pending/paid/overdue)
- [ ] Formularz tworzenia faktury: wybierz zawodnika/rodzica, kwota, opis, termin
- [ ] Automatyczne oznaczanie jako "overdue" gdy termin minął
- [ ] Statystyki: opłacone / oczekujące / łączny przychód miesiąca
- [ ] Wysłanie przypomnienia emailem do rodzica

### 6. Coach — Turnieje
- [ ] Lista turniejów wszystkich zawodników
- [ ] Formularz: nazwa, lokalizacja, nawierzchnia, daty, kategoria, draw
- [ ] Po turnieju: wpisanie wyników (runda, W/L)
- [ ] Widok kalendarza turniejów (prosty, listowy według dat)

### 7. Coach — Czat
- [ ] Lista konwersacji z rodzicami (ostatnia wiadomość, liczba nieprzeczytanych)
- [ ] Okno czatu z konkretnym rodzicem
- [ ] Real-time przez Socket.io
- [ ] Oznaczanie jako przeczytane

### 8. Parent — Dashboard
- [ ] Karty postępów dziecka (skill scores + paski)
- [ ] Lista celów dziecka (widok read-only)
- [ ] Ostatnie 3 treningi z notatkami trenera
- [ ] Najbliższy turniej
- [ ] Baner z oczekującą płatnością (jeśli istnieje)

### 9. Parent — Płatności
- [ ] Lista faktur z statusami
- [ ] Przycisk "Zapłać" → Stripe Checkout (redirect → success/cancel URL)
- [ ] Historia opłaconych faktur
- [ ] Potwierdzenie emailem po płatności

### 10. Parent — Czat
- [ ] Czat z trenerem (identyczny UX jak coach)

---

## Stripe — implementacja

```js
// server/src/services/stripeService.js
// createCheckoutSession(paymentId, amount, description, successUrl, cancelUrl)
// → zwraca { url } do redirectu na frontendzie

// Webhook handler dla event: checkout.session.completed
// → aktualizuje Payment.status = 'paid', Payment.paidAt = now
// → wysyła email potwierdzający do rodzica
```

Frontend: po kliknięciu "Zapłać" → POST `/api/payments/:id/checkout` → redirect `window.location.href = data.url`

Po powrocie ze Stripe: strona `/payment/success?session_id=xxx` lub `/payment/cancel`

---

## Socket.io — implementacja czatu

```js
// server/src/socket/chatHandler.js
io.on('connection', (socket) => {
  socket.on('join', (userId) => socket.join(userId))
  socket.on('message', async ({ to, text, playerId, token }) => {
    // zweryfikuj JWT
    // zapisz do MongoDB
    // emituj do odbiorcy
    io.to(to).emit('message', { from, text, playerId, createdAt })
  })
  socket.on('read', ({ from }) => { /* oznacz jako przeczytane */ })
})
```

---

## Email templates

Użyj prostych HTML templates (inline style, max 600px):

1. **Zaproszenie rodzica** — "Trener {coach} dodał Twoje dziecko {player} do ServeIQ. Kliknij aby ustawić hasło."
2. **Reset hasła** — standardowy link ważny 1h
3. **Nowa faktura** — kwota, opis, termin, przycisk "Zapłać teraz"
4. **Przypomnienie o zaległości** — "Faktura za {opis} jest przeterminowana"
5. **Potwierdzenie płatności** — "Dziękujemy! Płatność {kwota} zł przyjęta."

---

## Zmienne środowiskowe (.env.example)

```env
# Server
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
JWT_ACCESS_SECRET=your-access-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (Resend)
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@serveiq.pl

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Client
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
CLIENT_URL=http://localhost:5173
```

---

## Railway deployment

### railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "node server/src/index.js",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### Produkcja
- Frontend buildowany przez Vite: `npm run build` w `/client`
- Express serwuje statyczne pliki z `/client/dist` w trybie produkcyjnym:
```js
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')))
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../../client/dist/index.html')))
}
```

### Root package.json scripts
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "cd server && npm run dev",
    "dev:client": "cd client && npm run dev",
    "build": "cd client && npm run build",
    "start": "node server/src/index.js",
    "install:all": "npm install && cd server && npm install && cd ../client && npm install"
  }
}
```

---

## Seed data (opcjonalne, dla testów)

Utwórz `server/src/scripts/seed.js` który tworzy:
- 1 trenera: `coach@serveiq.pl` / `password123`
- 1 rodzica: `parent@serveiq.pl` / `password123`
- 3 zawodników przypisanych do trenera
- 5 sesji treningowych
- 2 płatności (1 opłacona, 1 pending)
- 1 turniej

---

## Wskazówki implementacyjne

1. **Zacznij od backendu**: modele → auth → players → sessions → payments → tournaments → messages
2. **Testuj każdy endpoint** przed przejściem do frontendu (możesz użyć prostego REST client)
3. **Frontend**: najpierw AppShell (sidebar + routing) → auth pages → coach dashboard → pozostałe strony → parent views → czat
4. **Stripe**: użyj trybu testowego, dodaj webhook przez Stripe CLI lokalnie (`stripe listen --forward-to localhost:3001/api/payments/webhook`)
5. **Socket.io**: podłącz po zalogowaniu, rozłącz przy logout

---

## Czego NIE robić

- NIE używaj bibliotek komponentów (MUI, Shadcn, Chakra, Ant Design)
- NIE używaj Tailwind — czysty CSS z variables
- NIE przechowuj accessToken w localStorage — tylko w pamięci (Zustand store)
- NIE wysyłaj hasła w logach
- NIE commituj pliku `.env`
- NIE używaj `var` — tylko `const`/`let`
- NIE mieszaj logiki biznesowej w routerach — używaj controllers/services

---

## Definicja "Done" dla MVP

Aplikacja jest gotowa gdy:
- [ ] Trener może się zarejestrować i zalogować
- [ ] Trener może dodać zawodnika i wysłać zaproszenie emailem do rodzica
- [ ] Rodzic może ustawić hasło przez link i zalogować się
- [ ] Trener może dodawać treningi z notatkami
- [ ] Rodzic widzi treningi i postępy dziecka
- [ ] Trener może wystawić fakturę
- [ ] Rodzic może zapłacić przez Stripe
- [ ] Czat działa real-time między trenerem a rodzicem
- [ ] Aplikacja działa na Railway z MongoDB Atlas
