import { Router } from 'express';
import {
  getPlayers,
  createPlayer,
  getPlayer,
  updatePlayer,
  deletePlayer,
  addGoal,
  updateGoal,
  createPlayerSelf,
  uploadAvatar,
  uploadMiddleware,
} from '../controllers/playerController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Endpointy dla rodzica (muszą być PRZED router.use z requireRole('coach'))
router.post('/self', verifyToken, requireRole('parent'), createPlayerSelf);
router.put('/:id/avatar', verifyToken, uploadMiddleware, uploadAvatar);

// Endpointy wymagające auth + rola coach
router.get('/', verifyToken, requireRole('coach'), getPlayers);
router.post('/', verifyToken, requireRole('coach'), createPlayer);
router.get('/:id', verifyToken, requireRole('coach'), getPlayer);
router.put('/:id', verifyToken, requireRole('coach'), updatePlayer);
router.delete('/:id', verifyToken, requireRole('coach'), deletePlayer);

// Cele zawodnika
router.post('/:id/goals', verifyToken, requireRole('coach'), addGoal);
router.put('/:id/goals/:goalId', verifyToken, requireRole('coach'), updateGoal);

export default router;
