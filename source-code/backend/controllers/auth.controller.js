const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getPool } = require('../../database/database');
const emailService = require('../services/email.service');

const JWT_SECRET     = process.env.JWT_SECRET     || 'expense_manager_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'; // Phase 3: ngắn hạn
const REFRESH_SECRET = process.env.REFRESH_SECRET || JWT_SECRET + '_refresh';
const REFRESH_EXPIRES_DAYS = parseInt(process.env.REFRESH_EXPIRES_DAYS) || 30;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

// ── Helper: ghi audit log ────────────────────────────────────
async function writeAuditLog(pool, userId, event, req) {
  try {
    const ip = req.ip || req.socket?.remoteAddress || null;
    const ua = req.get('User-Agent') || null;
    await pool.query(
      'INSERT INTO audit_logs (user_id, event, ip_address, user_agent) VALUES ($1, $2, $3::inet, $4)',
      [userId, event, ip, ua]
    );
  } catch (e) {
    // Không để lỗi audit log làm hỏng request chính
    console.warn('[AuditLog] Lỗi ghi log:', e.message);
  }
}

// POST /api/auth/register
async function register(req, res) {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin.' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự.' });

  try {
    const pool = getPool();
    const exists = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    if (exists.rows.length > 0)
      return res.status(409).json({ error: 'Tên đăng nhập hoặc email đã tồn tại.' });

    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, password_hash]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Ghi audit log
    await writeAuditLog(pool, user.id, 'register', req);

    // Gửi email chào mừng (bất đồng bộ, không block response)
    emailService.sendWelcome(user).catch(() => {});

    return res.status(201).json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// POST /api/auth/login
async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu.' });

  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $1',
      [username]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
    }

    const user = result.rows[0];

    // ── Kiểm tra account lockout ─────────────────────────────
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remaining = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      await writeAuditLog(pool, user.id, 'login_blocked', req);
      return res.status(423).json({
        error: `Tài khoản tạm thời bị khoá. Vui lòng thử lại sau ${remaining} phút.`
      });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      // Tăng đếm thất bại — chỉ khi cột tồn tại
      try {
        const newAttempts = (user.failed_attempts || 0) + 1;
        const lockUntil = newAttempts >= MAX_FAILED_ATTEMPTS
          ? new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000)
          : null;

        await pool.query(
          'UPDATE users SET failed_attempts = $1, locked_until = $2 WHERE id = $3',
          [newAttempts, lockUntil, user.id]
        );
        await writeAuditLog(pool, user.id, 'login_fail', req);

        if (lockUntil) {
          return res.status(423).json({
            error: `Sai mật khẩu ${MAX_FAILED_ATTEMPTS} lần. Tài khoản bị khoá ${LOCK_DURATION_MINUTES} phút.`
          });
        }
        const left = MAX_FAILED_ATTEMPTS - newAttempts;
        return res.status(401).json({
          error: `Tên đăng nhập hoặc mật khẩu không đúng. Còn ${left} lần thử.`
        });
      } catch {
        // Nếu cột chưa tồn tại (migration chưa chạy), fallback về thông báo đơn giản
        return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
      }
    }

    // ── Đăng nhập thành công ─────────────────────────────────
    // Reset failed attempts
    await pool.query(
      'UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = $1',
      [user.id]
    );
    await writeAuditLog(pool, user.id, 'login_success', req);

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Tạo refresh token
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const refreshExpires = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, refreshExpires]
    ).catch(() => {}); // Nếu bảng chưa tồn tại, bỏ qua

    return res.json({
      token,
      refreshToken,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// POST /api/auth/refresh — Lấy access token mới từ refresh token
async function refreshToken(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(400).json({ error: 'Thiếu refresh token.' });

  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT rt.*, u.username FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token = $1 AND rt.revoked = FALSE AND rt.expires_at > NOW()`,
      [refreshToken]
    );
    if (!result.rows.length)
      return res.status(401).json({ error: 'Refresh token không hợp lệ hoặc đã hết hạn.' });

    const row = result.rows[0];
    const newToken = jwt.sign({ id: row.user_id, username: row.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.json({ token: newToken });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// POST /api/auth/logout
async function logout(req, res) {
  const refreshToken = req.body?.refreshToken;
  if (refreshToken) {
    try {
      const pool = getPool();
      await pool.query('UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1', [refreshToken]);
      if (req.user) await writeAuditLog(pool, req.user.id, 'logout', req);
    } catch (e) { /* Bỏ qua */ }
  }
  return res.json({ success: true, message: 'Đã đăng xuất.' });
}

// GET /api/auth/me
async function getMe(req, res) {
  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT id, username, email, created_at, notify_budget_alert, notify_monthly_report FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!result.rows.length)
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// PUT /api/auth/change-password
async function changePassword(req, res) {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword)
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ.' });
  if (newPassword.length < 6)
    return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });

  try {
    const pool = getPool();
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const valid = await bcrypt.compare(oldPassword, result.rows[0].password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Mật khẩu cũ không đúng.' });

    const password_hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, req.user.id]);
    await writeAuditLog(pool, req.user.id, 'password_change', req);

    // Thu hồi tất cả refresh token sau khi đổi mật khẩu
    await pool.query('UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1', [req.user.id]).catch(() => {});

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// PUT /api/auth/notifications — Cập nhật preferences thông báo
async function updateNotifications(req, res) {
  const { notify_budget_alert, notify_monthly_report } = req.body;
  try {
    const pool = getPool();
    await pool.query(
      `UPDATE users SET
        notify_budget_alert   = COALESCE($1, notify_budget_alert),
        notify_monthly_report = COALESCE($2, notify_monthly_report)
       WHERE id = $3`,
      [notify_budget_alert, notify_monthly_report, req.user.id]
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/auth/audit-logs — Xem lịch sử đăng nhập của chính mình
async function getAuditLogs(req, res) {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT event, ip_address, user_agent, created_at
       FROM audit_logs WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 20`,
      [req.user.id]
    );
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { register, login, logout, getMe, changePassword, refreshToken, updateNotifications, getAuditLogs };
