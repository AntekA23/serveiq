# Parent-Coach Linking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let parents connect to coaches via a permanent invite code, with coach approval, enabling data sharing and messaging.

**Architecture:** Add `inviteCode` + `inviteActive` to User coachProfile, create a standalone `CoachRequest` model, add `coaches[]` array to Player, build a `/api/coach-links` route group, and add two frontend pages (parent "Add Coach" modal, coach "Pending Requests" section).

**Tech Stack:** Express, Mongoose, React, Zustand, existing axios API wrapper.

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Modify | `server/src/models/User.js` | Add `inviteCode`, `inviteActive` to coachProfile |
| Modify | `server/src/models/Player.js` | Add `coaches[]` array |
| Create | `server/src/models/CoachRequest.js` | New model for join requests |
| Modify | `server/src/models/Notification.js` | Add `coach_request` to type enum |
| Create | `server/src/controllers/coachLinkController.js` | All invite code + request logic |
| Create | `server/src/routes/coachLinks.js` | Route definitions |
| Modify | `server/src/index.js` | Register new route |
| Modify | `server/src/controllers/authController.js` | Generate inviteCode on coach registration |
| Create | `client/src/pages/parent/AddCoach.jsx` | Parent UI: enter code, select children, send request |
| Create | `client/src/pages/coach/CoachRequests.jsx` | Coach UI: list pending requests, accept/reject |
| Modify | `client/src/pages/coach/CoachDashboard.jsx` | Show invite code card + pending requests badge |
| Modify | `client/src/pages/parent/Dashboard.jsx` | Add "Add Coach" button |
| Modify | `client/src/components/layout/Sidebar/Sidebar.jsx` | Add nav items for new pages |

---

### Task 1: CoachRequest Model

**Files:**
- Create: `server/src/models/CoachRequest.js`

- [ ] **Step 1: Create the CoachRequest model**

```javascript
import mongoose from 'mongoose'

const coachRequestSchema = new mongoose.Schema({
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  }],
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  message: {
    type: String,
    maxlength: 500
  }
}, { timestamps: true })

coachRequestSchema.index({ coach: 1, status: 1 })
coachRequestSchema.index({ parent: 1 })
coachRequestSchema.index({ parent: 1, coach: 1, status: 1 })

const CoachRequest = mongoose.model('CoachRequest', coachRequestSchema)
export default CoachRequest
```

- [ ] **Step 2: Commit**

```bash
git add server/src/models/CoachRequest.js
git commit -m "feat: add CoachRequest model"
```

---

### Task 2: Update User Model — inviteCode Fields

**Files:**
- Modify: `server/src/models/User.js:45-50` (coachProfile section)

- [ ] **Step 1: Add inviteCode and inviteActive to coachProfile**

In `server/src/models/User.js`, find the `coachProfile` object (around line 45) and add two fields:

```javascript
  coachProfile: {
    specialization: String,
    itfLevel: String,
    bio: String,
    assignedGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
    inviteCode: {
      type: String,
      unique: true,
      sparse: true
    },
    inviteActive: {
      type: Boolean,
      default: true
    }
  },
```

- [ ] **Step 2: Add a pre-save hook to auto-generate inviteCode for coaches**

Before the `userSchema.pre('save', ...)` password hash hook, add:

```javascript
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

userSchema.pre('save', async function(next) {
  if (this.role === 'coach' && !this.coachProfile?.inviteCode) {
    let code
    let exists = true
    while (exists) {
      code = generateInviteCode()
      exists = await mongoose.model('User').findOne({ 'coachProfile.inviteCode': code })
    }
    if (!this.coachProfile) this.coachProfile = {}
    this.coachProfile.inviteCode = code
  }
  next()
})
```

Place this BEFORE the existing password-hashing pre-save hook (around line 130).

- [ ] **Step 3: Expose inviteCode in toJSON for coaches only**

In the `toJSON` transform (around line 147), the existing code deletes sensitive fields. No change needed — `inviteCode` should be visible. But verify it's not being stripped.

- [ ] **Step 4: Commit**

```bash
git add server/src/models/User.js
git commit -m "feat: add inviteCode and inviteActive to coach profile"
```

---

### Task 3: Update Player Model — coaches Array

**Files:**
- Modify: `server/src/models/Player.js:60-69` (coach/parents area)

- [ ] **Step 1: Add coaches array field**

In `server/src/models/Player.js`, after the existing `coach` field (line ~62) add:

```javascript
  coaches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
```

- [ ] **Step 2: Add index for coaches array**

After the existing indexes (around line 136), add:

```javascript
playerSchema.index({ coaches: 1 })
```

- [ ] **Step 3: Commit**

```bash
git add server/src/models/Player.js
git commit -m "feat: add coaches array to Player model"
```

---

### Task 4: Update Notification Model — coach_request Type

**Files:**
- Modify: `server/src/models/Notification.js:10-25`

- [ ] **Step 1: Add coach_request types to enum**

In the `type` enum array, add `'coach_request_new'` and `'coach_request_response'`:

```javascript
  type: {
    type: String,
    enum: [
      'review_published',
      'recommendation_new',
      'activity_reminder',
      'pathway_change',
      'observation_added',
      'goal_completed',
      'coach_request_new',
      'coach_request_response',
      'system'
    ],
    required: true
  },
```

- [ ] **Step 2: Commit**

```bash
git add server/src/models/Notification.js
git commit -m "feat: add coach_request notification types"
```

---

### Task 5: Coach Link Controller

**Files:**
- Create: `server/src/controllers/coachLinkController.js`

- [ ] **Step 1: Create controller with all 6 endpoints**

```javascript
import User from '../models/User.js'
import Player from '../models/Player.js'
import CoachRequest from '../models/CoachRequest.js'
import Notification from '../models/Notification.js'

// ── Coach: get own invite code ─────────────────────────
export const getMyCode = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    res.json({
      inviteCode: user.coachProfile?.inviteCode || null,
      inviteActive: user.coachProfile?.inviteActive ?? true
    })
  } catch (err) {
    res.status(500).json({ error: 'Blad serwera' })
  }
}

// ── Coach: reset invite code ───────────────────────────
export const resetCode = async (req, res) => {
  try {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code, exists = true
    while (exists) {
      code = ''
      for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
      exists = await User.findOne({ 'coachProfile.inviteCode': code })
    }

    await User.findByIdAndUpdate(req.user._id, {
      'coachProfile.inviteCode': code
    })

    res.json({ inviteCode: code })
  } catch (err) {
    res.status(500).json({ error: 'Blad serwera' })
  }
}

// ── Coach: toggle code active/inactive ─────────────────
export const toggleCode = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    const newState = !user.coachProfile?.inviteActive
    user.coachProfile.inviteActive = newState
    await user.save()

    res.json({ inviteActive: newState })
  } catch (err) {
    res.status(500).json({ error: 'Blad serwera' })
  }
}

// ── Parent: submit join request ────────────────────────
export const joinCoach = async (req, res) => {
  try {
    const { code, playerIds, message } = req.body

    if (!code || !playerIds?.length) {
      return res.status(400).json({ error: 'Kod i lista graczy sa wymagane' })
    }

    // Find coach by code
    const coach = await User.findOne({
      role: 'coach',
      'coachProfile.inviteCode': code.toUpperCase().trim(),
      'coachProfile.inviteActive': true
    })

    if (!coach) {
      return res.status(404).json({ error: 'Nieprawidlowy kod zaproszenia' })
    }

    // Verify players belong to this parent
    const parentChildren = req.user.parentProfile?.children || []
    const childIds = parentChildren.map(c => c.toString())
    const validPlayerIds = playerIds.filter(id => childIds.includes(id))

    if (!validPlayerIds.length) {
      return res.status(400).json({ error: 'Brak prawidlowych graczy' })
    }

    // Check for existing pending request
    const existing = await CoachRequest.findOne({
      parent: req.user._id,
      coach: coach._id,
      status: 'pending'
    })

    if (existing) {
      return res.status(409).json({ error: 'Masz juz oczekujaca prosbe do tego trenera' })
    }

    // Check which players already have this coach
    const players = await Player.find({
      _id: { $in: validPlayerIds },
      parents: req.user._id
    })

    const alreadyLinked = players.filter(p =>
      p.coaches?.some(c => c.toString() === coach._id.toString())
    )

    if (alreadyLinked.length === players.length) {
      return res.status(409).json({ error: 'Wszystkie wybrane dzieci sa juz polaczone z tym trenerem' })
    }

    const newPlayerIds = players
      .filter(p => !p.coaches?.some(c => c.toString() === coach._id.toString()))
      .map(p => p._id)

    const request = await CoachRequest.create({
      parent: req.user._id,
      coach: coach._id,
      players: newPlayerIds,
      status: 'pending',
      message: message?.slice(0, 500) || ''
    })

    // Notify coach
    const playerNames = players
      .filter(p => newPlayerIds.some(id => id.toString() === p._id.toString()))
      .map(p => `${p.firstName} ${p.lastName}`)
      .join(', ')

    await Notification.create({
      user: coach._id,
      type: 'coach_request_new',
      title: 'Nowa prosba o dolaczenie',
      body: `${req.user.firstName} ${req.user.lastName} chce dolaczyc: ${playerNames}`,
      severity: 'info',
      metadata: { requestId: request._id }
    })

    res.status(201).json({
      message: 'Prosba wyslana do trenera',
      request: {
        _id: request._id,
        coach: { firstName: coach.firstName, lastName: coach.lastName },
        status: 'pending'
      }
    })
  } catch (err) {
    res.status(500).json({ error: 'Blad serwera' })
  }
}

// ── Coach/Parent: list requests ────────────────────────
export const getRequests = async (req, res) => {
  try {
    const query = {}

    if (req.user.role === 'coach') {
      query.coach = req.user._id
      query.status = req.query.status || 'pending'
    } else {
      query.parent = req.user._id
    }

    const requests = await CoachRequest.find(query)
      .populate('parent', 'firstName lastName email phone')
      .populate('coach', 'firstName lastName coachProfile')
      .populate('players', 'firstName lastName dateOfBirth')
      .sort({ createdAt: -1 })

    res.json({ requests })
  } catch (err) {
    res.status(500).json({ error: 'Blad serwera' })
  }
}

// ── Coach: accept or reject request ────────────────────
export const respondToRequest = async (req, res) => {
  try {
    const { status } = req.body

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status musi byc accepted lub rejected' })
    }

    const request = await CoachRequest.findOne({
      _id: req.params.id,
      coach: req.user._id,
      status: 'pending'
    })

    if (!request) {
      return res.status(404).json({ error: 'Nie znaleziono prosby' })
    }

    request.status = status
    await request.save()

    if (status === 'accepted') {
      // Add coach to each player's coaches array
      await Player.updateMany(
        { _id: { $in: request.players } },
        { $addToSet: { coaches: req.user._id } }
      )

      // Also set primary coach if player doesn't have one
      await Player.updateMany(
        { _id: { $in: request.players }, coach: null },
        { $set: { coach: req.user._id } }
      )
    }

    // Notify parent
    const statusText = status === 'accepted' ? 'zaakceptowal' : 'odrzucil'
    await Notification.create({
      user: request.parent,
      type: 'coach_request_response',
      title: status === 'accepted' ? 'Prosba zaakceptowana!' : 'Prosba odrzucona',
      body: `Trener ${req.user.firstName} ${req.user.lastName} ${statusText} Twoja prosbe`,
      severity: status === 'accepted' ? 'info' : 'warning',
      metadata: { requestId: request._id }
    })

    res.json({ message: `Prosba ${statusText}`, request })
  } catch (err) {
    res.status(500).json({ error: 'Blad serwera' })
  }
}

// ── Parent: validate code (preview coach) ──────────────
export const validateCode = async (req, res) => {
  try {
    const { code } = req.query

    if (!code || code.length < 4) {
      return res.status(400).json({ error: 'Nieprawidlowy kod' })
    }

    const coach = await User.findOne({
      role: 'coach',
      'coachProfile.inviteCode': code.toUpperCase().trim(),
      'coachProfile.inviteActive': true
    }).select('firstName lastName coachProfile.specialization coachProfile.itfLevel coachProfile.bio')

    if (!coach) {
      return res.status(404).json({ error: 'Nieprawidlowy kod zaproszenia' })
    }

    res.json({
      coach: {
        _id: coach._id,
        firstName: coach.firstName,
        lastName: coach.lastName,
        specialization: coach.coachProfile?.specialization,
        itfLevel: coach.coachProfile?.itfLevel,
        bio: coach.coachProfile?.bio
      }
    })
  } catch (err) {
    res.status(500).json({ error: 'Blad serwera' })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/controllers/coachLinkController.js
git commit -m "feat: coach link controller with invite code and request endpoints"
```

---

### Task 6: Coach Link Routes + Register in index.js

**Files:**
- Create: `server/src/routes/coachLinks.js`
- Modify: `server/src/index.js`

- [ ] **Step 1: Create route file**

```javascript
import { Router } from 'express'
import { verifyToken, requireRole } from '../middleware/auth.js'
import {
  getMyCode,
  resetCode,
  toggleCode,
  joinCoach,
  getRequests,
  respondToRequest,
  validateCode
} from '../controllers/coachLinkController.js'

const router = Router()
router.use(verifyToken)

// Coach code management
router.get('/my-code', requireRole('coach'), getMyCode)
router.post('/reset-code', requireRole('coach'), resetCode)
router.patch('/toggle-code', requireRole('coach'), toggleCode)

// Parent join flow
router.get('/validate', requireRole('parent'), validateCode)
router.post('/join', requireRole('parent'), joinCoach)

// Requests (both roles)
router.get('/requests', getRequests)
router.put('/requests/:id', requireRole('coach'), respondToRequest)

export default router
```

- [ ] **Step 2: Register in index.js**

In `server/src/index.js`, add the import alongside other route imports (around line 30):

```javascript
import coachLinkRoutes from './routes/coachLinks.js'
```

And register it alongside other `app.use` calls (around line 110):

```javascript
app.use('/api/coach-links', coachLinkRoutes)
```

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/coachLinks.js server/src/index.js
git commit -m "feat: register coach-links routes"
```

---

### Task 7: Generate inviteCode for Existing Coaches

**Files:**
- Modify: `server/src/controllers/authController.js`

- [ ] **Step 1: No change needed in authController**

The pre-save hook added in Task 2 on User model automatically generates an `inviteCode` for any coach that doesn't have one when their document is saved. This covers:
- New coach registrations (register endpoint creates and saves user)
- Existing coaches (code generated on next save, or we can trigger via the `getMyCode` endpoint)

- [ ] **Step 2: Add lazy generation in getMyCode**

Already handled in Task 5 — the `getMyCode` endpoint reads the code. But to cover existing coaches who never re-save, update `getMyCode` in `coachLinkController.js` to generate on first access:

Replace the `getMyCode` function with:

```javascript
export const getMyCode = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    // Lazy generate for existing coaches
    if (!user.coachProfile?.inviteCode) {
      if (!user.coachProfile) user.coachProfile = {}
      await user.save() // pre-save hook generates the code
    }

    res.json({
      inviteCode: user.coachProfile.inviteCode,
      inviteActive: user.coachProfile.inviteActive ?? true
    })
  } catch (err) {
    res.status(500).json({ error: 'Blad serwera' })
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add server/src/controllers/coachLinkController.js
git commit -m "feat: lazy inviteCode generation for existing coaches"
```

---

### Task 8: Parent "Add Coach" Page

**Files:**
- Create: `client/src/pages/parent/AddCoach.jsx`

- [ ] **Step 1: Create the AddCoach component**

```jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'

export default function AddCoach() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [code, setCode] = useState('')
  const [coach, setCoach] = useState(null)
  const [children, setChildren] = useState([])
  const [selectedChildren, setSelectedChildren] = useState([])
  const [message, setMessage] = useState('')
  const [step, setStep] = useState('code') // code | select | sent
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/players').then(res => {
      const parentChildren = user?.parentProfile?.children || []
      const mine = res.data.filter(p => parentChildren.includes(p._id))
      setChildren(mine)
    }).catch(() => {})
  }, [user])

  const handleValidateCode = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await api.get(`/coach-links/validate?code=${code.trim()}`)
      setCoach(res.data.coach)
      setStep('select')
    } catch (err) {
      setError(err.response?.data?.error || 'Nieprawidlowy kod')
    } finally {
      setLoading(false)
    }
  }

  const toggleChild = (id) => {
    setSelectedChildren(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    if (!selectedChildren.length) {
      setError('Wybierz przynajmniej jedno dziecko')
      return
    }
    setError('')
    setLoading(true)
    try {
      await api.post('/coach-links/join', {
        code: code.trim(),
        playerIds: selectedChildren,
        message
      })
      setStep('sent')
    } catch (err) {
      setError(err.response?.data?.error || 'Blad wysylania prosby')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Dodaj trenera</h1>

      {error && (
        <div style={{
          background: 'var(--color-error-bg, #2a1215)',
          color: 'var(--color-error, #f87171)',
          padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14
        }}>{error}</div>
      )}

      {step === 'code' && (
        <>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 16, fontSize: 14 }}>
            Wpisz kod zaproszenia otrzymany od trenera
          </p>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="np. ABCD1234"
            maxLength={8}
            style={{
              width: '100%', padding: '12px 14px', fontSize: 18, letterSpacing: 4,
              textAlign: 'center', fontWeight: 700, textTransform: 'uppercase',
              background: 'var(--color-bg-secondary)', color: 'var(--color-text)',
              border: '1px solid var(--color-border-md)', borderRadius: 8,
              marginBottom: 16, boxSizing: 'border-box'
            }}
          />
          <button
            onClick={handleValidateCode}
            disabled={code.length < 4 || loading}
            style={{
              width: '100%', padding: '12px 0', background: 'var(--color-accent)',
              color: '#0B0E14', border: 'none', borderRadius: 8, fontWeight: 600,
              fontSize: 15, cursor: code.length < 4 ? 'not-allowed' : 'pointer',
              opacity: code.length < 4 ? 0.5 : 1
            }}
          >
            {loading ? 'Sprawdzanie...' : 'Sprawdz kod'}
          </button>
        </>
      )}

      {step === 'select' && coach && (
        <>
          <div style={{
            background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-md)',
            borderRadius: 12, padding: 20, marginBottom: 20
          }}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>
              {coach.firstName} {coach.lastName}
            </div>
            {coach.specialization && (
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                {coach.specialization}
              </div>
            )}
            {coach.itfLevel && (
              <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                ITF: {coach.itfLevel}
              </div>
            )}
            {coach.bio && (
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 8 }}>
                {coach.bio}
              </p>
            )}
          </div>

          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
            Wybierz dzieci do przypisania:
          </h3>

          {children.length === 0 ? (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
              Najpierw dodaj dziecko w panelu.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {children.map(child => (
                <label
                  key={child._id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    background: selectedChildren.includes(child._id)
                      ? 'var(--color-accent-muted)' : 'var(--color-bg-secondary)',
                    border: `1px solid ${selectedChildren.includes(child._id)
                      ? 'var(--color-accent)' : 'var(--color-border-md)'}`,
                    borderRadius: 8, cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedChildren.includes(child._id)}
                    onChange={() => toggleChild(child._id)}
                  />
                  <span style={{ fontWeight: 600 }}>{child.firstName} {child.lastName}</span>
                </label>
              ))}
            </div>
          )}

          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Wiadomosc do trenera (opcjonalnie)"
            maxLength={500}
            rows={3}
            style={{
              width: '100%', padding: '10px 14px', fontSize: 14, resize: 'vertical',
              background: 'var(--color-bg-secondary)', color: 'var(--color-text)',
              border: '1px solid var(--color-border-md)', borderRadius: 8,
              marginBottom: 16, boxSizing: 'border-box'
            }}
          />

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => { setStep('code'); setCoach(null); setError('') }}
              style={{
                flex: 1, padding: '12px 0', background: 'transparent',
                color: 'var(--color-text)', border: '1px solid var(--color-border-md)',
                borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer'
              }}
            >Wstecz</button>
            <button
              onClick={handleSubmit}
              disabled={!selectedChildren.length || loading}
              style={{
                flex: 2, padding: '12px 0', background: 'var(--color-accent)',
                color: '#0B0E14', border: 'none', borderRadius: 8, fontWeight: 600,
                fontSize: 15, cursor: !selectedChildren.length ? 'not-allowed' : 'pointer',
                opacity: !selectedChildren.length ? 0.5 : 1
              }}
            >
              {loading ? 'Wysylanie...' : 'Wyslij prosbe'}
            </button>
          </div>
        </>
      )}

      {step === 'sent' && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Prosba wyslana!</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 24 }}>
            Trener otrzyma powiadomienie. Poczekaj na akceptacje.
          </p>
          <button
            onClick={() => navigate('/parent/dashboard')}
            style={{
              padding: '12px 32px', background: 'var(--color-accent)',
              color: '#0B0E14', border: 'none', borderRadius: 8,
              fontWeight: 600, fontSize: 15, cursor: 'pointer'
            }}
          >Wroc do panelu</button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/parent/AddCoach.jsx
git commit -m "feat: parent AddCoach page with code validation and child selection"
```

---

### Task 9: Coach Requests Page

**Files:**
- Create: `client/src/pages/coach/CoachRequests.jsx`

- [ ] **Step 1: Create the CoachRequests component**

```jsx
import { useState, useEffect } from 'react'
import api from '../../api/axios'

export default function CoachRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState(null)

  const fetchRequests = async () => {
    try {
      const res = await api.get('/coach-links/requests?status=pending')
      setRequests(res.data.requests)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRequests() }, [])

  const handleRespond = async (id, status) => {
    setResponding(id)
    try {
      await api.put(`/coach-links/requests/${id}`, { status })
      setRequests(prev => prev.filter(r => r._id !== id))
    } catch {
    } finally {
      setResponding(null)
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Ladowanie...</div>

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
        Oczekujace prosby ({requests.length})
      </h1>

      {requests.length === 0 ? (
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
          Brak oczekujacych prosb.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {requests.map(req => (
            <div
              key={req._id}
              style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border-md)',
                borderRadius: 12, padding: 20
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                {req.parent?.firstName} {req.parent?.lastName}
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                {req.parent?.email}
              </div>

              <div style={{ fontSize: 13, marginBottom: 8 }}>
                <span style={{ color: 'var(--color-text-tertiary)' }}>Dzieci: </span>
                {req.players?.map(p => `${p.firstName} ${p.lastName}`).join(', ')}
              </div>

              {req.message && (
                <div style={{
                  fontSize: 13, color: 'var(--color-text-secondary)',
                  fontStyle: 'italic', marginBottom: 12,
                  padding: '8px 12px', background: 'var(--color-bg)',
                  borderRadius: 6
                }}>
                  "{req.message}"
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleRespond(req._id, 'accepted')}
                  disabled={responding === req._id}
                  style={{
                    flex: 1, padding: '10px 0', background: 'var(--color-accent)',
                    color: '#0B0E14', border: 'none', borderRadius: 8,
                    fontWeight: 600, fontSize: 14, cursor: 'pointer'
                  }}
                >Akceptuj</button>
                <button
                  onClick={() => handleRespond(req._id, 'rejected')}
                  disabled={responding === req._id}
                  style={{
                    flex: 1, padding: '10px 0', background: 'transparent',
                    color: 'var(--color-text)', border: '1px solid var(--color-border-md)',
                    borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer'
                  }}
                >Odrzuc</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/coach/CoachRequests.jsx
git commit -m "feat: coach requests page with accept/reject flow"
```

---

### Task 10: Coach Invite Code Card on Dashboard

**Files:**
- Modify: `client/src/pages/coach/CoachDashboard.jsx`

- [ ] **Step 1: Read current CoachDashboard structure**

Read `client/src/pages/coach/CoachDashboard.jsx` to find where to add the invite code card.

- [ ] **Step 2: Add InviteCodeCard component and pending requests badge**

At the top of the file, add a new sub-component `InviteCodeCard`:

```jsx
function InviteCodeCard() {
  const [code, setCode] = useState('')
  const [active, setActive] = useState(true)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    Promise.all([
      api.get('/coach-links/my-code'),
      api.get('/coach-links/requests?status=pending')
    ]).then(([codeRes, reqRes]) => {
      setCode(codeRes.data.inviteCode || '')
      setActive(codeRes.data.inviteActive)
      setPendingCount(reqRes.data.requests.length)
    }).finally(() => setLoading(false))
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReset = async () => {
    const res = await api.post('/coach-links/reset-code')
    setCode(res.data.inviteCode)
  }

  const handleToggle = async () => {
    const res = await api.patch('/coach-links/toggle-code')
    setActive(res.data.inviteActive)
  }

  if (loading) return null

  return (
    <div style={{
      background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-md)',
      borderRadius: 12, padding: 20, marginBottom: 20
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Kod zaproszenia</h3>
        {pendingCount > 0 && (
          <a href="/coach/requests" style={{
            background: 'var(--color-accent)', color: '#0B0E14', padding: '4px 12px',
            borderRadius: 20, fontSize: 12, fontWeight: 700, textDecoration: 'none'
          }}>
            {pendingCount} oczekujacych
          </a>
        )}
      </div>

      {active ? (
        <>
          <div style={{
            fontSize: 24, fontWeight: 700, letterSpacing: 4, textAlign: 'center',
            padding: '14px 0', background: 'var(--color-bg)', borderRadius: 8, marginBottom: 12,
            fontFamily: 'monospace'
          }}>{code}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleCopy} style={{
              flex: 1, padding: '8px 0', background: 'var(--color-accent)', color: '#0B0E14',
              border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer'
            }}>{copied ? 'Skopiowano!' : 'Kopiuj'}</button>
            <button onClick={handleReset} style={{
              padding: '8px 14px', background: 'transparent', color: 'var(--color-text)',
              border: '1px solid var(--color-border-md)', borderRadius: 8, fontSize: 13, cursor: 'pointer'
            }}>Nowy kod</button>
            <button onClick={handleToggle} style={{
              padding: '8px 14px', background: 'transparent', color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border-md)', borderRadius: 8, fontSize: 13, cursor: 'pointer'
            }}>Dezaktywuj</button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 12 }}>
            Kod jest dezaktywowany
          </p>
          <button onClick={handleToggle} style={{
            padding: '10px 24px', background: 'var(--color-accent)', color: '#0B0E14',
            border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer'
          }}>Aktywuj</button>
        </div>
      )}
    </div>
  )
}
```

Add `import api from '../../api/axios'` if not already imported. Add `InviteCodeCard` usage inside the return JSX, near the top of the dashboard content.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/coach/CoachDashboard.jsx
git commit -m "feat: invite code card with pending badge on coach dashboard"
```

---

### Task 11: Wire Up Routes in App.jsx and Sidebar

**Files:**
- Modify: `client/src/App.jsx`
- Modify: `client/src/components/layout/Sidebar/Sidebar.jsx`

- [ ] **Step 1: Add routes in App.jsx**

Add imports at the top with other parent/coach page imports:

```javascript
import AddCoach from './pages/parent/AddCoach'
import CoachRequests from './pages/coach/CoachRequests'
```

Add route entries inside `<Routes>`:

In the PARENT ROUTES section:
```jsx
<Route
  path="/parent/add-coach"
  element={
    <ProtectedRoute role="parent">
      <AppShell><AddCoach /></AppShell>
    </ProtectedRoute>
  }
/>
```

In the COACH ROUTES section:
```jsx
<Route
  path="/coach/requests"
  element={
    <ProtectedRoute role="coach">
      <AppShell><CoachRequests /></AppShell>
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 2: Add nav items in Sidebar.jsx**

In the `parentNav` array, add before the `/settings` entry:

```javascript
{ path: '/parent/add-coach', label: 'Dodaj trenera', icon: '🔗' },
```

In the `coachNav` array, add before the `/settings` entry:

```javascript
{ path: '/coach/requests', label: 'Prosby', icon: '📩' },
```

- [ ] **Step 3: Commit**

```bash
git add client/src/App.jsx client/src/components/layout/Sidebar/Sidebar.jsx
git commit -m "feat: wire AddCoach and CoachRequests routes + sidebar nav"
```

---

### Task 12: Add "Add Coach" Button on Parent Dashboard

**Files:**
- Modify: `client/src/pages/parent/Dashboard.jsx`

- [ ] **Step 1: Add a link/button to AddCoach page**

Read `client/src/pages/parent/Dashboard.jsx`. In the hero section or near the child selector, add:

```jsx
<a
  href="/parent/add-coach"
  style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 16px', background: 'var(--color-accent-muted)',
    color: 'var(--color-accent)', border: '1px solid var(--color-accent)',
    borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none',
    marginBottom: 16
  }}
>
  🔗 Dodaj trenera
</a>
```

Place this after the heading or child selector area.

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/parent/Dashboard.jsx
git commit -m "feat: add coach link button on parent dashboard"
```
