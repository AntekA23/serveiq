import Activity from '../models/Activity.js';
import Observation from '../models/Observation.js';
import ReviewSummary from '../models/ReviewSummary.js';
import Recommendation from '../models/Recommendation.js';

// ====== Kontrolery ======

/**
 * GET /api/timeline?player=X&limit=20&offset=0
 * Zagregowana oś czasu gracza
 */
export const getTimeline = async (req, res, next) => {
  try {
    const { player } = req.query;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = parseInt(req.query.offset, 10) || 0;

    if (!player) {
      return res.status(400).json({ message: 'Parametr player jest wymagany' });
    }

    // Filtr widoczności dla rodzica
    const isParent = req.user.role === 'parent';
    const parentVisibility = isParent ? { visibleToParent: true } : {};

    // Pobierz aktywności
    const activities = await Activity.find({
      players: player,
      ...parentVisibility,
    })
      .populate('coach', 'firstName lastName role')
      .populate('players', 'firstName lastName')
      .sort({ date: -1 })
      .lean();

    // Pobierz obserwacje
    const observations = await Observation.find({
      player,
      ...parentVisibility,
    })
      .populate('author', 'firstName lastName role')
      .populate('player', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();

    // Pobierz przeglądy (tylko opublikowane)
    const reviewFilter = { player, status: 'published' };
    if (isParent) reviewFilter.visibleToParent = true;

    const reviews = await ReviewSummary.find(reviewFilter)
      .populate('author', 'firstName lastName role')
      .populate('player', 'firstName lastName')
      .sort({ periodEnd: -1 })
      .lean();

    // Pobierz rekomendacje
    const recommendations = await Recommendation.find({
      player,
      ...parentVisibility,
    })
      .populate('author', 'firstName lastName role')
      .populate('player', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();

    // Mapuj do ujednoliconego formatu
    const entries = [];

    for (const a of activities) {
      entries.push({
        id: a._id,
        source: 'activity',
        date: a.date,
        type: a.type,
        title: a.title,
        summary: a.notes || a.description || '',
        author: a.coach
          ? { name: `${a.coach.firstName} ${a.coach.lastName}`, role: a.coach.role }
          : null,
        player: a.players?.[0]
          ? { name: `${a.players[0].firstName} ${a.players[0].lastName}` }
          : null,
        pinned: false,
        metadata: {
          status: a.status,
          durationMinutes: a.durationMinutes,
          surface: a.surface,
          focusAreas: a.focusAreas,
        },
      });
    }

    for (const o of observations) {
      entries.push({
        id: o._id,
        source: 'observation',
        date: o.createdAt,
        type: o.type,
        title: `Obserwacja: ${o.type}`,
        summary: o.text,
        author: o.author
          ? { name: `${o.author.firstName} ${o.author.lastName}`, role: o.author.role }
          : null,
        player: o.player
          ? { name: `${o.player.firstName} ${o.player.lastName}` }
          : null,
        pinned: o.pinned || false,
        metadata: {
          engagement: o.engagement,
          effort: o.effort,
          mood: o.mood,
          focusAreas: o.focusAreas,
        },
      });
    }

    for (const r of reviews) {
      entries.push({
        id: r._id,
        source: 'review',
        date: r.publishedAt || r.periodEnd,
        type: r.periodType,
        title: `Przegląd: ${r.periodType}`,
        summary: r.whatHappened || '',
        author: r.author
          ? { name: `${r.author.firstName} ${r.author.lastName}`, role: r.author.role }
          : null,
        player: r.player
          ? { name: `${r.player.firstName} ${r.player.lastName}` }
          : null,
        pinned: false,
        metadata: {
          periodStart: r.periodStart,
          periodEnd: r.periodEnd,
          activitiesCount: r.activitiesCount,
        },
      });
    }

    for (const rec of recommendations) {
      entries.push({
        id: rec._id,
        source: 'recommendation',
        date: rec.createdAt,
        type: rec.type,
        title: rec.title,
        summary: rec.description || '',
        author: rec.author
          ? { name: `${rec.author.firstName} ${rec.author.lastName}`, role: rec.author.role }
          : null,
        player: rec.player
          ? { name: `${rec.player.firstName} ${rec.player.lastName}` }
          : null,
        pinned: false,
        metadata: {
          priority: rec.priority,
          status: rec.status,
        },
      });
    }

    // Sortuj po dacie malejąco, przypięte na górze
    entries.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.date) - new Date(a.date);
    });

    // Paginacja
    const total = entries.length;
    const paged = entries.slice(offset, offset + limit);

    res.json({
      timeline: paged,
      total,
      limit,
      offset,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/timeline/club?club=X&limit=20
 * Oś czasu klubu — feed ogólny
 */
export const getClubTimeline = async (req, res, next) => {
  try {
    const { club } = req.query;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = parseInt(req.query.offset, 10) || 0;

    if (!club) {
      return res.status(400).json({ message: 'Parametr club jest wymagany' });
    }

    // Pobierz ostatnie aktywności
    const activities = await Activity.find({ club })
      .populate('coach', 'firstName lastName role')
      .populate('players', 'firstName lastName')
      .sort({ date: -1 })
      .limit(limit * 2)
      .lean();

    // Pobierz ostatnie obserwacje
    const observations = await Observation.find({ club })
      .populate('author', 'firstName lastName role')
      .populate('player', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 2)
      .lean();

    // Pobierz ostatnie opublikowane przeglądy
    const reviews = await ReviewSummary.find({ club, status: 'published' })
      .populate('author', 'firstName lastName role')
      .populate('player', 'firstName lastName')
      .sort({ periodEnd: -1 })
      .limit(limit)
      .lean();

    // Pobierz ostatnie rekomendacje
    const recommendations = await Recommendation.find({ club })
      .populate('author', 'firstName lastName role')
      .populate('player', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Mapuj do ujednoliconego formatu
    const entries = [];

    for (const a of activities) {
      entries.push({
        id: a._id,
        source: 'activity',
        date: a.date,
        type: a.type,
        title: a.title,
        summary: a.notes || a.description || '',
        author: a.coach
          ? { name: `${a.coach.firstName} ${a.coach.lastName}`, role: a.coach.role }
          : null,
        player: a.players?.[0]
          ? { name: `${a.players[0].firstName} ${a.players[0].lastName}` }
          : null,
        pinned: false,
        metadata: {
          status: a.status,
          durationMinutes: a.durationMinutes,
          playersCount: a.players?.length || 0,
        },
      });
    }

    for (const o of observations) {
      entries.push({
        id: o._id,
        source: 'observation',
        date: o.createdAt,
        type: o.type,
        title: `Obserwacja: ${o.type}`,
        summary: o.text,
        author: o.author
          ? { name: `${o.author.firstName} ${o.author.lastName}`, role: o.author.role }
          : null,
        player: o.player
          ? { name: `${o.player.firstName} ${o.player.lastName}` }
          : null,
        pinned: o.pinned || false,
        metadata: {
          engagement: o.engagement,
          effort: o.effort,
        },
      });
    }

    for (const r of reviews) {
      entries.push({
        id: r._id,
        source: 'review',
        date: r.publishedAt || r.periodEnd,
        type: r.periodType,
        title: `Przegląd: ${r.periodType}`,
        summary: r.whatHappened || '',
        author: r.author
          ? { name: `${r.author.firstName} ${r.author.lastName}`, role: r.author.role }
          : null,
        player: r.player
          ? { name: `${r.player.firstName} ${r.player.lastName}` }
          : null,
        pinned: false,
        metadata: {
          periodStart: r.periodStart,
          periodEnd: r.periodEnd,
        },
      });
    }

    for (const rec of recommendations) {
      entries.push({
        id: rec._id,
        source: 'recommendation',
        date: rec.createdAt,
        type: rec.type,
        title: rec.title,
        summary: rec.description || '',
        author: rec.author
          ? { name: `${rec.author.firstName} ${rec.author.lastName}`, role: rec.author.role }
          : null,
        player: rec.player
          ? { name: `${rec.player.firstName} ${rec.player.lastName}` }
          : null,
        pinned: false,
        metadata: {
          priority: rec.priority,
          status: rec.status,
        },
      });
    }

    // Sortuj po dacie malejąco, przypięte na górze
    entries.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.date) - new Date(a.date);
    });

    // Paginacja
    const total = entries.length;
    const paged = entries.slice(offset, offset + limit);

    res.json({
      timeline: paged,
      total,
      limit,
      offset,
    });
  } catch (error) {
    next(error);
  }
};
