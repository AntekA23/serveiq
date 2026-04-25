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
import { startJobs } from './jobs/index.js';

// Routes
import authRoutes from './routes/auth.js';
import playerRoutes from './routes/players.js';
import sessionRoutes from './routes/sessions.js';
import paymentRoutes from './routes/payments.js';
import tournamentRoutes from './routes/tournaments.js';
import messageRoutes from './routes/messages.js';
import subscriptionRoutes from './routes/subscriptions.js';
import notificationRoutes from './routes/notifications.js';
import betaRoutes from './routes/beta.js';
import clubRoutes from './routes/clubs.js';
import groupRoutes from './routes/groups.js';
import activityRoutes from './routes/activities.js';
import goalRoutes from './routes/goals.js';
import observationRoutes from './routes/observations.js';
import reviewRoutes from './routes/reviews.js';
import recommendationRoutes from './routes/recommendations.js';
import timelineRoutes from './routes/timeline.js';
import coachLinkRoutes from './routes/coachLinks.js';
import badgeRoutes from './routes/badges.js';
import developmentProgramRoutes from './routes/developmentPrograms.js';
import aiRoutes from './routes/ai.js';
import achievementRoutes from './routes/achievements.js';
import matchRoutes from './routes/matches.js';

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
  if (
    req.originalUrl === '/api/payments/webhook' ||
    req.originalUrl === '/api/subscriptions/webhook'
  ) {
    next();
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ====== Statyczne pliki - uploads ======

app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// ====== Routes ======

app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/beta', betaRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/observations', observationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/coach-links', coachLinkRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/development-programs', developmentProgramRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/matches', matchRoutes);

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
      console.log(`[ServeIQ] Klient: ${CLIENT_URL}`);

      // Uruchom wszystkie zadania cykliczne
      startJobs();
    });
  } catch (error) {
    console.error('[ServeIQ] Błąd uruchamiania serwera:', error.message);
    process.exit(1);
  }
};

startServer();

export { app, io };
