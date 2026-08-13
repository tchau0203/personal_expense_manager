const { getPool } = require('../../database/database');

async function getGoals(req, res) {
  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM goals WHERE user_id = $1 ORDER BY deadline NULLS LAST, created_at DESC',
      [req.user.id]
    );
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function createGoal(req, res) {
  const { title, category, target_amount, current_amount = 0, deadline = null } = req.body;
  if (!title || !target_amount || Number(target_amount) <= 0) {
    return res.status(400).json({ error: 'Vui lòng nhập tên mục tiêu và số tiền mục tiêu hợp lệ.' });
  }

  try {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO goals (user_id, title, category, target_amount, current_amount, deadline)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, title.trim(), category || null, Number(target_amount), Number(current_amount), deadline || null]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function updateGoal(req, res) {
  const { title, category, target_amount, deadline = null } = req.body;
  const current_amount = req.body.current_amount !== undefined ? req.body.current_amount : 0;
  if (!title || !target_amount || Number(target_amount) <= 0) {
    return res.status(400).json({ error: 'Vui lòng nhập tên mục tiêu và số tiền mục tiêu hợp lệ.' });
  }

  try {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE goals SET
         title = $1,
         category = $2,
         target_amount = $3,
         current_amount = $4,
         deadline = $5,
         updated_at = NOW()
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [title.trim(), category || null, Number(target_amount), Number(current_amount), deadline || null, parseInt(req.params.id), req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Không tìm thấy mục tiêu.' });
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function deleteGoal(req, res) {
  try {
    const pool = getPool();
    const result = await pool.query(
      'DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id',
      [parseInt(req.params.id), req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Không tìm thấy mục tiêu.' });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { getGoals, createGoal, updateGoal, deleteGoal };