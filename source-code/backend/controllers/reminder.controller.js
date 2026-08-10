const { getPool } = require('../../database/database');

async function getReminders(req, res) {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM reminders WHERE user_id = $1 AND active = TRUE ORDER BY due_date ASC`,
      [req.user.id]
    );
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function createReminder(req, res) {
  const { title, amount = null, category = null, due_date, frequency = 'once', active = true } = req.body;
  if (!title || !due_date) {
    return res.status(400).json({ error: 'Vui lòng nhập tiêu đề và ngày đến hạn.' });
  }
  const allowed = ['once', 'weekly', 'monthly'];
  if (!allowed.includes(frequency)) {
    return res.status(400).json({ error: 'Tần suất không hợp lệ.' });
  }
  try {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO reminders (user_id, title, amount, category, due_date, frequency, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.id, title.trim(), amount ? Number(amount) : null, category || null, due_date, frequency, active]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function updateReminder(req, res) {
  const { title, amount = null, category = null, due_date, frequency = 'once', active = true } = req.body;
  if (!title || !due_date) {
    return res.status(400).json({ error: 'Vui lòng nhập tiêu đề và ngày đến hạn.' });
  }
  const allowed = ['once', 'weekly', 'monthly'];
  if (!allowed.includes(frequency)) {
    return res.status(400).json({ error: 'Tần suất không hợp lệ.' });
  }
  try {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE reminders SET
         title = $1,
         amount = $2,
         category = $3,
         due_date = $4,
         frequency = $5,
         active = $6,
         updated_at = NOW()
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [title.trim(), amount ? Number(amount) : null, category || null, due_date, frequency, active, req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Không tìm thấy nhắc nhở.' });
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function deleteReminder(req, res) {
  try {
    const pool = getPool();
    const result = await pool.query(
      'DELETE FROM reminders WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Không tìm thấy nhắc nhở.' });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { getReminders, createReminder, updateReminder, deleteReminder };
