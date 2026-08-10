const { getPool } = require('../../database/database');
const emailService = require('../services/email.service');

async function getMonthlySummary(req, res) {
  try {
    const pool = getPool();
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year = parseInt(req.query.year) || now.getFullYear();

    const summaryRes = await pool.query(
      `SELECT SUM(amount) AS total_spent, COUNT(*) AS transaction_count
       FROM expenses
       WHERE user_id = $1
         AND EXTRACT(MONTH FROM expense_date) = $2
         AND EXTRACT(YEAR FROM expense_date) = $3`,
      [req.user.id, month, year]
    );

    const topCategoryRes = await pool.query(
      `SELECT category, SUM(amount) AS total
       FROM expenses
       WHERE user_id = $1
         AND EXTRACT(MONTH FROM expense_date) = $2
         AND EXTRACT(YEAR FROM expense_date) = $3
       GROUP BY category
       ORDER BY total DESC
       LIMIT 1`,
      [req.user.id, month, year]
    );

    const summary = {
      month,
      year,
      totalSpent: parseFloat(summaryRes.rows[0].total_spent) || 0,
      transactionCount: parseInt(summaryRes.rows[0].transaction_count) || 0,
      topCategory: topCategoryRes.rows[0]?.category || null,
    };
    return res.json(summary);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function sendMonthlyReport(req, res) {
  try {
    const pool = getPool();
    const now = new Date();
    const month = parseInt(req.body.month) || now.getMonth() + 1;
    const year = parseInt(req.body.year) || now.getFullYear();

    const userRes = await pool.query(
      'SELECT id, username, email, notify_monthly_report FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = userRes.rows[0];
    if (!user) return res.status(404).json({ error: 'Người dùng không tồn tại.' });
    if (user.notify_monthly_report === false) {
      return res.status(400).json({ error: 'Người dùng đã tắt thông báo báo cáo hàng tháng.' });
    }

    const summaryRes = await pool.query(
      `SELECT SUM(amount) AS total_spent, COUNT(*) AS transaction_count
       FROM expenses
       WHERE user_id = $1
         AND EXTRACT(MONTH FROM expense_date) = $2
         AND EXTRACT(YEAR FROM expense_date) = $3`,
      [req.user.id, month, year]
    );
    const topCategoryRes = await pool.query(
      `SELECT category, SUM(amount) AS total
       FROM expenses
       WHERE user_id = $1
         AND EXTRACT(MONTH FROM expense_date) = $2
         AND EXTRACT(YEAR FROM expense_date) = $3
       GROUP BY category
       ORDER BY total DESC
       LIMIT 1`,
      [req.user.id, month, year]
    );

    const payload = {
      month,
      year,
      totalSpent: parseFloat(summaryRes.rows[0].total_spent) || 0,
      transactionCount: parseInt(summaryRes.rows[0].transaction_count) || 0,
      topCategory: topCategoryRes.rows[0]?.category || null,
    };

    const sent = await emailService.sendMonthlyReport(user, payload);
    if (!sent) return res.status(500).json({ error: 'Không thể gửi báo cáo qua email.' });
    return res.json({ success: true, message: 'Báo cáo hàng tháng đã được gửi.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { getMonthlySummary, sendMonthlyReport };
