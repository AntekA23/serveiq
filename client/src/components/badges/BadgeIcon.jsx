// BadgeIcon.jsx — SVG badge icons for ServeIQ gamification system
import { useState } from 'react'

const CATEGORY_COLORS = {
  training: '#3B82F6',
  tournament: '#EF4444',
  development: '#F59E0B',
  coach: '#22C55E',
}

const LOCKED_COLOR = '#374151'

// Unique ID counter for SVG gradients (avoids collisions when multiple badges render)
let _gid = 0
function uid() { return `_b${++_gid}` }

function BadgeShell({ earned, color, size = 64, children }) {
  const c = earned ? color : LOCKED_COLOR
  const [pfx] = useState(uid)
  const g1 = `${pfx}_g1`
  const g2 = `${pfx}_g2`
  const g3 = `${pfx}_gl`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity: earned ? 1 : 0.45 }}
    >
      {earned ? (
        <>
          <defs>
            <radialGradient id={g1} cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="white" stopOpacity="0.25" />
              <stop offset="100%" stopColor={c} stopOpacity="0" />
            </radialGradient>
            <linearGradient id={g2} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c} />
              <stop offset="100%" stopColor={c} stopOpacity="0.6" />
            </linearGradient>
            <radialGradient id={g3} cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor={c} stopOpacity="0" />
              <stop offset="100%" stopColor={c} stopOpacity="0.3" />
            </radialGradient>
          </defs>
          {/* Outer glow */}
          <circle cx="32" cy="32" r="31" fill={`url(#${g3})`} />
          {/* Border */}
          <circle cx="32" cy="32" r="30" stroke={c} strokeWidth="2.5" fill="none" />
          {/* Main fill with gradient */}
          <circle cx="32" cy="32" r="28" fill={`url(#${g2})`} />
          {/* Glossy shine */}
          <ellipse cx="32" cy="21" rx="18" ry="12" fill={`url(#${g1})`} />
          {/* Rim highlight */}
          <circle cx="32" cy="32" r="28" stroke="white" strokeWidth="0.5" strokeOpacity="0.15" fill="none" />
        </>
      ) : (
        <>
          <circle cx="32" cy="32" r="30" stroke={c} strokeWidth="2" strokeDasharray="4 3" fill="none" />
          <circle cx="32" cy="32" r="27" fill={c} fillOpacity="0.08" />
        </>
      )}
      {children}
      {earned && (
        <circle cx="20" cy="18" r="4" fill="white" fillOpacity="0.2" />
      )}
      {!earned && (
        <g opacity="0.7">
          <rect x="26" y="34" width="12" height="10" rx="2" fill={LOCKED_COLOR} />
          <path d="M28.5 34 V30.5 A3.5 3.5 0 0 1 35.5 30.5 V34" stroke={LOCKED_COLOR} strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="32" cy="39" r="1.5" fill="#9CA3AF" />
        </g>
      )}
    </svg>
  )
}

// Helper: icon color — white when earned, gray when locked
function ic(earned) { return earned ? '#ffffff' : LOCKED_COLOR }

// ───── TRAINING BADGES ─────

// 1. FirstSession — Neon tennis ball with glow
function FirstSession({ earned, size }) {
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.training} size={size}>
      {earned && (
        <circle cx="32" cy="32" r="14" fill="#CDFF50" fillOpacity="0.15" />
      )}
      <circle cx="32" cy="32" r="12" fill={earned ? '#CDFF50' : LOCKED_COLOR} fillOpacity={earned ? 1 : 0.5} />
      {earned && <circle cx="32" cy="32" r="12" fill="url(#fs_ball)" />}
      {earned && (
        <defs>
          <radialGradient id="fs_ball" cx="40%" cy="35%">
            <stop offset="0%" stopColor="#E8FF80" />
            <stop offset="60%" stopColor="#CDFF50" />
            <stop offset="100%" stopColor="#9ACD32" />
          </radialGradient>
        </defs>
      )}
      <path d="M21 26 Q32 30 21 38" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeOpacity={earned ? 0.9 : 0.4} />
      <path d="M43 26 Q32 30 43 38" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeOpacity={earned ? 0.9 : 0.4} />
      {earned && <ellipse cx="28" cy="28" rx="4" ry="3" fill="white" fillOpacity="0.3" />}
    </BadgeShell>
  )
}

// 2. RegularPlayer — Golden racket with "10"
function RegularPlayer({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.training} size={size}>
      <ellipse cx="32" cy="26" rx="11" ry="13" stroke={c} strokeWidth="2" fill={earned ? 'white' : 'none'} fillOpacity={earned ? 0.1 : 0} />
      <line x1="22" y1="23" x2="42" y2="23" stroke={c} strokeWidth="1" opacity="0.4" />
      <line x1="22" y1="27" x2="42" y2="27" stroke={c} strokeWidth="1" opacity="0.4" />
      <line x1="22" y1="31" x2="42" y2="31" stroke={c} strokeWidth="1" opacity="0.4" />
      <line x1="27" y1="14" x2="27" y2="38" stroke={c} strokeWidth="1" opacity="0.4" />
      <line x1="32" y1="14" x2="32" y2="38" stroke={c} strokeWidth="1" opacity="0.4" />
      <line x1="37" y1="14" x2="37" y2="38" stroke={c} strokeWidth="1" opacity="0.4" />
      <line x1="32" y1="39" x2="32" y2="49" stroke={earned ? '#FCD34D' : c} strokeWidth="3.5" strokeLinecap="round" />
      <rect x="29" y="49" width="6" height="3" rx="1" fill={earned ? '#D4A017' : c} fillOpacity={earned ? 0.8 : 0.3} />
      <circle cx="32" cy="27" r="8" fill={earned ? '#FCD34D' : 'none'} fillOpacity={earned ? 0.2 : 0} />
      <text x="32" y="30" textAnchor="middle" fontSize="10" fontWeight="800" fill={c} fontFamily="system-ui">10</text>
    </BadgeShell>
  )
}

// 3. Session25 — Silver racket with "25"
function Session25({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.training} size={size}>
      <ellipse cx="32" cy="26" rx="11" ry="13" stroke={c} strokeWidth="2" fill={earned ? 'white' : 'none'} fillOpacity={earned ? 0.1 : 0} />
      <line x1="27" y1="14" x2="27" y2="38" stroke={c} strokeWidth="1" opacity="0.3" />
      <line x1="32" y1="14" x2="32" y2="38" stroke={c} strokeWidth="1" opacity="0.3" />
      <line x1="37" y1="14" x2="37" y2="38" stroke={c} strokeWidth="1" opacity="0.3" />
      <line x1="32" y1="39" x2="32" y2="49" stroke={earned ? '#C0C0C0' : c} strokeWidth="3.5" strokeLinecap="round" />
      <rect x="29" y="49" width="6" height="3" rx="1" fill={earned ? '#A0A0A0' : c} fillOpacity={earned ? 0.8 : 0.3} />
      <circle cx="32" cy="27" r="8" fill={earned ? '#E0E0E0' : 'none'} fillOpacity={earned ? 0.15 : 0} />
      <text x="32" y="30" textAnchor="middle" fontSize="10" fontWeight="800" fill={c} fontFamily="system-ui">25</text>
    </BadgeShell>
  )
}

// 4. TrainingMachine — Golden gear with "50"
function TrainingMachine({ earned, size }) {
  const c = ic(earned)
  const gearFill = earned ? '#FCD34D' : 'none'
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.training} size={size}>
      <path
        d="M32 18 L34 14 L36 18 L40 16 L40 20 L44 22 L42 26 L46 28 L44 32 L46 36 L42 38 L40 42 L36 40 L34 44 L32 40 L28 44 L26 40 L22 42 L20 38 L16 36 L18 32 L16 28 L20 26 L18 22 L22 20 L22 16 L26 18 Z"
        fill={gearFill} fillOpacity={earned ? 0.2 : 0} stroke={c} strokeWidth="2"
      />
      <circle cx="32" cy="29" r="9" fill={earned ? '#FCD34D' : 'none'} fillOpacity={earned ? 0.15 : 0} stroke={c} strokeWidth="1.5" />
      <text x="32" y="33" textAnchor="middle" fontSize="9" fontWeight="800" fill={earned ? '#FCD34D' : c} fontFamily="system-ui">50</text>
      {earned && <circle cx="27" cy="22" r="2" fill="white" fillOpacity="0.2" />}
    </BadgeShell>
  )
}

// 5. SessionCenturion — Epic shield with star
function SessionCenturion({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.training} size={size}>
      <path d="M32 14 L46 20 L46 33 C46 40 39 46 32 49 C25 46 18 40 18 33 L18 20 Z"
        stroke={c} strokeWidth="2" fill={earned ? '#FCD34D' : c} fillOpacity={earned ? 0.15 : 0.1} />
      {earned && (
        <path d="M32 18 L44 23 L44 33 C44 38 38 44 32 46 C26 44 20 38 20 33 L20 23 Z"
          fill="white" fillOpacity="0.08" />
      )}
      <text x="32" y="35" textAnchor="middle" fontSize="11" fontWeight="900" fill={earned ? '#FCD34D' : c} fontFamily="system-ui">100</text>
      {earned && (
        <path d="M32 18 L33 21 L36 21 L33.5 23 L34.5 26 L32 24.5 L29.5 26 L30.5 23 L28 21 L31 21 Z"
          fill="#FCD34D" fillOpacity="0.9" />
      )}
    </BadgeShell>
  )
}

// 6. Hours10 — Vibrant clock
function Hours10({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.training} size={size}>
      <circle cx="32" cy="29" r="14" stroke={c} strokeWidth="2" fill={earned ? 'white' : 'none'} fillOpacity={earned ? 0.08 : 0} />
      {earned && <>
        {[12, 3, 6, 9].map((h, i) => {
          const a = (h * 30 - 90) * Math.PI / 180
          return <circle key={i} cx={32 + Math.cos(a) * 11} cy={29 + Math.sin(a) * 11} r="1.5" fill={c} fillOpacity="0.5" />
        })}
      </>}
      <line x1="32" y1="19" x2="32" y2="29" stroke={earned ? '#CDFF50' : c} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="29" x2="40" y2="33" stroke={earned ? '#FCD34D' : c} strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="29" r="2" fill={earned ? '#CDFF50' : c} />
      <text x="32" y="50" textAnchor="middle" fontSize="9" fontWeight="800" fill={earned ? '#CDFF50' : c} fontFamily="system-ui">10h</text>
    </BadgeShell>
  )
}

// 7. Hours50 — Richer clock with glow hands
function Hours50({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.training} size={size}>
      <circle cx="32" cy="29" r="14" stroke={c} strokeWidth="2" fill={earned ? 'white' : 'none'} fillOpacity={earned ? 0.08 : 0} />
      {earned && <>
        {[12, 3, 6, 9].map((h, i) => {
          const a = (h * 30 - 90) * Math.PI / 180
          return <circle key={i} cx={32 + Math.cos(a) * 11} cy={29 + Math.sin(a) * 11} r="1.5" fill={c} fillOpacity="0.5" />
        })}
      </>}
      <line x1="32" y1="19" x2="32" y2="29" stroke={earned ? '#FCD34D' : c} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="29" x2="38" y2="23" stroke={earned ? '#CDFF50' : c} strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="29" r="2" fill={earned ? '#FCD34D' : c} />
      <text x="32" y="50" textAnchor="middle" fontSize="9" fontWeight="800" fill={earned ? '#FCD34D' : c} fontFamily="system-ui">50h</text>
    </BadgeShell>
  )
}

// 8. Hours100 — Golden clock with prominent star
function Hours100({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.training} size={size}>
      <circle cx="32" cy="26" r="12" stroke={c} strokeWidth="2" fill={earned ? 'white' : 'none'} fillOpacity={earned ? 0.08 : 0} />
      <line x1="32" y1="17" x2="32" y2="26" stroke={earned ? '#FCD34D' : c} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="26" x2="39" y2="30" stroke={earned ? '#CDFF50' : c} strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="26" r="2" fill={earned ? '#FCD34D' : c} />
      {/* Big star */}
      <path d="M32 40 L33.8 44 L38 44.5 L35 47.5 L36 52 L32 49.5 L28 52 L29 47.5 L26 44.5 L30.2 44 Z"
        fill={earned ? '#FCD34D' : c} fillOpacity={earned ? 1 : 0.4}
        stroke={earned ? '#D4A017' : 'none'} strokeWidth="0.5" />
      {earned && <circle cx="29" cy="42" r="1.5" fill="white" fillOpacity="0.3" />}
    </BadgeShell>
  )
}

// 9. WeeklyStreak — Vibrant calendar with green checks
function WeeklyStreak({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.training} size={size}>
      <rect x="17" y="19" width="30" height="26" rx="3" stroke={c} strokeWidth="2" fill={earned ? 'white' : 'none'} fillOpacity={earned ? 0.05 : 0} />
      <rect x="17" y="19" width="30" height="8" rx="3" fill={earned ? '#EF4444' : c} fillOpacity={earned ? 0.7 : 0.3} />
      <line x1="24" y1="16" x2="24" y2="22" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="40" y1="16" x2="40" y2="22" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M22 34 L25 37 L30 31" stroke={earned ? '#22C55E' : '#6b7280'} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 34 L33 37 L38 31" stroke={earned ? '#22C55E' : '#6b7280'} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M38 34 L41 37 L46 31" stroke={earned ? '#CDFF50' : '#6b7280'} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </BadgeShell>
  )
}

// 10. StreakMaster — Multi-layer fire with glow
function StreakMaster({ earned, size }) {
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.training} size={size}>
      {earned && <circle cx="32" cy="36" r="14" fill="#FCD34D" fillOpacity="0.1" />}
      {/* Outer flame */}
      <path
        d="M32 14 C32 14 42 23 42 33 C42 40 37 46 32 46 C27 46 22 40 22 33 C22 25 28 18 32 14Z"
        fill={earned ? '#F59E0B' : LOCKED_COLOR} fillOpacity={earned ? 0.9 : 0.5}
      />
      {/* Mid flame */}
      <path
        d="M32 22 C32 22 39 28 39 35 C39 40 36 44 32 44 C28 44 25 40 25 35 C25 29 30 24 32 22Z"
        fill={earned ? '#EF4444' : '#6b7280'} fillOpacity={earned ? 0.9 : 0.5}
      />
      {/* Inner flame */}
      <path
        d="M32 30 C32 30 36 33 36 37 C36 40 34 43 32 43 C30 43 28 40 28 37 C28 34 31 31 32 30Z"
        fill={earned ? '#FCD34D' : '#555'} fillOpacity={earned ? 1 : 0.4}
      />
      {/* Hot core */}
      {earned && (
        <ellipse cx="32" cy="39" rx="2" ry="3" fill="white" fillOpacity="0.5" />
      )}
    </BadgeShell>
  )
}

// ───── TOURNAMENT BADGES ─────

// 11. TournamentDebut — Trophy
function TournamentDebut({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.tournament} size={size}>
      <path d="M24 16 L24 34 C24 40 28 44 32 44 C36 44 40 40 40 34 L40 16 Z"
        stroke={c} strokeWidth="2" fill={c} fillOpacity="0.15" />
      <path d="M24 20 C18 20 16 24 16 28 C16 32 20 34 24 33" stroke={c} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M40 20 C46 20 48 24 48 28 C48 32 44 34 40 33" stroke={c} strokeWidth="2" fill="none" strokeLinecap="round" />
      <line x1="32" y1="44" x2="32" y2="50" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="24" y1="50" x2="40" y2="50" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
    </BadgeShell>
  )
}

// 12. Winner — Medal with star and ribbon
function Winner({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.tournament} size={size}>
      <path d="M26 16 L22 28 L28 25 Z" fill={c} fillOpacity="0.6" />
      <path d="M38 16 L42 28 L36 25 Z" fill={c} fillOpacity="0.6" />
      <circle cx="32" cy="36" r="12" fill={c} fillOpacity="0.15" stroke={c} strokeWidth="2" />
      <path d="M32 29 L33.5 33.5 L38 33.5 L34.5 36.5 L36 41 L32 38.5 L28 41 L29.5 36.5 L26 33.5 L30.5 33.5 Z"
        fill={earned ? '#FCD34D' : '#6b7280'} />
    </BadgeShell>
  )
}

// 13. Tournament5 — 5 stars in arc
function Tournament5({ earned, size }) {
  const c = ic(earned)
  const starFill = earned ? '#FCD34D' : c
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.tournament} size={size}>
      <g transform="translate(32,32)">
        {[0, 1, 2, 3, 4].map(i => {
          const angle = (-90 + i * 45) * Math.PI / 180
          const x = Math.cos(angle) * 12
          const y = Math.sin(angle) * 12
          return (
            <path key={i} d={`M${x},${y - 3} L${x + 1},${y} L${x + 3},${y} L${x + 1.5},${y + 1.5} L${x + 2},${y + 3.5} L${x},${y + 2} L${x - 2},${y + 3.5} L${x - 1.5},${y + 1.5} L${x - 3},${y} L${x - 1},${y}`}
              fill={starFill} />
          )
        })}
      </g>
      <text x="32" y="48" textAnchor="middle" fontSize="7" fontWeight="700" fill={c} fontFamily="system-ui">×5</text>
    </BadgeShell>
  )
}

// 14. Tournament10 — Trophy with "10"
function Tournament10({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.tournament} size={size}>
      <path d="M24 16 L24 32 C24 38 28 42 32 42 C36 42 40 38 40 32 L40 16 Z"
        stroke={c} strokeWidth="2" fill={c} fillOpacity="0.15" />
      <path d="M24 20 C19 20 17 23 17 27 C17 30 20 32 24 31" stroke={c} strokeWidth="1.5" fill="none" />
      <path d="M40 20 C45 20 47 23 47 27 C47 30 44 32 40 31" stroke={c} strokeWidth="1.5" fill="none" />
      <text x="32" y="32" textAnchor="middle" fontSize="11" fontWeight="700" fill={c} fontFamily="system-ui">10</text>
      <line x1="26" y1="48" x2="38" y2="48" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </BadgeShell>
  )
}

// 15. Finalist — Silver trophy with star
function Finalist({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.tournament} size={size}>
      <path d="M25 18 L25 34 C25 39 28 43 32 43 C36 43 39 39 39 34 L39 18 Z"
        stroke={c} strokeWidth="2" fill={c} fillOpacity="0.1" />
      <line x1="32" y1="43" x2="32" y2="48" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <line x1="26" y1="48" x2="38" y2="48" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path d="M32 22 L33 25 L36 25 L33.5 27 L34.5 30 L32 28.5 L29.5 30 L30.5 27 L28 25 L31 25 Z"
        fill={earned ? '#C0C0C0' : c} fillOpacity="0.9" />
      <text x="32" y="40" textAnchor="middle" fontSize="6" fontWeight="700" fill={c} fontFamily="system-ui">2</text>
    </BadgeShell>
  )
}

// 16. Champion — Gold crown
function Champion({ earned, size }) {
  const c = ic(earned)
  const crownFill = earned ? '#FCD34D' : c
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.tournament} size={size}>
      <path d="M18 38 L22 22 L28 30 L32 18 L36 30 L42 22 L46 38 Z"
        fill={crownFill} fillOpacity={earned ? 0.9 : 0.4} stroke={c} strokeWidth="2" strokeLinejoin="round" />
      <rect x="18" y="38" width="28" height="6" rx="2" fill={crownFill} fillOpacity={earned ? 0.7 : 0.3} stroke={c} strokeWidth="1.5" />
      <circle cx="22" cy="22" r="2" fill={crownFill} />
      <circle cx="32" cy="18" r="2" fill={crownFill} />
      <circle cx="42" cy="22" r="2" fill={crownFill} />
    </BadgeShell>
  )
}

// 17. CourtTraveler — Globe with cross lines
function CourtTraveler({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.tournament} size={size}>
      <circle cx="32" cy="32" r="14" stroke={c} strokeWidth="2" fill="none" />
      <line x1="18" y1="32" x2="46" y2="32" stroke={c} strokeWidth="1.5" />
      <line x1="32" y1="18" x2="32" y2="46" stroke={c} strokeWidth="1.5" />
      <path d="M32 18 C26 22 26 42 32 46" stroke={c} strokeWidth="1.5" fill="none" />
      <path d="M32 18 C38 22 38 42 32 46" stroke={c} strokeWidth="1.5" fill="none" />
    </BadgeShell>
  )
}

// 18. MultiSurfacePro — 3 court surfaces
function MultiSurfacePro({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.tournament} size={size}>
      <rect x="16" y="22" width="10" height="10" rx="2" fill={earned ? '#D97706' : c} fillOpacity={earned ? 0.8 : 0.3} stroke={c} strokeWidth="1.5" />
      <rect x="27" y="22" width="10" height="10" rx="2" fill={earned ? '#3B82F6' : c} fillOpacity={earned ? 0.8 : 0.3} stroke={c} strokeWidth="1.5" />
      <rect x="38" y="22" width="10" height="10" rx="2" fill={earned ? '#22C55E' : c} fillOpacity={earned ? 0.8 : 0.3} stroke={c} strokeWidth="1.5" />
      <text x="21" y="44" textAnchor="middle" fontSize="6" fill={c} fontFamily="system-ui">mą</text>
      <text x="32" y="44" textAnchor="middle" fontSize="6" fill={c} fontFamily="system-ui">tw</text>
      <text x="43" y="44" textAnchor="middle" fontSize="6" fill={c} fontFamily="system-ui">tr</text>
    </BadgeShell>
  )
}

// ───── DEVELOPMENT BADGES ─────

// 19. GoalAchieved — Target with arrow
function GoalAchieved({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.development} size={size}>
      <circle cx="32" cy="32" r="13" stroke={c} strokeWidth="2" fill="none" />
      <circle cx="32" cy="32" r="8" stroke={c} strokeWidth="2" fill="none" />
      <circle cx="32" cy="32" r="3.5" fill={c} />
      <line x1="43" y1="20" x2="34" y2="29" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <polygon points="43,20 38,20 43,25" fill={c} />
    </BadgeShell>
  )
}

// 20. ThreeGoals — 3 targets
function ThreeGoals({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.development} size={size}>
      <circle cx="32" cy="22" r="7" stroke={c} strokeWidth="1.5" fill="none" />
      <circle cx="32" cy="22" r="3.5" stroke={c} strokeWidth="1.5" fill="none" />
      <circle cx="32" cy="22" r="1.2" fill={c} />
      <circle cx="22" cy="39" r="7" stroke={c} strokeWidth="1.5" fill="none" />
      <circle cx="22" cy="39" r="3.5" stroke={c} strokeWidth="1.5" fill="none" />
      <circle cx="22" cy="39" r="1.2" fill={c} />
      <circle cx="42" cy="39" r="7" stroke={c} strokeWidth="1.5" fill="none" />
      <circle cx="42" cy="39" r="3.5" stroke={c} strokeWidth="1.5" fill="none" />
      <circle cx="42" cy="39" r="1.2" fill={c} />
    </BadgeShell>
  )
}

// 21. FiveGoals — 5 target dots in pentagon
function FiveGoals({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.development} size={size}>
      {[0, 1, 2, 3, 4].map(i => {
        const angle = (-90 + i * 72) * Math.PI / 180
        const x = 32 + Math.cos(angle) * 11
        const y = 32 + Math.sin(angle) * 11
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="5" stroke={c} strokeWidth="1.5" fill="none" />
            <circle cx={x} cy={y} r="2" fill={c} />
          </g>
        )
      })}
      <text x="32" y="35" textAnchor="middle" fontSize="8" fontWeight="700" fill={c} fontFamily="system-ui">5</text>
    </BadgeShell>
  )
}

// 22. AllTypes — Hexagon with 6 dots
function AllTypes({ earned, size }) {
  const c = ic(earned)
  const dotColors = earned
    ? ['#3B82F6', '#EF4444', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899']
    : Array(6).fill(c)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.development} size={size}>
      <path d="M32 16 L46 24 L46 40 L32 48 L18 40 L18 24 Z"
        stroke={c} strokeWidth="2" fill="none" />
      {[0, 1, 2, 3, 4, 5].map(i => {
        const angle = (-90 + i * 60) * Math.PI / 180
        const x = 32 + Math.cos(angle) * 10
        const y = 32 + Math.sin(angle) * 10
        return <circle key={i} cx={x} cy={y} r="3" fill={dotColors[i]} fillOpacity={earned ? 0.9 : 0.4} />
      })}
    </BadgeShell>
  )
}

// 23. PathwayAdvance — Upward stairs
function PathwayAdvance({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.development} size={size}>
      <rect x="18" y="40" width="8" height="6" fill={c} fillOpacity="0.6" rx="1" />
      <rect x="28" y="34" width="8" height="12" fill={c} fillOpacity="0.7" rx="1" />
      <rect x="38" y="26" width="8" height="20" fill={c} fillOpacity="0.85" rx="1" />
      <path d="M22 36 L32 28 L42 20" stroke={earned ? '#FCD34D' : c} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points="42,16 46,22 38,22" fill={earned ? '#FCD34D' : c} />
    </BadgeShell>
  )
}

// ───── COACH BADGES (reuse skills icons with coach color) ─────

// 24. CoachMvp — Lightning bolt (was StrongSkill)
function CoachMvp({ earned, size }) {
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.coach} size={size}>
      <path d="M36 16 L26 33 L32 33 L28 48 L42 28 L36 28 Z"
        fill={earned ? '#FCD34D' : '#6b7280'}
        stroke={earned ? '#ffffff' : LOCKED_COLOR}
        strokeWidth="1.5" strokeLinejoin="round" />
    </BadgeShell>
  )
}

// 25. CoachProgress — Footprint (was FirstStep)
function CoachProgress({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.coach} size={size}>
      <path d="M28 22 C25 22 22 26 22 31 C22 36 25 42 30 42 C35 42 38 37 38 32 C38 27 35 22 31 22 Z" fill={c} fillOpacity="0.85" />
      <circle cx="25" cy="20" r="2.5" fill={c} fillOpacity="0.85" />
      <circle cx="29" cy="18" r="2.5" fill={c} fillOpacity="0.85" />
      <circle cx="33" cy="18" r="2.5" fill={c} fillOpacity="0.85" />
      <circle cx="37" cy="20" r="2" fill={c} fillOpacity="0.85" />
    </BadgeShell>
  )
}

// 26. CoachSportsmanship — Shield with checkmark (was StablePlayer)
function CoachSportsmanship({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.coach} size={size}>
      <path d="M32 16 L44 21 L44 32 C44 38 38 43 32 46 C26 43 20 38 20 32 L20 21 Z"
        stroke={c} strokeWidth="2" fill={c} fillOpacity="0.15" />
      <path d="M25 32 L30 37 L39 25" stroke={c} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </BadgeShell>
  )
}

// 27. CoachLeader — 4-pointed star (was AllRounder)
function CoachLeader({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.coach} size={size}>
      <path d="M32 16 L34 28 L46 32 L34 36 L32 48 L30 36 L18 32 L30 28 Z"
        fill={c} fillOpacity="0.9" stroke={c} strokeWidth="1" />
    </BadgeShell>
  )
}

// 28. CoachStar — Repeat arrows (was Practitioner)
function CoachStar({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.coach} size={size}>
      <path d="M22 28 A12 12 0 0 1 42 28" stroke={c} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <polygon points="42,22 46,29 38,29" fill={c} />
      <path d="M42 36 A12 12 0 0 1 22 36" stroke={c} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <polygon points="22,42 18,35 26,35" fill={c} />
    </BadgeShell>
  )
}

// ───── EXPORT MAP ─────

export const BADGE_COMPONENTS = {
  // Training
  firstSession: FirstSession,
  regularPlayer: RegularPlayer,
  session25: Session25,
  trainingMachine: TrainingMachine,
  sessionCenturion: SessionCenturion,
  hours10: Hours10,
  hours50: Hours50,
  hours100: Hours100,
  weeklyStreak: WeeklyStreak,
  streakMaster: StreakMaster,
  // Tournament
  tournamentDebut: TournamentDebut,
  winner: Winner,
  tournament5: Tournament5,
  tournament10: Tournament10,
  finalist: Finalist,
  champion: Champion,
  courtTraveler: CourtTraveler,
  multiSurfacePro: MultiSurfacePro,
  // Development
  goalAchieved: GoalAchieved,
  threeGoals: ThreeGoals,
  fiveGoals: FiveGoals,
  allTypes: AllTypes,
  pathwayAdvance: PathwayAdvance,
  // Coach
  coachMvp: CoachMvp,
  coachProgress: CoachProgress,
  coachSportsmanship: CoachSportsmanship,
  coachLeader: CoachLeader,
  coachStar: CoachStar,
}

export default function BadgeIcon({ icon, earned = false, size = 64 }) {
  const Component = BADGE_COMPONENTS[icon]
  if (!Component) return null
  return <Component earned={earned} size={size} />
}
