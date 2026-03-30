import { z } from 'zod';
import Review from '../models/Review.js';
import Player from '../models/Player.js';
import Notification from '../models/Notification.js';

// ====== Zod Schemas ======

const createReviewSchema = z.object({
  player: z.string().min(1, 'Zawodnik jest wymagany'),
  periodStart: z.string().min(1, 'Data poczatku okresu jest wymagana'),
  periodEnd: z.string().min(1, 'Data konca okresu jest wymagana'),
  type: z.enum(['monthly', 'quarterly', 'tournament', 'milestone', 'general']).optional(),
  title: z.string().min(1, 'Tytul oceny jest wymagany'),
  strengths: z.string().optional(),
  areasToImprove: z.string().optional(),
  recommendations: z.string().optional(),
  notes: z.string().optional(),
  skillRatings: z.object({
    serve: z.number().min(0).max(100).optional(),
    forehand: z.number().min(0).max(100).optional(),
    backhand: z.number().min(0).max(100).optional(),
    volley: z.number().min(0).max(100).optional(),
    tactics: z.number().min(0).max(100).optional(),
    fitness: z.number().min(0).max(100).optional(),
  }).optional(),
  overallRating: z.number().min(1).max(5).optional(),
  visibleToParent: z.boolean().optional(),
  status: z.enum(['draft', 'published']).optional(),
});

const updateReviewSchema = createReviewSchema.partial().omit({ player: true });

// ====== Kontrolery ======

/**
 * GET /api/reviews
 * Coach → swoje oceny. Parent → oceny dzieci (opublikowane).
 */
export const getReviews = async (req, res, next) => {
  try {
    const { player } = req.query;
    const filter = {};

    if (req.user.role === 'coach') {
      filter.coach = req.user._id;
    } else if (req.user.role === 'parent') {
      const childrenIds = req.user.parentProfile?.children || [];
      if (childrenIds.length === 0) return res.json({ reviews: [] });
      filter.player = { $in: childrenIds };
      filter.visibleToParent = true;
      filter.status = 'published';
    }

    if (player) {
      filter.player = player;
    }

    const reviews = await Review.find(filter)
      .populate('player', 'firstName lastName')
      .populate('coach', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({ reviews });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reviews/:id
 */
export const getReview = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };

    if (req.user.role === 'coach') {
      filter.coach = req.user._id;
    } else if (req.user.role === 'parent') {
      const childrenIds = req.user.parentProfile?.children || [];
      filter.player = { $in: childrenIds };
      filter.visibleToParent = true;
      filter.status = 'published';
    }

    const review = await Review.findOne(filter)
      .populate('player', 'firstName lastName')
      .populate('coach', 'firstName lastName');

    if (!review) {
      return res.status(404).json({ message: 'Ocena nie znaleziona' });
    }

    res.json({ review });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/reviews
 * Coach tworzy ocene
 */
export const createReview = async (req, res, next) => {
  try {
    const data = createReviewSchema.parse(req.body);

    // Verify player belongs to this coach
    const player = await Player.findOne({ _id: data.player, coach: req.user._id, active: true });
    if (!player) {
      return res.status(404).json({ message: 'Zawodnik nie znaleziony' });
    }

    // Snapshot current skills if not provided
    const skillRatings = data.skillRatings || {};
    if (player.skills) {
      for (const [key, val] of Object.entries(player.skills.toObject ? player.skills.toObject() : player.skills)) {
        if (val && typeof val.score === 'number' && skillRatings[key] === undefined) {
          skillRatings[key] = val.score;
        }
      }
    }

    const review = await Review.create({
      ...data,
      coach: req.user._id,
      periodStart: new Date(data.periodStart),
      periodEnd: new Date(data.periodEnd),
      skillRatings,
    });

    // Notify parent(s) if published and visible
    if (data.status === 'published' && data.visibleToParent !== false) {
      const parentIds = player.parents || [];
      for (const parentId of parentIds) {
        await Notification.create({
          user: parentId,
          type: 'system',
          title: 'Nowa ocena od trenera',
          body: `Trener wystawil ocene dla ${player.firstName}: "${data.title}"`,
          severity: 'info',
          player: player._id,
          actionUrl: `/parent/child/${player._id}/reviews`,
        });
      }
    }

    const populatedReview = await Review.findById(review._id)
      .populate('player', 'firstName lastName')
      .populate('coach', 'firstName lastName');

    res.status(201).json({
      message: 'Ocena zostala utworzona',
      review: populatedReview,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/reviews/:id
 */
export const updateReview = async (req, res, next) => {
  try {
    const data = updateReviewSchema.parse(req.body);

    const review = await Review.findOne({
      _id: req.params.id,
      coach: req.user._id,
    });

    if (!review) {
      return res.status(404).json({ message: 'Ocena nie znaleziona' });
    }

    const wasDraft = review.status === 'draft';

    // Update fields
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        if (key === 'periodStart' || key === 'periodEnd') {
          review[key] = new Date(value);
        } else {
          review[key] = value;
        }
      }
    }

    await review.save();

    // Notify parents if just published
    if (wasDraft && review.status === 'published' && review.visibleToParent) {
      const player = await Player.findById(review.player);
      if (player) {
        const parentIds = player.parents || [];
        for (const parentId of parentIds) {
          await Notification.create({
            user: parentId,
            type: 'system',
            title: 'Nowa ocena od trenera',
            body: `Trener wystawil ocene dla ${player.firstName}: "${review.title}"`,
            severity: 'info',
            player: player._id,
            actionUrl: `/parent/child/${player._id}/reviews`,
          });
        }
      }
    }

    const updatedReview = await Review.findById(review._id)
      .populate('player', 'firstName lastName')
      .populate('coach', 'firstName lastName');

    res.json({
      message: 'Ocena zostala zaktualizowana',
      review: updatedReview,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/reviews/:id
 */
export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findOneAndDelete({
      _id: req.params.id,
      coach: req.user._id,
    });

    if (!review) {
      return res.status(404).json({ message: 'Ocena nie znaleziona' });
    }

    res.json({ message: 'Ocena zostala usunieta' });
  } catch (error) {
    next(error);
  }
};
