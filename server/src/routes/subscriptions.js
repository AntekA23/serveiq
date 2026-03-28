import { Router } from 'express';
import express from 'express';
import {
  getSubscription,
  createCheckout,
  createPortal,
  handleWebhook,
  cancelSubscription,
} from '../controllers/subscriptionController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// Stripe webhook - bez auth, z raw body parser
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Auth wymagane dla reszty
router.use(verifyToken);

router.get('/', getSubscription);
router.post('/checkout', createCheckout);
router.post('/portal', createPortal);
router.post('/cancel', cancelSubscription);

export default router;
