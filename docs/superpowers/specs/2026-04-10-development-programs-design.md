# Development Programs — Federation-Based Training Recommendations

## Summary

Add a federation-based development program system to ServeIQ. Coaches select a tennis federation program (USTA, Tennis Canada, ITF, etc.) for each player. The system automatically determines the player's development stage based on age and gender, then provides training hour recommendations and comparisons against the player's actual training plan. Parents see the full recommendations alongside their child's plan.

## Core Concepts

### Federation Programs

8 pre-seeded federation programs, each defining development stages with recommended training hours:

1. **ITF** — International Tennis Federation (baseline/global)
2. **USTA** — American Development Model
3. **Tennis Canada** — Long-Term Player Development (LTPD)
4. **Tennis Australia** — Hot Shots → Elite pathway
5. **FFT** — French Tennis Federation (Formation)
6. **LTA** — Lawn Tennis Association (UK)
7. **DTB** — Deutscher Tennis Bund (Germany)
8. **RFET** — Real Federación Española de Tenis (Spain)

### Development Stages

Each federation defines 6-7 stages. Each stage has:

- Name (localized to Polish for UI, original name stored)
- Age range (min/max) with gender offset (girls typically enter stages ~1 year earlier)
- Training hour recommendations (min/max ranges):
  - `onCourt` — court training hours/week
  - `physical` — physical conditioning hours/week
  - `competition` — match/tournament hours/week
  - `totalMin` / `totalMax` — total recommended hours/week
- Rest days per week (minimum)
- Multi-sport recommended (boolean)
- Key focus areas for the stage (array of strings)
- Key principles (short description of stage philosophy)

### Stage Assignment

- System calculates suggested stage from player's `dateOfBirth` and `gender` against the selected federation's stage age ranges
- Girls get a configurable age offset (default: -1 year) — a 11-year-old girl matches the stage a 12-year-old boy would
- Coach must manually approve stage transitions (system creates a notification/suggestion)
- Coach can override to a different stage if the player is ahead/behind typical development

### Plan Comparison

The system compares the player's actual `trainingPlan.weeklySchedule` against the federation's recommendations:

- Maps session types to recommendation categories:
  - `kort`, `sparing`, `mecz` → on-court hours
  - `kondycja`, `rozciaganie` → physical hours
  - `mecz` also counts toward competition hours
  - `inne` → uncategorized
- Calculates totals and produces a comparison: under/on-target/over for each category
- Thresholds: below min = "under", between min-max = "on-target", above max = "over"

## Data Model

### New Model: `DevelopmentProgram`

```javascript
{
  federationCode: String,     // e.g., "usta", "itf", "tennis_canada"
  federationName: String,     // e.g., "USTA"
  fullName: String,           // e.g., "United States Tennis Association"
  country: String,            // e.g., "USA"
  countryFlag: String,        // emoji flag, e.g., "🇺🇸"
  description: String,        // short description of the program philosophy
  
  stages: [{
    code: String,             // e.g., "discover_learn", "train_to_train"
    name: String,             // original name, e.g., "Discover & Learn"
    namePl: String,           // Polish translation, e.g., "Odkrywaj i Ucz się"
    ageRange: {
      boys: { min: Number, max: Number },
      girls: { min: Number, max: Number }
    },
    recommendations: {
      totalHoursPerWeek: { min: Number, max: Number },
      onCourtHours: { min: Number, max: Number },
      physicalHours: { min: Number, max: Number },
      competitionHours: { min: Number, max: Number },
      restDaysPerWeek: Number,
    },
    multiSportRecommended: Boolean,
    focusAreas: [String],       // e.g., ["ABCs", "Modified equipment", "Fun-first"]
    principles: String,         // short description of stage philosophy
    trainingDistribution: {     // approximate % breakdown
      onCourt: Number,          // e.g., 60
      physical: Number,         // e.g., 20
      competition: Number,      // e.g., 15
      mentalRecovery: Number    // e.g., 5
    }
  }],
  
  genderNotes: String,         // federation-specific notes on gender differences
  source: String               // reference to official document/URL
}
```

### Player Model Extension

Add to existing Player schema:

```javascript
{
  // ... existing fields ...
  
  federationProgram: {
    program: { type: ObjectId, ref: 'DevelopmentProgram' },  // selected federation
    currentStageCode: String,       // manually confirmed stage code
    stageConfirmedAt: Date,         // when coach confirmed this stage
    stageConfirmedBy: { type: ObjectId, ref: 'User' },
    autoSuggestedStage: String,     // what the system calculates based on age/gender
    notes: String                   // coach notes about the choice
  }
}
```

## API Endpoints

### Development Programs

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/development-programs` | List all federation programs (summary) | Any authenticated |
| `GET` | `/api/development-programs/:code` | Get full program details with all stages | Any authenticated |
| `GET` | `/api/development-programs/:code/stage-for-player/:playerId` | Calculate suggested stage for player | Coach/Parent |

### Player Federation Program

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `PUT` | `/api/players/:id/federation-program` | Set/update federation program for player | Coach |
| `PUT` | `/api/players/:id/federation-program/confirm-stage` | Confirm or override suggested stage | Coach |
| `GET` | `/api/players/:id/federation-program/comparison` | Get plan vs recommendation comparison | Coach/Parent |

### Comparison Response Shape

```json
{
  "federation": { "code": "usta", "name": "USTA", "flag": "🇺🇸" },
  "stage": {
    "code": "learn_to_compete",
    "name": "Learn to Compete",
    "namePl": "Naucz się Rywalizować",
    "ageRange": { "min": 10, "max": 12 }
  },
  "recommendations": {
    "totalHoursPerWeek": { "min": 8, "max": 14 },
    "onCourtHours": { "min": 6, "max": 10 },
    "physicalHours": { "min": 2, "max": 4 },
    "competitionHours": { "min": 1, "max": 2 }
  },
  "actual": {
    "totalHoursPerWeek": 9,
    "onCourtHours": 6,
    "physicalHours": 2,
    "competitionHours": 1
  },
  "comparison": {
    "total": "on_target",
    "onCourt": "on_target",
    "physical": "on_target",
    "competition": "on_target"
  },
  "suggestions": [
    "Wielosportowość jest zalecana na tym etapie",
    "Minimum 2 dni odpoczynku w tygodniu"
  ],
  "suggestedStageTransition": null
}
```

## Notifications

### Stage Transition Suggestion

When the alert runner detects a player whose age now falls into a new stage:

- Create notification for coach:
  - Type: `stage_transition`
  - Title: "Sugestia zmiany etapu"
  - Body: "Kacper Nowak (12 lat) — rozważ przejście na etap Train to Train (12-16 lat). Rekomendowane godziny: 12-20h/tyg"
  - ActionUrl: `/coach/players/:id` (player profile with program tab)
- Coach clicks → sees current vs suggested stage comparison → confirms or dismisses

### Trigger

Add a check to the existing `alertRunner` job (runs every 30 min) or the `weeklyRunner`:
- For each player with a federation program assigned
- Calculate `autoSuggestedStage` based on current age + gender
- If `autoSuggestedStage !== currentStageCode` → update player's `autoSuggestedStage` and create notification (if not already created)

## Frontend

### Player Profile — New Tab/Section: "Program Rozwoju"

Visible to both coach and parent. Contains:

1. **Federation selector** (coach only) — dropdown with federation flags and names
   - When no program selected: prompt "Wybierz program rozwoju federacji"
   - When selected: shows federation badge with flag

2. **Stage stepper** — horizontal stepper showing all stages of selected federation
   - Current stage highlighted
   - If suggested transition exists: next stage pulses/glows with a "Rozważ przejście" badge

3. **Recommendation cards** — 4 cards showing:
   - Godziny na korcie: actual vs recommended range
   - Przygotowanie fizyczne: actual vs recommended range
   - Turnieje/mecze: actual vs recommended range
   - Łącznie: total actual vs recommended range
   - Each card: green (on target), yellow (below min), red (above max)
   - Progress bar inside each card showing where actual falls in the range

4. **Stage details** — expandable section:
   - Key principles of current stage
   - Focus areas
   - Multi-sport recommendation
   - Rest days recommendation
   - Gender-specific notes

5. **Stage transition alert** (when applicable):
   - Banner: "System sugeruje przejście na etap [X] na podstawie wieku gracza"
   - Two buttons: "Zatwierdź przejście" / "Pozostań na obecnym etapie"
   - "Zatwierdź" confirms and updates stage

### Training Plan Editor — Recommendation Bar

When editing a player's weekly plan (`PlanTab.jsx`), if a federation program is assigned:

1. **Top bar** showing:
   - Federation badge + current stage name
   - "Rekomendacja: [min]-[max]h kort, [min]-[max]h kondycja, [min]-[max]h turnieje"

2. **Inline indicators** next to weekly totals:
   - Color-coded comparison (green/yellow/red)
   - Tooltip on hover: "Rekomendacja [federacja]: [range]. Twój plan: [actual]h"

3. **Tips section** (collapsible):
   - Stage-specific tips from the federation program
   - E.g., "Na tym etapie zalecane jest minimum 2 dni odpoczynku w tygodniu"
   - E.g., "Wielosportowość jest nadal zalecana — rozważ sport uzupełniający"

## Session Type → Category Mapping

```javascript
const SESSION_TO_CATEGORY = {
  kort: 'onCourt',
  sparing: 'onCourt',
  mecz: 'competition',      // also partially onCourt
  kondycja: 'physical',
  rozciaganie: 'physical',
  inne: 'other'
};
```

Note: `mecz` counts toward both `onCourt` and `competition`. For comparison purposes, `mecz` hours are counted in `competition` primarily, and also added to `onCourt` totals (since match play is on-court time).

## Seed Data

The seed script will be extended to:

1. Create all 8 `DevelopmentProgram` documents with full stage data
2. Assign "ITF" program to demo players (as a sensible default)
3. Set confirmed stages matching their age/development level:
   - Kacper (8, M) → Mini Tennis / Red-Orange stage
   - Julia (14, F) → Train to Train stage
   - Antoni (8, M) → Mini Tennis / Red-Orange stage

## Federation Data Sources

Training hour recommendations are synthesized from publicly available federation documents:

| Federation | Key Source |
|-----------|-----------|
| ITF | ITF Player Development Guidelines, ITF Global Tennis Report |
| USTA | USTA American Development Model, Player Development Competitive Pathway |
| Tennis Canada | Long-Term Player Development (LTPD) framework, CS4L alignment |
| Tennis Australia | Hot Shots program guidelines, National Development Squad pathway |
| FFT | Formation structure, Pole France pathway documentation |
| LTA | Player Pathway guidelines, "Tennis Opened Up" framework |
| DTB | Talentinos program, Bundesleistungszentren guidelines |
| RFET | Academy development structure, national pathway documentation |

Numbers represent midpoint estimates from published ranges. Coaches should reference current federation publications for the latest guidelines.

## Out of Scope

- Custom/user-defined federation programs (future enhancement)
- Automatic plan adjustment (system only suggests, never auto-changes the plan)
- Integration with federation APIs
- Detailed periodization/macrocycle planning
- PDF reports of program compliance
