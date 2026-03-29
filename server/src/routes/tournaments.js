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

// POST/PUT/DELETE - coach i parent
router.post('/', requireRole('coach', 'parent'), createTournament);
router.put('/:id', requireRole('coach', 'parent'), updateTournament);
router.delete('/:id', requireRole('coach', 'parent'), deleteTournament);

export default router;
