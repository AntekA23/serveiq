import { z } from 'zod';
import stripe from '../config/stripe.js';
import User from '../models/User.js';
import {
  createCheckoutSession,
  createPortalSession,
  handleWebhookEvent,
} from '../services/subscriptionService.js';

// ====== Zod Schemas ======

const checkoutSchema = z.object({
  plan: z.enum(['premium', 'family'], {
    errorMap: () => ({ message: 'Plan musi byc "premium" lub "family"' }),
  }),
});

// ====== Kontrolery ======

/**
 * GET /api/subscriptions
 * Zwraca aktualny status subskrypcji
 */
export const getSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('subscription');

    if (!user) {
      return res.status(404).json({ message: 'Uzytkownik nie znaleziony' });
    }

    const sub = user.subscription || {};

    res.json({
      subscription: {
        plan: sub.plan || 'free',
        status: sub.status || 'expired',
        trialEndsAt: sub.trialEndsAt || null,
        currentPeriodEnd: sub.currentPeriodEnd || null,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd || false,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/subscriptions/checkout
 * Tworzy Stripe Checkout Session dla subskrypcji
 */
export const createCheckout = async (req, res, next) => {
  try {
    const { plan } = checkoutSchema.parse(req.body);

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const successUrl = `${clientUrl}/payment/success?type=subscription&plan=${plan}`;
    const cancelUrl = `${clientUrl}/payment/cancel?type=subscription`;

    const session = await createCheckoutSession(
      req.user._id,
      plan,
      successUrl,
      cancelUrl
    );

    res.json({ url: session.url });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/subscriptions/portal
 * Tworzy Stripe Customer Portal session
 */
export const createPortal = async (req, res, next) => {
  try {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const returnUrl = `${clientUrl}/parent/settings`;

    const session = await createPortalSession(req.user._id, returnUrl);

    res.json({ url: session.url });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/subscriptions/webhook
 * Stripe webhook handler (raw body!)
 */
export const handleWebhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error('Brak konfiguracji webhook secret');
    }

    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    await handleWebhookEvent(event);

    res.json({ received: true });
  } catch (error) {
    console.error('[Subscription Webhook] Blad:', error.message);
    res.status(400).json({ message: `Blad webhooka: ${error.message}` });
  }
};

/**
 * POST /api/subscriptions/cancel
 * Anuluje subskrypcje na koniec okresu
 */
export const cancelSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Uzytkownik nie znaleziony' });
    }

    const subscriptionId = user.subscription?.stripeSubscriptionId;

    if (!subscriptionId) {
      return res.status(400).json({ message: 'Brak aktywnej subskrypcji' });
    }

    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    user.subscription.cancelAtPeriodEnd = true;
    await user.save();

    res.json({
      message: 'Subskrypcja zostanie anulowana na koniec okresu rozliczeniowego',
      subscription: {
        plan: user.subscription.plan,
        status: user.subscription.status,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: user.subscription.currentPeriodEnd,
      },
    });
  } catch (error) {
    next(error);
  }
};
