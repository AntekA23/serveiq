import {
  generateRecommendations,
  generateReviewDraft,
  generateIdolFacts,
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

/**
 * POST /api/ai/idol-facts/:playerId
 * Generuje ciekawostki o ulubionym tenisiście dziecka (trener/clubAdmin)
 */
export const generatePlayerIdolFacts = async (req, res, next) => {
  try {
    const { playerId } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Podaj imię i nazwisko tenisisty' });
    }

    // Weryfikacja — trener tego zawodnika
    const player = await Player.findOne({
      _id: playerId,
      $or: [{ coach: req.user._id }, { coaches: req.user._id }],
      active: true,
    });
    if (!player) {
      return res.status(404).json({ message: 'Zawodnik nie znaleziony' });
    }

    const facts = await generateIdolFacts(name.trim());

    player.idol = {
      name: name.trim(),
      facts,
      generatedAt: new Date(),
    };
    await player.save();

    res.json({ idol: player.idol });
  } catch (error) {
    if (error.message === 'CLAUDE_API_KEY nie ustawiony') {
      return res.status(503).json({ message: 'Usługa AI niedostępna — brak klucza API' });
    }
    next(error);
  }
};
