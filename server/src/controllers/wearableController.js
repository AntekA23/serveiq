import crypto from 'crypto';
import { z } from 'zod';
import WearableDevice from '../models/WearableDevice.js';
import WearableData from '../models/WearableData.js';
import Player from '../models/Player.js';
import {
  generateDailyData,
  generateHistoricalData,
  generateLatestMetrics,
} from '../services/wearableMockService.js';

// ====== Zod Schemas ======

const connectDeviceSchema = z.object({
  playerId: z.string().min(1, 'ID zawodnika jest wymagane'),
  provider: z.enum(['whoop', 'garmin'], {
    message: 'Dostawca musi być "whoop" lub "garmin"',
  }),
  deviceName: z.string().min(1, 'Nazwa urządzenia jest wymagana'),
});

const getPlayerDataSchema = z.object({
  type: z
    .enum(['daily_summary', 'workout', 'sleep', 'recovery'], {
      message: 'Typ musi być "daily_summary", "workout", "sleep" lub "recovery"',
    })
    .optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

// ====== Helpers ======

/**
 * Sprawdza czy rodzic ma dostęp do danego zawodnika (jest w parents[])
 */
async function verifyParentAccess(parentId, playerId) {
  const player = await Player.findOne({
    _id: playerId,
    parents: parentId,
    active: true,
  });
  return player;
}

/**
 * Pobiera ID dzieci rodzica
 */
async function getParentChildrenIds(parentId) {
  const players = await Player.find({
    parents: parentId,
    active: true,
  }).select('_id');
  return players.map((p) => p._id);
}

// ====== Kontrolery ======

/**
 * GET /api/wearables
 * Lista urządzeń podłączonych do dzieci rodzica
 */
export const getDevices = async (req, res, next) => {
  try {
    const childrenIds = await getParentChildrenIds(req.user._id);

    const devices = await WearableDevice.find({
      player: { $in: childrenIds },
      parent: req.user._id,
    })
      .populate('player', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({ devices });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/wearables
 * Podłącz nowe urządzenie (mock) - tworzy WearableDevice + generuje 30 dni danych
 */
export const connectDevice = async (req, res, next) => {
  try {
    const data = connectDeviceSchema.parse(req.body);

    // Sprawdź czy rodzic ma dostęp do zawodnika
    const player = await verifyParentAccess(req.user._id, data.playerId);
    if (!player) {
      return res.status(403).json({
        message: 'Brak dostępu do tego zawodnika',
      });
    }

    // Sprawdź czy urządzenie tego dostawcy nie jest już podłączone
    const existing = await WearableDevice.findOne({
      player: data.playerId,
      provider: data.provider,
      connected: true,
    });

    if (existing) {
      return res.status(400).json({
        message: `Urządzenie ${data.provider.toUpperCase()} jest już podłączone do tego zawodnika`,
      });
    }

    // Utwórz mock device ID
    const deviceId = `${data.provider.toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const device = await WearableDevice.create({
      player: data.playerId,
      parent: req.user._id,
      provider: data.provider,
      deviceName: data.deviceName,
      deviceId,
      connected: true,
      lastSyncAt: new Date(),
      battery: Math.floor(Math.random() * 40) + 60, // 60-100%
      settings: {
        syncInterval: 15,
        notifications: true,
      },
    });

    // Generuj 30 dni danych historycznych
    const historicalRecords = generateHistoricalData(
      data.playerId,
      device._id.toString(),
      data.provider,
      30
    );

    await WearableData.insertMany(historicalRecords);

    const populatedDevice = await WearableDevice.findById(device._id).populate(
      'player',
      'firstName lastName'
    );

    res.status(201).json({
      message: 'Urządzenie zostało podłączone',
      device: populatedDevice,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/wearables/:id
 * Odłącz urządzenie
 */
export const disconnectDevice = async (req, res, next) => {
  try {
    const device = await WearableDevice.findOne({
      _id: req.params.id,
      parent: req.user._id,
      connected: true,
    });

    if (!device) {
      return res.status(404).json({
        message: 'Urządzenie nie znalezione',
      });
    }

    device.connected = false;
    await device.save();

    res.json({
      message: 'Urządzenie zostało odłączone',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/wearables/:id/sync
 * Synchronizuj urządzenie (mock) - generuje dane za dzisiaj
 */
export const syncDevice = async (req, res, next) => {
  try {
    const device = await WearableDevice.findOne({
      _id: req.params.id,
      parent: req.user._id,
      connected: true,
    });

    if (!device) {
      return res.status(404).json({
        message: 'Urządzenie nie znalezione lub nie jest podłączone',
      });
    }

    // Generuj dane za dzisiaj
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Usuń istniejące dane za dzisiaj (aby uniknąć duplikatów przy ponownej synchronizacji)
    await WearableData.deleteMany({
      device: device._id,
      date: today,
    });

    const todayRecords = generateDailyData(
      device.player.toString(),
      device._id.toString(),
      device.provider,
      today
    );

    await WearableData.insertMany(todayRecords);

    // Aktualizuj status synchronizacji
    device.lastSyncAt = new Date();
    device.battery = Math.max(0, device.battery - Math.floor(Math.random() * 3)); // Symulacja zużycia baterii
    await device.save();

    res.json({
      message: 'Synchronizacja zakończona',
      lastSyncAt: device.lastSyncAt,
      battery: device.battery,
      recordsGenerated: todayRecords.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/wearables/data/:playerId
 * Pobierz dane z urządzenia dla zawodnika (z filtrami type, from, to)
 */
export const getPlayerData = async (req, res, next) => {
  try {
    const { playerId } = req.params;

    // Sprawdź dostęp rodzica
    const player = await verifyParentAccess(req.user._id, playerId);
    if (!player) {
      return res.status(403).json({
        message: 'Brak dostępu do danych tego zawodnika',
      });
    }

    const filters = getPlayerDataSchema.parse(req.query);

    const query = { player: playerId };

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.from || filters.to) {
      query.date = {};
      if (filters.from) query.date.$gte = new Date(filters.from);
      if (filters.to) query.date.$lte = new Date(filters.to);
    }

    const data = await WearableData.find(query)
      .populate('device', 'provider deviceName deviceId')
      .sort({ date: -1 })
      .limit(100);

    res.json({ data });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/wearables/data/:playerId/latest
 * Pobierz najnowsze dane z urządzenia dla zawodnika
 */
export const getLatestData = async (req, res, next) => {
  try {
    const { playerId } = req.params;

    // Sprawdź dostęp rodzica
    const player = await verifyParentAccess(req.user._id, playerId);
    if (!player) {
      return res.status(403).json({
        message: 'Brak dostępu do danych tego zawodnika',
      });
    }

    // Pobierz najnowszy rekord każdego typu
    const types = ['daily_summary', 'workout', 'sleep', 'recovery'];

    const latestByType = await Promise.all(
      types.map((type) =>
        WearableData.findOne({ player: playerId, type })
          .populate('device', 'provider deviceName deviceId')
          .sort({ date: -1 })
      )
    );

    const latest = {};
    types.forEach((type, i) => {
      if (latestByType[i]) {
        latest[type] = latestByType[i];
      }
    });

    // Pobierz też podłączone urządzenia zawodnika
    const devices = await WearableDevice.find({
      player: playerId,
      parent: req.user._id,
      connected: true,
    }).select('provider deviceName deviceId battery lastSyncAt');

    res.json({ latest, devices });
  } catch (error) {
    next(error);
  }
};
