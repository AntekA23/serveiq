import { Router } from 'express';
import express from 'express';
import {
  getPayments,
  createPayment,
  createCheckout,
  webhook,
  getStats,
  markAsPaid,
} from '../controllers/paymentController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Stripe webhook - bez auth, z raw body parser
// UWAGA: ten endpoint musi być zamontowany PRZED express.json() w index.js
// lub obsłużony osobno. Tu dodajemy go z raw parser.
router.post('/webhook', express.raw({ type: 'application/json' }), webhook);

// Auth wymagane dla reszty
router.use(verifyToken);

router.get('/', getPayments);
router.post('/', requireRole('coach'), createPayment);
router.get('/stats', requireRole('coach'), getStats);
router.put('/:id/mark-paid', requireRole('coach'), markAsPaid);
router.post('/:id/checkout', requireRole('parent'), createCheckout);

export default router;
