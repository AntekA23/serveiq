import { Router } from 'express';
import {
  getPlayerBadges,
  evaluatePlayerBadges,
  awardManualBadge,
  revokeManualBadge,
} from '../controllers/badgeController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.use(verifyToken);

router.get('/:playerId', getPlayerBadges);
router.post('/:playerId/evaluate', evaluatePlayerBadges);
router.post('/:playerId/award', awardManualBadge);
router.delete('/:playerId/:badgeSlug', revokeManualBadge);

export default router;
