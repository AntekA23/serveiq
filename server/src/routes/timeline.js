import { Router } from 'express';
import {
  getTimeline,
  getClubTimeline,
} from '../controllers/timelineController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// Auth wymagane dla wszystkich
router.use(verifyToken);

// GET - oś czasu klubu (musi być PRZED /)
router.get('/club', getClubTimeline);

// GET - oś czasu gracza
router.get('/', getTimeline);

export default router;
