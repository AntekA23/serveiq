import crypto from 'crypto';
import BaseWearableProvider from './baseProvider.js';

/**
 * Provider dla Garmin Health API.
 *
 * Garmin używa OAuth 1.0a (nie OAuth 2.0!) — wymaga consumer key/secret
 * oraz obsługi podpisów request.
 *
 * Dokumentacja: https://developer.garmin.com/gc-developer-program/overview/
 *
 * UWAGA: To jest szkielet implementacji. Prawdziwe wywołania API wymagają:
 * - Klucza consumer (GARMIN_CONSUMER_KEY)
 * - Sekretu consumer (GARMIN_CONSUMER_SECRET)
 * - Rejestracji w Garmin Health API Developer Program
 */

// Bazowe URL-e Garmin Health API (placeholdery)
const GARMIN_BASE_URL = 'https://apis.garmin.com';
const GARMIN_OAUTH_REQUEST_TOKEN = 'https://connectapi.garmin.com/oauth-service/oauth/request_token';
const GARMIN_OAUTH_AUTHORIZE = 'https://connect.garmin.com/oauthConfirm';
const GARMIN_OAUTH_ACCESS_TOKEN = 'https://connectapi.garmin.com/oauth-service/oauth/access_token';

// Endpointy danych zdrowotnych
const GARMIN_ENDPOINTS = {
  dailies: '/wellness-api/rest/dailies',           // Dzienne podsumowanie aktywności
  activities: '/wellness-api/rest/activities',       // Szczegóły aktywności/treningów
  sleeps: '/wellness-api/rest/sleeps',               // Dane snu
  bodyComps: '/wellness-api/rest/bodyComps',         // Skład ciała
  stressDetails: '/wellness-api/rest/stressDetails', // Dane stresu
  heartRate: '/wellness-api/rest/heartRate',         // Tętno w ciągu dnia
  pulseOx: '/wellness-api/rest/pulseOx',             // Saturacja tlenem
  respiration: '/wellness-api/rest/respiration',     // Oddychanie
};

export default class GarminProvider extends BaseWearableProvider {
  constructor() {
    super('garmin');
    this.consumerKey = process.env.GARMIN_CONSUMER_KEY || '';
    this.consumerSecret = process.env.GARMIN_CONSUMER_SECRET || '';
  }

  /**
   * Generuje URL autoryzacji OAuth 1.0a dla Garmin.
   *
   * Krok 1: Pobierz request token z Garmin
   * Krok 2: Przekieruj użytkownika na stronę autoryzacji Garmin
   *
   * TODO: Zaimplementować podpisywanie OAuth 1.0a (HMAC-SHA1)
   * TODO: Wywołać GARMIN_OAUTH_REQUEST_TOKEN aby uzyskać request token
   */
  getAuthUrl(playerId, redirectUri) {
    const state = crypto.randomBytes(16).toString('hex');

    // TODO: Pobierz request token z Garmin OAuth 1.0a
    // const requestToken = await this._getRequestToken(redirectUri);

    // Placeholder URL — w produkcji będzie zawierał prawdziwy request token
    const url = `${GARMIN_OAUTH_AUTHORIZE}?oauth_token=PLACEHOLDER_REQUEST_TOKEN&oauth_callback=${encodeURIComponent(redirectUri)}`;

    return {
      url,
      state,
      // W OAuth 1.0a przechowujemy request token secret zamiast code verifier
      codeVerifier: null,
      requestTokenSecret: null, // TODO: zapisać po uzyskaniu request token
    };
  }

  /**
   * Wymienia oauth_verifier na token dostępu.
   *
   * W OAuth 1.0a Garmin callback zwraca oauth_token i oauth_verifier.
   * Używamy ich razem z request token secret do uzyskania access token.
   *
   * TODO: Zaimplementować wymianę tokenu
   * Endpoint: POST GARMIN_OAUTH_ACCESS_TOKEN
   * Parametry: oauth_token, oauth_verifier (podpisane HMAC-SHA1)
   */
  async exchangeCode(code, codeVerifier) {
    // TODO: Implementacja wymiany kodu na token
    // const response = await fetch(GARMIN_OAUTH_ACCESS_TOKEN, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': this._buildOAuthHeader({
    //       oauth_token: code,
    //       oauth_verifier: codeVerifier,
    //     }),
    //   },
    // });

    console.warn('[GarminProvider] exchangeCode: brak klucza API — zwracam mock tokeny');
    return {
      accessToken: `garmin_mock_access_${Date.now()}`,
      refreshToken: `garmin_mock_refresh_${Date.now()}`,
      expiresIn: 0, // Garmin OAuth 1.0a tokeny nie wygasają (do odwołania)
    };
  }

  /**
   * Garmin OAuth 1.0a nie wymaga odświeżania tokenów — tokeny są ważne
   * do momentu odwołania przez użytkownika.
   *
   * Ta metoda zwraca istniejący token bez zmian.
   */
  async refreshAccessToken(refreshToken) {
    // Garmin OAuth 1.0a — tokeny nie wygasają
    console.warn('[GarminProvider] refreshAccessToken: Garmin OAuth 1.0a — tokeny nie wygasają');
    return {
      accessToken: refreshToken, // Zwracamy ten sam token
      refreshToken,
      expiresIn: 0,
    };
  }

  /**
   * Pobiera dzienne dane aktywności z Garmin Health API.
   *
   * Endpoint: GET /wellness-api/rest/dailies
   * Parametry: uploadStartTimeInSeconds, uploadEndTimeInSeconds
   *
   * Zwraca: kroki, kalorie, dystans, minuty aktywności, tętno,
   *         Body Battery, stres, HRV
   *
   * TODO: Zaimplementować prawdziwe wywołanie API
   */
  async fetchDailyData(accessToken, date) {
    // TODO: Implementacja prawdziwego wywołania
    // const startTime = Math.floor(date.getTime() / 1000);
    // const endTime = startTime + 86400;
    // const response = await fetch(
    //   `${GARMIN_BASE_URL}${GARMIN_ENDPOINTS.dailies}?uploadStartTimeInSeconds=${startTime}&uploadEndTimeInSeconds=${endTime}`,
    //   {
    //     headers: {
    //       'Authorization': this._buildOAuthHeader({ oauth_token: accessToken }),
    //     },
    //   }
    // );
    // return await response.json();

    console.warn('[GarminProvider] fetchDailyData: brak klucza API — brak danych');
    return null;
  }

  /**
   * Pobiera dane snu z Garmin Health API.
   *
   * Endpoint: GET /wellness-api/rest/sleeps
   * Parametry: uploadStartTimeInSeconds, uploadEndTimeInSeconds
   *
   * Zwraca: czas snu, fazy snu (deep, light, REM, awake),
   *         SpO2 podczas snu, HRV podczas snu
   *
   * TODO: Zaimplementować prawdziwe wywołanie API
   */
  async fetchSleepData(accessToken, date) {
    // TODO: Implementacja prawdziwego wywołania
    // const startTime = Math.floor(date.getTime() / 1000);
    // const endTime = startTime + 86400;
    // const response = await fetch(
    //   `${GARMIN_BASE_URL}${GARMIN_ENDPOINTS.sleeps}?uploadStartTimeInSeconds=${startTime}&uploadEndTimeInSeconds=${endTime}`,
    //   {
    //     headers: {
    //       'Authorization': this._buildOAuthHeader({ oauth_token: accessToken }),
    //     },
    //   }
    // );
    // return await response.json();

    console.warn('[GarminProvider] fetchSleepData: brak klucza API — brak danych');
    return null;
  }

  /**
   * Pobiera dane regeneracji z Garmin.
   *
   * Garmin nie ma dedykowanego endpointu "recovery" jak WHOOP.
   * Zamiast tego łączymy dane z:
   * - Body Battery (GARMIN_ENDPOINTS.dailies → bodyBattery)
   * - HRV (ze snu)
   * - Stress (GARMIN_ENDPOINTS.stressDetails)
   *
   * TODO: Zaimplementować agregację danych z wielu endpointów
   */
  async fetchRecoveryData(accessToken, date) {
    // TODO: Pobierz dane z wielu endpointów i agreguj
    // const [dailies, stress, sleep] = await Promise.all([
    //   this.fetchDailyData(accessToken, date),
    //   this._fetchStressData(accessToken, date),
    //   this.fetchSleepData(accessToken, date),
    // ]);
    // return { dailies, stress, sleep };

    console.warn('[GarminProvider] fetchRecoveryData: brak klucza API — brak danych');
    return null;
  }

  /**
   * Mapuje surowe dane z Garmin API na nasz schemat WearableData.
   *
   * Format Garmin (przykład dailies):
   * {
   *   "summaryId": "...",
   *   "steps": 8543,
   *   "distanceInMeters": 6800.5,
   *   "activeTimeInSeconds": 5400,
   *   "activeKilocalories": 2100,
   *   "restingHeartRateInBeatsPerMinute": 62,
   *   "maxHeartRateInBeatsPerMinute": 185,
   *   "averageHeartRateInBeatsPerMinute": 78,
   *   "bodyBatteryChargedValue": 85,
   *   "bodyBatteryDrainedValue": 32,
   *   "averageStressLevel": 35,
   *   "maxStressLevel": 72
   * }
   *
   * Mapowanie na nasz schemat:
   * - steps → activity.steps
   * - distanceInMeters / 1000 → activity.distance (km)
   * - activeTimeInSeconds / 60 → activity.activeMinutes
   * - activeKilocalories → activity.calories
   * - restingHeartRateInBeatsPerMinute → heartRate.resting
   * - maxHeartRateInBeatsPerMinute → heartRate.max
   * - averageHeartRateInBeatsPerMinute → heartRate.avg
   * - bodyBatteryChargedValue → bodyBattery.high
   * - bodyBatteryDrainedValue → bodyBattery.low
   * - averageStressLevel → stress.avg
   * - maxStressLevel → stress.max
   */
  mapToWearableData(rawData, type) {
    if (!rawData) return null;

    switch (type) {
      case 'daily_summary':
        return this._mapDailySummary(rawData);
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

  _mapDailySummary(raw) {
    return {
      heartRate: {
        resting: raw.restingHeartRateInBeatsPerMinute || null,
        max: raw.maxHeartRateInBeatsPerMinute || null,
        avg: raw.averageHeartRateInBeatsPerMinute || null,
      },
      hrv: {
        value: raw.hrvValue || null,
        trend: null, // Garmin nie podaje trendu bezpośrednio — obliczamy po stronie serwera
      },
      strain: {
        value: null, // Garmin nie ma pojęcia "strain" — mapujemy z Training Load
        calories: raw.activeKilocalories || null,
        activityMinutes: raw.activeTimeInSeconds
          ? Math.round(raw.activeTimeInSeconds / 60)
          : null,
      },
      activity: {
        steps: raw.steps || null,
        distance: raw.distanceInMeters
          ? Math.round((raw.distanceInMeters / 1000) * 100) / 100
          : null,
        activeMinutes: raw.activeTimeInSeconds
          ? Math.round(raw.activeTimeInSeconds / 60)
          : null,
        calories: raw.activeKilocalories || null,
        trainingLoad: raw.trainingLoadValue || null,
        vo2max: raw.vo2Max || null,
      },
      stress: {
        avg: raw.averageStressLevel || null,
        max: raw.maxStressLevel || null,
        restMinutes: raw.restStressDurationInSeconds
          ? Math.round(raw.restStressDurationInSeconds / 60)
          : null,
      },
      bodyBattery: {
        current: raw.bodyBatteryMostRecentValue || null,
        high: raw.bodyBatteryChargedValue || null,
        low: raw.bodyBatteryDrainedValue || null,
      },
    };
  }

  _mapSleep(raw) {
    return {
      heartRate: {
        resting: raw.restingHeartRateInBeatsPerMinute || null,
      },
      hrv: {
        value: raw.hrvValue || null,
        trend: null,
      },
      sleep: {
        totalMinutes: raw.durationInSeconds
          ? Math.round(raw.durationInSeconds / 60)
          : null,
        deepMinutes: raw.deepSleepDurationInSeconds
          ? Math.round(raw.deepSleepDurationInSeconds / 60)
          : null,
        remMinutes: raw.remSleepInSeconds
          ? Math.round(raw.remSleepInSeconds / 60)
          : null,
        lightMinutes: raw.lightSleepDurationInSeconds
          ? Math.round(raw.lightSleepDurationInSeconds / 60)
          : null,
        awakeMinutes: raw.awakeDurationInSeconds
          ? Math.round(raw.awakeDurationInSeconds / 60)
          : null,
        quality: raw.overallSleepScore || null,
        bedtime: raw.sleepStartTimestampLocal || null,
        wakeTime: raw.sleepEndTimestampLocal || null,
      },
    };
  }

  _mapRecovery(raw) {
    // Garmin nie ma dedykowanego "recovery score" — budujemy z Body Battery + HRV + Sleep
    const bodyBatteryHigh = raw.bodyBatteryChargedValue || 0;
    const sleepScore = raw.overallSleepScore || 0;

    // Prosta heurystyka: recovery = średnia z Body Battery high i jakości snu
    const recoveryScore = Math.round((bodyBatteryHigh + sleepScore) / 2);
    let status = 'green';
    let recommendation = 'Organizm w pełni zregenerowany. Możesz trenować intensywnie.';

    if (recoveryScore < 67 && recoveryScore >= 40) {
      status = 'yellow';
      recommendation = 'Umiarkowana regeneracja. Zalecany lżejszy trening.';
    } else if (recoveryScore < 40) {
      status = 'red';
      recommendation = 'Niska regeneracja. Zalecany odpoczynek lub bardzo lekka aktywność.';
    }

    return {
      heartRate: {
        resting: raw.restingHeartRateInBeatsPerMinute || null,
      },
      hrv: {
        value: raw.hrvValue || null,
        trend: null,
      },
      sleep: {
        quality: sleepScore || null,
        totalMinutes: raw.sleepDurationInSeconds
          ? Math.round(raw.sleepDurationInSeconds / 60)
          : null,
      },
      recovery: {
        score: recoveryScore,
        status,
        recommendation,
      },
      bodyBattery: {
        current: raw.bodyBatteryMostRecentValue || null,
        high: bodyBatteryHigh || null,
        low: raw.bodyBatteryDrainedValue || null,
      },
    };
  }

  _mapWorkout(raw) {
    return {
      heartRate: {
        resting: raw.restingHeartRateInBeatsPerMinute || null,
        max: raw.maxHeartRateInBeatsPerMinute || null,
        avg: raw.averageHeartRateInBeatsPerMinute || null,
      },
      strain: {
        value: null, // Garmin nie używa pojęcia "strain"
        calories: raw.activeKilocalories || null,
        activityMinutes: raw.durationInSeconds
          ? Math.round(raw.durationInSeconds / 60)
          : null,
      },
      activity: {
        steps: raw.steps || null,
        distance: raw.distanceInMeters
          ? Math.round((raw.distanceInMeters / 1000) * 100) / 100
          : null,
        activeMinutes: raw.durationInSeconds
          ? Math.round(raw.durationInSeconds / 60)
          : null,
        calories: raw.activeKilocalories || null,
        trainingLoad: raw.trainingLoadValue || null,
        vo2max: null,
      },
    };
  }

  // ====== Pomocnicze metody OAuth 1.0a ======

  /**
   * Buduje nagłówek OAuth 1.0a z podpisem HMAC-SHA1.
   *
   * TODO: Pełna implementacja po uzyskaniu kluczy API
   *
   * @param {object} params - Dodatkowe parametry OAuth (np. oauth_token)
   * @returns {string} Nagłówek Authorization
   */
  _buildOAuthHeader(params = {}) {
    // TODO: Implementacja podpisu HMAC-SHA1
    const baseParams = {
      oauth_consumer_key: this.consumerKey,
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_version: '1.0',
      ...params,
    };

    // TODO: Oblicz podpis i zwróć nagłówek
    return `OAuth ${Object.entries(baseParams)
      .map(([k, v]) => `${k}="${encodeURIComponent(v)}"`)
      .join(', ')}`;
  }
}
