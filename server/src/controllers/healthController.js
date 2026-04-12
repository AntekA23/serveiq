import Player from '../models/Player.js';
import Session from '../models/Session.js';
import Tournament from '../models/Tournament.js';

// ====== Helpers ======

async function verifyAccess(user, playerId) {
  if (user.role === 'coach') {
    return Player.findOne({ _id: playerId, coach: user._id, active: true });
  }
  return Player.findOne({ _id: playerId, parents: user._id, active: true });
}

// ====== Kontrolery ======

/**
 * GET /api/players/:id/timeline?limit=50
 * Agreguje wydarzenia z sesji, celow i turniejow
 */
export const getTimeline = async (req, res, next) => {
  try {
    const { id: playerId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const player = await verifyAccess(req.user, playerId);
    if (!player) {
      return res.status(403).json({ message: 'Brak dostepu do tego zawodnika' });
    }

    const events = [];

    // 1. Sesje z aktualizacjami umiejetnosci
    const sessions = await Session.find({
      player: playerId,
      visibleToParent: true,
    })
      .sort({ date: -1 })
      .limit(30);

    const typeLabels = {
      kort: 'Kort', sparing: 'Sparing', kondycja: 'Kondycja',
      rozciaganie: 'Rozciaganie', mecz: 'Mecz', inne: 'Trening',
    };

    sessions.forEach((s) => {
      // Add session as training event
      events.push({
        type: 'session',
        date: s.date,
        title: s.title || typeLabels[s.sessionType] || 'Trening',
        description: [
          typeLabels[s.sessionType],
          s.durationMinutes ? `${s.durationMinutes}min` : null,
          s.notes,
        ].filter(Boolean).join(' · '),
        sessionType: s.sessionType,
      });

    });

    // 2. Cele ukonczone
    if (player.goals) {
      player.goals
        .filter((g) => g.completed && g.completedAt)
        .forEach((g) => {
          events.push({
            type: 'goal_completed',
            date: g.completedAt,
            title: 'Cel osiagniety',
            description: g.text,
          });
        });
    }

    // 3. Turnieje
    const tournaments = await Tournament.find({ player: playerId })
      .sort({ startDate: -1 })
      .limit(10);

    tournaments.forEach((t) => {
      const result = t.result ? ` - ${t.result.round}` : '';
      events.push({
        type: 'tournament',
        date: t.startDate,
        title: `${t.name}${result}`,
        description: t.location || '',
      });
    });

    // Sortuj po dacie malejaco i ogranicz
    events.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ events: events.slice(0, limit) });
  } catch (error) {
    next(error);
  }
};
