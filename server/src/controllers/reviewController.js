import { z } from 'zod';
import ReviewSummary from '../models/ReviewSummary.js';
import Activity from '../models/Activity.js';
import Observation from '../models/Observation.js';
import DevelopmentGoal from '../models/DevelopmentGoal.js';

// ====== Zod Schemas ======

const createReviewSchema = z.object({
  player: z.string().min(1, 'Zawodnik jest wymagany'),
  club: z.string().optional(),
  title: z.string().optional(),
  periodType: z.enum(['weekly', 'monthly', 'quarterly', 'seasonal', 'ad-hoc']).optional(),
  periodStart: z.string().min(1, 'Data początkowa okresu jest wymagana'),
  periodEnd: z.string().min(1, 'Data końcowa okresu jest wymagana'),
  whatHappened: z.string().optional(),
  whatWentWell: z.string().optional(),
  whatNeedsFocus: z.string().optional(),
  nextSteps: z.string().optional(),
  goalsReviewed: z.array(z.string()).optional(),
  observations: z.array(z.string()).optional(),
  visibleToParent: z.boolean().optional(),
});

const updateReviewSchema = z.object({
  title: z.string().optional().nullable(),
  periodType: z.enum(['weekly', 'monthly', 'quarterly', 'seasonal', 'ad-hoc']).optional(),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  whatHappened: z.string().optional().nullable(),
  whatWentWell: z.string().optional().nullable(),
  whatNeedsFocus: z.string().optional().nullable(),
  nextSteps: z.string().optional().nullable(),
  goalsReviewed: z.array(z.string()).optional(),
  observations: z.array(z.string()).optional(),
  activitiesCount: z.number().min(0).optional(),
  aiGenerated: z.boolean().optional(),
  aiDraft: z.string().optional().nullable(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  visibleToParent: z.boolean().optional(),
});

// ====== Kontrolery ======

/**
 * GET /api/reviews?player=X&status=X
 * Lista przeglądów
 */
export const getReviews = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.player) {
      filter.player = req.query.player;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Rodzic widzi tylko opublikowane i widoczne przeglądy
    if (req.user.role === 'parent') {
      const childrenIds = req.user.parentProfile?.children || [];
      if (childrenIds.length === 0) {
        return res.json({ reviews: [] });
      }
      filter.player = filter.player ? filter.player : { $in: childrenIds };
      filter.status = 'published';
      filter.visibleToParent = true;
    }

    // Coach widzi swoje przeglądy
    if (req.user.role === 'coach') {
      if (!filter.player) {
        filter.author = req.user._id;
      }
    }

    // clubAdmin widzi przeglądy z klubu
    if (req.user.role === 'clubAdmin' && req.user.club) {
      if (!filter.player) {
        filter.club = req.user.club;
      }
    }

    const reviews = await ReviewSummary.find(filter)
      .populate('player', 'firstName lastName')
      .populate('author', 'firstName lastName role')
      .populate('goalsReviewed', 'title status progress')
      .sort({ periodEnd: -1 });

    res.json({ reviews });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/reviews
 * Utwórz przegląd (coach)
 */
export const createReview = async (req, res, next) => {
  try {
    const data = createReviewSchema.parse(req.body);

    const reviewData = {
      ...data,
      author: req.user._id,
      periodStart: new Date(data.periodStart),
      periodEnd: new Date(data.periodEnd),
    };

    // Jeśli nie podano klubu, użyj klubu użytkownika
    if (!data.club && req.user.club) {
      reviewData.club = req.user.club;
    }

    const review = await ReviewSummary.create(reviewData);

    const populatedReview = await ReviewSummary.findById(review._id)
      .populate('player', 'firstName lastName')
      .populate('author', 'firstName lastName role')
      .populate('goalsReviewed', 'title status progress');

    res.status(201).json({
      message: 'Przegląd został utworzony',
      review: populatedReview,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reviews/:id
 * Szczegóły przeglądu
 */
export const getReview = async (req, res, next) => {
  try {
    const review = await ReviewSummary.findById(req.params.id)
      .populate('player', 'firstName lastName')
      .populate('author', 'firstName lastName role')
      .populate('goalsReviewed', 'title status progress category')
      .populate('observations', 'text type engagement effort mood');

    if (!review) {
      return res.status(404).json({ message: 'Przegląd nie znaleziony' });
    }

    // Rodzic widzi tylko opublikowane przeglądy
    if (req.user.role === 'parent') {
      const childrenIds = (req.user.parentProfile?.children || []).map((c) => c.toString());
      if (!childrenIds.includes(review.player._id.toString()) || review.status !== 'published' || !review.visibleToParent) {
        return res.status(403).json({ message: 'Brak dostępu do tego przeglądu' });
      }
    }

    res.json({ review });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/reviews/:id
 * Aktualizuj/opublikuj przegląd
 */
export const updateReview = async (req, res, next) => {
  try {
    const data = updateReviewSchema.parse(req.body);

    const review = await ReviewSummary.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Przegląd nie znaleziony' });
    }

    const fields = [
      'title', 'periodType', 'whatHappened', 'whatWentWell', 'whatNeedsFocus',
      'nextSteps', 'goalsReviewed', 'observations', 'activitiesCount',
      'aiGenerated', 'aiDraft', 'status', 'visibleToParent',
    ];

    for (const field of fields) {
      if (data[field] !== undefined) {
        review[field] = data[field];
      }
    }

    if (data.periodStart !== undefined) review.periodStart = new Date(data.periodStart);
    if (data.periodEnd !== undefined) review.periodEnd = new Date(data.periodEnd);

    // Ustaw datę publikacji
    if (data.status === 'published' && !review.publishedAt) {
      review.publishedAt = new Date();
    }

    await review.save();

    const updatedReview = await ReviewSummary.findById(review._id)
      .populate('player', 'firstName lastName')
      .populate('author', 'firstName lastName role')
      .populate('goalsReviewed', 'title status progress');

    res.json({
      message: 'Przegląd został zaktualizowany',
      review: updatedReview,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reviews/:id/prefill
 * Auto-agregacja danych dla okresu przeglądu
 */
export const prefillReview = async (req, res, next) => {
  try {
    const review = await ReviewSummary.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Przegląd nie znaleziony' });
    }

    const playerId = review.player;
    const periodStart = review.periodStart;
    const periodEnd = review.periodEnd;

    // Policz aktywności w okresie
    const activitiesCount = await Activity.countDocuments({
      players: playerId,
      date: { $gte: periodStart, $lte: periodEnd },
    });

    // Pobierz obserwacje w okresie
    const observations = await Observation.find({
      player: playerId,
      createdAt: { $gte: periodStart, $lte: periodEnd },
    })
      .populate('author', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Aktywne cele
    const activeGoals = await DevelopmentGoal.find({
      player: playerId,
      status: 'active',
    }).sort({ createdAt: -1 });

    // Aktywności z frekwencją
    const activitiesWithAttendance = await Activity.find({
      players: playerId,
      date: { $gte: periodStart, $lte: periodEnd },
      'attendance.0': { $exists: true },
    }).select('attendance date type title');

    // Oblicz statystyki frekwencji
    let attendancePresent = 0;
    let attendanceTotal = 0;
    for (const act of activitiesWithAttendance) {
      for (const att of act.attendance) {
        if (att.player?.toString() === playerId.toString()) {
          attendanceTotal++;
          if (att.status === 'present') attendancePresent++;
        }
      }
    }

    res.json({
      prefill: {
        activitiesCount,
        observations,
        activeGoals,
        attendanceRate: attendanceTotal > 0
          ? Math.round((attendancePresent / attendanceTotal) * 100)
          : null,
        periodStart,
        periodEnd,
      },
    });
  } catch (error) {
    next(error);
  }
};
