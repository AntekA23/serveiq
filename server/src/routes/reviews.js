import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import {
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
} from '../controllers/reviewController.js';

const router = Router();

router.use(verifyToken);

router.get('/', getReviews);
router.get('/:id', getReview);
router.post('/', requireRole('coach'), createReview);
router.put('/:id', requireRole('coach'), updateReview);
router.delete('/:id', requireRole('coach'), deleteReview);

export default router;
