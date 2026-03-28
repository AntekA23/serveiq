import { Router } from 'express';
import {
  getDevices,
  connectDevice,
  disconnectDevice,
  syncDevice,
  getPlayerData,
  getLatestData,
} from '../controllers/wearableController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// Wszystkie endpointy wymagają autoryzacji
router.use(verifyToken);

// Urządzenia
router.get('/', getDevices);
router.post('/', connectDevice);
router.delete('/:id', disconnectDevice);
router.post('/:id/sync', syncDevice);

// Dane z urządzeń
router.get('/data/:playerId', getPlayerData);
router.get('/data/:playerId/latest', getLatestData);

export default router;
