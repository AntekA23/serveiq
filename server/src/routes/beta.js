import { Router } from 'express';
import { signup, list } from '../controllers/betaController.js';

const router = Router();

router.post('/signup', signup);
router.get('/list', list);

export default router;
