import crypto from 'crypto';
import BaseWearableProvider from './baseProvider.js';

/**
 * Provider dla WHOOP API v2.
 *
 * WHOOP używa OAuth 2.0 z PKCE (Proof Key for Code Exchange).
 * Wymaga client_id i client_secret z portalu developerskiego WHOOP.
 *
 * Dokumentacja: https://developer.whoop.com/api
 *
 * UWAGA: To jest szkielet implementacji. Prawdziwe wywołania API wymagają:
 * - Client ID (WHOOP_CLIENT_ID)
 * - Client Secret (WHOOP_CLIENT_SECRET)
 * - Rejestracji w WHOOP Developer Portal
 */

// Bazowe URL-e WHOOP API
const WHOOP_API_BASE = 'https://api.prod.whoop.com/developer';
const WHOOP_AUTH_URL = 'https://api.prod.whoop.com/oauth/oauth2/auth';
const WHOOP_TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token';

// Endpointy danych
const WHOOP_ENDPOINTS = {
  cycle: '/v1/cycle',           // Cykl fizjologiczny (dzienny)
  recovery: '/v1/recovery',     // Dane regeneracji
  sleep: '/v1/activity/sleep',  // Dane snu
  workout: '/v1/activity/workout', // Dane treningów
  bodyMeasurement: '/v1/body_measurement', // Pomiary ciała
};

// Scopes wymagane do odczytu danych zdrowotnych
const WHOOP_SCOPES = [
  'read:recovery',
  'read:cycles',
  'read:sleep',
  'read:workout',
  'read:body_measurement',
  'read:profile',
].join(' ');

export default class WhoopProvider extends BaseWearableProvider {
  constructor() {
    super('whoop');
    this.clientId = process.env.WHOOP_CLIENT_ID || '';
    this.clientSecret = process.env.WHOOP_CLIENT_SECRET || '';
  }

  // ====== Pomocniki PKCE ======

  /**
   * Generuje code_verifier dla PKCE (43-128 znaków URL-safe).
   * @returns {string} code_verifier
   */
  static generateCodeVerifier() {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Generuje code_challenge z code_verifier (SHA-256 + base64url).
   * @param {string} verifier - code_verifier
   * @returns {string} code_challenge
   */
  static generateCodeChallenge(verifier) {
    return crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64url');
  }

  // ====== Implementacja interfejsu ======

  /**
   * Generuje URL autoryzacji OAuth 2.0 z PKCE dla WHOOP.
   *
   * Parametry URL:
   * - response_type=code
   * - client_id
   * - redirect_uri
   * - scope (read:recovery, read:cycles, etc.)
   * - state (CSRF protection)
   * - code_challenge (PKCE)
   * - code_challenge_method=S256
   */
  getAuthUrl(playerId, redirectUri) {
    const state = crypto.randomBytes(16).toString('hex');
    const codeVerifier = WhoopProvider.generateCodeVerifier();
    const codeChallenge = WhoopProvider.generateCodeChallenge(codeVerifier);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: redirectUri,
      scope: WHOOP_SCOPES,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return {
      url: `${WHOOP_AUTH_URL}?${params.toString()}`,
      state,
      codeVerifier,
    };
  }

  /**
   * Wymienia kod autoryzacyjny na tokeny dostępu.
   *
   * POST /oauth/oauth2/token
   * Body (application/x-www-form-urlencoded):
   * - grant_type=authorization_code
   * - code
   * - redirect_uri
   * - client_id
   * - client_secret
   * - code_verifier (PKCE)
   *
   * Odpowiedź:
   * {
   *   "access_token": "...",
   *   "refresh_token": "...",
   *   "expires_in": 21600,
   *   "token_type": "bearer",
   *   "scope": "..."
   * }
   *
   * TODO: Zaimplementować prawdziwe wywołanie API
   */
  async exchangeCode(code, codeVerifier) {
    // TODO: Implementacja prawdziwego wywołania
    // const response = await fetch(WHOOP_TOKEN_URL, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    //   body: new URLSearchParams({
    //     grant_type: 'authorization_code',
    //     code,
    //     redirect_uri: `${process.env.CLIENT_URL}/parent/devices/callback?provider=whoop`,
    //     client_id: this.clientId,
    //     client_secret: this.clientSecret,
    //     code_verifier: codeVerifier,
    //   }),
    // });
    // const data = await response.json();
    // return {
    //   accessToken: data.access_token,
    //   refreshToken: data.refresh_token,
    //   expiresIn: data.expires_in,
    // };

    console.warn('[WhoopProvider] exchangeCode: brak klucza API — zwracam mock tokeny');
    return {
      accessToken: `whoop_mock_access_${Date.now()}`,
      refreshToken: `whoop_mock_refresh_${Date.now()}`,
      expiresIn: 21600, // 6 godzin
    };
  }

  /**
   * Odświeża token dostępu WHOOP.
   *
   * POST /oauth/oauth2/token
   * Body:
   * - grant_type=refresh_token
   * - refresh_token
   * - client_id
   * - client_secret
   *
   * TODO: Zaimplementować prawdziwe wywołanie API
   */
  async refreshAccessToken(refreshToken) {
    // TODO: Implementacja prawdziwego wywołania
    // const response = await fetch(WHOOP_TOKEN_URL, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    //   body: new URLSearchParams({
    //     grant_type: 'refresh_token',
    //     refresh_token: refreshToken,
    //     client_id: this.clientId,
    //     client_secret: this.clientSecret,
    //   }),
    // });
    // const data = await response.json();
    // return {
    //   accessToken: data.access_token,
    //   refreshToken: data.refresh_token,
    //   expiresIn: data.expires_in,
    // };

    console.warn('[WhoopProvider] refreshAccessToken: brak klucza API — zwracam mock tokeny');
    return {
      accessToken: `whoop_mock_access_${Date.now()}`,
      refreshToken: `whoop_mock_refresh_${Date.now()}`,
      expiresIn: 21600,
    };
  }

  /**
   * Pobiera dane dzienne z WHOOP (cykl fizjologiczny).
   *
   * GET /developer/v1/cycle
   * Parametry: start, end (ISO 8601)
   *
   * Zwraca: strain, calories, average HR, max HR, kilojoules
   *
   * TODO: Zaimplementować prawdziwe wywołanie API
   */
  async fetchDailyData(accessToken, date) {
    // TODO: Implementacja prawdziwego wywołania
    // const start = date.toISOString();
    // const end = new Date(date.getTime() + 86400000).toISOString();
    // const response = await fetch(
    //   `${WHOOP_API_BASE}${WHOOP_ENDPOINTS.cycle}?start=${start}&end=${end}`,
    //   {
    //     headers: {
    //       'Authorization': `Bearer ${accessToken}`,
    //     },
    //   }
    // );
    // return await response.json();

    console.warn('[WhoopProvider] fetchDailyData: brak klucza API — brak danych');
    return null;
  }

  /**
   * Pobiera dane snu z WHOOP.
   *
   * GET /developer/v1/activity/sleep
   * Parametry: start, end (ISO 8601)
   *
   * Zwraca: czas w łóżku, fazy snu (SWS, REM, light, awake),
   *         efektywność snu, respiratory rate, SpO2
   *
   * TODO: Zaimplementować prawdziwe wywołanie API
   */
  async fetchSleepData(accessToken, date) {
    // TODO: Implementacja prawdziwego wywołania
    // const start = date.toISOString();
    // const end = new Date(date.getTime() + 86400000).toISOString();
    // const response = await fetch(
    //   `${WHOOP_API_BASE}${WHOOP_ENDPOINTS.sleep}?start=${start}&end=${end}`,
    //   {
    //     headers: {
    //       'Authorization': `Bearer ${accessToken}`,
    //     },
    //   }
    // );
    // return await response.json();

    console.warn('[WhoopProvider] fetchSleepData: brak klucza API — brak danych');
    return null;
  }

  /**
   * Pobiera dane regeneracji z WHOOP.
   *
   * GET /developer/v1/recovery
   * Parametry: start, end (ISO 8601)
   *
   * Zwraca: recovery score (0-100), HRV (rMSSD), resting HR,
   *         SpO2, skin temperature
   *
   * TODO: Zaimplementować prawdziwe wywołanie API
   */
  async fetchRecoveryData(accessToken, date) {
    // TODO: Implementacja prawdziwego wywołania
    // const start = date.toISOString();
    // const end = new Date(date.getTime() + 86400000).toISOString();
    // const response = await fetch(
    //   `${WHOOP_API_BASE}${WHOOP_ENDPOINTS.recovery}?start=${start}&end=${end}`,
    //   {
    //     headers: {
    //       'Authorization': `Bearer ${accessToken}`,
    //     },
    //   }
    // );
    // return await response.json();

    console.warn('[WhoopProvider] fetchRecoveryData: brak klucza API — brak danych');
    return null;
  }

  /**
   * Mapuje surowe dane z WHOOP API na nasz schemat WearableData.
   *
   * Format WHOOP (przykład cycle):
   * {
   *   "id": 123,
   *   "score": {
   *     "strain": 14.2,
   *     "kilojoule": 8500,
   *     "average_heart_rate": 85,
   *     "max_heart_rate": 190
   *   },
   *   "start": "2024-01-15T06:00:00.000Z",
   *   "end": "2024-01-16T06:00:00.000Z"
   * }
   *
   * Format WHOOP (przykład recovery):
   * {
   *   "cycle_id": 123,
   *   "score": {
   *     "recovery_score": 85,
   *     "resting_heart_rate": 58,
   *     "hrv_rmssd_milli": 72.5,
   *     "spo2_percentage": 97.2,
   *     "skin_temp_celsius": 36.4
   *   }
   * }
   *
   * Format WHOOP (przykład sleep):
   * {
   *   "id": 456,
   *   "score": {
   *     "sleep_performance_percentage": 88,
   *     "sleep_efficiency_percentage": 92,
   *     "respiratory_rate": 14.5,
   *     "stage_summary": {
   *       "total_in_bed_time_milli": 28800000,
   *       "total_awake_time_milli": 1200000,
   *       "total_light_sleep_time_milli": 10800000,
   *       "total_slow_wave_sleep_time_milli": 5400000,
   *       "total_rem_sleep_time_milli": 6600000
   *     }
   *   }
   * }
   */
  mapToWearableData(rawData, type) {
    if (!rawData) return null;

    switch (type) {
      case 'daily_summary':
        return this._mapCycle(rawData);
      case 'sleep':
        return this._mapSleep(rawData);
      case 'recovery':
        return this._mapRecovery(rawData);
      case 'workout':
        return this._mapWorkout(rawData);
      default:
        return null;
    }
  }

  // ====== Prywatne metody mapowania ======

  _mapCycle(raw) {
    const score = raw.score || {};
    return {
      heartRate: {
        resting: null, // Resting HR jest w recovery, nie w cycle
        max: score.max_heart_rate || null,
        avg: score.average_heart_rate || null,
      },
      hrv: {
        value: null, // HRV jest w recovery
        trend: null,
      },
      strain: {
        value: score.strain || null,
        calories: score.kilojoule
          ? Math.round(score.kilojoule / 4.184) // kJ → kcal
          : null,
        activityMinutes: null, // WHOOP nie podaje bezpośrednio
      },
      activity: {
        steps: null, // WHOOP nie mierzy kroków
        distance: null,
        activeMinutes: null,
        calories: score.kilojoule
          ? Math.round(score.kilojoule / 4.184)
          : null,
        trainingLoad: null,
        vo2max: null,
      },
      stress: {
        avg: null, // WHOOP nie mierzy stresu jak Garmin
        max: null,
        restMinutes: null,
      },
      bodyBattery: {
        current: null, // WHOOP nie ma Body Battery — odpowiednikiem jest recovery score
        high: null,
        low: null,
      },
    };
  }

  _mapSleep(raw) {
    const score = raw.score || {};
    const stages = score.stage_summary || {};
    const milliToMin = (ms) => (ms ? Math.round(ms / 60000) : null);

    return {
      heartRate: {
        resting: null,
      },
      hrv: {
        value: null, // HRV jest w recovery
        trend: null,
      },
      sleep: {
        totalMinutes: milliToMin(stages.total_in_bed_time_milli),
        deepMinutes: milliToMin(stages.total_slow_wave_sleep_time_milli),
        remMinutes: milliToMin(stages.total_rem_sleep_time_milli),
        lightMinutes: milliToMin(stages.total_light_sleep_time_milli),
        awakeMinutes: milliToMin(stages.total_awake_time_milli),
        quality: score.sleep_performance_percentage || null,
        bedtime: raw.start || null,
        wakeTime: raw.end || null,
      },
    };
  }

  _mapRecovery(raw) {
    const score = raw.score || {};
    const recoveryScore = score.recovery_score || 0;

    let status = 'green';
    let recommendation = 'Organizm w pełni zregenerowany. Możesz trenować intensywnie.';

    if (recoveryScore >= 34 && recoveryScore < 67) {
      status = 'yellow';
      recommendation = 'Umiarkowana regeneracja. Zalecany lżejszy trening.';
    } else if (recoveryScore < 34) {
      status = 'red';
      recommendation = 'Niska regeneracja. Zalecany odpoczynek lub bardzo lekka aktywność.';
    }

    return {
      heartRate: {
        resting: score.resting_heart_rate || null,
      },
      hrv: {
        value: score.hrv_rmssd_milli
          ? Math.round(score.hrv_rmssd_milli)
          : null,
        trend: null,
      },
      sleep: {
        quality: null, // Jakość snu jest w sleep, nie w recovery
        totalMinutes: null,
      },
      recovery: {
        score: recoveryScore,
        status,
        recommendation,
      },
      bodyBattery: {
        current: null, // WHOOP nie ma Body Battery
        high: null,
        low: null,
      },
    };
  }

  _mapWorkout(raw) {
    const score = raw.score || {};
    return {
      heartRate: {
        resting: null,
        max: score.max_heart_rate || null,
        avg: score.average_heart_rate || null,
      },
      strain: {
        value: score.strain || null,
        calories: score.kilojoule
          ? Math.round(score.kilojoule / 4.184)
          : null,
        activityMinutes: raw.end && raw.start
          ? Math.round((new Date(raw.end) - new Date(raw.start)) / 60000)
          : null,
      },
      activity: {
        steps: null,
        distance: score.distance_meter
          ? Math.round((score.distance_meter / 1000) * 100) / 100
          : null,
        activeMinutes: raw.end && raw.start
          ? Math.round((new Date(raw.end) - new Date(raw.start)) / 60000)
          : null,
        calories: score.kilojoule
          ? Math.round(score.kilojoule / 4.184)
          : null,
        trainingLoad: null,
        vo2max: null,
      },
    };
  }
}
