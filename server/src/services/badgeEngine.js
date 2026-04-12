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

// ====== Badge Definitions ======

export const BADGE_DEFINITIONS = [
  // ----- Training -----
  {
    slug: 'first-session',
    name: 'Pierwsza sesja',
    description: 'Ukończono pierwszą sesję treningową.',
    category: 'training',
    icon: 'firstSession',
    async check(playerId) {
      const count = await Session.countDocuments({ player: playerId });
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
      const count = await Session.countDocuments({ player: playerId });
      return { earned: count >= 10, progress: { current: Math.min(count, 10), target: 10 } };
    },
  },
  {
    slug: 'training-machine',
    name: 'Maszyna treningowa',
    description: 'Ukończono 50 sesji treningowych.',
    category: 'training',
    icon: 'trainingMachine',
    async check(playerId) {
      const count = await Session.countDocuments({ player: playerId });
      return { earned: count >= 50, progress: { current: Math.min(count, 50), target: 50 } };
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

  // ----- Tournament -----
  {
    slug: 'tournament-debut',
    name: 'Debiut turniejowy',
    description: 'Udział w pierwszym turnieju.',
    category: 'tournament',
    icon: 'tournamentDebut',
    async check(playerId) {
      const count = await Tournament.countDocuments({
        player: playerId,
        status: { $in: ['completed', 'in-progress'] },
      });
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

  // ----- Special -----
  {
    slug: 'goal-achieved',
    name: 'Cel osiągnięty',
    description: 'Ukończono pierwszy cel rozwojowy.',
    category: 'special',
    icon: 'goalAchieved',
    async check(playerId) {
      const count = await DevelopmentGoal.countDocuments({ player: playerId, status: 'completed' });
      return { earned: count >= 1, progress: { current: Math.min(count, 1), target: 1 } };
    },
  },
  {
    slug: 'three-goals',
    name: 'Trzy cele',
    description: 'Ukończono 3 cele rozwojowe.',
    category: 'special',
    icon: 'threeGoals',
    async check(playerId) {
      const count = await DevelopmentGoal.countDocuments({ player: playerId, status: 'completed' });
      return { earned: count >= 3, progress: { current: Math.min(count, 3), target: 3 } };
    },
  },
];

// ====== evaluateBadges ======

/**
 * Sprawdza wszystkie odznaki dla gracza i przyznaje nowo zdobyte.
 * Wysyła powiadomienie do rodziców dla nowych odznak.
 * Fire-and-forget safe — łap błędy w wywołującym.
 *
 * @param {string|ObjectId} playerId
 * @param {string[]} parentIds
 */
export async function evaluateBadges(playerId, parentIds = []) {
  // Pobierz już zdobyte odznaki
  const earned = await PlayerBadge.find({ player: playerId }).select('badgeSlug').lean();
  const earnedSlugs = new Set(earned.map(b => b.badgeSlug));

  for (const def of BADGE_DEFINITIONS) {
    if (earnedSlugs.has(def.slug)) continue;

    const result = await def.check(playerId);
    if (!result.earned) continue;

    // Zapisz odznakę (ignoruj duplikat jeśli race condition)
    try {
      await PlayerBadge.create({ player: playerId, badgeSlug: def.slug });
    } catch (err) {
      if (err.code === 11000) continue; // duplicate key — already earned
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
 * Nie przyznaje żadnych odznak.
 *
 * @param {string|ObjectId} playerId
 * @returns {Promise<Array>}
 */
export async function getBadgeStatus(playerId) {
  const earned = await PlayerBadge.find({ player: playerId }).select('badgeSlug earnedAt').lean();
  const earnedMap = new Map(earned.map(b => [b.badgeSlug, b.earnedAt]));

  const result = await Promise.all(
    BADGE_DEFINITIONS.map(async (def) => {
      const isEarned = earnedMap.has(def.slug);
      let progress = { current: 0, target: 1 };
      if (!isEarned) {
        try {
          const check = await def.check(playerId);
          progress = check.progress;
        } catch (_) {
          // zostaw domyślny progress
        }
      }
      return {
        slug: def.slug,
        name: def.name,
        description: def.description,
        category: def.category,
        icon: def.icon,
        earned: isEarned,
        earnedAt: isEarned ? earnedMap.get(def.slug) : null,
        progress: isEarned ? null : progress,
      };
    })
  );

  return result;
}
