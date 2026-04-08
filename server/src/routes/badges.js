import { Router } from 'express';
import { getPlayerBadges, evaluatePlayerBadges } from '../controllers/badgeController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.use(verifyToken);

router.get('/:playerId', getPlayerBadges);
router.post('/:playerId/evaluate', evaluatePlayerBadges);

export default router;
