import { syncAllDevices } from './syncWearables.js';
import { evaluateAllAlerts } from './alertRunner.js';
import { runWeeklySummary } from './weeklyRunner.js';
import { checkTrialExpiry } from './trialChecker.js';

/**
 * Uruchamia wszystkie zadania cykliczne (background jobs).
 * Wywolywane raz po starcie serwera.
 */
export function startJobs() {
  // Synchronizacja urzadzen wearable co 15 minut
  setInterval(syncAllDevices, 15 * 60 * 1000);

  // Ewaluacja alertow co 30 minut
  setInterval(evaluateAllAlerts, 30 * 60 * 1000);

  // Sprawdzanie wygaslych triali raz dziennie (co 24h)
  setInterval(checkTrialExpiry, 24 * 60 * 60 * 1000);

  // Tygodniowe podsumowanie — sprawdza co godzine, wysyla w poniedzialek o 7:00
  setInterval(runWeeklySummary, 60 * 60 * 1000);

  console.log('[ServeIQ] Background jobs started');
  console.log('[ServeIQ]   - Sync wearables: co 15 min');
  console.log('[ServeIQ]   - Alert evaluation: co 30 min');
  console.log('[ServeIQ]   - Trial expiry check: co 24h');
  console.log('[ServeIQ]   - Weekly summary: co 1h (wysyla pon. 7:00)');
}
