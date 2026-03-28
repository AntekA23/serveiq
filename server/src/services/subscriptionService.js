import Stripe from 'stripe';
import User from '../models/User.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
  premium: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium_placeholder',
  family: process.env.STRIPE_FAMILY_PRICE_ID || 'price_family_placeholder',
};

/**
 * Tworzy Stripe Checkout Session dla subskrypcji
 */
export async function createCheckoutSession(userId, plan, successUrl, cancelUrl) {
  const user = await User.findById(userId);
  if (!user) throw new Error('Uzytkownik nie znaleziony');

  // Pobierz lub utwórz Stripe Customer
  let customerId = user.subscription?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      metadata: { userId: user._id.toString() },
    });
    customerId = customer.id;
    user.subscription.stripeCustomerId = customerId;
    await user.save();
  }

  const priceId = PRICE_IDS[plan];
  if (!priceId) throw new Error(`Nieznany plan: ${plan}`);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card', 'blik', 'p24'],
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { userId: user._id.toString(), plan },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

/**
 * Tworzy Stripe Customer Portal session
 */
export async function createPortalSession(userId, returnUrl) {
  const user = await User.findById(userId);
  if (!user) throw new Error('Uzytkownik nie znaleziony');

  const customerId = user.subscription?.stripeCustomerId;
  if (!customerId) throw new Error('Brak konta Stripe');

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Obsługuje eventy webhookowe Stripe
 */
export async function handleWebhookEvent(event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan;

      if (userId && plan) {
        const user = await User.findById(userId);
        if (user) {
          user.subscription.plan = plan;
          user.subscription.status = 'active';
          user.subscription.stripeSubscriptionId = session.subscription;
          user.subscription.stripeCustomerId = session.customer;
          user.subscription.cancelAtPeriodEnd = false;
          await user.save();
        }
      }
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;

      if (subscriptionId) {
        const user = await User.findOne({
          'subscription.stripeSubscriptionId': subscriptionId,
        });
        if (user) {
          user.subscription.status = 'active';
          user.subscription.currentPeriodEnd = new Date(
            invoice.lines?.data?.[0]?.period?.end * 1000
          );
          await user.save();
        }
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;

      if (subscriptionId) {
        const user = await User.findOne({
          'subscription.stripeSubscriptionId': subscriptionId,
        });
        if (user) {
          user.subscription.status = 'past_due';
          await user.save();
        }
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const user = await User.findOne({
        'subscription.stripeSubscriptionId': subscription.id,
      });
      if (user) {
        user.subscription.cancelAtPeriodEnd = subscription.cancel_at_period_end;
        user.subscription.currentPeriodEnd = new Date(
          subscription.current_period_end * 1000
        );

        if (subscription.status === 'active') {
          user.subscription.status = 'active';
        } else if (subscription.status === 'past_due') {
          user.subscription.status = 'past_due';
        }

        await user.save();
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const user = await User.findOne({
        'subscription.stripeSubscriptionId': subscription.id,
      });
      if (user) {
        user.subscription.status = 'cancelled';
        user.subscription.stripeSubscriptionId = undefined;
        user.subscription.cancelAtPeriodEnd = false;
        await user.save();
      }
      break;
    }

    default:
      // Nieobslugiwany event - ignoruj
      break;
  }
}

/**
 * Sprawdza czy uzytkownik ma dostep do danej funkcji
 */
export function hasFeatureAccess(user, feature) {
  const plan = user?.subscription?.plan || 'free';
  const status = user?.subscription?.status;
  const isActive = ['trialing', 'active'].includes(status);

  const features = {
    free: ['dashboard', 'basic_alerts', 'one_child'],
    premium: [
      'dashboard',
      'basic_alerts',
      'full_alerts',
      'health_history',
      'pdf_export',
      'push_notifications',
      'weekly_email',
      'three_children',
    ],
    family: [
      'dashboard',
      'basic_alerts',
      'full_alerts',
      'health_history',
      'pdf_export',
      'push_notifications',
      'weekly_email',
      'five_children',
      'priority_support',
    ],
  };

  if (!isActive && plan !== 'free') return features.free.includes(feature);
  return (features[plan] || features.free).includes(feature);
}

/**
 * Zwraca maksymalną liczbę dzieci dla planu
 */
export function getMaxChildren(user) {
  const plan = user?.subscription?.plan || 'free';
  const status = user?.subscription?.status;
  const isActive = ['trialing', 'active'].includes(status);
  if (!isActive) return 1;
  return { free: 1, premium: 3, family: 5 }[plan] || 1;
}
