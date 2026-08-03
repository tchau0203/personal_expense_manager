# Hướng dẫn sử dụng — Personal Expense Manager

## Giới thiệu
Personal Expense Manager là ứng dụng web giúp bạn theo dõi, phân tích và kiểm soát chi tiêu cá nhân. Ứng dụng hỗ trợ đầy đủ CRUD chi tiêu, quản lý ngân sách theo danh mục, biểu đồ phân tích trực quan và xuất dữ liệu CSV/PDF.

---

## Cài đặt và chạy

### Yêu cầu
- Node.js v18+
- PostgreSQL 14+

### Bước 1: Clone và cài đặt
```bash
git clone https://github.com/tchau0203/personal_expense_manager.git
cd personal_expense_manager
cd source-code/backend
npm install
cd ../database
npm install
```

### Bước 2: Cấu hình database
Chỉnh sửa file `source-code/backend/.env`:
```
DB_HOST=localhost
DB_PORT=5433
DB_DATABASE=personal_expense_manager
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
PORT=3000
```

### Bước 3: Khởi tạo database
```bash
# Lần đầu tiên (tạo DB và bảng)
psql -U postgres -f source-code/database/schema.sql

# Phase 2 migration (thêm bảng users, budgets)
node source-code/database/run_migration.js
```

### Bước 4: Khởi động server
```bash
cd source-code/backend
npm start
```

Mở trình duyệt: **http://localhost:3000**

---

## Hướng dẫn sử dụng

### 1. Đăng ký / Đăng nhập
- Truy cập http://localhost:3000, bạn sẽ thấy trang đăng nhập
- Nhấn **"Đăng ký ngay"** để tạo tài khoản mới (username + email + mật khẩu ≥ 6 ký tự)
- Sau khi đăng ký, hệ thống tự động đăng nhập và chuyển vào app

### 2. Thêm chi tiêu
- Nhấn nút **"+ Thêm mới"** ở góc trên phải, hoặc nhấn phím **`N`**
- Điền mô tả, số tiền, ngày, danh mục
- Tuỳ chọn: đánh dấu **Chi tiêu định kỳ** (hàng tuần / hàng tháng)
- Nhấn **"Lưu chi tiêu"**

### 3. Xem danh sách
- Vào mục **Danh sách** trong sidebar
- Tìm kiếm theo mô tả: gõ vào ô tìm kiếm
- Lọc theo danh mục hoặc sắp xếp
- Mỗi trang hiển thị 20 khoản, chuyển trang bằng phân trang bên dưới

### 4. Chỉnh sửa chi tiêu
- Trong Danh sách, nhấn nút **✏️ Sửa** trên dòng muốn chỉnh
- Modal mở với dữ liệu đã điền sẵn
- Chỉnh sửa rồi nhấn **"Cập nhật"**

### 5. Xoá chi tiêu
- Nhấn nút **🗑️ Xoá** rồi xác nhận trong hộp thoại

### 6. Quản lý ngân sách
- Vào mục **Ngân sách** trong sidebar
- Chọn tháng/năm cần xem
- Nhấn **"+ Thêm ngân sách"** để thiết lập giới hạn cho từng danh mục
- Thanh tiến trình hiển thị % đã chi:
  - 🟢 < 80%: Bình thường
  - 🟠 80–99%: Cảnh báo gần đến giới hạn
  - 🔴 ≥ 100%: Đã vượt ngân sách

### 7. Xem biểu đồ phân tích
- Vào mục **Phân tích** trong sidebar
- **Biểu đồ tròn**: Tỷ lệ chi tiêu theo danh mục
- **Biểu đồ cột**: Chi tiêu theo từng tháng (12 tháng gần nhất)
- **Biểu đồ đường**: Xu hướng 30 ngày gần nhất
- Dùng bộ lọc thời gian: **Tháng này / 3 tháng / Năm nay**

### 8. Xuất dữ liệu
- Trong **Danh sách**, nhấn:
  - **📥 CSV**: Tải file CSV mở được bằng Excel
  - **📄 PDF**: Xuất báo cáo PDF với tổng chi tiêu

### 9. Đổi giao diện
- Nhấn nút **☀️/🌙** ở góc trên phải để chuyển Dark/Light mode
- Tuỳ chọn được lưu tự động

### 10. Phím tắt
| Phím | Chức năng |
|------|-----------|
| `N`  | Mở modal thêm chi tiêu |
| `Esc`| Đóng modal đang mở |

### 11. Hồ sơ & Đổi mật khẩu
- Vào mục **Hồ sơ cá nhân** trong sidebar
- Xem thông tin tài khoản
- Điền mật khẩu cũ + mới để đổi mật khẩu

---

## Chạy Tests
```bash
cd source-code/backend
npm test              # Chạy tất cả tests
npm run test:coverage # Xem coverage report
```

---

## Cấu trúc dự án
```
personal_expense_manager/
├── doc/
│   ├── phase-1-task-list.md
│   ├── phase-2-task-list.md
│   └── user-guide.md            ← File này
├── source-code/
│   ├── backend/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── tests/
│   │   ├── server.js
│   │   └── package.json
│   ├── database/
│   │   ├── database.js
│   │   ├── schema.sql
│   │   └── migration.sql
│   └── frontend/
│       ├── index.html
│       ├── style.css
│       └── script.js
└── python-analysis/
```
