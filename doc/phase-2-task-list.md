# Phase 2 - Task List

## Mục tiêu
Nâng cấp hệ thống Personal Expense Manager lên mức hoàn chỉnh hơn với các tính năng nâng cao: xác thực người dùng, quản lý ngân sách, biểu đồ phân tích, chỉnh sửa chi tiêu, và xuất dữ liệu — tất cả vẫn chạy trên môi trường local.

---

## Nhiệm vụ chính

### 1. Xác thực người dùng (Authentication)
- [ ] Thiết kế bảng `users` trong PostgreSQL (id, username, email, password_hash, created_at)
- [ ] Tạo API `POST /api/auth/register` — đăng ký tài khoản mới
- [ ] Tạo API `POST /api/auth/login` — đăng nhập, trả về JWT token
- [ ] Tạo API `POST /api/auth/logout` — đăng xuất, xóa token phía client
- [ ] Middleware xác thực JWT cho tất cả các route `/api/expenses`
- [ ] Gắn `user_id` vào bảng `expenses` để phân biệt dữ liệu theo người dùng
- [ ] Xây dựng giao diện trang Login / Register
- [ ] Lưu JWT vào `localStorage`, tự động gắn vào header mỗi request
- [ ] Xử lý token hết hạn và tự động redirect về trang đăng nhập

### 2. Chỉnh sửa chi tiêu (Edit Expense)
- [ ] Tạo API `PUT /api/expenses/:id` — cập nhật thông tin chi tiêu
- [ ] Thêm nút **Sửa** vào mỗi dòng trong bảng danh sách
- [ ] Mở modal với dữ liệu đã điền sẵn khi nhấn Sửa
- [ ] Validate dữ liệu trước khi gửi PUT request
- [ ] Cập nhật danh sách ngay sau khi sửa thành công (không reload trang)

### 3. Quản lý ngân sách (Budget Management)
- [ ] Thiết kế bảng `budgets` trong PostgreSQL (id, user_id, category, amount, month, year)
- [ ] Tạo API CRUD cho ngân sách (`GET`, `POST`, `PUT`, `DELETE /api/budgets`)
- [ ] Xây dựng trang **Ngân sách** riêng trong sidebar
- [ ] Hiển thị mức đã chi / ngân sách cho từng danh mục theo tháng
- [ ] Cảnh báo (badge đỏ) khi chi tiêu vượt quá 80% ngân sách của danh mục
- [ ] Hiển thị thanh tiến trình (progress bar) theo % đã dùng

### 4. Biểu đồ và Phân tích (Charts and Analytics)
- [ ] Tích hợp thư viện **Chart.js** vào frontend
- [ ] Biểu đồ tròn (Pie/Doughnut) — tỷ lệ chi tiêu theo danh mục
- [ ] Biểu đồ cột (Bar) — chi tiêu theo từng tháng trong năm
- [ ] Biểu đồ đường (Line) — xu hướng chi tiêu 30 ngày gần nhất
- [ ] Thêm bộ lọc thời gian: tuần này / tháng này / 3 tháng / năm nay
- [ ] Xây dựng trang **Phân tích** riêng trong sidebar

### 5. Xuất dữ liệu (Export)
- [ ] Xuất danh sách chi tiêu ra file **CSV** (tải về trực tiếp)
- [ ] Xuất báo cáo tháng ra file **PDF** (dùng jsPDF hoặc html2canvas)
- [ ] Thêm nút **Xuất CSV** và **Xuất PDF** vào trang danh sách
- [ ] Cho phép chọn khoảng thời gian trước khi xuất

### 6. Chi tiêu định kỳ (Recurring Expenses)
- [ ] Thêm cột `is_recurring` và `recurring_interval` vào bảng `expenses`
- [ ] Cho phép đánh dấu một khoản là "định kỳ" khi nhập (hàng tuần / hàng tháng)
- [ ] Hiển thị badge **Định kỳ** trên giao diện danh sách
- [ ] Tự động tạo bản ghi mới khi đến chu kỳ tiếp theo (cron job đơn giản)

### 7. Cải thiện trải nghiệm người dùng (UX Enhancement)
- [ ] Thêm trang **Hồ sơ cá nhân** (xem và đổi mật khẩu)
- [ ] Thêm chế độ **Dark Mode / Light Mode** với toggle
- [ ] Tối ưu hiển thị trên mobile (responsive breakpoints)
- [ ] Thêm phân trang (pagination) cho danh sách khi vượt quá 20 dòng
- [ ] Thêm phím tắt bàn phím: `N` mở modal thêm, `Esc` đóng modal

### 8. Kiểm thử và Chất lượng code (Testing and Code Quality)
- [ ] Viết unit test cho tất cả API (dùng **Jest** + **Supertest**)
  - [ ] Test `GET /api/expenses`
  - [ ] Test `POST /api/expenses` (hợp lệ và không hợp lệ)
  - [ ] Test `PUT /api/expenses/:id`
  - [ ] Test `DELETE /api/expenses/:id`
  - [ ] Test `POST /api/auth/register` và `POST /api/auth/login`
- [ ] Tách cấu trúc backend thành nhiều module (routes, controllers, middlewares)
- [ ] Thêm input sanitization và rate limiting cho API
- [ ] Đảm bảo coverage tối thiểu **70%**

### 9. Tài liệu và Chuẩn bị Phase 3
- [ ] Viết hướng dẫn sử dụng cho người dùng (`user-guide.md`)
- [ ] Cập nhật `READ.MD` với đầy đủ hướng dẫn cài đặt và chạy local
- [ ] Ghi lại kiến trúc hệ thống (ERD, API docs) vào thư mục `doc/`
- [ ] Chuẩn bị cấu trúc để có thể deploy lên cloud (Phase 3)

---

## Thứ tự ưu tiên thực hiện

| Ưu tiên | Nhiệm vụ | Lý do |
|:---:|---|---|
| Cao | Authentication | Bảo vệ dữ liệu, cần thiết trước mọi tính năng khác |
| Cao | Chỉnh sửa chi tiêu | Hoàn thiện CRUD còn thiếu từ Phase 1 |
| Trung | Biểu đồ và Phân tích | Tăng giá trị sử dụng rõ rệt nhất |
| Trung | Quản lý ngân sách | Tính năng cốt lõi của expense manager |
| Thấp | Xuất dữ liệu | Tiện ích bổ sung |
| Thấp | Chi tiêu định kỳ | Tính năng nâng cao |
| Thấp | UX Enhancement | Hoàn thiện trải nghiệm |
| Cuối | Testing and Docs | Đảm bảo chất lượng trước Phase 3 |

---

## Kết quả mong đợi cuối Phase 2
- Người dùng có thể đăng ký, đăng nhập và quản lý chi tiêu riêng tư
- Hỗ trợ đầy đủ CRUD (thêm, xem, sửa, xóa)
- Có biểu đồ trực quan giúp phân tích thói quen chi tiêu
- Có hệ thống ngân sách theo danh mục với cảnh báo vượt mức
- Có thể xuất dữ liệu ra CSV / PDF
- Code có test, có tài liệu đầy đủ
- Sẵn sàng để deploy lên cloud trong Phase 3
