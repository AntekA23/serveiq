import { Router } from 'express';
import {
  getReviews,
  createReview,
  getReview,
  updateReview,
  prefillReview,
} from '../controllers/reviewController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Auth wymagane dla wszystkich
router.use(verifyToken);

// GET - lista przeglądów (filtrowana wg roli)
router.get('/', getReviews);

// GET - prefill musi być PRZED /:id
router.get('/:id/prefill', requireRole('coach', 'clubAdmin'), prefillReview);

// GET - szczegóły przeglądu
router.get('/:id', getReview);

// POST - utwórz przegląd (coach)
router.post('/', requireRole('coach'), createReview);

// PUT - aktualizuj/opublikuj przegląd (coach, clubAdmin)
router.put('/:id', requireRole('coach', 'clubAdmin'), updateReview);

export default router;
