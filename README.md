# 🚀 ZaloCRM — Giải pháp Quản lý Zalo Cá nhân Tập trung

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v20-green.svg)](https://nodejs.org/)
[![Vue.js](https://img.shields.io/badge/Vue.js-v3-4fc08d.svg)](https://vuejs.org/)
[![Docker](https://img.shields.io/badge/Docker-ready-blue.svg)](https://www.docker.com/)

**ZaloCRM** là hệ thống quản lý tập trung nhiều tài khoản Zalo cá nhân trên một giao diện web duy nhất. Giải pháp hoàn hảo cho các đội ngũ bán hàng, chăm sóc khách hàng muốn tối ưu hóa tương tác dữ liệu Zalo vào quy trình CRM chuyên nghiệp.

---

## ✨ Tính năng nổi bật

### 📱 Quản lý Đa tài khoản Zalo
*   **Kết nối QR nhanh chóng:** Đăng nhập nhiều tài khoản bằng mã QR, tự động lưu phiên và kết nối lại.
*   **Phân quyền chi tiết:** Gán quyền truy cập từng tài khoản Zalo cho nhân viên cụ thể (Xem, Chat, Quản lý).

### 💬 Trải nghiệm Chat Real-time
*   **Đa phương tiện:** Hỗ trợ gửi/nhận văn bản, hình ảnh, file (PDF, Docs), sticker và tin nhắn nhóm.
*   **Trả lời nhanh:** Tích hợp bộ lọc cuộc hội thoại, ghim khách hàng quan trọng.

### 📊 CRM & Quản lý Khách hàng
*   **Pipeline chuyên nghiệp:** Quản lý quy trình bán hàng (*Mới → Đã liên hệ → Quan tâm → Chuyển đổi → Mất*).
*   **Hồ sơ khách hàng:** Lưu trữ thông tin (SĐT, Email, Nguồn, Tags) ngay trong giao diện chat.
*   **Lịch hẹn thông minh:** Tạo lịch nhắc hẹn, tự động gửi thông báo nhắc nhở hàng ngày.

### 🛠️ Hệ thống & Tích hợp
*   **Cập nhật tự động:** Tính năng cập nhật trực tiếp từ Git ngay trên giao diện (mới).
*   **Public API & Webhook:** Dễ dàng kết nối với Website, Landing Page hoặc hệ thống nội bộ khác.
*   **Chống Block:** Cơ chế giới hạn tin nhắn và phát hiện gửi nhanh để bảo vệ tài khoản Zalo.

---

## 🛠️ Công nghệ sử dụng

| Thành phần        | Công nghệ                                      |
| ----------------- | ---------------------------------------------- |
| **Backend**       | Node.js 20 / Fastify 5 / Prisma 7 / Socket.IO |
| **Frontend**      | Vue 3 / Vuetify 3 / Pinia / Vite               |
| **Database**      | PostgreSQL 16                                  |
| **Kỹ thuật Zalo** | zca-js 2.x                                     |
| **Triển khai**    | Docker / Docker Compose                        |

---

## 🚀 Cài đặt nhanh (Docker)

Cách nhanh nhất để triển khai trên máy cá nhân hoặc VPS:

1.  **Tải mã nguồn:**
    ```bash
    git clone https://github.com/leluongnghia/ZaloCRM-Custom.git
    cd ZaloCRM-Custom
    ```

2.  **Cấu hình:**
    ```bash
    cp .env.example .env
    # Mở file .env để sửa DB_PASSWORD và các Secret Keys
    ```

3.  **Khởi chạy:**
    ```bash
    docker compose up -d --build
    ```

4.  **Truy cập:** `http://localhost:3080` (Tạo tài khoản admin trong lần đầu truy cập).

---

## 🖥️ Cài đặt thủ công (Manual)

Dành cho môi trường phát triển (Development):

### Backend
```bash
cd backend
npm install
npx prisma db push
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 📖 Tài liệu liên quan

*   [Hướng dẫn Cài đặt Chi tiết](HUONG-DAN-CAI-DAT.md)
*   [Hướng dẫn Sử dụng Hệ thống](HUONG-DAN-SU-DUNG.md)

---

## 📄 Giấy phép

Dự án được phát hành dưới giấy phép **MIT**. Bạn hoàn toàn có quyền sử dụng, sửa đổi và đóng góp cho dự án.

---
*Phát triển bởi [leluongnghia](https://github.com/leluongnghia)*
