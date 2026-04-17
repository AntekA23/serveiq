import { z } from 'zod';
import DevelopmentGoal from '../models/DevelopmentGoal.js';
import Player from '../models/Player.js';
import { evaluateBadges } from '../services/badgeEngine.js';

// ====== Zod Schemas ======

const createGoalSchema = z.object({
  player: z.string().min(1, 'Zawodnik jest wymagany'),
  club: z.string().optional(),
  title: z.string().min(1, 'Tytuł celu jest wymagany'),
  description: z.string().optional(),
  category: z.enum([
    'fundamentals', 'movement', 'consistency', 'confidence',
    'match-routines', 'recovery', 'school-balance', 'fitness',
    'tactics', 'serve', 'other',
  ]).optional(),
  timeframe: z.enum(['weekly', 'monthly', 'quarterly', 'seasonal', 'yearly']).optional(),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
  visibleToParent: z.boolean().optional(),
  visibleToPlayer: z.boolean().optional(),
});

const updateGoalSchema = z.object({
  title: z.string().min(1, 'Tytuł celu jest wymagany').optional(),
  description: z.string().optional().nullable(),
  category: z.enum([
    'fundamentals', 'movement', 'consistency', 'confidence',
    'match-routines', 'recovery', 'school-balance', 'fitness',
    'tactics', 'serve', 'other',
  ]).optional(),
  timeframe: z.enum(['weekly', 'monthly', 'quarterly', 'seasonal', 'yearly']).optional(),
  targetDate: z.string().optional().nullable(),
  status: z.enum(['active', 'completed', 'paused', 'dropped']).optional(),
  progress: z.number().min(0).max(100).optional(),
  visibleToParent: z.boolean().optional(),
  visibleToPlayer: z.boolean().optional(),
});

// ====== Kontrolery ======

/**
 * GET /api/goals?player=X&status=active
 * Lista celów rozwojowych
 */
export const getGoals = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.player) {
      filter.player = req.query.player;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Rodzic widzi tylko cele widoczne dla rodzica
    if (req.user.role === 'parent') {
      const childrenIds = req.user.parentProfile?.children || [];
      if (childrenIds.length === 0) {
        return res.json({ goals: [] });
      }
      filter.player = filter.player ? filter.player : { $in: childrenIds };
      filter.visibleToParent = true;
    }

    // Coach widzi cele swoich graczy lub klubowe
    if (req.user.role === 'coach') {
      if (!filter.player) {
        filter.createdBy = req.user._id;
      }
    }

    // clubAdmin widzi cele z klubu
    if (req.user.role === 'clubAdmin' && req.user.club) {
      if (!filter.player) {
        filter.club = req.user.club;
      }
    }

    const goals = await DevelopmentGoal.find(filter)
      .populate('player', 'firstName lastName')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({ goals });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/goals
 * Utwórz cel rozwojowy (coach, clubAdmin)
 */
export const createGoal = async (req, res, next) => {
  try {
    const data = createGoalSchema.parse(req.body);

    const goalData = {
      ...data,
      createdBy: req.user._id,
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
    };

    // Jeśli nie podano klubu, użyj klubu użytkownika
    if (!data.club && req.user.club) {
      goalData.club = req.user.club;
    }

    const goal = await DevelopmentGoal.create(goalData);

    const populatedGoal = await DevelopmentGoal.findById(goal._id)
      .populate('player', 'firstName lastName')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({
      message: 'Cel rozwojowy został utworzony',
      goal: populatedGoal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/goals/:id
 * Aktualizuj cel (postęp, status itd.)
 */
export const updateGoal = async (req, res, next) => {
  try {
    const data = updateGoalSchema.parse(req.body);

    const goal = await DevelopmentGoal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: 'Cel nie znaleziony' });
    }

    const fields = [
      'title', 'description', 'category', 'timeframe',
      'status', 'progress', 'visibleToParent', 'visibleToPlayer',
    ];

    for (const field of fields) {
      if (data[field] !== undefined) {
        goal[field] = data[field];
      }
    }

    if (data.targetDate !== undefined) {
      goal.targetDate = data.targetDate ? new Date(data.targetDate) : null;
    }

    // Ustaw datę ukończenia przy zmianie statusu
    if (data.status === 'completed' && !goal.completedAt) {
      goal.completedAt = new Date();
    } else if (data.status && data.status !== 'completed') {
      goal.completedAt = null;
    }

    await goal.save();

    // Ewaluacja odznak przy ukończeniu celu (fire-and-forget)
    if (data.status === 'completed') {
      const playerForBadges = await Player.findById(goal.player).select('parents').lean();
      if (playerForBadges) {
        const parentIds = (playerForBadges.parents || []).map(String);
        evaluateBadges(goal.player, parentIds).catch(() => {});
      }
    }

    const updatedGoal = await DevelopmentGoal.findById(goal._id)
      .populate('player', 'firstName lastName')
      .populate('createdBy', 'firstName lastName');

    res.json({
      message: 'Cel został zaktualizowany',
      goal: updatedGoal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/goals/:id
 * Usuń cel
 */
export const deleteGoal = async (req, res, next) => {
  try {
    const goal = await DevelopmentGoal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: 'Cel nie znaleziony' });
    }

    await DevelopmentGoal.findByIdAndDelete(req.params.id);

    res.json({ message: 'Cel został usunięty' });
  } catch (error) {
    next(error);
  }
};
