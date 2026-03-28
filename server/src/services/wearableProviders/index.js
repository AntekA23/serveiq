import GarminProvider from './garminProvider.js';
import WhoopProvider from './whoopProvider.js';
import MockProvider from './mockProvider.js';

/**
 * Fabryka dostawców wearable.
 * Zwraca odpowiednią instancję providera na podstawie nazwy.
 *
 * W trybie demo lub przy braku kluczy API automatycznie
 * używany jest MockProvider jako fallback.
 *
 * @param {string} providerName - Nazwa dostawcy ('garmin', 'whoop', lub dowolna inna dla mock)
 * @returns {BaseWearableProvider} Instancja providera
 */
export function getProvider(providerName) {
  switch (providerName) {
    case 'garmin':
      return new GarminProvider();
    case 'whoop':
      return new WhoopProvider();
    default:
      return new MockProvider();
  }
}

/**
 * Sprawdza czy dany dostawca ma skonfigurowane klucze API.
 * Przydatne do decyzji czy użyć prawdziwego providera czy mock.
 *
 * @param {string} providerName - Nazwa dostawcy
 * @returns {boolean} true jeśli klucze API są skonfigurowane
 */
export function hasApiKeys(providerName) {
  switch (providerName) {
    case 'garmin':
      return !!(process.env.GARMIN_CONSUMER_KEY && process.env.GARMIN_CONSUMER_SECRET);
    case 'whoop':
      return !!(process.env.WHOOP_CLIENT_ID && process.env.WHOOP_CLIENT_SECRET);
    default:
      return false;
  }
}

/**
 * Zwraca providera z fallbackiem na mock, jeśli brak kluczy API.
 * To jest zalecany sposób uzyskiwania providera.
 *
 * @param {string} providerName - Nazwa dostawcy
 * @returns {BaseWearableProvider} Instancja providera (prawdziwy lub mock)
 */
export function getProviderWithFallback(providerName) {
  if (hasApiKeys(providerName)) {
    return getProvider(providerName);
  }

  console.warn(
    `[WearableProviders] Brak kluczy API dla "${providerName}" — używam MockProvider`
  );
  return new MockProvider();
}

export { GarminProvider, WhoopProvider, MockProvider };
