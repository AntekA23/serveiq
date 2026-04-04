import Notification from '../models/Notification.js';
import Player from '../models/Player.js';
import User from '../models/User.js';
import { io } from '../index.js';

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
      if (!(await isDuplicate(parent._id, 'goal_completed', playerId))) {
        const n = await createAlert({
          userId: parent._id,
          type: 'goal_completed',
          title: `Cel osiagniety - ${playerName}`,
          body: `${playerName} osiagnal cel: "${goal.text}". Gratulacje!`,
          severity: 'info',
          playerId,
          actionUrl: `/parent/child/${playerId}`,
          metadata: { goalId: goal._id, goalText: goal.text },
        });
        created.push(n);
      }
    }
  }

  return created;
}
