import { z } from 'zod';
import Match from '../models/Match.js';
import Player from '../models/Player.js';

const setSchema = z.object({
  playerScore: z.number().int().min(0),
  opponentScore: z.number().int().min(0),
  tiebreak: z.number().int().min(0).optional(),
});

const opponentSchema = z.object({
  name: z.string().min(1, 'Imię rywalki jest wymagane'),
  club: z.string().optional(),
  isInternal: z.boolean().optional(),
  playerRef: z.string().optional(),
  ranking: z
    .object({
      pzt: z.number().optional(),
      te: z.number().optional(),
      itf: z.number().optional(),
      wta: z.number().optional(),
      atp: z.number().optional(),
    })
    .optional(),
});

const statsSchema = z
  .object({
    firstServePct: z.number().min(0).max(100).optional(),
    secondServePct: z.number().min(0).max(100).optional(),
    aces: z.number().int().min(0).optional(),
    doubleFaults: z.number().int().min(0).optional(),
    winners: z.number().int().min(0).optional(),
    unforcedErrors: z.number().int().min(0).optional(),
    breakPointsConverted: z.number().int().min(0).optional(),
    breakPointsFaced: z.number().int().min(0).optional(),
    breakPointsSaved: z.number().int().min(0).optional(),
  })
  .optional();

const createSchema = z.object({
  player: z.string().min(1),
  club: z.string().optional(),
  tournament: z.string().optional(),
  date: z.string().min(1),
  surface: z.enum(['clay', 'hard', 'indoor-hard', 'grass']).optional(),
  durationMinutes: z.number().int().min(0).optional(),
  round: z.enum(['sparing', 'qualif', 'R64', 'R32', 'R16', 'QF', 'SF', 'F', 'final-3rd-place']).optional(),
  opponent: opponentSchema,
  scoutingNotes: z.string().optional(),
  result: z.object({
    won: z.boolean(),
    sets: z.array(setSchema).optional(),
    retired: z.boolean().optional(),
    walkover: z.boolean().optional(),
  }),
  stats: statsSchema,
  keyMoments: z.array(z.string()).optional(),
  coachDebrief: z.string().optional(),
  mentalState: z.number().int().min(1).max(5).optional(),
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

export const getMatches = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.player) {
      const allowed = await canAccessPlayer(req.user, req.query.player);
      if (!allowed) return res.status(403).json({ message: 'Brak uprawnień' });
      filter.player = req.query.player;
    } else if (req.user.role === 'parent') {
      const childrenIds = req.user.parentProfile?.children || [];
      if (childrenIds.length === 0) return res.json({ matches: [] });
      filter.player = { $in: childrenIds };
      filter.visibleToParent = true;
    } else if (req.user.role === 'coach') {
      const players = await Player.find({
        $or: [{ coach: req.user._id }, { coaches: req.user._id }],
      }).select('_id');
      filter.player = { $in: players.map((p) => p._id) };
    }
    if (req.query.tournament) filter.tournament = req.query.tournament;

    const matches = await Match.find(filter)
      .populate('tournament', 'name location startDate category')
      .populate('opponent.playerRef', 'firstName lastName')
      .sort({ date: -1 });
    res.json({ matches });
  } catch (err) {
    next(err);
  }
};

export const getH2H = async (req, res, next) => {
  try {
    const { player, opponent } = req.query;
    if (!player || !opponent) {
      return res.status(400).json({ message: 'Wymagane: player, opponent' });
    }
    const allowed = await canAccessPlayer(req.user, player);
    if (!allowed) return res.status(403).json({ message: 'Brak uprawnień' });

    const matches = await Match.find({
      player,
      'opponent.name': opponent,
    }).sort({ date: -1 });

    const wins = matches.filter((m) => m.result.won).length;
    const losses = matches.length - wins;
    res.json({ matches, wins, losses });
  } catch (err) {
    next(err);
  }
};

export const getMatch = async (req, res, next) => {
  try {
    const m = await Match.findById(req.params.id)
      .populate('tournament', 'name location startDate category')
      .populate('opponent.playerRef', 'firstName lastName');
    if (!m) return res.status(404).json({ message: 'Nie znaleziono' });
    const allowed = await canAccessPlayer(req.user, m.player);
    if (!allowed) return res.status(403).json({ message: 'Brak uprawnień' });
    res.json({ match: m });
  } catch (err) {
    next(err);
  }
};

export const createMatch = async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const allowed = await canAccessPlayer(req.user, data.player);
    if (!allowed) return res.status(403).json({ message: 'Brak uprawnień' });
    const m = await Match.create({ ...data, createdBy: req.user._id });
    res.status(201).json({ match: m });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.issues[0]?.message || 'Walidacja' });
    }
    next(err);
  }
};

export const updateMatch = async (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    const m = await Match.findById(req.params.id);
    if (!m) return res.status(404).json({ message: 'Nie znaleziono' });
    const allowed = await canAccessPlayer(req.user, m.player);
    if (!allowed) return res.status(403).json({ message: 'Brak uprawnień' });
    Object.assign(m, data);
    await m.save();
    res.json({ match: m });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.issues[0]?.message || 'Walidacja' });
    }
    next(err);
  }
};

export const deleteMatch = async (req, res, next) => {
  try {
    const m = await Match.findById(req.params.id);
    if (!m) return res.status(404).json({ message: 'Nie znaleziono' });
    const allowed = await canAccessPlayer(req.user, m.player);
    if (!allowed) return res.status(403).json({ message: 'Brak uprawnień' });
    await m.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
