# Parent-Coach Linking via Invite Code

## Overview

Enable parents and coaches to connect through a permanent coach invite code. After a parent submits a join request with the code, the coach reviews and accepts or rejects. Once accepted, the parent sees their child's data from that coach, the coach's profile, and can message the coach directly.

## Flow

1. Every coach gets a unique permanent invite code (e.g. `COACH-X7K9`) generated at registration or first login.
2. Coach can view, reset, or deactivate the code from their settings/dashboard.
3. Parent navigates to "Add Coach" and enters the code.
4. System validates the code, shows the coach's name/profile. Parent selects which children to assign and optionally adds a message.
5. A `CoachRequest` is created with status `pending`. Coach receives a notification.
6. Coach sees pending requests in their dashboard. They accept or reject each one.
7. On acceptance: each selected player gets the coach added to `Player.coaches[]`. Parent can now see that coach's sessions, reviews, goals for their child. Messaging is unlocked between parent and coach.
8. On rejection: parent is notified. No data is shared.

## Data Model Changes

### User model (`coachProfile`)

Add fields:

```
coachProfile.inviteCode: String (unique, 8 uppercase alphanumeric, auto-generated)
coachProfile.inviteActive: Boolean (default: true)
```

- Code generated on coach account creation via `generateInviteCode()` utility.
- Coach can reset (new code replaces old) or toggle active/inactive.
- Inactive code returns "code not found" to parents (no information leak).

### Player model

Add field:

```
coaches: [{ type: ObjectId, ref: 'User' }]  // additional coaches beyond primary
```

- Existing `coach` field stays as the "primary coach" (backwards compatible).
- `coaches[]` holds all coaches including the primary for unified querying.
- When primary coach creates a player, they're added to both `coach` and `coaches[]`.

### New model: CoachRequest

```javascript
{
  parent:    ObjectId (ref: 'User', required),
  coach:     ObjectId (ref: 'User', required),
  players:   [ObjectId] (ref: 'Player', required, min 1),
  status:    String (enum: ['pending', 'accepted', 'rejected'], default: 'pending'),
  message:   String (optional, max 500 chars),
  createdAt: Date,
  updatedAt: Date
}
```

- Unique constraint on `{ parent, coach, status: 'pending' }` to prevent duplicate pending requests.
- On acceptance: system adds coach to each `Player.coaches[]`.
- Old `Player.coachRequest` inline field will be deprecated (not removed immediately).

## API Endpoints

### Coach code management

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/coaches/my-code` | coach | Get own invite code and active status |
| POST | `/api/coaches/reset-code` | coach | Generate new code, invalidate old |
| PATCH | `/api/coaches/toggle-code` | coach | Toggle inviteActive on/off |

### Join request flow

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/coaches/join` | parent | Submit join request. Body: `{ code, playerIds, message? }` |
| GET | `/api/coaches/requests` | coach | List pending requests for this coach |
| GET | `/api/coaches/requests` | parent | List own requests (all statuses) |
| PUT | `/api/coaches/requests/:id` | coach | Accept or reject. Body: `{ status: 'accepted' | 'rejected' }` |

### Validation rules

- `POST /join`: code must exist and be active; playerIds must belong to the requesting parent; no duplicate pending request for same parent+coach.
- `PUT /requests/:id`: request must belong to this coach; status must be `pending`.

## Data Visibility

### Parent sees (after accepted connection)

- Player sessions where `coach` is in `Player.coaches[]` and session is `visibleToParent: true`
- Reviews/observations from connected coaches
- Development goals set by connected coaches
- Coach profile: name, specialization, ITF level, bio
- Can message the coach

### Coach sees (after accepting request)

- Player profile, skills, sessions they created
- Parent contact info for communication
- Same as current behavior, but now also for players added via invite code (not just coach-created players)

## Frontend Changes

### Coach side

- **Dashboard/Settings**: "Invite Code" card showing the code, copy button, reset button, active/inactive toggle.
- **Dashboard**: "Pending Requests" section/badge showing count. List with parent name, children names, message, accept/reject buttons.
- **Notification**: push notification when new request arrives.

### Parent side

- **Dashboard or sidebar**: "Add Coach" button.
- **Add Coach page/modal**: text input for code, submit. On valid code: show coach name + profile preview, checkboxes to select children, optional message, confirm button.
- **My Coaches section**: list of connected coaches with status. Can view coach profile.
- **Child profile**: show which coaches are connected, their sessions/reviews filtered per coach.

## Edge Cases

- **Parent has no children yet**: prompt to add a child first before entering a code.
- **All selected children already have this coach**: return error "already connected".
- **Coach resets code while parent has pending request**: existing pending requests remain valid (they reference coach ID, not the code).
- **Coach deactivates code**: new join attempts fail, existing connections unaffected.
- **Coach rejects then parent retries**: allowed (no permanent block, parent can submit new request).

## Migration

- Generate `inviteCode` for all existing coaches on first deploy (migration script or lazy generation on first access).
- Populate `Player.coaches[]` from existing `Player.coach` field for all players.
- Existing `Player.coachRequest` field left in place but unused by new code.
