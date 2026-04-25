import { Router } from 'express';
import {
  getAchievements,
  getAchievement,
  createAchievement,
  updateAchievement,
  deleteAchievement,
} from '../controllers/achievementController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(verifyToken);

router.get('/', getAchievements);
router.get('/:id', getAchievement);
router.post('/', requireRole('coach', 'clubAdmin'), createAchievement);
router.put('/:id', requireRole('coach', 'clubAdmin'), updateAchievement);
router.delete('/:id', requireRole('coach', 'clubAdmin'), deleteAchievement);

export default router;
