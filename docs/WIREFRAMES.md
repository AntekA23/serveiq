# ServeIQ — Wireframe Specifications v1

> **Purpose**: Detailed screen specs for 5 key MVP views. These define structure, components, and role-based variations.
> **Date**: 2026-04-02 (Week 1)
> **Design principle**: Mobile-first, clean, information-dense but not overwhelming.

---

## Screen 1: Player Journey View

**URL**: `/player/:id/journey`
**Users**: Coach, Parent, Club Admin
**Purpose**: The single most important screen — shows where a player is, what's happening, and what's next.

```
┌─────────────────────────────────────────────────────┐
│  ← Back to Group        Player Journey        ⚙️    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────┐  Maja Kowalska                        │
│  │  Avatar  │  Wiek: 7 lat  •  Tennis 10 Czerwony   │
│  │          │  Klub: KT Arka  •  Coach: Tomek       │
│  └──────────┘  Grupa: T10 Red Pon/Śr 16:00          │
│                                                      │
│  ┌─ PATHWAY PROGRESS ──────────────────────────────┐ │
│  │ ● Red  ○ Orange  ○ Green  ○ Jr Beg  ○ Jr Adv   │ │
│  │ ═══════                                          │ │
│  │ W tej grupie od: 2026-01-15 (3 miesiące)        │ │
│  └──────────────────────────────────────────────────┘ │
│                                                      │
│  ┌─ ACTIVE GOALS ──────────────────────────────────┐ │
│  │ 🎯 Koordynacja ręka-oko          ████░░ 60%    │ │
│  │    fundamentals • monthly • do 30 Apr           │ │
│  │                                                  │ │
│  │ 🎯 Uchwyt rakiety — continental    ██░░░░ 30%   │ │
│  │    fundamentals • monthly • do 30 Apr           │ │
│  └──────────────────────────────────────────────────┘ │
│                                                      │
│  ┌─ LATEST REVIEW ─────────────────────────────────┐ │
│  │ 📋 Review — Marzec 2026                         │ │
│  │ Świetna frekwencja (100%). Maja szybko łapie    │ │
│  │ nowe ćwiczenia. Uchwyt wymaga dalszej pracy.    │ │
│  │                                                  │ │
│  │ ➡️ Następne kroki: Kontynuacja w Czerwonej.     │ │
│  │    Możliwe przejście do Pomarańczowej za 2-3m.  │ │
│  │                                    [Zobacz →]    │ │
│  └──────────────────────────────────────────────────┘ │
│                                                      │
│  ┌─ RECOMMENDATIONS ───────────────────────────────┐ │
│  │ ⚡ Dodać ćwiczenia na zmianę kierunku  [medium] │ │
│  │    focus-change • od Coach Tomek                 │ │
│  │                           [Przyjęto] [Odrzuć]   │ │
│  └──────────────────────────────────────────────────┘ │
│                                                      │
│  ┌─ UPCOMING ──────────────────────────────────────┐ │
│  │ 📅 Pon 7 Apr  16:00  Tennis 10 Red — Zajęcia   │ │
│  │ 📅 Śr  9 Apr  16:00  Tennis 10 Red — Zajęcia   │ │
│  │ 📅 Sob 12 Apr 10:00  Mini-Turniej Wewnętrzny   │ │
│  └──────────────────────────────────────────────────┘ │
│                                                      │
│  ┌─ RECENT OBSERVATIONS ───────────────────────────┐ │
│  │ 2 Apr • progress                                │ │
│  │ "Maja zaczyna kontrolować piłkę forehandem"     │ │
│  │ Engagement: ★★★★★  Effort: ★★★★☆              │ │
│  │                                                  │ │
│  │ 31 Mar • highlight                              │ │
│  │ "Świetna energia, motywuje inne dzieci"         │ │
│  │                                                  │ │
│  │                          [Zobacz wszystkie →]    │ │
│  └──────────────────────────────────────────────────┘ │
│                                                      │
│  ┌─ SKILLS SNAPSHOT ───────────────────────────────┐ │
│  │ Serwis    ██░░░ 2/5   Forehand  ███░░ 3/5      │ │
│  │ Backhand  ██░░░ 2/5   Volley   █░░░░ 1/5       │ │
│  │ Ruch      ███░░ 3/5   Taktyka  █░░░░ 1/5       │ │
│  │ Mental    ████░ 4/5   Kondycja ██░░░ 2/5       │ │
│  └──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Role-based variations:

| Section | Coach | Parent | Club Admin |
|---------|-------|--------|------------|
| Pathway progress | Edit stage | View only | View + override |
| Active goals | Create, edit, update progress | View only | View only |
| Latest review | Write, edit, publish | View when published | View |
| Recommendations | Create, edit | View, acknowledge | View |
| Observations | Create, edit | View (if visibleToParent) | View |
| Skills | Edit scores | View | View |
| "Back to" link | → Group | → My Children | → Club Dashboard |

### Components:
- `PlayerHeader` — avatar, name, stage, club, coach, group
- `PathwayProgressBar` — horizontal stage indicator
- `GoalCard` — goal with progress bar
- `ReviewPreview` — latest review summary with link
- `RecommendationCard` — actionable card with accept/dismiss
- `UpcomingActivities` — next 3-5 activities
- `ObservationFeed` — recent observations with signals
- `SkillsRadar` — simple bar chart of skills

---

## Screen 2: Shared Timeline / Feed

**URL**: `/player/:id/timeline` (player-specific) or `/club/:id/feed` (club-wide)
**Users**: All roles
**Purpose**: Chronological feed of everything happening — the "pulse" of the system.

```
┌─────────────────────────────────────────────────────┐
│  Timeline — Maja Kowalska                     🔍    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  [Wszystko] [Zajęcia] [Obserwacje] [Recenzje] [Rec] │
│                                                      │
│  ── Dzisiaj, 2 Kwietnia ──────────────────────────  │
│                                                      │
│  ┌─ 📌 PINNED ─────────────────────────────────────┐│
│  │ ⚡ Rekomendacja: Dodać ćwiczenia na zmianę kier.││
│  │    Coach Tomek • 1 Apr • medium                  ││
│  │                              [Szczegóły →]       ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ 🟢 Obserwacja — progress                        ││
│  │ Coach Tomek • dziś 17:15                         ││
│  │                                                  ││
│  │ "Maja zaczyna kontrolować piłkę forehandem.      ││
│  │  Uchwyt jeszcze wymaga korekty."                 ││
│  │                                                  ││
│  │ Engagement ★★★★★  Effort ★★★★☆                 ││
│  │ Focus: forehand, uchwyt                          ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ ✅ Zajęcia zakończone                            ││
│  │ Tennis 10 Red — Zajęcia • dziś 16:00-17:00      ││
│  │ Coach Tomek • clay • Maja: obecna                ││
│  │                                                  ││
│  │ Notatka: "Ćwiczenia na koordynację i forehanda. ││
│  │ Maja poprawiła kontrolę, ale toss do poprawy."  ││
│  │                                                  ││
│  │ Focus: koordynacja, forehand                     ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  ── 31 Marca ─────────────────────────────────────  │
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ ⭐ Obserwacja — highlight                       ││
│  │ Coach Tomek • 31 Mar 17:10                       ││
│  │                                                  ││
│  │ "Świetna energia, motywuje inne dzieci w grupie" ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ ✅ Zajęcia zakończone                            ││
│  │ Tennis 10 Red — Zajęcia • 31 Mar 16:00-17:00    ││
│  │ Coach Tomek • Maja: obecna                       ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  ── 28 Marca ─────────────────────────────────────  │
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ 📋 Review opublikowany                           ││
│  │ Marzec 2026 • Coach Tomek                        ││
│  │                                                  ││
│  │ "Świetny miesiąc! 100% frekwencja, widoczne     ││
│  │  postępy w koordynacji..."                       ││
│  │                              [Czytaj całość →]   ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  ── 15 Marca ─────────────────────────────────────  │
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ 🚀 Zmiana ścieżki                               ││
│  │ Maja dołączyła do: Tennis 10 Czerwony            ││
│  │ Grupa: T10 Red Pon/Śr 16:00                     ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│              [Załaduj wcześniejsze...]               │
└─────────────────────────────────────────────────────┘
```

### Timeline entry types and icons:
| Source | Icon | Color accent |
|--------|------|-------------|
| Activity completed | ✅ | green |
| Activity planned | 📅 | blue |
| Activity cancelled | ❌ | gray |
| Observation — progress | 🟢 | green |
| Observation — highlight | ⭐ | yellow |
| Observation — concern | 🟡 | amber |
| Review published | 📋 | purple |
| Recommendation | ⚡ | orange |
| Pathway change | 🚀 | blue |

### Components:
- `TimelineFilterTabs` — filter by entry type
- `TimelineEntry` — polymorphic card (renders based on `source` type)
- `PinnedSection` — top section for pinned items
- `DateSeparator` — grouped by date
- `InfiniteScroll` — paginated loading

---

## Screen 3: Activity Planner

**URL**: `/activities` (coach/admin view) or `/calendar` (all roles)
**Users**: Coach (primary), Club Admin, Parent (view-only calendar)
**Purpose**: Create, manage, and track all activities.

### 3A. Calendar View (default for parent)

```
┌─────────────────────────────────────────────────────┐
│  Kalendarz — Maja Kowalska              [Miesiąc ▾] │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ◀  Kwiecień 2026  ▶                                │
│                                                      │
│  Pon    Wto    Śro    Czw    Pią    Sob    Ndz      │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐ │
│  │      │  1   │  2   │  3   │  4   │  5   │  6   │ │
│  │      │      │ 🎾   │      │      │      │      │ │
│  ├──────┼──────┼──────┼──────┼──────┼──────┼──────┤ │
│  │  7   │  8   │  9   │ 10   │ 11   │ 12   │ 13   │ │
│  │ 🎾   │      │ 🎾   │      │      │ 🏆   │      │ │
│  ├──────┼──────┼──────┼──────┼──────┼──────┼──────┤ │
│  │ 14   │ 15   │ 16   │ 17   │ 18   │ 19   │ 20   │ │
│  │ 🎾   │      │ 🎾   │      │      │      │      │ │
│  ├──────┼──────┼──────┼──────┼──────┼──────┼──────┤ │
│  │ 21   │ 22   │ 23   │ 24   │ 25   │ 26   │ 27   │ │
│  │ 🎾   │      │ 🎾   │      │      │ 🏕️   │ 🏕️   │ │
│  ├──────┼──────┼──────┼──────┼──────┼──────┼──────┤ │
│  │ 28   │ 29   │ 30   │      │      │      │      │ │
│  │ 🎾   │      │ 🎾   │      │      │      │      │ │
│  └──────┴──────┴──────┴──────┴──────┴──────┴──────┘ │
│                                                      │
│  Legenda: 🎾 Zajęcia  🏆 Turniej  🏕️ Camp           │
│           💪 Fitness   📋 Review                     │
│                                                      │
│  ── Najbliższe ───────────────────────────────────  │
│  📅 Pon 7 Apr  16:00  Tennis 10 Red — Zajęcia       │
│  📅 Śr  9 Apr  16:00  Tennis 10 Red — Zajęcia       │
│  📅 Sob 12 Apr 10:00  Mini-Turniej Wewnętrzny       │
└─────────────────────────────────────────────────────┘
```

### 3B. Activity Management View (coach/admin)

```
┌─────────────────────────────────────────────────────┐
│  Aktywności                          [+ Nowa] [📅]  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Grupa: [Tennis 10 Red ▾]  Typ: [Wszystkie ▾]       │
│  Status: [Zaplanowane ▾]   Okres: [Ten tydzień ▾]   │
│                                                      │
│  ── Poniedziałek, 7 Kwietnia ──────────────────────  │
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ 🎾 Tennis 10 Red — Zajęcia          [planned]   ││
│  │ 16:00-17:00 • clay • 8 zawodników              ││
│  │ Focus: koordynacja, piłka forehandowa            ││
│  │                                                  ││
│  │ [Rozpocznij] [Edytuj] [Odwołaj]                 ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  ── Środa, 9 Kwietnia ────────────────────────────  │
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ 🎾 Tennis 10 Red — Zajęcia          [planned]   ││
│  │ 16:00-17:00 • clay • 8 zawodników              ││
│  │ Focus: ruch, koordynacja                         ││
│  │                                                  ││
│  │ [Rozpocznij] [Edytuj] [Odwołaj]                 ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  ── Sobota, 12 Kwietnia ──────────────────────────  │
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ 🏆 Mini-Turniej Wewnętrzny         [planned]    ││
│  │ 10:00-14:00 • clay • 12 zawodników              ││
│  │ Kategoria: U8 • Draw: 12                        ││
│  │                                                  ││
│  │ [Edytuj] [Odwołaj]                              ││
│  └──────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### 3C. Activity Completion Form (coach — after session)

```
┌─────────────────────────────────────────────────────┐
│  Zakończ: Tennis 10 Red — Zajęcia                   │
│  Pon 7 Apr 16:00-17:00                              │
├─────────────────────────────────────────────────────┤
│                                                      │
│  OBECNOŚĆ                                            │
│  ┌──────────────────────────────────┐                │
│  │ ✅ Maja Kowalska      [obecna ▾] │                │
│  │ ✅ Jan Nowak          [obecny ▾] │                │
│  │ ❌ Ola Wiśniewska    [nieobecna] │                │
│  │ ✅ Filip Zieliński    [obecny ▾] │                │
│  │ ⏰ Kuba Pawlak       [spóźniony]│                │
│  │ ✅ Zosia Lewandowska [obecna ▾] │                │
│  │ ✅ Michał Kamiński    [obecny ▾] │                │
│  │ 📝 Ania Dąbrowska    [usprawied]│                │
│  └──────────────────────────────────┘                │
│                                                      │
│  FOCUS AREAS (co ćwiczyliśmy)                        │
│  [koordynacja ×] [forehand ×] [+ dodaj]              │
│                                                      │
│  NOTATKA TRENERA (wewnętrzna)                        │
│  ┌──────────────────────────────────────────────────┐│
│  │ Dobra grupa energetyczna. Maja świetnie łapie    ││
│  │ równowagę. Kuba spóźniony — rodzic poinformował.││
│  │ Ola chora — usprawiedliwiona.                    ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  NOTATKA DLA RODZICÓW (widoczna)                     │
│  ┌──────────────────────────────────────────────────┐│
│  │ Świetne zajęcia! Ćwiczyliśmy koordynację i      ││
│  │ pierwsze uderzenia forehandowe. Dzieci świetnie  ││
│  │ się bawiły. Do zobaczenia w środę!               ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  SZYBKA OBSERWACJA (opcjonalne — per player)         │
│  ┌──────────────────────────────────────────────────┐│
│  │ Zawodnik: [Maja Kowalska ▾]                      ││
│  │ Typ: [progress ▾]                                ││
│  │ Tekst: [Maja poprawia kontrolę forehandową___]   ││
│  │ Engagement: ★★★★★  Effort: ★★★★☆               ││
│  │                                    [+ Dodaj]     ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│           [Zapisz jako draft]  [✅ Zakończ zajęcia]  │
└─────────────────────────────────────────────────────┘
```

### Components:
- `CalendarGrid` — month view with activity type icons
- `ActivityList` — filtered list with status badges
- `ActivityCard` — activity summary with action buttons
- `CompletionForm` — attendance + notes + quick observation
- `AttendanceRow` — player with status dropdown
- `FocusAreaTags` — editable tag list
- `QuickObservation` — inline observation form

---

## Screen 4: Club / Group Dashboard

**URL**: `/club/dashboard`
**Users**: Club Owner, Club Admin
**Purpose**: Bird's eye view of the junior section — the screen that makes clubs buy.

```
┌─────────────────────────────────────────────────────┐
│  KT Arka — Panel Klubu                        ⚙️   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │    32         │ │    89%       │ │     3        │ │
│  │  Zawodników   │ │ Frekwencja   │ │ Do awansu    │ │
│  │  aktywnych    │ │  (ten mies.) │ │  na ścieżce  │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ │
│                                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │     5        │ │    12        │ │     2        │ │
│  │  Recenzji    │ │ Obserwacji   │ │ Uwaga!       │ │
│  │  (ten mies.) │ │  (ten tydz.) │ │  (3+ nieobec)│ │
│  └──────────────┘ └──────────────┘ └──────────────┘ │
│                                                      │
│  ── PATHWAY PIPELINE ──────────────────────────────  │
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ Tennis 10 Czerwony    ████████████████  12       ││
│  │ Tennis 10 Pomarańcz.  ████████████      8       ││
│  │ Tennis 10 Zielony     ██████            4       ││
│  │ Junior Początkujący   ████              3       ││
│  │ Junior Zaawansowany   ███               2       ││
│  │ Performance           ███               3       ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  ── GRUPY ─────────────────────────────────────────  │
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ 🎾 T10 Red Pon/Śr           8/10 zawodników     ││
│  │    Coach Tomek • Frekwencja: 92% • clay          ││
│  │    Ostatnia aktywność: 2 Apr                     ││
│  │                                                  ││
│  │ 🎾 T10 Orange Wto/Czw       5/8 zawodników      ││
│  │    Coach Anna • Frekwencja: 85% • hard           ││
│  │    Ostatnia aktywność: 1 Apr                     ││
│  │                                                  ││
│  │ 🟢 T10 Green Pon/Śr/Pt     4/6 zawodników       ││
│  │    Coach Marek • Frekwencja: 95% • clay          ││
│  │    Ostatnia aktywność: 2 Apr                     ││
│  │                                                  ││
│  │                          [Wszystkie grupy →]      ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  ── WYMAGAJĄ UWAGI ────────────────────────────────  │
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ ⚠️  Ola Wiśniewska — 3 nieobecności z rzędu     ││
│  │     T10 Red • ostatnia obecność: 19 Mar          ││
│  │                            [Kontakt] [Profil]    ││
│  │                                                  ││
│  │ ⚠️  Kuba Pawlak — brak obserwacji >2 tygodnie   ││
│  │     T10 Red • ostatnia obserwacja: 15 Mar        ││
│  │                            [Dodaj obs.] [Profil] ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  ── GOTOWI DO AWANSU ──────────────────────────────  │
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ 🚀 Maja Kowalska — Red → Orange                 ││
│  │    Rekomendacja: Coach Tomek (28 Mar)            ││
│  │                            [Awansuj] [Szczegóły] ││
│  │                                                  ││
│  │ 🚀 Filip Zieliński — Red → Orange               ││
│  │    Rekomendacja: Coach Tomek (25 Mar)            ││
│  │                            [Awansuj] [Szczegóły] ││
│  │                                                  ││
│  │ 🚀 Zosia Lewandowska — Orange → Green           ││
│  │    Rekomendacja: Coach Anna (20 Mar)             ││
│  │                            [Awansuj] [Szczegóły] ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  ── OSTATNIE RECENZJE ─────────────────────────────  │
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ 📋 Maja Kowalska — Marzec       Coach Tomek     ││
│  │ 📋 Jan Nowak — Marzec           Coach Tomek     ││
│  │ 📋 Zosia Lewandowska — Marzec   Coach Anna      ││
│  │                          [Wszystkie recenzje →]   ││
│  └──────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### Components:
- `StatCard` — metric card (number + label)
- `PathwayPipeline` — horizontal bar chart of players per stage
- `GroupCard` — group summary with coach, attendance, capacity
- `AttentionAlert` — player needing follow-up
- `AdvanceCard` — player ready for pathway advancement
- `RecentReviews` — list of published reviews

### Key metrics (computed from data):
- Active players count: `Player.find({ club, active: true }).count()`
- Attendance rate: from Activity.attendance this month
- Ready to advance: `Recommendation.find({ club, type: 'pathway-advance', status: 'pending' })`
- Attention needed: players with 3+ missed in last 4 weeks OR no observation in 2+ weeks
- Reviews this month: `ReviewSummary.find({ club, periodEnd: thisMonth, status: 'published' })`

---

## Screen 5: Review Summary View

**URL**: `/reviews/:id` (view) or `/reviews/new?player=X` (create)
**Users**: Coach (create/edit), Parent (view), Club Admin (view)
**Purpose**: The structured review that builds parent trust.

### 5A. Review Creation (Coach)

```
┌─────────────────────────────────────────────────────┐
│  Nowa recenzja — Maja Kowalska                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  OKRES                                               │
│  Typ: [Miesięczna ▾]                                │
│  Od: [1 Marca 2026]  Do: [31 Marca 2026]            │
│                                                      │
│  ── DANE Z SYSTEMU (auto) ─────────────────────────  │
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ 📊 Podsumowanie okresu                          ││
│  │                                                  ││
│  │ Aktywności: 8 zajęć, 1 mini-turniej             ││
│  │ Frekwencja: 8/8 (100%)                          ││
│  │ Obserwacje: 5 (3× progress, 1× highlight, 1× g)││
│  │ Cele aktywne: 2                                  ││
│  │   • Koordynacja ręka-oko — 60%                  ││
│  │   • Uchwyt rakiety — 30%                        ││
│  │ Engagement śr.: 4.8/5  Effort śr.: 4.2/5       ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  [🤖 Wygeneruj draft z AI]                           │
│                                                      │
│  ── TREŚĆ RECENZJI ────────────────────────────────  │
│                                                      │
│  CO SIĘ WYDARZYŁO                                    │
│  ┌──────────────────────────────────────────────────┐│
│  │ Maja uczestniczyła w 8 zajęciach Tennis 10 Red   ││
│  │ oraz w mini-turnieju wewnętrznym. Ćwiczyliśmy   ││
│  │ koordynację, piłkę forehandową i zabawę z       ││
│  │ rakietą. 100% frekwencja.                       ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  CO POSZŁO DOBRZE                                    │
│  ┌──────────────────────────────────────────────────┐│
│  │ Doskonała frekwencja i energia. Maja szybko      ││
│  │ łapie nowe ćwiczenia. Świetnie współpracuje     ││
│  │ z grupą i motywuje inne dzieci. Na mini-turnieju││
│  │ wygrała 2 z 3 meczy.                            ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  CO WYMAGA UWAGI                                     │
│  ┌──────────────────────────────────────────────────┐│
│  │ Uchwyt rakiety wymaga dalszej korekty — Maja    ││
│  │ wraca do uchwytu wschodnego przy mocniejszych   ││
│  │ uderzeniach. Praca nad zmianą kierunku ruchu    ││
│  │ na korcie.                                       ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  NASTĘPNE KROKI                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ Kontynuujemy w grupie Czerwonej. Dodajemy       ││
│  │ ćwiczenia na zmianę kierunku. Za 2-3 miesiące   ││
│  │ możliwa rozmowa o przejściu do Pomarańczowej.   ││
│  │ Proszę zachęcać Maję do trzymania prawidłowego  ││
│  │ uchwytu w domu.                                  ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  ── REKOMENDACJE ──────────────────────────────────  │
│                                                      │
│  [+ Dodaj rekomendację]                              │
│  ┌──────────────────────────────────────────────────┐│
│  │ ⚡ Dodać ćwiczenia na zmianę kierunku            ││
│  │    Typ: focus-change • Priorytet: medium         ││
│  │                                      [Usuń]     ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  Widoczna dla rodzica: [✅ Tak]                      │
│                                                      │
│      [Zapisz draft]  [👁 Podgląd]  [📤 Opublikuj]   │
└─────────────────────────────────────────────────────┘
```

### 5B. Review View (Parent)

```
┌─────────────────────────────────────────────────────┐
│  ← Timeline         Recenzja — Marzec 2026         │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────┐  Maja Kowalska                        │
│  │  Avatar  │  Tennis 10 Czerwony • KT Arka         │
│  └──────────┘  Coach: Tomek Wiśniewski              │
│                                                      │
│  Okres: 1-31 Marca 2026                              │
│  Opublikowano: 28 Marca 2026                         │
│                                                      │
│  ── 📊 PODSUMOWANIE ──────────────────────────────  │
│  │ Zajęcia: 8/8 (100% frekwencja)                   │
│  │ Engagement: ★★★★★  Effort: ★★★★☆               │
│  │ Mini-turniej: 2 wygrane / 1 porażka              │
│                                                      │
│  ── ✅ CO POSZŁO DOBRZE ──────────────────────────  │
│                                                      │
│  Doskonała frekwencja i energia. Maja szybko         │
│  łapie nowe ćwiczenia. Świetnie współpracuje        │
│  z grupą i motywuje inne dzieci. Na mini-turnieju   │
│  wygrała 2 z 3 meczy.                               │
│                                                      │
│  ── 🔍 CO WYMAGA UWAGI ──────────────────────────  │
│                                                      │
│  Uchwyt rakiety wymaga dalszej korekty — Maja       │
│  wraca do uchwytu wschodnego przy mocniejszych      │
│  uderzeniach. Praca nad zmianą kierunku ruchu       │
│  na korcie.                                          │
│                                                      │
│  ── ➡️ NASTĘPNE KROKI ────────────────────────────  │
│                                                      │
│  Kontynuujemy w grupie Czerwonej. Dodajemy          │
│  ćwiczenia na zmianę kierunku. Za 2-3 miesiące      │
│  możliwa rozmowa o przejściu do Pomarańczowej.      │
│  Proszę zachęcać Maję do trzymania prawidłowego     │
│  uchwytu w domu.                                     │
│                                                      │
│  ── 🎯 CELE ROZWOJOWE ────────────────────────────  │
│  │ Koordynacja ręka-oko          ████░░ 60%         │
│  │ Uchwyt rakiety — continental   ██░░░░ 30%        │
│                                                      │
│  ── ⚡ REKOMENDACJE ───────────────────────────────  │
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ Dodać ćwiczenia na zmianę kierunku               ││
│  │ Typ: focus-change • Priorytet: medium            ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│                               [💬 Napisz do trenera]│
└─────────────────────────────────────────────────────┘
```

### Components:
- `ReviewEditor` — structured form with 4 text areas + AI button
- `PeriodSummary` — auto-aggregated stats card
- `ReviewViewer` — published review with sections
- `GoalProgressInline` — goal with progress bar inline
- `RecommendationInline` — recommendation within review context
- `AIGenerateButton` — triggers draft generation from period data

---

## Navigation Structure

### Coach Navigation (sidebar)
```
🏠 Dashboard (→ /coach/dashboard)
👥 Grupy (→ /groups)
👤 Zawodnicy (→ /players)
📅 Aktywności (→ /activities)
📋 Recenzje (→ /reviews)
💬 Wiadomości (→ /messages)
⚙️ Ustawienia (→ /settings)
```

### Parent Navigation (sidebar)
```
🏠 Panel (→ /parent/dashboard)
👶 [Child Name] (→ /player/:id/journey)   ← for each child
📅 Kalendarz (→ /calendar)
📰 Timeline (→ /player/:id/timeline)
💬 Wiadomości (→ /messages)
⚙️ Ustawienia (→ /settings)
```

### Club Admin Navigation (sidebar)
```
🏠 Panel Klubu (→ /club/dashboard)
👥 Grupy (→ /groups)
👤 Zawodnicy (→ /players)
🏋️ Trenerzy (→ /coaches)
📅 Aktywności (→ /activities)
📋 Recenzje (→ /reviews)
📊 Statystyki (→ /club/stats)
⚙️ Ustawienia (→ /settings)
```

---

## Responsive Design Notes

- **Mobile first**: all screens must work on 375px width
- **Timeline**: single column, full width cards
- **Calendar**: week view on mobile, month on desktop
- **Dashboard stats**: 2-column grid on mobile, 3-column on desktop
- **Activity completion**: full-screen modal on mobile
- **Navigation**: bottom tab bar on mobile, sidebar on desktop
