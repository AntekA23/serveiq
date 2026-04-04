# ServeIQ — MVP Data Model v1

> **Purpose**: Complete schema definitions for MVP. All new/refactored Mongoose models.
> **Date**: 2026-04-02 (Week 1)
> **Reference**: STRATEGY.md sections 8 & 16

---

## Entity Relationship Overview

```
                    ┌──────────┐
                    │   Club   │
                    └────┬─────┘
                         │ has many
              ┌──────────┼──────────┐
              │          │          │
         ┌────▼───┐ ┌───▼────┐ ┌──▼───────┐
         │ Coach  │ │ Player │ │ClubAdmin │
         └───┬────┘ └───┬────┘ └──────────┘
             │          │
             │    ┌─────┼─────────┬──────────┐
             │    │     │         │           │
             │ ┌──▼──┐  │    ┌───▼────┐ ┌───▼──────────┐
             │ │Parent│  │    │DevGoal │ │Observation   │
             │ └──────┘  │    └────────┘ └──────────────┘
             │           │
        ┌────▼───────────▼────┐
        │     Activity        │
        │ (class/camp/tourn/  │
        │  training/match/    │
        │  fitness/review)    │
        └─────────┬───────────┘
                  │
        ┌─────────▼───────────┐
        │   ReviewSummary     │
        │   + Recommendation  │
        └─────────────────────┘
```

---

## 1. User (REFACTOR existing)

The User model becomes multi-role. Adds `clubAdmin` role and `club` association.

```js
const UserSchema = new Schema({
  // --- Auth ---
  email:            { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:         { type: String, required: true, minlength: 6 },
  refreshToken:     { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  inviteToken:      { type: String },
  inviteExpires:    { type: Date },

  // --- Identity ---
  firstName:        { type: String, required: true, trim: true },
  lastName:         { type: String, required: true, trim: true },
  phone:            { type: String, trim: true },
  avatarUrl:        { type: String },

  // --- Role --- CHANGED: added 'clubAdmin'
  role: {
    type: String,
    enum: ['coach', 'parent', 'clubAdmin', 'player'],
    required: true
  },

  // --- Club association --- NEW
  club: { type: Schema.Types.ObjectId, ref: 'Club' },

  // --- Role-specific profiles ---
  coachProfile: {
    specialization: String,      // e.g. "Tennis 10", "performance", "general"
    itfLevel:       String,
    bio:            String,
    assignedGroups: [{ type: Schema.Types.ObjectId, ref: 'Group' }]
  },

  parentProfile: {
    children: [{ type: Schema.Types.ObjectId, ref: 'Player' }]
  },

  adminProfile: {
    permissions: [String]        // e.g. ['manage_groups', 'view_reports', 'manage_coaches']
  },

  // --- Subscription (keep for future) ---
  subscription: {
    plan:     { type: String, enum: ['free', 'pilot', 'premium'], default: 'free' },
    status:   { type: String, enum: ['active', 'trialing', 'expired', 'cancelled'], default: 'active' },
    stripeCustomerId:     String,
    stripeSubscriptionId: String,
    trialEndsAt:          Date,
    currentPeriodEnd:     Date
  },

  // --- Settings ---
  notificationSettings: {
    weeklyEmail:       { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    quietHoursStart:   { type: String, default: '22:00' },
    quietHoursEnd:     { type: String, default: '07:00' }
  },

  onboardingCompleted: { type: Boolean, default: false },
  isActive:            { type: Boolean, default: true }
}, { timestamps: true });

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ club: 1, role: 1 });
```

### Migration notes from current model:
- ADD `club` field (ObjectId ref)
- ADD `clubAdmin` and `player` to role enum
- ADD `adminProfile` sub-document
- ADD `assignedGroups` to coachProfile
- RENAME `coachProfile.club` (String) → remove (use top-level `club` ObjectId instead)
- REMOVE wearable-specific notification settings (recoveryThreshold, hrvDrop, etc.)
- CHANGE subscription plans from ['free','premium','family'] → ['free','pilot','premium']

---

## 2. Club (NEW)

```js
const ClubSchema = new Schema({
  name:        { type: String, required: true, trim: true },
  shortName:   { type: String, trim: true },              // e.g. "WKT" for display
  city:        { type: String, trim: true },
  address:     { type: String, trim: true },
  phone:       { type: String, trim: true },
  email:       { type: String, trim: true },
  website:     { type: String, trim: true },
  logoUrl:     { type: String },

  // Club classification
  pztLicense:  { type: String },                           // PZT license number
  pztCertified: { type: Boolean, default: false },         // PZT quality certification
  surfaces:    [{ type: String, enum: ['clay', 'hard', 'grass', 'carpet', 'indoor-hard'] }],
  courtsCount: { type: Number },

  // Pathway configuration
  pathwayStages: [{
    name:        { type: String, required: true },         // e.g. "Tennis 10 Red", "Tennis 10 Orange"
    order:       { type: Number, required: true },
    description: { type: String },
    ageRange:    { min: Number, max: Number },
    color:       { type: String }                          // for UI display
  }],

  // People
  owner:       { type: Schema.Types.ObjectId, ref: 'User' },  // club owner user
  admins:      [{ type: Schema.Types.ObjectId, ref: 'User' }],
  coaches:     [{ type: Schema.Types.ObjectId, ref: 'User' }],

  // Settings
  settings: {
    defaultCurrency: { type: String, default: 'PLN' },
    timezone:        { type: String, default: 'Europe/Warsaw' },
    language:        { type: String, default: 'pl' }
  },

  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Indexes
ClubSchema.index({ name: 1 });
ClubSchema.index({ city: 1 });
ClubSchema.index({ pztLicense: 1 }, { sparse: true });
```

### Default pathway stages for Tennis 10 clubs:
```js
const DEFAULT_PATHWAY_STAGES = [
  { name: 'Tennis 10 — Czerwony',  order: 1, ageRange: { min: 4, max: 7 },  color: '#EF4444' },
  { name: 'Tennis 10 — Pomarańczowy', order: 2, ageRange: { min: 7, max: 9 },  color: '#F97316' },
  { name: 'Tennis 10 — Zielony',   order: 3, ageRange: { min: 9, max: 10 }, color: '#22C55E' },
  { name: 'Junior — Początkujący', order: 4, ageRange: { min: 10, max: 12 }, color: '#3B82F6' },
  { name: 'Junior — Zaawansowany', order: 5, ageRange: { min: 12, max: 14 }, color: '#6366F1' },
  { name: 'Kadra — Performance',   order: 6, ageRange: { min: 14, max: 18 }, color: '#8B5CF6' },
  { name: 'Dorosły — Rekreacja',   order: 7, ageRange: { min: 18, max: 99 }, color: '#6B7280' }
];
```

---

## 3. Group (NEW)

Groups organize players within a club (e.g. "Tennis 10 Red Monday/Wednesday", "U12 Competition").

```js
const GroupSchema = new Schema({
  club:        { type: Schema.Types.ObjectId, ref: 'Club', required: true },
  name:        { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  coach:       { type: Schema.Types.ObjectId, ref: 'User' },
  pathwayStage: { type: String },                          // references Club.pathwayStages.name
  players:     [{ type: Schema.Types.ObjectId, ref: 'Player' }],
  schedule: {
    dayOfWeek:  [{ type: Number, min: 0, max: 6 }],       // 0=Sunday
    startTime:  String,                                     // "16:00"
    endTime:    String,                                     // "17:00"
    surface:    String
  },
  maxPlayers:  { type: Number },
  isActive:    { type: Boolean, default: true }
}, { timestamps: true });

// Indexes
GroupSchema.index({ club: 1 });
GroupSchema.index({ coach: 1 });
```

---

## 4. Player (REFACTOR existing)

```js
const PlayerSchema = new Schema({
  // --- Identity ---
  firstName:    { type: String, required: true, trim: true },
  lastName:     { type: String, required: true, trim: true },
  dateOfBirth:  { type: Date },
  gender:       { type: String, enum: ['M', 'F'] },
  avatarUrl:    { type: String },

  // --- Associations ---
  club:         { type: Schema.Types.ObjectId, ref: 'Club' },
  coach:        { type: Schema.Types.ObjectId, ref: 'User' },
  parents:      [{ type: Schema.Types.ObjectId, ref: 'User' }],
  groups:       [{ type: Schema.Types.ObjectId, ref: 'Group' }],

  // --- Pathway (NEW - core of ServeIQ) ---
  pathwayStage: { type: String },                          // current stage name
  pathwayHistory: [{
    stage:     String,
    startDate: Date,
    endDate:   Date,
    notes:     String
  }],
  developmentLevel: {
    type: String,
    enum: ['beginner', 'tennis10', 'committed', 'advanced', 'performance'],
    default: 'beginner'
  },

  // --- Skills (simplified from current 0-100 score) ---
  skills: {
    serve:     { score: { type: Number, min: 0, max: 5, default: 0 }, notes: String },
    forehand:  { score: { type: Number, min: 0, max: 5, default: 0 }, notes: String },
    backhand:  { score: { type: Number, min: 0, max: 5, default: 0 }, notes: String },
    volley:    { score: { type: Number, min: 0, max: 5, default: 0 }, notes: String },
    movement:  { score: { type: Number, min: 0, max: 5, default: 0 }, notes: String },
    tactics:   { score: { type: Number, min: 0, max: 5, default: 0 }, notes: String },
    mental:    { score: { type: Number, min: 0, max: 5, default: 0 }, notes: String },
    fitness:   { score: { type: Number, min: 0, max: 5, default: 0 }, notes: String }
  },

  // --- Rankings (keep) ---
  ranking: {
    pzt: Number,
    te:  Number,
    wta: Number,
    atp: Number
  },

  // --- Training plan (simplified) ---
  trainingPlan: {
    weeklyGoal: {
      sessionsPerWeek: { type: Number, default: 3 },
      hoursPerWeek:    { type: Number, default: 4 }
    },
    focus:    [String],                                    // current focus areas
    notes:    String
  },

  active: { type: Boolean, default: true }
}, { timestamps: true });

// Indexes
PlayerSchema.index({ club: 1, pathwayStage: 1 });
PlayerSchema.index({ coach: 1 });
PlayerSchema.index({ 'parents': 1 });
PlayerSchema.index({ club: 1, active: 1 });
```

### Migration notes from current model:
- ADD `club`, `groups`, `pathwayStage`, `pathwayHistory`, `developmentLevel`
- CHANGE skills score from 0-100 → 0-5 (simpler, more practical for coaches)
- ADD `movement`, `mental` skill categories
- REMOVE `goals` array (moved to separate DevelopmentGoal model)
- REMOVE `trainingPlan.milestones` (moved to separate model)
- REMOVE `trainingPlan.scheduledDays` (handled by Group.schedule)
- REMOVE `monthlyRate` (payment is out of MVP scope)

---

## 5. Activity (NEW — replaces Session + Tournament)

This is the **shared backbone** of ServeIQ. Generic activity model supporting all types.

```js
const ActivitySchema = new Schema({
  // --- Core ---
  club:        { type: Schema.Types.ObjectId, ref: 'Club' },
  type: {
    type: String,
    enum: ['class', 'camp', 'tournament', 'training', 'match', 'fitness', 'review', 'other'],
    required: true
  },
  title:       { type: String, required: true, trim: true },
  description: { type: String, trim: true },

  // --- Timing ---
  date:        { type: Date, required: true },
  endDate:     { type: Date },                             // for multi-day (camps, tournaments)
  startTime:   { type: String, trim: true },               // "16:00"
  endTime:     { type: String, trim: true },               // "17:30"
  durationMinutes: { type: Number },

  // --- People ---
  players:     [{ type: Schema.Types.ObjectId, ref: 'Player' }],
  coach:       { type: Schema.Types.ObjectId, ref: 'User' },
  createdBy:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  group:       { type: Schema.Types.ObjectId, ref: 'Group' },

  // --- Context ---
  location:    { type: String, trim: true },
  surface:     { type: String, enum: ['clay', 'hard', 'grass', 'carpet', 'indoor-hard', ''] },
  status: {
    type: String,
    enum: ['planned', 'in-progress', 'completed', 'cancelled'],
    default: 'planned'
  },

  // --- Content ---
  focusAreas:  [String],                                   // what was worked on
  notes:       { type: String, trim: true },               // coach notes
  parentNotes: { type: String, trim: true },               // visible to parent

  // --- Tournament-specific (only when type='tournament') ---
  tournamentData: {
    category:  String,                                     // e.g. "U12", "U14"
    drawSize:  Number,
    result: {
      round:   String,                                     // "Final", "SF", "QF", "R16"
      wins:    Number,
      losses:  Number,
      scores:  [String]                                    // ["6-3", "4-6", "7-5"]
    }
  },

  // --- Attendance (for classes/camps) ---
  attendance: [{
    player:  { type: Schema.Types.ObjectId, ref: 'Player' },
    status:  { type: String, enum: ['present', 'absent', 'late', 'excused'], default: 'present' }
  }],

  // --- Visibility ---
  visibleToParent: { type: Boolean, default: true },

  // --- Tags for filtering ---
  tags: [String]
}, { timestamps: true });

// Indexes
ActivitySchema.index({ club: 1, date: -1 });
ActivitySchema.index({ 'players': 1, date: -1 });
ActivitySchema.index({ coach: 1, date: -1 });
ActivitySchema.index({ group: 1, date: -1 });
ActivitySchema.index({ type: 1, date: -1 });
ActivitySchema.index({ club: 1, type: 1, status: 1 });
```

### Replaces:
- **Session model** → Activity with type='training'/'class'/'fitness'/'match'
- **Tournament model** → Activity with type='tournament' + tournamentData

---

## 6. DevelopmentGoal (NEW)

Extracted from Player.goals to be a first-class entity.

```js
const DevelopmentGoalSchema = new Schema({
  player:      { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  club:        { type: Schema.Types.ObjectId, ref: 'Club' },
  createdBy:   { type: Schema.Types.ObjectId, ref: 'User', required: true },

  // --- Goal definition ---
  title:       { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category: {
    type: String,
    enum: [
      'fundamentals',    // basic technique
      'movement',        // footwork, agility
      'consistency',     // rally tolerance
      'confidence',      // mental strength
      'match-routines',  // competition habits
      'recovery',        // rest, health habits
      'school-balance',  // academic coordination
      'fitness',         // physical development
      'tactics',         // game understanding
      'serve',           // specific technical
      'other'
    ],
    default: 'fundamentals'
  },

  // --- Timeframe ---
  timeframe: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly', 'seasonal', 'yearly'],
    default: 'monthly'
  },
  startDate:   { type: Date, default: Date.now },
  targetDate:  { type: Date },

  // --- Status ---
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'dropped'],
    default: 'active'
  },
  completedAt: { type: Date },
  progress:    { type: Number, min: 0, max: 100, default: 0 },

  // --- Visibility ---
  visibleToParent: { type: Boolean, default: true },
  visibleToPlayer: { type: Boolean, default: true }
}, { timestamps: true });

// Indexes
DevelopmentGoalSchema.index({ player: 1, status: 1 });
DevelopmentGoalSchema.index({ club: 1, category: 1 });
```

---

## 7. Observation (NEW)

Lightweight progress notes — the continuity engine.

```js
const ObservationSchema = new Schema({
  player:      { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  club:        { type: Schema.Types.ObjectId, ref: 'Club' },
  activity:    { type: Schema.Types.ObjectId, ref: 'Activity' },   // optional link
  author:      { type: Schema.Types.ObjectId, ref: 'User', required: true },

  // --- Content ---
  type: {
    type: String,
    enum: ['progress', 'concern', 'highlight', 'participation', 'general'],
    default: 'general'
  },
  text:        { type: String, required: true, trim: true },

  // --- Quick signals ---
  engagement:  { type: Number, min: 1, max: 5 },          // 1=low, 5=excellent
  effort:      { type: Number, min: 1, max: 5 },
  mood:        { type: Number, min: 1, max: 5 },

  // --- Focus area link ---
  focusAreas:  [String],                                   // tags like "serve", "movement"
  goalRef:     { type: Schema.Types.ObjectId, ref: 'DevelopmentGoal' },

  // --- Visibility ---
  visibleToParent: { type: Boolean, default: true },
  pinned:      { type: Boolean, default: false }           // pinned to timeline
}, { timestamps: true });

// Indexes
ObservationSchema.index({ player: 1, createdAt: -1 });
ObservationSchema.index({ activity: 1 });
ObservationSchema.index({ author: 1, createdAt: -1 });
ObservationSchema.index({ player: 1, type: 1 });
```

---

## 8. ReviewSummary (NEW)

Periodic synthesis — the strongest value point for parents.

```js
const ReviewSummarySchema = new Schema({
  player:      { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  club:        { type: Schema.Types.ObjectId, ref: 'Club' },
  author:      { type: Schema.Types.ObjectId, ref: 'User', required: true },

  // --- Review period ---
  periodType: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly', 'seasonal', 'ad-hoc'],
    default: 'monthly'
  },
  periodStart: { type: Date, required: true },
  periodEnd:   { type: Date, required: true },

  // --- Structured content ---
  whatHappened:    { type: String, trim: true },            // summary of activities
  whatWentWell:    { type: String, trim: true },            // positives
  whatNeedsFocus:  { type: String, trim: true },            // areas for improvement
  nextSteps:       { type: String, trim: true },            // recommended actions

  // --- Linked data ---
  activitiesCount: { type: Number, default: 0 },
  goalsReviewed:   [{ type: Schema.Types.ObjectId, ref: 'DevelopmentGoal' }],
  observations:    [{ type: Schema.Types.ObjectId, ref: 'Observation' }],

  // --- AI assistance ---
  aiGenerated:     { type: Boolean, default: false },
  aiDraft:         { type: String },                       // raw AI output before coach edit

  // --- Status ---
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  publishedAt: { type: Date },

  // --- Visibility ---
  visibleToParent: { type: Boolean, default: true }
}, { timestamps: true });

// Indexes
ReviewSummarySchema.index({ player: 1, periodEnd: -1 });
ReviewSummarySchema.index({ club: 1, status: 1 });
ReviewSummarySchema.index({ author: 1, createdAt: -1 });
```

---

## 9. Recommendation (NEW)

Actionable next steps — makes the system feel alive.

```js
const RecommendationSchema = new Schema({
  player:      { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  club:        { type: Schema.Types.ObjectId, ref: 'Club' },
  author:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  review:      { type: Schema.Types.ObjectId, ref: 'ReviewSummary' },

  // --- Content ---
  type: {
    type: String,
    enum: [
      'pathway-advance',    // move to next stage
      'focus-change',       // change development focus
      'activity-suggest',   // suggest specific activity (camp, tournament, etc.)
      'workload-adjust',    // increase/decrease load
      'support-need',       // needs extra support (psychologist, fitness, etc.)
      'general'
    ],
    required: true
  },
  title:       { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },

  // --- Status ---
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in-progress', 'completed', 'dismissed'],
    default: 'pending'
  },
  resolvedAt:  { type: Date },
  resolvedBy:  { type: Schema.Types.ObjectId, ref: 'User' },

  // --- Visibility ---
  visibleToParent: { type: Boolean, default: true }
}, { timestamps: true });

// Indexes
RecommendationSchema.index({ player: 1, status: 1 });
RecommendationSchema.index({ club: 1, status: 1, priority: -1 });
```

---

## 10. TimelineEntry (NEW — virtual/computed)

The timeline is NOT a stored model. It is a **virtual aggregation** from:
- Activities (with player linkage)
- Observations
- ReviewSummaries (when published)
- Recommendations (when created)
- Pathway changes (from Player.pathwayHistory)

### Timeline API response shape:
```js
{
  id:        String,           // source model _id
  source:    'activity' | 'observation' | 'review' | 'recommendation' | 'pathway',
  date:      Date,
  type:      String,           // activity type, observation type, etc.
  title:     String,
  summary:   String,           // short text
  author:    { name, role },
  player:    { name, avatar },
  pinned:    Boolean,
  metadata:  Object            // source-specific extra fields
}
```

---

## 11. Models to KEEP (minimal changes)

### Message (keep as-is)
- Already supports User-to-User with player context
- Works for coach-parent communication

### Notification (REFACTOR types)
Change type enum:
```js
enum: [
  'review_published',     // new review available
  'recommendation_new',   // new recommendation
  'activity_reminder',    // upcoming activity
  'pathway_change',       // player moved stages
  'observation_added',    // new observation on your child
  'goal_completed',       // development goal achieved
  'system'                // system notifications
]
```
Remove: 'health_alert', 'recovery_low', 'recovery_high', 'device_disconnected', 'sync_error'

---

## 12. Models to REMOVE / DEFER

| Model | Action | Reason |
|-------|--------|--------|
| WearableDevice | REMOVE | Out of MVP scope |
| WearableData | REMOVE | Out of MVP scope |
| BetaSignup | KEEP | Still useful for landing page |
| Payment | DEFER | Keep file but don't build new features |

---

## 13. Migration Checklist

- [ ] Create Club model
- [ ] Create Group model
- [ ] Refactor User model (add clubAdmin role, club ref, adminProfile)
- [ ] Refactor Player model (add pathway fields, groups, simplify skills)
- [ ] Create Activity model (replaces Session + Tournament)
- [ ] Create DevelopmentGoal model
- [ ] Create Observation model
- [ ] Create ReviewSummary model
- [ ] Create Recommendation model
- [ ] Refactor Notification types
- [ ] Create data migration script for existing Session → Activity
- [ ] Create data migration script for existing Tournament → Activity
- [ ] Create data migration script for Player.goals → DevelopmentGoal
- [ ] Remove WearableDevice model
- [ ] Remove WearableData model
- [ ] Update all controllers and routes
- [ ] Update all frontend API calls
