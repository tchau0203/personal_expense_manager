# PHASE 3 — Personal Expense Manager

> **Trạng thái:** ✅ Hoàn thành
> **Phiên bản:** v3.0.0
> **Ngày hoàn thành:** 2026-08-04
> **Nhánh:** `dev-chau`

---

## Tổng kết thay đổi

### 🔒 Security Hardening
- ✅ Helmet.js — HTTP security headers (CSP, XSS, HSTS...)
- ✅ Account lockout — khoá tài khoản sau 5 lần đăng nhập sai (15 phút)
- ✅ Refresh token — JWT access ngắn hạn (15m) + refresh token 30 ngày
- ✅ Audit log — ghi lại login_success, login_fail, logout, password_change
- ✅ Rate limiting nghiêm ngặt hơn cho /auth/login và /auth/register (20 req/15min)

### ⚡ Performance
- ✅ compression middleware — nén gzip tất cả responses
- ✅ Debounce search — 300ms delay giảm API calls khi gõ tìm kiếm
- ✅ Lazy loading analytics — chỉ load khi mở trang Analytics
- ✅ DB indexes mới — idx_expenses_category, idx_expenses_currency

### 📊 Analytics nâng cao
- ✅ Dự báo chi tiêu cuối tháng (dựa trên tốc độ chi hiện tại)
- ✅ So sánh tháng vs tháng trước (% tăng/giảm)
- ✅ Streak tiết kiệm (đếm ngày liên tiếp trong ngân sách)
- ✅ Top danh mục chi tiêu

### 💱 Đa tiền tệ
- ✅ 8 loại tiền tệ: VND, USD, EUR, JPY, CNY, SGD, KRW, THB
- ✅ Tỷ giá cứng (fallback) + optional ExchangeRate-API
- ✅ Currency field trong modal thêm/sửa chi tiêu
- ✅ Currency column trong DB và CSV export

### 📧 Email Service
- ✅ email.service.js với Nodemailer
- ✅ Template: chào mừng đăng ký
- ✅ Template: cảnh báo ngân sách 80%
- ✅ Template: báo cáo tháng
- ✅ Preferences: bật/tắt từng loại notification trong Profile

### ✨ UX nâng cao
- ✅ Ghi chú (notes) cho mỗi khoản chi tiêu
- ✅ Import CSV — drag & drop, preview trước khi import
- ✅ In-app notification panel — bell button, badge, clear all
- ✅ Audit log hiển thị trong trang Profile
- ✅ Cài đặt thông báo email trong Profile

### ⚙️ CI/CD & DevOps
- ✅ GitHub Actions CI — chạy tests khi push/PR
- ✅ GET /api/health — health check endpoint
- ✅ Winston structured logging — thay console.log
- ✅ Procfile, railway.json — cấu hình deploy Railway
- ✅ .env.example — template đầy đủ

### 🗄️ Database
- ✅ migration_phase3.sql — notes, currency, failed_attempts, locked_until, refresh_tokens, audit_logs

---

## Test Coverage

```
Test Suites: 3 passed, 3 total
Tests:       27 passed, 27 total
```

---

## Hướng dẫn Deploy

### Railway (Backend)
1. Tạo account tại railway.app
2. New Project → Deploy from GitHub
3. Thêm PostgreSQL plugin
4. Set environment variables từ .env.example
5. Railway tự detect railway.json và deploy

### Vercel (Frontend)
1. Tạo account tại vercel.com
2. Import GitHub repo
3. Root Directory: `source-code/frontend`
4. Sửa API_BASE_URL trong script.js → URL Railway
