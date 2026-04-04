import { z } from 'zod';
import Group from '../models/Group.js';

// ====== Zod Schemas ======

const createGroupSchema = z.object({
  club: z.string().min(1, 'Klub jest wymagany'),
  name: z.string().min(1, 'Nazwa grupy jest wymagana'),
  description: z.string().optional(),
  coach: z.string().optional(),
  pathwayStage: z.string().optional(),
  players: z.array(z.string()).optional(),
  schedule: z.object({
    dayOfWeek: z.array(z.number().min(0).max(6)).optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    surface: z.string().optional(),
  }).optional(),
  maxPlayers: z.number().positive('Maksymalna liczba graczy musi być dodatnia').optional(),
});

const updateGroupSchema = z.object({
  name: z.string().min(1, 'Nazwa grupy jest wymagana').optional(),
  description: z.string().optional().nullable(),
  coach: z.string().optional().nullable(),
  pathwayStage: z.string().optional().nullable(),
  players: z.array(z.string()).optional(),
  schedule: z.object({
    dayOfWeek: z.array(z.number().min(0).max(6)).optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    surface: z.string().optional(),
  }).optional(),
  maxPlayers: z.number().positive('Maksymalna liczba graczy musi być dodatnia').optional().nullable(),
});

// ====== Kontrolery ======

/**
 * GET /api/groups?club=X
 * Lista grup dla klubu
 */
export const getGroups = async (req, res, next) => {
  try {
    const filter = { isActive: true };

    if (req.query.club) {
      filter.club = req.query.club;
    }

    const groups = await Group.find(filter)
      .populate('coach', 'firstName lastName')
      .populate('players', 'firstName lastName pathwayStage')
      .sort({ name: 1 });

    res.json({ groups });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/groups
 * Utwórz grupę (coach, clubAdmin)
 */
export const createGroup = async (req, res, next) => {
  try {
    const data = createGroupSchema.parse(req.body);

    const group = await Group.create({
      ...data,
    });

    const populatedGroup = await Group.findById(group._id)
      .populate('coach', 'firstName lastName')
      .populate('players', 'firstName lastName pathwayStage');

    res.status(201).json({
      message: 'Grupa została utworzona',
      group: populatedGroup,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/groups/:id
 * Szczegóły grupy z graczami
 */
export const getGroup = async (req, res, next) => {
  try {
    const group = await Group.findOne({ _id: req.params.id, isActive: true })
      .populate('coach', 'firstName lastName')
      .populate('players', 'firstName lastName dateOfBirth pathwayStage avatarUrl');

    if (!group) {
      return res.status(404).json({ message: 'Grupa nie znaleziona' });
    }

    res.json({ group });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/groups/:id
 * Aktualizuj grupę (coach, clubAdmin)
 */
export const updateGroup = async (req, res, next) => {
  try {
    const data = updateGroupSchema.parse(req.body);

    const group = await Group.findOne({ _id: req.params.id, isActive: true });

    if (!group) {
      return res.status(404).json({ message: 'Grupa nie znaleziona' });
    }

    const fields = ['name', 'description', 'coach', 'pathwayStage', 'players', 'schedule', 'maxPlayers'];

    for (const field of fields) {
      if (data[field] !== undefined) {
        group[field] = data[field];
      }
    }

    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate('coach', 'firstName lastName')
      .populate('players', 'firstName lastName pathwayStage');

    res.json({
      message: 'Grupa została zaktualizowana',
      group: updatedGroup,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/groups/:id
 * Soft delete — isActive=false
 */
export const deleteGroup = async (req, res, next) => {
  try {
    const group = await Group.findOne({ _id: req.params.id, isActive: true });

    if (!group) {
      return res.status(404).json({ message: 'Grupa nie znaleziona' });
    }

    group.isActive = false;
    await group.save();

    res.json({ message: 'Grupa została usunięta' });
  } catch (error) {
    next(error);
  }
};
