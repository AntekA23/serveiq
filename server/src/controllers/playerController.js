import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import multer from 'multer';
import Player from '../models/Player.js';
import Session from '../models/Session.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendInviteEmail } from '../services/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ====== Multer config for avatar uploads ======

const avatarUploadDir = path.resolve(__dirname, '../../uploads/avatars');

// Utwórz katalog jeśli nie istnieje
if (!fs.existsSync(avatarUploadDir)) {
  fs.mkdirSync(avatarUploadDir, { recursive: true });
}

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, avatarUploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  },
});

const avatarFileFilter = (_req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Dozwolone są tylko pliki JPEG i PNG'), false);
  }
};

export const uploadMiddleware = multer({
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single('avatar');

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

const createPlayerSelfSchema = z.object({
  firstName: z.string().min(1, 'Imię jest wymagane'),
  lastName: z.string().min(1, 'Nazwisko jest wymagane'),
  dateOfBirth: z.string().min(1, 'Data urodzenia jest wymagana'),
  gender: z.enum(['M', 'F'], { message: 'Płeć musi być "M" lub "F"' }).optional(),
});

const plannedSessionItemSchema = z.object({
  _id: z.string().optional(),
  day: z.number().min(1).max(7),
  sessionType: z.enum(['kort', 'sparing', 'kondycja', 'rozciaganie', 'mecz', 'inne']),
  durationMinutes: z.number().min(15).max(300),
  startTime: z.string().optional(),
  notes: z.string().optional(),
});

const updateTrainingPlanSchema = z.object({
  weeklyGoal: z.object({
    sessionsPerWeek: z.number().min(0).max(14).optional(),
    hoursPerWeek: z.number().min(0).max(40).optional(),
  }).optional(),
  scheduledDays: z.array(z.number().min(1).max(7)).optional(),
  weeklySchedule: z.array(plannedSessionItemSchema).optional(),
  focus: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
});

const milestoneSchema = z.object({
  text: z.string().min(1, 'Treść kamienia milowego jest wymagana'),
  date: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

const updateMilestoneSchema = z.object({
  text: z.string().min(1).optional(),
  date: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  completed: z.boolean().optional(),
});

// ====== Kontrolery ======

/**
 * GET /api/players
 * Lista zawodników — trener widzi swoich podopiecznych, rodzic widzi swoje dzieci
 */
export const getPlayers = async (req, res, next) => {
  try {
    const query = { active: true };

    if (req.user.role === 'coach') {
      query.coach = req.user._id;
    } else {
      // Rodzic — pokaż dzieci przypisane do niego
      query.parents = req.user._id;
    }

    const players = await Player.find(query)
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
 * Szczegóły zawodnika — trener widzi swoich, rodzic widzi swoje dzieci
 */
export const getPlayer = async (req, res, next) => {
  try {
    const query = { _id: req.params.id, active: true };

    if (req.user.role === 'coach') {
      query.coach = req.user._id;
    } else {
      query.parents = req.user._id;
    }

    const player = await Player.findOne(query)
      .populate('parents', 'firstName lastName email phone')
      .populate('federationProgram.program', 'federationCode federationName countryFlag');

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

    // Rodzic moze edytowac podstawowe pola swojego dziecka
    if (req.user.role === 'parent') {
      const isMyChild = req.user.parentProfile?.children?.some(
        (c) => c.toString() === req.params.id
      );
      if (!isMyChild) {
        return res.status(403).json({ message: 'Brak dostępu do tego zawodnika' });
      }
      const allowedFields = {};
      if (data.firstName !== undefined) allowedFields.firstName = data.firstName;
      if (data.lastName !== undefined) allowedFields.lastName = data.lastName;
      if (data.dateOfBirth !== undefined) allowedFields.dateOfBirth = new Date(data.dateOfBirth);
      if (data.gender !== undefined) allowedFields.gender = data.gender;

      const updated = await Player.findByIdAndUpdate(req.params.id, allowedFields, { new: true })
        .populate('parents', 'firstName lastName email phone');
      return res.json({ message: 'Dane zawodnika zaktualizowane', player: updated });
    }

    const player = await Player.findOne({
      _id: req.params.id,
      $or: [{ coach: req.user._id }, { coaches: req.user._id }],
      active: true,
    });

    if (!player) {
      return res.status(404).json({ message: 'Zawodnik nie znaleziony' });
    }

    // Zmiana pathwayStage z automatyczna historia
    if (data.pathwayStage && data.pathwayStage !== player.pathwayStage) {
      if (!player.pathwayHistory) player.pathwayHistory = [];
      const last = player.pathwayHistory[player.pathwayHistory.length - 1];
      if (last && !last.endDate) last.endDate = new Date();
      player.pathwayHistory.push({
        stage: data.pathwayStage,
        startDate: new Date(),
        notes: data.pathwayStageNotes || '',
      });
      player.pathwayStage = data.pathwayStage;
    }

    // Ustawienie nextStep
    if (data.nextStep !== undefined) {
      player.nextStep = {
        text: data.nextStep,
        updatedAt: new Date(),
        updatedBy: req.user._id,
      };
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
      const skillChanges = [];
      for (const [skillName, skillData] of Object.entries(data.skills)) {
        if (skillData) {
          if (!player.skills) player.skills = {};
          if (!player.skills[skillName]) player.skills[skillName] = {};
          const oldScore = player.skills[skillName].score;
          if (skillData.score !== undefined) {
            player.skills[skillName].score = skillData.score;
            if (oldScore !== skillData.score) skillChanges.push(skillName);
          }
          if (skillData.notes !== undefined) player.skills[skillName].notes = skillData.notes;
        }
      }
      player.markModified('skills');

      // Powiadom rodzicow o zmianach umiejetnosci
      if (skillChanges.length > 0) {
        const parentIds = player.parents || [];
        const skillLabels = { serve: 'serwis', forehand: 'forhend', backhand: 'bekhend', volley: 'wolej', tactics: 'taktyka', fitness: 'kondycja' };
        const changedNames = skillChanges.map((s) => skillLabels[s] || s).join(', ');
        for (const parentId of parentIds) {
          await Notification.create({
            user: parentId,
            type: 'system',
            title: 'Aktualizacja umiejetnosci',
            body: `Trener zaktualizowal umiejetnosci ${player.firstName}: ${changedNames}`,
            severity: 'info',
            player: player._id,
            actionUrl: `/parent/child/${player._id}`,
          });
        }
      }
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
    let player;

    if (req.user.role === 'parent') {
      const isMyChild = req.user.parentProfile?.children?.some(
        (c) => c.toString() === req.params.id
      );
      if (!isMyChild) {
        return res.status(403).json({ message: 'Brak dostępu' });
      }
      player = await Player.findOne({ _id: req.params.id, active: true });
    } else {
      player = await Player.findOne({
        _id: req.params.id,
        $or: [{ coach: req.user._id }, { coaches: req.user._id }],
        active: true,
      });
    }

    if (!player) {
      return res.status(404).json({ message: 'Zawodnik nie znaleziony' });
    }

    player.active = false;
    await player.save();

    // Usun z parentProfile.children
    if (req.user.role === 'parent') {
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { 'parentProfile.children': player._id },
      });
    }

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
      const wasCompleted = goal.completed;
      goal.completed = data.completed;
      goal.completedAt = data.completed ? new Date() : null;

      // Powiadom rodzicow o ukonczeniu celu
      if (data.completed && !wasCompleted) {
        const parentIds = player.parents || [];
        for (const parentId of parentIds) {
          await Notification.create({
            user: parentId,
            type: 'system',
            title: 'Cel osiagniety!',
            body: `${player.firstName} osiagnal cel: "${goal.text}"`,
            severity: 'info',
            player: player._id,
            actionUrl: `/parent/child/${player._id}`,
          });
        }
      }
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

/**
 * POST /api/players/self
 * Rodzic dodaje własne dziecko (bez trenera)
 */
export const createPlayerSelf = async (req, res, next) => {
  try {
    const data = createPlayerSelfSchema.parse(req.body);

    const playerData = {
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: new Date(data.dateOfBirth),
      coach: null,
      parents: [req.user._id],
    };

    if (data.gender) playerData.gender = data.gender;

    const player = await Player.create(playerData);

    // Dodaj gracza do profilu rodzica
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { 'parentProfile.children': player._id },
    });

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
 * PUT /api/players/:id/avatar
 * Upload avatara zawodnika
 */
export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Plik jest wymagany' });
    }

    const player = await Player.findById(req.params.id);

    if (!player) {
      return res.status(404).json({ message: 'Zawodnik nie znaleziony' });
    }

    // Sprawdź czy użytkownik ma dostęp (trener lub rodzic)
    const isCoach = player.coach && player.coach.toString() === req.user._id.toString();
    const isParent = player.parents.some((p) => p.toString() === req.user._id.toString());

    if (!isCoach && !isParent) {
      return res.status(403).json({ message: 'Brak uprawnień do tego zawodnika' });
    }

    // Usuń stary avatar jeśli istnieje
    if (player.avatarUrl) {
      const oldPath = path.resolve(__dirname, '../..', player.avatarUrl.replace(/^\//, ''));
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    player.avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await player.save();

    res.json({
      message: 'Avatar został zaktualizowany',
      player,
    });
  } catch (error) {
    next(error);
  }
};

// ====== Plan treningowy ======

/**
 * Sprawdza czy rodzic ma dostęp do zawodnika
 */
async function verifyParentPlayer(userId, playerId) {
  return Player.findOne({ _id: playerId, parents: userId, active: true });
}

/**
 * Sprawdza dostęp do zawodnika (trener lub rodzic)
 */
async function verifyPlayerAccess(user, playerId) {
  if (user.role === 'coach') {
    return Player.findOne({ _id: playerId, coach: user._id, active: true });
  }
  return Player.findOne({ _id: playerId, parents: user._id, active: true });
}

/**
 * PUT /api/players/:id/training-plan
 * Aktualizuj plan treningowy (trener lub rodzic)
 */
export const updateTrainingPlan = async (req, res, next) => {
  try {
    const data = updateTrainingPlanSchema.parse(req.body);
    const player = await verifyPlayerAccess(req.user, req.params.id);

    if (!player) {
      return res.status(404).json({ message: 'Zawodnik nie znaleziony' });
    }

    if (!player.trainingPlan) player.trainingPlan = {};

    if (data.weeklySchedule !== undefined) {
      player.trainingPlan.weeklySchedule = data.weeklySchedule;
      // Auto-derive scheduledDays and weeklyGoal from schedule
      const days = [...new Set(data.weeklySchedule.map((s) => s.day))].sort();
      player.trainingPlan.scheduledDays = days;
      const totalMins = data.weeklySchedule.reduce((sum, s) => sum + s.durationMinutes, 0);
      player.trainingPlan.weeklyGoal = {
        sessionsPerWeek: data.weeklySchedule.length,
        hoursPerWeek: Math.round((totalMins / 60) * 10) / 10,
      };
    }
    if (data.weeklyGoal && !data.weeklySchedule) {
      if (!player.trainingPlan.weeklyGoal) player.trainingPlan.weeklyGoal = {};
      if (data.weeklyGoal.sessionsPerWeek !== undefined)
        player.trainingPlan.weeklyGoal.sessionsPerWeek = data.weeklyGoal.sessionsPerWeek;
      if (data.weeklyGoal.hoursPerWeek !== undefined)
        player.trainingPlan.weeklyGoal.hoursPerWeek = data.weeklyGoal.hoursPerWeek;
    }
    if (data.scheduledDays !== undefined && !data.weeklySchedule)
      player.trainingPlan.scheduledDays = data.scheduledDays;
    if (data.focus !== undefined) player.trainingPlan.focus = data.focus;
    if (data.notes !== undefined) player.trainingPlan.notes = data.notes;

    player.markModified('trainingPlan');
    await player.save();

    // Powiadom rodzicow gdy trener zmieni plan
    if (req.user.role === 'coach' && data.weeklySchedule) {
      const parentIds = player.parents || [];
      for (const parentId of parentIds) {
        await Notification.create({
          user: parentId,
          type: 'system',
          title: 'Plan treningowy zaktualizowany',
          body: `Trener zaktualizowal plan treningowy dla ${player.firstName} (${data.weeklySchedule.length} sesji/tydz)`,
          severity: 'info',
          player: player._id,
          actionUrl: '/parent/training-plan',
        });
      }
    }

    res.json({ message: 'Plan treningowy zaktualizowany', trainingPlan: player.trainingPlan });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/players/:id/milestones
 * Dodaj kamień milowy
 */
export const addMilestone = async (req, res, next) => {
  try {
    const data = milestoneSchema.parse(req.body);
    const player = await verifyPlayerAccess(req.user, req.params.id);

    if (!player) {
      return res.status(404).json({ message: 'Zawodnik nie znaleziony' });
    }

    if (!player.trainingPlan) player.trainingPlan = {};
    if (!player.trainingPlan.milestones) player.trainingPlan.milestones = [];

    const milestone = {
      text: data.text,
      description: data.description || undefined,
    };
    if (data.date) milestone.date = new Date(data.date);

    player.trainingPlan.milestones.push(milestone);
    player.markModified('trainingPlan');
    await player.save();

    const added = player.trainingPlan.milestones[player.trainingPlan.milestones.length - 1];
    res.status(201).json({ message: 'Kamień milowy dodany', milestone: added });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/players/:id/milestones/:mid
 * Edytuj kamień milowy
 */
export const updateMilestone = async (req, res, next) => {
  try {
    const data = updateMilestoneSchema.parse(req.body);
    const player = await verifyPlayerAccess(req.user, req.params.id);

    if (!player) {
      return res.status(404).json({ message: 'Zawodnik nie znaleziony' });
    }

    const milestone = player.trainingPlan?.milestones?.id(req.params.mid);
    if (!milestone) {
      return res.status(404).json({ message: 'Kamień milowy nie znaleziony' });
    }

    if (data.text !== undefined) milestone.text = data.text;
    if (data.date !== undefined) milestone.date = data.date ? new Date(data.date) : null;
    if (data.description !== undefined) milestone.description = data.description;
    if (data.completed !== undefined) {
      milestone.completed = data.completed;
      milestone.completedAt = data.completed ? new Date() : null;
    }

    player.markModified('trainingPlan');
    await player.save();

    res.json({ message: 'Kamień milowy zaktualizowany', milestone });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/players/:id/milestones/:mid
 * Usuń kamień milowy
 */
export const deleteMilestone = async (req, res, next) => {
  try {
    const player = await verifyPlayerAccess(req.user, req.params.id);

    if (!player) {
      return res.status(404).json({ message: 'Zawodnik nie znaleziony' });
    }

    const milestone = player.trainingPlan?.milestones?.id(req.params.mid);
    if (!milestone) {
      return res.status(404).json({ message: 'Kamień milowy nie znaleziony' });
    }

    player.trainingPlan.milestones.pull(req.params.mid);
    player.markModified('trainingPlan');
    await player.save();

    res.json({ message: 'Kamień milowy usunięty' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/players/:id/skill-history
 * Zwraca historię umiejętności na podstawie sesji z skillUpdates
 */
export const getSkillHistory = async (req, res, next) => {
  try {
    const playerId = req.params.id;

    // Verify access
    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Zawodnik nie znaleziony' });
    }

    if (req.user.role === 'parent') {
      const childrenIds = (req.user.parentProfile?.children || []).map(String);
      if (!childrenIds.includes(String(playerId))) {
        return res.status(403).json({ message: 'Brak dostępu' });
      }
    } else if (req.user.role === 'coach') {
      if (String(player.coach) !== String(req.user._id)) {
        return res.status(403).json({ message: 'Brak dostępu' });
      }
    }

    // Get all sessions with skill updates for this player
    const filter = {
      player: playerId,
      skillUpdates: { $exists: true, $not: { $size: 0 } },
    };

    if (req.user.role === 'parent') {
      filter.visibleToParent = true;
    }

    const sessions = await Session.find(filter)
      .select('date skillUpdates sessionType title')
      .sort({ date: 1 });

    // Build skill history timeline
    const history = {};
    const skills = ['serve', 'forehand', 'backhand', 'volley', 'tactics', 'fitness'];
    skills.forEach((s) => { history[s] = []; });

    for (const session of sessions) {
      for (const su of session.skillUpdates) {
        if (skills.includes(su.skill)) {
          history[su.skill].push({
            date: session.date,
            scoreBefore: su.scoreBefore,
            scoreAfter: su.scoreAfter,
            sessionTitle: session.title,
            sessionType: session.sessionType,
          });
        }
      }
    }

    // Add current scores as the latest data point
    const currentSkills = {};
    for (const skill of skills) {
      currentSkills[skill] = player.skills?.[skill]?.score ?? 0;
    }

    res.json({ history, currentSkills });
  } catch (error) {
    next(error);
  }
};

// ====== Coach Join Requests ======

/**
 * GET /api/players/coaches/search?q=...
 * Rodzic szuka trenera po nazwisku lub klubie
 */
export const searchCoaches = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) {
      return res.json({ coaches: [] });
    }

    const regex = new RegExp(q, 'i');
    const coaches = await User.find({
      role: 'coach',
      isActive: true,
      $or: [
        { firstName: regex },
        { lastName: regex },
        { 'coachProfile.club': regex },
      ],
    }).select('firstName lastName coachProfile.club coachProfile.bio');

    res.json({ coaches });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/players/:id/request-coach
 * Rodzic wysyła prośbę o dołączenie dziecka do trenera
 */
export const requestCoach = async (req, res, next) => {
  try {
    const { coachId, message } = req.body;
    if (!coachId) {
      return res.status(400).json({ message: 'ID trenera jest wymagane' });
    }

    const player = await Player.findOne({
      _id: req.params.id,
      parents: req.user._id,
      active: true,
    });
    if (!player) {
      return res.status(404).json({ message: 'Zawodnik nie znaleziony' });
    }

    if (player.coach) {
      return res.status(400).json({ message: 'Zawodnik ma juz przypisanego trenera' });
    }

    if (player.coachRequest?.status === 'pending') {
      return res.status(400).json({ message: 'Prosba o dolaczenie juz wyslana' });
    }

    const coach = await User.findOne({ _id: coachId, role: 'coach', isActive: true });
    if (!coach) {
      return res.status(404).json({ message: 'Trener nie znaleziony' });
    }

    player.coachRequest = {
      coach: coachId,
      status: 'pending',
      message: message || '',
      createdAt: new Date(),
    };
    await player.save();

    // Powiadom trenera
    await Notification.create({
      user: coachId,
      type: 'system',
      title: 'Nowa prosba o dolaczenie',
      body: `${req.user.firstName} ${req.user.lastName} chce dolaczyc ${player.firstName} ${player.lastName} do Twoich zawodnikow`,
      severity: 'info',
      player: player._id,
    });

    res.json({ message: 'Prosba wyslana do trenera' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/players/coach-requests
 * Trener widzi oczekujące prośby
 */
export const getCoachRequests = async (req, res, next) => {
  try {
    const requests = await Player.find({
      'coachRequest.coach': req.user._id,
      'coachRequest.status': 'pending',
      active: true,
    })
      .populate('parents', 'firstName lastName email phone')
      .select('firstName lastName dateOfBirth gender coachRequest parents');

    res.json({ requests });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/players/:id/coach-request
 * Trener akceptuje lub odrzuca prośbę
 */
export const respondCoachRequest = async (req, res, next) => {
  try {
    const { action } = req.body; // 'accept' or 'reject'
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Akcja musi byc "accept" lub "reject"' });
    }

    const player = await Player.findOne({
      _id: req.params.id,
      'coachRequest.coach': req.user._id,
      'coachRequest.status': 'pending',
      active: true,
    });
    if (!player) {
      return res.status(404).json({ message: 'Prosba nie znaleziona' });
    }

    if (action === 'accept') {
      player.coach = req.user._id;
      player.coachRequest.status = 'accepted';

      // Powiadom rodzicow
      for (const parentId of player.parents) {
        await Notification.create({
          user: parentId,
          type: 'system',
          title: 'Trener zaakceptowal prosbe!',
          body: `${req.user.firstName} ${req.user.lastName} jest teraz trenerem ${player.firstName}`,
          severity: 'info',
          player: player._id,
        });
      }
    } else {
      player.coachRequest.status = 'rejected';

      for (const parentId of player.parents) {
        await Notification.create({
          user: parentId,
          type: 'system',
          title: 'Prosba odrzucona',
          body: `Trener odrzucil prosbe o dolaczenie ${player.firstName}`,
          severity: 'info',
          player: player._id,
        });
      }
    }

    await player.save();
    res.json({ message: action === 'accept' ? 'Zawodnik dolaczony' : 'Prosba odrzucona' });
  } catch (error) {
    next(error);
  }
};
