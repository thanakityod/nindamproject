# GUWATCH888 - Luxury Digital Timepieces & E-Commerce Web/Mobile App
**วิชา Internet Programming (IP) | มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตศรีราชา**

- **ชื่อ-นามสกุล:** นายธนกิจ ยอดเสาดีกุล (Thanakit yodsaodeekul)
- **รหัสนักศึกษา:** `6730251468`
- **ฐานข้อมูล MySQL คลาวด์:** `ip_std6730251468` (พอร์ต `3108`)
- **phpMyAdmin URL:** [http://119.59.102.161/nindamdb/](http://119.59.102.161/nindamdb/index.php?route=/database/structure&db=ip_std6730251468)
- **สแตกเทคโนโลยี:** React Native (Expo) + Node.js (Express) + MySQL + AI/ML K-Means Clustering + E-Commerce Checkout

---

## 📌 คุณสมบัติของระบบ (Project Features)

1. **ร้านค้าและแคตตาล็อกสินค้านาฬิกาดิจิตอล (GUWATCH888):**
   - นาฬิกาดิจิตอลแท้ 100% ครอบคลุม 5 หมวดหมู่: `Sport & Tactical`, `Smartwatch`, `Vintage Retro`, `Casual LED`, `Luxury Digital`
   - ข้อมูลครบถ้วน: รหัสสินค้า (Product SKU), ชื่อรุ่น, รายละเอียดสเปก, ราคา, สต็อกคงเหลือ, สี/วัสดุ, ขนาดหน้าปัด, คลังจัดเก็บ และรูปภาพความละเอียดสูง
   - รองรับการค้นหา (Live Search) และตัวกรองหมวดหมู่

2. **ระบบสั่งซื้อและชำระเงิน (E-Commerce Shopping Cart & Checkout):**
   - **ตะกร้าสินค้า (Smart Cart):** ปุ่ม "🛒 ใส่ตะกร้า" และ "⚡ ซื้อทันที" ปรับจำนวนและลบสินค้าได้
   - **โค้ดส่วนลด (Promo Codes):**
     - โค้ด `GU888VIP` ลดทันที 10%
     - โค้ด `SRIRACHA` หรือ `KU67` ลดทันที 15%
   - **ระบบชำระเงิน 4 ช่องทาง:** พร้อมเพย์ (PromptPay QR Code สแกนจ่ายได้จริง), บัตรเครดิต/เดบิต, โอนผ่านธนาคาร, และเก็บเงินปลายทาง (COD)
   - **ตัดสต็อกอัตโนมัติ:** เมื่อยืนยันคำสั่งซื้อ ระบบจะบันทึกลงตาราง `Orders` / `OrderItems` และตัดสต็อกในตาราง `Products` บนฐานข้อมูล MySQL จริงทันที
   - **ใบเสร็จดิจิทัล (Digital Receipt) & หน้าประวัติคำสั่งซื้อ (Orders History):** ตรวจสอบย้อนหลังได้ทุกคำสั่งซื้อ

3. **ระบบสมาชิกและสิทธิ์การใช้งาน (Authentication & Roles in MySQL):**
   - หน้า Sign In (เข้าสู่ระบบ) และ Sign Up (สมัครสมาชิกใหม่)
   - รหัสผ่านเข้ารหัสความปลอดภัยด้วย `bcryptjs` บันทึกลงตาราง `user` บน MySQL
   - แบ่งสิทธิ์ผู้ใช้งาน:
     - `admin`: มีสิทธิ์เพิ่ม แก้ไข และลบสินค้านาฬิกาในระบบ
     - `user`: สมาชิกทั่วไป เลือกซื้อสินค้า และดูประวัติคำสั่งซื้อ

4. **AI / ML K-Means Price Clustering:**
   - วิเคราะห์และจัดกลุ่มราคานาฬิกาออกเป็น 3 ระดับ (Low / Mid / High Tier) ทั้งฝั่งไคลเอนต์และคลาวด์
   - หน้าแดชบอร์ด **AI Analytics Dashboard** แสดงสัดส่วนยอดขาย กราฟสัดส่วนราคา และตารางวิเคราะห์

5. **API ตามมาตรฐานวิชาอาจารย์สมเศวต (Dr. Somsawut):**
   - `GET /nindam_pro_api`: ส่งคืน JSON รายการสินค้าทั้งหมดจาก MySQL ตาราง `Products`
   - `GET /api/products`: แคตตาล็อกสินค้าพร้อมฟิลเตอร์
   - `POST /api/orders`: รับคำสั่งซื้อและตัดสต็อก
   - `GET /api/clusters`: ผลการวิเคราะห์ K-Means

---

## 📂 โครงสร้างโปรเจกต์ (Project Structure)

```text
digital-watch-app/
├── backend/
│   ├── database.sql           # โครงสร้างตาราง MySQL (user, Products, ProductClusters, Orders, OrderItems)
│   ├── package.json           # การตั้งค่าแพ็กเกจ Node.js (express, mysql2, cors, bcryptjs, jsonwebtoken, ssh2)
│   ├── server.js              # Express REST API เชื่อมต่อ MySQL และระบบคำสั่งซื้อ
│   ├── cloud_runner.js        # สคริปต์เชื่อมต่อ SSH และรันเซิร์ฟเวอร์บนคลาวด์พอร์ต 3108
│   ├── .env                   # ไฟล์ตั้งค่า Port, DB Credentials
│   └── .env.example
├── frontend/
│   ├── package.json           # React Native / Expo dependencies
│   ├── app.json
│   ├── tsconfig.json
│   └── src/
│       ├── app/
│       │   ├── _layout.tsx
│       │   ├── index.tsx      # หน้าหลัก GUWATCH888, Hero Banner, Featured Spotlight, Drawer, Tabs
│       │   ├── products.tsx   # แคตตาล็อกนาฬิกา พร้อมตัวกรองหมวดหมู่ และตัวกรอง AI Tiers
│       │   ├── productcard.tsx# การ์ดแสดงสินค้านาฬิกาหรู, ป้าย AI Badge, ปุ่มใส่ตะกร้า / ซื้อทันที
│       │   ├── cartmodal.tsx  # ตะกร้าสินค้า, ใส่โค้ดส่วนลด, ฟอร์มจัดส่ง, ชำระเงิน PromptPay QR
│       │   ├── orders.tsx     # หน้าประวัติคำสั่งซื้อทั้งหมดที่บันทึกใน MySQL
│       │   ├── dashboard.tsx  # แดชบอร์ด AI K-Means Price Clustering
│       │   ├── categories.tsx # หน้าหมวดหมู่สินค้า
│       │   ├── locations.tsx  # หน้าคลังสินค้าและสาขา
│       │   ├── add.tsx        # ฟอร์มเพิ่มสินค้านาฬิกาใหม่ (สำหรับ Admin)
│       │   └── edit.tsx       # ฟอร์มแก้ไขข้อมูลนาฬิกา (สำหรับ Admin)
│       ├── constants/
│       │   └── theme.ts       # ธีมสี Luxury Cyber Obsidian (#07090E, #00F2FE, #F59E0B)
│       └── lib/
│           ├── api.ts         # ฟังก์ชันเชื่อมต่อ REST API & Authentication Header
│           ├── cart.ts        # ฟังก์ชันจัดเก็บตะกร้าสินค้า AsyncStorage
│           ├── constants.ts   # ค่าคงที่ API Endpoint (http://119.59.102.161:3108/api)
│           ├── kmeans.ts      # อัลกอริทึม K-Means
│           └── product-status.ts
├── data/
│   └── digital_watches.json   # ข้อมูลสินค้านาฬิกาดิจิตอล 15 รายการต้นฉบับ
├── analysis/
│   ├── clustering.py          # สคริปต์ Python สำหรับรัน K-Means Scikit-Learn
│   └── requirements.txt
├── start_web.bat              # ดับเบิลคลิกเพื่อรันระบบทั้งหมด (Backend + Frontend)
├── stop_web.bat               # ดับเบิลคลิกเพื่อปิดระบบทั้งหมด
└── README.md
```

---

## 🚀 วิธีการเปิดใช้งานระบบ (Quick Start)

### วิธีที่ 1: ดับเบิลคลิกไฟล์ Batch (ง่ายที่สุด)
- **เปิดระบบ:** ดับเบิลคลิกที่ไฟล์ `start_web.bat` ระบบจะเปิดทั้ง Backend (3108) และหน้าเว็บ Expo Frontend (8081) ให้อัตโนมัติ
- **ปิดระบบ:** ดับเบิลคลิกที่ไฟล์ `stop_web.bat`

### วิธีที่ 2: รันผ่าน Terminal / PowerShell
1. **รัน Backend:**
   ```powershell
   cd backend
   npm install
   node cloud_runner.js
   ```
2. **รัน Frontend:**
   ```powershell
   cd frontend
   npm install
   npx expo start --web
   ```
3. เปิดเว็บเบราว์เซอร์ไปที่: `http://localhost:8081`

---

## 🔑 บัญชีทดสอบระบบ (Test Accounts)

| สิทธิ์ (Role) | Username | Password | รายละเอียด |
| :--- | :--- | :--- | :--- |
| **Admin ผู้ดูแลระบบ** | `admin` | `123456` | สิทธิ์สูงสุด เพิ่ม/แก้ไข/ลบสินค้าใน MySQL ได้ |
| **Admin นักศึกษา** | `std6730251468` | `123456` | บัญชีนักศึกษาเจ้าของฐานข้อมูล |
| **User ลูกค้าทั่วไป** | `customer1` | `123456` | เลือกซื้อสินค้าและสั่งซื้อได้ |
| **สมัครสมาชิกใหม่** | กดปุ่ม *สมัครสมาชิก (Sign Up)* | - | ระบบจะบันทึกข้อมูลลงตาราง `user` บน MySQL ทันที |

---

## 📡 สรุป Endpoint บนเซิร์ฟเวอร์คลาวด์ (`http://119.59.102.161:3108`)

- `GET /nindam_pro_api` : ดึงข้อมูลนาฬิกาทั้งหมด 15 รุ่นจาก MySQL โดยตรง
- `GET /api/products` : ค้นหาและกรองรายการสินค้า
- `POST /api/orders` : สร้างคำสั่งซื้อและตัดสต็อกในฐานข้อมูล
- `GET /api/orders` : ดึงประวัติคำสั่งซื้อทั้งหมด
- `GET /api/clusters` : ดึงผลการวิเคราะห์ราคา AI K-Means
- `POST /api/auth/register` : สมัครสมาชิกใหม่
- `POST /api/auth/login` : เข้าสู่ระบบรับ JWT Token
