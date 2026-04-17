import PlayerBadge from '../models/PlayerBadge.js';
import Session from '../models/Session.js';
import Tournament from '../models/Tournament.js';
import DevelopmentGoal from '../models/DevelopmentGoal.js';
import Player from '../models/Player.js';
import Notification from '../models/Notification.js';

// ====== Helper: ISO week number ======

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return `${d.getUTCFullYear()}-W${Math.ceil((((d - yearStart) / 86400000) + 1) / 7)}`;
}

// ====== Shared aggregation helpers (avoid repeated queries) ======

async function getSessionCount(playerId) {
  return Session.countDocuments({ player: playerId });
}

async function getTotalMinutes(playerId) {
  const result = await Session.aggregate([
    { $match: { player: playerId } },
    { $group: { _id: null, total: { $sum: '$durationMinutes' } } },
  ]);
  return result.length > 0 ? result[0].total : 0;
}

async function getCompletedTournamentCount(playerId) {
  return Tournament.countDocuments({
    player: playerId,
    status: { $in: ['completed', 'in-progress'] },
  });
}

async function getCompletedGoalCount(playerId) {
  return DevelopmentGoal.countDocuments({ player: playerId, status: 'completed' });
}

// ====== Badge Definitions (28 total) ======

export const BADGE_DEFINITIONS = [
  // ───── TRAINING (10) ─────
  {
    slug: 'first-session',
    name: 'Pierwsza sesja',
    description: 'Ukończono pierwszą sesję treningową.',
    category: 'training',
    icon: 'firstSession',
    async check(playerId) {
      const count = await getSessionCount(playerId);
      return { earned: count >= 1, progress: { current: Math.min(count, 1), target: 1 } };
    },
  },
  {
    slug: 'regular-player',
    name: 'Regularny zawodnik',
    description: 'Ukończono 10 sesji treningowych.',
    category: 'training',
    icon: 'regularPlayer',
    async check(playerId) {
      const count = await getSessionCount(playerId);
      return { earned: count >= 10, progress: { current: Math.min(count, 10), target: 10 } };
    },
  },
  {
    slug: 'session-25',
    name: 'Ćwiczeniowiec',
    description: 'Ukończono 25 sesji treningowych.',
    category: 'training',
    icon: 'session25',
    async check(playerId) {
      const count = await getSessionCount(playerId);
      return { earned: count >= 25, progress: { current: Math.min(count, 25), target: 25 } };
    },
  },
  {
    slug: 'training-machine',
    name: 'Maszyna treningowa',
    description: 'Ukończono 50 sesji treningowych.',
    category: 'training',
    icon: 'trainingMachine',
    async check(playerId) {
      const count = await getSessionCount(playerId);
      return { earned: count >= 50, progress: { current: Math.min(count, 50), target: 50 } };
    },
  },
  {
    slug: 'session-centurion',
    name: 'Centurion',
    description: 'Ukończono 100 sesji treningowych.',
    category: 'training',
    icon: 'sessionCenturion',
    async check(playerId) {
      const count = await getSessionCount(playerId);
      return { earned: count >= 100, progress: { current: Math.min(count, 100), target: 100 } };
    },
  },
  {
    slug: 'hours-10',
    name: 'Pierwsze 10 godzin',
    description: 'Wytrenowano łącznie 10 godzin.',
    category: 'training',
    icon: 'hours10',
    async check(playerId) {
      const mins = await getTotalMinutes(playerId);
      return { earned: mins >= 600, progress: { current: Math.min(Math.floor(mins / 60), 10), target: 10 } };
    },
  },
  {
    slug: 'hours-50',
    name: '50 godzin na korcie',
    description: 'Wytrenowano łącznie 50 godzin.',
    category: 'training',
    icon: 'hours50',
    async check(playerId) {
      const mins = await getTotalMinutes(playerId);
      return { earned: mins >= 3000, progress: { current: Math.min(Math.floor(mins / 60), 50), target: 50 } };
    },
  },
  {
    slug: 'hours-100',
    name: 'Setka godzin',
    description: 'Wytrenowano łącznie 100 godzin.',
    category: 'training',
    icon: 'hours100',
    async check(playerId) {
      const mins = await getTotalMinutes(playerId);
      return { earned: mins >= 6000, progress: { current: Math.min(Math.floor(mins / 60), 100), target: 100 } };
    },
  },
  {
    slug: 'weekly-streak',
    name: 'Tygodniowa seria',
    description: 'Co najmniej 3 sesje treningowe w jednym tygodniu.',
    category: 'training',
    icon: 'weeklyStreak',
    async check(playerId) {
      const sessions = await Session.find({ player: playerId }).select('date').lean();
      const weekCounts = {};
      for (const s of sessions) {
        const key = getISOWeek(new Date(s.date));
        weekCounts[key] = (weekCounts[key] || 0) + 1;
      }
      const max = Math.max(0, ...Object.values(weekCounts));
      return { earned: max >= 3, progress: { current: Math.min(max, 3), target: 3 } };
    },
  },
  {
    slug: 'streak-master',
    name: 'Mistrz serii',
    description: 'Co najmniej 5 sesji treningowych w jednym tygodniu.',
    category: 'training',
    icon: 'streakMaster',
    async check(playerId) {
      const sessions = await Session.find({ player: playerId }).select('date').lean();
      const weekCounts = {};
      for (const s of sessions) {
        const key = getISOWeek(new Date(s.date));
        weekCounts[key] = (weekCounts[key] || 0) + 1;
      }
      const max = Math.max(0, ...Object.values(weekCounts));
      return { earned: max >= 5, progress: { current: Math.min(max, 5), target: 5 } };
    },
  },

  // ───── TOURNAMENT (8) ─────
  {
    slug: 'tournament-debut',
    name: 'Debiut turniejowy',
    description: 'Udział w pierwszym turnieju.',
    category: 'tournament',
    icon: 'tournamentDebut',
    async check(playerId) {
      const count = await getCompletedTournamentCount(playerId);
      return { earned: count >= 1, progress: { current: Math.min(count, 1), target: 1 } };
    },
  },
  {
    slug: 'winner',
    name: 'Zwycięzca',
    description: 'Zdobyto przynajmniej jedno zwycięstwo w turnieju.',
    category: 'tournament',
    icon: 'winner',
    async check(playerId) {
      const tournament = await Tournament.findOne({
        player: playerId,
        'result.wins': { $gte: 1 },
      }).lean();
      return { earned: !!tournament, progress: { current: tournament ? 1 : 0, target: 1 } };
    },
  },
  {
    slug: 'tournament-5',
    name: 'Obywatel turniejów',
    description: 'Udział w 5 turniejach.',
    category: 'tournament',
    icon: 'tournament5',
    async check(playerId) {
      const count = await getCompletedTournamentCount(playerId);
      return { earned: count >= 5, progress: { current: Math.min(count, 5), target: 5 } };
    },
  },
  {
    slug: 'tournament-10',
    name: 'Weteran turniejowy',
    description: 'Udział w 10 turniejach.',
    category: 'tournament',
    icon: 'tournament10',
    async check(playerId) {
      const count = await getCompletedTournamentCount(playerId);
      return { earned: count >= 10, progress: { current: Math.min(count, 10), target: 10 } };
    },
  },
  {
    slug: 'finalist',
    name: 'Finalista',
    description: 'Dotarcie do finału turnieju.',
    category: 'tournament',
    icon: 'finalist',
    async check(playerId) {
      const tournament = await Tournament.findOne({
        player: playerId,
        status: 'completed',
        'result.round': { $regex: /fina[lł]/i },
      }).lean();
      return { earned: !!tournament, progress: { current: tournament ? 1 : 0, target: 1 } };
    },
  },
  {
    slug: 'champion',
    name: 'Mistrz',
    description: 'Wygranie turnieju.',
    category: 'tournament',
    icon: 'champion',
    async check(playerId) {
      const tournament = await Tournament.findOne({
        player: playerId,
        status: 'completed',
        'result.round': { $regex: /fina[lł]/i },
        $expr: { $gt: ['$result.wins', '$result.losses'] },
      }).lean();
      return { earned: !!tournament, progress: { current: tournament ? 1 : 0, target: 1 } };
    },
  },
  {
    slug: 'court-traveler',
    name: 'Podróżnik kortowy',
    description: 'Sesje treningowe na co najmniej 3 różnych nawierzchniach.',
    category: 'tournament',
    icon: 'courtTraveler',
    async check(playerId) {
      const surfaces = await Session.distinct('surface', {
        player: playerId,
        surface: { $ne: '' },
      });
      const count = surfaces.length;
      return { earned: count >= 3, progress: { current: Math.min(count, 3), target: 3 } };
    },
  },
  {
    slug: 'multi-surface-pro',
    name: 'Wszechstronny kort',
    description: 'Turnieje na co najmniej 3 różnych nawierzchniach.',
    category: 'tournament',
    icon: 'multiSurfacePro',
    async check(playerId) {
      const surfaces = await Tournament.distinct('surface', {
        player: playerId,
        surface: { $nin: ['', null] },
        status: { $in: ['completed', 'in-progress'] },
      });
      const count = surfaces.length;
      return { earned: count >= 3, progress: { current: Math.min(count, 3), target: 3 } };
    },
  },

  // ───── DEVELOPMENT (5) ─────
  {
    slug: 'goal-achieved',
    name: 'Cel osiągnięty',
    description: 'Ukończono pierwszy cel rozwojowy.',
    category: 'development',
    icon: 'goalAchieved',
    async check(playerId) {
      const count = await getCompletedGoalCount(playerId);
      return { earned: count >= 1, progress: { current: Math.min(count, 1), target: 1 } };
    },
  },
  {
    slug: 'three-goals',
    name: 'Trzy cele',
    description: 'Ukończono 3 cele rozwojowe.',
    category: 'development',
    icon: 'threeGoals',
    async check(playerId) {
      const count = await getCompletedGoalCount(playerId);
      return { earned: count >= 3, progress: { current: Math.min(count, 3), target: 3 } };
    },
  },
  {
    slug: 'five-goals',
    name: 'Piątkowy cel',
    description: 'Ukończono 5 celów rozwojowych.',
    category: 'development',
    icon: 'fiveGoals',
    async check(playerId) {
      const count = await getCompletedGoalCount(playerId);
      return { earned: count >= 5, progress: { current: Math.min(count, 5), target: 5 } };
    },
  },
  {
    slug: 'all-types',
    name: 'Wszechstronny trening',
    description: 'Sesje treningowe we wszystkich 6 typach.',
    category: 'development',
    icon: 'allTypes',
    async check(playerId) {
      const types = await Session.distinct('sessionType', { player: playerId });
      const count = types.length;
      return { earned: count >= 6, progress: { current: Math.min(count, 6), target: 6 } };
    },
  },
  {
    slug: 'pathway-advance',
    name: 'Awans na ścieżce',
    description: 'Zmiana etapu na ścieżce rozwoju.',
    category: 'development',
    icon: 'pathwayAdvance',
    async check(playerId) {
      const player = await Player.findById(playerId).select('pathwayHistory').lean();
      const count = player?.pathwayHistory?.length || 0;
      return { earned: count >= 2, progress: { current: Math.min(count, 2), target: 2 } };
    },
  },

  // ───── COACH — manual badges (5) ─────
  {
    slug: 'coach-mvp',
    name: 'MVP miesiąca',
    description: 'Wyróżniony przez trenera jako MVP.',
    category: 'coach',
    icon: 'coachMvp',
    isManual: true,
  },
  {
    slug: 'coach-progress',
    name: 'Największy postęp',
    description: 'Wyróżnienie za duży postęp.',
    category: 'coach',
    icon: 'coachProgress',
    isManual: true,
  },
  {
    slug: 'coach-sportsmanship',
    name: 'Sportowe zachowanie',
    description: 'Wyróżnienie za fair play i sportową postawę.',
    category: 'coach',
    icon: 'coachSportsmanship',
    isManual: true,
  },
  {
    slug: 'coach-leader',
    name: 'Lider grupy',
    description: 'Wyróżnienie za przywództwo w grupie.',
    category: 'coach',
    icon: 'coachLeader',
    isManual: true,
  },
  {
    slug: 'coach-star',
    name: 'Gwiazda treningu',
    description: 'Specjalne wyróżnienie trenera.',
    category: 'coach',
    icon: 'coachStar',
    isManual: true,
  },
];

// ====== evaluateBadges ======

/**
 * Sprawdza wszystkie automatyczne odznaki dla gracza i przyznaje nowo zdobyte.
 * Wysyła powiadomienie do rodziców dla nowych odznak.
 * Fire-and-forget safe — łap błędy w wywołującym.
 */
export async function evaluateBadges(playerId, parentIds = []) {
  const earned = await PlayerBadge.find({ player: playerId }).select('badgeSlug').lean();
  const earnedSlugs = new Set(earned.map(b => b.badgeSlug));

  for (const def of BADGE_DEFINITIONS) {
    // Pomijaj ręczne odznaki i już zdobyte
    if (def.isManual) continue;
    if (earnedSlugs.has(def.slug)) continue;

    const result = await def.check(playerId);
    if (!result.earned) continue;

    try {
      await PlayerBadge.create({ player: playerId, badgeSlug: def.slug, type: 'automatic' });
    } catch (err) {
      if (err.code === 11000) continue;
      throw err;
    }

    // Powiadom rodziców
    for (const parentId of parentIds) {
      try {
        await Notification.create({
          user: parentId,
          type: 'system',
          title: `Nowa odznaka: ${def.name}`,
          body: def.description,
          severity: 'info',
          player: playerId,
          actionUrl: `/parent/child/${playerId}/badges`,
        });
      } catch (_) {
        // nie blokuj jeśli powiadomienie się nie uda
      }
    }
  }
}

// ====== getBadgeStatus ======

/**
 * Zwraca pełną listę odznak ze statusem (zdobyta/niezdobyta + postęp).
 * Dla odznak ręcznych dołącza info o trenerze i notatce.
 */
export async function getBadgeStatus(playerId) {
  const earned = await PlayerBadge.find({ player: playerId })
    .populate('awardedBy', 'firstName lastName')
    .lean();
  const earnedMap = new Map(earned.map(b => [b.badgeSlug, b]));

  const result = await Promise.all(
    BADGE_DEFINITIONS.map(async (def) => {
      const badge = earnedMap.get(def.slug);
      const isEarned = !!badge;
      let progress = { current: 0, target: 1 };
      if (!isEarned && !def.isManual) {
        try {
          const check = await def.check(playerId);
          progress = check.progress;
        } catch (_) {
          // zostaw domyślny progress
        }
      }
      const entry = {
        slug: def.slug,
        name: def.name,
        description: def.description,
        category: def.category,
        icon: def.icon,
        isManual: !!def.isManual,
        earned: isEarned,
        earnedAt: isEarned ? badge.earnedAt : null,
        progress: isEarned ? null : (def.isManual ? null : progress),
      };
      if (isEarned && badge.awardedBy) {
        entry.awardedBy = badge.awardedBy;
        entry.awardedNote = badge.awardedNote || null;
      }
      return entry;
    })
  );

  return result;
}
