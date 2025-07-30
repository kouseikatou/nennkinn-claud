const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { sequelize } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const applicationRoutes = require('./routes/application.routes');
const activityRoutes = require('./routes/activity.routes');
const surveyRoutes = require('./routes/survey.routes');

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:8000',
    'http://127.0.0.1:8000'
  ],
  credentials: true
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware (本番では簡略ログ)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('combined', { stream: logger.stream }));
} else {
  app.use(morgan('short')); // 本番では簡略ログ
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (process.env.NODE_ENV === 'development' ? 1000 : 100), // 開発環境では1000リクエスト
  standardHeaders: true,
  legacyHeaders: false,
  message: 'リクエストが多すぎます。しばらく待ってから再度お試しください。',
  skip: (req) => {
    // 開発環境でのテストモードはレート制限をスキップ
    return process.env.NODE_ENV === 'development' && req.headers['x-test-mode'] === 'true';
  }
});
app.use('/api/', limiter);

// Static files
app.use('/uploads', express.static('uploads'));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/surveys', surveyRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Disability Pension Management System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      applications: '/api/applications',
      activities: '/api/activities',
      surveys: '/api/surveys'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource could not be found'
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');

    // Sync database models
    if (process.env.VERCEL) {
      // Vercel環境ではグローバルメモリ内DBを初期化
      if (!global.vercelDbInitialized) {
        await sequelize.sync({ force: true });
        
        // 初期データ作成
        const bcrypt = require('bcryptjs');
        const { User, Application } = require('./models');
        
        // 管理者ユーザー作成
        const adminPassword = await bcrypt.hash('admin123', 10);
        const admin = await User.create({
          name: 'システム管理者',
          email: 'admin@disability-pension.jp',
          password: adminPassword,
          role: 'admin',
          isActive: true
        });
        
        // サンプル申請データ作成
        await Application.create({
          applicationNumber: 'APP-2024-0001',
          applicantName: '田中太郎',
          applicantNameKana: 'タナカタロウ',
          birthDate: '1985-03-15',
          gender: 'male',
          phoneNumber: '090-1234-5678',
          email: 'tanaka@example.com',
          address: '東京都新宿区西新宿1-1-1',
          postalCode: '160-0023',
          disabilityType: 'mental',
          disabilityGrade: 2,
          disabilityDescription: 'うつ病による精神障害',
          onsetDate: '2020-06-01',
          applicationType: 'new',
          status: 'submitted',
          hospitalName: '東京医療センター',
          doctorName: '山田医師',
          diagnosisDate: '2020-06-01',
          monthlyIncome: 200000,
          hasOtherPension: false,
          createdById: admin.id,
          assignedToId: admin.id,
          lastUpdatedById: admin.id
        });
        
        global.vercelDbInitialized = true;
        console.log('Vercel DB initialized');
      }
    } else if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Database models synchronized.');
    } else {
      await sequelize.sync({ alter: false });
      logger.info('Database models loaded.');
    }

    const server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = () => {
      logger.info('Received shutdown signal, closing server gracefully...');
      server.close(() => {
        logger.info('Server closed successfully');
        process.exit(0);
      });
      
      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

module.exports = app;