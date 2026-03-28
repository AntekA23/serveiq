import Player from '../models/Player.js';
import WearableDevice from '../models/WearableDevice.js';
import { evaluateAlerts, checkDeviceSync } from '../services/alertEngine.js';

/**
 * Ewaluuje alerty dla wszystkich aktywnych zawodnikow
 * z podlaczonymi urzadzeniami wearable.
 * Uruchamiane co 30 minut przez startJobs().
 */
export async function evaluateAllAlerts() {
  const startTime = Date.now();
  console.log('[AlertRunner] Rozpoczynam ewaluacje alertow...');

  try {
    // Znajdz wszystkich aktywnych zawodnikow z podlaczonymi urzadzeniami
    const devicesWithPlayers = await WearableDevice.find({
      connected: true,
      authState: 'connected',
    }).distinct('player');

    const players = await Player.find({
      _id: { $in: devicesWithPlayers },
      active: true,
    });

    if (!players.length) {
      console.log('[AlertRunner] Brak aktywnych zawodnikow z urzadzeniami.');
      return;
    }

    console.log(`[AlertRunner] Sprawdzam alerty dla ${players.length} zawodnikow...`);

    let totalAlerts = 0;

    for (const player of players) {
      try {
        const alerts = await evaluateAlerts(player._id);
        totalAlerts += alerts.length;
      } catch (error) {
        console.error(`[AlertRunner] Blad dla zawodnika ${player._id}:`, error.message);
      }
    }

    // Sprawdz tez synchronizacje urzadzen
    try {
      const deviceAlerts = await checkDeviceSync();
      totalAlerts += deviceAlerts.length;
    } catch (error) {
      console.error('[AlertRunner] Blad sprawdzania synchronizacji:', error.message);
    }

    const duration = Date.now() - startTime;
    console.log(
      `[AlertRunner] Zakonczono: ${totalAlerts} nowych alertow, ` +
      `${players.length} zawodnikow sprawdzonych (${duration}ms)`
    );
  } catch (error) {
    console.error('[AlertRunner] Krytyczny blad:', error.message);
  }
}
