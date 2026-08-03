const { getPool } = require('../../database/database');

// GET /api/budgets?month=8&year=2026
async function getBudgets(req, res) {
  try {
    const pool = getPool();
    const { month, year } = req.query;
    const userId = req.user.id;

    let query = 'SELECT * FROM budgets WHERE user_id = $1';
    const params = [userId];
    let idx = 2;

    if (month) { query += ` AND month = $${idx++}`; params.push(parseInt(month)); }
    if (year)  { query += ` AND year  = $${idx++}`; params.push(parseInt(year)); }

    query += ' ORDER BY category ASC';
    const result = await pool.query(query, params);

    // Attach spent amount for each budget
    const now = new Date();
    const m = month ? parseInt(month) : now.getMonth() + 1;
    const y = year  ? parseInt(year)  : now.getFullYear();

    const spent = await pool.query(
      `SELECT category, SUM(amount) as spent
       FROM expenses
       WHERE user_id = $1
         AND EXTRACT(MONTH FROM expense_date) = $2
         AND EXTRACT(YEAR  FROM expense_date) = $3
       GROUP BY category`,
      [userId, m, y]
    );
    const spentMap = {};
    spent.rows.forEach(r => { spentMap[r.category] = parseFloat(r.spent); });

    const budgetsWithSpent = result.rows.map(b => ({
      ...b,
      spent: spentMap[b.category] || 0,
    }));

    return res.json(budgetsWithSpent);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// POST /api/budgets
async function createBudget(req, res) {
  const { category, amount, month, year } = req.body;
  if (!category || !amount || !month || !year) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc.' });
  }
  if (Number(amount) <= 0) return res.status(400).json({ error: 'Ngân sách phải > 0.' });

  try {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO budgets (user_id, category, amount, month, year)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, category, month, year)
       DO UPDATE SET amount = EXCLUDED.amount
       RETURNING *`,
      [req.user.id, category, Number(amount), parseInt(month), parseInt(year)]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// PUT /api/budgets/:id
async function updateBudget(req, res) {
  const { amount } = req.body;
  if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'Ngân sách phải > 0.' });

  try {
    const pool = getPool();
    const result = await pool.query(
      'UPDATE budgets SET amount = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [Number(amount), req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Không tìm thấy ngân sách.' });
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// DELETE /api/budgets/:id
async function deleteBudget(req, res) {
  try {
    const pool = getPool();
    const result = await pool.query(
      'DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Không tìm thấy ngân sách.' });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { getBudgets, createBudget, updateBudget, deleteBudget };
