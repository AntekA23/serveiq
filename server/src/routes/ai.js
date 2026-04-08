import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { getRecommendations, getReviewDraft } from '../controllers/aiController.js';

const router = Router();

router.use(verifyToken);

router.post('/recommendations/:playerId', getRecommendations);
router.post('/review-draft/:playerId', requireRole('coach', 'clubAdmin'), getReviewDraft);

export default router;
