# 🗂️ PHASE 1 — Hoàn Thiện Hệ Thống Personal Expense Manager

> **Trạng thái:** 🔄 Đang thực hiện  
> **Phiên bản hệ thống:** v1.0.0-alpha  
> **Ngày bắt đầu:** 2026-08-02  
> **Mục tiêu hoàn thành:** Hệ thống ổn định, có thể sử dụng đầy đủ ở môi trường local

---

## 📌 Tổng Quan Hiện Trạng

| Thành phần | Trạng thái hiện tại | Mức độ hoàn thiện |
|---|---|---|
| Frontend (HTML/CSS/JS) | Cơ bản | ~30% |
| Backend (Node.js + Express) | Cơ bản (3 API) | ~50% |
| Database (PostgreSQL) | Schema cơ bản | ~60% |
| Xử lý lỗi & Validation | Chưa có | ~10% |
| UI/UX | Chưa tối ưu | ~20% |
| Tài liệu | Sơ khai | ~30% |

---

## 🎯 Mục Tiêu Phase 1

Hoàn thiện toàn bộ chức năng cơ bản (CRUD) của ứng dụng, đảm bảo:
- Người dùng có thể **thêm, xem, xóa, chỉnh sửa** khoản chi tiêu
- Giao diện **thân thiện, responsive** và trực quan
- **Dữ liệu được lưu đúng** vào PostgreSQL
- **Xử lý lỗi rõ ràng** cho người dùng
- Nền tảng đủ vững để phát triển Phase 2

---

## 📋 Danh Sách Nhiệm Vụ Chi Tiết

---

### 🎨 PHẦN 1 — Giao Diện Người Dùng (Frontend)

#### 1.1 Cấu trúc HTML
- [ ] **Tái cấu trúc `index.html`** — Thêm semantic HTML5 (`<header>`, `<main>`, `<section>`, `<footer>`)
- [ ] **Header** — Logo, tên ứng dụng, tóm tắt tổng chi tiêu tháng hiện tại
- [ ] **Form nhập liệu** — Input: mô tả, số tiền, danh mục (dropdown), ngày chi tiêu
- [ ] **Bảng / danh sách chi tiêu** — Hiển thị đầy đủ cột: STT, mô tả, số tiền, danh mục, ngày, hành động
- [ ] **Khu vực thống kê** — Tổng chi tiêu, chi tiêu theo danh mục, chi tiêu tháng này

#### 1.2 CSS & Thiết Kế Giao Diện
- [ ] **Thiết lập Design System** — Biến CSS (`--primary-color`, `--font-base`, `--radius`, v.v.)
- [ ] **Dark mode hiện đại** — Bảng màu tối với accent màu neon/gradient
- [ ] **Typography** — Import và áp dụng font chữ từ Google Fonts (VD: Inter, Outfit)
- [ ] **Responsive layout** — Mobile-first, hoạt động tốt trên điện thoại và màn hình lớn
- [ ] **Hover effects & micro-animations** — Hiệu ứng hover cho nút, rows; transition mượt mà
- [ ] **Loading states** — Spinner khi đang tải/lưu dữ liệu
- [ ] **Toast notifications** — Thông báo thành công / lỗi dạng popup tự ẩn

#### 1.3 JavaScript (Logic Frontend)
- [ ] **Fetch API — GET** — Lấy và render danh sách chi tiêu từ `/api/expenses`
- [ ] **Fetch API — POST** — Gửi form thêm chi tiêu mới lên `/api/expenses`
- [ ] **Fetch API — DELETE** — Gọi `/api/expenses/:id` khi xóa
- [ ] **Client-side validation** — Kiểm tra trường bắt buộc, số tiền > 0, ngày hợp lệ trước khi gửi
- [ ] **Tính toán tổng chi tiêu** — Tính và hiển thị tổng ở frontend
- [ ] **Lọc theo danh mục** — Dropdown lọc danh sách theo danh mục
- [ ] **Tìm kiếm theo mô tả** — Input tìm kiếm real-time
- [ ] **Sắp xếp danh sách** — Cho phép sort theo ngày, số tiền
- [ ] **Xác nhận trước khi xóa** — Modal confirm khi người dùng bấm nút xóa
- [ ] **Reset form sau khi thêm** — Xóa sạch form sau khi submit thành công

---

### ⚙️ PHẦN 2 — Backend (Node.js + Express)

#### 2.1 API Hiện Tại — Hoàn Thiện
- [ ] **GET /api/expenses** — Thêm phân trang (pagination) và hỗ trợ query params lọc
- [ ] **POST /api/expenses** — Thêm server-side validation (kiểm tra `description`, `amount`, `category`, `date`)
- [ ] **DELETE /api/expenses/:id** — Trả về 404 nếu ID không tồn tại

#### 2.2 API Mới Cần Thêm
- [ ] **PUT /api/expenses/:id** — Cập nhật khoản chi tiêu (chỉnh sửa)
- [ ] **GET /api/expenses/summary** — Trả về tổng chi tiêu theo danh mục và theo tháng
- [ ] **GET /api/categories** — Trả về danh sách danh mục có sẵn

#### 2.3 Middleware & Cấu Trúc Code
- [ ] **Tách route ra file riêng** — `routes/expenses.js`, `routes/categories.js`
- [ ] **Middleware xử lý lỗi tập trung** — Error handler middleware trả lỗi nhất quán `{ error, message }`
- [ ] **Middleware validation** — Dùng thư viện như `joi` hoặc tự viết validate middleware
- [ ] **Logging** — Dùng `morgan` để log request/response
- [ ] **Biến môi trường** — Kiểm tra `.env.example` đầy đủ, không hardcode PORT/credentials
- [ ] **CORS cấu hình đúng** — Giới hạn origin thay vì mở toàn bộ

#### 2.4 Bảo Mật Cơ Bản
- [ ] **Sanitize input** — Ngăn SQL Injection (đã dùng parameterized query — kiểm tra lại toàn bộ)
- [ ] **Rate limiting** — Thêm `express-rate-limit` để chống lạm dụng API
- [ ] **Helmet.js** — Bảo mật HTTP headers

---

### 🗄️ PHẦN 3 — Database (PostgreSQL)

#### 3.1 Schema
- [ ] **Thêm trường `created_at`** — Timestamp tự động ghi thời gian thêm bản ghi
- [ ] **Thêm trường `updated_at`** — Timestamp tự động cập nhật khi chỉnh sửa
- [ ] **Thêm bảng `categories`** — Lưu danh mục cố định (Ăn uống, Đi lại, Giải trí, v.v.)
- [ ] **Index tối ưu** — Thêm index trên `expense_date`, `category` để truy vấn nhanh hơn
- [ ] **Constraint bổ sung** — `CHECK (amount > 0)`, NOT NULL cho các trường cần thiết

#### 3.2 Kết Nối & Xử Lý Lỗi
- [ ] **Cải thiện `database.js`** — Thêm retry logic khi kết nối thất bại
- [ ] **Pool configuration** — Cấu hình `max`, `idleTimeoutMillis`, `connectionTimeoutMillis`
- [ ] **Graceful shutdown** — Đóng pool đúng cách khi server tắt (`process.on('SIGTERM')`)
- [ ] **Health check endpoint** — `GET /health` kiểm tra kết nối DB còn sống

#### 3.3 Migration & Seeding
- [ ] **File migration** — Tách schema thành các file migration riêng (VD: `001_create_expenses.sql`)
- [ ] **Seed data** — Tạo dữ liệu mẫu cho môi trường dev/test (`seed.sql`)

---

### 🧪 PHẦN 4 — Testing & Chất Lượng Code

#### 4.1 Backend Tests
- [ ] **Cài đặt Jest + Supertest** — `npm install --save-dev jest supertest`
- [ ] **Test GET /api/expenses** — Kiểm tra trả về mảng đúng định dạng
- [ ] **Test POST /api/expenses** — Kiểm tra thêm mới thành công và validate thất bại
- [ ] **Test DELETE /api/expenses/:id** — Kiểm tra xóa đúng và xóa ID không tồn tại
- [ ] **Test PUT /api/expenses/:id** — Kiểm tra cập nhật đúng

#### 4.2 Frontend Tests (manual checklist)
- [ ] **Kiểm tra form validation** — Thử submit form rỗng, nhập số âm, ngày sai
- [ ] **Kiểm tra responsive** — Test trên mobile 375px, tablet 768px, desktop 1440px
- [ ] **Kiểm tra cross-browser** — Chrome, Firefox, Edge

#### 4.3 Chất Lượng Code
- [ ] **Cài ESLint** — Thiết lập linting cho backend JS
- [ ] **Thêm `.gitignore` đầy đủ** — Bao gồm `node_modules`, `.env`, `*.log`
- [ ] **Dọn code** — Xóa `console.log` thừa, code bị comment out không cần thiết

---

### 📁 PHẦN 5 — Cấu Trúc Dự Án & Tài Liệu

#### 5.1 Cấu Trúc Thư Mục
- [ ] **Tổ chức lại backend** — Tách thành `routes/`, `middleware/`, `controllers/`, `config/`
- [ ] **Kiểm tra frontend** — Đảm bảo `index.html`, `style.css`, `script.js` liên kết đúng
- [ ] **Tạo file `.env.example`** — Mẫu biến môi trường không chứa giá trị thật

#### 5.2 Tài Liệu
- [ ] **Cập nhật `README.md`** — Hướng dẫn setup đầy đủ, ảnh chụp màn hình giao diện
- [ ] **`doc/API.md`** — Tài liệu tất cả API endpoint (method, URL, body, response mẫu)
- [ ] **`doc/SETUP.md`** — Hướng dẫn cài đặt chi tiết từng bước cho người mới
- [ ] **`doc/DATABASE.md`** — Mô tả schema, các bảng, quan hệ giữa các bảng
- [ ] **`CHANGELOG.md`** — Ghi lại thay đổi theo phiên bản

---

## 🏁 Tiêu Chí Hoàn Thành Phase 1

Tất cả các tiêu chí sau phải đạt trước khi chuyển sang Phase 2:

| # | Tiêu chí | Kiểm tra bằng cách nào |
|---|---|---|
| ✅ | Thêm chi tiêu mới và hiển thị ngay lên danh sách | Test tay trên giao diện |
| ✅ | Xóa chi tiêu và biến mất khỏi danh sách & DB | Test tay + kiểm tra DB |
| ✅ | Chỉnh sửa chi tiêu đã tạo | Test tay trên giao diện |
| ✅ | Tổng chi tiêu hiển thị đúng | So sánh với dữ liệu thực trong DB |
| ✅ | Lọc theo danh mục hoạt động | Test tay từng danh mục |
| ✅ | Tìm kiếm theo mô tả hoạt động | Gõ từ khoá và kiểm tra kết quả |
| ✅ | Giao diện responsive trên mobile | Test ở 375px width |
| ✅ | Server-side validation từ chối dữ liệu sai | Gọi API với body thiếu/sai |
| ✅ | Kết nối PostgreSQL ổn định | Restart server và test lại |
| ✅ | Test backend pass toàn bộ | `npm test` không có lỗi |

---

## 🔗 Liên Kết Hữu Ích

- [Mã nguồn Backend](source-code/backend/server.js)
- [Mã nguồn Database](source-code/database/database.js)
- [Schema SQL](source-code/database/schema.sql)
- [README chính](README.md)

---

> 💡 **Ghi chú:** Sau khi hoàn thành Phase 1, Phase 2 sẽ tập trung vào phân tích chi tiêu nâng cao (biểu đồ, báo cáo tháng, xuất CSV/PDF) và xác thực người dùng (đăng nhập/đăng ký).
