import { Router } from 'express';
import {
  getActivities,
  createActivity,
  getActivity,
  updateActivity,
  updateAttendance,
  deleteActivity,
  getCalendar,
  getUpcoming,
} from '../controllers/activityController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Auth wymagane dla wszystkich
router.use(verifyToken);

// Endpointy specjalne (muszą być PRZED /:id)
router.get('/calendar', getCalendar);
router.get('/upcoming', getUpcoming);

// GET - lista aktywności (filtrowana wg roli)
router.get('/', getActivities);
router.get('/:id', getActivity);

// POST - utwórz aktywność (coach, clubAdmin, parent)
router.post('/', requireRole('coach', 'clubAdmin', 'parent'), createActivity);

// PUT - aktualizuj aktywność (coach, clubAdmin)
router.put('/:id', requireRole('coach', 'clubAdmin'), updateActivity);

// PUT - aktualizuj frekwencję (coach, clubAdmin)
router.put('/:id/attendance', requireRole('coach', 'clubAdmin'), updateAttendance);

// DELETE - usuń aktywność
router.delete('/:id', requireRole('coach', 'clubAdmin', 'parent'), deleteActivity);

export default router;
