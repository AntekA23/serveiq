# Sprint 8 — Demo Readiness

**Okres**: 18-24 maja 2026
**EPIC**: E8 (Demo i gotowsc pilotowa)
**Cel sprintu**: Produkt gotowy do zewnetrznych demo — 2 scenariusze z realistycznymi danymi, deck sprzedazowy, outbound.

---

## Taski

### A1. Skrypt seed danych demo
**Nowy:** `server/src/scripts/seedDemo.js`

**Scenariusz 1 — Akademia Tennis 10 "Kortowo Warszawa":**
- 1 Club: "Kortowo Warszawa" z 7 pathwayStages
- 3 Coaches: Anna Nowak (Tennis 10), Marcin Zielinski (committed), Katarzyna Wrobel (advanced)
- 3 Groups: "Czerwony kort" (8 graczy), "Pomaranczowy kort" (6 graczy), "Zielony kort" (4 graczy)
- 18 Players w roznych etapach:
  - 8x beginner/czerwony (6-8 lat)
  - 6x tennis10/pomaranczowy (8-10 lat)
  - 4x committed/zielony (10-12 lat)
- 10 Parents powiazanych z graczami
- 30+ Activities (ostatnie 2 miesiace): classes (2x/tyg per grupa), 1 camp, 2 turnieje wewnetrzne
- 15 Observations rozne typy
- 8 DevelopmentGoals (mix active/completed)
- 4 ReviewSummaries (2 published, 2 draft)
- 5 Recommendations
- PathwayHistory: 3 graczy z historią awansu

**Scenariusz 2 — Sciezka Sonia:**
- 1 zaawansowana juniorka "Sonia Testowa" (etap: advanced, 12 lat)
- 1 head coach + 1 parent
- Activities: 3 treningi/tyg + 2 fitness + 4 turnieje (w tym Tennis Europe) + 1 oboz
- 5 celow rozwojowych (3 active, 1 completed, 1 paused)
- 10 obserwacji (rozne typy, powiazane z celami)
- 2 przeglady published z rekomendacjami
- Bogata pathwayHistory: beginner (2020) -> tennis10 (2021) -> committed (2023) -> advanced (2025)
- nextStep ustawiony: "Przygotowanie do turnieju krajowego U14"

**Uruchomienie:** `node server/src/scripts/seedDemo.js`
- Czysci istniejace dane demo (flag `isDemo: true` lub osobna baza)
- Tworzy wszystko w jednym skrypcie

---

### A2. Polish widokow per rola

**Rodzic:**
- ChildProfile: sprawdzic spojnosc wszystkich sekcji (hero + stepper + journey + cele + aktywnosci + timeline)
- Dashboard: selektor dzieci, przycisk dodaj dziecko, dodaj trenera
- Reviews: czytelne karty 4 sekcji
- Kolorystyka: spokojna, nie przytlaczajaca

**Trener:**
- Dashboard: stat cards + alerty + sesje + gracze
- CoachPlayerProfile: tabs (skills, goals, observations, plan, reviews) — szybki dostep
- Quick observation: max 2 klikniecia do dodania notatki
- Activities: szybkie tworzenie, kopiowanie

**ClubAdmin:**
- ClubDashboard: metryki + etapy + attention + ciaglosc
- Groups: CRUD + przypisanie graczy

---

### A3. UX cleanup checklist

**Empty states (kazdy widok):**
- [ ] MyChildren: "Dodaj swoje pierwsze dziecko"
- [ ] Activities: "Zaplanuj pierwsza aktywnosc" (coach) / "Brak nadchodzacych aktywnosci" (parent)
- [ ] Goals: "Trener wkrotce ustawi cele" (parent) / "Dodaj pierwszy cel" (coach)
- [ ] Timeline: "Brak wpisow — aktywnosci i notatki pojawia sie tutaj"
- [ ] Reviews: "Brak przegladow" (parent) / "Stworz pierwszy przeglad" (coach)
- [ ] Groups: "Stworz pierwsza grupe"

**Loading states:**
- [ ] Skeleton/spinner na kazdym fetch
- [ ] Przycisk loading state na kazdym submit

**Error states:**
- [ ] Toast na kazdym failed request
- [ ] Graceful fallback (nie bialy ekran)

**Mobile:**
- [ ] Sidebar zamyka sie po kliknieciu
- [ ] Formularze: kolumny stackuja sie
- [ ] Tabele: horizontal scroll lub card view
- [ ] Touch-friendly: min 44px tap targets

---

### A4. Demo flow 10 minut
**Dokument:** `docs/DEMO_SCRIPT.md`

```
Minuta 0-1: PROBLEM
- "Klub prowadzi Tennis 10, obozy, zajecia. Rodzice pytaja 'jak moje dziecko
  sie rozwija?'. Trener odpowiada na WhatsApp. Nikt nie wie jaki jest plan."

Minuta 1-3: RODZIC
- Login jako rodzic -> Dashboard
- Widzi dziecko, etap sciezki, nadchodzace zajecia
- Profil dziecka: pathway stepper, cele, ostatnie obserwacje
- Przeglad od trenera: 4 sekcje, czytelne

Minuta 3-5: TRENER
- Login jako trener -> Dashboard
- Tworzy aktywnosc (zajecia grupowe Tennis 10)
- Dodaje szybka notatke o graczu
- Tworzy przeglad z AI draft
- Ustawia nastepny krok

Minuta 5-7: KLUB
- Login jako clubAdmin -> Dashboard
- Gracze wg etapow, metryki ciaglosci
- Gracze wymagajacy uwagi
- Grupy i aktywnosci

Minuta 7-8: AI
- AI draft przegladu — wygenerowany z danych
- Trener edytuje i publikuje
- Rekomendacja automatycznie widoczna u rodzica

Minuta 8-9: SONIA (zaawansowana sciezka)
- Pokazanie zaawansowanej juniorki
- Bogaty timeline, turnieje, cele, przeglady
- Ten sam workflow, glebbsze dane

Minuta 9-10: NASTEPNE KROKI
- Model pilota: 8-10 tygodni, 10-30 graczy
- Co zawiera, jaki koszt
- "Kiedy mozemy zaczac?"
```

---

### A5. Deck sprzedazowy
**Format:** 10 slajdow, PDF lub Google Slides

1. **Tytul**: ServeIQ — Rozwoj juniorow w jednym miejscu
2. **Problem**: Chaos — WhatsApp, notatki, brak sciezki, dropout
3. **Rozwiazanie**: Jeden ekosystem: plan, komunikacja, postep, przeglady
4. **Dla klubu**: Retencja, zaangazowanie rodzin, ciaglosc sciezki
5. **Screenshot**: Dashboard rodzica z etapami i celami
6. **Screenshot**: Timeline + przeglad trenera
7. **Screenshot**: Dashboard klubu z metrykam
8. **Glebsza sciezka**: Sonia — dowod ze system obsluguje zaawansowanych
9. **Pilot**: 8-10 tyg, 10-30 graczy, co zawiera
10. **Cennik + CTA**: 8-15k PLN pilot, nastepne kroki

---

### A6. Outbound
- Lista 10-20 prospektow (kluby z PZT, znane akademie)
- Szablon emaila: 3 zdania + zaproszenie na demo
- Follow-up plan: przypomnienie po 3 dniach

---

## Kolejnosc realizacji

| Dzien | Taski | Co powstaje |
|---|---|---|
| Pon 19 maj | A1 (seed script — Tennis 10 scenariusz) | Realistyczne dane demo |
| Wt 20 maj | A1 (seed script — Sonia scenariusz) | Oba scenariusze gotowe |
| Sr 21 maj | A2 (polish widokow) + A3 (UX cleanup) | Dopracowany UI |
| Czw 22 maj | A4 (demo script) + A5 (deck) | Materialy sprzedazowe |
| Pt 23 maj | A6 (outbound) + finalne testy | Outbound ruszony |

---

## Definition of Done

- [ ] Seed script tworzy 2 pelne scenariusze z realistycznymi danymi
- [ ] Widoki per rola sa dopracowane i spojne
- [ ] Wszystkie empty/loading/error states obslugone
- [ ] Mobile responsywnosc na kluczowych ekranach
- [ ] Demo script 10 min napisany i przetestowany
- [ ] Deck 10 slajdow gotowy (PDF)
- [ ] Email outbound wyslany do min. 10 prospektow
- [ ] `vite build` przechodzi bez bledow

**CHECKPOINT: Demo-ready MVP**
