import crypto from 'crypto';
import { z } from 'zod';
import Player from '../models/Player.js';
import User from '../models/User.js';
import { sendInviteEmail } from '../services/emailService.js';

// ====== Zod Schemas ======

const createPlayerSchema = z.object({
  firstName: z.string().min(1, 'Imię jest wymagane'),
  lastName: z.string().min(1, 'Nazwisko jest wymagane'),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['M', 'F'], { message: 'Płeć musi być "M" lub "F"' }).optional(),
  monthlyRate: z.number().positive('Stawka musi być dodatnia').optional(),
  parentEmail: z.string().email('Nieprawidłowy adres email rodzica').optional(),
  ranking: z
    .object({
      pzt: z.number().optional(),
      wta: z.number().optional(),
      atp: z.number().optional(),
    })
    .optional(),
});

const updatePlayerSchema = z.object({
  firstName: z.string().min(1, 'Imię jest wymagane').optional(),
  lastName: z.string().min(1, 'Nazwisko jest wymagane').optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['M', 'F']).optional(),
  monthlyRate: z.number().positive('Stawka musi być dodatnia').optional().nullable(),
  ranking: z
    .object({
      pzt: z.number().optional().nullable(),
      wta: z.number().optional().nullable(),
      atp: z.number().optional().nullable(),
    })
    .optional(),
  skills: z
    .object({
      serve: z.object({ score: z.number().min(0).max(100).optional(), notes: z.string().optional() }).optional(),
      forehand: z.object({ score: z.number().min(0).max(100).optional(), notes: z.string().optional() }).optional(),
      backhand: z.object({ score: z.number().min(0).max(100).optional(), notes: z.string().optional() }).optional(),
      volley: z.object({ score: z.number().min(0).max(100).optional(), notes: z.string().optional() }).optional(),
      tactics: z.object({ score: z.number().min(0).max(100).optional(), notes: z.string().optional() }).optional(),
      fitness: z.object({ score: z.number().min(0).max(100).optional(), notes: z.string().optional() }).optional(),
    })
    .optional(),
  avatarUrl: z.string().optional().nullable(),
});

const addGoalSchema = z.object({
  text: z.string().min(1, 'Treść celu jest wymagana'),
  dueDate: z.string().optional(),
});

const updateGoalSchema = z.object({
  text: z.string().min(1).optional(),
  dueDate: z.string().optional(),
  completed: z.boolean().optional(),
});

// ====== Kontrolery ======

/**
 * GET /api/players
 * Lista zawodników trenera
 */
export const getPlayers = async (req, res, next) => {
  try {
    const players = await Player.find({ coach: req.user._id, active: true })
      .populate('parents', 'firstName lastName email phone')
      .sort({ lastName: 1, firstName: 1 });

    res.json({ players });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/players
 * Utwórz nowego zawodnika, opcjonalnie wyślij zaproszenie do rodzica
 */
export const createPlayer = async (req, res, next) => {
  try {
    const data = createPlayerSchema.parse(req.body);

    const playerData = {
      firstName: data.firstName,
      lastName: data.lastName,
      coach: req.user._id,
    };

    if (data.dateOfBirth) playerData.dateOfBirth = new Date(data.dateOfBirth);
    if (data.gender) playerData.gender = data.gender;
    if (data.monthlyRate) playerData.monthlyRate = data.monthlyRate;
    if (data.ranking) playerData.ranking = data.ranking;

    const player = await Player.create(playerData);

    // Jeśli podano email rodzica, wyślij zaproszenie
    if (data.parentEmail) {
      let parentUser = await User.findOne({ email: data.parentEmail });

      if (!parentUser) {
        // Utwórz konto rodzica z tokenem zaproszenia
        const inviteToken = crypto.randomBytes(32).toString('hex');

        parentUser = await User.create({
          email: data.parentEmail,
          password: crypto.randomBytes(16).toString('hex'), // tymczasowe hasło
          role: 'parent',
          firstName: 'Rodzic',
          lastName: data.lastName,
          inviteToken,
          inviteExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dni
          isActive: false,
          parentProfile: { children: [player._id] },
        });

        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const inviteLink = `${clientUrl}/accept-invite?token=${inviteToken}`;
        const coachName = `${req.user.firstName} ${req.user.lastName}`;

        await sendInviteEmail(data.parentEmail, coachName, `${data.firstName} ${data.lastName}`, inviteLink);
      } else {
        // Rodzic już istnieje - dodaj gracza do jego profilu
        if (!parentUser.parentProfile) {
          parentUser.parentProfile = { children: [] };
        }
        if (!parentUser.parentProfile.children.includes(player._id)) {
          parentUser.parentProfile.children.push(player._id);
          await parentUser.save();
        }
      }

      // Dodaj rodzica do gracza
      player.parents.push(parentUser._id);
      await player.save();
    }

    const populatedPlayer = await Player.findById(player._id).populate(
      'parents',
      'firstName lastName email phone'
    );

    res.status(201).json({
      message: 'Zawodnik został dodany',
      player: populatedPlayer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/players/:id
 * Szczegóły zawodnika
 */
export const getPlayer = async (req, res, next) => {
  try {
    const player = await Player.findOne({
      _id: req.params.id,
      coach: req.user._id,
      active: true,
    }).populate('parents', 'firstName lastName email phone');

    if (!player) {
      return res.status(404).json({ message: 'Zawodnik nie znaleziony' });
    }

    res.json({ player });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/players/:id
 * Aktualizuj dane zawodnika (dane, skills, cele)
 */
export const updatePlayer = async (req, res, next) => {
  try {
    const data = updatePlayerSchema.parse(req.body);

    const player = await Player.findOne({
      _id: req.params.id,
      coach: req.user._id,
      active: true,
    });

    if (!player) {
      return res.status(404).json({ message: 'Zawodnik nie znaleziony' });
    }

    // Aktualizuj pola podstawowe
    if (data.firstName !== undefined) player.firstName = data.firstName;
    if (data.lastName !== undefined) player.lastName = data.lastName;
    if (data.dateOfBirth !== undefined) player.dateOfBirth = new Date(data.dateOfBirth);
    if (data.gender !== undefined) player.gender = data.gender;
    if (data.monthlyRate !== undefined) player.monthlyRate = data.monthlyRate;
    if (data.avatarUrl !== undefined) player.avatarUrl = data.avatarUrl;

    // Aktualizuj ranking
    if (data.ranking) {
      player.ranking = { ...player.ranking?.toObject?.() || {}, ...data.ranking };
    }

    // Aktualizuj skills
    if (data.skills) {
      for (const [skillName, skillData] of Object.entries(data.skills)) {
        if (skillData) {
          if (!player.skills) player.skills = {};
          if (!player.skills[skillName]) player.skills[skillName] = {};
          if (skillData.score !== undefined) player.skills[skillName].score = skillData.score;
          if (skillData.notes !== undefined) player.skills[skillName].notes = skillData.notes;
        }
      }
      player.markModified('skills');
    }

    await player.save();

    const updatedPlayer = await Player.findById(player._id).populate(
      'parents',
      'firstName lastName email phone'
    );

    res.json({
      message: 'Dane zawodnika zostały zaktualizowane',
      player: updatedPlayer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/players/:id
 * Soft delete (active: false)
 */
export const deletePlayer = async (req, res, next) => {
  try {
    const player = await Player.findOne({
      _id: req.params.id,
      coach: req.user._id,
      active: true,
    });

    if (!player) {
      return res.status(404).json({ message: 'Zawodnik nie znaleziony' });
    }

    player.active = false;
    await player.save();

    res.json({ message: 'Zawodnik został usunięty' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/players/:id/goals
 * Dodaj cel do gracza
 */
export const addGoal = async (req, res, next) => {
  try {
    const data = addGoalSchema.parse(req.body);

    const player = await Player.findOne({
      _id: req.params.id,
      coach: req.user._id,
      active: true,
    });

    if (!player) {
      return res.status(404).json({ message: 'Zawodnik nie znaleziony' });
    }

    const goal = {
      text: data.text,
    };
    if (data.dueDate) goal.dueDate = new Date(data.dueDate);

    player.goals.push(goal);
    await player.save();

    const addedGoal = player.goals[player.goals.length - 1];

    res.status(201).json({
      message: 'Cel został dodany',
      goal: addedGoal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/players/:id/goals/:goalId
 * Aktualizuj cel (oznacz jako ukończony itd.)
 */
export const updateGoal = async (req, res, next) => {
  try {
    const data = updateGoalSchema.parse(req.body);

    const player = await Player.findOne({
      _id: req.params.id,
      coach: req.user._id,
      active: true,
    });

    if (!player) {
      return res.status(404).json({ message: 'Zawodnik nie znaleziony' });
    }

    const goal = player.goals.id(req.params.goalId);
    if (!goal) {
      return res.status(404).json({ message: 'Cel nie znaleziony' });
    }

    if (data.text !== undefined) goal.text = data.text;
    if (data.dueDate !== undefined) goal.dueDate = new Date(data.dueDate);
    if (data.completed !== undefined) {
      goal.completed = data.completed;
      goal.completedAt = data.completed ? new Date() : null;
    }

    await player.save();

    res.json({
      message: 'Cel został zaktualizowany',
      goal,
    });
  } catch (error) {
    next(error);
  }
};
