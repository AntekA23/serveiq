# Sprint 4 — Internal MVP v0.1

**Okres**: 20-26 kwietnia 2026
**EPIC**: E4 (Timeline i komunikacja)
**Cel sprintu**: Wspolny timeline/feed dzialajacy per gracz — trener dodaje notatki, rodzic widzi aktualizacje. Pierwsze wewnetrzne demo.

---

## Taski

### A1. Wspolny timeline per gracz
**Pliki:**
- Nowy: `client/src/components/player/PlayerTimeline.jsx`
- Uzycie w: ChildProfile.jsx (rodzic), CoachPlayerProfile (trener)

**Co zbudowac:**
- Komponent timeline ciagnacy dane z roznych zrodel:
  - Aktywnosci (z Activity)
  - Notatki trenera (z Observation lub nowy model Note)
  - Aktualizacje etapu (z pathwayHistory)
  - Rekomendacje (z Recommendation)
- Sortowanie chronologiczne (najnowsze na gorze)
- Ikony/kolory per typ wpisu
- Paginacja lub lazy loading

---

### A2. Notatki trenera (coach notes)
**Pliki:**
- Sprawdzic: czy Observation model wystarcza, czy potrzebny osobny Note model
- Frontend: formularz szybkiej notatki w profilu gracza (widok trenera)

**Co zbudowac:**
- Trener moze dodac szybka notatke do gracza (tekst + opcjonalny typ: obserwacja, uwaga, pochwala)
- Notatka pojawia sie w timeline
- Rodzic widzi notatki oznaczone jako widoczne dla rodzica

---

### A3. Format aktualizacji dla rodzica
**Pliki:**
- Modyfikacja PlayerTimeline.jsx

**Co zbudowac:**
- Rodzic widzi uproszczona wersje timeline:
  - Aktywnosci: nazwa + data + typ
  - Notatki trenera: tylko te oznaczone jako widoczne
  - Rekomendacje: pelny tekst
  - Zmiany etapu: komunikat "Zmiana etapu na X"
- Jasne, czytelne karty bez technicznego zargonu

---

### A4. Polish 3 kluczowych ekranow
**Ekrany:**
1. Dashboard rodzica — upewnic sie ze wyglada profesjonalnie
2. Profil dziecka z timeline — czytelne, spokojne
3. Lista aktywnosci trenera — funkcjonalne, szybkie

**Co zrobic:**
- Konsystencja kolorow i typografii
- Responsywnosc mobile
- Puste stany (empty states) z jasnymi komunikatami
- Ladowanie (loading states)

---

### A5. Wewnetrzny skrypt demo
**Zadanie manualne:**
- Napisac scenariusz 10-minutowego demo:
  1. Rejestracja rodzica -> dodanie dziecka
  2. Trener dodaje aktywnosci (klasa Tennis 10, turniej)
  3. Trener dodaje notatke i ustawia nastepny krok
  4. Rodzic widzi timeline, etap, rekomendacje
- Przygotowac dane demo w bazie

---

### A6. Zaplanowanie pierwszych demo
**Zadanie manualne:**
- Ustalic 3-5 terminow demo z cieplymy kontaktami
- Przygotowac krotki email/wiadomosc zapraszajaca

---

## Kolejnosc realizacji

| Dzien | Taski |
|---|---|
| Pon 21 kwi | A1 (timeline component) |
| Wt 22 kwi | A2 (coach notes) |
| Sr 23 kwi | A3 (parent view formatting) |
| Czw 24 kwi | A4 (polish 3 ekranow) |
| Pt 25 kwi | A5, A6 (demo prep) |

---

## Definition of Done

- [ ] Timeline per gracz wyswietla aktywnosci, notatki, zmiany etapu, rekomendacje
- [ ] Trener moze dodac szybka notatke do gracza
- [ ] Rodzic widzi czytelna wersje timeline
- [ ] 3 kluczowe ekrany sa dopracowane
- [ ] Skrypt demo gotowy
- [ ] 3-5 demo zaplanowanych

**CHECKPOINT: Wewnetrzne MVP v0.1 — Plan + Komunikacja + Lekki monitoring**
