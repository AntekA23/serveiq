import { Router } from 'express';
import {
  createClub,
  getClub,
  updateClub,
  getDashboard,
  getPlayersNeedingAttention,
} from '../controllers/clubController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Auth wymagane dla wszystkich
router.use(verifyToken);

// POST - dowolny zalogowany użytkownik może utworzyć klub
router.post('/', createClub);

// GET - szczegóły klubu (użytkownik musi należeć do klubu)
router.get('/:id', getClub);

// PUT - aktualizacja (clubAdmin lub owner)
router.put('/:id', requireRole('clubAdmin', 'coach'), updateClub);

// GET - dashboard (clubAdmin)
router.get('/:id/dashboard', requireRole('clubAdmin'), getDashboard);

// GET - players needing attention (clubAdmin)
router.get('/:id/attention', requireRole('clubAdmin'), getPlayersNeedingAttention);

export default router;
