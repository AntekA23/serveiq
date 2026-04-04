import { z } from 'zod';
import Observation from '../models/Observation.js';

// ====== Zod Schemas ======

const createObservationSchema = z.object({
  player: z.string().min(1, 'Zawodnik jest wymagany'),
  club: z.string().optional(),
  activity: z.string().optional(),
  type: z.enum(['progress', 'concern', 'highlight', 'participation', 'general']).optional(),
  text: z.string().min(1, 'Treść obserwacji jest wymagana'),
  engagement: z.number().min(1).max(5).optional(),
  effort: z.number().min(1).max(5).optional(),
  mood: z.number().min(1).max(5).optional(),
  focusAreas: z.array(z.string()).optional(),
  goalRef: z.string().optional(),
  visibleToParent: z.boolean().optional(),
  pinned: z.boolean().optional(),
});

const updateObservationSchema = z.object({
  type: z.enum(['progress', 'concern', 'highlight', 'participation', 'general']).optional(),
  text: z.string().min(1, 'Treść obserwacji jest wymagana').optional(),
  engagement: z.number().min(1).max(5).optional().nullable(),
  effort: z.number().min(1).max(5).optional().nullable(),
  mood: z.number().min(1).max(5).optional().nullable(),
  focusAreas: z.array(z.string()).optional(),
  goalRef: z.string().optional().nullable(),
  visibleToParent: z.boolean().optional(),
  pinned: z.boolean().optional(),
});

// ====== Kontrolery ======

/**
 * GET /api/observations?player=X&activity=X
 * Lista obserwacji
 */
export const getObservations = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.player) {
      filter.player = req.query.player;
    }
    if (req.query.activity) {
      filter.activity = req.query.activity;
    }

    // Rodzic widzi tylko obserwacje widoczne dla rodzica
    if (req.user.role === 'parent') {
      const childrenIds = req.user.parentProfile?.children || [];
      if (childrenIds.length === 0) {
        return res.json({ observations: [] });
      }
      filter.player = filter.player ? filter.player : { $in: childrenIds };
      filter.visibleToParent = true;
    }

    // Coach widzi swoje obserwacje
    if (req.user.role === 'coach') {
      if (!filter.player) {
        filter.author = req.user._id;
      }
    }

    // clubAdmin widzi obserwacje z klubu
    if (req.user.role === 'clubAdmin' && req.user.club) {
      if (!filter.player) {
        filter.club = req.user.club;
      }
    }

    const observations = await Observation.find(filter)
      .populate('player', 'firstName lastName')
      .populate('author', 'firstName lastName role')
      .populate('activity', 'title type date')
      .populate('goalRef', 'title')
      .sort({ createdAt: -1 });

    res.json({ observations });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/observations
 * Utwórz obserwację (coach, clubAdmin)
 */
export const createObservation = async (req, res, next) => {
  try {
    const data = createObservationSchema.parse(req.body);

    const observationData = {
      ...data,
      author: req.user._id,
    };

    // Jeśli nie podano klubu, użyj klubu użytkownika
    if (!data.club && req.user.club) {
      observationData.club = req.user.club;
    }

    const observation = await Observation.create(observationData);

    const populatedObservation = await Observation.findById(observation._id)
      .populate('player', 'firstName lastName')
      .populate('author', 'firstName lastName role')
      .populate('activity', 'title type date')
      .populate('goalRef', 'title');

    res.status(201).json({
      message: 'Obserwacja została dodana',
      observation: populatedObservation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/observations/:id
 * Szczegóły obserwacji
 */
export const getObservation = async (req, res, next) => {
  try {
    const observation = await Observation.findById(req.params.id)
      .populate('player', 'firstName lastName')
      .populate('author', 'firstName lastName role')
      .populate('activity', 'title type date')
      .populate('goalRef', 'title');

    if (!observation) {
      return res.status(404).json({ message: 'Obserwacja nie znaleziona' });
    }

    // Rodzic widzi tylko obserwacje widoczne dla niego
    if (req.user.role === 'parent') {
      const childrenIds = (req.user.parentProfile?.children || []).map((c) => c.toString());
      if (!childrenIds.includes(observation.player._id.toString()) || !observation.visibleToParent) {
        return res.status(403).json({ message: 'Brak dostępu do tej obserwacji' });
      }
    }

    res.json({ observation });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/observations/:id
 * Aktualizuj obserwację
 */
export const updateObservation = async (req, res, next) => {
  try {
    const data = updateObservationSchema.parse(req.body);

    const observation = await Observation.findById(req.params.id);

    if (!observation) {
      return res.status(404).json({ message: 'Obserwacja nie znaleziona' });
    }

    const fields = [
      'type', 'text', 'engagement', 'effort', 'mood',
      'focusAreas', 'goalRef', 'visibleToParent', 'pinned',
    ];

    for (const field of fields) {
      if (data[field] !== undefined) {
        observation[field] = data[field];
      }
    }

    await observation.save();

    const updatedObservation = await Observation.findById(observation._id)
      .populate('player', 'firstName lastName')
      .populate('author', 'firstName lastName role')
      .populate('activity', 'title type date')
      .populate('goalRef', 'title');

    res.json({
      message: 'Obserwacja została zaktualizowana',
      observation: updatedObservation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/observations/:id
 * Usuń obserwację
 */
export const deleteObservation = async (req, res, next) => {
  try {
    const observation = await Observation.findById(req.params.id);

    if (!observation) {
      return res.status(404).json({ message: 'Obserwacja nie znaleziona' });
    }

    await Observation.findByIdAndDelete(req.params.id);

    res.json({ message: 'Obserwacja została usunięta' });
  } catch (error) {
    next(error);
  }
};
