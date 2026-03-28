/**
 * Serwis generujący realistyczne dane mock dla urządzeń WHOOP i Garmin.
 * Dane są deterministyczne - ten sam playerId + data zawsze dają te same wyniki.
 */

// ====== Deterministyczny generator pseudolosowy (seeded) ======

function seededRandom(seed) {
  // Simple mulberry32 PRNG
  let t = seed | 0;
  return function () {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(playerId, dateStr) {
  const str = `${playerId}-${dateStr}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

function randomInRange(rng, min, max) {
  return min + rng() * (max - min);
}

function randomInt(rng, min, max) {
  return Math.floor(randomInRange(rng, min, max + 1));
}

// ====== Pomocnicze ======

function isTrainingDay(date) {
  const day = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  // Treningi: Pon(1), Śr(3), Pt(5), Sob(6)
  return [1, 3, 5, 6].includes(day);
}

function formatTime(hours, minutes) {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// ====== Generowanie metryk ======

function generateSleepMetrics(rng, training) {
  // Młodzi tenisiści 12-16 lat: 7-9.5h snu
  const totalMinutes = randomInt(rng, 420, 570); // 7h - 9.5h
  const awakeMinutes = randomInt(rng, 5, 30);
  const sleepMinutes = totalMinutes - awakeMinutes;

  // Rozkład faz snu (realistyczny)
  const deepPct = randomInRange(rng, 0.15, 0.25);
  const remPct = randomInRange(rng, 0.2, 0.28);
  const lightPct = 1 - deepPct - remPct;

  const deepMinutes = Math.round(sleepMinutes * deepPct);
  const remMinutes = Math.round(sleepMinutes * remPct);
  const lightMinutes = sleepMinutes - deepMinutes - remMinutes;

  // Jakość snu koreluje z głębokim snem i czasem
  const durationFactor = Math.min(totalMinutes / 540, 1); // 9h = max
  const deepFactor = deepPct / 0.25;
  const quality = Math.round(Math.min(100, Math.max(60, (durationFactor * 0.5 + deepFactor * 0.5) * 100 * randomInRange(rng, 0.85, 1.05))));

  // Pora snu - po treningu wcześniej do łóżka
  const bedHour = training ? randomInt(rng, 21, 22) : randomInt(rng, 21, 23);
  const bedMin = randomInt(rng, 0, 59);
  const wakeHour = randomInt(rng, 6, 7);
  const wakeMin = randomInt(rng, 0, 45);

  return {
    totalMinutes,
    deepMinutes,
    remMinutes,
    lightMinutes,
    awakeMinutes,
    quality,
    bedtime: formatTime(bedHour, bedMin),
    wakeTime: formatTime(wakeHour, wakeMin),
  };
}

function generateHeartRateMetrics(rng, training) {
  // 12-16 lat: tętno spoczynkowe 55-68
  const resting = randomInt(rng, 55, 68);
  const max = training ? randomInt(rng, 175, 198) : randomInt(rng, 120, 155);
  const avg = training ? randomInt(rng, 85, 110) : randomInt(rng, 68, 85);

  return { resting, max, avg };
}

function generateHrvMetrics(rng, sleepQuality) {
  // HRV koreluje z jakością snu
  const baseHrv = randomInRange(rng, 55, 95);
  const sleepBonus = ((sleepQuality - 70) / 30) * 10;
  const value = Math.round(Math.min(95, Math.max(55, baseHrv + sleepBonus)));

  const trendRoll = rng();
  const trend = trendRoll < 0.33 ? 'up' : trendRoll < 0.66 ? 'stable' : 'down';

  return { value, trend };
}

function generateRecoveryMetrics(rng, sleepQuality, hrvValue) {
  // Recovery koreluje z jakością snu i HRV
  const sleepFactor = sleepQuality / 100;
  const hrvFactor = (hrvValue - 55) / 40;
  const baseScore = (sleepFactor * 0.5 + hrvFactor * 0.5) * 100;
  const score = Math.round(Math.min(98, Math.max(30, baseScore * randomInRange(rng, 0.85, 1.15))));

  let status;
  let recommendation;
  if (score >= 67) {
    status = 'green';
    recommendation = 'Organizm w pełni zregenerowany. Możesz trenować intensywnie.';
  } else if (score >= 40) {
    status = 'yellow';
    recommendation = 'Umiarkowana regeneracja. Zalecany lżejszy trening.';
  } else {
    status = 'red';
    recommendation = 'Niska regeneracja. Zalecany odpoczynek lub bardzo lekka aktywność.';
  }

  return { score, status, recommendation };
}

function generateStrainMetrics(rng, training) {
  // Strain: 5-18 w dni treningowe, 2-8 w dni wolne
  const value = training
    ? Math.round(randomInRange(rng, 5, 18) * 10) / 10
    : Math.round(randomInRange(rng, 2, 8) * 10) / 10;

  const calories = training ? randomInt(rng, 1800, 3200) : randomInt(rng, 1200, 1800);
  const activityMinutes = training ? randomInt(rng, 90, 180) : randomInt(rng, 20, 60);

  return { value, calories, activityMinutes };
}

function generateActivityMetrics(rng, training) {
  const steps = training ? randomInt(rng, 8000, 15000) : randomInt(rng, 5000, 9000);
  const distance = Math.round((steps * 0.0007) * 100) / 100; // ~0.7m per step -> km
  const activeMinutes = training ? randomInt(rng, 90, 180) : randomInt(rng, 20, 60);
  const calories = training ? randomInt(rng, 1800, 3200) : randomInt(rng, 1200, 1800);
  const trainingLoad = training ? randomInt(rng, 150, 450) : randomInt(rng, 20, 80);
  const vo2max = randomInt(rng, 42, 55); // dobry poziom dla młodego sportowca

  return { steps, distance, activeMinutes, calories, trainingLoad, vo2max };
}

function generateStressMetrics(rng, training) {
  const avg = training ? randomInt(rng, 35, 55) : randomInt(rng, 20, 40);
  const max = training ? randomInt(rng, 70, 95) : randomInt(rng, 45, 70);
  const restMinutes = training ? randomInt(rng, 180, 360) : randomInt(rng, 360, 600);

  return { avg, max, restMinutes };
}

function generateBodyBatteryMetrics(rng, sleepQuality, training) {
  // Body Battery koreluje z jakością snu i obciążeniem treningowym
  const high = Math.round(Math.min(95, Math.max(50, sleepQuality * randomInRange(rng, 0.85, 1.05))));
  const low = training ? randomInt(rng, 25, 45) : randomInt(rng, 40, 60);
  const current = randomInt(rng, low, high);

  return { current, high, low };
}

// ====== Główne funkcje eksportowane ======

/**
 * Generuje dane za jeden dzień dla danego zawodnika/urządzenia.
 */
export function generateDailyData(playerId, deviceId, provider, date) {
  const dateStr = date.toISOString().split('T')[0];
  const seed = hashSeed(playerId, dateStr);
  const rng = seededRandom(seed);

  const training = isTrainingDay(date);
  const sleep = generateSleepMetrics(rng, training);
  const heartRate = generateHeartRateMetrics(rng, training);
  const hrv = generateHrvMetrics(rng, sleep.quality);
  const recovery = generateRecoveryMetrics(rng, sleep.quality, hrv.value);
  const strain = generateStrainMetrics(rng, training);
  const activity = generateActivityMetrics(rng, training);
  const stress = generateStressMetrics(rng, training);
  const bodyBattery = generateBodyBatteryMetrics(rng, sleep.quality, training);

  const baseRecord = {
    player: playerId,
    device: deviceId,
    provider,
    date: new Date(dateStr),
  };

  // Generuj 4 typy rekordów dziennych
  const records = [
    {
      ...baseRecord,
      type: 'daily_summary',
      metrics: {
        heartRate,
        hrv,
        strain,
        activity,
        stress,
        bodyBattery,
      },
    },
    {
      ...baseRecord,
      type: 'sleep',
      metrics: {
        heartRate: { resting: heartRate.resting },
        hrv,
        sleep,
      },
    },
    {
      ...baseRecord,
      type: 'recovery',
      metrics: {
        heartRate: { resting: heartRate.resting },
        hrv,
        sleep: { quality: sleep.quality, totalMinutes: sleep.totalMinutes },
        recovery,
        bodyBattery,
      },
    },
  ];

  // Dodaj workout tylko w dni treningowe
  if (training) {
    records.push({
      ...baseRecord,
      type: 'workout',
      metrics: {
        heartRate,
        strain,
        activity,
      },
    });
  }

  return records;
}

/**
 * Generuje dane historyczne za N dni (domyślnie 30).
 */
export function generateHistoricalData(playerId, deviceId, provider, days = 30) {
  const allRecords = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const dailyRecords = generateDailyData(playerId, deviceId, provider, date);
    allRecords.push(...dailyRecords);
  }

  return allRecords;
}

/**
 * Generuje aktualne metryki (ostatni pomiar) - losowe ale realistyczne.
 */
export function generateLatestMetrics(provider) {
  const now = new Date();
  const seed = hashSeed('latest', now.toISOString().split('T')[0]);
  const rng = seededRandom(seed);

  const training = isTrainingDay(now);

  const metrics = {
    heartRate: generateHeartRateMetrics(rng, training),
    hrv: generateHrvMetrics(rng, 75),
    recovery: generateRecoveryMetrics(rng, 75, 70),
    strain: generateStrainMetrics(rng, training),
    activity: generateActivityMetrics(rng, training),
  };

  if (provider === 'garmin') {
    metrics.stress = generateStressMetrics(rng, training);
    metrics.bodyBattery = generateBodyBatteryMetrics(rng, 75, training);
  }

  return metrics;
}
