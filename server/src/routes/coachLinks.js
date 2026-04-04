import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import {
  getMyCode,
  resetCode,
  toggleCode,
  validateCode,
  joinCoach,
  getRequests,
  respondToRequest,
} from '../controllers/coachLinkController.js';

const router = Router();
router.use(verifyToken);

// Coach code management
router.get('/my-code', requireRole('coach'), getMyCode);
router.post('/reset-code', requireRole('coach'), resetCode);
router.patch('/toggle-code', requireRole('coach'), toggleCode);

// Parent join flow
router.get('/validate', requireRole('parent'), validateCode);
router.post('/join', requireRole('parent'), joinCoach);

// Requests (both roles)
router.get('/requests', getRequests);
router.put('/requests/:id', requireRole('coach'), respondToRequest);

export default router;
