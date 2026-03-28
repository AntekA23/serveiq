import Notification from '../models/Notification.js';
import Player from '../models/Player.js';
import User from '../models/User.js';
import WearableData from '../models/WearableData.js';
import WearableDevice from '../models/WearableDevice.js';
import { io } from '../index.js';

/**
 * Oblicza srednia wartosci z tablicy
 */
function avg(arr) {
  if (!arr.length) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Sprawdza czy teraz jest w godzinach ciszy uzytkownika
 */
function isQuietHours(settings) {
  if (!settings?.quietHoursStart || !settings?.quietHoursEnd) return false;

  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const current = hours * 60 + minutes;

  const [startH, startM] = settings.quietHoursStart.split(':').map(Number);
  const [endH, endM] = settings.quietHoursEnd.split(':').map(Number);
  const start = startH * 60 + startM;
  const end = endH * 60 + endM;

  if (start <= end) {
    return current >= start && current < end;
  }
  // Przechodzi przez polnoc (np. 22:00 - 07:00)
  return current >= start || current < end;
}

/**
 * Sprawdza czy powiadomienie danego typu zostalo juz utworzone w ciagu ostatnich 24h
 */
async function isDuplicate(userId, type, playerId) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const existing = await Notification.findOne({
    user: userId,
    type,
    player: playerId,
    createdAt: { $gte: since },
  });
  return !!existing;
}

/**
 * Tworzy powiadomienie i emituje event socket
 */
async function createAlert({ userId, type, title, body, severity, playerId, actionUrl, metadata }) {
  const notification = await Notification.create({
    user: userId,
    type,
    title,
    body,
    severity,
    player: playerId,
    actionUrl,
    metadata,
  });

  // Wyslij real-time event przez socket
  if (io) {
    io.to(userId.toString()).emit('notification', {
      _id: notification._id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      severity: notification.severity,
      read: notification.read,
      player: playerId,
      actionUrl: notification.actionUrl,
      createdAt: notification.createdAt,
    });
  }

  return notification;
}

/**
 * Ewaluuje alerty zdrowotne dla danego zawodnika.
 * 1. Znajduje rodzicow zawodnika
 * 2. Pobiera najnowsze dane z wearable (dzisiaj)
 * 3. Pobiera srednie z 7 dni do wykrywania trendow
 * 4. Sprawdza reguly vs notificationSettings kazdego rodzica
 * 5. Deduplikuje (nie tworzy tego samego alertu w ciagu 24h)
 * 6. Tworzy dokumenty Notification
 * 7. Emituje socket event
 * 8. Zwraca utworzone powiadomienia
 */
export async function evaluateAlerts(playerId) {
  const player = await Player.findById(playerId);
  if (!player || !player.active) return [];

  // Znajdz rodzicow tego zawodnika
  const parents = await User.find({
    _id: { $in: player.parents },
    isActive: true,
    role: 'parent',
  });

  if (!parents.length) return [];

  // Najnowsze dane daily_summary (dzisiaj lub ostatni dostepny dzien)
  const latestData = await WearableData.findOne({
    player: playerId,
    type: 'daily_summary',
  }).sort({ date: -1 });

  if (!latestData?.metrics) return [];

  const metrics = latestData.metrics;

  // Dane z ostatnich 7 dni do trendow
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const recentData = await WearableData.find({
    player: playerId,
    type: 'daily_summary',
    date: { $gte: sevenDaysAgo },
  }).sort({ date: -1 });

  const previousData = await WearableData.find({
    player: playerId,
    type: 'daily_summary',
    date: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
  }).sort({ date: -1 });

  // Srednie z 7 dni
  const recentHRV = avg(recentData.filter(d => d.metrics?.hrv?.value).map(d => d.metrics.hrv.value));
  const previousHRV = avg(previousData.filter(d => d.metrics?.hrv?.value).map(d => d.metrics.hrv.value));

  const recentHR = avg(recentData.filter(d => d.metrics?.heartRate?.resting).map(d => d.metrics.heartRate.resting));
  const previousHR = avg(previousData.filter(d => d.metrics?.heartRate?.resting).map(d => d.metrics.heartRate.resting));

  const playerName = `${player.firstName} ${player.lastName}`;
  const created = [];

  for (const parent of parents) {
    const settings = parent.notificationSettings || {};

    // Sprawdz godziny ciszy
    if (isQuietHours(settings)) continue;

    // Sprawdz czy push notifications wlaczone
    if (settings.pushNotifications === false) continue;

    const userId = parent._id;
    const criticalThreshold = settings.recoveryThresholdCritical ?? 33;
    const warningThreshold = settings.recoveryThresholdWarning ?? 50;
    const minSleep = settings.minSleepHours ?? 6;
    const hrvDrop = settings.hrvDropThreshold ?? 15;

    const recoveryScore = metrics.recovery?.score;
    const sleepMinutes = metrics.sleep?.totalMinutes;
    const actionUrl = `/parent/player/${playerId}/health`;

    // --- Reguła 1: Recovery < critical ---
    if (recoveryScore != null && recoveryScore < criticalThreshold) {
      if (!(await isDuplicate(userId, 'recovery_low', playerId))) {
        const n = await createAlert({
          userId,
          type: 'recovery_low',
          title: `Krytyczna regeneracja - ${playerName}`,
          body: `Wynik regeneracji: ${recoveryScore}%. Zalecany odpoczynek i lzejszy trening.`,
          severity: 'critical',
          playerId,
          actionUrl,
          metadata: { recoveryScore },
        });
        created.push(n);
      }
    }
    // --- Reguła 2: Recovery < warning (ale >= critical) ---
    else if (recoveryScore != null && recoveryScore < warningThreshold) {
      if (!(await isDuplicate(userId, 'recovery_low', playerId))) {
        const n = await createAlert({
          userId,
          type: 'recovery_low',
          title: `Niska regeneracja - ${playerName}`,
          body: `Wynik regeneracji: ${recoveryScore}%. Zalecany umiarkowany trening.`,
          severity: 'warning',
          playerId,
          actionUrl,
          metadata: { recoveryScore },
        });
        created.push(n);
      }
    }
    // --- Reguła 3: Recovery > 85 (swietna regeneracja) ---
    else if (recoveryScore != null && recoveryScore > 85) {
      if (!(await isDuplicate(userId, 'recovery_high', playerId))) {
        const n = await createAlert({
          userId,
          type: 'recovery_high',
          title: `Swietna regeneracja - ${playerName}`,
          body: `Wynik regeneracji: ${recoveryScore}%. Organizm gotowy na intensywny trening!`,
          severity: 'info',
          playerId,
          actionUrl,
          metadata: { recoveryScore },
        });
        created.push(n);
      }
    }

    // --- Reguła 4: Sleep < minSleepHours ---
    if (sleepMinutes != null) {
      const sleepHours = sleepMinutes / 60;
      if (sleepHours < minSleep) {
        if (!(await isDuplicate(userId, 'health_alert', playerId))) {
          const n = await createAlert({
            userId,
            type: 'health_alert',
            title: `Za malo snu - ${playerName}`,
            body: `Czas snu: ${Math.floor(sleepHours)}h ${Math.round(sleepMinutes % 60)}min (minimum: ${minSleep}h). Niewystarczajacy sen moze wplynac na regeneracje.`,
            severity: 'warning',
            playerId,
            actionUrl,
            metadata: { sleepMinutes, minSleepHours: minSleep },
          });
          created.push(n);
        }
      }
    }

    // --- Reguła 5: HRV 7-day drop > hrvDropThreshold% ---
    if (recentHRV != null && previousHRV != null && previousHRV > 0) {
      const dropPct = ((previousHRV - recentHRV) / previousHRV) * 100;
      if (dropPct > hrvDrop) {
        if (!(await isDuplicate(userId, 'health_alert', playerId))) {
          const n = await createAlert({
            userId,
            type: 'health_alert',
            title: `Spadek HRV - ${playerName}`,
            body: `HRV spadlo o ${Math.round(dropPct)}% w ciagu ostatniego tygodnia (${Math.round(previousHRV)} -> ${Math.round(recentHRV)} ms). Moze wskazywac na przemeczenie.`,
            severity: 'warning',
            playerId,
            actionUrl,
            metadata: { recentHRV: Math.round(recentHRV), previousHRV: Math.round(previousHRV), dropPct: Math.round(dropPct) },
          });
          created.push(n);
        }
      }
    }

    // --- Reguła 6: Resting HR 7-day rise > 10% ---
    if (recentHR != null && previousHR != null && previousHR > 0) {
      const risePct = ((recentHR - previousHR) / previousHR) * 100;
      if (risePct > 10) {
        if (!(await isDuplicate(userId, 'health_alert', playerId))) {
          const n = await createAlert({
            userId,
            type: 'health_alert',
            title: `Wzrost tetna spoczynkowego - ${playerName}`,
            body: `Tetno spoczynkowe wzroslo o ${Math.round(risePct)}% w ciagu tygodnia (${Math.round(previousHR)} -> ${Math.round(recentHR)} bpm). Warto obserwowac.`,
            severity: 'warning',
            playerId,
            actionUrl,
            metadata: { recentHR: Math.round(recentHR), previousHR: Math.round(previousHR), risePct: Math.round(risePct) },
          });
          created.push(n);
        }
      }
    }
  }

  return created;
}

/**
 * Sprawdza urzadzenia ktore nie synchronizowaly sie przez 24h.
 * Tworzy ostrzezenie dla rodzicow.
 */
export async function checkDeviceSync() {
  const staleThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const staleDevices = await WearableDevice.find({
    connected: true,
    lastSyncAt: { $lt: staleThreshold },
  }).populate('player', 'firstName lastName');

  const created = [];

  for (const device of staleDevices) {
    if (!device.player) continue;

    const playerName = `${device.player.firstName} ${device.player.lastName}`;

    if (!(await isDuplicate(device.parent, 'device_disconnected', device.player._id))) {
      const n = await createAlert({
        userId: device.parent,
        type: 'device_disconnected',
        title: `Brak synchronizacji - ${device.deviceName}`,
        body: `Urzadzenie ${device.deviceName} (${playerName}) nie synchronizowalo sie od ponad 24 godzin. Sprawdz polaczenie.`,
        severity: 'warning',
        playerId: device.player._id,
        actionUrl: '/parent/devices',
        metadata: { deviceId: device._id, provider: device.provider },
      });
      created.push(n);
    }
  }

  return created;
}

/**
 * Sprawdza czy cele zawodnika zostaly wlasnie osiagniete.
 * Tworzy powiadomienie info dla rodzicow.
 */
export async function checkGoalCompletion(playerId) {
  const player = await Player.findById(playerId);
  if (!player || !player.active) return [];

  const parents = await User.find({
    _id: { $in: player.parents },
    isActive: true,
    role: 'parent',
  });

  if (!parents.length) return [];

  const recentlyCompleted = (player.goals || []).filter((g) => {
    if (!g.completed || !g.completedAt) return false;
    const completedTime = new Date(g.completedAt).getTime();
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return completedTime > oneDayAgo;
  });

  const created = [];
  const playerName = `${player.firstName} ${player.lastName}`;

  for (const goal of recentlyCompleted) {
    for (const parent of parents) {
      if (!(await isDuplicate(parent._id, 'milestone', playerId))) {
        const n = await createAlert({
          userId: parent._id,
          type: 'milestone',
          title: `Cel osiagniety - ${playerName}`,
          body: `${playerName} osiagnal cel: "${goal.text}". Gratulacje!`,
          severity: 'info',
          playerId,
          actionUrl: `/parent/player/${playerId}`,
          metadata: { goalId: goal._id, goalText: goal.text },
        });
        created.push(n);
      }
    }
  }

  return created;
}
