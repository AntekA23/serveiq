import { Router } from 'express';
import {
  getSessions,
  createSession,
  getSession,
  updateSession,
  deleteSession,
} from '../controllers/sessionController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Auth wymagane dla wszystkich
router.use(verifyToken);

// GET - coach i parent mogą przeglądać
router.get('/', getSessions);
router.get('/:id', getSession);

// POST - coach i parent mogą tworzyć sesje
router.post('/', requireRole('coach', 'parent'), createSession);
// PUT/DELETE - tylko coach
router.put('/:id', requireRole('coach'), updateSession);
router.delete('/:id', requireRole('coach'), deleteSession);

export default router;
