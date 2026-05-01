require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');

const { apiLimiter } = require('./src/middleware/rateLimiter');
const errorHandler = require('./src/middleware/errorHandler');

// Routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const productRoutes = require('./src/routes/products');
const categoryRoutes = require('./src/routes/categories');
const orderRoutes = require('./src/routes/orders');
const cartRoutes = require('./src/routes/cart');
const couponRoutes = require('./src/routes/coupons');
const uploadRoutes = require('./src/routes/upload');
const webhookRoutes = require('./src/routes/webhook');
const bannerRoutes = require('./src/routes/banners');
const popupRoutes = require('./src/routes/popup');
const chatRoutes = require('./src/routes/chat');
const testRoutes = require('./src/routes/test');

const app = express();

// Trust proxy for Fly.io / reverse proxies (needed for rate limiter and IP detection)
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // En desarrollo, acepta localhost en cualquier puerto
      if (process.env.NODE_ENV === 'development' && origin?.includes('localhost')) {
        callback(null, true);
      } else if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
        callback(null, true);
      } else if (!origin) {
        // Requests sin origin (como mobile apps, Postman, etc)
        callback(null, true);
      } else {
        callback(new Error('CORS no permitido'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Webhook raw body (must be before json parser)
app.use('/api/webhook', express.raw({ type: 'application/json' }));

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Compression
app.use(compression());

// Sanitize NoSQL injection
app.use(mongoSanitize());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
app.use('/api', apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/popup', popupRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/test', testRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV, timestamp: new Date() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada.' });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
