import { Router } from 'express';
import {
  getConversations,
  getConversation,
  sendMessage,
  markAsRead,
} from '../controllers/messageController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// Auth wymagane dla wszystkich endpointów wiadomości
router.use(verifyToken);

router.get('/conversations', getConversations);
router.get('/conversation/:userId', getConversation);
router.post('/', sendMessage);
router.put('/read/:userId', markAsRead);

export default router;
