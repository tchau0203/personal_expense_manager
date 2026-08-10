# 🚀 PHASE 4 — Nâng cao Personal Expense Manager

> **Trạng thái:** 🔄 Đang thực hiện
> **Phiên bản hệ thống:** v4.0.0-alpha
> **Ngày bắt đầu:** 2026-08-07
> **Nhánh phát triển:** `dev-chau`

---

## 📌 Mục tiêu Phase 4

Nâng cấp ứng dụng thành nền tảng quản lý tài chính thông minh, hỗ trợ người dùng cá nhân và gia đình, có khả năng phân tích sâu, tự động hóa, bảo mật cao và hoạt động tốt trên nhiều nền tảng.

---

## 🎯 Kết quả mong đợi

- Ứng dụng chạy mượt trên cả desktop và mobile với PWA/Offline support
- Người dùng có thể quản lý ngân sách cá nhân và chia sẻ trong gia đình
- Báo cáo thông minh và đề xuất tiết kiệm dựa trên dữ liệu chi tiêu
- Hệ thống nhắc nhở, tự động hóa chi tiêu định kỳ và hoá đơn
- Bảo mật mạnh mẽ với 2FA, mã hoá dữ liệu và audit logging
- CI/CD hoàn chỉnh, testing đầy đủ và tài liệu rõ ràng

---

## 📋 Danh sách nhiệm vụ chính

### 1. Tăng cường ngân sách và kế hoạch tài chính
- [ ] Thêm dashboard kế hoạch ngân sách theo tuần/tháng/năm
- [ ] Hỗ trợ mục tiêu tiết kiệm với trạng thái tiến độ
- [ ] Cảnh báo khi vượt hạn mức danh mục hoặc tổng chi tiêu
- [ ] Lịch trả hoá đơn định kỳ và nhắc nhở
- [ ] Dashboard mục tiêu tài chính riêng cho user

### 2. Hỗ trợ đa user / gia đình
- [ ] Xây dựng chế độ family/shared account hoặc multi-user workspace
- [ ] Thiết lập quyền truy cập owner/member/guest
- [ ] Chia sẻ ngân sách và chi tiêu giữa thành viên
- [ ] Mời thành viên qua email
- [ ] Lịch sử chi tiêu chung và riêng

### 3. Báo cáo nâng cao và đồ họa
- [ ] Thêm biểu đồ funnel, radar, heatmap
- [ ] Báo cáo so sánh theo tuần/tháng/năm
- [ ] Xuất báo cáo PDF đẹp và Excel/CSV nâng cao
- [ ] Gửi báo cáo tự động qua email và link chia sẻ
- [ ] Dashboard tùy chỉnh cho user premium

### 4. AI / Insight thông minh
- [ ] Gợi ý tiết kiệm dựa trên thói quen chi tiêu
- [ ] Dự đoán chi tiêu tiếp theo và khả năng vượt ngân sách
- [ ] Gợi ý phân loại chi tiêu tự động
- [ ] Phân tích xu hướng tiêu dùng theo danh mục/thời gian
- [ ] Cung cấp tip tài chính cá nhân dựa trên dữ liệu người dùng

### 5. Multi nền tảng và offline
- [ ] Responsive UI tốt trên mobile, tablet, desktop
- [ ] Xây dựng PWA với offline và sync khi online
- [ ] Tối ưu touch input và màn hình nhỏ
- [ ] Lưu cache local cho lịch sử, chi tiêu, cài đặt
- [ ] Đồng bộ dữ liệu khi back online

### 6. Tự động hóa và nhắc nhở
- [ ] Thêm reminder hoá đơn và chi tiêu định kỳ
- [ ] Ghi nhận tự động chi tiêu subscription / payment
- [ ] Kết nối lịch nếu có thể (Google Calendar)
- [ ] Đa kênh thông báo: email, in-app, badge
- [ ] Cài đặt tần suất nhắc nhở cá nhân hóa

### 7. Bảo mật và tuân thủ
- [ ] Mã hoá dữ liệu nhạy cảm
- [ ] Thêm xác thực hai lớp (2FA) hoặc OTP
- [ ] Cải thiện privacy policy và terms of use
- [ ] Kiểm tra bảo mật XSS / CSRF / SQL injection
- [ ] Lưu nhật ký hoạt động cho auditing

### 8. Test & vận hành
- [ ] Hoàn thiện test coverage backend/frontend
- [ ] Thêm test end-to-end (Playwright/Cypress)
- [ ] Tối ưu Lighthouse score > 90
- [ ] Cập nhật docs API, deploy, user guide
- [ ] Chuẩn hoá workflow release và staging environment

---

## 🧩 Ưu tiên thực hiện

1. Kế hoạch ngân sách và báo cáo thông minh
2. Hỗ trợ đa user/gia đình
3. AI/Insight và gợi ý thông minh
4. PWA và offline
5. Tự động hóa nhắc nhở
6. Bảo mật và tuân thủ
7. Test & vận hành

---

## 📌 Ghi chú

- Phase 4 nên bổ sung song song với cấu trúc backend hiện tại và các API đã có.
- Nếu cần, có thể chia Phase 4 thành `Phase 4A` (User + Budget) và `Phase 4B` (PWA + AI/Insight) để giao đoạn hóa triển khai.
