/**
 * Abstrakcyjna klasa bazowa dla dostawców urządzeń wearable.
 * Każdy dostawca (Garmin, WHOOP, Mock) musi implementować wszystkie metody.
 */
export default class BaseWearableProvider {
  constructor(name) {
    this.name = name;
  }

  /**
   * Generuje URL autoryzacji OAuth dla danego gracza.
   * @param {string} playerId - ID zawodnika
   * @param {string} redirectUri - URI przekierowania po autoryzacji
   * @returns {object} { url, state, codeVerifier? }
   */
  getAuthUrl(playerId, redirectUri) {
    throw new Error('Nie zaimplementowano: getAuthUrl');
  }

  /**
   * Wymienia kod autoryzacyjny na tokeny dostępu.
   * @param {string} code - Kod autoryzacyjny z callbacku OAuth
   * @param {string} codeVerifier - Weryfikator PKCE (jeśli wymagany)
   * @returns {Promise<object>} { accessToken, refreshToken, expiresIn }
   */
  async exchangeCode(code, codeVerifier) {
    throw new Error('Nie zaimplementowano: exchangeCode');
  }

  /**
   * Odświeża token dostępu przy użyciu refresh tokenu.
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<object>} { accessToken, refreshToken, expiresIn }
   */
  async refreshAccessToken(refreshToken) {
    throw new Error('Nie zaimplementowano: refreshAccessToken');
  }

  /**
   * Pobiera dane dzienne (aktywność, tętno, kroki itp.).
   * @param {string} accessToken - Token dostępu
   * @param {Date} date - Data, za którą pobieramy dane
   * @returns {Promise<object>} Surowe dane z API dostawcy
   */
  async fetchDailyData(accessToken, date) {
    throw new Error('Nie zaimplementowano: fetchDailyData');
  }

  /**
   * Pobiera dane snu.
   * @param {string} accessToken - Token dostępu
   * @param {Date} date - Data, za którą pobieramy dane
   * @returns {Promise<object>} Surowe dane snu z API dostawcy
   */
  async fetchSleepData(accessToken, date) {
    throw new Error('Nie zaimplementowano: fetchSleepData');
  }

  /**
   * Pobiera dane regeneracji/recovery.
   * @param {string} accessToken - Token dostępu
   * @param {Date} date - Data, za którą pobieramy dane
   * @returns {Promise<object>} Surowe dane regeneracji z API dostawcy
   */
  async fetchRecoveryData(accessToken, date) {
    throw new Error('Nie zaimplementowano: fetchRecoveryData');
  }

  /**
   * Mapuje surowe dane z API dostawcy na nasz schemat WearableData.
   * @param {object} rawData - Surowe dane z API
   * @param {string} type - Typ danych ('daily_summary', 'sleep', 'recovery', 'workout')
   * @returns {object} Dane w formacie metrics naszego schematu WearableData
   */
  mapToWearableData(rawData, type) {
    throw new Error('Nie zaimplementowano: mapToWearableData');
  }
}
