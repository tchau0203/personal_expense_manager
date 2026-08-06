# 🗺️ Bản Đồ Dự Án — Personal Expense Manager

> Tài liệu này mô tả **từng mục trong dự án có nhiệm vụ gì**, giúp bạn nắm toàn bộ hệ thống chỉ qua 1 file.

---

## 📁 Cấu Trúc Thư Mục

```
personal_expense_manager/
├── doc/                        → Tài liệu dự án
├── source-code/
│   ├── backend/                → Server Node.js (API)
│   ├── database/               → Kết nối DB + Schema
│   └── frontend/               → Giao diện web
└── python-analysis/            → Phân tích dữ liệu (dự phòng)
```

---

## 📂 doc/ — Tài Liệu Dự Án

| File | Nhiệm vụ |
|---|---|
| `PHASE-1.md` | Báo cáo kế hoạch & kết quả Phase 1 |
| `PHASE-2.md` | Báo cáo kế hoạch & kết quả Phase 2 |
| `phase-1-task-list.md` | Danh sách việc cần làm Phase 1 (checklist) |
| `phase-2-task-list.md` | Danh sách việc cần làm Phase 2 (checklist) |
| `user-guide.md` | Hướng dẫn sử dụng cho người dùng cuối |
| `project-overview.md` | **File này** — Bản đồ toàn bộ dự án |

---

## 📂 source-code/backend/ — Phần Máy Chủ (API)

### 📄 server.js
> **Cổng vào của toàn bộ backend.**
- Khởi tạo Express app
- Gắn middleware: CORS, JSON parser, Rate Limiting
- Mount tất cả routes: `/api/auth`, `/api/expenses`, `/api/budgets`
- Serve static files (frontend)
- Export `app` cho Jest test

---

### 📁 routes/ — Định Tuyến URL
> **Quy định URL nào → gọi hàm nào. Không chứa logic.**

| File | URL prefix | Nhiệm vụ |
|---|---|---|
| `auth.routes.js` | `/api/auth` | Đăng ký, đăng nhập, đăng xuất, đổi mật khẩu |
| `expense.routes.js` | `/api/expenses` | CRUD chi tiêu (có bảo vệ JWT) |
| `budget.routes.js` | `/api/budgets` | CRUD ngân sách (có bảo vệ JWT) |

**Quy tắc:** Mỗi route dùng `router.use(authMiddleware)` → bảo vệ toàn bộ nhóm API đó.

---

### 📁 controllers/ — Xử Lý Logic
> **Chứa toàn bộ nghiệp vụ: đọc dữ liệu, xử lý, ghi DB, trả kết quả.**

#### `auth.controller.js`
| Hàm | Nhiệm vụ |
|---|---|
| `register()` | Kiểm tra trùng username/email → hash password → tạo user → trả JWT |
| `login()` | Tìm user → so sánh password hash → trả JWT |
| `logout()` | Stateless — trả `success: true` (client tự xoá token) |
| `getMe()` | Đọc `req.user.id` → truy vấn DB → trả thông tin user |
| `changePassword()` | Xác thực mật khẩu cũ → hash mật khẩu mới → cập nhật DB |

#### `expense.controller.js`
| Hàm | Nhiệm vụ |
|---|---|
| `getExpenses()` | Lấy danh sách chi tiêu theo `user_id`, hỗ trợ filter/search/sort/pagination |
| `createExpense()` | Validate → INSERT vào DB với `user_id` từ token |
| `updateExpense()` | Validate → UPDATE với điều kiện `id AND user_id` (không thể sửa chéo) |
| `deleteExpense()` | DELETE với điều kiện `id AND user_id` → 404 nếu không tìm thấy |

#### `budget.controller.js`
| Hàm | Nhiệm vụ |
|---|---|
| `getBudgets()` | Lấy ngân sách theo tháng/năm + JOIN tính `spent` từ bảng expenses |
| `createBudget()` | INSERT hoặc UPDATE nếu đã tồn tại (ON CONFLICT upsert) |
| `updateBudget()` | Cập nhật số tiền ngân sách theo `id AND user_id` |
| `deleteBudget()` | Xoá ngân sách theo `id AND user_id` |

---

### 📁 middlewares/ — Phần Chặn Giữa
> **Chạy trước controller, kiểm tra điều kiện trước khi cho vào.**

#### `auth.middleware.js`
| Nhiệm vụ |
|---|
| Đọc header `Authorization: Bearer <token>` |
| Verify JWT bằng `JWT_SECRET` từ `.env` |
| Gắn `req.user = { id, username }` để controller dùng |
| Trả 401 nếu không có token, token sai hoặc hết hạn |

---

### 📁 tests/ — Kiểm Thử Tự Động
> **Chạy `npm test` để kiểm tra toàn bộ API mà không cần server thật.**

| File | Số tests | Kiểm tra gì |
|---|---|---|
| `expense.test.js` | 9 tests | GET/POST/PUT/DELETE `/api/expenses` |
| `auth.test.js` | 10 tests | Register/Login/Logout |
| `budget.test.js` | 8 tests | GET/POST/DELETE `/api/budgets` |

**Kỹ thuật:** Mock `database.js` và `bcryptjs` → test không cần DB thật.

---

### 📄 .env — Biến Môi Trường
> **Cấu hình bí mật, KHÔNG commit lên git.**

| Biến | Nhiệm vụ |
|---|---|
| `DB_HOST/PORT/DATABASE/USER/PASSWORD` | Kết nối PostgreSQL |
| `JWT_SECRET` | Khoá bí mật để ký/verify JWT token |
| `JWT_EXPIRES_IN` | Thời hạn token (mặc định 7 ngày) |
| `PORT` | Cổng server chạy (mặc định 3000) |

---

## 📂 source-code/database/ — Phần Cơ Sở Dữ Liệu

| File | Nhiệm vụ |
|---|---|
| `database.js` | Tạo PostgreSQL connection pool, export `getPool()` |
| `schema.sql` | Tạo DB và bảng `expenses` từ đầu (Phase 1) |
| `migration.sql` | SQL đầy đủ Phase 2 (dùng psql — có meta-commands) |
| `migration_node.sql` | SQL Phase 2 tương thích Node.js runner |
| `run_migration.js` | Script Node.js chạy migration qua pg Pool |

### Sơ Đồ Database (ERD)

```
users
  id, username, email, password_hash, created_at
    │
    ├──< expenses
    │     id, user_id, description, amount, category,
    │     expense_date, is_recurring, recurring_interval
    │
    └──< budgets
          id, user_id, category, amount, month, year
```

---

## 📂 source-code/frontend/ — Phần Giao Diện

### 📄 index.html
> **Cấu trúc HTML toàn bộ ứng dụng.**

| Khu vực | Nhiệm vụ |
|---|---|
| `#auth-page` | Trang đăng nhập / đăng ký (ẩn khi đã login) |
| `#app` | Toàn bộ app chính (ẩn khi chưa login) |
| `.sidebar` | Menu điều hướng bên trái |
| `.top-header` | Thanh tiêu đề, nút thêm mới, toggle dark mode |
| `#section-dashboard` | Trang Tổng quan: stat cards, biểu đồ danh mục, giao dịch gần đây |
| `#section-analytics` | Trang Phân tích: 3 biểu đồ Chart.js |
| `#section-budget` | Trang Ngân sách: progress bar, cảnh báo vượt mức |
| `#section-list` | Danh sách chi tiêu: tìm kiếm, lọc, sắp xếp, phân trang |
| `#section-profile` | Hồ sơ cá nhân & đổi mật khẩu |
| `#modal-overlay` | Modal thêm / sửa chi tiêu |
| `#budget-modal-overlay` | Modal thêm ngân sách |
| `#confirm-overlay` | Modal xác nhận xoá |

---

### 📄 style.css
> **Toàn bộ giao diện và theme.**

| Khu vực CSS | Nhiệm vụ |
|---|---|
| `:root` | Biến CSS Dark theme (mặc định) |
| `[data-theme="light"]` | Ghi đè biến CSS sang Light theme |
| `.auth-page` | Trang đăng nhập/đăng ký |
| `.sidebar` | Sidebar điều hướng |
| `.stat-card` | Thẻ thống kê (4 loại màu khác nhau) |
| `.chart-body` | Khung chứa biểu đồ Chart.js |
| `.budget-item` | Card ngân sách với progress bar |
| `.expense-table` | Bảng danh sách chi tiêu |
| `.pagination` | Thanh phân trang |
| `.modal-overlay` | Nền mờ modal + animation |
| `@media` | Responsive: 900px, 768px, 480px |

---

### 📄 script.js
> **Toàn bộ logic frontend, chia theo nhóm chức năng.**

| Nhóm hàm | Hàm chính | Nhiệm vụ |
|---|---|---|
| **Auth** | `doLogin()`, `doRegister()`, `logout()` | Gọi API auth, lưu/xoá JWT |
| **Auth helpers** | `saveAuth()`, `showApp()`, `showAuthPage()` | Quản lý trạng thái đăng nhập |
| **API** | `apiFetch()` | Wrapper fetch: tự gắn JWT header, xử lý 401 |
| **Expenses** | `loadExpenses()` | Tải danh sách từ server (có pagination) |
| **Dashboard** | `renderDashboard()`, `renderCategorySummary()` | Tính toán và hiển thị số liệu tổng quan |
| **Table** | `renderTable()`, `renderPagination()` | Render bảng và phân trang |
| **Add/Edit** | `submitExpense()`, `openEditModal()` | Thêm mới hoặc cập nhật chi tiêu |
| **Delete** | `confirmDelete()`, `doDelete()` | Xoá với xác nhận |
| **Charts** | `renderPieChart()`, `renderBarChart()`, `renderLineChart()` | 3 biểu đồ Chart.js |
| **Budget** | `loadBudgets()`, `renderBudgetList()`, `submitBudget()` | Quản lý ngân sách |
| **Profile** | `loadProfile()`, `submitChangePassword()` | Xem profile, đổi mật khẩu |
| **Export** | `exportCSV()`, `exportPDF()` | Xuất dữ liệu |
| **Theme** | `toggleTheme()`, `initTheme()` | Dark/Light mode |
| **Navigation** | `navigate()` | Chuyển section, update tiêu đề |
| **Keyboard** | `keydown` event | `N` mở modal, `Esc` đóng modal |

---

## 🔄 Luồng Hoạt Động Chính

```
Người dùng mở http://localhost:3000
    │
    ├── Chưa login → Hiện Auth Page
    │       ↓
    │   Nhập thông tin → POST /api/auth/login
    │       ↓
    │   Server trả JWT → Lưu vào localStorage
    │       ↓
    │   Hiện App chính
    │
    └── Đã login (có token) → Hiện App chính ngay
            ↓
        loadExpenses() → GET /api/expenses?page=1
            ↓
        Render Dashboard + Table
            ↓
        Người dùng thao tác:
        ├── Thêm → POST /api/expenses → reload
        ├── Sửa → PUT /api/expenses/:id → reload
        ├── Xoá → DELETE /api/expenses/:id → reload
        ├── Ngân sách → GET/POST /api/budgets
        ├── Biểu đồ → GET /api/expenses?limit=1000
        └── Xuất → Tạo file CSV/PDF từ dữ liệu local
```

---

## ⚡ Lệnh Thường Dùng

```bash
# Khởi động server
cd source-code/backend
npm start

# Chạy tests
npm test

# Xem coverage
npm run test:coverage

# Chạy migration (lần đầu Phase 2)
cd source-code/database
node run_migration.js
```
