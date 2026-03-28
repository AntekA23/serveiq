import User from '../models/User.js';
import Notification from '../models/Notification.js';

/**
 * Sprawdza uzytkownkow z wygaslym okresem trial.
 * Aktualizuje status subskrypcji i tworzy powiadomienie.
 * Uruchamiane codziennie przez startJobs().
 */
export async function checkTrialExpiry() {
  console.log('[TrialChecker] Sprawdzam wygasle trialy...');

  try {
    const now = new Date();

    // Znajdz uzytkownikow z wygaslym trialem
    const expiredUsers = await User.find({
      'subscription.status': 'trialing',
      'subscription.trialEndsAt': { $lt: now },
      isActive: true,
    });

    if (!expiredUsers.length) {
      console.log('[TrialChecker] Brak wygaslych triali.');
      return;
    }

    console.log(`[TrialChecker] Znaleziono ${expiredUsers.length} wygaslych triali.`);

    for (const user of expiredUsers) {
      try {
        // Aktualizuj status subskrypcji
        user.subscription.status = 'expired';
        user.subscription.plan = 'free';
        await user.save();

        // Utworz powiadomienie
        await Notification.create({
          user: user._id,
          type: 'system',
          title: 'Okres probny zakonczony',
          body: 'Twoj 14-dniowy okres probny dobiegl konca. Przejdz na plan Premium, aby kontynuowac korzystanie ze wszystkich funkcji.',
          severity: 'warning',
          actionUrl: '/parent/settings',
          metadata: { previousPlan: 'premium', newPlan: 'free' },
        });

        console.log(`[TrialChecker] Trial wygasl dla uzytkownika ${user._id} (${user.email})`);
      } catch (error) {
        console.error(`[TrialChecker] Blad dla uzytkownika ${user._id}:`, error.message);
      }
    }

    console.log(`[TrialChecker] Zakonczono: ${expiredUsers.length} triali zaktualizowanych.`);
  } catch (error) {
    console.error('[TrialChecker] Krytyczny blad:', error.message);
  }
}
