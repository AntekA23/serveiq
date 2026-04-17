// BadgeIcon.jsx — SVG badge icons for ServeIQ gamification system

const CATEGORY_COLORS = {
  training: '#3B82F6',
  tournament: '#EF4444',
  development: '#F59E0B',
  coach: '#22C55E',
}

const LOCKED_COLOR = '#374151'

function BadgeShell({ earned, color, size = 64, children }) {
  const c = earned ? color : LOCKED_COLOR

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
          <circle cx="32" cy="32" r="31" fill={c} fillOpacity="0.15" />
          <circle cx="32" cy="32" r="30" stroke={c} strokeWidth="3" fill="none" />
          <circle cx="32" cy="32" r="27" fill={c} />
          <ellipse cx="32" cy="22" rx="16" ry="10" fill="white" fillOpacity="0.2" />
        </>
      ) : (
        <>
          <circle cx="32" cy="32" r="30" stroke={c} strokeWidth="2" strokeDasharray="4 3" fill="none" />
          <circle cx="32" cy="32" r="27" fill={c} fillOpacity="0.08" />
        </>
      )}
      {children}
      {earned && (
        <circle cx="21" cy="19" r="5" fill="white" fillOpacity="0.25" />
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

// 1. FirstSession — Tennis ball
function FirstSession({ earned, size }) {
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.training} size={size}>
      <circle cx="32" cy="32" r="13" fill={earned ? '#CDFF50' : LOCKED_COLOR} fillOpacity={earned ? 0.9 : 0.5} />
      <path d="M21 26 Q32 30 21 38" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M43 26 Q32 30 43 38" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </BadgeShell>
  )
}

// 2. RegularPlayer — Racket with "10"
function RegularPlayer({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.training} size={size}>
      <ellipse cx="32" cy="27" rx="10" ry="12" stroke={c} strokeWidth="2" fill="none" />
      <line x1="22" y1="24" x2="42" y2="24" stroke={c} strokeWidth="1" opacity="0.5" />
      <line x1="22" y1="28" x2="42" y2="28" stroke={c} strokeWidth="1" opacity="0.5" />
      <line x1="22" y1="32" x2="42" y2="32" stroke={c} strokeWidth="1" opacity="0.5" />
      <line x1="27" y1="16" x2="27" y2="38" stroke={c} strokeWidth="1" opacity="0.5" />
      <line x1="32" y1="16" x2="32" y2="38" stroke={c} strokeWidth="1" opacity="0.5" />
      <line x1="37" y1="16" x2="37" y2="38" stroke={c} strokeWidth="1" opacity="0.5" />
      <line x1="32" y1="39" x2="32" y2="50" stroke={c} strokeWidth="3" strokeLinecap="round" />
      <text x="32" y="29" textAnchor="middle" fontSize="9" fontWeight="700" fill={c} fontFamily="system-ui">10</text>
    </BadgeShell>
  )
}

// 3. Session25 — Racket with "25"
function Session25({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.training} size={size}>
      <ellipse cx="32" cy="27" rx="10" ry="12" stroke={c} strokeWidth="2" fill="none" />
      <line x1="27" y1="16" x2="27" y2="38" stroke={c} strokeWidth="1" opacity="0.4" />
      <line x1="32" y1="16" x2="32" y2="38" stroke={c} strokeWidth="1" opacity="0.4" />
      <line x1="37" y1="16" x2="37" y2="38" stroke={c} strokeWidth="1" opacity="0.4" />
      <line x1="32" y1="39" x2="32" y2="50" stroke={c} strokeWidth="3" strokeLinecap="round" />
      <text x="32" y="30" textAnchor="middle" fontSize="9" fontWeight="700" fill={c} fontFamily="system-ui">25</text>
    </BadgeShell>
  )
}

// 4. TrainingMachine — Gear with "50"
function TrainingMachine({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.training} size={size}>
      <path
        d="M32 18 L34 14 L36 18 L40 16 L40 20 L44 22 L42 26 L46 28 L44 32 L46 36 L42 38 L40 42 L36 40 L34 44 L32 40 L28 44 L26 40 L22 42 L20 38 L16 36 L18 32 L16 28 L20 26 L18 22 L22 20 L22 16 L26 18 Z"
        fill="none" stroke={c} strokeWidth="2"
      />
      <circle cx="32" cy="29" r="7" fill="none" stroke={c} strokeWidth="1.5" />
      <text x="32" y="33" textAnchor="middle" fontSize="8" fontWeight="700" fill={c} fontFamily="system-ui">50</text>
    </BadgeShell>
  )
}

// 5. SessionCenturion — Shield with "100"
function SessionCenturion({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.training} size={size}>
      <path d="M32 16 L44 21 L44 32 C44 38 38 43 32 46 C26 43 20 38 20 32 L20 21 Z"
        stroke={c} strokeWidth="2" fill={c} fillOpacity="0.15" />
      <text x="32" y="35" textAnchor="middle" fontSize="10" fontWeight="700" fill={c} fontFamily="system-ui">100</text>
    </BadgeShell>
  )
}

// 6. Hours10 — Clock with "10h"
function Hours10({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.training} size={size}>
      <circle cx="32" cy="30" r="14" stroke={c} strokeWidth="2" fill="none" />
      <line x1="32" y1="20" x2="32" y2="30" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="30" x2="40" y2="34" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <text x="32" y="50" textAnchor="middle" fontSize="8" fontWeight="700" fill={c} fontFamily="system-ui">10h</text>
    </BadgeShell>
  )
}

// 7. Hours50 — Clock with "50h"
function Hours50({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.training} size={size}>
      <circle cx="32" cy="30" r="14" stroke={c} strokeWidth="2" fill="none" />
      <line x1="32" y1="20" x2="32" y2="30" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="30" x2="38" y2="24" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <text x="32" y="50" textAnchor="middle" fontSize="8" fontWeight="700" fill={c} fontFamily="system-ui">50h</text>
    </BadgeShell>
  )
}

// 8. Hours100 — Clock + star
function Hours100({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.training} size={size}>
      <circle cx="32" cy="28" r="12" stroke={c} strokeWidth="2" fill="none" />
      <line x1="32" y1="19" x2="32" y2="28" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="28" x2="39" y2="32" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path d="M32 42 L33.2 45 L36.5 45 L34 47 L35 50 L32 48 L29 50 L30 47 L27.5 45 L30.8 45 Z"
        fill={earned ? '#FCD34D' : c} />
    </BadgeShell>
  )
}

// 9. WeeklyStreak — Calendar with checkmarks
function WeeklyStreak({ earned, size }) {
  const c = ic(earned)
  const checkColor = earned ? '#CDFF50' : '#6b7280'
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.training} size={size}>
      <rect x="18" y="20" width="28" height="24" rx="3" stroke={c} strokeWidth="2" fill="none" />
      <rect x="18" y="20" width="28" height="7" rx="3" fill={c} fillOpacity="0.4" />
      <line x1="24" y1="17" x2="24" y2="23" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <line x1="40" y1="17" x2="40" y2="23" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path d="M22 33 L24 36 L29 30" stroke={checkColor} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 33 L32 36 L37 30" stroke={checkColor} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M38 33 L40 36 L45 30" stroke={checkColor} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </BadgeShell>
  )
}

// 10. StreakMaster — Flame
function StreakMaster({ earned, size }) {
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.training} size={size}>
      <path
        d="M32 16 C32 16 40 24 40 32 C40 38 36 44 32 44 C28 44 24 38 24 32 C24 26 28 20 32 16Z"
        fill={earned ? '#FCD34D' : LOCKED_COLOR} fillOpacity={earned ? 0.9 : 0.5}
      />
      <path
        d="M32 26 C32 26 37 31 37 36 C37 40 35 43 32 43 C29 43 27 40 27 36 C27 31 32 26 32 26Z"
        fill={earned ? '#EF4444' : '#6b7280'} fillOpacity={earned ? 0.85 : 0.5}
      />
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
