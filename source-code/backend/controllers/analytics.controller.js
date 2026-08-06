/* ================================================================
   analytics.controller.js — Advanced Analytics (Phase 3)
   ================================================================ */
const { getPool } = require('../../database/database');

// GET /api/analytics/monthly-compare?month=8&year=2026
// So sánh chi tiêu tháng hiện tại vs tháng trước
async function monthlyCompare(req, res) {
  try {
    const pool = getPool();
    const userId = req.user.id;
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year  = parseInt(req.query.year)  || now.getFullYear();

    // Tháng trước
    const prevDate = new Date(year, month - 2, 1);
    const prevMonth = prevDate.getMonth() + 1;
    const prevYear  = prevDate.getFullYear();

    const q = `
      SELECT
        EXTRACT(MONTH FROM expense_date)::INT AS month,
        EXTRACT(YEAR  FROM expense_date)::INT AS year,
        category,
        SUM(amount) AS total
      FROM expenses
      WHERE user_id = $1
        AND (
          (EXTRACT(MONTH FROM expense_date) = $2 AND EXTRACT(YEAR FROM expense_date) = $3)
          OR
          (EXTRACT(MONTH FROM expense_date) = $4 AND EXTRACT(YEAR FROM expense_date) = $5)
        )
      GROUP BY month, year, category
      ORDER BY category, year, month
    `;
    const result = await pool.query(q, [userId, month, year, prevMonth, prevYear]);

    // Gom theo tháng
    const current = { month, year, total: 0, byCategory: {} };
    const previous = { month: prevMonth, year: prevYear, total: 0, byCategory: {} };

    for (const row of result.rows) {
      const target = (row.month === month && row.year === year) ? current : previous;
      target.total += parseFloat(row.total);
      target.byCategory[row.category] = parseFloat(row.total);
    }

    // Tổng theo tháng (không phân category)
    const totals = await pool.query(`
      SELECT
        EXTRACT(MONTH FROM expense_date)::INT AS month,
        EXTRACT(YEAR  FROM expense_date)::INT AS year,
        SUM(amount) AS total
      FROM expenses
      WHERE user_id = $1
        AND (
          (EXTRACT(MONTH FROM expense_date) = $2 AND EXTRACT(YEAR FROM expense_date) = $3)
          OR
          (EXTRACT(MONTH FROM expense_date) = $4 AND EXTRACT(YEAR FROM expense_date) = $5)
        )
      GROUP BY month, year
    `, [userId, month, year, prevMonth, prevYear]);

    for (const row of totals.rows) {
      if (row.month === month && row.year === year) current.total = parseFloat(row.total);
      else previous.total = parseFloat(row.total);
    }

    const change = previous.total > 0
      ? ((current.total - previous.total) / previous.total * 100)
      : null;

    return res.json({ current, previous, changePercent: change });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/analytics/forecast?month=8&year=2026
// Dự báo chi tiêu cuối tháng dựa trên tốc độ hiện tại
async function forecast(req, res) {
  try {
    const pool = getPool();
    const userId = req.user.id;
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year  = parseInt(req.query.year)  || now.getFullYear();

    // Tổng đã chi trong tháng
    const spentResult = await pool.query(`
      SELECT SUM(amount) AS spent, COUNT(*) AS count
      FROM expenses
      WHERE user_id = $1
        AND EXTRACT(MONTH FROM expense_date) = $2
        AND EXTRACT(YEAR  FROM expense_date) = $3
    `, [userId, month, year]);

    const spent = parseFloat(spentResult.rows[0].spent) || 0;
    const count = parseInt(spentResult.rows[0].count) || 0;

    // Tính số ngày đã qua và còn lại trong tháng
    const daysInMonth = new Date(year, month, 0).getDate();
    const daysPassed = month === now.getMonth() + 1 && year === now.getFullYear()
      ? now.getDate()
      : daysInMonth;
    const daysRemaining = daysInMonth - daysPassed;

    const dailyRate = daysPassed > 0 ? spent / daysPassed : 0;
    const projectedTotal = spent + (dailyRate * daysRemaining);

    // Chi tiêu trung bình 3 tháng trước để so sánh
    const avgResult = await pool.query(`
      SELECT AVG(monthly_total) AS avg_3m FROM (
        SELECT SUM(amount) AS monthly_total
        FROM expenses
        WHERE user_id = $1
          AND expense_date >= NOW() - INTERVAL '3 months'
          AND expense_date < DATE_TRUNC('month', NOW())
        GROUP BY DATE_TRUNC('month', expense_date)
      ) sub
    `, [userId]);
    const avg3Month = parseFloat(avgResult.rows[0].avg_3m) || 0;

    return res.json({
      spent,
      daysPassed,
      daysRemaining,
      daysInMonth,
      dailyRate,
      projectedTotal,
      avg3Month,
      transactionCount: count,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/analytics/streak
// Đếm số ngày liên tiếp không vượt ngân sách
async function savingStreak(req, res) {
  try {
    const pool = getPool();
    const userId = req.user.id;

    // Lấy 30 ngày gần nhất
    const result = await pool.query(`
      SELECT
        DATE(expense_date) AS day,
        SUM(amount) AS daily_total
      FROM expenses
      WHERE user_id = $1
        AND expense_date >= NOW() - INTERVAL '30 days'
      GROUP BY day
      ORDER BY day DESC
    `, [userId]);

    // Lấy ngân sách tháng hiện tại
    const now = new Date();
    const budgets = await pool.query(`
      SELECT category, amount FROM budgets
      WHERE user_id = $1 AND month = $2 AND year = $3
    `, [userId, now.getMonth() + 1, now.getFullYear()]);

    const dailyBudgetLimit = budgets.rows.reduce((sum, b) => sum + parseFloat(b.amount), 0) / 30;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < result.rows.length; i++) {
      const dayTotal = parseFloat(result.rows[i].daily_total);
      if (dailyBudgetLimit > 0 && dayTotal > dailyBudgetLimit) break;
      if (dailyBudgetLimit === 0 && dayTotal > 0) {
        // Không có ngân sách — tính theo trung bình lịch sử
        break;
      }
      streak++;
    }

    return res.json({ streak, dailyBudgetLimit });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/analytics/top-categories?month=8&year=2026&limit=5
// Top danh mục chi tiêu nhiều nhất
async function topCategories(req, res) {
  try {
    const pool = getPool();
    const userId = req.user.id;
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year  = parseInt(req.query.year)  || now.getFullYear();
    const limit = parseInt(req.query.limit) || 5;

    const result = await pool.query(`
      SELECT
        category,
        SUM(amount) AS total,
        COUNT(*)    AS count,
        AVG(amount) AS avg_amount
      FROM expenses
      WHERE user_id = $1
        AND EXTRACT(MONTH FROM expense_date) = $2
        AND EXTRACT(YEAR  FROM expense_date) = $3
      GROUP BY category
      ORDER BY total DESC
      LIMIT $4
    `, [userId, month, year, limit]);

    const grandTotal = result.rows.reduce((s, r) => s + parseFloat(r.total), 0);
    const data = result.rows.map(r => ({
      category: r.category,
      total: parseFloat(r.total),
      count: parseInt(r.count),
      avgAmount: parseFloat(r.avg_amount),
      percent: grandTotal > 0 ? (parseFloat(r.total) / grandTotal * 100) : 0,
    }));

    return res.json({ data, grandTotal });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/analytics/currencies
// Danh sách tiền tệ hỗ trợ
async function getCurrencies(req, res) {
  const { getSupportedCurrencies } = require('../services/currency.service');
  return res.json(getSupportedCurrencies());
}

module.exports = { monthlyCompare, forecast, savingStreak, topCategories, getCurrencies };
