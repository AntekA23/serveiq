import stripe from '../config/stripe.js';

/**
 * Tworzy Stripe Checkout Session dla płatności
 * @param {Object} payment - dokument Payment z MongoDB
 * @param {String} successUrl - URL przekierowania po udanej płatności
 * @param {String} cancelUrl - URL przekierowania po anulowaniu
 * @returns {String} URL do strony Checkout
 */
export const createCheckoutSession = async (payment, successUrl, cancelUrl) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card', 'blik', 'p24'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: (payment.currency || 'PLN').toLowerCase(),
          product_data: {
            name: payment.description || 'Trening tenisowy - ServeIQ',
          },
          unit_amount: Math.round(payment.amount * 100), // Stripe oczekuje kwoty w groszach
        },
        quantity: 1,
      },
    ],
    metadata: {
      paymentId: payment._id.toString(),
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
};

/**
 * Weryfikuje podpis webhooka Stripe i zwraca event
 * @param {Buffer} payload - surowy payload z requesta
 * @param {String} sig - nagłówek stripe-signature
 * @returns {Object} zweryfikowany event Stripe
 */
export const handleWebhook = (payload, sig) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('Brak konfiguracji STRIPE_WEBHOOK_SECRET');
  }

  const event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  return event;
};
