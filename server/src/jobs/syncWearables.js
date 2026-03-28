import WearableDevice from '../models/WearableDevice.js';
import WearableData from '../models/WearableData.js';
import { getProviderWithFallback } from '../services/wearableProviders/index.js';

/**
 * Zadanie synchronizacji danych z urządzeń wearable.
 * Uruchamiane cyklicznie co 15 minut przez setInterval w index.js.
 *
 * Dla każdego podłączonego urządzenia:
 * 1. Sprawdza czy minęło >= 15 minut od ostatniej synchronizacji
 * 2. Jeśli tak — pobiera nowe dane z odpowiedniego providera
 * 3. Zapisuje rekordy WearableData
 * 4. Aktualizuje lastSyncAt na urządzeniu
 * 5. Obsługuje błędy — ustawia authState='error' po powtarzających się błędach
 */

const SYNC_INTERVAL_MINUTES = 15;
const MAX_CONSECUTIVE_ERRORS = 3;

/**
 * Synchronizuje dane z jednego urządzenia.
 * @param {object} device - Dokument WearableDevice
 * @returns {object} { success, recordsCreated, error? }
 */
async function syncSingleDevice(device) {
  try {
    const provider = getProviderWithFallback(device.provider);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Pobierz dane z providera
    const extraParams = {
      playerId: device.player.toString(),
      deviceId: device._id.toString(),
      provider: device.provider,
    };

    const [dailyRaw, sleepRaw, recoveryRaw] = await Promise.all([
      provider.fetchDailyData(device.accessToken, today, extraParams),
      provider.fetchSleepData(device.accessToken, today, extraParams),
      provider.fetchRecoveryData(device.accessToken, today, extraParams),
    ]);

    // Mapuj dane na nasz schemat
    const records = [];
    const baseRecord = {
      player: device.player,
      device: device._id,
      provider: device.provider,
      date: today,
    };

    const dailyMetrics = provider.mapToWearableData(dailyRaw, 'daily_summary');
    if (dailyMetrics) {
      records.push({ ...baseRecord, type: 'daily_summary', metrics: dailyMetrics });
    }

    const sleepMetrics = provider.mapToWearableData(sleepRaw, 'sleep');
    if (sleepMetrics) {
      records.push({ ...baseRecord, type: 'sleep', metrics: sleepMetrics });
    }

    const recoveryMetrics = provider.mapToWearableData(recoveryRaw, 'recovery');
    if (recoveryMetrics) {
      records.push({ ...baseRecord, type: 'recovery', metrics: recoveryMetrics });
    }

    if (records.length === 0) {
      return { success: true, recordsCreated: 0 };
    }

    // Usuń istniejące dane za dzisiaj (unikaj duplikatów)
    const typesToUpdate = records.map((r) => r.type);
    await WearableData.deleteMany({
      device: device._id,
      date: today,
      type: { $in: typesToUpdate },
    });

    // Zapisz nowe dane
    await WearableData.insertMany(records);

    // Aktualizuj status urządzenia
    device.lastSyncAt = new Date();
    device.syncErrorCount = 0;

    // Symulacja zużycia baterii (tylko w trybie mock)
    if (device.battery != null) {
      device.battery = Math.max(0, device.battery - Math.floor(Math.random() * 2));
    }

    await device.save();

    return { success: true, recordsCreated: records.length };
  } catch (error) {
    // Zwiększ licznik błędów
    const errorCount = (device.syncErrorCount || 0) + 1;
    device.syncErrorCount = errorCount;

    // Po MAX_CONSECUTIVE_ERRORS ustaw authState='error'
    if (errorCount >= MAX_CONSECUTIVE_ERRORS) {
      device.authState = 'error';
      console.error(
        `[SyncWearables] Urządzenie ${device._id} (${device.provider}): ` +
        `osiągnięto limit błędów (${MAX_CONSECUTIVE_ERRORS}) — ustawiono authState='error'`
      );
    }

    await device.save();

    return {
      success: false,
      recordsCreated: 0,
      error: error.message,
    };
  }
}

/**
 * Główna funkcja synchronizacji — iteruje po wszystkich podłączonych urządzeniach.
 * Wywoływana przez setInterval co 15 minut.
 */
export async function syncAllDevices() {
  const startTime = Date.now();
  console.log('[SyncWearables] Rozpoczynam synchronizację urządzeń...');

  try {
    // Znajdź urządzenia wymagające synchronizacji
    const staleThreshold = new Date(Date.now() - SYNC_INTERVAL_MINUTES * 60 * 1000);

    const devices = await WearableDevice.find({
      connected: true,
      authState: 'connected',
      $or: [
        { lastSyncAt: { $lt: staleThreshold } },
        { lastSyncAt: null },
      ],
    });

    if (devices.length === 0) {
      console.log('[SyncWearables] Brak urządzeń do synchronizacji.');
      return { synced: 0, errors: 0, total: 0 };
    }

    console.log(`[SyncWearables] Znaleziono ${devices.length} urządzeń do synchronizacji.`);

    let synced = 0;
    let errors = 0;

    // Synchronizuj urządzenia sekwencyjnie (aby nie przeciążać API)
    for (const device of devices) {
      const result = await syncSingleDevice(device);

      if (result.success) {
        synced++;
        if (result.recordsCreated > 0) {
          console.log(
            `[SyncWearables] ${device.provider.toUpperCase()} (${device._id}): ` +
            `zsynchronizowano ${result.recordsCreated} rekordów`
          );
        }
      } else {
        errors++;
        console.error(
          `[SyncWearables] ${device.provider.toUpperCase()} (${device._id}): ` +
          `błąd — ${result.error}`
        );
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `[SyncWearables] Zakończono: ${synced} zsynchronizowanych, ${errors} błędów, ` +
      `${devices.length} łącznie (${duration}ms)`
    );

    return { synced, errors, total: devices.length };
  } catch (error) {
    console.error('[SyncWearables] Krytyczny błąd synchronizacji:', error.message);
    return { synced: 0, errors: 1, total: 0 };
  }
}
