const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path      = require('path');

require('dotenv').config();

// ── Đảm bảo thư mục logs tồn tại ────────────────────────────
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const { requestLogger, logger } = require('./middlewares/logger.middleware');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Security & Performance Middleware ─────────────────────────
app.set('trust proxy', 1); // Tin tưởng proxy (Railway, Render, Vercel)

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
      styleSrc:  ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc:   ["'self'", "fonts.gstatic.com"],
      imgSrc:    ["'self'", "data:", "blob:"],
      connectSrc:["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Cho phép Chart.js CDN
}));

app.use(compression()); // Nén gzip response

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

app.use(express.json({ limit: '5mb' }));
app.use(requestLogger); // HTTP request logging

// ── Rate Limiting ─────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' },
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Nghiêm ngặt hơn cho auth endpoints
  message: { error: 'Quá nhiều lần đăng nhập. Vui lòng thử lại sau 15 phút.' },
});

app.use('/api/', limiter);
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);

// ── Health Check ─────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    const { getPool } = require('../database/database');
    await getPool().query('SELECT 1');
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '3.0.0',
      database: 'connected',
      uptime: Math.floor(process.uptime()),
    });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'disconnected', error: err.message });
  }
});

// ── API Routes ───────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth.routes'));
app.use('/api/expenses',  require('./routes/expense.routes'));
app.use('/api/budgets',   require('./routes/budget.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));

// ── Static Frontend ──────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend')));

// SPA fallback
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  } else {
    next();
  }
});

// ── Global Error Handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Lỗi máy chủ nội bộ.' });
});

// ── Start ────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`Server Phase 3 đang chạy tại http://localhost:${PORT}`);
  });
}

module.exports = app;