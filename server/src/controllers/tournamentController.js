import { z } from 'zod';
import Tournament from '../models/Tournament.js';
import Player from '../models/Player.js';
import { evaluateBadges } from '../services/badgeEngine.js';

// ====== Zod Schemas ======

const createTournamentSchema = z.object({
  player: z.string().min(1, 'Zawodnik jest wymagany'),
  name: z.string().min(1, 'Nazwa turnieju jest wymagana'),
  location: z.string().optional(),
  surface: z.enum(['clay', 'hard', 'grass', 'carpet', 'indoor-hard']).optional(),
  startDate: z.string().min(1, 'Data rozpoczęcia jest wymagana'),
  endDate: z.string().optional(),
  category: z.string().optional(),
  drawSize: z.number().positive().optional(),
  notes: z.string().optional(),
});

const updateTournamentSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().optional().nullable(),
  surface: z.enum(['clay', 'hard', 'grass', 'carpet', 'indoor-hard']).optional().nullable(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  drawSize: z.number().positive().optional().nullable(),
  status: z.enum(['planned', 'in-progress', 'completed', 'cancelled']).optional(),
  result: z
    .object({
      round: z.string().optional(),
      wins: z.number().min(0).optional(),
      losses: z.number().min(0).optional(),
      scores: z.array(z.string()).optional(),
      rating: z.number().min(1).max(5).optional(),
    })
    .optional(),
  notes: z.string().optional().nullable(),
});

// ====== Kontrolery ======

/**
 * GET /api/tournaments
 * Coach widzi swoje, parent widzi turnieje dzieci.
 * Query: ?player=id&status=planned
 */
export const getTournaments = async (req, res, next) => {
  try {
    const filter = {};

    if (req.user.role === 'coach') {
      filter.coach = req.user._id;
    } else if (req.user.role === 'parent') {
      const childrenIds = req.user.parentProfile?.children || [];
      if (childrenIds.length === 0) {
        return res.json({ tournaments: [] });
      }
      filter.player = { $in: childrenIds };
    }

    if (req.query.player) {
      filter.player = req.query.player;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const tournaments = await Tournament.find(filter)
      .populate('player', 'firstName lastName')
      .populate('coach', 'firstName lastName')
      .sort({ startDate: -1 });

    res.json({ tournaments });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tournaments
 * Coach lub parent tworzy turniej
 */
export const createTournament = async (req, res, next) => {
  try {
    const data = createTournamentSchema.parse(req.body);

    let player;
    const tournamentData = {
      player: data.player,
      name: data.name,
      location: data.location,
      surface: data.surface,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      category: data.category,
      drawSize: data.drawSize,
      notes: data.notes,
      status: 'planned',
      createdBy: req.user._id,
    };

    if (req.user.role === 'coach') {
      player = await Player.findOne({ _id: data.player, coach: req.user._id, active: true });
      if (!player) return res.status(404).json({ message: 'Zawodnik nie znaleziony' });
      tournamentData.coach = req.user._id;
      tournamentData.source = 'coach';
    } else {
      player = await Player.findOne({ _id: data.player, parents: req.user._id, active: true });
      if (!player) return res.status(404).json({ message: 'Zawodnik nie znaleziony' });
      tournamentData.source = 'parent';
    }

    const tournament = await Tournament.create(tournamentData);

    const populated = await Tournament.findById(tournament._id)
      .populate('player', 'firstName lastName')
      .populate('coach', 'firstName lastName');

    // Ewaluacja odznak (fire-and-forget)
    const parentIds = (player.parents || []).map(String);
    evaluateBadges(tournament.player, parentIds).catch(() => {});

    res.status(201).json({ message: 'Turniej został dodany', tournament: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tournaments/:id
 */
export const getTournament = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };

    if (req.user.role === 'coach') {
      filter.coach = req.user._id;
    } else if (req.user.role === 'parent') {
      const childrenIds = req.user.parentProfile?.children || [];
      filter.player = { $in: childrenIds };
    }

    const tournament = await Tournament.findOne(filter)
      .populate('player', 'firstName lastName')
      .populate('coach', 'firstName lastName');

    if (!tournament) {
      return res.status(404).json({ message: 'Turniej nie znaleziony' });
    }

    res.json({ tournament });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/tournaments/:id
 * Coach edytuje swoje, parent edytuje turnieje swoich dzieci
 */
export const updateTournament = async (req, res, next) => {
  try {
    const data = updateTournamentSchema.parse(req.body);

    const query = { _id: req.params.id };
    if (req.user.role === 'coach') {
      query.coach = req.user._id;
    } else {
      const childrenIds = req.user.parentProfile?.children || [];
      query.player = { $in: childrenIds };
    }

    const tournament = await Tournament.findOne(query);
    if (!tournament) {
      return res.status(404).json({ message: 'Turniej nie znaleziony' });
    }

    if (data.name !== undefined) tournament.name = data.name;
    if (data.location !== undefined) tournament.location = data.location;
    if (data.surface !== undefined) tournament.surface = data.surface;
    if (data.startDate !== undefined) tournament.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) tournament.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.category !== undefined) tournament.category = data.category;
    if (data.drawSize !== undefined) tournament.drawSize = data.drawSize;
    if (data.status !== undefined) tournament.status = data.status;
    if (data.result !== undefined) tournament.result = { ...tournament.result?.toObject?.() || {}, ...data.result };
    if (data.notes !== undefined) tournament.notes = data.notes;

    await tournament.save();

    const updated = await Tournament.findById(tournament._id)
      .populate('player', 'firstName lastName')
      .populate('coach', 'firstName lastName');

    // Ewaluacja odznak (fire-and-forget)
    const playerForBadges = await Player.findById(tournament.player).select('parents').lean();
    if (playerForBadges) {
      const parentIds = (playerForBadges.parents || []).map(String);
      evaluateBadges(tournament.player, parentIds).catch(() => {});
    }

    res.json({ message: 'Turniej został zaktualizowany', tournament: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/tournaments/:id
 * Coach usuwa swoje, parent usuwa turnieje ktore sam stworzyl
 */
export const deleteTournament = async (req, res, next) => {
  try {
    const query = { _id: req.params.id };

    if (req.user.role === 'coach') {
      query.coach = req.user._id;
    } else {
      query.createdBy = req.user._id;
      query.source = 'parent';
    }

    const tournament = await Tournament.findOneAndDelete(query);
    if (!tournament) {
      return res.status(404).json({ message: 'Turniej nie znaleziony' });
    }

    res.json({ message: 'Turniej został usunięty' });
  } catch (error) {
    next(error);
  }
};
