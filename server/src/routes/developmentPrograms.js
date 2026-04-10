import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  listPrograms,
  getProgram,
  getStageForPlayer,
} from '../controllers/developmentProgramController.js';

const router = Router();

router.get('/', verifyToken, listPrograms);
router.get('/:code', verifyToken, getProgram);
router.get('/:code/stage-for-player/:playerId', verifyToken, getStageForPlayer);

export default router;
