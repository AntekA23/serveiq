import { hasFeatureAccess } from '../services/subscriptionService.js';

/**
 * Middleware sprawdzający czy użytkownik ma dostęp do funkcji.
 * Użycie: requireFeature('pdf_export')
 */
export function requireFeature(feature) {
  return (req, res, next) => {
    if (!hasFeatureAccess(req.user, feature)) {
      return res.status(403).json({
        message: 'Ta funkcja wymaga planu Premium',
        requiredPlan: 'premium',
        currentPlan: req.user?.subscription?.plan || 'free',
      });
    }
    next();
  };
}
