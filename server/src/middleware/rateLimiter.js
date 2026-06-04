import rateLimit from 'express-rate-limit';

/**
 * Ogólny limiter: 1000 zapytań na 15 minut.
 * SPA odpala po kilka zapytań na każdy ekran, więc 100/15min blokowało
 * normalne przeglądanie. 1000 chroni przed nadużyciem, nie raniąc UX.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    message: 'Zbyt wiele zapytań. Spróbuj ponownie za 15 minut.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Limiter dla endpointów autoryzacji: 50 zapytań na 15 minut.
 * Wystarcza na ochronę przed brute-force, a nie blokuje częstego
 * przełączania kont (np. przełącznik DEV w czasie testów).
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    message: 'Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
