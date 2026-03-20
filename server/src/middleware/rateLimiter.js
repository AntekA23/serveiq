import rateLimit from 'express-rate-limit';

/**
 * Ogólny limiter: 100 zapytań na 15 minut
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    message: 'Zbyt wiele zapytań. Spróbuj ponownie za 15 minut.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Limiter dla endpointów autoryzacji: 20 zapytań na 15 minut
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    message: 'Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
