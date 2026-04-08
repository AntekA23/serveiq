import { z } from 'zod';
import Activity from '../models/Activity.js';
import Player from '../models/Player.js';

// ====== Zod Schemas ======

const createActivitySchema = z.object({
  club: z.string().optional(),
  type: z.enum(['class', 'camp', 'tournament', 'training', 'match', 'fitness', 'review', 'other']),
  title: z.string().min(1, 'Tytuł jest wymagany'),
  description: z.string().optional(),
  date: z.string().min(1, 'Data jest wymagana'),
  endDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  durationMinutes: z.number().positive('Czas trwania musi być dodatni').optional(),
  players: z.array(z.string()).optional(),
  coach: z.string().optional(),
  group: z.string().optional(),
  location: z.string().optional(),
  surface: z.enum(['clay', 'hard', 'grass', 'carpet', 'indoor-hard', '']).optional(),
  focusAreas: z.array(z.string()).optional(),
  notes: z.string().optional(),
  parentNotes: z.string().optional(),
  tournamentData: z.object({
    category: z.string().optional(),
    drawSize: z.number().positive().optional(),
    result: z.object({
      round: z.string().optional(),
      wins: z.number().min(0).optional(),
      losses: z.number().min(0).optional(),
      scores: z.array(z.string()).optional(),
    }).optional(),
  }).optional(),
  visibleToParent: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  recurrence: z.object({
    type: z.enum(['none', 'weekly', 'biweekly', 'monthly']).optional(),
  }).optional(),
});

const updateActivitySchema = z.object({
  type: z.enum(['class', 'camp', 'tournament', 'training', 'match', 'fitness', 'review', 'other']).optional(),
  title: z.string().min(1, 'Tytuł jest wymagany').optional(),
  description: z.string().optional().nullable(),
  date: z.string().optional(),
  endDate: z.string().optional().nullable(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  durationMinutes: z.number().positive('Czas trwania musi być dodatni').optional().nullable(),
  players: z.array(z.string()).optional(),
  coach: z.string().optional().nullable(),
  group: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  surface: z.enum(['clay', 'hard', 'grass', 'carpet', 'indoor-hard', '']).optional(),
  status: z.enum(['planned', 'in-progress', 'completed', 'cancelled']).optional(),
  focusAreas: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
  parentNotes: z.string().optional().nullable(),
  tournamentData: z.object({
    category: z.string().optional(),
    drawSize: z.number().positive().optional(),
    result: z.object({
      round: z.string().optional(),
      wins: z.number().min(0).optional(),
      losses: z.number().min(0).optional(),
      scores: z.array(z.string()).optional(),
    }).optional(),
  }).optional(),
  visibleToParent: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

const attendanceSchema = z.object({
  attendance: z.array(z.object({
    player: z.string().min(1, 'Zawodnik jest wymagany'),
    status: z.enum(['present', 'absent', 'late', 'excused']),
  })),
});

// ====== Pomocnicze ======

/**
 * Buduje filtr w zależności od roli użytkownika
 */
async function buildAccessFilter(user) {
  const filter = {};

  if (user.role === 'coach') {
    // Coach widzi aktywności gdzie jest trenerem lub z jego klubu
    if (user.club) {
      filter.$or = [
        { coach: user._id },
        { club: user.club },
      ];
    } else {
      filter.coach = user._id;
    }
  } else if (user.role === 'parent') {
    const childrenIds = user.parentProfile?.children || [];
    if (childrenIds.length === 0) return null;
    filter.players = { $in: childrenIds };
    filter.visibleToParent = true;
  } else if (user.role === 'clubAdmin') {
    if (user.club) {
      filter.club = user.club;
    }
  }

  return filter;
}

// ====== Kontrolery ======

/**
 * GET /api/activities?club=X&player=X&type=X&month=YYYY-MM&group=X
 * Lista aktywności z filtrami
 */
export const getActivities = async (req, res, next) => {
  try {
    const accessFilter = await buildAccessFilter(req.user);
    if (accessFilter === null) {
      return res.json({ activities: [] });
    }

    const filter = { ...accessFilter };

    if (req.query.club) {
      filter.club = req.query.club;
    }
    if (req.query.player) {
      filter.players = req.query.player;
    }
    if (req.query.type) {
      filter.type = req.query.type;
    }
    if (req.query.group) {
      filter.group = req.query.group;
    }

    // Filtr po miesiącu (format: YYYY-MM)
    if (req.query.month) {
      const [year, mon] = req.query.month.split('-').map(Number);
      const startDate = new Date(year, mon - 1, 1);
      const endDate = new Date(year, mon, 0, 23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const activities = await Activity.find(filter)
      .populate('players', 'firstName lastName')
      .populate('coach', 'firstName lastName')
      .populate('group', 'name')
      .populate('createdBy', 'firstName lastName')
      .sort({ date: -1 });

    res.json({ activities });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/activities
 * Utwórz aktywność (coach, clubAdmin, parent)
 */
export const createActivity = async (req, res, next) => {
  try {
    const data = createActivitySchema.parse(req.body);

    const activityData = {
      ...data,
      date: new Date(data.date),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      createdBy: req.user._id,
    };

    // Jeśli coach i nie podano coach, ustaw siebie
    if (req.user.role === 'coach' && !data.coach) {
      activityData.coach = req.user._id;
    }

    // Jeśli nie podano klubu, użyj klubu użytkownika
    if (!data.club && req.user.club) {
      activityData.club = req.user.club;
    }

    const activity = await Activity.create(activityData);

    // Generate recurring instances if requested
    const recurrenceType = data.recurrence?.type || 'none';

    if (recurrenceType !== 'none') {
      const seriesId = activity._id.toString();

      // Mark the original as the parent
      activity.recurrence = {
        type: recurrenceType,
        seriesId,
        parentActivityId: activity._id,
      };
      await activity.save();

      // Generate future occurrences (12 weeks for weekly/biweekly, 6 months for monthly)
      const baseDate = new Date(data.date);
      const count = recurrenceType === 'monthly' ? 5 : (recurrenceType === 'biweekly' ? 5 : 11);

      const recurring = [];
      for (let i = 1; i <= count; i++) {
        const newDate = new Date(baseDate);
        if (recurrenceType === 'weekly') {
          newDate.setDate(newDate.getDate() + (i * 7));
        } else if (recurrenceType === 'biweekly') {
          newDate.setDate(newDate.getDate() + (i * 14));
        } else if (recurrenceType === 'monthly') {
          newDate.setMonth(newDate.getMonth() + i);
        }

        recurring.push({
          ...activityData,
          date: newDate,
          recurrence: {
            type: recurrenceType,
            seriesId,
            parentActivityId: activity._id,
          },
        });
      }

      if (recurring.length > 0) {
        await Activity.insertMany(recurring);
      }
    }

    const populatedActivity = await Activity.findById(activity._id)
      .populate('players', 'firstName lastName')
      .populate('coach', 'firstName lastName')
      .populate('group', 'name')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({
      message: 'Aktywność została dodana',
      activity: populatedActivity,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/activities/:id
 * Szczegóły aktywności
 */
export const getActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('players', 'firstName lastName')
      .populate('coach', 'firstName lastName')
      .populate('group', 'name')
      .populate('createdBy', 'firstName lastName')
      .populate('attendance.player', 'firstName lastName');

    if (!activity) {
      return res.status(404).json({ message: 'Aktywność nie znaleziona' });
    }

    // Kontrola dostępu rodzica
    if (req.user.role === 'parent') {
      const childrenIds = (req.user.parentProfile?.children || []).map((c) => c.toString());
      const hasChild = activity.players.some((p) => childrenIds.includes(p._id.toString()));
      if (!hasChild || !activity.visibleToParent) {
        return res.status(403).json({ message: 'Brak dostępu do tej aktywności' });
      }
    }

    res.json({ activity });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/activities/:id
 * Aktualizuj aktywność (coach, clubAdmin)
 */
export const updateActivity = async (req, res, next) => {
  try {
    const data = updateActivitySchema.parse(req.body);

    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({ message: 'Aktywność nie znaleziona' });
    }

    const fields = [
      'type', 'title', 'description', 'startTime', 'endTime',
      'durationMinutes', 'players', 'coach', 'group', 'location',
      'surface', 'status', 'focusAreas', 'notes', 'parentNotes',
      'tournamentData', 'visibleToParent', 'tags',
    ];

    for (const field of fields) {
      if (data[field] !== undefined) {
        activity[field] = data[field];
      }
    }

    if (data.date !== undefined) activity.date = new Date(data.date);
    if (data.endDate !== undefined) activity.endDate = data.endDate ? new Date(data.endDate) : null;

    await activity.save();

    const updatedActivity = await Activity.findById(activity._id)
      .populate('players', 'firstName lastName')
      .populate('coach', 'firstName lastName')
      .populate('group', 'name')
      .populate('createdBy', 'firstName lastName');

    res.json({
      message: 'Aktywność została zaktualizowana',
      activity: updatedActivity,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/activities/:id/attendance
 * Aktualizuj frekwencję
 */
export const updateAttendance = async (req, res, next) => {
  try {
    const data = attendanceSchema.parse(req.body);

    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({ message: 'Aktywność nie znaleziona' });
    }

    activity.attendance = data.attendance;
    await activity.save();

    const updatedActivity = await Activity.findById(activity._id)
      .populate('attendance.player', 'firstName lastName');

    res.json({
      message: 'Frekwencja została zaktualizowana',
      attendance: updatedActivity.attendance,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/activities/:id
 * Usuń aktywność
 */
export const deleteActivity = async (req, res, next) => {
  try {
    const query = { _id: req.params.id };

    // Coach może usuwać swoje, clubAdmin może usuwać z klubu
    if (req.user.role === 'coach') {
      query.coach = req.user._id;
    } else if (req.user.role === 'parent') {
      query.createdBy = req.user._id;
    } else if (req.user.role === 'clubAdmin' && req.user.club) {
      query.club = req.user.club;
    }

    const activity = await Activity.findOneAndDelete(query);

    if (!activity) {
      return res.status(404).json({ message: 'Aktywność nie znaleziona' });
    }

    res.json({ message: 'Aktywność została usunięta' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/activities/calendar?player=X&month=YYYY-MM
 * Dane sformatowane dla kalendarza
 */
export const getCalendar = async (req, res, next) => {
  try {
    const { player, month } = req.query;

    if (!month) {
      return res.status(400).json({ message: 'Parametr month jest wymagany (format: YYYY-MM)' });
    }

    const [year, mon] = month.split('-').map(Number);
    const startDate = new Date(year, mon - 1, 1);
    const endDate = new Date(year, mon, 0, 23, 59, 59, 999);

    const accessFilter = await buildAccessFilter(req.user);
    if (accessFilter === null) {
      return res.json({ days: [] });
    }

    const filter = {
      ...accessFilter,
      date: { $gte: startDate, $lte: endDate },
    };

    if (player) {
      filter.players = player;
    }

    const activities = await Activity.find(filter)
      .populate('players', 'firstName lastName')
      .populate('coach', 'firstName lastName')
      .populate('group', 'name')
      .sort({ date: 1, startTime: 1 });

    // Grupuj po dniu
    const dayMap = {};
    for (const activity of activities) {
      const dayKey = activity.date.toISOString().split('T')[0];
      if (!dayMap[dayKey]) {
        dayMap[dayKey] = [];
      }
      dayMap[dayKey].push(activity);
    }

    const days = Object.entries(dayMap).map(([date, items]) => ({
      date,
      activities: items,
    }));

    res.json({ days });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/activities/upcoming?player=X&limit=5
 * Najbliższe nadchodzące aktywności
 */
export const getUpcoming = async (req, res, next) => {
  try {
    const { player } = req.query;
    const limit = parseInt(req.query.limit, 10) || 5;

    const accessFilter = await buildAccessFilter(req.user);
    if (accessFilter === null) {
      return res.json({ activities: [] });
    }

    const filter = {
      ...accessFilter,
      date: { $gte: new Date() },
      status: { $in: ['planned', 'in-progress'] },
    };

    if (player) {
      filter.players = player;
    }

    const activities = await Activity.find(filter)
      .populate('players', 'firstName lastName')
      .populate('coach', 'firstName lastName')
      .populate('group', 'name')
      .sort({ date: 1 })
      .limit(limit);

    res.json({ activities });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/activities/:id/cancel
 * Odwołaj aktywność (nie usuwaj — oznacz jako cancelled)
 */
export const cancelActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({ message: 'Aktywność nie znaleziona' });
    }

    const reason = req.body.reason || '';

    activity.status = 'cancelled';
    activity.cancelledAt = new Date();
    activity.cancelReason = reason;
    await activity.save();

    const updated = await Activity.findById(activity._id)
      .populate('players', 'firstName lastName')
      .populate('coach', 'firstName lastName')
      .populate('group', 'name');

    res.json({
      message: 'Aktywność została odwołana',
      activity: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/activities/:id/restore
 * Przywróć odwołaną aktywność
 */
export const restoreActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({ message: 'Aktywność nie znaleziona' });
    }

    activity.status = 'planned';
    activity.cancelledAt = undefined;
    activity.cancelReason = undefined;
    await activity.save();

    const updated = await Activity.findById(activity._id)
      .populate('players', 'firstName lastName')
      .populate('coach', 'firstName lastName')
      .populate('group', 'name');

    res.json({
      message: 'Aktywność została przywrócona',
      activity: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/activities/series/:seriesId
 * Usuń wszystkie aktywności z serii (recurrence)
 */
export const deleteActivitySeries = async (req, res, next) => {
  try {
    const { seriesId } = req.params;

    const query = { 'recurrence.seriesId': seriesId };

    if (req.user.role === 'coach') {
      query.coach = req.user._id;
    } else if (req.user.role === 'clubAdmin' && req.user.club) {
      query.club = req.user.club;
    }

    const result = await Activity.deleteMany(query);

    res.json({
      message: `Usunięto ${result.deletedCount} aktywności z serii`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};
