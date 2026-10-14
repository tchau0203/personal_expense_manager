/* ================================================================
   email.service.js — Nodemailer email service (Phase 3)
   Cấu hình: đặt SMTP_* trong .env
   ================================================================ */
const nodemailer = require('nodemailer');

// Tạo transporter từ biến môi trường
function createTransporter() {
  if (!process.env.SMTP_HOST && !process.env.SMTP_SERVICE) {
    return null; // Email chưa được cấu hình
  }

  const config = process.env.SMTP_SERVICE
    ? {
        service: process.env.SMTP_SERVICE, // 'gmail'
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      }
    : {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      };

  return nodemailer.createTransport(config);
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'Personal Expense Manager <noreply@expense.app>';

// ── Helper gửi mail ───────────────────────────────────────────
async function sendMail({ to, subject, html }) {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[Email] Chưa cấu hình SMTP — bỏ qua gửi mail tới ${to}`);
    return false;
  }
  try {
    await transporter.sendMail({ from: FROM_EMAIL, to, subject, html });
    console.log(`[Email] ✅ Đã gửi "${subject}" tới ${to}`);
    return true;
  } catch (err) {
    console.error(`[Email] ❌ Gửi mail thất bại: ${err.message}`);
    return false;
  }
}

// ── Template: Chào mừng ───────────────────────────────────────
async function sendWelcome(user) {
  const html = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;border-radius:12px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px 32px;text-align:center">
      <h1 style="margin:0;font-size:28px;color:#fff">💰 Personal Expense Manager</h1>
      <p style="margin:8px 0 0;color:#c4b5fd;font-size:16px">Quản lý chi tiêu thông minh</p>
    </div>
    <div style="padding:32px">
      <h2 style="color:#a5b4fc;margin-top:0">Xin chào, ${user.username}! 🎉</h2>
      <p style="line-height:1.7;color:#94a3b8">
        Chào mừng bạn đến với <strong style="color:#e2e8f0">Personal Expense Manager</strong>. 
        Tài khoản của bạn đã được tạo thành công với email <strong style="color:#e2e8f0">${user.email}</strong>.
      </p>
      <div style="background:#1e293b;border-radius:8px;padding:20px;margin:24px 0">
        <h3 style="margin:0 0 12px;color:#a5b4fc;font-size:14px;text-transform:uppercase;letter-spacing:1px">Bạn có thể làm gì?</h3>
        <ul style="margin:0;padding-left:20px;color:#94a3b8;line-height:2">
          <li>📊 Theo dõi chi tiêu hàng ngày</li>
          <li>📈 Xem biểu đồ phân tích</li>
          <li>💼 Quản lý ngân sách theo danh mục</li>
          <li>📤 Xuất báo cáo CSV / PDF</li>
        </ul>
      </div>
      <p style="color:#64748b;font-size:13px">Email này được gửi tự động, vui lòng không reply.</p>
    </div>
  </div>`;

  return sendMail({
    to: user.email,
    subject: '🎉 Chào mừng đến với Personal Expense Manager!',
    html,
  });
}

// ── Template: Cảnh báo ngân sách ─────────────────────────────
async function sendBudgetAlert(user, { category, spent, budget, percent }) {
  const color = percent >= 100 ? '#ef4444' : '#f97316';
  const label = percent >= 100 ? '🔴 Đã vượt ngân sách!' : '🟠 Gần chạm ngân sách!';

  const html = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;border-radius:12px;overflow:hidden">
    <div style="background:${color};padding:32px;text-align:center">
      <h1 style="margin:0;font-size:24px;color:#fff">${label}</h1>
    </div>
    <div style="padding:32px">
      <p style="color:#94a3b8;line-height:1.7">
        Xin chào <strong style="color:#e2e8f0">${user.username}</strong>, 
        chi tiêu danh mục <strong style="color:#e2e8f0">${category}</strong> của bạn đã đạt 
        <strong style="color:${color}">${percent.toFixed(0)}%</strong> ngân sách tháng này.
      </p>
      <div style="background:#1e293b;border-radius:8px;padding:20px;margin:16px 0">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="color:#94a3b8">Đã chi</span>
          <strong style="color:#e2e8f0">${spent.toLocaleString('vi-VN')} đ</strong>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px">
          <span style="color:#94a3b8">Ngân sách</span>
          <strong style="color:#e2e8f0">${budget.toLocaleString('vi-VN')} đ</strong>
        </div>
        <div style="background:#0f172a;border-radius:4px;height:8px">
          <div style="background:${color};width:${Math.min(percent,100).toFixed(0)}%;height:8px;border-radius:4px"></div>
        </div>
      </div>
      <p style="color:#64748b;font-size:13px">Email này được gửi tự động từ hệ thống.</p>
    </div>
  </div>`;

  return sendMail({
    to: user.email,
    subject: `${label} Danh mục ${category} — ${percent.toFixed(0)}%`,
    html,
  });
}

// ── Template: Báo cáo tháng ───────────────────────────────────
async function sendMonthlyReport(user, { month, year, totalSpent, topCategory, transactionCount }) {
  const html = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;border-radius:12px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center">
      <h1 style="margin:0;font-size:24px;color:#fff">📊 Báo cáo tháng ${month}/${year}</h1>
    </div>
    <div style="padding:32px">
      <p style="color:#94a3b8">Xin chào <strong style="color:#e2e8f0">${user.username}</strong>, đây là tổng kết chi tiêu của bạn trong tháng ${month}/${year}:</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:24px 0">
        <div style="background:#1e293b;border-radius:8px;padding:16px;text-align:center">
          <div style="font-size:13px;color:#64748b;margin-bottom:4px">Tổng chi tiêu</div>
          <div style="font-size:20px;font-weight:700;color:#a5b4fc">${totalSpent.toLocaleString('vi-VN')} đ</div>
        </div>
        <div style="background:#1e293b;border-radius:8px;padding:16px;text-align:center">
          <div style="font-size:13px;color:#64748b;margin-bottom:4px">Số giao dịch</div>
          <div style="font-size:20px;font-weight:700;color:#34d399">${transactionCount}</div>
        </div>
      </div>
      ${topCategory ? `<p style="color:#94a3b8">Danh mục chi nhiều nhất: <strong style="color:#e2e8f0">${topCategory}</strong></p>` : ''}
      <p style="color:#64748b;font-size:13px">Email này được gửi tự động vào đầu tháng.</p>
    </div>
  </div>`;

  return sendMail({
    to: user.email,
    subject: `📊 Báo cáo chi tiêu tháng ${month}/${year}`,
    html,
  });
}

module.exports = { sendWelcome, sendBudgetAlert, sendMonthlyReport };
