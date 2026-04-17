import Player from '../models/Player.js';
import PlayerBadge from '../models/PlayerBadge.js';
import Notification from '../models/Notification.js';
import { getBadgeStatus, evaluateBadges, BADGE_DEFINITIONS } from '../services/badgeEngine.js';

/**
 * GET /api/badges/:playerId
 * Zwraca pełną listę odznak zawodnika ze statusem (zdobyta / niezdobyta + postęp).
 */
export const getPlayerBadges = async (req, res, next) => {
  try {
    const { playerId } = req.params;
    const { role, _id: userId } = req.user;

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

/**
 * POST /api/badges/:playerId/award
 * Trener przyznaje ręczną odznakę zawodnikowi.
 * Body: { badgeSlug: string, note?: string }
 */
export const awardManualBadge = async (req, res, next) => {
  try {
    const { playerId } = req.params;
    const { role, _id: userId } = req.user;
    const { badgeSlug, note } = req.body;

    if (role !== 'coach' && role !== 'clubAdmin' && role !== 'admin') {
      return res.status(403).json({ message: 'Tylko trener może przyznawać odznaki' });
    }

    // Sprawdź czy badge jest manual
    const def = BADGE_DEFINITIONS.find(d => d.slug === badgeSlug);
    if (!def || !def.isManual) {
      return res.status(400).json({ message: 'Nieprawidłowa odznaka — tylko odznaki ręczne mogą być przyznawane' });
    }

    // Sprawdź dostęp trenera do gracza
    const player = await Player.findOne({
      _id: playerId,
      $or: [{ coach: userId }, { coaches: userId }],
      active: true,
    }).select('parents').lean();

    if (!player) {
      return res.status(404).json({ message: 'Zawodnik nie znaleziony' });
    }

    // Utwórz odznakę
    try {
      await PlayerBadge.create({
        player: playerId,
        badgeSlug,
        type: 'manual',
        awardedBy: userId,
        awardedNote: note || undefined,
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ message: 'Zawodnik ma już tę odznakę' });
      }
      throw err;
    }

    // Powiadom rodziców
    const parentIds = (player.parents || []).map(String);
    for (const parentId of parentIds) {
      try {
        await Notification.create({
          user: parentId,
          type: 'system',
          title: `Nowa odznaka: ${def.name}`,
          body: note || def.description,
          severity: 'info',
          player: playerId,
          actionUrl: `/parent/child/${playerId}/badges`,
        });
      } catch (_) { /* ignore */ }
    }

    const badges = await getBadgeStatus(playerId);
    res.status(201).json({ message: `Odznaka "${def.name}" została przyznana`, badges });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/badges/:playerId/:badgeSlug
 * Trener cofa ręczną odznakę. Automatycznych nie można cofnąć.
 */
export const revokeManualBadge = async (req, res, next) => {
  try {
    const { playerId, badgeSlug } = req.params;
    const { role, _id: userId } = req.user;

    if (role !== 'coach' && role !== 'clubAdmin' && role !== 'admin') {
      return res.status(403).json({ message: 'Tylko trener może cofać odznaki' });
    }

    const badge = await PlayerBadge.findOne({ player: playerId, badgeSlug });
    if (!badge) {
      return res.status(404).json({ message: 'Odznaka nie znaleziona' });
    }

    if (badge.type !== 'manual') {
      return res.status(400).json({ message: 'Nie można cofnąć automatycznej odznaki' });
    }

    await PlayerBadge.deleteOne({ _id: badge._id });

    const badges = await getBadgeStatus(playerId);
    res.json({ message: 'Odznaka została cofnięta', badges });
  } catch (error) {
    next(error);
  }
};
