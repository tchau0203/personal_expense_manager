# Personal Expense Manager

Personal Expense Manager là một ứng dụng web đơn giản giúp bạn theo dõi chi tiêu cá nhân theo thời gian thực. Người dùng có thể thêm, xem và xóa các khoản chi tiêu, đồng thời dữ liệu được lưu trữ trên PostgreSQL.

## Tính năng chính

- Thêm khoản chi tiêu mới với mô tả, số tiền, danh mục và ngày chi
- Xem danh sách các khoản chi tiêu gần đây
- Xóa khoản chi tiêu không cần thiết
- Lưu trữ dữ liệu bằng PostgreSQL

## Công nghệ sử dụng

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js + Express
- Database: PostgreSQL

## Cấu trúc project

- source-code/frontend: giao diện người dùng
- source-code/backend: server API và logic xử lý
- source-code/database: kết nối database và schema SQL

## Hướng dẫn chạy local

### 1. Cài đặt môi trường

- Cài đặt Node.js
- Cài đặt PostgreSQL và khởi động server

### 2. Tạo cơ sở dữ liệu

Chạy các câu lệnh trong file [source-code/database/schema.sql](source-code/database/schema.sql) để tạo database và bảng expenses.

### 3. Cấu hình biến môi trường

Tạo file .env trong thư mục [source-code/backend](source-code/backend) với nội dung như sau:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=personal_expense_manager
DB_USER=postgres
DB_PASSWORD=your_password
```

### 4. Cài đặt dependencies

```bash
cd source-code/backend
npm install
```

### 5. Khởi động ứng dụng

```bash
npm start
```

Sau đó mở trình duyệt tại:

```text
http://localhost:3000
```

## API hiện có

- GET /api/expenses: lấy danh sách chi tiêu
- POST /api/expenses: thêm khoản chi tiêu mới
- DELETE /api/expenses/:id: xóa khoản chi tiêu theo ID

## Ghi chú

Đảm bảo PostgreSQL đang chạy trước khi khởi động backend. Nếu bạn muốn mở rộng dự án, có thể thêm chức năng phân tích chi tiêu theo tháng, theo danh mục hoặc xuất báo cáo.
