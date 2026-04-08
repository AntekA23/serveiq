import Player from '../models/Player.js';
import { getBadgeStatus, evaluateBadges } from '../services/badgeEngine.js';

/**
 * GET /api/badges/:playerId
 * Zwraca pełną listę odznak zawodnika ze statusem (zdobyta / niezdobyta + postęp).
 * Dostęp: rodzic zawodnika, trener zawodnika, clubAdmin.
 */
export const getPlayerBadges = async (req, res, next) => {
  try {
    const { playerId } = req.params;
    const { role, _id: userId } = req.user;

    // Weryfikacja dostępu
    if (role === 'parent') {
      const childrenIds = (req.user.parentProfile?.children || []).map(String);
      if (!childrenIds.includes(playerId)) {
        return res.status(403).json({ message: 'Brak dostępu do tego zawodnika' });
      }
    } else if (role === 'coach') {
      const player = await Player.findOne({ _id: playerId, coach: userId }).lean();
      if (!player) {
        return res.status(403).json({ message: 'Brak dostępu do tego zawodnika' });
      }
    } else if (role !== 'clubAdmin' && role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    const badges = await getBadgeStatus(playerId);
    res.json({ badges });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/badges/:playerId/evaluate
 * Ręcznie uruchamia ewaluację odznak dla zawodnika.
 * Dostęp: rodzic zawodnika, trener zawodnika.
 */
export const evaluatePlayerBadges = async (req, res, next) => {
  try {
    const { playerId } = req.params;
    const { role, _id: userId } = req.user;

    let parentIds = [];

    if (role === 'parent') {
      const childrenIds = (req.user.parentProfile?.children || []).map(String);
      if (!childrenIds.includes(playerId)) {
        return res.status(403).json({ message: 'Brak dostępu do tego zawodnika' });
      }
      parentIds = [String(userId)];
    } else if (role === 'coach') {
      const player = await Player.findOne({ _id: playerId, coach: userId }).select('parents').lean();
      if (!player) {
        return res.status(403).json({ message: 'Brak dostępu do tego zawodnika' });
      }
      parentIds = (player.parents || []).map(String);
    } else if (role !== 'clubAdmin' && role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    await evaluateBadges(playerId, parentIds);

    const badges = await getBadgeStatus(playerId);
    res.json({ message: 'Odznaki zaktualizowane', badges });
  } catch (error) {
    next(error);
  }
};
