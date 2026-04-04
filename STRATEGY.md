# ServeIQ — Strategic Vision & MVP Roadmap

> **Document purpose**: North-star guide for development. Every feature, design decision, and sprint priority should trace back to this document.
> **Last updated**: 2026-04-02
> **Commercial target**: First paid pilot by end of Q2 2026, 2-4 paying clubs by end of 2026

---

## 1. Strategic Pivot

**FROM**: Parent-first wearable health monitoring platform (individual player focus)
**TO**: Club-first junior development operating system with Tennis 10 as commercial entry wedge

**Why pivot**:
- Wearable monitoring is a feature, not a business — clubs are the economic buyer
- Tennis 10 is where club economics and family trust meet — strongest revenue engine for clubs
- Polish market has 311 licensed clubs, 1,377 coaches, 22 quality-certified clubs — reachable B2B target
- Clubs already prioritize Tennis 10 — ServeIQ attaches to existing budget, not creating new one

---

## 2. Positioning

### One-liner (commercial)
> ServeIQ helps tennis clubs grow junior participation, engage families, and build a visible pathway from Tennis 10 to long-term player development.

### Tighter version
> ServeIQ is the junior tennis growth and development operating system for clubs.

### What ServeIQ is NOT in 2026
- Not a generic booking/scheduling tool
- Not a social media platform
- Not a wearable dashboard
- Not a sponsor marketplace
- Not a federation reporting system
- Not "Sonia's app" — Sonia is client zero for validation, not the brand

---

## 3. Two-Engine Strategy

### Engine 1: Revenue (NOW)
**Tennis 10 / junior club growth** — what clubs buy today
- More kids joining
- Better conversion from trial to regular participation
- Stronger parent communication
- Less dropout
- Visible next step after mini-tennis

### Engine 2: Differentiation (MOAT)
**Development pathway from beginner to serious player** — validated through Sonia as client zero
- Structured development plans
- Multi-stakeholder coordination
- Process-over-results philosophy
- Support team collaboration
- Same workflow scales from Tennis 10 to elite

**Principle**: Sell the simple story. Build the stronger spine.

---

## 4. Stakeholders & Buying Logic

### Economic Buyers
| Priority | Who | Why they buy |
|----------|-----|-------------|
| 1st | Club owner / academy owner | Growth, retention, pathway continuity, premium image |
| 2nd | Premium families | Coordination, clarity, structured progression |
| 3rd | Ambitious independent coaches | Workflow efficiency, visibility, monetization |

### Operational Users
| Role | Primary need |
|------|-------------|
| Club admin / junior coordinator | Reduce scheduling, attendance, communication chaos |
| Coach | Daily workflow: plan, notes, feedback, parent updates |
| Parent | Clarity: know the plan, see progress, less WhatsApp chasing |
| Player | Fun, motivation, progress visibility (light role in MVP) |

### Ecosystem Contributors (Phase 3+)
- Fitness coach, psychologist, sparring partner, nutritionist
- Federation / regional association (much later)

### Missing from original model — Club Admin
**This is the person who suffers most from chaos**: scheduling, attendance, rescheduling, payments follow-up, communication, camps/events logistics. If ServeIQ saves them time, the club owner sees value fast.

---

## 5. Value Propositions by Stakeholder

### For Club Owners
1. **Grow revenue** through better program occupancy, events, camps, and member engagement
2. **Improve retention** by giving families clearer development pathways and stronger community
3. **Reduce admin complexity** across communication, scheduling, and reporting
4. **Differentiate the club** with modern, development-first experience (not just court access)
5. **Pathway intelligence** — keep players and families longer through structured journeys

### For Parents
1. **One clear view** of child's plan, schedule, communication, and development journey
2. **Process-based progress** — not only match outcomes, but development indicators
3. **Coordinate everything** — tennis, health, recovery, school obligations
4. **Less stress** — no more chasing coaches on WhatsApp for updates
5. **Trust** — "I know what the plan is, I see progress, I understand what my child needs next"

### For Coaches
1. **One workflow** — planning, communication, notes, attendance, feedback, billing
2. **Visible methodology** — make coaching approach structured, repeatable, scalable
3. **Better collaboration** with parents, club staff, and support teams
4. **Daily time savings** — reduce unpaid admin work and context switching
5. **Monetize expertise** — digital programs and methods beyond on-court hours (future)

### For Players
**Juniors / Tennis 10**:
- Fun, motivating journey with goals, habits, and progress markers
- Feel part of a team and community
- Feedback that is understandable and encouraging

**Advanced / Pro pathway**:
- Manage training, recovery, competition in one space
- Long-term development through structured objectives
- Build visibility for future opportunities (future phase)

---

## 6. Guiding Principles

| # | Principle | What it means |
|---|-----------|--------------|
| 1 | **Process over outcomes** | Reinforce long-term development, reflection, adjustment — not win-at-all-costs |
| 2 | **Age-appropriate development** | For kids: enjoyment, fundamentals, wellbeing, sustainable progression |
| 3 | **Community as competitive advantage** | Clubs win when they create belonging, not only coaching sessions |
| 4 | **One connected ecosystem** | Replace fragmentation across chats, spreadsheets, tools, and disconnected data |
| 5 | **Data must drive action** | Tracking matters only if it improves coaching, planning, and decisions |
| 6 | **Coach workflow first** | If coaches don't use it daily, the system won't stick |
| 7 | **Parent trust through transparency** | Families need clarity, not noise |
| 8 | **Healthy ambition** | Support disciplined growth without overload or unhealthy comparison |
| 9 | **Modular journey** | Support different maturity: community club, competitive pathway, independent coach |

---

## 7. MVP Objective

> Validate that ServeIQ can help tennis clubs and families manage junior development journeys through one shared workflow for planning, communication, progression tracking, and next-step recommendations.

### MVP must prove two things:

**Commercial proof**:
- Clubs see value in Tennis 10 / junior pathway continuity
- Parents and coaches feel reduction of chaos and stronger alignment

**Product proof**:
- Same workflow supports advanced Sonia-type development journey
- ServeIQ is not just mini-tennis admin — it's a real development operating layer

### Core MVP Workflow (shared loop)
```
Plan → Communicate → Monitor → Review → Recommend next step
```

This loop must work for BOTH scenarios:

**Scenario A — Tennis 10 / Junior Club**
- Class / camp / event planning
- Parent communication
- Participation monitoring
- Progression observation
- Recommendation for next stage

**Scenario B — Sonia / Advanced Pathway**
- Training / tournament / camp planning
- Team communication
- Process monitoring
- Review and adjustment
- Next-step recommendation

---

## 8. MVP Data Objects

### A. Player Profile
- Basic info, age, category
- Club affiliation, development stage
- Linked parent(s) and coach(es)
- **Foundation for both Tennis 10 and Sonia case**

### B. Parent / Guardian Profile
- Linked player(s), contact details
- Role in communication
- **Parents are core to junior tennis workflow**

### C. Coach Profile
- Name, role, assigned players/groups
- Club affiliation
- **Workflow is coach-led even if club buys**

### D. Club / Organization
- Club info, junior coordinator
- Groups / cohorts
- **NEW entity — not in current codebase**

### E. Activity / Plan Item (GENERIC — not hardcoded to "session")
Types: `class` | `camp` | `tournament` | `match` | `training` | `fitness` | `review` | `other`
- Date/time, type, owner, linked player(s), notes, status
- **This is the shared backbone across simple and advanced cases**

### F. Development Goal / Focus Area
- Goal title, timeframe, owner, linked player, status, comments
- Examples: fundamentals, movement, consistency, confidence, match routines
- **Central to ServeIQ philosophy — process over results**

### G. Observation / Progress Update
- Participation, engagement, coach note, parent note
- Simple progress signal, challenge/concern
- **Creates continuity instead of isolated sessions**

### H. Review Summary
- What happened, what went well, what needs focus, recommended next step
- **One of strongest value points for parents and clubs**

### I. Recommendation / Next Step
- Actionable: "move to next level", "attend summer camp", "focus on serve fundamentals"
- **Data without next action feels weak**

---

## 9. MVP Views (must-have screens)

### 1. Shared Timeline / Feed
One place where key updates appear: activities, notes, reviews, next steps.
**Likely the most important UI element.**

### 2. Player Journey View
Current stage → active goals → recent activity → recent review → next recommendation.
**Helps both parents and coaches.**

### 3. Club / Group Dashboard
Players/groups, stage/pathway, participation snapshot, next-step visibility.
**Makes it commercially relevant for club buyers.**

### 4. Role-Based Views
- Coach view (planning, notes, group management)
- Parent view (child journey, communication, updates)
- Club coordinator/admin view (overview, groups, pathway)
- Player view (lighter in MVP)

---

## 10. Three Maturity Levels (one model)

| Level | Who | What they see |
|-------|-----|--------------|
| **Level 1 — Beginner / Tennis 10** | New families, mini-tennis kids | Participation, parent communication, simple progression, next activity |
| **Level 2 — Committed Junior** | Regular club juniors | Development goals, practice/camp/tournament planning, reviews, alignment |
| **Level 3 — Advanced Pathway** | Sonia-type players | Richer planning, support team roles, detailed notes, structured reviews |

**MVP exposes Levels 1 and 2 well, and shows Level 3 is possible.**

---

## 11. Product Architecture — Five Pillars

| Pillar | Purpose | MVP Priority |
|--------|---------|-------------|
| **Club OS** | Scheduling, attendance, communication, reporting | Medium (club dashboard) |
| **Development OS** | Plans, objectives, progress, reviews, marginal gains | HIGH — core differentiator |
| **Community OS** | Events, leagues, challenges, social engagement | Low (future) |
| **Coach OS** | Methods, notes, feedback workflows, monetization | Medium (daily workflow) |
| **Player Pathway OS** | Junior development, parent support, performance journey | HIGH — commercial story |

---

## 12. Sonia as Client Zero

### What Sonia provides:
- **Product philosophy**: process over results, balanced management, marginal gains
- **Credibility in sales**: "built from real high-performance junior pathway needs"
- **Architecture stress-test**: if workflow supports Sonia, it supports anyone
- **Data model inspiration**: tournament planning, training load, match reflection, school balance

### How to use Sonia's track record:
> National Champion U12 singles, doubles, team. National Championship U14 singles, 2 doubles plus silver and bronze. Tennis Europe wins and 10+ national medals.

**DO**: "Built from real operational needs of an ambitious junior tennis pathway"
**DON'T**: "App of a champion" or "buy because Sonia won medals"

### Performance Circle (future — NOT MVP)
Team around Sonia: head coach, sparring partner, fitness coach, psychologist
- Initially: collaboration and visibility layer
- Later: marketplace/network model
- **In MVP**: just ensure role model is flexible enough to add expert roles later

---

## 13. EPIC Decomposition

### EPIC 1 — Identity, Roles & Core Profiles
- User authentication (keep existing JWT)
- Club / organization entity (NEW)
- Player profile (refactor from current)
- Parent profile (refactor from current)
- Coach profile (refactor from current)
- Club admin / coordinator role (NEW)
- Role-based access and linking
- **Sprint**: Week 2

### EPIC 2 — Player Journey & Pathway Model
- Pathway stages definition (Tennis 10 → beginner → intermediate → committed → advanced)
- Current stage assignment per player
- Stage history
- Player journey summary view
- "Recommended next step" field
- Simple progression markers
- **Sprint**: Weeks 3-4

### EPIC 3 — Activity Planning Engine
- Generic activity model (replaces rigid "session" model)
- Activity types: class, camp, tournament, training, match, fitness, review, other
- Create/edit/delete activities
- Assign activity to player(s)
- Calendar/timeline placement
- Status tracking
- **Sprint**: Weeks 3-4

### EPIC 4 — Communication & Shared Timeline
- Timeline/feed per player
- Timeline entries from activities, notes, reviews
- Role-based visibility (parent sees different than coach)
- Parent-friendly update format
- Coach notes
- Pinned next actions
- **Sprint**: Week 4-5

### EPIC 5 — Progress Tracking & Observations
- Development goals / focus areas per player
- Quick observation entries
- Participation / engagement markers
- Coach comments, parent comments
- Active focus areas display in player journey
- **Sprint**: Week 5-6

### EPIC 6 — Reviews & Recommendations
- Review summary template (what happened, went well, needs focus, next step)
- Recommendation object
- Parent-facing review view
- Lightweight AI summary generation
- **Sprint**: Week 6

### EPIC 7 — Club / Group Dashboard
- Group / cohort management
- Player list by stage
- Recent activity / upcoming activities
- Players needing follow-up
- Pathway visibility overview
- Tennis 10 → next-stage conversion view
- **Sprint**: Week 7

### EPIC 8 — Demo Readiness & Pilot Operations
- Seeded demo environment (Tennis 10 scenario + Sonia scenario)
- Sample reviews/recommendations
- Onboarding flow for pilot clubs
- Feedback capture mechanism
- Polished role-based views
- **Sprint**: Week 8

---

## 14. Explicitly OUT OF SCOPE for MVP

| Feature | Why excluded |
|---------|-------------|
| Full booking engine | Broad scope, many competitors |
| Integrated payment processing | Stripe exists but not priority for validation |
| Marketplace / expert directory | Future moat, not MVP centerpiece |
| Wearable integrations (WHOOP/Garmin) | Feature, not core value — defer |
| Nutrition / health tracking in depth | Too niche for club sales |
| Sponsor / partner visibility | Future phase |
| Advanced analytics dashboards | Data without action is weak |
| Social media automation | Distraction from core loop |
| Federation reporting | Much later |
| Complex billing / reporting engine | Post-validation |
| Open chat replacement | WhatsApp is not the enemy to kill first |
| Complex multi-tenant permissions | Simplify for MVP |
| Match statistics engine | Advanced, not needed for pathway story |
| Community league engine | Phase 2+ |

---

## 15. Weekly Sprint Plan (13 weeks)

### Phase 1 — Foundation (Weeks 1-4)
*Theme: Architecture + first internal MVP*

**Week 1 (March 30 - April 5) — Lock Direction** ✅ IN PROGRESS
- Freeze MVP definition (this document)
- Define final data model and relationships
- Define core workflows for Tennis 10 + Sonia scenarios
- Create wireframes for 5 key screens
- Define primary ICP and value proposition
- Prepare shortlist of 20 prospects

**Week 2 (April 6-12) — Core Entities**
- Refactor auth to support club/admin role
- Create Club entity and relationships
- Refactor Player, Parent, Coach profiles for new model
- Implement relational links (club→coach→player→parent)
- Base UI shell with role-based navigation

**Week 3 (April 13-19) — Planning Backbone**
- Implement generic Activity model (replace rigid Session)
- Activity types and create/edit flows
- Link activities to players
- Simple timeline rendering
- Validate against Tennis 10 AND Sonia scenarios
- Start pathway stage model

**Week 4 (April 20-26) — Internal MVP v0.1**
- Shared timeline/feed pulling activities + notes
- Lightweight coach notes
- Parent-facing update format
- Polish 3 key screens for internal demo
- Internal demo script ready
- **CHECKPOINT: can show plan + communicate + monitor**

### Phase 2 — Value Layer (Weeks 5-8)
*Theme: Make it valuable and demoable*

**Week 5 (April 27 - May 3) — Development Logic**
- Goals / focus areas implementation
- Progress/observation entries
- Focus + recent observation in player journey view
- Progression markers
- Start real discovery demos with warm prospects

**Week 6 (May 4-10) — Review Loop**
- Review summary object and template
- Recommendation object
- Render recommendations in journey + timeline
- AI-assisted review drafting (if feasible)
- Refine pilot offer packaging
- **CHECKPOINT: complete loop Plan→Communicate→Monitor→Review→Recommend**

**Week 7 (May 11-17) — Club Relevance**
- Club/group dashboard
- Player grouping by stage
- Recent/next activity overview
- Players needing attention
- Pathway continuity indicators
- Pitch specifically to club owners

**Week 8 (May 18-24) — Demo Ready**
- Seed high-quality demo data (Tennis 10 + Sonia scenarios)
- Polish role-based views
- Clean UX rough edges
- Basic notifications/highlights
- Finalize 10-minute demo flow
- Create pitch deck
- **CHECKPOINT: demo-ready MVP for external conversations**

### Phase 3 — Sell & Validate (Weeks 9-13)
*Theme: Make it sellable and pilotable*

**Week 9 (May 25-31) — Pilot Onboarding**
- Improve onboarding for real club setup
- Easy data entry for first cohort
- Admin shortcuts
- Fix friction from early demos
- Move from discovery to pilot conversations

**Week 10 (June 1-7) — Stabilize**
- Bug fixing, UX friction reduction
- Simplify forms
- Core loop must be fast for coach
- Parent view must be clear and not overloaded
- Focused demos with harder ask: "Would you pilot this?"

**Week 11 (June 8-14) — Pilot Prep**
- Pilot-specific tweaks
- Import/setup support
- Feedback capture inside product
- Final pass on both demo scenarios
- Minimal usage analytics

**Week 12 (June 15-21) — External Validation**
- Support pilot onboarding
- Fix critical issues fast
- Improve only what blocks usage or sales
- **NO feature creep**

**Week 13 (June 22-28) — 90-Day Checkpoint**
- Stabilize final MVP build
- Document scope and next-phase roadmap
- Pipeline review: prospects, pilots, objections, conversion
- Decide next 90-day focus

---

## 16. What Exists vs. What Changes

### Keep from current codebase:
- Express + React + MongoDB + Vite stack
- JWT authentication system
- Basic user model structure
- Socket.io infrastructure (for real-time updates)
- Monorepo structure
- Railway deployment config

### Refactor significantly:
- **User model** → add club admin role, club association
- **Player model** → add pathway stage, development goals, focus areas
- **Session model** → replace with generic Activity model
- **Parent pages** → redesign around player journey (not wearable dashboard)
- **Navigation/routing** → role-based for coach, parent, club admin

### Remove or defer:
- Wearable device connection UI and backend
- WHOOP/Garmin OAuth flow
- Health metrics charts (recovery ring, HR, HRV, sleep, strain)
- Mock wearable data service
- Alert engine (health-based)
- Coach disabled page (coaches are now active users)
- Stripe subscription paywall (keep Stripe, but not as gate)

### Build new:
- Club / Organization entity
- Activity model (generic, multi-type)
- Development goals / focus areas
- Observations / progress updates
- Review summaries + recommendations
- Player journey view
- Shared timeline/feed
- Club group dashboard
- Pathway stage model

---

## 17. Business Case — Polish Market 2026

### Market Context
- **311** PZT-licensed clubs (2025)
- **1,377** licensed coaches (2026)
- **22** quality-certified clubs (PZT 2025)
- **80 mln PLN** government tennis infrastructure modernization budget
- Tennis 10 is an active, structured ecosystem with dedicated PZT materials
- ITF reports 106 million players worldwide (2024)

### Target Market for 2026
**Primary**: 20-40 most progressive clubs
- Quality-certified clubs
- Visible Tennis 10 programs
- Metro areas / affluent catchments
- Year-round camps/classes with pathway ambition

### Pricing Model

| Offer | Target | Price | Model |
|-------|--------|-------|-------|
| **Academy Pilot** | Clubs, 8-10 weeks | 8,000-15,000 PLN | One-off service + software |
| **Club Subscription** | Post-pilot clubs | 1,500-3,500 PLN/month | Monthly recurring |
| **Family Premium** | Ambitious families | 500-1,200 PLN/month | Monthly recurring |
| **Coach Pro Pilot** | Independent coaches | Low setup + monthly | Third priority |

**Pricing logic**: Value-based. If ServeIQ helps retain 10 extra kids (avg 450 PLN/mo) for 6 months = 27,000 PLN value. Pilot at 10-12k PLN is easy ROI.

### 2026 Revenue Scenarios

| Scenario | Club Pilots | Subscriptions | Families | Total |
|----------|------------|---------------|----------|-------|
| **Conservative** | 2 × 10k = 20k | 1 × 2k × 3mo = 6k | 4 × 700 × 3mo = 8.4k | **~34k PLN** |
| **Base** | 4 × 12k = 48k | 2 × 2.5k × 3mo = 15k | 8 × 800 × 4mo = 25.6k | **~89k PLN** |
| **Upside** | 6 × 12k = 72k | 3 × 3k × 4mo = 36k | 12 × 900 × 4mo = 43.2k | **~151k PLN** |

### What clubs actually pay for (not features!)
- Less chaos
- More professionalism
- Better visibility
- Stronger parent trust
- Better player development coordination
- Time saved
- Premium positioning

---

## 18. Success Criteria

### Product Success (by Week 8)
- [ ] Club can use workflow for Tennis 10 / junior players
- [ ] Parent can understand plan and recent progress without external chaos
- [ ] Coach can add meaningful updates quickly
- [ ] Sonia scenario can be represented without breaking the model

### Commercial Success (by Week 13)
- [ ] Club owner sees clear value in family engagement and pathway continuity
- [ ] Product demos in under 10 minutes with strong narrative
- [ ] At least a few prospects say "this solves a real problem"
- [ ] Willingness to discuss pilot / commercial next step
- [ ] 2-4 pilot discussions in motion

### 2026 Success
- [ ] At least 2-4 paying clubs or design partners
- [ ] Evidence that owners understand ROI story
- [ ] Repeatable demo narrative
- [ ] Proof same workflow works for Tennis 10 AND advanced pathway
- [ ] Clear learning on which feature set converts best

---

## 19. Feature Gate — Decision Rule

Every feature must pass at least ONE of these tests:

**Test A**: Does this help a club owner immediately understand value for Tennis 10 / junior pathway continuity?

**Test B**: Is this essential to the shared architecture needed for Sonia-type progression later?

**If neither → it waits.**

---

## 20. Friday Check (weekly ritual)

Every Friday, answer only these 5 questions:
1. Can we demo more value than last week?
2. Is the product still centered on the core loop?
3. Did we learn something from a real buyer/user?
4. Did we remove complexity or add it?
5. Are we closer to a paid pilot?

If answer to #5 is repeatedly "no" → building too much, selling too little.

---

## 21. Strategic Guardrails

### DO
- Enter through Tennis 10 economics
- Design architecture stress-tested by Sonia case
- Build horizontally (complete story each week, not perfect modules)
- Start pilot conversations from Week 5
- Keep coach daily workflow fast and simple

### DON'T
- Try to serve all stakeholders equally in MVP
- Build booking/payments/social/community together
- Overinvest in federation angle now
- Build sponsor functionality
- Make Sonia the whole brand
- Chase "platform completeness"
- Build marketplace dynamics in 2026

---

*This document is the single source of truth for ServeIQ development direction. All EPICs, sprints, and feature decisions should reference it.*
