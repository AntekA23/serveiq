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
import {
  setFederationProgram,
  confirmStage,
  getComparison,
} from '../controllers/developmentProgramController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Endpointy dla rodzica (muszą być PRZED router.use z requireRole('coach'))
router.post('/self', verifyToken, requireRole('parent'), createPlayerSelf);
router.put('/:id/avatar', verifyToken, uploadMiddleware, uploadAvatar);
router.get('/:id/timeline', verifyToken, getTimeline);
router.get('/:id/skill-history', verifyToken, getSkillHistory);

// Program rozwoju federacji
router.put('/:id/federation-program', verifyToken, requireRole('coach', 'clubAdmin'), setFederationProgram);
router.put('/:id/federation-program/confirm-stage', verifyToken, requireRole('coach', 'clubAdmin'), confirmStage);
router.get('/:id/federation-program/comparison', verifyToken, getComparison);

// Plan treningowy (trener, clubAdmin lub rodzic)
router.put('/:id/training-plan', verifyToken, requireRole('coach', 'clubAdmin', 'parent'), updateTrainingPlan);
router.post('/:id/milestones', verifyToken, requireRole('coach', 'clubAdmin', 'parent'), addMilestone);
router.put('/:id/milestones/:mid', verifyToken, requireRole('coach', 'clubAdmin', 'parent'), updateMilestone);
router.delete('/:id/milestones/:mid', verifyToken, requireRole('coach', 'clubAdmin', 'parent'), deleteMilestone);

// Coach join requests
router.get('/coaches/search', verifyToken, requireRole('parent'), searchCoaches);
router.get('/coach-requests', verifyToken, requireRole('coach'), getCoachRequests);
router.post('/:id/request-coach', verifyToken, requireRole('parent'), requestCoach);
router.put('/:id/coach-request', verifyToken, requireRole('coach'), respondCoachRequest);

// Endpointy dostępne dla trenera, clubAdmin i rodzica (dane filtrowane wg roli)
router.get('/', verifyToken, requireRole('coach', 'clubAdmin', 'parent'), getPlayers);
router.get('/:id', verifyToken, requireRole('coach', 'clubAdmin', 'parent'), getPlayer);

// Endpointy dla trenera/clubAdmin (tworzenie) i trenera+clubAdmin+rodzica (edycja, usuwanie)
router.post('/', verifyToken, requireRole('coach', 'clubAdmin'), createPlayer);
router.put('/:id', verifyToken, requireRole('coach', 'clubAdmin', 'parent'), updatePlayer);
router.delete('/:id', verifyToken, requireRole('coach', 'clubAdmin', 'parent'), deletePlayer);

// Cele zawodnika
router.post('/:id/goals', verifyToken, requireRole('coach', 'clubAdmin'), addGoal);
router.put('/:id/goals/:goalId', verifyToken, requireRole('coach', 'clubAdmin'), updateGoal);

export default router;
