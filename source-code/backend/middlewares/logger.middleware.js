/* ================================================================
   logger.middleware.js — Structured logging với Winston (Phase 3)
   ================================================================ */
const winston = require('winston');
const path = require('path');

// ── Tạo Winston logger ────────────────────────────────────────
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Console (dev-friendly)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const extra = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
          return `${timestamp} [${level}] ${message}${extra}`;
        })
      ),
    }),
    // File: errors
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
    }),
    // File: all
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
    }),
  ],
});

// ── HTTP Request Logger middleware ────────────────────────────
function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: duration,
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.get('User-Agent'),
    };

    if (req.user) logData.userId = req.user.id;

    const level = res.statusCode >= 500 ? 'error'
      : res.statusCode >= 400 ? 'warn'
      : 'info';

    logger[level](`${req.method} ${req.path} ${res.statusCode} ${duration}ms`, logData);
  });

  next();
}

module.exports = { logger, requestLogger };
