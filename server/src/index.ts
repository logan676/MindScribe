import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import { testConnection, initDatabase } from './config/database.js';
import sessionsRoutes from './routes/sessions.routes.js';
import notesRoutes from './routes/notes.routes.js';
import patientsRoutes from './routes/patients.routes.js';
import transcriptionsRoutes from './routes/transcriptions.routes.js';
import healthRoutes from './routes/health.routes.js';
import logger from './config/logger.js';
import {
  requestLogger,
  errorLogger,
  errorHandler,
  setupUncaughtHandlers,
} from './middleware/logging.middleware.js';

// Load environment variables
dotenv.config();

// Setup uncaught exception handlers
setupUncaughtHandlers();

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
app.use(requestLogger);

// Health check routes
app.use('/', healthRoutes);

// API Routes
app.get('/api', (req, res) => {
  res.json({
    message: 'MindScribe API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      healthDetailed: '/health/detailed',
      healthReady: '/health/ready',
      healthLive: '/health/live',
      auth: '/api/auth',
      patients: '/api/patients',
      sessions: '/api/sessions',
      notes: '/api/notes',
      transcriptions: '/api/transcriptions',
    },
  });
});

app.use('/api/sessions', sessionsRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/transcriptions', transcriptionsRoutes);

// 404 handler (must be before error handlers)
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handling middleware
app.use(errorLogger);
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
      logger.error('Failed to connect to database. Server not started.');
      process.exit(1);
    }

    logger.info('Database connection established');

    // Initialize database tables
    await initDatabase();
    logger.info('Database tables initialized');

    // Start listening
    app.listen(PORT, () => {
      logger.info(`
╔═══════════════════════════════════════════╗
║                                           ║
║     🧠 MindScribe API Server 🧠          ║
║                                           ║
║     Server running on port ${PORT}         ║
║     Environment: ${process.env.NODE_ENV || 'development'}               ║
║                                           ║
║     Health: http://localhost:${PORT}/health  ║
║     API: http://localhost:${PORT}/api        ║
║                                           ║
╚═══════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Start the server
startServer();
