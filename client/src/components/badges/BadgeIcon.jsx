// BadgeIcon.jsx — SVG badge icons for ServeIQ gamification system

const CATEGORY_COLORS = {
  training: '#3B82F6',
  skills: '#8B5CF6',
  tournament: '#EF4444',
  special: '#F59E0B',
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
      style={{ opacity: earned ? 1 : 0.35 }}
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
          <circle cx="32" cy="32" r="30" stroke={c} strokeWidth="2" fill="none" />
          <circle cx="32" cy="32" r="27" fill={c} fillOpacity="0.15" />
        </>
      )}
      {children}
      {earned && (
        <circle cx="21" cy="19" r="5" fill="white" fillOpacity="0.25" />
      )}
    </svg>
  )
}

// Helper: icon color — white when earned (visible on colored bg), gray when locked
function ic(earned) { return earned ? '#ffffff' : LOCKED_COLOR }

// 1. FirstSession — training — Tennis ball
function FirstSession({ earned, size }) {
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.training} size={size}>
      <circle cx="32" cy="32" r="13" fill={earned ? '#CDFF50' : LOCKED_COLOR} fillOpacity={earned ? 0.9 : 0.5} />
      <path d="M21 26 Q32 30 21 38" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M43 26 Q32 30 43 38" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </BadgeShell>
  )
}

// 2. RegularPlayer — training — Racket with "10"
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

// 3. TrainingMachine — training — Gear with "50"
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

// 4. WeeklyStreak — training — Calendar with checkmarks
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

// 5. StreakMaster — training — Flame
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

// 6. FirstStep — skills — Footprint
function FirstStep({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.skills} size={size}>
      <path d="M28 22 C25 22 22 26 22 31 C22 36 25 42 30 42 C35 42 38 37 38 32 C38 27 35 22 31 22 Z" fill={c} fillOpacity="0.85" />
      <circle cx="25" cy="20" r="2.5" fill={c} fillOpacity="0.85" />
      <circle cx="29" cy="18" r="2.5" fill={c} fillOpacity="0.85" />
      <circle cx="33" cy="18" r="2.5" fill={c} fillOpacity="0.85" />
      <circle cx="37" cy="20" r="2" fill={c} fillOpacity="0.85" />
    </BadgeShell>
  )
}

// 7. Practitioner — skills — Repeat arrows
function Practitioner({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.skills} size={size}>
      <path d="M22 28 A12 12 0 0 1 42 28" stroke={c} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <polygon points="42,22 46,29 38,29" fill={c} />
      <path d="M42 36 A12 12 0 0 1 22 36" stroke={c} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <polygon points="22,42 18,35 26,35" fill={c} />
    </BadgeShell>
  )
}

// 8. StablePlayer — skills — Shield with checkmark
function StablePlayer({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.skills} size={size}>
      <path d="M32 16 L44 21 L44 32 C44 38 38 43 32 46 C26 43 20 38 20 32 L20 21 Z"
        stroke={c} strokeWidth="2" fill={c} fillOpacity="0.15" />
      <path d="M25 32 L30 37 L39 25" stroke={c} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </BadgeShell>
  )
}

// 9. StrongSkill — skills — Lightning bolt
function StrongSkill({ earned, size }) {
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.skills} size={size}>
      <path d="M36 16 L26 33 L32 33 L28 48 L42 28 L36 28 Z"
        fill={earned ? '#FCD34D' : '#6b7280'}
        stroke={earned ? '#ffffff' : LOCKED_COLOR}
        strokeWidth="1.5" strokeLinejoin="round" />
    </BadgeShell>
  )
}

// 10. AllRounder — skills — 4-pointed star
function AllRounder({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.skills} size={size}>
      <path d="M32 16 L34 28 L46 32 L34 36 L32 48 L30 36 L18 32 L30 28 Z"
        fill={c} fillOpacity="0.9" stroke={c} strokeWidth="1" />
    </BadgeShell>
  )
}

// 11. TournamentDebut — tournament — Trophy
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

// 12. Winner — tournament — Medal with star and ribbon
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

// 13. CourtTraveler — tournament — Globe with cross lines
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

// 14. GoalAchieved — special — Target with arrow
function GoalAchieved({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.special} size={size}>
      <circle cx="32" cy="32" r="13" stroke={c} strokeWidth="2" fill="none" />
      <circle cx="32" cy="32" r="8" stroke={c} strokeWidth="2" fill="none" />
      <circle cx="32" cy="32" r="3.5" fill={c} />
      <line x1="43" y1="20" x2="34" y2="29" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <polygon points="43,20 38,20 43,25" fill={c} />
    </BadgeShell>
  )
}

// 15. ThreeGoals — special — 3 targets in triangle formation
function ThreeGoals({ earned, size }) {
  const c = ic(earned)
  return (
    <BadgeShell earned={earned} color={CATEGORY_COLORS.special} size={size}>
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

export const BADGE_COMPONENTS = {
  firstSession: FirstSession,
  regularPlayer: RegularPlayer,
  trainingMachine: TrainingMachine,
  weeklyStreak: WeeklyStreak,
  streakMaster: StreakMaster,
  firstStep: FirstStep,
  practitioner: Practitioner,
  stablePlayer: StablePlayer,
  strongSkill: StrongSkill,
  allRounder: AllRounder,
  tournamentDebut: TournamentDebut,
  winner: Winner,
  courtTraveler: CourtTraveler,
  goalAchieved: GoalAchieved,
  threeGoals: ThreeGoals,
}

export default function BadgeIcon({ icon, earned = false, size = 64 }) {
  const Component = BADGE_COMPONENTS[icon]
  if (!Component) return null
  return <Component earned={earned} size={size} />
}
