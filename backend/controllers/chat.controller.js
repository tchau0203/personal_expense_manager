/* ================================================================
   chat.controller.js — AI Chat với Google Gemini 2.0 Flash
   Trợ lý tài chính cá nhân thông minh, biết dữ liệu thực của user
   ================================================================ */
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getPool } = require('../database/database');

// Khởi tạo Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Lấy context tài chính thực của user từ DB
async function getUserFinancialContext(userId) {
  const pool = getPool();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  try {
    // Tổng chi tiêu tháng này theo danh mục
    const expenseRes = await pool.query(`
      SELECT category, SUM(amount) AS total, COUNT(*) AS count
      FROM expenses
      WHERE user_id = $1
        AND EXTRACT(MONTH FROM expense_date) = $2
        AND EXTRACT(YEAR  FROM expense_date) = $3
      GROUP BY category
      ORDER BY total DESC
    `, [userId, month, year]);

    // Ngân sách tháng này
    const budgetRes = await pool.query(`
      SELECT category, amount
      FROM budgets
      WHERE user_id = $1 AND month = $2 AND year = $3
    `, [userId, month, year]);

    // Tổng chi tiêu tháng trước
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear  = month === 1 ? year - 1 : year;
    const prevRes = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM expenses
      WHERE user_id = $1
        AND EXTRACT(MONTH FROM expense_date) = $2
        AND EXTRACT(YEAR  FROM expense_date) = $3
    `, [userId, prevMonth, prevYear]);

    // Goals đang active
    const goalsRes = await pool.query(`
      SELECT title, target_amount, current_amount, deadline, status
      FROM goals
      WHERE user_id = $1 AND status = 'active'
      ORDER BY deadline ASC NULLS LAST
      LIMIT 5
    `, [userId]);

    // Reminders sắp đến hạn
    const remindersRes = await pool.query(`
      SELECT title, due_date, amount, frequency
      FROM reminders
      WHERE user_id = $1
        AND active = TRUE
        AND due_date >= CURRENT_DATE
      ORDER BY due_date ASC
      LIMIT 5
    `, [userId]);

    // 5 giao dịch gần nhất
    const recentRes = await pool.query(`
      SELECT description, amount, category, expense_date
      FROM expenses
      WHERE user_id = $1
      ORDER BY expense_date DESC, id DESC
      LIMIT 5
    `, [userId]);

    // Tính toán tổng hợp
    const totalSpent = expenseRes.rows.reduce((s, r) => s + parseFloat(r.total), 0);
    const totalBudget = budgetRes.rows.reduce((s, r) => s + parseFloat(r.amount), 0);

    const budgetMap = {};
    budgetRes.rows.forEach(b => { budgetMap[b.category] = parseFloat(b.amount); });

    const categoryDetails = expenseRes.rows.map(r => {
      const spent = parseFloat(r.total);
      const budget = budgetMap[r.category];
      const pct = budget ? Math.round((spent / budget) * 100) : null;
      return {
        category: r.category,
        spent: spent.toLocaleString('vi-VN'),
        count: r.count,
        budget: budget ? budget.toLocaleString('vi-VN') : 'Chưa đặt',
        budgetUsed: pct ? `${pct}%` : 'N/A',
        status: pct && pct >= 100 ? '⚠️ Vượt ngân sách' : pct && pct >= 80 ? '🟡 Sắp vượt' : '✅ Ổn'
      };
    });

    return {
      month: `${month}/${year}`,
      totalSpent: totalSpent.toLocaleString('vi-VN'),
      totalBudget: totalBudget > 0 ? totalBudget.toLocaleString('vi-VN') : 'Chưa đặt ngân sách',
      saved: totalBudget > 0 ? (totalBudget - totalSpent).toLocaleString('vi-VN') : 'N/A',
      prevMonthTotal: parseFloat(prevRes.rows[0].total).toLocaleString('vi-VN'),
      categories: categoryDetails,
      goals: goalsRes.rows.map(g => ({
        title: g.title,
        progress: `${parseFloat(g.current_amount).toLocaleString('vi-VN')} / ${parseFloat(g.target_amount).toLocaleString('vi-VN')} ₫`,
        percent: Math.round((g.current_amount / g.target_amount) * 100),
        deadline: g.deadline ? new Date(g.deadline).toLocaleDateString('vi-VN') : 'Không có',
      })),
      reminders: remindersRes.rows.map(r => ({
        title: r.title,
        due: new Date(r.due_date).toLocaleDateString('vi-VN'),
        amount: r.amount ? parseFloat(r.amount).toLocaleString('vi-VN') + ' ₫' : 'Không có',
        frequency: r.frequency === 'monthly' ? 'Hàng tháng' : r.frequency === 'weekly' ? 'Hàng tuần' : 'Một lần',
      })),
      recentTransactions: recentRes.rows.map(r => ({
        desc: r.description,
        amount: parseFloat(r.amount).toLocaleString('vi-VN') + ' ₫',
        category: r.category,
        date: new Date(r.expense_date).toLocaleDateString('vi-VN'),
      })),
    };
  } catch (err) {
    console.error('[Chat] Error fetching user context:', err.message);
    return null;
  }
}

// Tạo system prompt với dữ liệu thực của user
function buildSystemPrompt(ctx) {
  const ctxStr = ctx ? `
=== DỮ LIỆU TÀI CHÍNH THỰC CỦA NGƯỜI DÙNG (Tháng ${ctx.month}) ===

📊 TỔNG QUAN:
- Tổng chi tiêu tháng này: ${ctx.totalSpent} ₫
- Tổng ngân sách: ${ctx.totalBudget} ${ctx.totalBudget !== 'Chưa đặt ngân sách' ? '₫' : ''}
- Tiết kiệm được: ${ctx.saved} ${ctx.saved !== 'N/A' ? '₫' : ''}
- Tháng trước chi: ${ctx.prevMonthTotal} ₫

📂 CHI TIÊU THEO DANH MỤC:
${ctx.categories.map(c => `- ${c.category}: ${c.spent} ₫ (${c.count} giao dịch) | Ngân sách: ${c.budget} ${c.budget !== 'Chưa đặt' ? '₫' : ''} | ${c.budgetUsed} đã dùng ${c.status}`).join('\n') || '- Chưa có dữ liệu chi tiêu'}

🎯 MỤC TIÊU TIẾT KIỆM:
${ctx.goals.length ? ctx.goals.map(g => `- ${g.title}: ${g.progress} (${g.percent}%) | Deadline: ${g.deadline}`).join('\n') : '- Chưa có mục tiêu nào'}

🔔 NHẮC NHỞ SẮP ĐẾN HẠN:
${ctx.reminders.length ? ctx.reminders.map(r => `- ${r.title}: ${r.due} | ${r.amount} | ${r.frequency}`).join('\n') : '- Không có nhắc nhở sắp đến hạn'}

💳 5 GIAO DỊCH GẦN NHẤT:
${ctx.recentTransactions.map(t => `- ${t.date}: ${t.desc} (${t.category}) - ${t.amount}`).join('\n') || '- Chưa có giao dịch'}
` : '\n(Chưa có dữ liệu tài chính — hãy động viên người dùng thêm chi tiêu đầu tiên)\n';

  return `Bạn là **Trợ lý AI Tài chính** thông minh của ứng dụng ExpenseManager. Nhiệm vụ của bạn là giúp người dùng hiểu và cải thiện tình hình tài chính cá nhân.

${ctxStr}

=== HƯỚNG DẪN TRẢ LỜI ===
1. Luôn trả lời bằng **tiếng Việt** rõ ràng, thân thiện, dễ hiểu
2. Dùng dữ liệu THỰC của người dùng ở trên khi trả lời — KHÔNG bịa đặt số liệu
3. Đưa ra lời khuyên CỤ THỂ, THỰC TẾ dựa trên dữ liệu
4. Dùng emoji phù hợp để trả lời sinh động
5. Giữ câu trả lời ngắn gọn (3-5 câu trừ khi được yêu cầu chi tiết)
6. Nếu được hỏi về tính năng app: giải thích ngắn gọn
7. KHÔNG cung cấp lời khuyên y tế, pháp lý — chỉ tư vấn tài chính cá nhân`;
}

// POST /api/chat
async function chat(req, res) {
  const { message, history = [] } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Vui lòng nhập tin nhắn.' });
  }

  try {
    // Lấy context tài chính của user
    const ctx = await getUserFinancialContext(req.user.id);
    const systemPrompt = buildSystemPrompt(ctx);

    // Xây dựng history cho Gemini (tối đa 10 turns)
    const recentHistory = history.slice(-10);
    const geminiHistory = recentHistory.map(h => ({
      role: h.role,
      parts: [{ text: h.content }],
    }));

    // Bắt đầu chat session
    const chatSession = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Xin chào! Tôi là Trợ lý AI Tài chính của bạn. Tôi đã nắm được thông tin tài chính của bạn và sẵn sàng giúp đỡ. Bạn muốn biết điều gì? 💰' }] },
        ...geminiHistory,
      ],
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
    });

    const result = await chatSession.sendMessage(message.trim());
    const reply = result.response.text();

    return res.json({ reply, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('[Chat] Gemini error:', err.message);
    if (err.message?.includes('API_KEY')) {
      return res.status(500).json({ error: 'API key không hợp lệ. Vui lòng kiểm tra cấu hình.' });
    }
    return res.status(500).json({ error: 'Không thể kết nối AI. Vui lòng thử lại.' });
  }
}

module.exports = { chat };
