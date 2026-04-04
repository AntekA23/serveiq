import { Router } from 'express';
import {
  getObservations,
  createObservation,
  getObservation,
  updateObservation,
  deleteObservation,
} from '../controllers/observationController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Auth wymagane dla wszystkich
router.use(verifyToken);

// GET - lista obserwacji (filtrowana wg roli)
router.get('/', getObservations);
router.get('/:id', getObservation);

// POST - utwórz obserwację (coach, clubAdmin)
router.post('/', requireRole('coach', 'clubAdmin'), createObservation);

// PUT - aktualizuj obserwację (coach, clubAdmin)
router.put('/:id', requireRole('coach', 'clubAdmin'), updateObservation);

// DELETE - usuń obserwację (coach, clubAdmin)
router.delete('/:id', requireRole('coach', 'clubAdmin'), deleteObservation);

export default router;
