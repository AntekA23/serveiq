import { z } from 'zod';
import Recommendation from '../models/Recommendation.js';

// ====== Zod Schemas ======

const createRecommendationSchema = z.object({
  player: z.string().min(1, 'Zawodnik jest wymagany'),
  club: z.string().optional(),
  review: z.string().optional(),
  type: z.enum([
    'pathway-advance', 'focus-change', 'activity-suggest',
    'workload-adjust', 'support-need', 'general',
  ]),
  title: z.string().min(1, 'Tytuł rekomendacji jest wymagany'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  visibleToParent: z.boolean().optional(),
});

const updateRecommendationSchema = z.object({
  type: z.enum([
    'pathway-advance', 'focus-change', 'activity-suggest',
    'workload-adjust', 'support-need', 'general',
  ]).optional(),
  title: z.string().min(1, 'Tytuł rekomendacji jest wymagany').optional(),
  description: z.string().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['pending', 'accepted', 'in-progress', 'completed', 'dismissed']).optional(),
  visibleToParent: z.boolean().optional(),
});

// ====== Kontrolery ======

/**
 * GET /api/recommendations?player=X&status=pending
 * Lista rekomendacji
 */
export const getRecommendations = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.player) {
      filter.player = req.query.player;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Rodzic widzi tylko rekomendacje widoczne dla rodzica
    if (req.user.role === 'parent') {
      const childrenIds = req.user.parentProfile?.children || [];
      if (childrenIds.length === 0) {
        return res.json({ recommendations: [] });
      }
      filter.player = filter.player ? filter.player : { $in: childrenIds };
      filter.visibleToParent = true;
    }

    // Coach widzi swoje rekomendacje
    if (req.user.role === 'coach') {
      if (!filter.player) {
        filter.author = req.user._id;
      }
    }

    // clubAdmin widzi rekomendacje z klubu
    if (req.user.role === 'clubAdmin' && req.user.club) {
      if (!filter.player) {
        filter.club = req.user.club;
      }
    }

    const recommendations = await Recommendation.find(filter)
      .populate('player', 'firstName lastName')
      .populate('author', 'firstName lastName role')
      .populate('review', 'periodType periodStart periodEnd')
      .populate('resolvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({ recommendations });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/recommendations
 * Utwórz rekomendację (coach)
 */
export const createRecommendation = async (req, res, next) => {
  try {
    const data = createRecommendationSchema.parse(req.body);

    const recommendationData = {
      ...data,
      author: req.user._id,
    };

    // Jeśli nie podano klubu, użyj klubu użytkownika
    if (!data.club && req.user.club) {
      recommendationData.club = req.user.club;
    }

    const recommendation = await Recommendation.create(recommendationData);

    const populatedRecommendation = await Recommendation.findById(recommendation._id)
      .populate('player', 'firstName lastName')
      .populate('author', 'firstName lastName role')
      .populate('review', 'periodType periodStart periodEnd');

    res.status(201).json({
      message: 'Rekomendacja została utworzona',
      recommendation: populatedRecommendation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/recommendations/:id
 * Aktualizuj status rekomendacji (zaakceptuj, odrzuć, zakończ)
 */
export const updateRecommendation = async (req, res, next) => {
  try {
    const data = updateRecommendationSchema.parse(req.body);

    const recommendation = await Recommendation.findById(req.params.id);

    if (!recommendation) {
      return res.status(404).json({ message: 'Rekomendacja nie znaleziona' });
    }

    const fields = ['type', 'title', 'description', 'priority', 'status', 'visibleToParent'];

    for (const field of fields) {
      if (data[field] !== undefined) {
        recommendation[field] = data[field];
      }
    }

    // Ustaw dane rozwiązania
    if (data.status && ['completed', 'dismissed'].includes(data.status)) {
      recommendation.resolvedAt = new Date();
      recommendation.resolvedBy = req.user._id;
    } else if (data.status && !['completed', 'dismissed'].includes(data.status)) {
      recommendation.resolvedAt = null;
      recommendation.resolvedBy = null;
    }

    await recommendation.save();

    const updatedRecommendation = await Recommendation.findById(recommendation._id)
      .populate('player', 'firstName lastName')
      .populate('author', 'firstName lastName role')
      .populate('review', 'periodType periodStart periodEnd')
      .populate('resolvedBy', 'firstName lastName');

    res.json({
      message: 'Rekomendacja została zaktualizowana',
      recommendation: updatedRecommendation,
    });
  } catch (error) {
    next(error);
  }
};
