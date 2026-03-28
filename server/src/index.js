import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import chatHandler from './socket/chatHandler.js';

// Routes
import authRoutes from './routes/auth.js';
import playerRoutes from './routes/players.js';
import sessionRoutes from './routes/sessions.js';
import paymentRoutes from './routes/payments.js';
import tournamentRoutes from './routes/tournaments.js';
import messageRoutes from './routes/messages.js';
import wearableRoutes from './routes/wearables.js';

// ====== Konfiguracja ======

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ====== Express App ======

const app = express();
app.set('trust proxy', 1);
const httpServer = createServer(app);

// ====== Socket.io ======

const io = new Server(httpServer, {
  cors: {
    origin: [CLIENT_URL, 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

chatHandler(io);

// ====== Middleware ======

app.use(helmet());

app.use(
  cors({
    origin: [CLIENT_URL, 'http://localhost:5173'],
    credentials: true,
  })
);

// Rate limiter
app.use(generalLimiter);

// Body parser - ale NIE dla Stripe webhook (wymaga raw body)
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    next();
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ====== Routes ======

app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/wearables', wearableRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ====== Statyczne pliki w produkcji ======

if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDistPath));

  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// ====== Error Handler ======

app.use(errorHandler);

// ====== Start serwera ======

const startServer = async () => {
  try {
    // Połącz z MongoDB
    await connectDB();

    httpServer.listen(PORT, () => {
      console.log(`\n[ServeIQ] Serwer uruchomiony na porcie ${PORT}`);
      console.log(`[ServeIQ] Środowisko: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[ServeIQ] API: http://localhost:${PORT}/api`);
      console.log(`[ServeIQ] Klient: ${CLIENT_URL}\n`);
    });
  } catch (error) {
    console.error('[ServeIQ] Błąd uruchamiania serwera:', error.message);
    process.exit(1);
  }
};

startServer();

export { app, io };
