import DevelopmentProgram from '../models/DevelopmentProgram.js';
import Player from '../models/Player.js';
import Notification from '../models/Notification.js';

// Helper: calculate player age in years
function getPlayerAge(dateOfBirth) {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// Helper: find suggested stage for player age + gender
function findStageForPlayer(stages, age, gender) {
  const key = gender === 'F' ? 'girls' : 'boys';
  for (let i = stages.length - 1; i >= 0; i--) {
    const range = stages[i].ageRange[key];
    if (age >= range.min && age <= range.max) {
      return stages[i];
    }
  }
  // If age is above all ranges, return last stage
  if (age > stages[stages.length - 1].ageRange[key].max) {
    return stages[stages.length - 1];
  }
  // If age is below all ranges, return first stage
  return stages[0];
}

// Helper: map session types to categories and sum hours
const SESSION_TO_CATEGORY = {
  kort: 'onCourt',
  sparing: 'onCourt',
  mecz: 'competition',
  kondycja: 'physical',
  rozciaganie: 'physical',
  inne: 'other',
};

function calculateActualHours(weeklySchedule) {
  const totals = { onCourt: 0, physical: 0, competition: 0, other: 0 };
  for (const session of weeklySchedule) {
    const category = SESSION_TO_CATEGORY[session.sessionType] || 'other';
    const hours = (session.durationMinutes || 0) / 60;
    totals[category] += hours;
    // mecz also counts as onCourt
    if (session.sessionType === 'mecz') {
      totals.onCourt += hours;
    }
  }
  // Round to 1 decimal
  for (const key of Object.keys(totals)) {
    totals[key] = Math.round(totals[key] * 10) / 10;
  }
  totals.total = Math.round((totals.onCourt + totals.physical + totals.competition + totals.other) * 10) / 10;
  return totals;
}

function compareValue(actual, min, max) {
  if (actual < min) return 'under';
  if (actual > max) return 'over';
  return 'on_target';
}

// GET /api/development-programs
export const listPrograms = async (req, res, next) => {
  try {
    const programs = await DevelopmentProgram.find({}, {
      federationCode: 1,
      federationName: 1,
      fullName: 1,
      country: 1,
      countryFlag: 1,
      description: 1,
      'stages.code': 1,
      'stages.name': 1,
      'stages.namePl': 1,
    }).sort({ federationCode: 1 });

    res.json(programs);
  } catch (error) {
    next(error);
  }
};

// GET /api/development-programs/:code
export const getProgram = async (req, res, next) => {
  try {
    const program = await DevelopmentProgram.findOne({
      federationCode: req.params.code.toLowerCase(),
    });

    if (!program) {
      return res.status(404).json({ message: 'Program nie znaleziony' });
    }

    res.json(program);
  } catch (error) {
    next(error);
  }
};

// GET /api/development-programs/:code/stage-for-player/:playerId
export const getStageForPlayer = async (req, res, next) => {
  try {
    const program = await DevelopmentProgram.findOne({
      federationCode: req.params.code.toLowerCase(),
    });
    if (!program) {
      return res.status(404).json({ message: 'Program nie znaleziony' });
    }

    const player = await Player.findById(req.params.playerId);
    if (!player) {
      return res.status(404).json({ message: 'Zawodnik nie znaleziony' });
    }

    if (!player.dateOfBirth || !player.gender) {
      return res.status(400).json({
        message: 'Zawodnik musi miec ustawiona date urodzenia i plec',
      });
    }

    const age = getPlayerAge(player.dateOfBirth);
    const stage = findStageForPlayer(program.stages, age, player.gender);

    res.json({
      playerAge: age,
      playerGender: player.gender,
      suggestedStage: stage,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/players/:id/federation-program
export const setFederationProgram = async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ message: 'Zawodnik nie znaleziony' });
    }

    // Only coach can set program
    if (req.user.role !== 'coach' && req.user.role !== 'clubAdmin') {
      return res.status(403).json({ message: 'Tylko trener moze ustawic program rozwoju' });
    }

    const { federationCode, notes } = req.body;
    if (!federationCode) {
      return res.status(400).json({ message: 'Kod federacji jest wymagany' });
    }

    const program = await DevelopmentProgram.findOne({ federationCode: federationCode.toLowerCase() });
    if (!program) {
      return res.status(404).json({ message: 'Program nie znaleziony' });
    }

    // Auto-suggest stage
    let suggestedStageCode = null;
    if (player.dateOfBirth && player.gender) {
      const age = getPlayerAge(player.dateOfBirth);
      const stage = findStageForPlayer(program.stages, age, player.gender);
      suggestedStageCode = stage.code;
    }

    player.federationProgram = {
      program: program._id,
      currentStageCode: suggestedStageCode,
      stageConfirmedAt: new Date(),
      stageConfirmedBy: req.user._id,
      autoSuggestedStage: suggestedStageCode,
      notes: notes || null,
    };
    player.markModified('federationProgram');
    await player.save();

    res.json({
      message: 'Program rozwoju przypisany',
      federationProgram: player.federationProgram,
      program: { federationCode: program.federationCode, federationName: program.federationName, countryFlag: program.countryFlag },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/players/:id/federation-program/confirm-stage
export const confirmStage = async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ message: 'Zawodnik nie znaleziony' });
    }

    if (req.user.role !== 'coach' && req.user.role !== 'clubAdmin') {
      return res.status(403).json({ message: 'Tylko trener moze zatwierdzic etap' });
    }

    if (!player.federationProgram?.program) {
      return res.status(400).json({ message: 'Gracz nie ma przypisanego programu' });
    }

    const { stageCode } = req.body;
    if (!stageCode) {
      return res.status(400).json({ message: 'Kod etapu jest wymagany' });
    }

    player.federationProgram.currentStageCode = stageCode;
    player.federationProgram.stageConfirmedAt = new Date();
    player.federationProgram.stageConfirmedBy = req.user._id;
    player.markModified('federationProgram');
    await player.save();

    res.json({
      message: 'Etap zatwierdzony',
      federationProgram: player.federationProgram,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/players/:id/federation-program/comparison
export const getComparison = async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.id).populate('federationProgram.program');
    if (!player) {
      return res.status(404).json({ message: 'Zawodnik nie znaleziony' });
    }

    if (!player.federationProgram?.program) {
      return res.status(400).json({ message: 'Gracz nie ma przypisanego programu' });
    }

    const program = player.federationProgram.program;
    const currentStageCode = player.federationProgram.currentStageCode;
    const stage = program.stages.find(s => s.code === currentStageCode);

    if (!stage) {
      return res.status(400).json({ message: 'Etap nie znaleziony w programie' });
    }

    // Calculate actual hours from weekly schedule
    const schedule = player.trainingPlan?.weeklySchedule || [];
    const actual = calculateActualHours(schedule);

    const rec = stage.recommendations;
    const comparison = {
      total: compareValue(actual.total, rec.totalHoursPerWeek.min, rec.totalHoursPerWeek.max),
      onCourt: compareValue(actual.onCourt, rec.onCourtHours.min, rec.onCourtHours.max),
      physical: compareValue(actual.physical, rec.physicalHours.min, rec.physicalHours.max),
      competition: compareValue(actual.competition, rec.competitionHours.min, rec.competitionHours.max),
    };

    // Generate suggestions
    const suggestions = [];
    if (stage.multiSportRecommended) {
      suggestions.push('Wielosportowosc jest zalecana na tym etapie');
    }
    if (rec.restDaysPerWeek >= 2) {
      suggestions.push(`Minimum ${rec.restDaysPerWeek} dni odpoczynku w tygodniu`);
    } else {
      suggestions.push('Minimum 1 dzien odpoczynku w tygodniu');
    }
    if (comparison.total === 'under') {
      suggestions.push(`Aktualny plan (${actual.total}h) jest ponizej rekomendacji (${rec.totalHoursPerWeek.min}-${rec.totalHoursPerWeek.max}h)`);
    }
    if (comparison.total === 'over') {
      suggestions.push(`Aktualny plan (${actual.total}h) przekracza rekomendacje (${rec.totalHoursPerWeek.min}-${rec.totalHoursPerWeek.max}h) — uwaga na przeciazenie`);
    }

    // Check for stage transition suggestion
    let suggestedStageTransition = null;
    if (player.dateOfBirth && player.gender) {
      const age = getPlayerAge(player.dateOfBirth);
      const suggested = findStageForPlayer(program.stages, age, player.gender);
      if (suggested.code !== currentStageCode) {
        suggestedStageTransition = {
          fromStage: currentStageCode,
          toStage: suggested.code,
          toStageName: suggested.namePl,
          reason: `Wiek zawodnika (${age} lat) sugeruje etap "${suggested.namePl}"`,
        };
      }
    }

    const genderKey = player.gender === 'F' ? 'girls' : 'boys';

    res.json({
      federation: {
        code: program.federationCode,
        name: program.federationName,
        flag: program.countryFlag,
      },
      stage: {
        code: stage.code,
        name: stage.name,
        namePl: stage.namePl,
        ageRange: stage.ageRange[genderKey],
        principles: stage.principles,
        focusAreas: stage.focusAreas,
        multiSportRecommended: stage.multiSportRecommended,
        trainingDistribution: stage.trainingDistribution,
      },
      recommendations: {
        totalHoursPerWeek: rec.totalHoursPerWeek,
        onCourtHours: rec.onCourtHours,
        physicalHours: rec.physicalHours,
        competitionHours: rec.competitionHours,
        restDaysPerWeek: rec.restDaysPerWeek,
      },
      actual,
      comparison,
      suggestions,
      suggestedStageTransition,
    });
  } catch (error) {
    next(error);
  }
};
