# Sprint 8 — Demo Readiness

**Okres**: 18-24 maja 2026
**EPIC**: E8 (Demo i gotowsc pilotowa)
**Cel sprintu**: Produkt gotowy do zewnetrznych demo — 2 dopracowane scenariusze, dane demo, deck sprzedazowy.

---

## Taski

### A1. Wysokiej jakosci dane demo (seed)
**Pliki:**
- Nowy lub modyfikacja: `server/src/scripts/seedDemo.js` lub podobny

**Scenariusz Tennis 10:**
- Klub "Akademia Tenisa Warszawa"
- 15 juniorow w roznych etapach (beginner -> tennis10 -> committed)
- 3 trenerow
- 10 rodzicow
- Aktywnosci: zajecia grupowe, oboz letni, turniej wewnetrzny
- Cele rozwojowe, obserwacje, przeglady
- Timeline z 2-miesiecna historia

**Scenariusz Sonia:**
- 1 zaawansowana juniorka
- Trener glowny + rodzic
- Aktywnosci: treningi, turnieje Tennis Europe, obozy, fitness
- Bogate cele, obserwacje, przeglady z rekomendacjami
- Widoczna sciezka: beginner -> tennis10 -> committed -> advanced

---

### A2. Dopracowanie widokow per rola
- Rodzic: czysty, spokojny, informacyjny
- Trener: szybki, operacyjny, minimum klikniec
- ClubAdmin: strategiczny, oversight
- Konsystencja kolorow, fontow, spacing

---

### A3. UX rough edges cleanup
- Empty states z jasnymi komunikatami i CTA
- Loading states (skeletony lub spinnery)
- Error states (toast + fallback)
- Mobile responsywnosc na kluczowych ekranach
- Formularz szybkosci (trener nie moze tracic czasu)

---

### A4. Finalizacja 10-minutowego demo flow
**Dokument:**
- Minuta 0-1: Problem (chaos, fragmentacja, brak sciezki)
- Minuta 1-3: Pokazanie rodzica — dodaje dziecko, widzi timeline, etap, cele
- Minuta 3-5: Pokazanie trenera — planuje aktywnosci, dodaje notatki, tworzy przeglad
- Minuta 5-7: Pokazanie klubu — dashboard, grupy, gracze wymagajacy uwagi
- Minuta 7-8: AI review draft
- Minuta 8-9: Scenariusz Sonia — zaawansowana sciezka w tym samym narzedziu
- Minuta 9-10: Model pilota + nastepne kroki

---

### A5. Deck sprzedazowy
**Struktura (max 10 slajdow):**
1. Problem: chaos w zarzadzaniu juniorami
2. Rozwiazanie: ServeIQ — jeden ekosystem
3. Dla kogo: kluby, trenerzy, rodzice
4. Demo screenshot: Tennis 10 journey
5. Demo screenshot: timeline rodzica
6. Demo screenshot: dashboard klubu
7. Scenariusz Sonia — dowod glebokosci
8. Model pilota: 8-10 tygodni, co zawiera
9. Cennik: pilot + subskrypcja
10. Nastepne kroki

---

### A6. Outbound do szerszej listy
- Email/wiadomosc do 10-20 prospektow
- Szablon: 3 zdania + zaproszenie na demo
- Followup plan

---

## Kolejnosc realizacji

| Dzien | Taski |
|---|---|
| Pon 19 maj | A1 (seed data — Tennis 10 scenariusz) |
| Wt 20 maj | A1 (seed data — Sonia scenariusz) |
| Sr 21 maj | A2 (polish widokow), A3 (UX cleanup) |
| Czw 22 maj | A4 (demo flow), A5 (deck) |
| Pt 23 maj | A6 (outbound) + finalne testy |

---

## Definition of Done

- [ ] Dane demo zaladowane — oba scenariusze wyglodaja realistycznie
- [ ] Widoki per rola dopracowane i spojne
- [ ] Brak oczywistych UX bledow na kluczowych sciezkach
- [ ] 10-minutowy demo flow przetestowany
- [ ] Deck sprzedazowy gotowy (PDF lub slajdy)
- [ ] Outbound do min. 10 prospektow

**CHECKPOINT: Demo-ready MVP**
