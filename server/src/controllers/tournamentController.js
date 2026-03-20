import { z } from 'zod';
import Tournament from '../models/Tournament.js';
import Player from '../models/Player.js';

// ====== Zod Schemas ======

const createTournamentSchema = z.object({
  player: z.string().min(1, 'Zawodnik jest wymagany'),
  name: z.string().min(1, 'Nazwa turnieju jest wymagana'),
  location: z.string().optional(),
  surface: z.enum(['hard', 'clay', 'grass', 'indoor']).optional(),
  startDate: z.string().min(1, 'Data rozpoczęcia jest wymagana'),
  endDate: z.string().optional(),
  category: z.string().optional(),
  drawSize: z.number().positive().optional(),
  result: z
    .object({
      round: z.string().optional(),
      wins: z.number().min(0).optional(),
      losses: z.number().min(0).optional(),
    })
    .optional(),
  notes: z.string().optional(),
});

const updateTournamentSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().optional().nullable(),
  surface: z.enum(['hard', 'clay', 'grass', 'indoor']).optional().nullable(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  drawSize: z.number().positive().optional().nullable(),
  result: z
    .object({
      round: z.string().optional(),
      wins: z.number().min(0).optional(),
      losses: z.number().min(0).optional(),
    })
    .optional(),
  notes: z.string().optional().nullable(),
});

// ====== Kontrolery ======

/**
 * GET /api/tournaments
 * Lista turniejów. Coach widzi swoje, parent widzi turnieje dzieci.
 * Query: ?player=id
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
 * Utwórz nowy turniej (coach only)
 */
export const createTournament = async (req, res, next) => {
  try {
    const data = createTournamentSchema.parse(req.body);

    // Sprawdź czy zawodnik należy do trenera
    const player = await Player.findOne({
      _id: data.player,
      coach: req.user._id,
      active: true,
    });

    if (!player) {
      return res.status(404).json({ message: 'Zawodnik nie znaleziony' });
    }

    const tournament = await Tournament.create({
      ...data,
      coach: req.user._id,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    });

    const populatedTournament = await Tournament.findById(tournament._id)
      .populate('player', 'firstName lastName')
      .populate('coach', 'firstName lastName');

    res.status(201).json({
      message: 'Turniej został dodany',
      tournament: populatedTournament,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tournaments/:id
 * Szczegóły turnieju
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
 * Aktualizuj turniej (coach only)
 */
export const updateTournament = async (req, res, next) => {
  try {
    const data = updateTournamentSchema.parse(req.body);

    const tournament = await Tournament.findOne({
      _id: req.params.id,
      coach: req.user._id,
    });

    if (!tournament) {
      return res.status(404).json({ message: 'Turniej nie znaleziony' });
    }

    // Aktualizuj pola
    if (data.name !== undefined) tournament.name = data.name;
    if (data.location !== undefined) tournament.location = data.location;
    if (data.surface !== undefined) tournament.surface = data.surface;
    if (data.startDate !== undefined) tournament.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) tournament.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.category !== undefined) tournament.category = data.category;
    if (data.drawSize !== undefined) tournament.drawSize = data.drawSize;
    if (data.result !== undefined) tournament.result = data.result;
    if (data.notes !== undefined) tournament.notes = data.notes;

    await tournament.save();

    const updatedTournament = await Tournament.findById(tournament._id)
      .populate('player', 'firstName lastName')
      .populate('coach', 'firstName lastName');

    res.json({
      message: 'Turniej został zaktualizowany',
      tournament: updatedTournament,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/tournaments/:id
 * Usuń turniej (coach only)
 */
export const deleteTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findOneAndDelete({
      _id: req.params.id,
      coach: req.user._id,
    });

    if (!tournament) {
      return res.status(404).json({ message: 'Turniej nie znaleziony' });
    }

    res.json({ message: 'Turniej został usunięty' });
  } catch (error) {
    next(error);
  }
};
