# 🚀 PHASE 2 — Nâng Cấp Hệ Thống Personal Expense Manager

> **Trạng thái:** ✅ Hoàn thành  
> **Phiên bản hệ thống:** v2.0.0  
> **Ngày bắt đầu:** 2026-08-03  
> **Ngày hoàn thành:** 2026-08-03  
> **Nhánh phát triển:** `dev-chau`  
> **Merge vào:** `main` (commit `d3478d3`)

---

## 📌 Tổng Quan Hiện Trạng (Đầu Phase 2)

| Thành phần | Trạng thái trước Phase 2 | Mức độ hoàn thiện |
|---|---|---|
| Frontend (HTML/CSS/JS) | Có UI cơ bản, CRUD không có auth | ~60% |
| Backend (Node.js + Express) | 3 API, 1 file server.js | ~50% |
| Database (PostgreSQL) | Chỉ có bảng `expenses` | ~50% |
| Authentication | Chưa có | 0% |
| Biểu đồ & Phân tích | Chưa có | 0% |
| Quản lý ngân sách | Chưa có | 0% |
| Testing | Chưa có | 0% |
| Tài liệu | Sơ khai | ~20% |

---

## 🎯 Mục Tiêu Phase 2

Nâng cấp hệ thống lên mức hoàn chỉnh với các tính năng nâng cao:
- Người dùng có thể **đăng ký, đăng nhập** và quản lý dữ liệu **riêng tư**
- Hỗ trợ đầy đủ **CRUD** bao gồm **chỉnh sửa** chi tiêu
- Có **biểu đồ trực quan** giúp phân tích thói quen chi tiêu
- Có hệ thống **ngân sách theo danh mục** với cảnh báo vượt mức
- Có thể **xuất dữ liệu** ra CSV / PDF
- Code có **test tự động** đạt coverage >= 70%
- Sẵn sàng để deploy lên cloud trong Phase 3

---

## 📋 Danh Sách Nhiệm Vụ Chi Tiết

---

### 🗄️ PHẦN 1 — Database Migration

#### 1.1 Schema mới
- [x] **Tạo bảng `users`** — id, username, email, password_hash, created_at
- [x] **Tạo bảng `budgets`** — id, user_id, category, amount, month, year
- [x] **Thêm cột `user_id`** vào bảng `expenses` — khoá ngoại tới `users`
- [x] **Thêm cột `is_recurring`** — đánh dấu chi tiêu định kỳ
- [x] **Thêm cột `recurring_interval`** — chu kỳ (weekly/monthly)
- [x] **Tạo indexes** — `idx_expenses_user_id`, `idx_expenses_date`, `idx_budgets_user_month`
- [x] **UNIQUE constraint** — `(user_id, category, month, year)` trên bảng budgets

#### 1.2 Migration Tools
- [x] **Tạo `migration_node.sql`** — SQL tương thích Node.js runner (không dùng psql meta-commands)
- [x] **Tạo `run_migration.js`** — Script chạy migration qua pg Pool, safe với IF NOT EXISTS
- [x] **Gán dữ liệu cũ** — `UPDATE expenses SET user_id = default_user` để không mất data

---

### ⚙️ PHẦN 2 — Backend Refactoring & API mới

#### 2.1 Tái cấu trúc Backend
- [x] **Tách `server.js`** thành module nhỏ: routes, controllers, middlewares
- [x] **Cấu trúc thư mục mới:**
  ```
  backend/
  ├── controllers/
  │   ├── auth.controller.js
  │   ├── expense.controller.js
  │   └── budget.controller.js
  ├── middlewares/
  │   └── auth.middleware.js
  ├── routes/
  │   ├── auth.routes.js
  │   ├── expense.routes.js
  │   └── budget.routes.js
  └── server.js  (gọn lại: mount routes + middleware)
  ```
- [x] **Refactor `database.js`** — Đổi từ `poolPromise` sang `getPool()` để dễ mock trong test
- [x] **Export `app`** từ server.js — Cho phép Jest/Supertest import để test

#### 2.2 Rate Limiting & Bảo mật
- [x] **express-rate-limit** — Giới hạn 100 request / 15 phút / IP
- [x] **Parameterized queries** — Toàn bộ SQL dùng `$1, $2` tránh SQL Injection
- [x] **JWT Middleware** — Verify token trước mọi request đến `/api/expenses` và `/api/budgets`

#### 2.3 Auth API
- [x] **POST /api/auth/register** — Đăng ký, hash password bằng `bcryptjs`, trả JWT
- [x] **POST /api/auth/login** — Đăng nhập, so sánh hash, trả JWT
- [x] **POST /api/auth/logout** — Stateless logout (client xoá token)
- [x] **GET /api/auth/me** — Lấy thông tin user hiện tại từ token
- [x] **PUT /api/auth/change-password** — Đổi mật khẩu (xác thực mật khẩu cũ trước)

#### 2.4 Expense API (nâng cấp)
- [x] **GET /api/expenses** — Thêm server-side pagination, filter, search, sort
- [x] **POST /api/expenses** — Thêm `user_id`, `is_recurring`, `recurring_interval`
- [x] **PUT /api/expenses/:id** *(MỚI)* — Cập nhật chi tiêu, kiểm tra `user_id` để tránh sửa chéo
- [x] **DELETE /api/expenses/:id** — Kiểm tra `user_id`, trả 404 nếu không tìm thấy

#### 2.5 Budget API (MỚI)
- [x] **GET /api/budgets** — Lấy ngân sách theo tháng/năm + tính `spent` tự động
- [x] **POST /api/budgets** — Tạo hoặc cập nhật ngân sách (upsert bằng ON CONFLICT)
- [x] **PUT /api/budgets/:id** — Cập nhật số tiền ngân sách
- [x] **DELETE /api/budgets/:id** — Xoá ngân sách

---

### 🎨 PHẦN 3 — Frontend (Xây dựng lại hoàn toàn)

#### 3.1 Auth UI
- [x] **Trang Login** — Form đăng nhập với validation, loading state
- [x] **Trang Register** — Form đăng ký (username, email, password), chuyển tab mượt mà
- [x] **JWT Storage** — Lưu token vào `localStorage`, tự gắn vào header mỗi request
- [x] **Auto redirect** — 401 response → tự logout và chuyển về trang đăng nhập
- [x] **Logout button** — Xoá token, chuyển về auth page

#### 3.2 Navigation & Layout
- [x] **Sidebar mở rộng** — Thêm nav items: Phân tích, Ngân sách, Hồ sơ
- [x] **5 sections** — dashboard, analytics, budget, list, profile
- [x] **Header user info** — Hiển thị tên đăng nhập, avatar chữ cái đầu

#### 3.3 Dashboard (nâng cấp)
- [x] **4 stat cards** — Tổng chi tiêu, tháng này, số giao dịch, trung bình/giao dịch
- [x] **Category summary** — Thanh tiến trình % theo danh mục
- [x] **Recent transactions** — 5 giao dịch gần nhất

#### 3.4 Expense List (nâng cấp)
- [x] **Nút ✏️ Sửa** — Mở modal với dữ liệu đã điền sẵn
- [x] **Badge định kỳ** — Hiển thị 🔁 nếu `is_recurring = true`
- [x] **Pagination** — Phân trang 20 items, hiển thị số trang, nút prev/next
- [x] **Export CSV** — Tải file CSV có BOM UTF-8 (mở được bằng Excel)
- [x] **Export PDF** — Tải báo cáo PDF với tổng chi tiêu (dùng jsPDF CDN)

#### 3.5 Analytics (MỚI)
- [x] **Trang Phân tích** với 3 biểu đồ Chart.js:
  - **Doughnut chart** — Tỷ lệ chi tiêu theo danh mục
  - **Bar chart** — Chi tiêu theo 12 tháng gần nhất
  - **Line chart** — Xu hướng chi tiêu 30 ngày gần nhất
- [x] **Bộ lọc thời gian** — Tháng này / 3 tháng / Năm nay
- [x] **Theme-aware charts** — Màu sắc biểu đồ tự điều chỉnh theo dark/light mode

#### 3.6 Budget Page (MỚI)
- [x] **Selector tháng/năm** — Chọn tháng để xem ngân sách
- [x] **Budget cards** — Hiển thị từng danh mục với thanh tiến trình
- [x] **Màu sắc cảnh báo:**
  - 🟢 < 80% — Bình thường
  - 🟠 80–99% — Cảnh báo
  - 🔴 ≥ 100% — Vượt ngân sách
- [x] **Modal thêm ngân sách** — Chọn danh mục + nhập số tiền
- [x] **Upsert** — Tạo mới hoặc cập nhật nếu đã có ngân sách cho tháng đó

#### 3.7 Profile Page (MỚI)
- [x] **Xem thông tin tài khoản** — Username, email, ngày tạo
- [x] **Đổi mật khẩu** — Form 3 trường: mật khẩu cũ, mới, xác nhận

#### 3.8 UX & Accessibility
- [x] **Dark/Light mode toggle** — Nút ☀️/🌙 ở header, lưu vào `localStorage`
- [x] **CSS Variables** — `:root` cho dark, `[data-theme="light"]` cho light
- [x] **Keyboard shortcuts** — `N` mở modal thêm, `Esc` đóng modal
- [x] **Recurring expense** — Checkbox + dropdown chọn chu kỳ trong modal
- [x] **Responsive** — Mobile breakpoints tại 768px và 480px

---

### 🧪 PHẦN 4 — Testing

#### 4.1 Jest + Supertest
- [x] **Cài đặt** — `jest`, `supertest` vào devDependencies
- [x] **Cấu hình Jest** — `testEnvironment: node`, `testMatch: **/tests/**/*.test.js`
- [x] **Mock DB** — `jest.mock('../../database/database')` — không cần DB thật khi test
- [x] **Mock bcryptjs** — Kiểm soát kết quả hash/compare trong test auth

#### 4.2 Test Coverage

| File | Statements | Functions | Lines |
|---|---|---|---|
| server.js | 78.26% | — | 78.26% |
| auth.controller.js | 59.01% | 60% | 63.15% |
| budget.controller.js | 74.54% | 83.33% | 75.55% |
| expense.controller.js | 81.81% | 100% | 81.81% |
| auth.middleware.js | 78.57% | 100% | 78.57% |
| routes/*.js | 100% | 100% | 100% |
| **Tổng cộng** | **76.05%** | **72.22%** | **77.67%** |

#### 4.3 Kết Quả Tests

```
Test Suites: 3 passed, 3 total
Tests:       27 passed, 27 total
Snapshots:   0 total
Time:        ~1s
```

| Test File | Tests | Kết quả |
|---|---|---|
| expense.test.js | 9 tests | ✅ PASS |
| auth.test.js | 10 tests | ✅ PASS |
| budget.test.js | 8 tests | ✅ PASS |

---

### 📁 PHẦN 5 — Tài Liệu

- [x] **`doc/phase-2-task-list.md`** — Danh sách nhiệm vụ Phase 2
- [x] **`doc/user-guide.md`** — Hướng dẫn sử dụng đầy đủ (cài đặt, tính năng, phím tắt)
- [x] **`doc/PHASE-2.md`** — Báo cáo kết quả Phase 2 (file này)

---

## 🏁 Tiêu Chí Hoàn Thành Phase 2

| # | Tiêu chí | Kết quả |
|---|---|---|
| ✅ | Đăng ký tài khoản mới thành công | Đã test thực tế |
| ✅ | Đăng nhập và nhận JWT token | Đã test thực tế |
| ✅ | Thêm / Xem / Sửa / Xóa chi tiêu (đầy đủ CRUD) | Đã test thực tế |
| ✅ | Dữ liệu được phân tách theo từng user | Xác nhận qua DB |
| ✅ | Biểu đồ Pie / Bar / Line hiển thị đúng | Đã test thực tế |
| ✅ | Ngân sách cảnh báo khi vượt 80% | Đã test thực tế |
| ✅ | Xuất CSV mở được bằng Excel | Đã test thực tế |
| ✅ | Xuất PDF với tổng chi tiêu | Đã test thực tế |
| ✅ | Dark/Light mode toggle và lưu lại | Đã test thực tế |
| ✅ | Phím tắt N và Esc hoạt động | Đã test thực tế |
| ✅ | 27/27 test cases pass | `npm test` |
| ✅ | Code coverage >= 70% | 76.05% statements |
| ✅ | Merge vào `main` không có conflict | `git merge --no-ff` |

---

## 📊 Thống Kê Code Phase 2

| Thành phần | Files thay đổi / thêm mới | Dòng code |
|---|---|---|
| Backend controllers | 3 files mới | +341 dòng |
| Backend middlewares | 1 file mới | +23 dòng |
| Backend routes | 3 files mới | +38 dòng |
| server.js (refactor) | 1 file sửa | ~90 dòng |
| Database module | 1 file sửa | +47 dòng |
| Migration SQL | 2 files mới | +85 dòng |
| Frontend HTML | 1 file sửa | +480 dòng thêm |
| Frontend CSS | 1 file sửa | ~1,200 dòng (viết lại) |
| Frontend JS | 1 file sửa | +946 dòng thêm |
| Tests | 3 files mới | +342 dòng |
| Tài liệu | 3 files mới | +410 dòng |
| **Tổng cộng** | **26 files** | **+7,989 / -1,469** |

---

## 🔗 Liên Kết Hữu Ích

- [Backend Server](source-code/backend/server.js)
- [Auth Controller](source-code/backend/controllers/auth.controller.js)
- [Expense Controller](source-code/backend/controllers/expense.controller.js)
- [Budget Controller](source-code/backend/controllers/budget.controller.js)
- [JWT Middleware](source-code/backend/middlewares/auth.middleware.js)
- [Database Module](source-code/database/database.js)
- [Migration SQL](source-code/database/migration_node.sql)
- [Frontend HTML](source-code/frontend/index.html)
- [Frontend JS](source-code/frontend/script.js)
- [Frontend CSS](source-code/frontend/style.css)
- [Hướng dẫn sử dụng](doc/user-guide.md)
- [Phase 2 Task List](doc/phase-2-task-list.md)

---

> 💡 **Ghi chú:** Phase 3 sẽ tập trung vào **deploy lên cloud** (Railway/Render cho backend, Vercel cho frontend), thêm **email notifications**, **multi-currency support**, và tối ưu **performance** cho môi trường production.
