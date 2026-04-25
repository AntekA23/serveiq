import { z } from 'zod';
import SeasonPlan from '../models/SeasonPlan.js';
import Player from '../models/Player.js';

const phaseSchema = z.object({
  type: z.enum(['build', 'peak', 'taper', 'recovery', 'offseason']),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  intensity: z.number().int().min(1).max(5).optional(),
  targetEvent: z.string().optional(),
  notes: z.string().optional(),
});

const targetEventSchema = z.object({
  name: z.string().min(1),
  date: z.string().min(1),
  priority: z.enum(['A', 'B', 'C']),
  tournamentRef: z.string().optional(),
});

const createSchema = z.object({
  player: z.string().min(1),
  club: z.string().optional(),
  season: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  weeklyHoursTarget: z.number().min(0).optional(),
  phases: z.array(phaseSchema).optional(),
  targetEvents: z.array(targetEventSchema).optional(),
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

export const getSeasonPlans = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.player) {
      const allowed = await canAccessPlayer(req.user, req.query.player);
      if (!allowed) return res.status(403).json({ message: 'Brak uprawnień' });
      filter.player = req.query.player;
    } else if (req.user.role === 'parent') {
      const childrenIds = req.user.parentProfile?.children || [];
      if (childrenIds.length === 0) return res.json({ seasonPlans: [] });
      filter.player = { $in: childrenIds };
    } else if (req.user.role === 'coach') {
      const players = await Player.find({
        $or: [{ coach: req.user._id }, { coaches: req.user._id }],
      }).select('_id');
      filter.player = { $in: players.map((p) => p._id) };
    }
    if (req.query.season) filter.season = req.query.season;
    if (req.query.status) filter.status = req.query.status;

    const seasonPlans = await SeasonPlan.find(filter).sort({ startDate: -1 });
    res.json({ seasonPlans });
  } catch (err) {
    next(err);
  }
};

export const getSeasonPlan = async (req, res, next) => {
  try {
    const p = await SeasonPlan.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Nie znaleziono' });
    const allowed = await canAccessPlayer(req.user, p.player);
    if (!allowed) return res.status(403).json({ message: 'Brak uprawnień' });
    res.json({ seasonPlan: p });
  } catch (err) {
    next(err);
  }
};

export const createSeasonPlan = async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const allowed = await canAccessPlayer(req.user, data.player);
    if (!allowed) return res.status(403).json({ message: 'Brak uprawnień' });

    await SeasonPlan.updateMany(
      { player: data.player, season: data.season, status: 'active' },
      { $set: { status: 'archived' } }
    );

    const p = await SeasonPlan.create({ ...data, status: 'active', createdBy: req.user._id });
    res.status(201).json({ seasonPlan: p });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.issues[0]?.message || 'Walidacja' });
    }
    next(err);
  }
};

export const updateSeasonPlan = async (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    const p = await SeasonPlan.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Nie znaleziono' });
    const allowed = await canAccessPlayer(req.user, p.player);
    if (!allowed) return res.status(403).json({ message: 'Brak uprawnień' });
    Object.assign(p, data);
    await p.save();
    res.json({ seasonPlan: p });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.issues[0]?.message || 'Walidacja' });
    }
    next(err);
  }
};

export const deleteSeasonPlan = async (req, res, next) => {
  try {
    const p = await SeasonPlan.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Nie znaleziono' });
    const allowed = await canAccessPlayer(req.user, p.player);
    if (!allowed) return res.status(403).json({ message: 'Brak uprawnień' });
    await p.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
