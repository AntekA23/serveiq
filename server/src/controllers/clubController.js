import { z } from 'zod';
import Club from '../models/Club.js';
import User from '../models/User.js';
import Player from '../models/Player.js';
import Activity from '../models/Activity.js';
import Observation from '../models/Observation.js';
import ReviewSummary from '../models/ReviewSummary.js';
import Recommendation from '../models/Recommendation.js';

// ====== Domyślne etapy ścieżki ======

const DEFAULT_PATHWAY_STAGES = [
  { name: 'Tennis 10 — Czerwony', order: 1, ageRange: { min: 4, max: 7 }, color: '#EF4444' },
  { name: 'Tennis 10 — Pomarańczowy', order: 2, ageRange: { min: 7, max: 9 }, color: '#F97316' },
  { name: 'Tennis 10 — Zielony', order: 3, ageRange: { min: 9, max: 10 }, color: '#22C55E' },
  { name: 'Junior — Początkujący', order: 4, ageRange: { min: 10, max: 12 }, color: '#3B82F6' },
  { name: 'Junior — Zaawansowany', order: 5, ageRange: { min: 12, max: 14 }, color: '#6366F1' },
  { name: 'Kadra — Performance', order: 6, ageRange: { min: 14, max: 18 }, color: '#8B5CF6' },
  { name: 'Dorosły — Rekreacja', order: 7, ageRange: { min: 18, max: 99 }, color: '#6B7280' },
];

// ====== Zod Schemas ======

const createClubSchema = z.object({
  name: z.string().min(1, 'Nazwa klubu jest wymagana'),
  shortName: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Nieprawidłowy adres email').optional().or(z.literal('')),
  website: z.string().optional(),
  pztLicense: z.string().optional(),
  pztCertified: z.boolean().optional(),
  surfaces: z.array(z.enum(['clay', 'hard', 'grass', 'carpet', 'indoor-hard'])).optional(),
  courtsCount: z.number().positive('Liczba kortów musi być dodatnia').optional(),
});

const updateClubSchema = z.object({
  name: z.string().min(1, 'Nazwa klubu jest wymagana').optional(),
  shortName: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Nieprawidłowy adres email').optional().nullable().or(z.literal('')),
  website: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  pztLicense: z.string().optional().nullable(),
  pztCertified: z.boolean().optional(),
  surfaces: z.array(z.enum(['clay', 'hard', 'grass', 'carpet', 'indoor-hard'])).optional(),
  courtsCount: z.number().positive('Liczba kortów musi być dodatnia').optional().nullable(),
  pathwayStages: z.array(z.object({
    name: z.string().min(1),
    order: z.number(),
    description: z.string().optional(),
    ageRange: z.object({ min: z.number(), max: z.number() }).optional(),
    color: z.string().optional(),
  })).optional(),
  settings: z.object({
    defaultCurrency: z.string().optional(),
    timezone: z.string().optional(),
    language: z.string().optional(),
  }).optional(),
});

// ====== Kontrolery ======

/**
 * POST /api/clubs
 * Utwórz nowy klub — użytkownik staje się właścicielem
 */
export const createClub = async (req, res, next) => {
  try {
    const data = createClubSchema.parse(req.body);

    const clubData = {
      ...data,
      owner: req.user._id,
      admins: [req.user._id],
      pathwayStages: DEFAULT_PATHWAY_STAGES,
    };

    const club = await Club.create(clubData);

    // Aktualizuj pole club na użytkowniku
    await User.findByIdAndUpdate(req.user._id, { club: club._id });

    const populatedClub = await Club.findById(club._id)
      .populate('owner', 'firstName lastName email')
      .populate('admins', 'firstName lastName email')
      .populate('coaches', 'firstName lastName email');

    res.status(201).json({
      message: 'Klub został utworzony',
      club: populatedClub,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/clubs/:id
 * Szczegóły klubu — dowolny zalogowany użytkownik należący do klubu
 */
export const getClub = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('owner', 'firstName lastName email')
      .populate('admins', 'firstName lastName email')
      .populate('coaches', 'firstName lastName email');

    if (!club) {
      return res.status(404).json({ message: 'Klub nie znaleziony' });
    }

    // Sprawdź czy użytkownik należy do klubu
    const userId = req.user._id.toString();
    const belongsToClub =
      club.owner?._id.toString() === userId ||
      club.admins.some((a) => a._id.toString() === userId) ||
      club.coaches.some((c) => c._id.toString() === userId) ||
      req.user.club?.toString() === club._id.toString();

    if (!belongsToClub) {
      return res.status(403).json({ message: 'Brak dostępu do tego klubu' });
    }

    res.json({ club });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/clubs/:id
 * Aktualizuj klub — tylko owner lub admins
 */
export const updateClub = async (req, res, next) => {
  try {
    const data = updateClubSchema.parse(req.body);

    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({ message: 'Klub nie znaleziony' });
    }

    // Sprawdź uprawnienia
    const userId = req.user._id.toString();
    const isOwner = club.owner?.toString() === userId;
    const isAdmin = club.admins.some((a) => a.toString() === userId);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Brak uprawnień do edycji tego klubu' });
    }

    // Aktualizuj pola
    const fields = [
      'name', 'shortName', 'city', 'address', 'phone', 'email',
      'website', 'logoUrl', 'pztLicense', 'pztCertified', 'surfaces',
      'courtsCount', 'pathwayStages', 'settings',
    ];

    for (const field of fields) {
      if (data[field] !== undefined) {
        club[field] = data[field];
      }
    }

    await club.save();

    const updatedClub = await Club.findById(club._id)
      .populate('owner', 'firstName lastName email')
      .populate('admins', 'firstName lastName email')
      .populate('coaches', 'firstName lastName email');

    res.json({
      message: 'Dane klubu zostały zaktualizowane',
      club: updatedClub,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/clubs/:id/dashboard
 * Zagregowane dane dashboardu — tylko clubAdmin
 */
export const getDashboard = async (req, res, next) => {
  try {
    const clubId = req.params.id;

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ message: 'Klub nie znaleziony' });
    }

    // Sprawdź czy użytkownik jest adminem
    const userId = req.user._id.toString();
    const isOwner = club.owner?.toString() === userId;
    const isAdmin = club.admins.some((a) => a.toString() === userId);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Brak uprawnień do dashboardu' });
    }

    // Gracze według etapu ścieżki
    const playersByStage = await Player.aggregate([
      { $match: { club: club._id, active: true } },
      {
        $group: {
          _id: '$pathwayStage',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Frekwencja w bieżącym miesiącu
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const attendanceAgg = await Activity.aggregate([
      {
        $match: {
          club: club._id,
          date: { $gte: monthStart, $lte: monthEnd },
          status: { $in: ['completed', 'in-progress'] },
        },
      },
      { $unwind: { path: '$attendance', preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ['$attendance.status', 'present'] }, 1, 0] },
          },
        },
      },
    ]);

    const attendanceRate =
      attendanceAgg.length > 0 && attendanceAgg[0].total > 0
        ? Math.round((attendanceAgg[0].present / attendanceAgg[0].total) * 100)
        : 0;

    // Oczekujące rekomendacje
    const pendingRecommendations = await Recommendation.countDocuments({
      club: clubId,
      status: 'pending',
    });

    // Ostatnie przeglądy
    const recentReviews = await ReviewSummary.countDocuments({
      club: clubId,
      createdAt: { $gte: monthStart },
    });

    // Łączna liczba aktywnych graczy
    const totalPlayers = await Player.countDocuments({ club: clubId, active: true });

    // Łączna liczba aktywności w tym miesiącu
    const totalActivities = await Activity.countDocuments({
      club: clubId,
      date: { $gte: monthStart, $lte: monthEnd },
    });

    res.json({
      dashboard: {
        totalPlayers,
        playersByStage,
        attendanceRate,
        totalActivities,
        pendingRecommendations,
        recentReviews,
      },
    });
  } catch (error) {
    next(error);
  }
};
