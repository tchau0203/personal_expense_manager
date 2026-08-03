const { getPool } = require('../../database/database');

// GET /api/expenses
async function getExpenses(req, res) {
  try {
    const pool = getPool();
    const { category, search, sort, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = ['user_id = $1'];
    let params = [userId];
    let idx = 2;

    if (category) {
      conditions.push(`category = $${idx++}`);
      params.push(category);
    }
    if (search) {
      conditions.push(`description ILIKE $${idx++}`);
      params.push(`%${search}%`);
    }

    const sortMap = {
      'date-desc':   'expense_date DESC',
      'date-asc':    'expense_date ASC',
      'amount-desc': 'amount DESC',
      'amount-asc':  'amount ASC',
    };
    const orderBy = sortMap[sort] || 'expense_date DESC';

    const where = 'WHERE ' + conditions.join(' AND ');

    // Count total
    const countRes = await pool.query(`SELECT COUNT(*) FROM expenses ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    // Paginated results
    params.push(parseInt(limit), offset);
    const result = await pool.query(
      `SELECT * FROM expenses ${where} ORDER BY ${orderBy} LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    return res.json({ data: result.rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// POST /api/expenses
async function createExpense(req, res) {
  const { description, amount, category, date, is_recurring = false, recurring_interval = null } = req.body;

  if (!description || !amount || !category || !date) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc.' });
  }
  if (Number(amount) <= 0) {
    return res.status(400).json({ error: 'Số tiền phải lớn hơn 0.' });
  }

  try {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO expenses (user_id, description, amount, category, expense_date, is_recurring, recurring_interval)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, description.trim(), Number(amount), category, date, is_recurring, recurring_interval || null]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// PUT /api/expenses/:id
async function updateExpense(req, res) {
  const { id } = req.params;
  const { description, amount, category, date, is_recurring, recurring_interval } = req.body;

  if (!description || !amount || !category || !date) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc.' });
  }
  if (Number(amount) <= 0) {
    return res.status(400).json({ error: 'Số tiền phải lớn hơn 0.' });
  }

  try {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE expenses
       SET description = $1, amount = $2, category = $3, expense_date = $4,
           is_recurring = $5, recurring_interval = $6
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [description.trim(), Number(amount), category, date,
       is_recurring ?? false, recurring_interval || null, id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy chi tiêu.' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// DELETE /api/expenses/:id
async function deleteExpense(req, res) {
  try {
    const pool = getPool();
    const result = await pool.query(
      'DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy chi tiêu.' });
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { getExpenses, createExpense, updateExpense, deleteExpense };
