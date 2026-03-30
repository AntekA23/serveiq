import { z } from 'zod';
import Session from '../models/Session.js';
import Player from '../models/Player.js';

// ====== Zod Schemas ======

const createSessionSchema = z.object({
  player: z.string().min(1, 'Zawodnik jest wymagany'),
  date: z.string().min(1, 'Data treningu jest wymagana'),
  startTime: z.string().optional(),
  sessionType: z.enum(['kort', 'sparing', 'kondycja', 'rozciaganie', 'mecz', 'inne']).optional(),
  surface: z.enum(['clay', 'hard', 'grass', 'carpet', 'indoor-hard', '']).optional(),
  durationMinutes: z.number().positive('Czas trwania musi być dodatni'),
  title: z.string().min(1, 'Tytuł treningu jest wymagany'),
  notes: z.string().optional(),
  focusAreas: z.array(z.string()).optional(),
  skillUpdates: z
    .array(
      z.object({
        skill: z.string(),
        scoreBefore: z.number().min(0).max(100),
        scoreAfter: z.number().min(0).max(100),
      })
    )
    .optional(),
  visibleToParent: z.boolean().optional(),
});

const updateSessionSchema = z.object({
  date: z.string().optional(),
  startTime: z.string().optional(),
  sessionType: z.enum(['kort', 'sparing', 'kondycja', 'rozciaganie', 'mecz', 'inne']).optional(),
  surface: z.enum(['clay', 'hard', 'grass', 'carpet', 'indoor-hard', '']).optional(),
  durationMinutes: z.number().positive('Czas trwania musi być dodatni').optional(),
  title: z.string().min(1, 'Tytuł treningu jest wymagany').optional(),
  notes: z.string().optional().nullable(),
  focusAreas: z.array(z.string()).optional(),
  skillUpdates: z
    .array(
      z.object({
        skill: z.string(),
        scoreBefore: z.number().min(0).max(100),
        scoreAfter: z.number().min(0).max(100),
      })
    )
    .optional(),
  visibleToParent: z.boolean().optional(),
});

// ====== Kontrolery ======

/**
 * GET /api/sessions
 * Coach → wszystkie jego sesje. Parent → sesje dzieci (visibleToParent).
 * Query params: ?player=id&month=2024-01
 */
export const getSessions = async (req, res, next) => {
  try {
    const { player, month } = req.query;
    const filter = {};

    if (req.user.role === 'coach') {
      filter.coach = req.user._id;
    } else if (req.user.role === 'parent') {
      // Rodzic widzi tylko sesje swoich dzieci
      const childrenIds = req.user.parentProfile?.children || [];
      if (childrenIds.length === 0) {
        return res.json({ sessions: [] });
      }
      filter.player = { $in: childrenIds };
      filter.visibleToParent = true;
    }

    // Filtr po zawodniku
    if (player) {
      filter.player = player;
    }

    // Filtr po miesiącu (format: YYYY-MM)
    if (month) {
      const [year, mon] = month.split('-').map(Number);
      const startDate = new Date(year, mon - 1, 1);
      const endDate = new Date(year, mon, 0, 23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const sessions = await Session.find(filter)
      .populate('player', 'firstName lastName')
      .populate('coach', 'firstName lastName')
      .sort({ date: -1 });

    res.json({ sessions });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/sessions
 * Utwórz nowy trening.
 * Coach: wymaga player należącego do trenera, opcjonalnie skillUpdates.
 * Parent: wymaga player będącego dzieckiem rodzica, prostsza walidacja.
 */
export const createSession = async (req, res, next) => {
  try {
    const data = createSessionSchema.parse(req.body);

    let player;
    const sessionData = {
      player: data.player,
      date: new Date(data.date),
      startTime: data.startTime,
      sessionType: data.sessionType || 'kort',
      surface: data.surface || '',
      durationMinutes: data.durationMinutes,
      title: data.title,
      notes: data.notes,
      focusAreas: data.focusAreas,
      createdBy: req.user._id,
    };

    if (req.user.role === 'coach') {
      player = await Player.findOne({ _id: data.player, coach: req.user._id, active: true });
      if (!player) return res.status(404).json({ message: 'Zawodnik nie znaleziony' });

      sessionData.coach = req.user._id;
      sessionData.source = 'coach';
      sessionData.skillUpdates = data.skillUpdates;
      sessionData.visibleToParent = data.visibleToParent;
    } else {
      player = await Player.findOne({ _id: data.player, parents: req.user._id, active: true });
      if (!player) return res.status(404).json({ message: 'Zawodnik nie znaleziony' });

      sessionData.source = 'parent';
      sessionData.visibleToParent = true;
    }

    const session = await Session.create(sessionData);

    // Aktualizuj skill scores na Player jeśli podano skillUpdates (tylko coach)
    if (req.user.role === 'coach' && data.skillUpdates && data.skillUpdates.length > 0) {
      for (const update of data.skillUpdates) {
        if (player.skills && player.skills[update.skill]) {
          player.skills[update.skill].score = update.scoreAfter;
        }
      }
      player.markModified('skills');
      await player.save();
    }

    const populatedSession = await Session.findById(session._id)
      .populate('player', 'firstName lastName')
      .populate('coach', 'firstName lastName');

    res.status(201).json({
      message: 'Trening został dodany',
      session: populatedSession,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/sessions/:id
 * Szczegóły sesji treningowej
 */
export const getSession = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };

    if (req.user.role === 'coach') {
      filter.coach = req.user._id;
    } else if (req.user.role === 'parent') {
      const childrenIds = req.user.parentProfile?.children || [];
      filter.player = { $in: childrenIds };
      filter.visibleToParent = true;
    }

    const session = await Session.findOne(filter)
      .populate('player', 'firstName lastName')
      .populate('coach', 'firstName lastName');

    if (!session) {
      return res.status(404).json({ message: 'Trening nie znaleziony' });
    }

    res.json({ session });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/sessions/:id
 * Aktualizuj trening (tylko coach)
 */
export const updateSession = async (req, res, next) => {
  try {
    const data = updateSessionSchema.parse(req.body);

    const session = await Session.findOne({
      _id: req.params.id,
      coach: req.user._id,
    });

    if (!session) {
      return res.status(404).json({ message: 'Trening nie znaleziony' });
    }

    // Aktualizuj pola
    if (data.date !== undefined) session.date = new Date(data.date);
    if (data.startTime !== undefined) session.startTime = data.startTime;
    if (data.sessionType !== undefined) session.sessionType = data.sessionType;
    if (data.surface !== undefined) session.surface = data.surface;
    if (data.durationMinutes !== undefined) session.durationMinutes = data.durationMinutes;
    if (data.title !== undefined) session.title = data.title;
    if (data.notes !== undefined) session.notes = data.notes;
    if (data.focusAreas !== undefined) session.focusAreas = data.focusAreas;
    if (data.skillUpdates !== undefined) session.skillUpdates = data.skillUpdates;
    if (data.visibleToParent !== undefined) session.visibleToParent = data.visibleToParent;

    // Aktualizuj skill scores na Player jeśli podano nowe skillUpdates
    if (data.skillUpdates && data.skillUpdates.length > 0) {
      const player = await Player.findById(session.player);
      if (player) {
        for (const update of data.skillUpdates) {
          if (player.skills && player.skills[update.skill]) {
            player.skills[update.skill].score = update.scoreAfter;
          }
        }
        player.markModified('skills');
        await player.save();
      }
    }

    await session.save();

    const updatedSession = await Session.findById(session._id)
      .populate('player', 'firstName lastName')
      .populate('coach', 'firstName lastName');

    res.json({
      message: 'Trening został zaktualizowany',
      session: updatedSession,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/sessions/:id
 * Coach usuwa swoje sesje, parent usuwa sesje ktore sam stworzyl
 */
export const deleteSession = async (req, res, next) => {
  try {
    const query = { _id: req.params.id };

    if (req.user.role === 'coach') {
      query.coach = req.user._id;
    } else {
      query.createdBy = req.user._id;
      query.source = 'parent';
    }

    const session = await Session.findOneAndDelete(query);

    if (!session) {
      return res.status(404).json({ message: 'Trening nie znaleziony' });
    }

    res.json({ message: 'Trening został usunięty' });
  } catch (error) {
    next(error);
  }
};
