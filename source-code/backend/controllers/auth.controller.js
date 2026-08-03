const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool } = require('../../database/database');

const JWT_SECRET = process.env.JWT_SECRET || 'expense_manager_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// POST /api/auth/register
async function register(req, res) {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự.' });
  }

  try {
    const pool = getPool();
    const exists = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'Tên đăng nhập hoặc email đã tồn tại.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, password_hash]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.status(201).json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// POST /api/auth/login
async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu.' });
  }

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
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// POST /api/auth/logout  (stateless — client xóa token)
function logout(req, res) {
  return res.json({ success: true, message: 'Đã đăng xuất.' });
}

// GET /api/auth/me
async function getMe(req, res) {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT id, username, email, created_at FROM users WHERE id = $1', [req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// PUT /api/auth/change-password
async function changePassword(req, res) {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ error: 'Vui lòng điền đầy đủ.' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });

  try {
    const pool = getPool();
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    const valid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Mật khẩu cũ không đúng.' });

    const password_hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, req.user.id]);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { register, login, logout, getMe, changePassword };
