/* ================================================================
   ai-insights.controller.js — AI/Smart Insights (Phase 4)
   Rule-based intelligent suggestions based on spending habits
   ================================================================ */
const { getPool } = require('../../database/database');

// ── Financial tips pool ──────────────────────────────────────────
const FINANCIAL_TIPS = [
  { id: 1, icon: '🍜', category: 'Ăn uống',   tip: 'Nấu ăn tại nhà ít nhất 3 lần/tuần có thể tiết kiệm đến 40% chi phí ăn uống.' },
  { id: 2, icon: '🚗', category: 'Đi lại',    tip: 'Dùng xe công cộng hoặc đi chung xe giúp giảm chi phí đi lại và bảo vệ môi trường.' },
  { id: 3, icon: '🛍️', category: 'Mua sắm',   tip: 'Lập danh sách mua sắm trước khi đi để tránh mua những thứ không cần thiết.' },
  { id: 4, icon: '🎮', category: 'Giải trí',  tip: 'Đặt ngân sách giải trí cố định hàng tháng để không chi tiêu quá tay.' },
  { id: 5, icon: '💊', category: 'Y tế',      tip: 'Kiểm tra sức khỏe định kỳ giúp phát hiện sớm bệnh tật, tiết kiệm chi phí điều trị lớn hơn.' },
  { id: 6, icon: '📚', category: 'Giáo dục',  tip: 'Đầu tư vào học tập là khoản đầu tư sinh lời cao nhất về lâu dài.' },
  { id: 7, icon: '🏠', category: 'Tiền nhà',  tip: 'Chia sẻ chi phí ở trọ với bạn bè hoặc người thân có thể tiết kiệm đáng kể.' },
  { id: 8, icon: '💡', category: 'Khác',      tip: 'Quy tắc 50/30/20: 50% cho nhu cầu, 30% cho mong muốn, 20% cho tiết kiệm.' },
  { id: 9, icon: '💰', category: null,        tip: 'Thiết lập tự động chuyển tiền vào tài khoản tiết kiệm ngay khi nhận lương.' },
  { id: 10, icon: '📊', category: null,       tip: 'Xem xét lại chi tiêu hàng tuần để phát hiện sớm các khoản lãng phí.' },
  { id: 11, icon: '🎯', category: null,       tip: 'Đặt mục tiêu tài chính cụ thể (ví dụ: tiết kiệm 5 triệu trong 3 tháng) để có động lực hơn.' },
  { id: 12, icon: '⚡', category: null,       tip: 'Hủy các subscription không dùng đến sẽ giúp bạn tiết kiệm vài trăm nghìn mỗi tháng.' },
];

// ── GET /api/insights/tips ───────────────────────────────────────
// Trả về gợi ý tài chính cá nhân hóa dựa trên top category chi tiêu
async function getInsightTips(req, res) {
  try {
    const pool = getPool();
    const userId = req.user.id;
    const now = new Date();

    // Lấy top 3 danh mục chi tiêu nhiều nhất trong tháng hiện tại
    const topCatResult = await pool.query(`
      SELECT category, SUM(amount) AS total
      FROM expenses
      WHERE user_id = $1
        AND EXTRACT(MONTH FROM expense_date) = $2
        AND EXTRACT(YEAR  FROM expense_date) = $3
      GROUP BY category
      ORDER BY total DESC
      LIMIT 3
    `, [userId, now.getMonth() + 1, now.getFullYear()]);

    const topCategories = topCatResult.rows.map(r => r.category);

    // Chọn tips liên quan đến top categories + tips chung
    const relevantTips = FINANCIAL_TIPS.filter(t =>
      t.category === null || topCategories.includes(t.category)
    );

    // Trộn và lấy tối đa 5 tips
    const shuffled = relevantTips.sort(() => Math.random() - 0.5).slice(0, 5);

    return res.json({ tips: shuffled, topCategories });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// ── GET /api/insights/auto-categorize?description=xxx ────────────
// Gợi ý danh mục tự động dựa trên từ khóa mô tả (rule-based)
const CATEGORY_RULES = [
  { keywords: ['cơm', 'phở', 'bún', 'cháo', 'bánh mì', 'ăn', 'uống', 'coffee', 'cafe', 'trà', 'nhà hàng', 'quán', 'food', 'eat'], category: 'Ăn uống' },
  { keywords: ['grab', 'xe', 'taxi', 'bus', 'xăng', 'oil', 'đi lại', 'travel', 'uber', 'be', 'gojek', 'tàu', 'vé'], category: 'Đi lại' },
  { keywords: ['mua', 'shop', 'quần', 'áo', 'giày', 'túi', 'fashion', 'clothes', 'mall', 'siêu thị', 'shopee', 'lazada'], category: 'Mua sắm' },
  { keywords: ['game', 'phim', 'cinema', 'rạp', 'concert', 'bar', 'club', 'karaoke', 'vui', 'giải trí', 'netflix', 'spotify'], category: 'Giải trí' },
  { keywords: ['thuốc', 'bệnh viện', 'phòng khám', 'bác sĩ', 'y tế', 'medical', 'hospital', 'khám', 'health'], category: 'Y tế' },
  { keywords: ['học', 'sách', 'khóa học', 'trường', 'education', 'course', 'training', 'tutoring', 'school', 'university'], category: 'Giáo dục' },
  { keywords: ['thuê nhà', 'tiền nhà', 'rent', 'điện', 'nước', 'internet', 'wifi', 'nhà', 'phòng', 'ký túc xá'], category: 'Tiền nhà' },
];

async function autoCategorize(req, res) {
  const { description = '' } = req.query;
  if (!description.trim()) {
    return res.json({ category: null, confidence: 0 });
  }

  const lowerDesc = description.toLowerCase().trim();
  let bestMatch = null;
  let bestScore = 0;

  for (const rule of CATEGORY_RULES) {
    const matchCount = rule.keywords.filter(kw => lowerDesc.includes(kw)).length;
    if (matchCount > bestScore) {
      bestScore = matchCount;
      bestMatch = rule.category;
    }
  }

  return res.json({
    category: bestMatch,
    confidence: bestScore > 0 ? Math.min(bestScore / 2, 1) : 0,
  });
}

// ── GET /api/insights/trends?months=3 ───────────────────────────
// Xu hướng tiêu dùng theo danh mục trong N tháng gần nhất
async function getSpendingTrends(req, res) {
  try {
    const pool = getPool();
    const userId = req.user.id;
    const months = Math.min(parseInt(req.query.months) || 3, 12);

    const result = await pool.query(`
      SELECT
        EXTRACT(YEAR  FROM expense_date)::INT AS year,
        EXTRACT(MONTH FROM expense_date)::INT AS month,
        category,
        SUM(amount) AS total
      FROM expenses
      WHERE user_id = $1
        AND expense_date >= NOW() - ($2 || ' months')::INTERVAL
      GROUP BY year, month, category
      ORDER BY year ASC, month ASC, total DESC
    `, [userId, months]);

    // Group by month
    const monthMap = {};
    for (const row of result.rows) {
      const key = `${row.year}-${String(row.month).padStart(2, '0')}`;
      if (!monthMap[key]) {
        monthMap[key] = { year: row.year, month: row.month, categories: {}, total: 0 };
      }
      monthMap[key].categories[row.category] = parseFloat(row.total);
      monthMap[key].total += parseFloat(row.total);
    }

    // Xu hướng tăng/giảm: so sánh tháng gần nhất với trung bình các tháng trước
    const monthKeys = Object.keys(monthMap).sort();
    const trend = monthKeys.length >= 2
      ? (() => {
          const latest = monthMap[monthKeys[monthKeys.length - 1]].total;
          const prev = monthMap[monthKeys[monthKeys.length - 2]].total;
          const pct = prev > 0 ? ((latest - prev) / prev * 100) : null;
          return { direction: latest > prev ? 'up' : 'down', percent: pct };
        })()
      : null;

    // Top spending category across all months
    const categoryTotals = {};
    for (const mData of Object.values(monthMap)) {
      for (const [cat, amt] of Object.entries(mData.categories)) {
        categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
      }
    }
    const topCategory = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])[0] || null;

    return res.json({
      months: Object.values(monthMap),
      trend,
      topCategory: topCategory ? { category: topCategory[0], total: topCategory[1] } : null,
      categoryTotals,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// ── GET /api/insights/summary ────────────────────────────────────
// Tóm tắt nhanh insights: tiết kiệm được bao nhiêu so với budget
async function getInsightSummary(req, res) {
  try {
    const pool = getPool();
    const userId = req.user.id;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();

    // Tổng chi tiêu tháng này
    const spentRes = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM expenses
      WHERE user_id = $1
        AND EXTRACT(MONTH FROM expense_date) = $2
        AND EXTRACT(YEAR  FROM expense_date) = $3
    `, [userId, month, year]);

    // Tổng ngân sách tháng này
    const budgetRes = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM budgets
      WHERE user_id = $1 AND month = $2 AND year = $3
    `, [userId, month, year]);

    // Số goals đang active
    const goalsRes = await pool.query(`
      SELECT COUNT(*) AS count,
             COUNT(CASE WHEN current_amount >= target_amount THEN 1 END) AS completed
      FROM goals
      WHERE user_id = $1 AND status != 'archived'
    `, [userId]);

    // Số reminders sắp đến hạn (trong 7 ngày tới)
    const reminderRes = await pool.query(`
      SELECT COUNT(*) AS count
      FROM reminders
      WHERE user_id = $1
        AND active = TRUE
        AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
    `, [userId]);

    const spent = parseFloat(spentRes.rows[0].total);
    const budget = parseFloat(budgetRes.rows[0].total);
    const saved = budget > 0 ? budget - spent : null;

    return res.json({
      spent,
      budget,
      saved,
      savingRate: budget > 0 ? ((budget - spent) / budget * 100) : null,
      goals: {
        active: parseInt(goalsRes.rows[0].count),
        completed: parseInt(goalsRes.rows[0].completed),
      },
      upcomingReminders: parseInt(reminderRes.rows[0].count),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { getInsightTips, autoCategorize, getSpendingTrends, getInsightSummary };
