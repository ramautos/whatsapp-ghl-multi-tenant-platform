const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');
const winston = require('winston');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

// Import custom modules
const evolutionService = require('./services/evolutionService');
const ghlService = require('./services/ghlService');
const aiService = require('./services/aiService');
const webhookRouter = require('./routes/webhooks');
const qrRouter = require('./routes/qrScanner');
const dashboardRouter = require('./routes/dashboard');
const testRouter = require('./routes/test');
const db = require('./config/database');
const redis = require('./config/redis');

// Initialize Express app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST']
  }
});

// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Global middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      evolution: evolutionService.isConnected(),
      ghl: ghlService.isConnected(),
      database: db.isConnected(),
      redis: redis.isConnected()
    }
  });
});

// API Routes
app.use('/api/webhooks', webhookRouter);
app.use('/api/qr', qrRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/test', testRouter);

// Socket.io for real-time updates
io.on('connection', (socket) => {
  logger.info('New client connected', { socketId: socket.id });

  socket.on('subscribe-instance', (instanceName) => {
    socket.join(`instance-${instanceName}`);
    logger.info(`Socket ${socket.id} subscribed to instance ${instanceName}`);
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id });
  });
});

// Make io accessible to routes
app.set('io', io);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Evolution API: ${process.env.EVOLUTION_API_URL}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  
  // Initialize services
  evolutionService.initialize();
  ghlService.initialize();
  db.initialize();
  redis.initialize();
});