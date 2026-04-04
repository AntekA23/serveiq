import { Router } from 'express';
import {
  getGroups,
  createGroup,
  getGroup,
  updateGroup,
  deleteGroup,
} from '../controllers/groupController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Auth wymagane dla wszystkich
router.use(verifyToken);

// GET - lista grup
router.get('/', getGroups);
router.get('/:id', getGroup);

// POST - utwórz grupę (coach, clubAdmin)
router.post('/', requireRole('coach', 'clubAdmin'), createGroup);

// PUT - aktualizuj grupę (coach, clubAdmin)
router.put('/:id', requireRole('coach', 'clubAdmin'), updateGroup);

// DELETE - soft delete (coach, clubAdmin)
router.delete('/:id', requireRole('coach', 'clubAdmin'), deleteGroup);

export default router;
