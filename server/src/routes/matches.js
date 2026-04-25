import { Router } from 'express';
import {
  getMatches,
  getH2H,
  getMatch,
  createMatch,
  updateMatch,
  deleteMatch,
} from '../controllers/matchController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(verifyToken);

router.get('/h2h', getH2H);
router.get('/', getMatches);
router.get('/:id', getMatch);
router.post('/', requireRole('coach', 'clubAdmin'), createMatch);
router.put('/:id', requireRole('coach', 'clubAdmin'), updateMatch);
router.delete('/:id', requireRole('coach', 'clubAdmin'), deleteMatch);

export default router;
