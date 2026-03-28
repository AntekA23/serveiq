import { Router } from 'express';
import {
  getDevices,
  connectDevice,
  disconnectDevice,
  syncDevice,
  getPlayerData,
  getLatestData,
  initiateGarminAuth,
  handleGarminCallback,
  initiateWhoopAuth,
  handleWhoopCallback,
} from '../controllers/wearableController.js';
import { getTrends, comparePeriods } from '../controllers/healthController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// ====== OAuth callback routes (publiczne — użytkownik wraca z serwisu OAuth) ======

router.get('/garmin/callback', handleGarminCallback);
router.get('/whoop/callback', handleWhoopCallback);

// ====== Wszystkie pozostałe endpointy wymagają autoryzacji ======

router.use(verifyToken);

// OAuth — inicjacja autoryzacji
router.get('/garmin/auth', initiateGarminAuth);
router.get('/whoop/auth', initiateWhoopAuth);

// Urządzenia
router.get('/', getDevices);
router.post('/', connectDevice);
router.delete('/:id', disconnectDevice);
router.post('/:id/sync', syncDevice);

// Dane z urządzeń
router.get('/data/:playerId', getPlayerData);
router.get('/data/:playerId/latest', getLatestData);
router.get('/data/:playerId/trends', getTrends);
router.get('/data/:playerId/compare', comparePeriods);

export default router;
