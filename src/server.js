require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { startReminderCron } = require('./utils/reminderCron');

// ─── Route imports ─────────────────────────────────────
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const interactionRoutes = require('./routes/interactions');
const productRoutes = require('./routes/products');
const inventoryRoutes = require('./routes/inventory');
const { userRouter, notifRouter, dashRouter } = require('./routes/misc');

const app = express();

// ─── Security middleware ───────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));

// ─── Rate limiting ─────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  message: { status: 'fail', message: 'Too many requests. Please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Stricter for auth routes
  message: { status: 'fail', message: 'Too many login attempts. Please wait.' },
});
app.use('/api', limiter);
app.use('/api/auth', authLimiter);

// ─── Body parsing ──────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ───────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Static frontend ───────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')));

// ─── API routes ────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/customers',     customerRoutes);
app.use('/api/interactions',  interactionRoutes);
app.use('/api/products',      productRoutes);
app.use('/api/inventory',     inventoryRoutes);
app.use('/api/users',         userRouter);
app.use('/api/notifications', notifRouter);
app.use('/api/dashboard',     dashRouter);

// ─── Health check ─────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'SalesPulse CRM',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── SPA fallback (serve frontend for all non-API routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// ─── Error handlers ────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  startReminderCron();
  app.listen(PORT, () => {
    console.log(`\n🚀 SalesPulse CRM running on http://localhost:${PORT}`);
    console.log(`   Environment : ${process.env.NODE_ENV}`);
    console.log(`   API Base    : http://localhost:${PORT}/api`);
    console.log(`   Health      : http://localhost:${PORT}/api/health\n`);
  });
};

start();

module.exports = app;
