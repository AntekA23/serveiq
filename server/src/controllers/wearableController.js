import crypto from 'crypto';
import { z } from 'zod';
import WearableDevice from '../models/WearableDevice.js';
import WearableData from '../models/WearableData.js';
import Player from '../models/Player.js';
import {
  generateDailyData,
  generateHistoricalData,
} from '../services/wearableMockService.js';
import {
  getProvider,
  getProviderWithFallback,
  hasApiKeys,
} from '../services/wearableProviders/index.js';

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

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

/**
 * Sprawdza czy uzytkownik ma dostep do danego zawodnika
 * Rodzic: jest w parents[]. Trener: jest coachem zawodnika.
 */
async function verifyPlayerAccess(user, playerId) {
  if (user.role === 'coach') {
    return Player.findOne({ _id: playerId, coach: user._id, active: true });
  }
  return Player.findOne({ _id: playerId, parents: user._id, active: true });
}

// Legacy alias
async function verifyParentAccess(parentId, playerId) {
  return Player.findOne({ _id: playerId, parents: parentId, active: true });
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

// ====== Kontrolery — urządzenia ======

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
 * Podłącz nowe urządzenie — używa provider pattern.
 * Jeśli brak kluczy API, automatycznie tworzy urządzenie w trybie mock
 * z wygenerowanymi danymi historycznymi (30 dni).
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

    // Użyj provider pattern z fallbackiem na mock
    const provider = getProviderWithFallback(data.provider);

    // Utwórz device ID
    const deviceId = `${data.provider.toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const device = await WearableDevice.create({
      player: data.playerId,
      parent: req.user._id,
      provider: data.provider,
      deviceName: data.deviceName,
      deviceId,
      connected: true,
      authState: 'connected',
      lastSyncAt: new Date(),
      battery: Math.floor(Math.random() * 40) + 60, // 60-100%
      settings: {
        syncInterval: 15,
        notifications: true,
      },
    });

    // Generuj 30 dni danych historycznych (mock)
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
    device.authState = 'expired';
    device.accessToken = null;
    device.refreshToken = null;
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
 * Synchronizuj urządzenie — używa provider pattern.
 * Generuje dane za dzisiaj z odpowiedniego providera.
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
    device.syncErrorCount = 0;
    device.battery = Math.max(0, device.battery - Math.floor(Math.random() * 3));
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

// ====== Kontrolery — dane z urządzeń ======

/**
 * GET /api/wearables/data/:playerId
 * Pobierz dane z urządzenia dla zawodnika (z filtrami type, from, to)
 */
export const getPlayerData = async (req, res, next) => {
  try {
    const { playerId } = req.params;

    // Sprawdź dostęp (trener lub rodzic)
    const player = await verifyPlayerAccess(req.user, playerId);
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

    // Sprawdź dostęp (trener lub rodzic)
    const player = await verifyPlayerAccess(req.user, playerId);
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

    // Pobierz podłączone urządzenia zawodnika
    const deviceFilter = { player: playerId, connected: true };
    if (req.user.role === 'parent') deviceFilter.parent = req.user._id;
    const devices = await WearableDevice.find(deviceFilter)
      .select('provider deviceName deviceId battery lastSyncAt authState');

    res.json({ latest, devices });
  } catch (error) {
    next(error);
  }
};

// ====== Kontrolery — OAuth ======

/**
 * GET /api/wearables/garmin/auth
 * Inicjuje przepływ OAuth dla Garmin.
 * Wymaga query params: playerId, deviceName
 */
export const initiateGarminAuth = async (req, res, next) => {
  try {
    const { playerId, deviceName } = req.query;

    if (!playerId || !deviceName) {
      return res.status(400).json({
        message: 'Wymagane parametry: playerId, deviceName',
      });
    }

    // Sprawdź dostęp rodzica
    const player = await verifyParentAccess(req.user._id, playerId);
    if (!player) {
      return res.status(403).json({
        message: 'Brak dostępu do tego zawodnika',
      });
    }

    // Sprawdź czy urządzenie Garmin nie jest już podłączone
    const existing = await WearableDevice.findOne({
      player: playerId,
      provider: 'garmin',
      connected: true,
    });

    if (existing) {
      return res.status(400).json({
        message: 'Urządzenie Garmin jest już podłączone do tego zawodnika',
      });
    }

    const provider = getProviderWithFallback('garmin');
    const redirectUri = `${CLIENT_URL}/parent/devices/callback?provider=garmin`;
    const authData = provider.getAuthUrl(playerId, redirectUri);

    // Utwórz urządzenie w stanie "pending"
    const deviceId = `GARMIN-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    await WearableDevice.create({
      player: playerId,
      parent: req.user._id,
      provider: 'garmin',
      deviceName,
      deviceId,
      connected: false,
      authState: 'pending',
      oauthState: authData.state,
    });

    res.json({
      authUrl: authData.url,
      state: authData.state,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/wearables/garmin/callback
 * Obsługuje callback OAuth z Garmin.
 * Garmin przekierowuje tutaj z oauth_token i oauth_verifier.
 */
export const handleGarminCallback = async (req, res, next) => {
  try {
    const { oauth_token, oauth_verifier, state } = req.query;

    if (!state) {
      return res.status(400).json({
        message: 'Brak parametru state — nieprawidłowe żądanie OAuth',
      });
    }

    // Znajdź urządzenie po oauthState (ochrona CSRF)
    const device = await WearableDevice.findOne({
      oauthState: state,
      authState: 'pending',
      provider: 'garmin',
    });

    if (!device) {
      return res.status(400).json({
        message: 'Nie znaleziono urządzenia w stanie autoryzacji — sesja wygasła lub nieprawidłowa',
      });
    }

    // Wymień kod na token dostępu
    const provider = getProviderWithFallback('garmin');
    const tokens = await provider.exchangeCode(oauth_token, oauth_verifier);

    // Zaktualizuj urządzenie
    device.connected = true;
    device.authState = 'connected';
    device.accessToken = tokens.accessToken;
    device.refreshToken = tokens.refreshToken;
    device.tokenExpiresAt = tokens.expiresIn
      ? new Date(Date.now() + tokens.expiresIn * 1000)
      : null;
    device.oauthState = null; // Wyczyść state po użyciu
    device.lastSyncAt = new Date();
    device.battery = Math.floor(Math.random() * 40) + 60;
    await device.save();

    // Wygeneruj dane historyczne (30 dni) — inicjalny sync
    const historicalRecords = generateHistoricalData(
      device.player.toString(),
      device._id.toString(),
      'garmin',
      30
    );
    await WearableData.insertMany(historicalRecords);

    // Przekieruj na stronę sukcesu w kliencie
    res.redirect(
      `${CLIENT_URL}/parent/devices/callback?provider=garmin&success=true&state=${state}`
    );
  } catch (error) {
    console.error('[OAuth Garmin] Błąd callbacku:', error.message);
    res.redirect(
      `${CLIENT_URL}/parent/devices/callback?provider=garmin&success=false&error=${encodeURIComponent(error.message)}`
    );
  }
};

/**
 * GET /api/wearables/whoop/auth
 * Inicjuje przepływ OAuth 2.0 + PKCE dla WHOOP.
 * Wymaga query params: playerId, deviceName
 */
export const initiateWhoopAuth = async (req, res, next) => {
  try {
    const { playerId, deviceName } = req.query;

    if (!playerId || !deviceName) {
      return res.status(400).json({
        message: 'Wymagane parametry: playerId, deviceName',
      });
    }

    // Sprawdź dostęp rodzica
    const player = await verifyParentAccess(req.user._id, playerId);
    if (!player) {
      return res.status(403).json({
        message: 'Brak dostępu do tego zawodnika',
      });
    }

    // Sprawdź czy urządzenie WHOOP nie jest już podłączone
    const existing = await WearableDevice.findOne({
      player: playerId,
      provider: 'whoop',
      connected: true,
    });

    if (existing) {
      return res.status(400).json({
        message: 'Urządzenie WHOOP jest już podłączone do tego zawodnika',
      });
    }

    const provider = getProviderWithFallback('whoop');
    const redirectUri = `${CLIENT_URL}/parent/devices/callback?provider=whoop`;
    const authData = provider.getAuthUrl(playerId, redirectUri);

    // Utwórz urządzenie w stanie "pending"
    const deviceId = `WHOOP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    await WearableDevice.create({
      player: playerId,
      parent: req.user._id,
      provider: 'whoop',
      deviceName,
      deviceId,
      connected: false,
      authState: 'pending',
      oauthState: authData.state,
      codeVerifier: authData.codeVerifier, // PKCE — potrzebne przy wymianie kodu
    });

    res.json({
      authUrl: authData.url,
      state: authData.state,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/wearables/whoop/callback
 * Obsługuje callback OAuth 2.0 z WHOOP.
 * WHOOP przekierowuje tutaj z code i state.
 */
export const handleWhoopCallback = async (req, res, next) => {
  try {
    const { code, state, error: oauthError } = req.query;

    // Sprawdź błąd OAuth (np. użytkownik odmówił dostępu)
    if (oauthError) {
      return res.redirect(
        `${CLIENT_URL}/parent/devices/callback?provider=whoop&success=false&error=${encodeURIComponent(oauthError)}`
      );
    }

    if (!code || !state) {
      return res.status(400).json({
        message: 'Brak parametrów code lub state — nieprawidłowe żądanie OAuth',
      });
    }

    // Znajdź urządzenie po oauthState (ochrona CSRF)
    const device = await WearableDevice.findOne({
      oauthState: state,
      authState: 'pending',
      provider: 'whoop',
    });

    if (!device) {
      return res.status(400).json({
        message: 'Nie znaleziono urządzenia w stanie autoryzacji — sesja wygasła lub nieprawidłowa',
      });
    }

    // Wymień kod na tokeny (z PKCE code_verifier)
    const provider = getProviderWithFallback('whoop');
    const tokens = await provider.exchangeCode(code, device.codeVerifier);

    // Zaktualizuj urządzenie
    device.connected = true;
    device.authState = 'connected';
    device.accessToken = tokens.accessToken;
    device.refreshToken = tokens.refreshToken;
    device.tokenExpiresAt = tokens.expiresIn
      ? new Date(Date.now() + tokens.expiresIn * 1000)
      : null;
    device.oauthState = null;
    device.codeVerifier = null; // Wyczyść code_verifier po użyciu
    device.lastSyncAt = new Date();
    device.battery = Math.floor(Math.random() * 40) + 60;
    await device.save();

    // Wygeneruj dane historyczne (30 dni) — inicjalny sync
    const historicalRecords = generateHistoricalData(
      device.player.toString(),
      device._id.toString(),
      'whoop',
      30
    );
    await WearableData.insertMany(historicalRecords);

    // Przekieruj na stronę sukcesu w kliencie
    res.redirect(
      `${CLIENT_URL}/parent/devices/callback?provider=whoop&success=true&state=${state}`
    );
  } catch (error) {
    console.error('[OAuth WHOOP] Błąd callbacku:', error.message);
    res.redirect(
      `${CLIENT_URL}/parent/devices/callback?provider=whoop&success=false&error=${encodeURIComponent(error.message)}`
    );
  }
};
