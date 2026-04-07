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
  getClubCoaches,
  searchCoaches,
  addCoachToClub,
  removeCoachFromClub,
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

// Coaches management (clubAdmin)
router.get('/:id/coaches', requireRole('clubAdmin'), getClubCoaches);
router.get('/:id/search-coaches', requireRole('clubAdmin'), searchCoaches);
router.post('/:id/coaches', requireRole('clubAdmin'), addCoachToClub);
router.delete('/:id/coaches/:coachId', requireRole('clubAdmin'), removeCoachFromClub);

export default router;
