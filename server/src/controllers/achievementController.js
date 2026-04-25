import { z } from 'zod';
import Achievement from '../models/Achievement.js';
import Player from '../models/Player.js';

const createSchema = z.object({
  player: z.string().min(1, 'Zawodnik jest wymagany'),
  club: z.string().optional(),
  category: z.enum(['mp', 'international', 'national', 'ranking', 'callup', 'other']),
  title: z.string().min(1, 'Tytuł jest wymagany'),
  ageCategory: z.enum(['U10', 'U12', 'U14', 'U16', 'U18', 'open']).optional(),
  discipline: z.enum(['singel', 'debel', 'mix', 'druzynowe']).optional(),
  year: z.number().int().min(1900).max(2100),
  date: z.string().optional(),
  location: z.string().optional(),
  result: z.enum(['gold', 'silver', 'bronze', 'finalist', 'semifinal', 'quarterfinal', 'other']),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  visibleToParent: z.boolean().optional(),
});

const updateSchema = createSchema.partial().omit({ player: true });

const canAccessPlayer = async (user, playerId) => {
  const player = await Player.findById(playerId);
  if (!player) return false;
  if (user.role === 'clubAdmin') return true;
  if (user.role === 'coach') {
    return (
      player.coach?.toString() === user._id.toString() ||
      (player.coaches || []).some((c) => c.toString() === user._id.toString())
    );
  }
  if (user.role === 'parent') {
    return (player.parents || []).some((p) => p.toString() === user._id.toString());
  }
  return false;
};

export const getAchievements = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.player) {
      const allowed = await canAccessPlayer(req.user, req.query.player);
      if (!allowed) return res.status(403).json({ message: 'Brak uprawnień' });
      filter.player = req.query.player;
    } else if (req.user.role === 'parent') {
      const childrenIds = req.user.parentProfile?.children || [];
      if (childrenIds.length === 0) return res.json({ achievements: [] });
      filter.player = { $in: childrenIds };
      filter.visibleToParent = true;
    } else if (req.user.role === 'coach') {
      const players = await Player.find({
        $or: [{ coach: req.user._id }, { coaches: req.user._id }],
      }).select('_id');
      filter.player = { $in: players.map((p) => p._id) };
    }
    if (req.query.category) filter.category = req.query.category;
    if (req.query.year) filter.year = Number(req.query.year);

    const achievements = await Achievement.find(filter).sort({ year: -1, date: -1 });
    res.json({ achievements });
  } catch (err) {
    next(err);
  }
};

export const getAchievement = async (req, res, next) => {
  try {
    const a = await Achievement.findById(req.params.id);
    if (!a) return res.status(404).json({ message: 'Nie znaleziono' });
    const allowed = await canAccessPlayer(req.user, a.player);
    if (!allowed) return res.status(403).json({ message: 'Brak uprawnień' });
    res.json({ achievement: a });
  } catch (err) {
    next(err);
  }
};

export const createAchievement = async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const allowed = await canAccessPlayer(req.user, data.player);
    if (!allowed) return res.status(403).json({ message: 'Brak uprawnień' });
    const a = await Achievement.create({ ...data, createdBy: req.user._id });
    res.status(201).json({ achievement: a });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.issues[0]?.message || 'Walidacja' });
    }
    next(err);
  }
};

export const updateAchievement = async (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    const a = await Achievement.findById(req.params.id);
    if (!a) return res.status(404).json({ message: 'Nie znaleziono' });
    const allowed = await canAccessPlayer(req.user, a.player);
    if (!allowed) return res.status(403).json({ message: 'Brak uprawnień' });
    Object.assign(a, data);
    await a.save();
    res.json({ achievement: a });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.issues[0]?.message || 'Walidacja' });
    }
    next(err);
  }
};

export const deleteAchievement = async (req, res, next) => {
  try {
    const a = await Achievement.findById(req.params.id);
    if (!a) return res.status(404).json({ message: 'Nie znaleziono' });
    const allowed = await canAccessPlayer(req.user, a.player);
    if (!allowed) return res.status(403).json({ message: 'Brak uprawnień' });
    await a.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
