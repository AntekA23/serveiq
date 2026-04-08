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
  cancelActivity,
  restoreActivity,
  deleteActivitySeries,
} from '../controllers/activityController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Auth wymagane dla wszystkich
router.use(verifyToken);

// Endpointy specjalne (muszą być PRZED /:id)
router.get('/calendar', getCalendar);
router.get('/upcoming', getUpcoming);

// Series deletion
router.delete('/series/:seriesId', requireRole('coach', 'clubAdmin'), deleteActivitySeries);

// GET - lista aktywności (filtrowana wg roli)
router.get('/', getActivities);
router.get('/:id', getActivity);

// POST - utwórz aktywność (coach, clubAdmin, parent)
router.post('/', requireRole('coach', 'clubAdmin', 'parent'), createActivity);

// PUT - aktualizuj aktywność (coach, clubAdmin)
router.put('/:id', requireRole('coach', 'clubAdmin'), updateActivity);

// PUT - aktualizuj frekwencję (coach, clubAdmin)
router.put('/:id/attendance', requireRole('coach', 'clubAdmin'), updateAttendance);

// Cancel / Restore
router.put('/:id/cancel', requireRole('coach', 'clubAdmin'), cancelActivity);
router.put('/:id/restore', requireRole('coach', 'clubAdmin'), restoreActivity);

// DELETE - usuń aktywność
router.delete('/:id', requireRole('coach', 'clubAdmin', 'parent'), deleteActivity);

export default router;
