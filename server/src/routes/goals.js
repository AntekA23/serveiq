import { Router } from 'express';
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
} from '../controllers/goalController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Auth wymagane dla wszystkich
router.use(verifyToken);

// GET - lista celów (filtrowana wg roli)
router.get('/', getGoals);

// POST - utwórz cel (coach, clubAdmin)
router.post('/', requireRole('coach', 'clubAdmin'), createGoal);

// PUT - aktualizuj cel (coach, clubAdmin)
router.put('/:id', requireRole('coach', 'clubAdmin'), updateGoal);

// DELETE - usuń cel (coach, clubAdmin)
router.delete('/:id', requireRole('coach', 'clubAdmin'), deleteGoal);

export default router;
