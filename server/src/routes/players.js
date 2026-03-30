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
  updateTrainingPlan,
  addMilestone,
  updateMilestone,
  deleteMilestone,
  getSkillHistory,
  searchCoaches,
  requestCoach,
  getCoachRequests,
  respondCoachRequest,
} from '../controllers/playerController.js';
import { getTimeline } from '../controllers/healthController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Endpointy dla rodzica (muszą być PRZED router.use z requireRole('coach'))
router.post('/self', verifyToken, requireRole('parent'), createPlayerSelf);
router.put('/:id/avatar', verifyToken, uploadMiddleware, uploadAvatar);
router.get('/:id/timeline', verifyToken, getTimeline);
router.get('/:id/skill-history', verifyToken, getSkillHistory);

// Plan treningowy (trener lub rodzic)
router.put('/:id/training-plan', verifyToken, requireRole('coach', 'parent'), updateTrainingPlan);
router.post('/:id/milestones', verifyToken, requireRole('coach', 'parent'), addMilestone);
router.put('/:id/milestones/:mid', verifyToken, requireRole('coach', 'parent'), updateMilestone);
router.delete('/:id/milestones/:mid', verifyToken, requireRole('coach', 'parent'), deleteMilestone);

// Coach join requests
router.get('/coaches/search', verifyToken, requireRole('parent'), searchCoaches);
router.get('/coach-requests', verifyToken, requireRole('coach'), getCoachRequests);
router.post('/:id/request-coach', verifyToken, requireRole('parent'), requestCoach);
router.put('/:id/coach-request', verifyToken, requireRole('coach'), respondCoachRequest);

// Endpointy dostępne dla trenera i rodzica (dane filtrowane wg roli)
router.get('/', verifyToken, requireRole('coach', 'parent'), getPlayers);
router.get('/:id', verifyToken, requireRole('coach', 'parent'), getPlayer);

// Endpointy tylko dla trenera
router.post('/', verifyToken, requireRole('coach'), createPlayer);
router.put('/:id', verifyToken, requireRole('coach'), updatePlayer);
router.delete('/:id', verifyToken, requireRole('coach'), deletePlayer);

// Cele zawodnika
router.post('/:id/goals', verifyToken, requireRole('coach'), addGoal);
router.put('/:id/goals/:goalId', verifyToken, requireRole('coach'), updateGoal);

export default router;
