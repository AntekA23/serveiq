# ServeIQ — Plan rozwoju

## Stan obecny (audyt 2026-03-30)

### Co dziala REALNIE (baza danych, pełna funkcjonalność)

| Funkcja | Opis |
|---------|------|
| Rejestracja / logowanie | JWT + refresh token, role coach/parent, onboarding |
| Zarzadzanie dzieckiem | Dodawanie, edycja, avatar upload, skills, ranking |
| Plan treningowy | 2 zakladki, cel tygodniowy, dni, fokus, milestones — CRUD w MongoDB |
| Sesje treningowe | Tworzenie przez rodzica i trenera, 6 typow, startTime, notatki |
| Czat / wiadomosci | Socket.IO realtime, historia w MongoDB, oznaczanie przeczytanych |
| Powiadomienia | Zapis w DB, odczytywanie, alerty generowane przez background jobs |
| Ustawienia konta | Profil, zmiana hasla, progi powiadomien, soft-delete konta |
| Landing page | Strona marketingowa z beta signup (zapis do DB) |
| Demo mode | Pelne dane testowe we wszystkich zakladkach |

### Co jest MOCK / scaffolding

| Funkcja | Stan | Czego brakuje |
|---------|------|---------------|
| Dane z WHOOP / Garmin | Mock — generowane syntetycznie, zapisywane w DB | Klucze API + dokonczenie OAuth flow w providerach |
| Platnosci (Stripe) | Kod gotowy, Stripe nie podlaczony | STRIPE_SECRET_KEY + price ID-s |
| Subskrypcje | Trial 14-dni dziala, billing nie | j.w. |
| Emaile (reset hasla, zaproszenia) | Logowane do konsoli | RESEND_API_KEY |
| Push notifications | Brak | Firebase/OneSignal integracja |
| Panel trenera | Calkowicie wylaczony (CoachDisabled.jsx) | Nowy UI trenera |

---

## Roadmap

### FAZA 1 — Stabilizacja i produkcja
> Cel: aplikacja dzialajaca end-to-end dla rodzicow bez mokow

#### 1.1 Email service (Resend)
- [ ] Skonfigurowac RESEND_API_KEY w Railway
- [ ] Przetestowac reset hasla end-to-end
- [ ] Przetestowac zaproszenia rodzicow

#### 1.2 Stripe — platnosci i subskrypcje
- [ ] Utworzyc produkty w Stripe Dashboard (Premium 39 PLN, Family 59 PLN)
- [ ] Skonfigurowac STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, price IDs w Railway
- [ ] Przetestowac checkout flow: parent → Stripe → webhook → status update
- [ ] Przetestowac portal Stripe (zarzadzanie subskrypcja)
- [ ] Obsluga wygasniecia trialu → downgrade do free

#### 1.3 Cloudinary — avatary
- [ ] Skonfigurowac CLOUDINARY_URL w Railway
- [ ] Zamienic local file upload na Cloudinary upload w playerController
- [ ] Migrowac istniejace avatary (jesli sa)

#### 1.4 Produkcja — zmienne srodowiskowe Railway
- [ ] CLIENT_URL → prawdziwy URL produkcyjny (nie localhost)
- [ ] NODE_ENV=production
- [ ] Audit cookie settings (sameSite, secure) pod domena produkcyjna
- [ ] Sprawdzic CORS origin pod produkcyjna domene

---

### FAZA 2 — Panel trenera
> Cel: trenerzy moga zarzadzac zawodnikami, sesjami, platnoskami

#### 2.1 Re-aktywacja panelu trenera
- [ ] Usunac CoachDisabled redirect
- [ ] Nowy routing: /coach/dashboard, /coach/players, /coach/sessions, /coach/payments
- [ ] Coach Dashboard — lista zawodnikow, sesje w tym miesiacu, przychod

#### 2.2 Zarzadzanie zawodnikami (coach)
- [ ] Lista zawodnikow z wyszukiwarka
- [ ] Formularz dodawania zawodnika + zaproszenie rodzica emailem
- [ ] Profil zawodnika — edycja skills, ranking, notatki
- [ ] Cele zawodnika — dodawanie/edycja/ukonczone

#### 2.3 Sesje treningowe (coach)
- [ ] Kalendarz sesji z filtrami (zawodnik, miesiac)
- [ ] Formularz tworzenia sesji z skill updates
- [ ] Oznaczanie sesji jako widocznych dla rodzica
- [ ] Historia sesji z podsumowaniem

#### 2.4 Platnosci (coach)
- [ ] Tworzenie rachunkow miesiecznych dla zawodnikow
- [ ] Przegląd statusow platnosci (oplacone / zaległe)
- [ ] Statystyki przychodu (miesieczny, roczny)

#### 2.5 Czat coach ↔ parent
- [ ] Panel wiadomosci trenera (lista rozmow z rodzicami)
- [ ] Kontekst zawodnika przy wiadomosciach

---

### FAZA 3 — Prawdziwe dane zdrowotne
> Cel: WHOOP i Garmin dostarczaja prawdziwe metryki

#### 3.1 WHOOP integracja
- [ ] Zarejestrowac aplikacje w WHOOP Developer Portal
- [ ] Skonfigurowac WHOOP_CLIENT_ID + WHOOP_CLIENT_SECRET
- [ ] Dokonczyc OAuth 2.0 + PKCE flow (whoopProvider.js)
- [ ] Implementacja pobierania danych: recovery, sleep, strain, workout
- [ ] Mapowanie danych WHOOP → WearableData schema
- [ ] Automatyczna synchronizacja (background job co 15 min)

#### 3.2 Garmin integracja
- [ ] Zarejestrowac aplikacje w Garmin Connect Developer
- [ ] Skonfigurowac GARMIN_CONSUMER_KEY + GARMIN_CONSUMER_SECRET
- [ ] Dokonczyc OAuth 1.0a flow (garminProvider.js)
- [ ] Implementacja pobierania: Body Battery, HR, sleep, stress, steps
- [ ] Mapowanie danych Garmin → WearableData schema
- [ ] Automatyczna synchronizacja

#### 3.3 Ulepszenie dashboardu zdrowotnego
- [ ] Wskaznik zrodla danych (WHOOP vs Garmin vs mock)
- [ ] Obsluga bledow synchronizacji (token wygasl, device offline)
- [ ] Ręczna resynchronizacja z UI

---

### FAZA 4 — Rozbudowa funkcjonalności rodzica
> Cel: wiecej wartosci dla rodzica platacego za aplikacje

#### 4.1 Postepy dziecka — nowa strona
- [ ] Wykresy umiejetnosci w czasie (serve, forehand, etc.)
- [ ] Porownanie przed/po w wybranym okresie
- [ ] Podsumowanie miesieczne (ile treningow, godziny, typy)
- [ ] Eksport do PDF

#### 4.2 Kalendarz turniejow
- [ ] Lista turniejow (reczne dodawanie przez rodzica)
- [ ] Data, lokalizacja, nawierzchnia, wynik
- [ ] Timeline turniejow na profilu dziecka

#### 4.3 Porownywanie okresow zdrowotnych
- [ ] Porownanie: "ten tydzien vs poprzedni" / "ten miesiac vs poprzedni"
- [ ] Wizualizacja trendow (HRV, sen, regeneracja)
- [ ] Korelacja: wiecej snu → lepsza regeneracja → lepsze wyniki

#### 4.4 Cele SMART
- [ ] Cele z mierzalnymi wskaznikami (np. "serwis 85% do maja")
- [ ] Automatyczne sledzenie postepu z danych sesji/skills
- [ ] Powiadomienie gdy cel osiagniety

---

### FAZA 5 — Powiadomienia i automatyzacja
> Cel: aplikacja aktywnie informuje rodzica

#### 5.1 Push notifications (mobile web)
- [ ] Integracja Firebase Cloud Messaging lub Web Push API
- [ ] Powiadomienia o niskiej regeneracji
- [ ] Przypomnienia o zaplanowanych treningach
- [ ] Powiadomienia o nowych wiadomosciach od trenera

#### 5.2 Email digest
- [ ] Tygodniowe podsumowanie emailem (pon rano)
- [ ] Podsumowanie: ile treningow, zdrowie, cele
- [ ] Konfigurowalny czas wysylki
- [ ] Opcja wylaczenia

#### 5.3 Inteligentne alerty
- [ ] Alert: dziecko trenuje 3 dni bez rozciagania
- [ ] Alert: spadek regeneracji przez 3+ dni
- [ ] Alert: zalegla platnosc
- [ ] Alert: trener dodal nowa sesje / zaktualizowal skills

---

### FAZA 6 — Skalowanie i zaawansowane funkcje
> Cel: wyrozniki na rynku

#### 6.1 Wiele dzieci / profil rodzinny
- [ ] Przelacznik miedzy dziecmi (juz czesciowo dziala)
- [ ] Plan Family z obsluga 3+ dzieci
- [ ] Dashboard porownawczy (rodzenstwo)

#### 6.2 AI coaching assistant
- [ ] Analiza wzorcow treningowych (zbyt malo rozciagania, za duzo kortow)
- [ ] Rekomendacje dopasowane do regeneracji
- [ ] Sugestie planu tygodniowego na podstawie historii
- [ ] Integracja z Claude API

#### 6.3 Spolecznosc / ranking
- [ ] Publiczne profile zawodnikow (opcjonalne)
- [ ] Ranking PZT — automatyczna aktualizacja
- [ ] Wyszukiwanie trenerow w okolicy

#### 6.4 Aplikacja mobilna
- [ ] React Native (lub PWA)
- [ ] Push notifications natywne
- [ ] Szybkie logowanie treningu z telefonu
- [ ] Integracja z HealthKit / Google Fit

---

## Priorytety — co robic najpierw

```
FAZA 1 (teraz)     → Stabilizacja: email, Stripe, produkcja
FAZA 2 (nastepna)  → Panel trenera (otwiera dwustronny rynek)
FAZA 3 (rownolegla) → WHOOP/Garmin (USP produktu)
FAZA 4 (po 2+3)    → Rozbudowa rodzica
FAZA 5 (po 4)      → Powiadomienia
FAZA 6 (dlugoterm.) → AI, mobile, spolecznosc
```

Faza 1 to kwestia konfiguracji (klucze API) — niewiele kodu.
Faza 2 to najwiecej pracy (nowy UI trenera od zera).
Faza 3 zalezy od dostepu do API WHOOP/Garmin (proces rejestracji deweloperskiej).
