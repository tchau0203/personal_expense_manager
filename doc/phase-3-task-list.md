# Phase 3 - Task List

## Mục tiêu
Đưa Personal Expense Manager lên môi trường **production** với đầy đủ tính năng nâng cao: deploy lên cloud, thông báo qua email, hỗ trợ đa tiền tệ, tối ưu hiệu năng và nâng cao trải nghiệm người dùng.

---

## Nhiệm vụ chính

### 1. Deploy Backend lên Cloud (Railway / Render)
- [ ] Tạo tài khoản và project trên Railway hoặc Render
- [ ] Cấu hình biến môi trường (`.env`) trên cloud platform
- [ ] Thiết lập PostgreSQL database trên cloud (Railway Postgres / Supabase / Neon)
- [ ] Chạy migration SQL trên cloud database
- [ ] Cập nhật `DATABASE_URL` kết nối tới cloud DB
- [ ] Deploy backend Node.js lên cloud, kiểm tra tất cả API endpoints hoạt động
- [ ] Cấu hình CORS để cho phép frontend gọi API từ domain production
- [ ] Thiết lập auto-redeploy khi push lên nhánh `main`

### 2. Deploy Frontend lên Vercel / Netlify
- [ ] Tạo tài khoản trên Vercel hoặc Netlify
- [ ] Cập nhật `API_BASE_URL` trong `script.js` trỏ đến backend cloud URL
- [ ] Deploy thư mục `source-code/frontend/` lên Vercel / Netlify
- [ ] Kiểm tra toàn bộ luồng đăng nhập, CRUD, biểu đồ trên domain production
- [ ] Cấu hình custom domain (nếu có)
- [ ] Bật HTTPS tự động (Let's Encrypt)

### 3. Email Notifications (Thông báo qua Email)
- [ ] Chọn email service: **Nodemailer** (SMTP Gmail) hoặc **SendGrid** / **Resend**
- [ ] Cài đặt package và cấu hình thông tin email trong `.env`
- [ ] Tạo `email.service.js` — module gửi email tái sử dụng được
- [ ] Gửi email **chào mừng** khi đăng ký tài khoản mới
- [ ] Gửi email **cảnh báo ngân sách** khi chi tiêu vượt 80% hạn mức danh mục
- [ ] Gửi email **báo cáo tổng kết tháng** (tổng chi, top danh mục, so sánh tháng trước)
- [ ] Thêm tùy chỉnh trong trang Profile: bật/tắt từng loại thông báo email
- [ ] Thiết kế HTML email template đẹp (inline CSS)

### 4. Hỗ trợ Đa Tiền Tệ (Multi-Currency)
- [ ] Thêm cột `currency` vào bảng `expenses` (mặc định `VND`)
- [ ] Tích hợp API tỷ giá hối đoái (ví dụ: **ExchangeRate-API** hoặc **Fixer.io**)
- [ ] Tạo `currency.service.js` — lấy và cache tỷ giá, tự động cập nhật mỗi ngày
- [ ] Thêm dropdown chọn tiền tệ trong modal thêm / sửa chi tiêu
- [ ] Hiển thị số tiền với ký hiệu tiền tệ tương ứng (VND, USD, EUR, JPY, ...)
- [ ] Thêm tùy chọn **tiền tệ mặc định** trong trang Profile
- [ ] Tất cả thống kê, biểu đồ, ngân sách quy đổi về tiền tệ mặc định của user
- [ ] Cập nhật chức năng xuất CSV / PDF để ghi đúng đơn vị tiền tệ

### 5. Tối ưu Hiệu Năng (Performance Optimization)
- [ ] **Backend caching** — Dùng Redis hoặc in-memory cache cho các query thống kê nặng
- [ ] **Database indexing** — Rà soát và thêm index còn thiếu, sử dụng `EXPLAIN ANALYZE`
- [ ] **API response compression** — Thêm `compression` middleware cho Express
- [ ] **Connection pool tuning** — Tối ưu số lượng kết nối PostgreSQL pool
- [ ] **Frontend lazy loading** — Chỉ load biểu đồ khi người dùng mở trang Analytics
- [ ] **Debounce search** — Giảm số lần gọi API khi người dùng gõ tìm kiếm
- [ ] **Lighthouse audit** — Đo điểm Performance, Accessibility, SEO và cải thiện

### 6. Nâng cao Bảo mật (Security Hardening)
- [ ] Thêm **Helmet.js** — Thiết lập HTTP security headers
- [ ] Cấu hình **Content Security Policy (CSP)**
- [ ] Bật **HTTPS redirect** bắt buộc trên server
- [ ] Thêm **refresh token** — JWT access token ngắn hạn (15 phút) + refresh token dài hạn
- [ ] Lưu refresh token vào DB, hỗ trợ đăng xuất toàn bộ thiết bị
- [ ] **Audit log** — Ghi lại lịch sử đăng nhập (IP, thời gian, thiết bị)
- [ ] **Account lockout** — Khoá tài khoản tạm thời sau 5 lần đăng nhập sai

### 7. Tính năng Nâng cao cho Người Dùng
- [ ] **Ảnh đại diện (Avatar)** — Upload ảnh profile hoặc chọn avatar có sẵn
- [ ] **Thẻ / nhãn tùy chỉnh (Tags)** — Gán nhiều nhãn cho một khoản chi tiêu
- [ ] **Ghi chú (Notes)** — Thêm ghi chú chi tiết cho mỗi khoản chi tiêu
- [ ] **Chia sẻ báo cáo** — Tạo link công khai để chia sẻ báo cáo tháng (read-only)
- [ ] **Nhập dữ liệu từ CSV** — Upload file CSV để nhập hàng loạt chi tiêu
- [ ] **Tìm kiếm nâng cao** — Lọc theo khoảng số tiền, nhiều danh mục cùng lúc, nhãn
- [ ] **Thông báo trong app (In-app notifications)** — Badge, popup khi vượt ngân sách

### 8. Cải thiện Analytics & Báo cáo
- [ ] **So sánh tháng** — Biểu đồ so sánh chi tiêu tháng này vs tháng trước
- [ ] **Dự báo chi tiêu** — Dự đoán chi tiêu cuối tháng dựa trên xu hướng hiện tại
- [ ] **Top danh mục** — Danh sách danh mục tiêu tốn nhất trong kỳ
- [ ] **Streak tiết kiệm** — Đếm số ngày liên tiếp không vượt ngân sách
- [ ] **Xuất báo cáo PDF nâng cao** — Có biểu đồ, logo, tóm tắt tháng đẹp hơn

### 9. CI/CD & DevOps
- [ ] Thiết lập **GitHub Actions** — Tự động chạy `npm test` khi push / pull request
- [ ] Tích hợp **code coverage badge** vào README
- [ ] Thiết lập **staging environment** — Nhánh `dev-chau` deploy lên staging, `main` deploy lên production
- [ ] Cấu hình **health check endpoint** — `GET /api/health` trả về status server và DB
- [ ] Thêm **structured logging** — Dùng Winston hoặc Pino thay `console.log`
- [ ] Thiết lập **error monitoring** — Tích hợp Sentry để bắt lỗi production

### 10. Tài liệu và Hoàn thiện
- [ ] Viết **API documentation** đầy đủ (dùng Swagger / OpenAPI hoặc Markdown)
- [ ] Cập nhật `README.md` với hướng dẫn deploy và link demo production
- [ ] Cập nhật `project-overview.md` phản ánh kiến trúc Phase 3
- [ ] Viết `PHASE-3.md` — Báo cáo kết quả Phase 3
- [ ] Ghi lại **ADR (Architecture Decision Records)** cho các quyết định kỹ thuật quan trọng

---

## Thứ tự ưu tiên thực hiện

| Ưu tiên | Nhiệm vụ | Lý do |
|:---:|---|---|
| 🔴 Cao | Deploy Backend (Railway/Render) | Nền tảng để mọi tính năng cloud hoạt động |
| 🔴 Cao | Deploy Frontend (Vercel/Netlify) | Người dùng cần truy cập được qua internet |
| 🟠 Trung | Bảo mật nâng cao (Helmet, Refresh Token) | Bảo vệ dữ liệu người dùng trên production |
| 🟠 Trung | Email Notifications | Tăng giá trị sử dụng, giữ chân người dùng |
| 🟠 Trung | CI/CD với GitHub Actions | Đảm bảo chất lượng code tự động |
| 🟡 Thấp | Multi-Currency | Mở rộng đối tượng người dùng quốc tế |
| 🟡 Thấp | Performance Optimization | Cải thiện tốc độ khi có nhiều user |
| 🟡 Thấp | Analytics nâng cao | Tăng giá trị phân tích |
| ⚪ Cuối | Tính năng UX nâng cao | Hoàn thiện trải nghiệm sau khi hạ tầng ổn định |
| ⚪ Cuối | Tài liệu đầy đủ | Tổng kết và bàn giao dự án |

---

## Kết quả mong đợi cuối Phase 3
- Ứng dụng chạy được trên internet, có URL public (không cần localhost)
- Người dùng nhận được email thông báo ngân sách và báo cáo hàng tháng
- Hỗ trợ quản lý chi tiêu bằng nhiều loại tiền tệ khác nhau
- Hiệu năng API đạt < 200ms cho các request thông thường
- Hệ thống CI/CD tự động kiểm tra và deploy khi merge vào `main`
- Bảo mật đạt tiêu chuẩn production với HTTPS, CSP, refresh token
- Tài liệu API đầy đủ, README cập nhật link demo và hướng dẫn deploy
