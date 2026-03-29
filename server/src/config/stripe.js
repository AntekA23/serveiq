import Stripe from 'stripe';

let stripe = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('[ServeIQ] STRIPE_SECRET_KEY nie ustawiony — platnosci wylaczone');
}

export default stripe;
