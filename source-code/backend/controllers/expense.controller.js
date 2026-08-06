const { getPool } = require('../../database/database');

// GET /api/expenses
async function getExpenses(req, res) {
  try {
    const pool = getPool();
    const { category, search, sort, page = 1, limit = 20, currency, minAmount, maxAmount } = req.query;
    const userId = req.user.id;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = ['user_id = $1'];
    let params = [userId];
    let idx = 2;

    if (category) { conditions.push(`category = $${idx++}`); params.push(category); }
    if (search)   { conditions.push(`description ILIKE $${idx++}`); params.push(`%${search}%`); }
    if (currency) { conditions.push(`currency = $${idx++}`); params.push(currency.toUpperCase()); }
    if (minAmount) { conditions.push(`amount >= $${idx++}`); params.push(parseFloat(minAmount)); }
    if (maxAmount) { conditions.push(`amount <= $${idx++}`); params.push(parseFloat(maxAmount)); }

    const sortMap = {
      'date-desc':   'expense_date DESC',
      'date-asc':    'expense_date ASC',
      'amount-desc': 'amount DESC',
      'amount-asc':  'amount ASC',
    };
    const orderBy = sortMap[sort] || 'expense_date DESC';
    const where = 'WHERE ' + conditions.join(' AND ');

    const countRes = await pool.query(`SELECT COUNT(*) FROM expenses ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

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
  const {
    description, amount, category, date,
    is_recurring = false, recurring_interval = null,
    notes = null, currency = 'VND'
  } = req.body;

  if (!description || !amount || !category || !date)
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc.' });
  if (Number(amount) <= 0)
    return res.status(400).json({ error: 'Số tiền phải lớn hơn 0.' });

  const validCurrencies = ['VND', 'USD', 'EUR', 'JPY', 'CNY', 'SGD', 'KRW', 'THB'];
  const cur = currency.toUpperCase();
  if (!validCurrencies.includes(cur))
    return res.status(400).json({ error: 'Tiền tệ không hợp lệ.' });

  try {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO expenses (user_id, description, amount, category, expense_date, is_recurring, recurring_interval, notes, currency)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.user.id, description.trim(), Number(amount), category, date, is_recurring, recurring_interval || null, notes || null, cur]
    );

    // Kiểm tra budget alert
    checkAndSendBudgetAlert(pool, req.user.id, category, date).catch(() => {});

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// PUT /api/expenses/:id
async function updateExpense(req, res) {
  const { id } = req.params;
  const {
    description, amount, category, date,
    is_recurring, recurring_interval,
    notes, currency
  } = req.body;

  if (!description || !amount || !category || !date)
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc.' });
  if (Number(amount) <= 0)
    return res.status(400).json({ error: 'Số tiền phải lớn hơn 0.' });

  try {
    const pool = getPool();
    const cur = currency ? currency.toUpperCase() : 'VND';
    const result = await pool.query(
      `UPDATE expenses
       SET description = $1, amount = $2, category = $3, expense_date = $4,
           is_recurring = $5, recurring_interval = $6, notes = $7, currency = $8
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
      [description.trim(), Number(amount), category, date,
       is_recurring ?? false, recurring_interval || null, notes || null, cur, id, req.user.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Không tìm thấy chi tiêu.' });

    // Kiểm tra budget alert sau khi cập nhật chi tiêu
    checkAndSendBudgetAlert(pool, req.user.id, category, date).catch(() => {});

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
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Không tìm thấy chi tiêu.' });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// ── Helper: Kiểm tra và gửi budget alert ────────────────────
async function checkAndSendBudgetAlert(pool, userId, category, date) {
  try {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();

    // Lấy ngân sách danh mục
    const budgetRes = await pool.query(
      'SELECT amount FROM budgets WHERE user_id = $1 AND category = $2 AND month = $3 AND year = $4',
      [userId, category, month, year]
    );
    if (!budgetRes.rows.length) return;

    const budget = parseFloat(budgetRes.rows[0].amount);

    // Tổng đã chi
    const spentRes = await pool.query(
      `SELECT SUM(amount) AS spent FROM expenses
       WHERE user_id = $1 AND category = $2
         AND EXTRACT(MONTH FROM expense_date) = $3
         AND EXTRACT(YEAR  FROM expense_date) = $4`,
      [userId, category, month, year]
    );
    const spent = parseFloat(spentRes.rows[0].spent) || 0;
    const percent = (spent / budget) * 100;

    // Gửi alert nếu vượt 80%
    if (percent >= 80) {
      const userRes = await pool.query(
        'SELECT email, username, notify_budget_alert FROM users WHERE id = $1',
        [userId]
      );
      const user = userRes.rows[0];
      const shouldSend = user && user.notify_budget_alert !== false;
      if (shouldSend) {
        const emailService = require('../services/email.service');
        await emailService.sendBudgetAlert(user, { category, spent, budget, percent });
      }
    }
  } catch (e) {
    console.warn('[BudgetAlert] Lỗi:', e.message);
  }
}

module.exports = { getExpenses, createExpense, updateExpense, deleteExpense };
