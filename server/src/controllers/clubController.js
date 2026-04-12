import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import multer from 'multer';
import Club from '../models/Club.js';
import User from '../models/User.js';
import Player from '../models/Player.js';
import Activity from '../models/Activity.js';
import Observation from '../models/Observation.js';
import ReviewSummary from '../models/ReviewSummary.js';
import Recommendation from '../models/Recommendation.js';
import DevelopmentGoal from '../models/DevelopmentGoal.js';
import Payment from '../models/Payment.js';
import Session from '../models/Session.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ====== Multer config for club logo uploads ======
const logoUploadDir = path.resolve(__dirname, '../../uploads/logos');
if (!fs.existsSync(logoUploadDir)) {
  fs.mkdirSync(logoUploadDir, { recursive: true });
}

const logoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, logoUploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `logo-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const logoUpload = multer({
  storage: logoStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|svg/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(ext && mime ? null : new Error('Dozwolone formaty: jpg, png, webp, svg'), ext && mime);
  },
});

export const logoUploadMiddleware = logoUpload.single('logo');

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

const courtSchema = z.object({
  number: z.number().min(1, 'Numer kortu musi być >= 1'),
  name: z.string().optional(),
  surface: z.enum(['clay', 'hard', 'grass', 'carpet', 'indoor-hard']),
  indoor: z.boolean().optional(),
  lighting: z.boolean().optional(),
  heated: z.boolean().optional(),
  active: z.boolean().optional(),
});

const facilityItemSchema = z.object({
  available: z.boolean().optional(),
  description: z.string().optional().nullable(),
  courtsCount: z.number().optional().nullable(),
  tablesCount: z.number().optional().nullable(),
  spacesCount: z.number().optional().nullable(),
});

const facilitiesSchema = z.object({
  gym: facilityItemSchema.optional(),
  squash: facilityItemSchema.optional(),
  tableTennis: facilityItemSchema.optional(),
  swimmingPool: facilityItemSchema.optional(),
  sauna: facilityItemSchema.optional(),
  changingRooms: facilityItemSchema.optional(),
  parking: facilityItemSchema.optional(),
  shop: facilityItemSchema.optional(),
  cafe: facilityItemSchema.optional(),
  physio: facilityItemSchema.optional(),
  other: z.array(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
  })).optional(),
});

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
  courts: z.array(courtSchema).optional(),
  facilities: facilitiesSchema.optional(),
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
  courts: z.array(courtSchema).optional(),
  facilities: facilitiesSchema.optional(),
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
      'courtsCount', 'courts', 'facilities', 'pathwayStages', 'settings',
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

    // Pathway continuity metrics
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [playersWithActiveGoal, playersWithRecentReview, playersWithUpcomingActivity] = await Promise.all([
      DevelopmentGoal.distinct('player', { club: club._id, status: 'active' }),
      ReviewSummary.distinct('player', { club: club._id, status: 'published', publishedAt: { $gte: thirtyDaysAgo } }),
      Activity.distinct('players', { club: club._id, date: { $gte: now }, status: 'planned' }),
    ]);

    res.json({
      dashboard: {
        totalPlayers,
        playersByStage,
        attendanceRate,
        totalActivities,
        pendingRecommendations,
        recentReviews,
        pathwayContinuity: {
          playersWithActiveGoal: playersWithActiveGoal.length,
          playersWithRecentReview: playersWithRecentReview.length,
          playersWithUpcomingActivity: playersWithUpcomingActivity.length,
          totalPlayers,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/clubs/:id/attention
 * Gracze wymagający uwagi — tylko clubAdmin
 */
export const getPlayersNeedingAttention = async (req, res, next) => {
  try {
    const clubId = req.params.id;

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ message: 'Klub nie znaleziony' });
    }

    const players = await Player.find({ club: clubId, active: true })
      .select('firstName lastName pathwayStage coach dateOfBirth')
      .lean();

    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const results = [];

    for (const player of players) {
      const reasons = [];

      const [recentActivity, recentReview, activeGoal] = await Promise.all([
        Activity.findOne({ players: player._id, date: { $gte: fourteenDaysAgo } }).select('_id').lean(),
        ReviewSummary.findOne({ player: player._id, status: 'published', publishedAt: { $gte: thirtyDaysAgo } }).select('_id').lean(),
        DevelopmentGoal.findOne({ player: player._id, status: 'active' }).select('_id').lean(),
      ]);

      if (!recentActivity) reasons.push('no_recent_activity');
      if (!recentReview) reasons.push('no_review');
      if (!activeGoal) reasons.push('no_goals');
      if (!player.coach) reasons.push('no_coach');

      if (reasons.length > 0) {
        results.push({
          _id: player._id,
          firstName: player.firstName,
          lastName: player.lastName,
          pathwayStage: player.pathwayStage,
          reasons,
        });
      }
    }

    res.json({ players: results });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/clubs/:id/facility
 * Dane infrastruktury ośrodka — korty + udogodnienia
 */
export const getFacility = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id)
      .select('name courts facilities courtsCount surfaces');

    if (!club) {
      return res.status(404).json({ message: 'Klub nie znaleziony' });
    }

    res.json({
      facility: {
        name: club.name,
        courts: club.courts || [],
        facilities: club.facilities || {},
        courtsCount: club.courtsCount,
        surfaces: club.surfaces || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/clubs/:id/facility
 * Aktualizuj infrastrukturę — korty + udogodnienia
 */
const updateFacilitySchema = z.object({
  courts: z.array(courtSchema).optional(),
  facilities: facilitiesSchema.optional(),
});

export const updateFacility = async (req, res, next) => {
  try {
    const data = updateFacilitySchema.parse(req.body);

    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ message: 'Klub nie znaleziony' });
    }

    const userId = req.user._id.toString();
    const isOwner = club.owner?.toString() === userId;
    const isAdmin = club.admins.some((a) => a.toString() === userId);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Brak uprawnień do edycji infrastruktury' });
    }

    if (data.courts !== undefined) {
      club.courts = data.courts;
      // Sync legacy fields
      club.courtsCount = data.courts.filter(c => c.active !== false).length;
      club.surfaces = [...new Set(data.courts.map(c => c.surface))];
    }

    if (data.facilities !== undefined) {
      club.facilities = data.facilities;
    }

    await club.save();

    res.json({
      message: 'Infrastruktura została zaktualizowana',
      facility: {
        courts: club.courts,
        facilities: club.facilities,
        courtsCount: club.courtsCount,
        surfaces: club.surfaces,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/clubs/:id/invite-code
 * Pobierz kod zaproszenia klubu — tylko owner/admin
 */
export const getInviteCode = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ message: 'Klub nie znaleziony' });
    }

    const userId = req.user._id.toString();
    const isOwner = club.owner?.toString() === userId;
    const isAdmin = club.admins.some((a) => a.toString() === userId);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    res.json({ inviteCode: club.inviteCode });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/clubs/join
 * Trener dołącza do klubu za pomocą kodu zaproszenia
 */
export const joinClub = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Kod zaproszenia jest wymagany' });
    }

    if (req.user.role !== 'coach') {
      return res.status(403).json({ message: 'Tylko trenerzy mogą dołączać do klubów' });
    }

    if (req.user.club) {
      return res.status(400).json({ message: 'Już należysz do klubu. Najpierw opuść obecny klub.' });
    }

    const club = await Club.findOne({ inviteCode: code.toUpperCase().trim(), isActive: true });
    if (!club) {
      return res.status(404).json({ message: 'Nieprawidłowy kod zaproszenia' });
    }

    // Add coach to club
    if (!club.coaches.some((c) => c.toString() === req.user._id.toString())) {
      club.coaches.push(req.user._id);
      await club.save();
    }

    // Set club on user
    await User.findByIdAndUpdate(req.user._id, { club: club._id });

    // Assign club to all coach's players
    await Player.updateMany(
      { coaches: req.user._id, club: { $exists: false } },
      { $set: { club: club._id } }
    );
    await Player.updateMany(
      { coaches: req.user._id, club: null },
      { $set: { club: club._id } }
    );

    const populatedClub = await Club.findById(club._id)
      .populate('owner', 'firstName lastName email')
      .select('name shortName city');

    res.json({
      message: `Dołączyłeś do klubu ${club.name}`,
      club: populatedClub,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/clubs/leave
 * Trener opuszcza klub
 */
export const leaveClub = async (req, res, next) => {
  try {
    if (req.user.role !== 'coach') {
      return res.status(403).json({ message: 'Tylko trenerzy mogą opuszczać kluby' });
    }

    if (!req.user.club) {
      return res.status(400).json({ message: 'Nie należysz do żadnego klubu' });
    }

    const clubId = req.user.club;
    const club = await Club.findById(clubId);

    if (club) {
      club.coaches = club.coaches.filter((c) => c.toString() !== req.user._id.toString());
      await club.save();
    }

    await User.findByIdAndUpdate(req.user._id, { $unset: { club: 1 } });

    res.json({ message: 'Opuściłeś klub' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/clubs/validate-code
 * Sprawdź kod zaproszenia — publiczny dla zalogowanych
 */
export const validateClubCode = async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ message: 'Kod jest wymagany' });
    }

    const club = await Club.findOne({ inviteCode: code.toUpperCase().trim(), isActive: true })
      .select('name shortName city address courtsCount surfaces');

    if (!club) {
      return res.status(404).json({ message: 'Nieprawidłowy kod' });
    }

    res.json({ club });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/clubs/:id/coaches
 * Lista trenerów przypisanych do klubu
 */
export const getClubCoaches = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('coaches', 'firstName lastName email phone coachProfile avatarUrl createdAt');

    if (!club) {
      return res.status(404).json({ message: 'Klub nie znaleziony' });
    }

    const coachesWithStats = await Promise.all(
      (club.coaches || []).map(async (coach) => {
        const playerCount = await Player.countDocuments({
          coaches: coach._id,
          active: true,
        });
        return { ...coach.toObject(), playerCount };
      })
    );

    res.json({ coaches: coachesWithStats });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/clubs/:id/search-coaches?q=
 * Wyszukaj trenerów w systemie do zapraszania
 */
export const searchCoaches = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ coaches: [] });
    }

    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ message: 'Klub nie znaleziony' });
    }

    const existingCoachIds = (club.coaches || []).map((c) => c.toString());
    const searchRegex = new RegExp(q.trim(), 'i');

    const coaches = await User.find({
      role: 'coach',
      isActive: true,
      _id: { $nin: existingCoachIds },
      $or: [
        { email: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
      ],
    })
      .select('firstName lastName email coachProfile.specialization coachProfile.itfLevel avatarUrl')
      .limit(10)
      .lean();

    res.json({ coaches });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/clubs/:id/coaches
 * Admin dodaje trenera do klubu
 */
export const addCoachToClub = async (req, res, next) => {
  try {
    const { coachId } = req.body;
    if (!coachId) {
      return res.status(400).json({ message: 'ID trenera jest wymagane' });
    }

    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ message: 'Klub nie znaleziony' });
    }

    const userId = req.user._id.toString();
    const isOwner = club.owner?.toString() === userId;
    const isAdmin = club.admins.some((a) => a.toString() === userId);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    const coach = await User.findById(coachId);
    if (!coach || coach.role !== 'coach') {
      return res.status(404).json({ message: 'Trener nie znaleziony' });
    }

    if (coach.club && coach.club.toString() !== club._id.toString()) {
      return res.status(400).json({ message: 'Ten trener już należy do innego klubu' });
    }

    if (!club.coaches.some((c) => c.toString() === coachId)) {
      club.coaches.push(coachId);
      await club.save();
    }

    await User.findByIdAndUpdate(coachId, { club: club._id });

    await Player.updateMany(
      { coaches: coachId, $or: [{ club: { $exists: false } }, { club: null }] },
      { $set: { club: club._id } }
    );

    res.json({
      message: `Trener ${coach.firstName} ${coach.lastName} dodany do klubu`,
      coach: {
        _id: coach._id,
        firstName: coach.firstName,
        lastName: coach.lastName,
        email: coach.email,
        coachProfile: coach.coachProfile,
        avatarUrl: coach.avatarUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/clubs/:id/coaches/:coachId
 * Admin usuwa trenera z klubu
 */
export const removeCoachFromClub = async (req, res, next) => {
  try {
    const { id, coachId } = req.params;

    const club = await Club.findById(id);
    if (!club) {
      return res.status(404).json({ message: 'Klub nie znaleziony' });
    }

    const userId = req.user._id.toString();
    const isOwner = club.owner?.toString() === userId;
    const isAdmin = club.admins.some((a) => a.toString() === userId);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    club.coaches = club.coaches.filter((c) => c.toString() !== coachId);
    await club.save();

    await User.findByIdAndUpdate(coachId, { $unset: { club: 1 } });

    res.json({ message: 'Trener usunięty z klubu' });
  } catch (error) {
    next(error);
  }
};

// ====== CLUB SETTINGS ======

/**
 * GET /api/clubs/:id/settings
 * Pobierz ustawienia klubu
 */
export const getClubSettings = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id)
      .select('name shortName city address phone email website logoUrl pztLicense pztCertified pathwayStages settings inviteCode');

    if (!club) {
      return res.status(404).json({ message: 'Klub nie znaleziony' });
    }

    res.json({ settings: club });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/clubs/:id/logo
 * Upload logo klubu
 */
export const uploadClubLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Plik logo jest wymagany' });
    }

    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ message: 'Klub nie znaleziony' });
    }

    // Usuń stare logo jeśli istnieje
    if (club.logoUrl) {
      const oldPath = path.resolve(__dirname, '../..', club.logoUrl.replace(/^\//, ''));
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    club.logoUrl = `/uploads/logos/${req.file.filename}`;
    await club.save();

    res.json({ logoUrl: club.logoUrl });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/clubs/:id/regenerate-invite-code
 * Regeneruj kod zaproszenia
 */
export const regenerateInviteCode = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ message: 'Klub nie znaleziony' });
    }

    // Force regenerate by clearing and saving
    club.inviteCode = undefined;
    await club.save();

    res.json({ inviteCode: club.inviteCode });
  } catch (error) {
    next(error);
  }
};

// ====== CLUB PLAYERS ======

/**
 * GET /api/clubs/:id/players
 * Lista wszystkich graczy klubu z filtrami
 */
export const getClubPlayers = async (req, res, next) => {
  try {
    const clubId = req.params.id;
    const { coach, pathwayStage, status, search, sort } = req.query;

    const filter = { club: clubId };

    if (status === 'active') filter.active = true;
    else if (status === 'inactive') filter.active = false;
    else filter.active = true; // domyslnie aktywni

    if (coach) filter.coaches = coach;
    if (pathwayStage) filter.pathwayStage = pathwayStage;

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
      ];
    }

    let sortObj = { lastName: 1, firstName: 1 };
    if (sort === 'recent') sortObj = { updatedAt: -1 };
    if (sort === 'stage') sortObj = { pathwayStage: 1, lastName: 1 };

    const players = await Player.find(filter)
      .populate('coaches', 'firstName lastName')
      .populate('parents', 'firstName lastName email')
      .select('firstName lastName dateOfBirth pathwayStage coaches parents active avatarUrl updatedAt createdAt')
      .sort(sortObj)
      .lean();

    // Dodaj datę ostatniej aktywności
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const enriched = await Promise.all(
      players.map(async (p) => {
        const lastActivity = await Activity.findOne({ players: p._id })
          .sort({ date: -1 })
          .select('date')
          .lean();

        let playerStatus = 'active';
        if (lastActivity) {
          if (lastActivity.date < fourteenDaysAgo) playerStatus = 'inactive';
        } else {
          // Nowy gracz? Sprawdź createdAt
          if (p.createdAt > thirtyDaysAgo) playerStatus = 'new';
          else playerStatus = 'inactive';
        }

        return {
          ...p,
          lastActivityDate: lastActivity?.date || null,
          playerStatus,
        };
      })
    );

    res.json({ players: enriched });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/clubs/:id/players/:playerId/assign-coach
 * Przypisz trenera do gracza
 */
export const assignCoachToPlayer = async (req, res, next) => {
  try {
    const { playerId } = req.params;
    const { coachId } = req.body;

    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Gracz nie znaleziony' });
    }

    if (coachId) {
      const coach = await User.findById(coachId);
      if (!coach || coach.role !== 'coach') {
        return res.status(404).json({ message: 'Trener nie znaleziony' });
      }

      // Ustaw jako główny trener i dodaj do tablicy coaches
      player.coach = coachId;
      if (!player.coaches.some((c) => c.toString() === coachId)) {
        player.coaches.push(coachId);
      }
    } else {
      player.coach = undefined;
    }

    await player.save();

    const updated = await Player.findById(playerId)
      .populate('coaches', 'firstName lastName');

    res.json({ message: 'Trener przypisany', player: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/clubs/:id/players/:playerId/pathway-stage
 * Zmień etap ścieżki gracza
 */
export const updatePlayerPathwayStage = async (req, res, next) => {
  try {
    const { playerId } = req.params;
    const { stage } = req.body;

    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Gracz nie znaleziony' });
    }

    // Dodaj wpis do historii
    if (player.pathwayStage && player.pathwayStage !== stage) {
      player.pathwayHistory.push({
        stage: player.pathwayStage,
        startDate: player.updatedAt,
        endDate: new Date(),
        notes: `Zmieniono przez admina klubu`,
      });
    }

    player.pathwayStage = stage;
    await player.save();

    res.json({ message: 'Etap zaktualizowany', player });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/clubs/:id/players/:playerId/deactivate
 * Dezaktywuj gracza (soft delete)
 */
export const deactivatePlayer = async (req, res, next) => {
  try {
    const { playerId } = req.params;

    const player = await Player.findByIdAndUpdate(
      playerId,
      { active: false },
      { new: true }
    );

    if (!player) {
      return res.status(404).json({ message: 'Gracz nie znaleziony' });
    }

    res.json({ message: 'Gracz dezaktywowany', player });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/clubs/:id/players/:playerId/activate
 * Aktywuj gracza
 */
export const activatePlayer = async (req, res, next) => {
  try {
    const { playerId } = req.params;

    const player = await Player.findByIdAndUpdate(
      playerId,
      { active: true },
      { new: true }
    );

    if (!player) {
      return res.status(404).json({ message: 'Gracz nie znaleziony' });
    }

    res.json({ message: 'Gracz aktywowany', player });
  } catch (error) {
    next(error);
  }
};

// ====== CLUB PAYMENTS ======

/**
 * GET /api/clubs/:id/payments
 * Wszystkie płatności klubu z filtrami
 */
export const getClubPayments = async (req, res, next) => {
  try {
    const clubId = req.params.id;
    const { coach, status, period } = req.query;

    // Znajdź graczy klubu
    const clubPlayers = await Player.find({ club: clubId }).select('_id').lean();
    const playerIds = clubPlayers.map((p) => p._id);

    const filter = { player: { $in: playerIds } };

    if (status) filter.status = status;
    if (coach) filter.coach = coach;

    if (period) {
      const now = new Date();
      if (period === 'month') {
        filter.createdAt = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
      } else if (period === 'quarter') {
        const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        filter.createdAt = { $gte: qStart };
      } else if (period === 'year') {
        filter.createdAt = { $gte: new Date(now.getFullYear(), 0, 1) };
      }
    }

    const payments = await Payment.find(filter)
      .populate('player', 'firstName lastName')
      .populate('coach', 'firstName lastName')
      .populate('parent', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();

    // Statystyki
    const allPayments = await Payment.find({ player: { $in: playerIds } }).lean();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = {
      totalRevenue: allPayments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0),
      monthlyRevenue: allPayments
        .filter((p) => p.status === 'paid' && p.paidAt >= monthStart)
        .reduce((s, p) => s + p.amount, 0),
      pending: allPayments.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0),
      overdue: allPayments.filter((p) => p.status === 'overdue').reduce((s, p) => s + p.amount, 0),
      overdueCount: allPayments.filter((p) => p.status === 'overdue').length,
    };

    res.json({ payments, stats });
  } catch (error) {
    next(error);
  }
};

// ====== CLUB REPORTS ======

/**
 * GET /api/clubs/:id/reports
 * Raporty klubu — frekwencja, postępy, aktywność trenerów
 */
export const getClubReports = async (req, res, next) => {
  try {
    const clubId = req.params.id;
    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ message: 'Klub nie znaleziony' });
    }

    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // === FREKWENCJA (ostatnie 6 miesięcy) ===
    const attendanceByMonth = await Activity.aggregate([
      {
        $match: {
          club: club._id,
          date: { $gte: sixMonthsAgo },
          status: { $in: ['completed', 'in-progress'] },
        },
      },
      { $unwind: { path: '$attendance', preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ['$attendance.status', 'present'] }, 1, 0] },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // === FREKWENCJA PER TRENER ===
    const attendanceByCoach = await Activity.aggregate([
      {
        $match: {
          club: club._id,
          date: { $gte: sixMonthsAgo },
          status: { $in: ['completed', 'in-progress'] },
        },
      },
      { $unwind: { path: '$attendance', preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: '$coach',
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ['$attendance.status', 'present'] }, 1, 0] },
          },
        },
      },
    ]);

    // Populate coach names
    const coachIds = attendanceByCoach.map((a) => a._id).filter(Boolean);
    const coaches = await User.find({ _id: { $in: coachIds } })
      .select('firstName lastName')
      .lean();
    const coachMap = Object.fromEntries(coaches.map((c) => [c._id.toString(), c]));

    const attendanceByCoachEnriched = attendanceByCoach
      .filter((a) => a._id)
      .map((a) => ({
        coach: coachMap[a._id.toString()] || { firstName: '?', lastName: '?' },
        total: a.total,
        present: a.present,
        rate: a.total > 0 ? Math.round((a.present / a.total) * 100) : 0,
      }));

    // === AKTYWNOŚĆ TRENERÓW ===
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const coachActivity = await Promise.all(
      (club.coaches || []).map(async (coachId) => {
        const [activities, reviews, sessions] = await Promise.all([
          Activity.countDocuments({ coach: coachId, club: club._id, date: { $gte: monthStart } }),
          ReviewSummary.countDocuments({ coach: coachId, club: club._id, createdAt: { $gte: monthStart } }),
          Session.countDocuments({ coach: coachId, date: { $gte: monthStart } }),
        ]);

        const coach = coachMap[coachId.toString()];
        return {
          coach: coach || { firstName: '?', lastName: '?' },
          activities,
          reviews,
          sessions,
        };
      })
    );

    // === PATHWAY ROZKŁAD ===
    const pathwayDistribution = await Player.aggregate([
      { $match: { club: club._id, active: true } },
      {
        $group: {
          _id: '$pathwayStage',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // === RETENCJA (aktywni vs nieaktywni) ===
    const totalPlayers = await Player.countDocuments({ club: club._id });
    const activePlayers = await Player.countDocuments({ club: club._id, active: true });
    const inactivePlayers = totalPlayers - activePlayers;

    // Nowi gracze (ostatnie 30 dni)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const newPlayers = await Player.countDocuments({
      club: club._id,
      createdAt: { $gte: thirtyDaysAgo },
    });

    res.json({
      reports: {
        attendance: {
          byMonth: attendanceByMonth.map((a) => ({
            year: a._id.year,
            month: a._id.month,
            total: a.total,
            present: a.present,
            rate: a.total > 0 ? Math.round((a.present / a.total) * 100) : 0,
          })),
          byCoach: attendanceByCoachEnriched,
        },
        coachActivity,
        pathwayDistribution,
        retention: {
          total: totalPlayers,
          active: activePlayers,
          inactive: inactivePlayers,
          new: newPlayers,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
