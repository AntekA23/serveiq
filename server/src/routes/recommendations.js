import { Router } from 'express';
import {
  getRecommendations,
  createRecommendation,
  updateRecommendation,
} from '../controllers/recommendationController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Auth wymagane dla wszystkich
router.use(verifyToken);

// GET - lista rekomendacji (filtrowana wg roli)
router.get('/', getRecommendations);

// POST - utwórz rekomendację (coach, clubAdmin)
router.post('/', requireRole('coach', 'clubAdmin'), createRecommendation);

// PUT - aktualizuj status (coach, clubAdmin)
router.put('/:id', requireRole('coach', 'clubAdmin'), updateRecommendation);

export default router;
