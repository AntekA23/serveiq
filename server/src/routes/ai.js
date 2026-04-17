import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import {
  getRecommendations,
  getReviewDraft,
  generatePlayerIdolFacts,
} from '../controllers/aiController.js';

const router = Router();

router.use(verifyToken);

router.post('/recommendations/:playerId', getRecommendations);
router.post('/review-draft/:playerId', requireRole('coach', 'clubAdmin'), getReviewDraft);
router.post('/idol-facts/:playerId', requireRole('parent'), generatePlayerIdolFacts);

export default router;
