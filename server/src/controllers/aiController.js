import {
  generateRecommendations,
  generateReviewDraft,
} from '../services/aiCoachingService.js';
import Player from '../models/Player.js';

/**
 * POST /api/ai/recommendations/:playerId
 * Generuje rekomendacje treningowe AI
 */
export const getRecommendations = async (req, res, next) => {
  try {
    const { playerId } = req.params;

    // Verify access
    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Zawodnik nie znaleziony' });
    }

    if (req.user.role === 'coach' && String(player.coach) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Brak dostepu' });
    }

    if (req.user.role === 'parent') {
      const childrenIds = (req.user.parentProfile?.children || []).map(String);
      if (!childrenIds.includes(String(playerId))) {
        return res.status(403).json({ message: 'Brak dostepu' });
      }
    }

    const result = await generateRecommendations(playerId);

    res.json({ result });
  } catch (error) {
    if (error.message === 'CLAUDE_API_KEY nie ustawiony') {
      return res.status(503).json({ message: 'Usluga AI niedostepna — brak klucza API' });
    }
    next(error);
  }
};

/**
 * POST /api/ai/review-draft/:playerId
 * Generuje szkic oceny okresowej
 */
export const getReviewDraft = async (req, res, next) => {
  try {
    const { playerId } = req.params;
    const { periodStart, periodEnd } = req.body;

    if (!periodStart || !periodEnd) {
      return res.status(400).json({ message: 'Podaj periodStart i periodEnd' });
    }

    // Only coaches can generate review drafts
    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Zawodnik nie znaleziony' });
    }

    if (String(player.coach) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Brak dostepu' });
    }

    const result = await generateReviewDraft(playerId, periodStart, periodEnd);

    res.json({ result });
  } catch (error) {
    if (error.message === 'CLAUDE_API_KEY nie ustawiony') {
      return res.status(503).json({ message: 'Usluga AI niedostepna — brak klucza API' });
    }
    next(error);
  }
};
