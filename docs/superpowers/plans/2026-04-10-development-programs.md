# Development Programs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add federation-based training program system — coaches select a tennis federation (ITF, USTA, etc.), system auto-recommends training hours by age/gender, compares against actual plan.

**Architecture:** New `DevelopmentProgram` model with seed data for 8 federations. Player model extended with `federationProgram` subdocument. New controller/routes for program CRUD + comparison logic. Frontend: new "Program" tab on CoachPlayerProfile + recommendation bar on PlanTab. Stage transition notifications via existing alert system.

**Tech Stack:** Express.js, Mongoose, React, Zustand, Lucide icons, existing API patterns.

---

## File Structure

### Backend — New files
- `server/src/models/DevelopmentProgram.js` — Mongoose schema for federation programs
- `server/src/controllers/developmentProgramController.js` — Controller with 5 endpoints
- `server/src/routes/developmentPrograms.js` — Route definitions
- `server/src/scripts/seedDevelopmentPrograms.js` — Seed data for 8 federations (called from seed.js)

### Backend — Modified files
- `server/src/models/Player.js` — Add `federationProgram` subdocument
- `server/src/models/Notification.js` — Add `stage_transition` to type enum
- `server/src/index.js` — Register new route
- `server/src/scripts/seed.js` — Import and call program seeding, assign programs to demo players
- `server/src/jobs/index.js` — Register stage check job
- `server/src/jobs/stageChecker.js` — New job file for stage transition detection

### Frontend — New files
- `client/src/pages/coach/DevelopmentProgramTab.jsx` — Full program tab for coach player profile
- `client/src/components/player/PlanRecommendationBar.jsx` — Recommendation bar for plan editor
- `client/src/components/player/ComparisonCard.jsx` — Reusable comparison card (actual vs recommended)

### Frontend — Modified files
- `client/src/pages/coach/CoachPlayerProfile.jsx` — Add "Program" tab button + render DevelopmentProgramTab
- `client/src/pages/parent/training-plan/PlanTab.jsx` — Add PlanRecommendationBar at top
- `client/src/pages/parent/ChildProfile.jsx` — Add program info section

---

### Task 1: DevelopmentProgram Mongoose Model

**Files:**
- Create: `server/src/models/DevelopmentProgram.js`

- [ ] **Step 1: Create the model file**

```javascript
import mongoose from 'mongoose';

const stageSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    name: { type: String, required: true },
    namePl: { type: String, required: true },
    ageRange: {
      boys: {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
      },
      girls: {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
      },
    },
    recommendations: {
      totalHoursPerWeek: {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
      },
      onCourtHours: {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
      },
      physicalHours: {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
      },
      competitionHours: {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
      },
      restDaysPerWeek: { type: Number, required: true },
    },
    multiSportRecommended: { type: Boolean, default: false },
    focusAreas: [String],
    principles: { type: String, required: true },
    trainingDistribution: {
      onCourt: Number,
      physical: Number,
      competition: Number,
      mentalRecovery: Number,
    },
  },
  { _id: true }
);

const developmentProgramSchema = new mongoose.Schema(
  {
    federationCode: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    federationName: { type: String, required: true },
    fullName: { type: String, required: true },
    country: { type: String, required: true },
    countryFlag: { type: String, required: true },
    description: { type: String, required: true },
    stages: [stageSchema],
    genderNotes: String,
    source: String,
  },
  { timestamps: true }
);

developmentProgramSchema.index({ federationCode: 1 });

const DevelopmentProgram = mongoose.model('DevelopmentProgram', developmentProgramSchema);

export default DevelopmentProgram;
```

- [ ] **Step 2: Verify model loads**

Run: `cd /c/Users/Marcin/Desktop/serveiq && node -e "import('./server/src/models/DevelopmentProgram.js').then(m => console.log('OK:', Object.keys(m)))"`
Expected: `OK: [ 'default' ]`

- [ ] **Step 3: Commit**

```bash
git add server/src/models/DevelopmentProgram.js
git commit -m "feat: add DevelopmentProgram model for federation training programs"
```

---

### Task 2: Extend Player Model with federationProgram

**Files:**
- Modify: `server/src/models/Player.js:126` (after `trainingPlan` block)

- [ ] **Step 1: Add federationProgram field to Player schema**

In `server/src/models/Player.js`, after the `trainingPlan` block (line ~127, before `nextStep`), add:

```javascript
    federationProgram: {
      program: { type: mongoose.Schema.Types.ObjectId, ref: 'DevelopmentProgram' },
      currentStageCode: String,
      stageConfirmedAt: Date,
      stageConfirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      autoSuggestedStage: String,
      notes: String,
    },
```

- [ ] **Step 2: Commit**

```bash
git add server/src/models/Player.js
git commit -m "feat: add federationProgram field to Player model"
```

---

### Task 3: Add stage_transition to Notification type enum

**Files:**
- Modify: `server/src/models/Notification.js:13-22`

- [ ] **Step 1: Add stage_transition to the enum values array**

In `server/src/models/Notification.js`, add `'stage_transition'` to the `type` enum values array (after `'system'`).

- [ ] **Step 2: Commit**

```bash
git add server/src/models/Notification.js
git commit -m "feat: add stage_transition notification type"
```

---

### Task 4: Seed Data — 8 Federation Programs

**Files:**
- Create: `server/src/scripts/seedDevelopmentPrograms.js`

- [ ] **Step 1: Create the seed data file with all 8 federations**

Create `server/src/scripts/seedDevelopmentPrograms.js` with the following structure. This file exports a function that creates all 8 DevelopmentProgram documents:

```javascript
import DevelopmentProgram from '../models/DevelopmentProgram.js';

const programs = [
  {
    federationCode: 'itf',
    federationName: 'ITF',
    fullName: 'International Tennis Federation',
    country: 'Miedzynarodowa',
    countryFlag: '🌍',
    description: 'Globalny standard rozwoju tenisisty — bazowe wytyczne ITF stosowane na calym swiecie.',
    genderNotes: 'Dziewczeta wchodza w etapy dojrzewania wczesniej (10-13 vs 12-15 u chlopcow). Obciazenia fizyczne dostosowane do fazy wzrostu.',
    source: 'ITF Player Development Guidelines, ITF Global Tennis Report',
    stages: [
      {
        code: 'pre_tennis',
        name: 'Pre-Tennis / FUNdamentals',
        namePl: 'Pre-Tenis / Fundamenty',
        ageRange: { boys: { min: 4, max: 6 }, girls: { min: 4, max: 6 } },
        recommendations: {
          totalHoursPerWeek: { min: 2, max: 4 },
          onCourtHours: { min: 1, max: 2 },
          physicalHours: { min: 1, max: 2 },
          competitionHours: { min: 0, max: 0 },
          restDaysPerWeek: 3,
        },
        multiSportRecommended: true,
        focusAreas: ['Zwinnosc', 'Rownowaga', 'Koordynacja', 'Szybkosc', 'Zabawa'],
        principles: 'Rozwoj ABCs (Agility, Balance, Coordination, Speed). Wielosportowość. Zabawa jest najwazniejsza.',
        trainingDistribution: { onCourt: 40, physical: 50, competition: 0, mentalRecovery: 10 },
      },
      {
        code: 'mini_tennis',
        name: 'Mini Tennis (Red/Orange/Green)',
        namePl: 'Mini Tenis (Czerwony/Pomarancz/Zielony)',
        ageRange: { boys: { min: 6, max: 9 }, girls: { min: 6, max: 9 } },
        recommendations: {
          totalHoursPerWeek: { min: 4, max: 6 },
          onCourtHours: { min: 3, max: 4 },
          physicalHours: { min: 1, max: 2 },
          competitionHours: { min: 0, max: 1 },
          restDaysPerWeek: 2,
        },
        multiSportRecommended: true,
        focusAreas: ['Zmodyfikowany sprzet', 'Podstawy techniczne', 'Gra oparta na zabawie'],
        principles: 'Zmodyfikowane korty, pilki, rakiety (Tennis 10s). Fundamenty techniczne. 70-80% cwiczen oparte na grze.',
        trainingDistribution: { onCourt: 60, physical: 20, competition: 10, mentalRecovery: 10 },
      },
      {
        code: 'learn_to_train',
        name: 'Learn to Train',
        namePl: 'Naucz sie Trenowac',
        ageRange: { boys: { min: 9, max: 12 }, girls: { min: 8, max: 11 } },
        recommendations: {
          totalHoursPerWeek: { min: 8, max: 12 },
          onCourtHours: { min: 5, max: 8 },
          physicalHours: { min: 2, max: 4 },
          competitionHours: { min: 1, max: 2 },
          restDaysPerWeek: 2,
        },
        multiSportRecommended: true,
        focusAreas: ['Zloty wiek motoryki', 'Szerokie podstawy techniczne', 'Wprowadzenie do rywalizacji'],
        principles: 'Zloty wiek uczenia motorycznego — szczytowa zdolnosc przyswajania umiejetnosci. Szerokie podstawy techniczne. Wprowadzenie do mentalnosci zawodniczej. Nadal wielosportowosc.',
        trainingDistribution: { onCourt: 60, physical: 20, competition: 15, mentalRecovery: 5 },
      },
      {
        code: 'train_to_train',
        name: 'Train to Train',
        namePl: 'Trenuj, by Trenowac',
        ageRange: { boys: { min: 12, max: 16 }, girls: { min: 11, max: 15 } },
        recommendations: {
          totalHoursPerWeek: { min: 12, max: 18 },
          onCourtHours: { min: 8, max: 12 },
          physicalHours: { min: 4, max: 6 },
          competitionHours: { min: 2, max: 4 },
          restDaysPerWeek: 1,
        },
        multiSportRecommended: false,
        focusAreas: ['Adaptacje treningowe', 'Zarzadzanie dojrzewaniem', 'Doskonalenie techniki', 'Swiadomosc taktyczna'],
        principles: 'Glowne adaptacje treningowe. Zarzadzanie okresem dojrzewania. Specjalizacja zaczyna sie, ale nie wylaczna. Doskonalenie techniki i swiadomosc taktyczna.',
        trainingDistribution: { onCourt: 55, physical: 25, competition: 15, mentalRecovery: 5 },
      },
      {
        code: 'train_to_compete',
        name: 'Train to Compete',
        namePl: 'Trenuj, by Rywalizowac',
        ageRange: { boys: { min: 16, max: 18 }, girls: { min: 15, max: 17 } },
        recommendations: {
          totalHoursPerWeek: { min: 18, max: 25 },
          onCourtHours: { min: 10, max: 14 },
          physicalHours: { min: 5, max: 8 },
          competitionHours: { min: 3, max: 5 },
          restDaysPerWeek: 1,
        },
        multiSportRecommended: false,
        focusAreas: ['Tenis jako sport glowny', 'Periodyzacja', 'Kalendarz turniejowy', 'Trening mentalny'],
        principles: 'Tenis staje sie sportem glownym. Wysoki wolumen treningowy. Kalendarz turniejowy napedza periodyzacje.',
        trainingDistribution: { onCourt: 50, physical: 25, competition: 18, mentalRecovery: 7 },
      },
      {
        code: 'train_to_win',
        name: 'Train to Win',
        namePl: 'Trenuj, by Wygrywac',
        ageRange: { boys: { min: 18, max: 25 }, girls: { min: 17, max: 25 } },
        recommendations: {
          totalHoursPerWeek: { min: 25, max: 30 },
          onCourtHours: { min: 12, max: 16 },
          physicalHours: { min: 6, max: 10 },
          competitionHours: { min: 5, max: 8 },
          restDaysPerWeek: 1,
        },
        multiSportRecommended: false,
        focusAreas: ['Pelne przygotowanie profesjonalne', 'Indywidualizacja', 'Sztab trenerski'],
        principles: 'Pelne przygotowanie profesjonalne. Programy w pelni zindywidualizowane.',
        trainingDistribution: { onCourt: 45, physical: 25, competition: 20, mentalRecovery: 10 },
      },
    ],
  },
  {
    federationCode: 'usta',
    federationName: 'USTA',
    fullName: 'United States Tennis Association',
    country: 'USA',
    countryFlag: '🇺🇸',
    description: 'American Development Model — nacisk na wielosportowosc do 12 r.z., procesowe cele, sciezka college/pro.',
    genderNotes: 'USTA monitoruje obciazenie wzgledem dojrzewania (PHV). Dla dziewczat dodatkowy nacisk na profilaktyke ACL i zywienie w okresie dojrzewania.',
    source: 'USTA American Development Model, Player Development Competitive Pathway',
    stages: [
      {
        code: 'discover_learn',
        name: 'Discover & Learn',
        namePl: 'Odkrywaj i Ucz sie',
        ageRange: { boys: { min: 5, max: 8 }, girls: { min: 5, max: 8 } },
        recommendations: {
          totalHoursPerWeek: { min: 2, max: 5 },
          onCourtHours: { min: 2, max: 3 },
          physicalHours: { min: 1, max: 2 },
          competitionHours: { min: 0, max: 0 },
          restDaysPerWeek: 3,
        },
        multiSportRecommended: true,
        focusAreas: ['Zabawa', 'Red ball', 'Kort 36 stop', '3+ sporty'],
        principles: 'Brak rankingu i trofeow. Zabawa na pierwszym miejscu. 3+ sporty obowiazkowe. Red ball na korcie 36 stop.',
        trainingDistribution: { onCourt: 50, physical: 40, competition: 0, mentalRecovery: 10 },
      },
      {
        code: 'explore_build',
        name: 'Explore & Build',
        namePl: 'Eksploruj i Buduj',
        ageRange: { boys: { min: 8, max: 10 }, girls: { min: 8, max: 10 } },
        recommendations: {
          totalHoursPerWeek: { min: 5, max: 8 },
          onCourtHours: { min: 4, max: 6 },
          physicalHours: { min: 1, max: 2 },
          competitionHours: { min: 0, max: 1 },
          restDaysPerWeek: 2,
        },
        multiSportRecommended: true,
        focusAreas: ['Orange ball', 'Kort 60 stop', 'Zrozumienie punktacji', 'Wysilek > wynik'],
        principles: 'Orange ball na korcie 60 stop. Poczatek zrozumienia punktacji. Wygrywanie mierzone wysilkiem, nie wynikami.',
        trainingDistribution: { onCourt: 65, physical: 20, competition: 10, mentalRecovery: 5 },
      },
      {
        code: 'learn_to_compete',
        name: 'Learn to Compete',
        namePl: 'Naucz sie Rywalizowac',
        ageRange: { boys: { min: 10, max: 12 }, girls: { min: 10, max: 12 } },
        recommendations: {
          totalHoursPerWeek: { min: 8, max: 14 },
          onCourtHours: { min: 6, max: 10 },
          physicalHours: { min: 2, max: 4 },
          competitionHours: { min: 1, max: 2 },
          restDaysPerWeek: 2,
        },
        multiSportRecommended: true,
        focusAreas: ['Pelny kort', 'Rozwoj taktyczny', 'Cele procesowe', 'Turniejowy start'],
        principles: 'Przejscie na pelny kort. Rozwoj taktyczny. Cele procesowe, nie wynikowe.',
        trainingDistribution: { onCourt: 60, physical: 20, competition: 15, mentalRecovery: 5 },
      },
      {
        code: 'train_to_compete',
        name: 'Train to Compete',
        namePl: 'Trenuj, by Rywalizowac',
        ageRange: { boys: { min: 12, max: 15 }, girls: { min: 12, max: 15 } },
        recommendations: {
          totalHoursPerWeek: { min: 14, max: 20 },
          onCourtHours: { min: 9, max: 14 },
          physicalHours: { min: 4, max: 6 },
          competitionHours: { min: 2, max: 4 },
          restDaysPerWeek: 1,
        },
        multiSportRecommended: false,
        focusAreas: ['Krytyczne okno rozwoju', 'Max 70% czasu w jednym sporcie do 14-15 lat'],
        principles: 'Krytyczne okno rozwoju. USTA zaleca max 70% czasu w jednym sporcie do 14-15 lat.',
        trainingDistribution: { onCourt: 55, physical: 25, competition: 15, mentalRecovery: 5 },
      },
      {
        code: 'compete_to_win',
        name: 'Compete to Win',
        namePl: 'Rywalizuj, by Wygrywac',
        ageRange: { boys: { min: 15, max: 18 }, girls: { min: 15, max: 18 } },
        recommendations: {
          totalHoursPerWeek: { min: 20, max: 28 },
          onCourtHours: { min: 12, max: 16 },
          physicalHours: { min: 5, max: 8 },
          competitionHours: { min: 3, max: 5 },
          restDaysPerWeek: 1,
        },
        multiSportRecommended: false,
        focusAreas: ['Specjalizacja', 'Sciezka high-performance', 'Periodyzacja', 'College pathway'],
        principles: 'Specjalizacja odpowiednia. Sciezka high-performance center (regionalne/krajowe centra). Rozwazona sciezka college.',
        trainingDistribution: { onCourt: 50, physical: 25, competition: 18, mentalRecovery: 7 },
      },
      {
        code: 'pro_transition',
        name: 'Win / Pro Transition',
        namePl: 'Wygrywaj / Tranzycja Pro',
        ageRange: { boys: { min: 18, max: 25 }, girls: { min: 18, max: 25 } },
        recommendations: {
          totalHoursPerWeek: { min: 25, max: 35 },
          onCourtHours: { min: 14, max: 18 },
          physicalHours: { min: 6, max: 10 },
          competitionHours: { min: 5, max: 8 },
          restDaysPerWeek: 1,
        },
        multiSportRecommended: false,
        focusAreas: ['Przygotowanie profesjonalne', 'Bloki turniejowe', 'Periodyzacja zaawansowana'],
        principles: 'Pelne przygotowanie profesjonalne. Bloki turniejowe planowane rocznym kalendarzem.',
        trainingDistribution: { onCourt: 45, physical: 25, competition: 20, mentalRecovery: 10 },
      },
    ],
  },
  {
    federationCode: 'tennis_canada',
    federationName: 'Tennis Canada',
    fullName: 'Tennis Canada',
    country: 'Kanada',
    countryFlag: '🇨🇦',
    description: 'Long-Term Player Development (LTPD) — najbardziej szczegolowy framework, oparty na modelu CS4L Istvana Balyi.',
    genderNotes: 'Dziewczeta wchodza w kazdy etap ok. 1 rok wczesniej. Etap Train to Train szczegolnie krytyczny dla dziewczat — baza tlenowa musi byc zbudowana w oknie 11-15 lat. Wyzsze ryzyko rezygnacji u dziewczat 12-14 lat.',
    source: 'Tennis Canada LTPD Framework, CS4L',
    stages: [
      {
        code: 'active_start',
        name: 'Active Start',
        namePl: 'Aktywny Start',
        ageRange: { boys: { min: 0, max: 6 }, girls: { min: 0, max: 6 } },
        recommendations: {
          totalHoursPerWeek: { min: 1, max: 2 },
          onCourtHours: { min: 1, max: 1 },
          physicalHours: { min: 0, max: 1 },
          competitionHours: { min: 0, max: 0 },
          restDaysPerWeek: 4,
        },
        multiSportRecommended: true,
        focusAreas: ['Zabawa ruchowa', 'Integracja przez gre'],
        principles: 'Zabawa ruchowa w zintegrowanej formie. Brak formalnego treningu.',
        trainingDistribution: { onCourt: 50, physical: 50, competition: 0, mentalRecovery: 0 },
      },
      {
        code: 'fundamentals',
        name: 'FUNdamentals',
        namePl: 'FUNdamenty',
        ageRange: { boys: { min: 6, max: 9 }, girls: { min: 6, max: 8 } },
        recommendations: {
          totalHoursPerWeek: { min: 3, max: 6 },
          onCourtHours: { min: 2, max: 4 },
          physicalHours: { min: 1, max: 2 },
          competitionHours: { min: 0, max: 0 },
          restDaysPerWeek: 3,
        },
        multiSportRecommended: true,
        focusAreas: ['Sprawnosc fizyczna', 'ABCs', 'Tenis 1 z 3-4 sportow', 'Zmodyfikowany sprzet'],
        principles: 'Sprawnosc fizyczna jest celem. Tenis jednym z 3-4 sportow. ABCs. Zmodyfikowany sprzet obowiazkowy.',
        trainingDistribution: { onCourt: 55, physical: 30, competition: 5, mentalRecovery: 10 },
      },
      {
        code: 'learn_to_train',
        name: 'Learn to Train',
        namePl: 'Naucz sie Trenowac',
        ageRange: { boys: { min: 9, max: 12 }, girls: { min: 8, max: 11 } },
        recommendations: {
          totalHoursPerWeek: { min: 8, max: 12 },
          onCourtHours: { min: 5, max: 8 },
          physicalHours: { min: 2, max: 4 },
          competitionHours: { min: 1, max: 2 },
          restDaysPerWeek: 2,
        },
        multiSportRecommended: true,
        focusAreas: ['Zloty wiek motoryczny', 'Priorytet techniczny', 'Budowa uderzen', 'Sampling sportow'],
        principles: 'Zloty wiek uczenia motorycznego. Umiejetnosci techniczne sa priorytetem. Budowa wszystkich uderzen. Sampling wielosportowy.',
        trainingDistribution: { onCourt: 60, physical: 20, competition: 15, mentalRecovery: 5 },
      },
      {
        code: 'train_to_train',
        name: 'Train to Train',
        namePl: 'Trenuj, by Trenowac',
        ageRange: { boys: { min: 12, max: 16 }, girls: { min: 11, max: 15 } },
        recommendations: {
          totalHoursPerWeek: { min: 12, max: 20 },
          onCourtHours: { min: 8, max: 14 },
          physicalHours: { min: 4, max: 6 },
          competitionHours: { min: 2, max: 4 },
          restDaysPerWeek: 1,
        },
        multiSportRecommended: false,
        focusAreas: ['Etap make or break', 'Baza tlenowa', 'Monitoring dojrzewania', 'Periodyzacja'],
        principles: 'Etap "make or break". Budowanie bazy tlenowej. Monitoring wzrostu i dojrzewania krytyczny. Wprowadzenie periodyzacji.',
        trainingDistribution: { onCourt: 55, physical: 25, competition: 15, mentalRecovery: 5 },
      },
      {
        code: 'train_to_compete',
        name: 'Train to Compete',
        namePl: 'Trenuj, by Rywalizowac',
        ageRange: { boys: { min: 16, max: 18 }, girls: { min: 15, max: 17 } },
        recommendations: {
          totalHoursPerWeek: { min: 20, max: 28 },
          onCourtHours: { min: 12, max: 16 },
          physicalHours: { min: 5, max: 8 },
          competitionHours: { min: 3, max: 5 },
          restDaysPerWeek: 1,
        },
        multiSportRecommended: false,
        focusAreas: ['Tenis caloroczny', 'Pelna periodyzacja', 'Trening mentalny', 'Kalendarz turniejowy'],
        principles: 'Tenis caloroczny. Pelna periodyzacja. Trening umiejetnosci mentalnych sformalizowany. Planowanie kalendarza turniejowego.',
        trainingDistribution: { onCourt: 50, physical: 25, competition: 18, mentalRecovery: 7 },
      },
      {
        code: 'train_to_win',
        name: 'Train to Win',
        namePl: 'Trenuj, by Wygrywac',
        ageRange: { boys: { min: 18, max: 25 }, girls: { min: 17, max: 25 } },
        recommendations: {
          totalHoursPerWeek: { min: 25, max: 35 },
          onCourtHours: { min: 14, max: 18 },
          physicalHours: { min: 6, max: 10 },
          competitionHours: { min: 5, max: 8 },
          restDaysPerWeek: 1,
        },
        multiSportRecommended: false,
        focusAreas: ['Pelen indywidualizm', 'Rywalizacja miedzynarodowa', 'Sztab szkoleniowy'],
        principles: 'Pelna indywidualizacja. Rywalizacja miedzynarodowa. Zespol wspierajacy (trener, fizjo, mentalista, dietetyk).',
        trainingDistribution: { onCourt: 45, physical: 25, competition: 20, mentalRecovery: 10 },
      },
    ],
  },
  {
    federationCode: 'tennis_australia',
    federationName: 'Tennis Australia',
    fullName: 'Tennis Australia',
    country: 'Australia',
    countryFlag: '🇦🇺',
    description: 'Hot Shots → Elite pathway — silny program mlodziezowy z wczesnym wlaczeniem do gier meczowych.',
    genderNotes: 'Podobne rekomendacje godzinowe dla obu plci. Specjalny nacisk na badanie RED-S u zawodniczek.',
    source: 'Tennis Australia Hot Shots Program, National Development Squad Pathway',
    stages: [
      {
        code: 'hot_shots_blue_red',
        name: 'Hot Shots (Blue/Red)',
        namePl: 'Hot Shots (Niebieski/Czerwony)',
        ageRange: { boys: { min: 3, max: 7 }, girls: { min: 3, max: 7 } },
        recommendations: {
          totalHoursPerWeek: { min: 1, max: 3 },
          onCourtHours: { min: 1, max: 2 },
          physicalHours: { min: 0, max: 1 },
          competitionHours: { min: 0, max: 0 },
          restDaysPerWeek: 3,
        },
        multiSportRecommended: true,
        focusAreas: ['3+ sporty', 'Uczenie przez gre', 'Play and Stay'],
        principles: 'Progresywny system pilek/kortow. Nauka przez gre. Filozofia Play and Stay.',
        trainingDistribution: { onCourt: 55, physical: 35, competition: 0, mentalRecovery: 10 },
      },
      {
        code: 'hot_shots_orange_green',
        name: 'Hot Shots (Orange/Green)',
        namePl: 'Hot Shots (Pomaranczowy/Zielony)',
        ageRange: { boys: { min: 7, max: 10 }, girls: { min: 7, max: 10 } },
        recommendations: {
          totalHoursPerWeek: { min: 4, max: 8 },
          onCourtHours: { min: 3, max: 6 },
          physicalHours: { min: 1, max: 2 },
          competitionHours: { min: 0, max: 1 },
          restDaysPerWeek: 2,
        },
        multiSportRecommended: true,
        focusAreas: ['Gry zmodyfikowane', 'Podstawy meczowe', '2-3 sporty'],
        principles: 'Progresywna modyfikacja sprzetu. Gra zmodyfikowana. 2-3 sporty uzupelniajace.',
        trainingDistribution: { onCourt: 60, physical: 20, competition: 10, mentalRecovery: 10 },
      },
      {
        code: 'foundation',
        name: 'Foundation',
        namePl: 'Fundament',
        ageRange: { boys: { min: 10, max: 13 }, girls: { min: 10, max: 13 } },
        recommendations: {
          totalHoursPerWeek: { min: 10, max: 15 },
          onCourtHours: { min: 7, max: 10 },
          physicalHours: { min: 3, max: 5 },
          competitionHours: { min: 1, max: 3 },
          restDaysPerWeek: 2,
        },
        multiSportRecommended: true,
        focusAreas: ['Doskonalosc techniczna', 'Warunki meczowe', 'Struktura zawodow'],
        principles: 'Doskonalosc techniczna w warunkach meczowych. Wprowadzenie do struktury zawodow.',
        trainingDistribution: { onCourt: 55, physical: 25, competition: 15, mentalRecovery: 5 },
      },
      {
        code: 'talent',
        name: 'Talent',
        namePl: 'Talent',
        ageRange: { boys: { min: 13, max: 16 }, girls: { min: 13, max: 16 } },
        recommendations: {
          totalHoursPerWeek: { min: 15, max: 22 },
          onCourtHours: { min: 10, max: 14 },
          physicalHours: { min: 4, max: 6 },
          competitionHours: { min: 2, max: 4 },
          restDaysPerWeek: 1,
        },
        multiSportRecommended: false,
        focusAreas: ['Akademie stanowe/krajowe', 'Periodyzacja', 'Ekspozycja miedzynarodowa'],
        principles: 'Zidentyfikowani zawodnicy wchodza do akademii. Periodyzacja. Poczatek ekspozycji miedzynarodowej.',
        trainingDistribution: { onCourt: 55, physical: 25, competition: 15, mentalRecovery: 5 },
      },
      {
        code: 'elite',
        name: 'Elite',
        namePl: 'Elita',
        ageRange: { boys: { min: 16, max: 18 }, girls: { min: 16, max: 18 } },
        recommendations: {
          totalHoursPerWeek: { min: 22, max: 30 },
          onCourtHours: { min: 14, max: 18 },
          physicalHours: { min: 6, max: 8 },
          competitionHours: { min: 3, max: 5 },
          restDaysPerWeek: 1,
        },
        multiSportRecommended: false,
        focusAreas: ['Akademia Narodowa', 'Pelny etat', 'Edukacja zintegrowana'],
        principles: 'Akademia Narodowa. Srodowisko treningowe na pelny etat. Edukacja zintegrowana.',
        trainingDistribution: { onCourt: 50, physical: 25, competition: 18, mentalRecovery: 7 },
      },
      {
        code: 'professional',
        name: 'Professional',
        namePl: 'Profesjonalista',
        ageRange: { boys: { min: 18, max: 25 }, girls: { min: 18, max: 25 } },
        recommendations: {
          totalHoursPerWeek: { min: 28, max: 35 },
          onCourtHours: { min: 15, max: 20 },
          physicalHours: { min: 8, max: 10 },
          competitionHours: { min: 5, max: 8 },
          restDaysPerWeek: 1,
        },
        multiSportRecommended: false,
        focusAreas: ['Wsparcie tranzycyjne', 'Planowanie tury', 'Wildcards'],
        principles: 'Program wsparcia tranzycyjnego. Planowanie tury. Wildcards do Australian Open.',
        trainingDistribution: { onCourt: 45, physical: 25, competition: 20, mentalRecovery: 10 },
      },
    ],
  },
  {
    federationCode: 'fft',
    federationName: 'FFT',
    fullName: 'Federation Francaise de Tennis',
    country: 'Francja',
    countryFlag: '🇫🇷',
    description: 'System formation — oparty na klubach, wczesna klasyfikacja, sciezka Pole France do centrum Roland Garros.',
    genderNotes: 'Ta sama sciezka strukturalna dla chlopcow i dziewczat. Program retencji dziewczat "Toutes en Jeu".',
    source: 'FFT Formation Structure, Pole France Pathway',
    stages: [
      {
        code: 'mini_tennis',
        name: 'Mini Tennis',
        namePl: 'Mini Tenis',
        ageRange: { boys: { min: 4, max: 6 }, girls: { min: 4, max: 6 } },
        recommendations: {
          totalHoursPerWeek: { min: 2, max: 3 },
          onCourtHours: { min: 1, max: 2 },
          physicalHours: { min: 1, max: 1 },
          competitionHours: { min: 0, max: 0 },
          restDaysPerWeek: 3,
        },
        multiSportRecommended: true,
        focusAreas: ['Klub', 'Zabawa', 'Plateau events'],
        principles: 'Baza klubowa. Zabawa. Imprezy "plateau" bez rankingu.',
        trainingDistribution: { onCourt: 50, physical: 40, competition: 0, mentalRecovery: 10 },
      },
      {
        code: 'club_formation',
        name: 'Club Formation',
        namePl: 'Formacja Klubowa',
        ageRange: { boys: { min: 6, max: 10 }, girls: { min: 6, max: 10 } },
        recommendations: {
          totalHoursPerWeek: { min: 4, max: 8 },
          onCourtHours: { min: 3, max: 6 },
          physicalHours: { min: 1, max: 2 },
          competitionHours: { min: 0, max: 1 },
          restDaysPerWeek: 2,
        },
        multiSportRecommended: true,
        focusAreas: ['Trening klubowy', 'Poczatek classement (~8 lat)', 'Zawody departamentalne'],
        principles: 'Trening w klubie. Poczatek systemu klasyfikacji (classement) od ok. 8 lat.',
        trainingDistribution: { onCourt: 60, physical: 20, competition: 10, mentalRecovery: 10 },
      },
      {
        code: 'departmental',
        name: 'Departmental Training',
        namePl: 'Trening Departamentalny',
        ageRange: { boys: { min: 10, max: 12 }, girls: { min: 10, max: 12 } },
        recommendations: {
          totalHoursPerWeek: { min: 8, max: 14 },
          onCourtHours: { min: 6, max: 10 },
          physicalHours: { min: 2, max: 4 },
          competitionHours: { min: 1, max: 2 },
          restDaysPerWeek: 2,
        },
        multiSportRecommended: true,
        focusAreas: ['Selekcja do centrow', 'Zawody regionalne', 'Rozwoj techniczny'],
        principles: 'Selekcja do centrow treningowych. Zawody departamentalne/regionalne.',
        trainingDistribution: { onCourt: 60, physical: 20, competition: 15, mentalRecovery: 5 },
      },
      {
        code: 'pole_regional',
        name: 'Pole France / Regional',
        namePl: 'Pole France / Regionalny',
        ageRange: { boys: { min: 12, max: 15 }, girls: { min: 12, max: 15 } },
        recommendations: {
          totalHoursPerWeek: { min: 15, max: 22 },
          onCourtHours: { min: 10, max: 14 },
          physicalHours: { min: 4, max: 6 },
          competitionHours: { min: 2, max: 4 },
          restDaysPerWeek: 1,
        },
        multiSportRecommended: false,
        focusAreas: ['Sport-etudes', 'Szkolenie rano / trening po poludniu', 'Zawody krajowe/europejskie'],
        principles: 'Program sport-etudes: szkola rano, trening po poludniu. Zawody krajowe i europejskie.',
        trainingDistribution: { onCourt: 55, physical: 25, competition: 15, mentalRecovery: 5 },
      },
      {
        code: 'pole_national',
        name: 'Pole France National',
        namePl: 'Pole France Krajowy',
        ageRange: { boys: { min: 15, max: 18 }, girls: { min: 15, max: 18 } },
        recommendations: {
          totalHoursPerWeek: { min: 22, max: 30 },
          onCourtHours: { min: 14, max: 18 },
          physicalHours: { min: 6, max: 8 },
          competitionHours: { min: 3, max: 5 },
          restDaysPerWeek: 1,
        },
        multiSportRecommended: false,
        focusAreas: ['CNE Roland Garros', '~30 chlopcow + 30 dziewczat', 'Rywalizacja miedzynarodowa'],
        principles: 'Centre National d\'Entrainement przy Roland Garros. Ok. 30 chlopcow i 30 dziewczat.',
        trainingDistribution: { onCourt: 50, physical: 25, competition: 18, mentalRecovery: 7 },
      },
      {
        code: 'pro_pathway',
        name: 'Pro Pathway',
        namePl: 'Sciezka Profesjonalna',
        ageRange: { boys: { min: 18, max: 25 }, girls: { min: 18, max: 25 } },
        recommendations: {
          totalHoursPerWeek: { min: 30, max: 35 },
          onCourtHours: { min: 16, max: 20 },
          physicalHours: { min: 8, max: 10 },
          competitionHours: { min: 5, max: 8 },
          restDaysPerWeek: 1,
        },
        multiSportRecommended: false,
        focusAreas: ['Sztab FFT', 'Pelen profesjonalizm', 'Technika w sluzbie gry'],
        principles: 'Pelny profesjonalizm. Filozofia "la technique au service du jeu" — technika w sluzbie gry.',
        trainingDistribution: { onCourt: 45, physical: 25, competition: 20, mentalRecovery: 10 },
      },
    ],
  },
  {
    federationCode: 'lta',
    federationName: 'LTA',
    fullName: 'Lawn Tennis Association',
    country: 'Wielka Brytania',
    countryFlag: '🇬🇧',
    description: 'Tennis Opened Up — nacisk na dostepnosc i uczestnictwo przed wynikami, centra RPDC w calym UK.',
    genderNotes: 'Program "She Rallies" dla retencji dziewczat. Nacisk na wspierajace srodowisko w etapie Commit & Develop.',
    source: 'LTA Player Pathway, Tennis Opened Up Framework',
    stages: [
      {
        code: 'start_enjoy',
        name: 'Start & Enjoy',
        namePl: 'Zacznij i Ciesz sie',
        ageRange: { boys: { min: 4, max: 7 }, girls: { min: 4, max: 7 } },
        recommendations: {
          totalHoursPerWeek: { min: 1, max: 3 },
          onCourtHours: { min: 1, max: 2 },
          physicalHours: { min: 0, max: 1 },
          competitionHours: { min: 0, max: 0 },
          restDaysPerWeek: 3,
        },
        multiSportRecommended: true,
        focusAreas: ['Red ball', 'Zabawa', 'Brak formalnych wynikow'],
        principles: 'Zabawa na korcie. Red ball. Brak formalnych zawodow i wynikow.',
        trainingDistribution: { onCourt: 55, physical: 35, competition: 0, mentalRecovery: 10 },
      },
      {
        code: 'explore_build',
        name: 'Explore & Build',
        namePl: 'Eksploruj i Buduj',
        ageRange: { boys: { min: 7, max: 9 }, girls: { min: 7, max: 9 } },
        recommendations: {
          totalHoursPerWeek: { min: 3, max: 6 },
          onCourtHours: { min: 2, max: 4 },
          physicalHours: { min: 1, max: 2 },
          competitionHours: { min: 0, max: 1 },
          restDaysPerWeek: 2,
        },
        multiSportRecommended: true,
        focusAreas: ['Orange ball', 'Fun Competitions', 'Eksploracja'],
        principles: 'Orange ball. Zabawa w zawodach. Eksploracja roznych aspektow gry.',
        trainingDistribution: { onCourt: 55, physical: 25, competition: 10, mentalRecovery: 10 },
      },
      {
        code: 'commit_develop',
        name: 'Commit & Develop',
        namePl: 'Zaangazuj sie i Rozwijaj',
        ageRange: { boys: { min: 9, max: 12 }, girls: { min: 9, max: 12 } },
        recommendations: {
          totalHoursPerWeek: { min: 8, max: 14 },
          onCourtHours: { min: 6, max: 10 },
          physicalHours: { min: 2, max: 4 },
          competitionHours: { min: 1, max: 2 },
          restDaysPerWeek: 2,
        },
        multiSportRecommended: true,
        focusAreas: ['Green/Yellow ball', 'Zawody County/Regional', 'Rozwoj techniki'],
        principles: 'Przejscie na green/yellow ball. Zawody County i Regional (~20% czasu).',
        trainingDistribution: { onCourt: 60, physical: 20, competition: 15, mentalRecovery: 5 },
      },
      {
        code: 'challenge_compete',
        name: 'Challenge & Compete',
        namePl: 'Wyzwanie i Rywalizacja',
        ageRange: { boys: { min: 12, max: 15 }, girls: { min: 12, max: 15 } },
        recommendations: {
          totalHoursPerWeek: { min: 14, max: 22 },
          onCourtHours: { min: 10, max: 14 },
          physicalHours: { min: 4, max: 6 },
          competitionHours: { min: 2, max: 4 },
          restDaysPerWeek: 1,
        },
        multiSportRecommended: false,
        focusAreas: ['Zawody krajowe', 'RPDC', 'Rozwoj fizyczny'],
        principles: 'Zawody krajowe (~25% czasu). Regional Player Development Centres.',
        trainingDistribution: { onCourt: 55, physical: 25, competition: 15, mentalRecovery: 5 },
      },
      {
        code: 'excel_win',
        name: 'Excel & Win',
        namePl: 'Osiagnij i Wygrywaj',
        ageRange: { boys: { min: 15, max: 18 }, girls: { min: 15, max: 18 } },
        recommendations: {
          totalHoursPerWeek: { min: 22, max: 30 },
          onCourtHours: { min: 14, max: 18 },
          physicalHours: { min: 6, max: 8 },
          competitionHours: { min: 3, max: 5 },
          restDaysPerWeek: 1,
        },
        multiSportRecommended: false,
        focusAreas: ['Rywalizacja miedzynarodowa', 'NTC Roehampton', 'Partnerstwa uczelni'],
        principles: 'Rywalizacja miedzynarodowa (~30% czasu). National Tennis Centre. Partnerstwa z uczelniami.',
        trainingDistribution: { onCourt: 50, physical: 25, competition: 18, mentalRecovery: 7 },
      },
      {
        code: 'elite_performance',
        name: 'Elite Performance',
        namePl: 'Elitarny Wynik',
        ageRange: { boys: { min: 18, max: 25 }, girls: { min: 18, max: 25 } },
        recommendations: {
          totalHoursPerWeek: { min: 28, max: 35 },
          onCourtHours: { min: 16, max: 20 },
          physicalHours: { min: 8, max: 10 },
          competitionHours: { min: 5, max: 8 },
          restDaysPerWeek: 1,
        },
        multiSportRecommended: false,
        focusAreas: ['Tour', 'Pelny profesjonalizm'],
        principles: 'Pelny profesjonalizm. Indywidualny sztab szkoleniowy.',
        trainingDistribution: { onCourt: 45, physical: 25, competition: 20, mentalRecovery: 10 },
      },
    ],
  },
  {
    federationCode: 'dtb',
    federationName: 'DTB',
    fullName: 'Deutscher Tennis Bund',
    country: 'Niemcy',
    countryFlag: '🇩🇪',
    description: 'Silny system ligowy (Mannschaft), Bundesleistungszentren, Talentinos — nacisk na przygotowanie atletyczne.',
    genderNotes: 'Podobne rekomendacje godzinowe. Potencjalnie wyzszy wspolczynnik treningu fizycznego niz inne federacje.',
    source: 'DTB Talentinos Program, Bundesleistungszentren Guidelines',
    stages: [
      {
        code: 'grundlagentraining',
        name: 'Grundlagentraining',
        namePl: 'Trening Podstaw',
        ageRange: { boys: { min: 6, max: 9 }, girls: { min: 6, max: 9 } },
        recommendations: {
          totalHoursPerWeek: { min: 3, max: 6 },
          onCourtHours: { min: 2, max: 4 },
          physicalHours: { min: 1, max: 2 },
          competitionHours: { min: 0, max: 1 },
          restDaysPerWeek: 2,
        },
        multiSportRecommended: true,
        focusAreas: ['Talentinos', 'Klub', 'Liga druzyanowa (Mannschaft)'],
        principles: 'Program Talentinos. Trening klubowy. Wczesna liga druzynowa buduje odpornosc psychiczna.',
        trainingDistribution: { onCourt: 55, physical: 30, competition: 5, mentalRecovery: 10 },
      },
      {
        code: 'aufbautraining',
        name: 'Aufbautraining',
        namePl: 'Trening Rozwojowy',
        ageRange: { boys: { min: 9, max: 12 }, girls: { min: 9, max: 12 } },
        recommendations: {
          totalHoursPerWeek: { min: 8, max: 14 },
          onCourtHours: { min: 6, max: 10 },
          physicalHours: { min: 2, max: 4 },
          competitionHours: { min: 1, max: 2 },
          restDaysPerWeek: 2,
        },
        multiSportRecommended: true,
        focusAreas: ['Zawody regionalne/Verband', 'Rozwoj techniczny', 'Atletyzm'],
        principles: 'Zawody regionalne. Rozwoj techniczny z silnym naciskiem na atletyzm.',
        trainingDistribution: { onCourt: 55, physical: 25, competition: 15, mentalRecovery: 5 },
      },
      {
        code: 'anschlusstraining',
        name: 'Anschlusstraining',
        namePl: 'Trening Lacznikowy',
        ageRange: { boys: { min: 12, max: 15 }, girls: { min: 12, max: 15 } },
        recommendations: {
          totalHoursPerWeek: { min: 14, max: 22 },
          onCourtHours: { min: 10, max: 14 },
          physicalHours: { min: 4, max: 6 },
          competitionHours: { min: 2, max: 4 },
          restDaysPerWeek: 1,
        },
        multiSportRecommended: false,
        focusAreas: ['Bundesstützpunkte', 'Zawody krajowe/europejskie', 'Dual career'],
        principles: 'Regionalne bazy treningowe (Bundesstützpunkte). Zawody krajowe i europejskie. Dual career (edukacja + tenis).',
        trainingDistribution: { onCourt: 55, physical: 25, competition: 15, mentalRecovery: 5 },
      },
      {
        code: 'leistungstraining',
        name: 'Leistungstraining',
        namePl: 'Trening Wyczynowy',
        ageRange: { boys: { min: 15, max: 18 }, girls: { min: 15, max: 18 } },
        recommendations: {
          totalHoursPerWeek: { min: 22, max: 30 },
          onCourtHours: { min: 14, max: 18 },
          physicalHours: { min: 6, max: 8 },
          competitionHours: { min: 3, max: 5 },
          restDaysPerWeek: 1,
        },
        multiSportRecommended: false,
        focusAreas: ['Rywalizacja miedzynarodowa', 'Periodyzacja', 'Profesjonalizacja'],
        principles: 'Rywalizacja miedzynarodowa. Pelna periodyzacja. Profesjonalizacja podejscia.',
        trainingDistribution: { onCourt: 50, physical: 25, competition: 18, mentalRecovery: 7 },
      },
      {
        code: 'hochleistungstraining',
        name: 'Hochleistungstraining',
        namePl: 'Trening Najwyzszego Poziomu',
        ageRange: { boys: { min: 18, max: 25 }, girls: { min: 18, max: 25 } },
        recommendations: {
          totalHoursPerWeek: { min: 28, max: 35 },
          onCourtHours: { min: 16, max: 20 },
          physicalHours: { min: 8, max: 10 },
          competitionHours: { min: 5, max: 8 },
          restDaysPerWeek: 1,
        },
        multiSportRecommended: false,
        focusAreas: ['Tour profesjonalny', 'Pelna indywidualizacja'],
        principles: 'Tour profesjonalny. Pelna indywidualizacja programu.',
        trainingDistribution: { onCourt: 45, physical: 25, competition: 20, mentalRecovery: 10 },
      },
    ],
  },
  {
    federationCode: 'rfet',
    federationName: 'RFET',
    fullName: 'Real Federacion Espanola de Tenis',
    country: 'Hiszpania',
    countryFlag: '🇪🇸',
    description: 'System akademiczny — wysoki wolumen na korcie (mączka), wczesna ekspozycja turniejowa, kultura grup treningowych.',
    genderNotes: 'Historycznie silniejsze programy meskie. Ostatnio zwiekszone inwestycje w rozwoj kobiet. Wolumeny treningowe podobne, choć zawodniczki trenowaly czasem przy nieco nizszych wolumenach.',
    source: 'RFET Academy Development Structure, National Pathway',
    stages: [
      {
        code: 'iniciacion',
        name: 'Iniciacion',
        namePl: 'Inicjacja',
        ageRange: { boys: { min: 5, max: 8 }, girls: { min: 5, max: 8 } },
        recommendations: {
          totalHoursPerWeek: { min: 3, max: 5 },
          onCourtHours: { min: 2, max: 3 },
          physicalHours: { min: 1, max: 2 },
          competitionHours: { min: 0, max: 0 },
          restDaysPerWeek: 3,
        },
        multiSportRecommended: true,
        focusAreas: ['Imprezy wewnetrzne', 'Zabawa', 'Grupa treningowa'],
        principles: 'Imprezy wewnetrzne akademii. Zabawa. Trening w grupie (4-6 graczy na korcie).',
        trainingDistribution: { onCourt: 50, physical: 40, competition: 0, mentalRecovery: 10 },
      },
      {
        code: 'formacion',
        name: 'Formacion',
        namePl: 'Formacja',
        ageRange: { boys: { min: 8, max: 12 }, girls: { min: 8, max: 12 } },
        recommendations: {
          totalHoursPerWeek: { min: 8, max: 14 },
          onCourtHours: { min: 6, max: 10 },
          physicalHours: { min: 2, max: 4 },
          competitionHours: { min: 1, max: 2 },
          restDaysPerWeek: 2,
        },
        multiSportRecommended: true,
        focusAreas: ['Wysoki wolumen kortowy', 'Zawody regionalne/krajowe', 'Filozofia mączki'],
        principles: 'Wysoki wolumen na korcie, szczegolnie na maczce. Dluzsze wymiany = wiecej powtorzen. Wczesna ekspozycja turniejowa od 10-12 lat.',
        trainingDistribution: { onCourt: 60, physical: 20, competition: 15, mentalRecovery: 5 },
      },
      {
        code: 'perfeccionamiento',
        name: 'Perfeccionamiento',
        namePl: 'Doskonalenie',
        ageRange: { boys: { min: 12, max: 16 }, girls: { min: 12, max: 16 } },
        recommendations: {
          totalHoursPerWeek: { min: 16, max: 24 },
          onCourtHours: { min: 10, max: 16 },
          physicalHours: { min: 4, max: 6 },
          competitionHours: { min: 2, max: 4 },
          restDaysPerWeek: 1,
        },
        multiSportRecommended: false,
        focusAreas: ['Zawody krajowe/miedzynarodowe', 'Budowa punktu', 'Wzorce taktyczne', 'Inteligencja meczowa'],
        principles: 'Zawody krajowe i miedzynarodowe. Nacisk na budowe punktu, wzorce taktyczne i inteligencje meczowa.',
        trainingDistribution: { onCourt: 55, physical: 25, competition: 15, mentalRecovery: 5 },
      },
      {
        code: 'alto_rendimiento',
        name: 'Alto Rendimiento',
        namePl: 'Wysoka Wydajnosc',
        ageRange: { boys: { min: 16, max: 18 }, girls: { min: 16, max: 18 } },
        recommendations: {
          totalHoursPerWeek: { min: 24, max: 32 },
          onCourtHours: { min: 14, max: 20 },
          physicalHours: { min: 6, max: 8 },
          competitionHours: { min: 4, max: 6 },
          restDaysPerWeek: 1,
        },
        multiSportRecommended: false,
        focusAreas: ['Rywalizacja miedzynarodowa', 'Trening calodniowy', 'Presja turniejowa'],
        principles: 'Rywalizacja miedzynarodowa. Trening calodniowy. Najwyzsze akademie (Sanchez-Casal, Nadal Academy, Equelite).',
        trainingDistribution: { onCourt: 50, physical: 22, competition: 20, mentalRecovery: 8 },
      },
      {
        code: 'profesional',
        name: 'Profesional',
        namePl: 'Profesjonalista',
        ageRange: { boys: { min: 18, max: 25 }, girls: { min: 18, max: 25 } },
        recommendations: {
          totalHoursPerWeek: { min: 30, max: 35 },
          onCourtHours: { min: 16, max: 22 },
          physicalHours: { min: 8, max: 10 },
          competitionHours: { min: 5, max: 8 },
          restDaysPerWeek: 1,
        },
        multiSportRecommended: false,
        focusAreas: ['Tour profesjonalny', 'Trening grupowy (4-6 graczy)', 'Klimat calodniowy'],
        principles: 'Tour profesjonalny. Trening grupowy w akademiach (presja rywalizacyjna). Calodniowy klimat umozliwia trening na dworze caly rok.',
        trainingDistribution: { onCourt: 50, physical: 22, competition: 20, mentalRecovery: 8 },
      },
    ],
  },
];

export async function seedDevelopmentPrograms() {
  console.log('Tworzenie programow rozwoju federacji...');
  await DevelopmentProgram.deleteMany({});

  for (const program of programs) {
    await DevelopmentProgram.create(program);
  }

  console.log(`  Utworzono ${programs.length} programow federacji`);
  return await DevelopmentProgram.find({});
}
```

- [ ] **Step 2: Verify the file parses correctly**

Run: `cd /c/Users/Marcin/Desktop/serveiq && node -e "import('./server/src/scripts/seedDevelopmentPrograms.js').then(m => console.log('OK, exports:', Object.keys(m)))"`
Expected: `OK, exports: [ 'seedDevelopmentPrograms' ]`

- [ ] **Step 3: Commit**

```bash
git add server/src/scripts/seedDevelopmentPrograms.js
git commit -m "feat: add seed data for 8 federation development programs"
```

---

### Task 5: Integrate Seed into Main seed.js

**Files:**
- Modify: `server/src/scripts/seed.js`

- [ ] **Step 1: Add import at top of seed.js**

After line 18 (`import PlayerBadge from '../models/PlayerBadge.js';`), add:

```javascript
import DevelopmentProgram from '../models/DevelopmentProgram.js';
import { seedDevelopmentPrograms } from './seedDevelopmentPrograms.js';
```

- [ ] **Step 2: Add DevelopmentProgram to the cleanup section**

In the `Promise.all` cleanup block (around line 45-57), add `DevelopmentProgram.deleteMany({})` to the array.

- [ ] **Step 3: Call seedDevelopmentPrograms after club/group creation and assign programs to players**

After the club and groups are created, and after players are created, add federation program assignment. Find the section where players are fully created (after all 3 players have been saved with parents), and add:

```javascript
    // ====== Programy rozwoju federacji ======
    const allPrograms = await seedDevelopmentPrograms();
    const itfProgram = allPrograms.find(p => p.federationCode === 'itf');

    if (itfProgram) {
      // Kacper (8, M) — Mini Tennis stage
      const kacperStage = 'mini_tennis';
      playerA.federationProgram = {
        program: itfProgram._id,
        currentStageCode: kacperStage,
        stageConfirmedAt: new Date(),
        stageConfirmedBy: coachUser._id,
        autoSuggestedStage: kacperStage,
      };
      playerA.markModified('federationProgram');
      await playerA.save();

      // Julia (14, F) — Train to Train stage
      const juliaStage = 'train_to_train';
      playerB.federationProgram = {
        program: itfProgram._id,
        currentStageCode: juliaStage,
        stageConfirmedAt: new Date(),
        stageConfirmedBy: coachUser._id,
        autoSuggestedStage: juliaStage,
      };
      playerB.markModified('federationProgram');
      await playerB.save();

      // Antoni (8, M) — Mini Tennis stage
      const antoniStage = 'mini_tennis';
      playerC.federationProgram = {
        program: itfProgram._id,
        currentStageCode: antoniStage,
        stageConfirmedAt: new Date(),
        stageConfirmedBy: coachUser._id,
        autoSuggestedStage: antoniStage,
      };
      playerC.markModified('federationProgram');
      await playerC.save();

      console.log('  Przypisano program ITF do 3 graczy');
    }
```

- [ ] **Step 4: Commit**

```bash
git add server/src/scripts/seed.js
git commit -m "feat: integrate federation programs into seed script"
```

---

### Task 6: Development Program Controller

**Files:**
- Create: `server/src/controllers/developmentProgramController.js`

- [ ] **Step 1: Create the controller with all 5 endpoints**

```javascript
import DevelopmentProgram from '../models/DevelopmentProgram.js';
import Player from '../models/Player.js';
import Notification from '../models/Notification.js';

// Helper: calculate player age in years
function getPlayerAge(dateOfBirth) {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// Helper: find suggested stage for player age + gender
function findStageForPlayer(stages, age, gender) {
  const key = gender === 'F' ? 'girls' : 'boys';
  for (let i = stages.length - 1; i >= 0; i--) {
    const range = stages[i].ageRange[key];
    if (age >= range.min && age <= range.max) {
      return stages[i];
    }
  }
  // If age is above all ranges, return last stage
  if (age > stages[stages.length - 1].ageRange[key].max) {
    return stages[stages.length - 1];
  }
  // If age is below all ranges, return first stage
  return stages[0];
}

// Helper: map session types to categories and sum hours
const SESSION_TO_CATEGORY = {
  kort: 'onCourt',
  sparing: 'onCourt',
  mecz: 'competition',
  kondycja: 'physical',
  rozciaganie: 'physical',
  inne: 'other',
};

function calculateActualHours(weeklySchedule) {
  const totals = { onCourt: 0, physical: 0, competition: 0, other: 0 };
  for (const session of weeklySchedule) {
    const category = SESSION_TO_CATEGORY[session.sessionType] || 'other';
    const hours = (session.durationMinutes || 0) / 60;
    totals[category] += hours;
    // mecz also counts as onCourt
    if (session.sessionType === 'mecz') {
      totals.onCourt += hours;
    }
  }
  // Round to 1 decimal
  for (const key of Object.keys(totals)) {
    totals[key] = Math.round(totals[key] * 10) / 10;
  }
  totals.total = Math.round((totals.onCourt + totals.physical + totals.competition + totals.other) * 10) / 10;
  return totals;
}

function compareValue(actual, min, max) {
  if (actual < min) return 'under';
  if (actual > max) return 'over';
  return 'on_target';
}

// GET /api/development-programs
export const listPrograms = async (req, res, next) => {
  try {
    const programs = await DevelopmentProgram.find({}, {
      federationCode: 1,
      federationName: 1,
      fullName: 1,
      country: 1,
      countryFlag: 1,
      description: 1,
      'stages.code': 1,
      'stages.name': 1,
      'stages.namePl': 1,
    }).sort({ federationCode: 1 });

    res.json(programs);
  } catch (error) {
    next(error);
  }
};

// GET /api/development-programs/:code
export const getProgram = async (req, res, next) => {
  try {
    const program = await DevelopmentProgram.findOne({
      federationCode: req.params.code.toLowerCase(),
    });

    if (!program) {
      return res.status(404).json({ message: 'Program nie znaleziony' });
    }

    res.json(program);
  } catch (error) {
    next(error);
  }
};

// GET /api/development-programs/:code/stage-for-player/:playerId
export const getStageForPlayer = async (req, res, next) => {
  try {
    const program = await DevelopmentProgram.findOne({
      federationCode: req.params.code.toLowerCase(),
    });
    if (!program) {
      return res.status(404).json({ message: 'Program nie znaleziony' });
    }

    const player = await Player.findById(req.params.playerId);
    if (!player) {
      return res.status(404).json({ message: 'Zawodnik nie znaleziony' });
    }

    if (!player.dateOfBirth || !player.gender) {
      return res.status(400).json({
        message: 'Zawodnik musi miec ustawiona date urodzenia i plec',
      });
    }

    const age = getPlayerAge(player.dateOfBirth);
    const stage = findStageForPlayer(program.stages, age, player.gender);

    res.json({
      playerAge: age,
      playerGender: player.gender,
      suggestedStage: stage,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/players/:id/federation-program
export const setFederationProgram = async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ message: 'Zawodnik nie znaleziony' });
    }

    // Only coach can set program
    if (req.user.role !== 'coach' && req.user.role !== 'clubAdmin') {
      return res.status(403).json({ message: 'Tylko trener moze ustawic program rozwoju' });
    }

    const { federationCode, notes } = req.body;
    if (!federationCode) {
      return res.status(400).json({ message: 'Kod federacji jest wymagany' });
    }

    const program = await DevelopmentProgram.findOne({ federationCode: federationCode.toLowerCase() });
    if (!program) {
      return res.status(404).json({ message: 'Program nie znaleziony' });
    }

    // Auto-suggest stage
    let suggestedStageCode = null;
    if (player.dateOfBirth && player.gender) {
      const age = getPlayerAge(player.dateOfBirth);
      const stage = findStageForPlayer(program.stages, age, player.gender);
      suggestedStageCode = stage.code;
    }

    player.federationProgram = {
      program: program._id,
      currentStageCode: suggestedStageCode,
      stageConfirmedAt: new Date(),
      stageConfirmedBy: req.user._id,
      autoSuggestedStage: suggestedStageCode,
      notes: notes || null,
    };
    player.markModified('federationProgram');
    await player.save();

    res.json({
      message: 'Program rozwoju przypisany',
      federationProgram: player.federationProgram,
      program: { federationCode: program.federationCode, federationName: program.federationName, countryFlag: program.countryFlag },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/players/:id/federation-program/confirm-stage
export const confirmStage = async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ message: 'Zawodnik nie znaleziony' });
    }

    if (req.user.role !== 'coach' && req.user.role !== 'clubAdmin') {
      return res.status(403).json({ message: 'Tylko trener moze zatwierdzic etap' });
    }

    if (!player.federationProgram?.program) {
      return res.status(400).json({ message: 'Gracz nie ma przypisanego programu' });
    }

    const { stageCode } = req.body;
    if (!stageCode) {
      return res.status(400).json({ message: 'Kod etapu jest wymagany' });
    }

    player.federationProgram.currentStageCode = stageCode;
    player.federationProgram.stageConfirmedAt = new Date();
    player.federationProgram.stageConfirmedBy = req.user._id;
    player.markModified('federationProgram');
    await player.save();

    res.json({
      message: 'Etap zatwierdzony',
      federationProgram: player.federationProgram,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/players/:id/federation-program/comparison
export const getComparison = async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.id).populate('federationProgram.program');
    if (!player) {
      return res.status(404).json({ message: 'Zawodnik nie znaleziony' });
    }

    if (!player.federationProgram?.program) {
      return res.status(400).json({ message: 'Gracz nie ma przypisanego programu' });
    }

    const program = player.federationProgram.program;
    const currentStageCode = player.federationProgram.currentStageCode;
    const stage = program.stages.find(s => s.code === currentStageCode);

    if (!stage) {
      return res.status(400).json({ message: 'Etap nie znaleziony w programie' });
    }

    // Calculate actual hours from weekly schedule
    const schedule = player.trainingPlan?.weeklySchedule || [];
    const actual = calculateActualHours(schedule);

    const rec = stage.recommendations;
    const comparison = {
      total: compareValue(actual.total, rec.totalHoursPerWeek.min, rec.totalHoursPerWeek.max),
      onCourt: compareValue(actual.onCourt, rec.onCourtHours.min, rec.onCourtHours.max),
      physical: compareValue(actual.physical, rec.physicalHours.min, rec.physicalHours.max),
      competition: compareValue(actual.competition, rec.competitionHours.min, rec.competitionHours.max),
    };

    // Generate suggestions
    const suggestions = [];
    if (stage.multiSportRecommended) {
      suggestions.push('Wielosportowosc jest zalecana na tym etapie');
    }
    if (rec.restDaysPerWeek >= 2) {
      suggestions.push(`Minimum ${rec.restDaysPerWeek} dni odpoczynku w tygodniu`);
    } else {
      suggestions.push('Minimum 1 dzien odpoczynku w tygodniu');
    }
    if (comparison.total === 'under') {
      suggestions.push(`Aktualny plan (${actual.total}h) jest ponizej rekomendacji (${rec.totalHoursPerWeek.min}-${rec.totalHoursPerWeek.max}h)`);
    }
    if (comparison.total === 'over') {
      suggestions.push(`Aktualny plan (${actual.total}h) przekracza rekomendacje (${rec.totalHoursPerWeek.min}-${rec.totalHoursPerWeek.max}h) — uwaga na przeciazenie`);
    }

    // Check for stage transition suggestion
    let suggestedStageTransition = null;
    if (player.dateOfBirth && player.gender) {
      const age = getPlayerAge(player.dateOfBirth);
      const suggested = findStageForPlayer(program.stages, age, player.gender);
      if (suggested.code !== currentStageCode) {
        suggestedStageTransition = {
          fromStage: currentStageCode,
          toStage: suggested.code,
          toStageName: suggested.namePl,
          reason: `Wiek zawodnika (${age} lat) sugeruje etap "${suggested.namePl}"`,
        };
      }
    }

    const genderKey = player.gender === 'F' ? 'girls' : 'boys';

    res.json({
      federation: {
        code: program.federationCode,
        name: program.federationName,
        flag: program.countryFlag,
      },
      stage: {
        code: stage.code,
        name: stage.name,
        namePl: stage.namePl,
        ageRange: stage.ageRange[genderKey],
        principles: stage.principles,
        focusAreas: stage.focusAreas,
        multiSportRecommended: stage.multiSportRecommended,
        trainingDistribution: stage.trainingDistribution,
      },
      recommendations: {
        totalHoursPerWeek: rec.totalHoursPerWeek,
        onCourtHours: rec.onCourtHours,
        physicalHours: rec.physicalHours,
        competitionHours: rec.competitionHours,
        restDaysPerWeek: rec.restDaysPerWeek,
      },
      actual,
      comparison,
      suggestions,
      suggestedStageTransition,
    });
  } catch (error) {
    next(error);
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add server/src/controllers/developmentProgramController.js
git commit -m "feat: add development program controller with comparison logic"
```

---

### Task 7: Development Program Routes

**Files:**
- Create: `server/src/routes/developmentPrograms.js`
- Modify: `server/src/routes/players.js`
- Modify: `server/src/index.js`

- [ ] **Step 1: Create route file**

```javascript
import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  listPrograms,
  getProgram,
  getStageForPlayer,
} from '../controllers/developmentProgramController.js';

const router = Router();

router.get('/', verifyToken, listPrograms);
router.get('/:code', verifyToken, getProgram);
router.get('/:code/stage-for-player/:playerId', verifyToken, getStageForPlayer);

export default router;
```

- [ ] **Step 2: Add player federation-program routes to players.js**

In `server/src/routes/players.js`, add import at top:

```javascript
import {
  setFederationProgram,
  confirmStage,
  getComparison,
} from '../controllers/developmentProgramController.js';
```

And add routes (before the `/:id` catch-all routes):

```javascript
router.put('/:id/federation-program', verifyToken, requireRole('coach', 'clubAdmin'), setFederationProgram);
router.put('/:id/federation-program/confirm-stage', verifyToken, requireRole('coach', 'clubAdmin'), confirmStage);
router.get('/:id/federation-program/comparison', verifyToken, getComparison);
```

- [ ] **Step 3: Register route in index.js**

In `server/src/index.js`, add import:

```javascript
import developmentProgramRoutes from './routes/developmentPrograms.js';
```

And register (after line 117, before health check):

```javascript
app.use('/api/development-programs', developmentProgramRoutes);
```

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/developmentPrograms.js server/src/routes/players.js server/src/index.js
git commit -m "feat: add development program API routes"
```

---

### Task 8: Stage Transition Checker Job

**Files:**
- Create: `server/src/jobs/stageChecker.js`
- Modify: `server/src/jobs/index.js`

- [ ] **Step 1: Create stage checker job**

```javascript
import Player from '../models/Player.js';
import DevelopmentProgram from '../models/DevelopmentProgram.js';
import Notification from '../models/Notification.js';

function getPlayerAge(dateOfBirth) {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function findStageForPlayer(stages, age, gender) {
  const key = gender === 'F' ? 'girls' : 'boys';
  for (let i = stages.length - 1; i >= 0; i--) {
    const range = stages[i].ageRange[key];
    if (age >= range.min && age <= range.max) {
      return stages[i];
    }
  }
  if (age > stages[stages.length - 1].ageRange[key].max) {
    return stages[stages.length - 1];
  }
  return stages[0];
}

export async function checkStageTransitions() {
  // Run once daily (check: is it Monday at 8:00?)
  const now = new Date();
  if (now.getDay() !== 1 || now.getHours() !== 8) return;

  console.log('[StageChecker] Sprawdzanie sugestii zmian etapu...');

  try {
    const players = await Player.find({
      'federationProgram.program': { $exists: true, $ne: null },
      dateOfBirth: { $exists: true, $ne: null },
      gender: { $exists: true, $ne: null },
      active: true,
    }).populate('federationProgram.program');

    let notificationsCreated = 0;

    for (const player of players) {
      const program = player.federationProgram.program;
      if (!program || !program.stages) continue;

      const age = getPlayerAge(player.dateOfBirth);
      const suggested = findStageForPlayer(program.stages, age, player.gender);
      const currentStage = player.federationProgram.currentStageCode;

      if (suggested.code !== currentStage && suggested.code !== player.federationProgram.autoSuggestedStage) {
        // Update autoSuggestedStage
        player.federationProgram.autoSuggestedStage = suggested.code;
        player.markModified('federationProgram');
        await player.save();

        // Create notification for coach
        if (player.coach) {
          const existing = await Notification.findOne({
            user: player.coach,
            type: 'stage_transition',
            player: player._id,
            read: false,
          });

          if (!existing) {
            await Notification.create({
              user: player.coach,
              type: 'stage_transition',
              title: 'Sugestia zmiany etapu',
              body: `${player.firstName} ${player.lastName} (${age} lat) — rozwaz przejscie na etap "${suggested.namePl}" (${program.federationName}). Rekomendowane godziny: ${suggested.recommendations.totalHoursPerWeek.min}-${suggested.recommendations.totalHoursPerWeek.max}h/tyg`,
              severity: 'info',
              player: player._id,
              actionUrl: `/coach/player/${player._id}`,
              metadata: {
                fromStage: currentStage,
                toStage: suggested.code,
                federationCode: program.federationCode,
              },
            });
            notificationsCreated++;
          }
        }
      }
    }

    console.log(`[StageChecker] Zakonczono — ${notificationsCreated} nowych sugestii`);
  } catch (error) {
    console.error('[StageChecker] Blad:', error.message);
  }
}
```

- [ ] **Step 2: Register in jobs/index.js**

Add import at top of `server/src/jobs/index.js`:

```javascript
import { checkStageTransitions } from './stageChecker.js';
```

Add interval in `startJobs()`:

```javascript
  // Sprawdzanie sugestii zmian etapu — co godzine (wysyla w pon. 8:00)
  setInterval(checkStageTransitions, 60 * 60 * 1000);
  console.log('[ServeIQ]   - Stage transition check: co 1h (sprawdza pon. 8:00)');
```

- [ ] **Step 3: Commit**

```bash
git add server/src/jobs/stageChecker.js server/src/jobs/index.js
git commit -m "feat: add weekly stage transition checker job"
```

---

### Task 9: Frontend — DevelopmentProgramTab Component

**Files:**
- Create: `client/src/pages/coach/DevelopmentProgramTab.jsx`

- [ ] **Step 1: Create the full tab component**

```jsx
import { useState, useEffect } from 'react'
import { Globe, ChevronDown, ChevronUp, AlertTriangle, Check, Info, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import api from '../../api/axios'

const STATUS_STYLES = {
  on_target: { color: '#22c55e', bg: '#f0fdf4', icon: Check, label: 'W normie' },
  under: { color: '#eab308', bg: '#fefce8', icon: TrendingDown, label: 'Ponizej' },
  over: { color: '#ef4444', bg: '#fef2f2', icon: TrendingUp, label: 'Powyzej' },
}

function ComparisonCard({ label, actual, min, max, status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.on_target
  const Icon = style.icon
  const range = max - min
  const position = range > 0 ? Math.min(100, Math.max(0, ((actual - min) / range) * 100)) : 50

  return (
    <div style={{
      background: style.bg,
      border: `1px solid ${style.color}30`,
      borderRadius: 10,
      padding: '0.875rem',
      flex: '1 1 calc(50% - 0.5rem)',
      minWidth: 160,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{label}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: style.color, fontWeight: 600 }}>
          <Icon size={14} /> {style.label}
        </span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{actual}h</div>
      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>Rekomendacja: {min}–{max}h</div>
      <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, position: 'relative', overflow: 'visible' }}>
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${Math.min(100, (actual / (max || 1)) * 100)}%`,
          background: style.color,
          borderRadius: 3,
          transition: 'width 0.3s',
        }} />
      </div>
    </div>
  )
}

export default function DevelopmentProgramTab({ playerId, player, toast, isCoach, onRefresh }) {
  const [programs, setPrograms] = useState([])
  const [comparison, setComparison] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [selectedCode, setSelectedCode] = useState('')

  const fp = player?.federationProgram
  const hasProgram = !!fp?.program

  useEffect(() => {
    api.get('/development-programs').then(r => setPrograms(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (hasProgram) {
      api.get(`/players/${playerId}/federation-program/comparison`)
        .then(r => setComparison(r.data))
        .catch(() => setComparison(null))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [playerId, hasProgram, fp?.currentStageCode])

  const handleSetProgram = async (code) => {
    if (!code) return
    setSaving(true)
    try {
      await api.put(`/players/${playerId}/federation-program`, { federationCode: code })
      toast.success('Program rozwoju przypisany')
      onRefresh()
    } catch {
      toast.error('Nie udalo sie przypisac programu')
    }
    setSaving(false)
  }

  const handleConfirmStage = async (stageCode) => {
    setSaving(true)
    try {
      await api.put(`/players/${playerId}/federation-program/confirm-stage`, { stageCode })
      toast.success('Etap zatwierdzony')
      onRefresh()
    } catch {
      toast.error('Nie udalo sie zatwierdzic etapu')
    }
    setSaving(false)
  }

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>Ladowanie programu rozwoju...</div>
  }

  // No program selected — show selector
  if (!hasProgram) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div style={{
          background: '#f9fafb',
          border: '2px dashed #d1d5db',
          borderRadius: 12,
          padding: '2rem',
          textAlign: 'center',
        }}>
          <Globe size={32} style={{ color: '#9ca3af', margin: '0 auto 12px' }} />
          <h3 style={{ margin: '0 0 8px', fontSize: 16, color: '#374151' }}>Wybierz program rozwoju federacji</h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>
            System dopasuje rekomendacje treningowe do wieku i plci zawodnika
          </p>
          {isCoach && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {programs.map(p => (
                <button
                  key={p.federationCode}
                  onClick={() => handleSetProgram(p.federationCode)}
                  disabled={saving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    background: '#fff',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#eff6ff' }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#fff' }}
                >
                  <span style={{ fontSize: 18 }}>{p.countryFlag}</span>
                  <span>{p.federationName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!comparison) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>Brak danych do porownania</div>
  }

  const { federation, stage, recommendations: rec, actual, comparison: cmp, suggestions, suggestedStageTransition } = comparison

  // Find all stages of the program for stepper
  const programFull = programs.find(p => p.federationCode === federation.code)
  const allStages = programFull?.stages || []

  return (
    <div style={{ padding: '1rem' }}>
      {/* Header with federation badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>{federation.flag}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{federation.name}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Etap: {stage.namePl}</div>
          </div>
        </div>
        {isCoach && (
          <select
            value=""
            onChange={e => e.target.value && handleSetProgram(e.target.value)}
            style={{ fontSize: 12, padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 6, color: '#6b7280' }}
          >
            <option value="">Zmien program...</option>
            {programs.map(p => (
              <option key={p.federationCode} value={p.federationCode}>
                {p.countryFlag} {p.federationName}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Stage transition alert */}
      {suggestedStageTransition && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: '#fffbeb',
          border: '1px solid #fbbf24',
          borderRadius: 10,
          padding: '12px 14px',
          marginBottom: 16,
        }}>
          <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 13 }}>
            <strong>{suggestedStageTransition.reason}</strong>
          </div>
          {isCoach && (
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button
                onClick={() => handleConfirmStage(suggestedStageTransition.toStage)}
                disabled={saving}
                style={{
                  padding: '6px 12px',
                  background: '#22c55e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Zatwierdz przejscie
              </button>
              <button
                onClick={() => toast.info('Pozostajesz na obecnym etapie')}
                style={{
                  padding: '6px 12px',
                  background: '#f3f4f6',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Pozostan
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stage stepper */}
      {allStages.length > 0 && (
        <div style={{
          display: 'flex',
          gap: 0,
          marginBottom: 16,
          overflowX: 'auto',
          paddingBottom: 4,
        }}>
          {allStages.map((s, i) => {
            const isCurrent = s.code === stage.code
            const isSuggested = suggestedStageTransition?.toStage === s.code
            return (
              <div key={s.code} style={{
                display: 'flex',
                alignItems: 'center',
                flex: isCurrent ? '0 0 auto' : '0 0 auto',
              }}>
                <div style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: isCurrent ? 700 : 400,
                  background: isCurrent ? '#3b82f6' : isSuggested ? '#fef3c7' : '#f3f4f6',
                  color: isCurrent ? '#fff' : isSuggested ? '#92400e' : '#6b7280',
                  border: isSuggested ? '1px solid #fbbf24' : '1px solid transparent',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}>
                  {s.namePl || s.name}
                </div>
                {i < allStages.length - 1 && (
                  <div style={{ width: 12, height: 2, background: '#d1d5db', flexShrink: 0 }} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Comparison cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: 16 }}>
        <ComparisonCard label="Lacznie" actual={actual.total} min={rec.totalHoursPerWeek.min} max={rec.totalHoursPerWeek.max} status={cmp.total} />
        <ComparisonCard label="Godziny na korcie" actual={actual.onCourt} min={rec.onCourtHours.min} max={rec.onCourtHours.max} status={cmp.onCourt} />
        <ComparisonCard label="Przygotowanie fizyczne" actual={actual.physical} min={rec.physicalHours.min} max={rec.physicalHours.max} status={cmp.physical} />
        <ComparisonCard label="Turnieje / mecze" actual={actual.competition} min={rec.competitionHours.min} max={rec.competitionHours.max} status={cmp.competition} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div style={{
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: 10,
          padding: '12px 14px',
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#0369a1', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Info size={14} /> Wskazowki
          </div>
          {suggestions.map((s, i) => (
            <div key={i} style={{ fontSize: 13, color: '#374151', marginBottom: 2 }}>• {s}</div>
          ))}
        </div>
      )}

      {/* Expandable stage details */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          padding: '10px 14px',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 500,
          color: '#374151',
        }}
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        Szczegoly etapu: {stage.namePl}
      </button>

      {expanded && (
        <div style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderTop: 'none',
          borderRadius: '0 0 10px 10px',
          padding: '14px',
        }}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Zasady etapu</div>
            <div style={{ fontSize: 13, color: '#374151' }}>{stage.principles}</div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Obszary skupienia</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {stage.focusAreas.map((f, i) => (
                <span key={i} style={{
                  padding: '3px 8px',
                  background: '#dbeafe',
                  color: '#1e40af',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 500,
                }}>{f}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6b7280' }}>
            <span>Wielosportowosc: {stage.multiSportRecommended ? 'Tak' : 'Nie'}</span>
            <span>Min. dni wolnych: {rec.restDaysPerWeek}</span>
            <span>Wiek: {stage.ageRange.min}–{stage.ageRange.max} lat</span>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/coach/DevelopmentProgramTab.jsx
git commit -m "feat: add DevelopmentProgramTab component for player profile"
```

---

### Task 10: Integrate Program Tab into CoachPlayerProfile

**Files:**
- Modify: `client/src/pages/coach/CoachPlayerProfile.jsx`

- [ ] **Step 1: Add import**

After existing imports at the top of CoachPlayerProfile.jsx, add:

```javascript
import DevelopmentProgramTab from './DevelopmentProgramTab'
```

- [ ] **Step 2: Add tab button**

After the "Plan" tab button (around line 846-848), add:

```javascript
        <button className={`coach-tab ${tab === 'program' ? 'active' : ''}`} onClick={() => setTab('program')}>
          <Globe size={14} /> Program
        </button>
```

Also add `Globe` to the lucide-react import at the top (line 3-5).

- [ ] **Step 3: Add tab content**

After the plan tab content (around line 1400, `{tab === 'plan' && <CoachPlanTab ...`), add:

```javascript
      {tab === 'program' && (
        <DevelopmentProgramTab
          playerId={id}
          player={player}
          toast={toast}
          isCoach={true}
          onRefresh={fetchPlayer}
        />
      )}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/coach/CoachPlayerProfile.jsx
git commit -m "feat: add Program tab to coach player profile"
```

---

### Task 11: PlanRecommendationBar Component

**Files:**
- Create: `client/src/components/player/PlanRecommendationBar.jsx`

- [ ] **Step 1: Create the recommendation bar**

```jsx
import { useState, useEffect } from 'react'
import { Info, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../../api/axios'

export default function PlanRecommendationBar({ playerId }) {
  const [comparison, setComparison] = useState(null)
  const [tipsOpen, setTipsOpen] = useState(false)

  useEffect(() => {
    if (!playerId) return
    api.get(`/players/${playerId}/federation-program/comparison`)
      .then(r => setComparison(r.data))
      .catch(() => setComparison(null))
  }, [playerId])

  if (!comparison) return null

  const { federation, stage, recommendations: rec, actual, comparison: cmp, suggestions } = comparison

  const statusColor = (status) => {
    if (status === 'on_target') return '#22c55e'
    if (status === 'under') return '#eab308'
    return '#ef4444'
  }

  const items = [
    { label: 'Kort', actual: actual.onCourt, range: `${rec.onCourtHours.min}-${rec.onCourtHours.max}`, status: cmp.onCourt },
    { label: 'Kondycja', actual: actual.physical, range: `${rec.physicalHours.min}-${rec.physicalHours.max}`, status: cmp.physical },
    { label: 'Turnieje', actual: actual.competition, range: `${rec.competitionHours.min}-${rec.competitionHours.max}`, status: cmp.competition },
    { label: 'Lacznie', actual: actual.total, range: `${rec.totalHoursPerWeek.min}-${rec.totalHoursPerWeek.max}`, status: cmp.total },
  ]

  return (
    <div style={{
      background: '#f0f9ff',
      border: '1px solid #bae6fd',
      borderRadius: 10,
      padding: '10px 14px',
      marginBottom: 16,
      fontSize: 13,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>{federation.flag}</span>
        <span style={{ fontWeight: 600, color: '#0c4a6e' }}>{federation.name}</span>
        <span style={{ color: '#6b7280' }}>·</span>
        <span style={{ color: '#0369a1' }}>{stage.namePl}</span>
      </div>

      {/* Inline comparison */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 16px' }}>
        {items.map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: statusColor(item.status),
              display: 'inline-block',
            }} />
            <span style={{ color: '#374151' }}>{item.label}: <strong>{item.actual}h</strong></span>
            <span style={{ color: '#9ca3af', fontSize: 11 }}>({item.range}h)</span>
          </div>
        ))}
      </div>

      {/* Expandable tips */}
      {suggestions.length > 0 && (
        <>
          <button
            onClick={() => setTipsOpen(!tipsOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 8,
              padding: 0,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 12,
              color: '#0369a1',
              fontWeight: 500,
            }}
          >
            <Info size={12} />
            Wskazowki ({suggestions.length})
            {tipsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {tipsOpen && (
            <div style={{ marginTop: 6, paddingLeft: 4 }}>
              {suggestions.map((s, i) => (
                <div key={i} style={{ fontSize: 12, color: '#374151', marginBottom: 2 }}>• {s}</div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/player/PlanRecommendationBar.jsx
git commit -m "feat: add PlanRecommendationBar component for plan editor"
```

---

### Task 12: Integrate Recommendation Bar into PlanTab and CoachPlanTab

**Files:**
- Modify: `client/src/pages/parent/training-plan/PlanTab.jsx`
- Modify: `client/src/pages/coach/CoachPlayerProfile.jsx` (CoachPlanTab section)

- [ ] **Step 1: Add recommendation bar to parent PlanTab**

At top of `client/src/pages/parent/training-plan/PlanTab.jsx`, add import:

```javascript
import PlanRecommendationBar from '../../../components/player/PlanRecommendationBar'
```

Inside the returned JSX, at the very beginning of the main container (before the schedule section), add:

```jsx
<PlanRecommendationBar playerId={childId} />
```

- [ ] **Step 2: Add recommendation bar to CoachPlanTab**

In `client/src/pages/coach/CoachPlayerProfile.jsx`, add import at top:

```javascript
import PlanRecommendationBar from '../../components/player/PlanRecommendationBar'
```

Inside `CoachPlanTab` component's return, before the `coach-plan-summary` div, add:

```jsx
<PlanRecommendationBar playerId={playerId} />
```

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/parent/training-plan/PlanTab.jsx client/src/pages/coach/CoachPlayerProfile.jsx
git commit -m "feat: integrate recommendation bar into plan editors"
```

---

### Task 13: Add Program Section to Parent ChildProfile

**Files:**
- Modify: `client/src/pages/parent/ChildProfile.jsx`

- [ ] **Step 1: Add DevelopmentProgramTab import**

At top of `client/src/pages/parent/ChildProfile.jsx`, add:

```javascript
import DevelopmentProgramTab from '../coach/DevelopmentProgramTab'
```

- [ ] **Step 2: Add program section to the profile page**

Find an appropriate location in the ChildProfile render (after the existing PathwayStepper/PlayerJourney sections). Add a section:

```jsx
{child?.federationProgram?.program && (
  <div style={{
    background: 'var(--color-surface, #fff)',
    borderRadius: 12,
    border: '1px solid var(--color-border, #e5e7eb)',
    marginTop: '1.25rem',
    overflow: 'hidden',
  }}>
    <div style={{
      padding: '1rem 1.25rem 0',
      fontWeight: 600,
      fontSize: 15,
      color: '#111827',
    }}>Program Rozwoju</div>
    <DevelopmentProgramTab
      playerId={child._id}
      player={child}
      toast={{ success: () => {}, error: () => {}, info: () => {} }}
      isCoach={false}
      onRefresh={() => window.location.reload()}
    />
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/parent/ChildProfile.jsx
git commit -m "feat: add federation program section to parent child profile"
```

---

### Task 14: Run Seed and Verify

- [ ] **Step 1: Run seed script**

Run: `cd /c/Users/Marcin/Desktop/serveiq && npm run seed`
Expected: Output includes "Tworzenie programow rozwoju federacji..." and "Utworzono 8 programow federacji" and "Przypisano program ITF do 3 graczy"

- [ ] **Step 2: Start the app and verify**

Run: `cd /c/Users/Marcin/Desktop/serveiq && npm run dev`
Expected: Server starts without errors, client compiles without errors

- [ ] **Step 3: Test API endpoints manually**

Test listing programs:
Run: `curl http://localhost:5000/api/development-programs -H "Authorization: Bearer <token>"`
Expected: Array of 8 programs with federation codes

Test comparison endpoint (with a player that has a program assigned):
Run: `curl http://localhost:5000/api/players/<playerId>/federation-program/comparison -H "Authorization: Bearer <token>"`
Expected: Comparison JSON with federation, stage, recommendations, actual, comparison fields

- [ ] **Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: seed and API verification fixes"
```
