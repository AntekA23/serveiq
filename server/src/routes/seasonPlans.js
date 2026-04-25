import { Router } from 'express';
import {
  getSeasonPlans,
  getSeasonPlan,
  createSeasonPlan,
  updateSeasonPlan,
  deleteSeasonPlan,
} from '../controllers/seasonPlanController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(verifyToken);

router.get('/', getSeasonPlans);
router.get('/:id', getSeasonPlan);
router.post('/', requireRole('coach', 'clubAdmin'), createSeasonPlan);
router.put('/:id', requireRole('coach', 'clubAdmin'), updateSeasonPlan);
router.delete('/:id', requireRole('coach', 'clubAdmin'), deleteSeasonPlan);

export default router;
