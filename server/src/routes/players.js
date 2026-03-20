import { Router } from 'express';
import {
  getPlayers,
  createPlayer,
  getPlayer,
  updatePlayer,
  deletePlayer,
  addGoal,
  updateGoal,
} from '../controllers/playerController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Wszystkie endpointy wymagają auth + rola coach
router.use(verifyToken, requireRole('coach'));

router.get('/', getPlayers);
router.post('/', createPlayer);
router.get('/:id', getPlayer);
router.put('/:id', updatePlayer);
router.delete('/:id', deletePlayer);

// Cele zawodnika
router.post('/:id/goals', addGoal);
router.put('/:id/goals/:goalId', updateGoal);

export default router;
