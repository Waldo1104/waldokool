# 🌴 Waldo Kool Travel — Modern Travel Landing Page & Agentic Booking Hub

Hệ thống Landing Page & Điều phối Đặt Tour Du lịch thông minh tích hợp công nghệ AI, hỗ trợ đa ngôn ngữ, mã chuyển cọc VietQR, xác nhận email tự động, quản trị nội bộ và sao lưu Cloud.

---

## 🚀 Các Tính Năng Trọng Điểm

1. **Khám Phá Chùm Tour 2026:**
   - 🇰🇷 **Tour Hàn Quốc (Seoul – Nami – Everland):** 5N4Đ, bay Vietjet Air, khách sạn 4 sao trung tâm, tặng vé The Painter Show & trải nghiệm Hanbok.
   - 🇻🇳 **Tour Địa Đạo Củ Chi:** 1 Ngày, mê cung ngầm 200km, bếp Hoàng Cầm, trải nghiệm bắn súng AK-47/M16.
   - 🏙️ **City Tour TP.HCM & Tuyến Metro:** 1 Ngày, trải nghiệm tuyến tàu điện ngầm hiện đại, chiêm bái Chùa Bửu Long & ẩm thực Sen Nam Bộ.
2. **Thanh Toán Cọc VietQR Tức Thì:** Tích hợp mã QR ngân hàng BIDV (Chủ TK: NGUYEN DINH DO, STK: 5801433856).
3. **Kênh Kết Nối 24/7:** Zalo, WhatsApp (+84 859613243), Facebook Messenger.
4. **Bộ Chuyển Đổi 4 Ngôn Ngữ:** Tiếng Việt (VI), English (EN), Français (FR), 中文普通话 (ZH).
5. **Gửi Email Xác Nhận Tự Động:** Phát hành hóa đơn xác nhận đặt chỗ HTML chuyên nghiệp gửi đến email khách hàng ngay khi đặt tour.
6. **Trang Quản Trị Hệ Thống (Admin Portal - `admin.html`):** Theo dõi đơn đặt chỗ, lưu lượng truy cập realtime, lịch sử email đã gửi và phân quyền Main Admin / Sub-Admins.
7. **Sao Lưu Đám Mây Firebase:** Đồng bộ tự động các đơn đặt chỗ lên Cloud Firestore.
8. **Sẵn Sàng Triển Khai Lên Vercel:** Tệp cấu hình `vercel.json` tối ưu cache, rewrite URL rút gọn `/admin`.

---

## 📦 Hướng Dẫn Triển Khai Trực Tuyến (Online Deployment Guide)

### Bước 1: Lưu Mã Nguồn Lên GitHub
1. Đăng nhập vào [GitHub](https://github.com/) và nhấn **"New repository"**.
2. Đặt tên repository: `waldo-kool-travel` (chọn **Public** hoặc **Private**).
3. Tải toàn bộ thư mục dự án lên repo (kéo thả các file `index.html`, `admin.html`, `assets/`, `firebase-backup.js`, `translations.js`, `vercel.json`,... lên giao diện web của GitHub).

### Bước 2: Triển Khai Lên Vercel (Miễn phí, 1 Phút)
1. Truy cập [Vercel](https://vercel.com/) và đăng nhập bằng tài khoản GitHub của bạn.
2. Nhấn nút **"Add New..."** ➔ Chọn **"Project"**.
3. Chọn kho mã nguồn `waldo-kool-travel` từ GitHub và nhấn **"Deploy"**.
4. Vercel sẽ tự động cấp phát tên miền trực tuyến miễn phí (dạng `https://waldo-kool-travel.vercel.app`) với chứng chỉ SSL HTTPS bảo mật.

### Bước 3: Kết Nối Sao Lưu Firebase Cloud Firestore
1. Vào [Firebase Console](https://console.firebase.google.com/) ➔ Tạo Project mới `waldo-kool-travel`.
2. Chọn **Build** ➔ **Firestore Database** ➔ Nhấn **Create Database** (chọn chế độ *Test mode*).
3. Mở cài đặt Project Settings ➔ Thêm Web App (`</>`) để lấy các khóa API (`apiKey`, `projectId`...).
4. Dán thông tin cấu hình vào tệp `firebase-backup.js` trên GitHub. Vercel sẽ tự động cập nhật ngay lập tức!
