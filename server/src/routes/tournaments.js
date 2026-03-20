import { Router } from 'express';
import {
  getTournaments,
  createTournament,
  getTournament,
  updateTournament,
  deleteTournament,
} from '../controllers/tournamentController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Auth wymagane dla wszystkich
router.use(verifyToken);

// GET - coach i parent mogą przeglądać
router.get('/', getTournaments);
router.get('/:id', getTournament);

// POST/PUT/DELETE - tylko coach
router.post('/', requireRole('coach'), createTournament);
router.put('/:id', requireRole('coach'), updateTournament);
router.delete('/:id', requireRole('coach'), deleteTournament);

export default router;
