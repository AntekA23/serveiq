import Player from '../models/Player.js';
import DevelopmentProgram from '../models/DevelopmentProgram.js';
import Notification from '../models/Notification.js';

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

function findStageForPlayer(stages, age, gender) {
  const key = gender === 'F' ? 'girls' : 'boys';
  for (let i = stages.length - 1; i >= 0; i--) {
    const range = stages[i].ageRange[key];
    if (age >= range.min && age <= range.max) {
      return stages[i];
    }
  }
  if (age > stages[stages.length - 1].ageRange[key].max) {
    return stages[stages.length - 1];
  }
  return stages[0];
}

export async function checkStageTransitions() {
  // Run once daily (check: is it Monday at 8:00?)
  const now = new Date();
  if (now.getDay() !== 1 || now.getHours() !== 8) return;

  console.log('[StageChecker] Sprawdzanie sugestii zmian etapu...');

  try {
    const players = await Player.find({
      'federationProgram.program': { $exists: true, $ne: null },
      dateOfBirth: { $exists: true, $ne: null },
      gender: { $exists: true, $ne: null },
      active: true,
    }).populate('federationProgram.program');

    let notificationsCreated = 0;

    for (const player of players) {
      const program = player.federationProgram.program;
      if (!program || !program.stages) continue;

      const age = getPlayerAge(player.dateOfBirth);
      const suggested = findStageForPlayer(program.stages, age, player.gender);
      const currentStage = player.federationProgram.currentStageCode;

      if (suggested.code !== currentStage && suggested.code !== player.federationProgram.autoSuggestedStage) {
        // Update autoSuggestedStage
        player.federationProgram.autoSuggestedStage = suggested.code;
        player.markModified('federationProgram');
        await player.save();

        // Create notification for coach
        if (player.coach) {
          const existing = await Notification.findOne({
            user: player.coach,
            type: 'stage_transition',
            player: player._id,
            read: false,
          });

          if (!existing) {
            await Notification.create({
              user: player.coach,
              type: 'stage_transition',
              title: 'Sugestia zmiany etapu',
              body: `${player.firstName} ${player.lastName} (${age} lat) — rozwaz przejscie na etap "${suggested.namePl}" (${program.federationName}). Rekomendowane godziny: ${suggested.recommendations.totalHoursPerWeek.min}-${suggested.recommendations.totalHoursPerWeek.max}h/tyg`,
              severity: 'info',
              player: player._id,
              actionUrl: `/coach/player/${player._id}`,
              metadata: {
                fromStage: currentStage,
                toStage: suggested.code,
                federationCode: program.federationCode,
              },
            });
            notificationsCreated++;
          }
        }
      }
    }

    console.log(`[StageChecker] Zakonczono — ${notificationsCreated} nowych sugestii`);
  } catch (error) {
    console.error('[StageChecker] Blad:', error.message);
  }
}
