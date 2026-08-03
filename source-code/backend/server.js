const express = require('express');
const cors    = require('cors');
const rateLimit = require('express-rate-limit');
const path    = require('path');

require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Rate limiting: max 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ── API Routes ───────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth.routes'));
app.use('/api/expenses', require('./routes/expense.routes'));
app.use('/api/budgets',  require('./routes/budget.routes'));

// ── Static Frontend ──────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend')));

// SPA fallback — phục vụ index.html cho mọi route không phải API
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  } else {
    next();
  }
});

// ── Start ────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
  });
}

module.exports = app; // export for testing