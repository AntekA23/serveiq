import BaseWearableProvider from './baseProvider.js';
import {
  generateDailyData,
  generateHistoricalData,
  generateLatestMetrics,
} from '../wearableMockService.js';

/**
 * Mock provider — opakowuje istniejący wearableMockService.
 * Używany w trybie demo oraz jako fallback, gdy brak kluczy API.
 */
export default class MockProvider extends BaseWearableProvider {
  constructor() {
    super('mock');
  }

  /**
   * Mock OAuth — zwraca fałszywy URL autoryzacji.
   * W trybie mock nie jest potrzebna prawdziwa autoryzacja.
   */
  getAuthUrl(playerId, redirectUri) {
    const state = `mock_${Date.now()}_${playerId}`;
    return {
      url: `${redirectUri}?code=MOCK_CODE&state=${state}&provider=mock`,
      state,
      codeVerifier: null,
    };
  }

  /**
   * Mock exchange — natychmiast zwraca fałszywe tokeny.
   */
  async exchangeCode(code, codeVerifier) {
    return {
      accessToken: `mock_access_${Date.now()}`,
      refreshToken: `mock_refresh_${Date.now()}`,
      expiresIn: 7200, // 2 godziny
    };
  }

  /**
   * Mock refresh — zwraca nowe fałszywe tokeny.
   */
  async refreshAccessToken(refreshToken) {
    return {
      accessToken: `mock_access_${Date.now()}`,
      refreshToken: `mock_refresh_${Date.now()}`,
      expiresIn: 7200,
    };
  }

  /**
   * Pobiera dane dzienne z mock service.
   * accessToken jest ignorowany — dane generowane deterministycznie.
   */
  async fetchDailyData(accessToken, date, { playerId, deviceId, provider } = {}) {
    const records = generateDailyData(
      playerId || 'mock-player',
      deviceId || 'mock-device',
      provider || 'garmin',
      date || new Date()
    );

    // Zwróć surowe dane — daily_summary
    const dailySummary = records.find((r) => r.type === 'daily_summary');
    return dailySummary ? dailySummary.metrics : {};
  }

  /**
   * Pobiera dane snu z mock service.
   */
  async fetchSleepData(accessToken, date, { playerId, deviceId, provider } = {}) {
    const records = generateDailyData(
      playerId || 'mock-player',
      deviceId || 'mock-device',
      provider || 'garmin',
      date || new Date()
    );

    const sleepRecord = records.find((r) => r.type === 'sleep');
    return sleepRecord ? sleepRecord.metrics : {};
  }

  /**
   * Pobiera dane regeneracji z mock service.
   */
  async fetchRecoveryData(accessToken, date, { playerId, deviceId, provider } = {}) {
    const records = generateDailyData(
      playerId || 'mock-player',
      deviceId || 'mock-device',
      provider || 'garmin',
      date || new Date()
    );

    const recoveryRecord = records.find((r) => r.type === 'recovery');
    return recoveryRecord ? recoveryRecord.metrics : {};
  }

  /**
   * Mock mapowanie — dane z mock service są już w naszym formacie,
   * więc zwracamy je bez zmian.
   */
  mapToWearableData(rawData, type) {
    return rawData;
  }

  /**
   * Pomocnicza metoda — generuje pełne dane historyczne (30 dni).
   * Przydatne przy pierwszym podłączeniu urządzenia mock.
   */
  generateHistorical(playerId, deviceId, provider, days = 30) {
    return generateHistoricalData(playerId, deviceId, provider, days);
  }

  /**
   * Pomocnicza metoda — generuje najnowsze metryki.
   */
  getLatestMetrics(provider) {
    return generateLatestMetrics(provider);
  }
}
