import { Router } from 'express';
import {
  createClub,
  getClub,
  updateClub,
  getDashboard,
  getPlayersNeedingAttention,
  getFacility,
  updateFacility,
  getInviteCode,
  joinClub,
  leaveClub,
  validateClubCode,
} from '../controllers/clubController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Auth wymagane dla wszystkich
router.use(verifyToken);

// POST - dowolny zalogowany użytkownik może utworzyć klub
router.post('/', createClub);

// Club join flow (must be before /:id routes)
router.get('/validate-code', validateClubCode);
router.post('/join', joinClub);
router.post('/leave', leaveClub);

// GET - szczegóły klubu (użytkownik musi należeć do klubu)
router.get('/:id', getClub);

// PUT - aktualizacja (clubAdmin lub owner)
router.put('/:id', requireRole('clubAdmin', 'coach'), updateClub);

// GET - dashboard (clubAdmin)
router.get('/:id/dashboard', requireRole('clubAdmin'), getDashboard);

// GET - players needing attention (clubAdmin)
router.get('/:id/attention', requireRole('clubAdmin'), getPlayersNeedingAttention);

// GET/PUT - facility infrastructure (clubAdmin)
router.get('/:id/facility', getFacility);
router.put('/:id/facility', requireRole('clubAdmin'), updateFacility);

// GET - invite code (clubAdmin)
router.get('/:id/invite-code', requireRole('clubAdmin'), getInviteCode);

export default router;
