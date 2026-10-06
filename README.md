# 🍲 Bếp Việt Gourmet - Fullstack Food Ordering Web & Mobile App

Ứng dụng web đặt món ăn trực tuyến fullstack hoàn chỉnh, giao diện hiện đại chuẩn ẩm thực Việt Nam, hiệu ứng chuyển động mượt mà, phân tách riêng biệt trang Khách hàng và trang Quản trị (Admin), tích hợp Chat thời gian thực với chủ quán, kết nối cơ sở dữ liệu SQL, xác thực số điện thoại và địa chỉ giao hàng tại Việt Nam, sẵn sàng cài đặt thành App trên điện thoại (PWA & Capacitor).

---

## 🚀 Cách Khởi Động Nhanh Nhất (1-Click)

### Cách 1: Chạy file Batch tự động (Windows)
Chỉ cần nhấp đúp vào file:
👉 **`start-app.bat`** (nằm ngay tại thư mục gốc `food-ordering-app`)
Hệ thống sẽ tự động mở đồng thời Backend API (Port 5000), Frontend (Port 5173) và tự động mở trình duyệt web.

### Cách 2: Khởi động qua dòng lệnh Terminal
```bash
# Cửa sổ 1: Chạy Backend Server
cd server
npm start

# Cửa sổ 2: Chạy Frontend Client
cd client
npm run dev
```

- **Trang Khách Hàng (Customer):** [http://localhost:5173](http://localhost:5173)
- **Trang Quản Trị (Admin Merchant):** [http://localhost:5173/admin](http://localhost:5173/admin)
- **Backend API & Socket.io:** [http://localhost:5000](http://localhost:5000)

---

## 🔑 Tài Khoản Thử Nghiệm

1. **Khách hàng (Customer):**
   - Đăng nhập bằng bất kỳ số điện thoại Việt Nam hợp lệ 10 số (bắt đầu bằng `03`, `05`, `07`, `08`, `09`).
   - Ví dụ: `0912345678`, `0987654321`.
   - Mã OTP thử nghiệm: **`123456`** (Hệ thống tự động điền sẵn).
2. **Chủ quán / Quản trị viên (Admin):**
   - Phân quyền bảo mật: Hệ thống yêu cầu xác thực mật khẩu trước khi vào bảng điều khiển.
   - Truy cập: [http://localhost:5173/admin/login](http://localhost:5173/admin/login) hoặc bấm nút **"Quản Trị Quán"** ở thanh menu.
   - Mật khẩu Quản Trị: **`14092006`** (Bảo mật 100%, sai mật khẩu sẽ bị từ chối truy cập).

---

## 🌟 Các Tính Năng Nổi Bật

### 1. Phân Tách Giao Diện Khách Hàng & Quản Trị (Admin)
- **Giao diện Khách hàng (`/`):** Tông màu cam ấm áp của ẩm thực, danh mục món ăn (Cơm, Phở, Bún, Bánh mì, Trà sữa, Ăn vặt), banner khuyến mãi, giỏ hàng trượt mượt mà, lọc theo giá và độ cay.
- **Giao diện Quản trị (`/admin`):** Giao diện Dark Slate chuyên nghiệp dành cho chủ quán, bảng số liệu doanh thu thời gian thực, danh sách đơn hàng cần nấu, biểu đồ món bán chạy.

### 2. Quản Lý Món Ăn (CRUD) & Chỉnh Sửa Giá Tiền
- **Thêm món mới:** Điền tên món, danh mục, giá tiền, giá gốc giảm giá, thời gian nấu, độ cay, mô tả.
- **2 Chế độ thêm ảnh:**
  - 🔗 **Dán Link Ảnh (URL):** Nhập trực tiếp link ảnh từ Unsplash, Google, CDN.
  - 📁 **Tải Ảnh Từ Máy Tính (File Upload):** Chọn file ảnh từ máy (JPG, PNG, WEBP), ảnh được tải lên thư mục `server/uploads/` qua Multer và hiển thị xem trước tức thì.
- **Đổi giá tiền:** Bấm trực tiếp vào cột giá trên bảng để sửa giá nhanh trong 2 giây hoặc sửa chi tiết trong Modal.
- **Chuyển đổi trạng thái:** 1 chạm để chuyển đổi giữa "Còn Món" và "Hết Món".
- **Xóa món:** Hộp thoại xác nhận an toàn trước khi xóa khỏi CSDL SQL.

### 3. Chat Trực Tiếp Thời Gian Thực Với Người Bán (Real-Time Chat)
- Khách hàng có nút bong bóng chat nổi ở góc phải màn hình, hỗ trợ mẫu tin nhắn nhanh: *"Đơn của tôi đang làm chưa ạ?"*, *"Quán có món chay không?"*.
- Chủ quán có trang **"Hỗ Trợ Khách Hàng"** (`/admin/chat`): Quản lý danh sách hội thoại theo từng số điện thoại khách hàng, nhận diện tin nhắn chưa đọc, phản hồi tức thì qua WebSocket (Socket.io).

### 4. Đặt Hàng & Validate Số Điện Thoại, Địa Chỉ Việt Nam
- **Kiểm tra số điện thoại Việt Nam:** Regex chuẩn định dạng 10 chữ số (+84 hoặc 03x, 05x, 07x, 08x, 09x).
- **Kiểm tra địa chỉ giao hàng:** Danh sách chuẩn 63 Tỉnh/Thành phố Việt Nam, tự động gợi ý Quận/Huyện tương ứng, yêu cầu nhập số nhà và tên đường rõ ràng để shipper giao tận nơi.
- **Theo dõi tiến trình đơn hàng (Live Stepper):** Hiển thị các bước trực quan: *Đã tiếp nhận -> Đang nấu -> Đang giao -> Hoàn tất*. Khi chủ quán đổi trạng thái, màn hình khách hàng tự động cập nhật ngay lập tức.

### 5. Kết Nối Cơ Sở Dữ Liệu SQL
- Dự án sử dụng hệ quản trị SQL tiêu chuẩn (chạy trên Node.js `node:sqlite` thuần, không cần cài đặt thêm Docker hay MySQL bên ngoài).
- File CSDL lưu trữ tại: `server/db/food_delivery.db`.
- File Schema SQL: `server/db/schema.sql`.
- File Backup SQL chuẩn (để import sang MySQL/PostgreSQL/phpMyAdmin nếu cần): `server/db/full_backup.sql`.

---

## 📱 Hướng Dẫn Đóng Gói Thành Mobile App (Android / iOS)

### Cách 1: Cài đặt trực tiếp dưới dạng PWA (Không cần cài phần mềm)
Ứng dụng đã được tích hợp sẵn file `manifest.json` và Service Worker:
1. Mở trang web `http://localhost:5173` (hoặc domain khi deploy) trên trình duyệt điện thoại.
2. **Trên Android (Chrome):** Bấm menu 3 chấm ở góc phải ➔ Chọn **"Cài đặt ứng dụng"** hoặc **"Thêm vào màn hình chính"**.
3. **Trên iOS / iPhone (Safari):** Bấm nút Chia sẻ (biểu tượng mũi tên hướng lên) ➔ Chọn **"Thêm vào MH chính" (Add to Home Screen)**.
➔ Ứng dụng sẽ xuất hiện trên màn hình điện thoại với icon riêng và chạy toàn màn hình y hệt ứng dụng native.

### Cách 2: Đóng gói thành file APK Android bằng Capacitor
Để xuất thành file APK Android độc lập:
```bash
cd client

# 1. Cài đặt Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Khởi tạo cấu hình Capacitor
npx cap init "BepViet" "com.bepviet.app" --web-dir dist

# 3. Build ứng dụng web
npm run build

# 4. Thêm nền tảng Android
npx cap add android

# 5. Mở trong Android Studio để xuất file APK
npx cap open android
```
Trong Android Studio, chỉ cần chọn **Build ➔ Build Bundle(s) / APK(s) ➔ Build APK(s)** để lấy file `.apk` cài đặt lên bất kỳ điện thoại Android nào!

---

## 📂 Cấu Trúc Thư Mục Dự Án

```
food-ordering-app/
├── start-app.bat              # Script 1-click khởi động toàn bộ hệ thống
├── README.md                  # Hướng dẫn chi tiết dự án
├── package.json               # Root config
├── server/                    # BACKEND API & SQL DATABASE
│   ├── db/
│   │   ├── schema.sql         # Schema SQL tạo bảng
│   │   ├── database.js        # Khởi tạo SQL và seed 12 món ăn Việt Nam
│   │   ├── export_sql.js      # Script xuất SQL dump
│   │   └── food_delivery.db   # File CSDL SQL SQLite
│   ├── routes/
│   │   ├── auth.js            # Xác thực SĐT Việt Nam & OTP
│   │   ├── foods.js           # CRUD món ăn & chỉnh giá
│   │   ├── orders.js          # Tạo đơn, validate địa chỉ, cập nhật tiến trình
│   │   ├── chat.js            # Lịch sử chat SQL
│   │   ├── stats.js           # Thống kê doanh thu admin
│   │   └── upload.js          # Tải ảnh trực tiếp bằng file (Multer)
│   ├── socket/
│   │   └── chatSocket.js      # Real-time WebSocket chat & đơn hàng
│   ├── uploads/               # Thư mục lưu ảnh người bán tải lên
│   └── index.js               # Entry point server Express (Port 5000)
└── client/                    # FRONTEND WEB & MOBILE APP
    ├── public/
    │   ├── manifest.json      # Cấu hình PWA Mobile
    │   └── sw.js              # Service Worker
    ├── src/
    │   ├── api/index.js       # Gọi API & Socket kết nối backend
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   ├── CartContext.jsx
    │   │   └── ChatContext.jsx
    │   ├── utils/
    │   │   └── vietnamData.js # Dữ liệu 63 tỉnh thành & validate SĐT VN
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── BottomNav.jsx  # Thanh dock mobile app
    │   │   ├── FoodCard.jsx
    │   │   ├── FoodDetailModal.jsx
    │   │   ├── CartDrawer.jsx
    │   │   ├── LiveChatWidget.jsx
    │   │   ├── LoginModal.jsx
    │   │   ├── PwaInstallBanner.jsx
    │   │   └── Toast.jsx
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── Menu.jsx
    │   │   ├── Checkout.jsx
    │   │   ├── OrderSuccess.jsx
    │   │   ├── MyOrders.jsx
    │   │   └── admin/
    │   │       ├── AdminLayout.jsx
    │   │       ├── Dashboard.jsx
    │   │       ├── FoodManagement.jsx  # Thêm/Sửa/Xóa/Giá/Ảnh URL hoặc File
    │   │       ├── OrderManagement.jsx # Quản lý đơn hàng thời gian thực
    │   │       └── AdminChat.jsx       # Chat seller trực tiếp
    │   ├── App.jsx
    │   └── main.jsx
    └── vite.config.js
```
