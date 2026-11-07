-- ==============================================================
-- Database Setup Script for ip_std6730251468
-- Target: http://119.59.102.161/nindamdb/ (phpMyAdmin)
-- Store: Digital Watches Store (ร้านขายนาฬิกาดิจิตอล)
-- ==============================================================

USE `ip_std6730251468`;

-- 1. Table structure for table `user`
CREATE TABLE IF NOT EXISTS `user` (
  `user_id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  `password` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  `role` ENUM('user', 'admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table structure for table `Products` (Digital Watches)
CREATE TABLE IF NOT EXISTS `Products` (
  `Product_ID` INT NOT NULL AUTO_INCREMENT,
  `Productcode` VARCHAR(50) NOT NULL UNIQUE,
  `Name` VARCHAR(255) NOT NULL,
  `details` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `price` DECIMAL(12,2) NOT NULL DEFAULT '0.00',
  `monthly_sales` INT NOT NULL DEFAULT '0',
  `color` VARCHAR(100) DEFAULT NULL,
  `size` VARCHAR(100) DEFAULT NULL,
  `Stock` INT DEFAULT '0',
  `Category` VARCHAR(100) DEFAULT NULL,
  `Location` VARCHAR(100) DEFAULT NULL,
  `image` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `ProductLink` VARCHAR(500) DEFAULT NULL,
  `LastUpdate` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Product_ID`),
  INDEX `idx_productcode` (`Productcode`),
  INDEX `idx_category` (`Category`),
  INDEX `idx_name` (`Name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table structure for table `ProductClusters` (AI/ML K-Means)
CREATE TABLE IF NOT EXISTS `ProductClusters` (
  `product_code` VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cluster_label` VARCHAR(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` DECIMAL(12, 2) NOT NULL,
  `monthly_sales` INT NOT NULL DEFAULT 0,
  `clustered_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table structure for table `Orders` (GUWATCH888 E-Commerce)
CREATE TABLE IF NOT EXISTS `Orders` (
  `order_id` INT NOT NULL AUTO_INCREMENT,
  `order_no` VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  `user_id` INT NULL,
  `customer_name` VARCHAR(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_phone` VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `shipping_address` TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_method` VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'promptpay',
  `total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('pending', 'paid', 'shipping', 'completed', 'cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'paid',
  `slip_url` TEXT COLLATE utf8mb4_unicode_ci NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Table structure for table `OrderItems`
CREATE TABLE IF NOT EXISTS `OrderItems` (
  `item_id` INT NOT NULL AUTO_INCREMENT,
  `order_id` INT NOT NULL,
  `product_code` VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_name` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` DECIMAL(12,2) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `subtotal` DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (`item_id`),
  INDEX `idx_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================
-- Sample Data Insertion
-- ==============================================================

-- Initial Users (Password for all default accounts is: 123456)
-- Valid Bcrypt hash of '123456':
INSERT INTO `user` (`user_id`, `username`, `password`, `email`, `role`) VALUES
(1, 'admin', '$2b$10$D/dLW3kBztqySNcvfYBJXOM5vr9Evihnln01M0JJ3y4ffR5ZkbW52', 'admin@digitalwatch.com', 'admin'),
(2, 'std6730251468', '$2b$10$D/dLW3kBztqySNcvfYBJXOM5vr9Evihnln01M0JJ3y4ffR5ZkbW52', 'std6730251468@ku.th', 'admin'),
(3, 'customer1', '$2b$10$D/dLW3kBztqySNcvfYBJXOM5vr9Evihnln01M0JJ3y4ffR5ZkbW52', 'customer@example.com', 'user')
ON DUPLICATE KEY UPDATE `password`=VALUES(`password`), `role`=VALUES(`role`);

-- Initial Digital Watch Inventory
INSERT INTO `Products` (`Productcode`, `Name`, `details`, `price`, `monthly_sales`, `color`, `size`, `Stock`, `Category`, `Location`, `image`) VALUES
('DW-101', 'Casio Vintage A168WA Classic Silver', 'นาฬิกาดิจิตอลทรงคลาสสิกยอดนิยม สายสแตนเลสสตีล ไฟส่องสว่างเรืองแสง ElectroLuminescence กันน้ำ จับเวลา 1/100 วินาที แบตเตอรี่ทนทาน 7 ปี', 1290.00, 120, 'Silver / Stainless', '38.6 x 36.3 x 9.6 mm', 45, 'Vintage Retro', 'Warehouse Sriracha', 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80'),
('DW-102', 'Casio F-91W Retro Black Resin', 'นาฬิกาดิจิตอลระดับตำนาน น้ำหนักเบา ทนทาน หน้าจอดิจิตอลชัดเจน กันน้ำ นาฬิกาปลุกรายวัน จับเวลาละเอียด พร้อมไฟ LED สีเขียวสว่างนุ่มนวล', 650.00, 185, 'Matte Black', '38.2 x 35.2 x 8.5 mm', 60, 'Vintage Retro', 'Warehouse Sriracha', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80'),
('DW-103', 'G-Shock DW-5600E Origin Square', 'ต้นตำรับทรงเหลี่ยมทนแรงกระแทก Shock Resistant แท้ กันน้ำลึก 200 เมตร ไฟ EL Backlight กระจกมิเนอรัล สายเรซิน เหมาะสำหรับกิจกรรมลุยทุกรูปแบบ', 2890.00, 95, 'Stealth Black', '48.9 x 42.8 x 13.4 mm', 25, 'Sport & Tactical', 'Central Store BKK', 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80'),
('DW-104', 'G-Shock Mudmaster GG-B100 Quad Sensor', 'นาฬิกาดิจิตอล-อะนาล็อกพันธุ์แกร่ง โครงสร้าง Carbon Core Guard ป้องกันโคลนและฝุ่น เซนเซอร์วัดเข็มทิศ ความกดอากาศ ความสูง อุณหภูมิ และนับก้าว เชื่อมต่อบลูทูธ', 9500.00, 32, 'Military Olive Green', '55.4 x 53.1 x 19.3 mm', 8, 'Sport & Tactical', 'Central Store BKK', 'https://images.unsplash.com/photo-1547996160-71dfabb16812?auto=format&fit=crop&w=800&q=80'),
('DW-105', 'Garmin Instinct 2 Solar Tactical Digital', 'นาฬิกาดิจิตอล GPS ระบบชาร์จพลังงานแสงอาทิตย์ แบตเตอรี่ไร้ขีดจำกัด มาตรฐานทางทหาร MIL-STD-810 โหมดซ่อนตัว Stealth Mode และโหมดกลางคืน Night Vision', 14900.00, 28, 'Coyote Tan', '45 x 45 x 14.2 mm', 5, 'Sport & Tactical', 'Warehouse Sriracha', 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=800&q=80'),
('DW-106', 'Apple Watch Ultra 2 Titanium Ocean', 'ตัวเรือนไทเทเนียมขนาด 49 มม. หน้าปัดสว่างสูงสุด 3,000 nits ชิป S9 SiP ระบบวัดการดำน้ำความลึก 40 เมตร GPS สองคลื่นความถี่ความแม่นยำสูง แบตเตอรี่สูงสุด 72 ชม.', 31900.00, 40, 'Natural Titanium / Ocean Blue', '49 x 44 x 14.4 mm', 10, 'Smartwatch', 'Central Store BKK', 'https://images.unsplash.com/photo-1510017803434-a899398421b3?auto=format&fit=crop&w=800&q=80'),
('DW-107', 'Xiaomi Smart Band 8 Pro AMOLED', 'สมาร์ทวอทช์ดิจิตอลหน้าจอ AMOLED ขนาดใหญ่ 1.74 นิ้ว 60Hz รองรับ GPS ในตัว ตรวจวัดค่าออกซิเจนในเลือด SpO2 และการเต้นหัวใจ 24 ชม. แบตอึด 14 วัน', 2490.00, 140, 'Light Gray Metallic', '46 x 33.3 x 9.9 mm', 35, 'Smartwatch', 'Warehouse Sriracha', 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80'),
('DW-108', 'Casio A158WEA Gold Screen Vintage', 'ดีไซน์เรโทรคลาสสิก หน้าจอดิจิตอลขอบทอง สายสแตนเลสปรับระดับได้ สวมใส่สบายทุกโอกาส มีฟังก์ชันนาฬิกาปลุกและสัญญาณแจ้งเตือนรายชั่วโมง', 1450.00, 75, 'Silver & Gold Dial', '36.8 x 33.2 x 8.2 mm', 18, 'Vintage Retro', 'Warehouse Sriracha', 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80'),
('DW-109', 'Suunto Core All Black Altimeter', 'นาฬิกาดิจิตอลสำหรับกิจกรรมเอาท์ดอร์ เซนเซอร์วัดระดับความสูง บารอมิเตอร์ตรวจสภาพอากาศ เข็มทิศดิจิตอล และสัญญาณเตือนพายุ ลุคออลแบล็กสุดเท่', 7900.00, 45, 'All Black', '49.1 x 49.1 x 14.5 mm', 12, 'Sport & Tactical', 'Central Store BKK', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80'),
('DW-110', 'Skmei Sport Shock LED Watch', 'นาฬิกาดิจิตอลสปอร์ตราคาประหยัด ฟังก์ชันครบสองระบบเวลา แสดงวันและวันที่ จับเวลา นาฬิกาปลุก กันน้ำ 50 เมตร ไฟ LED แบ็คไลท์กลางคืน', 490.00, 210, 'Matte Blue', '50 x 48 x 15 mm', 50, 'Casual LED', 'Warehouse Sriracha', 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80'),
('DW-111', 'Timex Ironman Classic 30 Full-Size', 'นาฬิกาดิจิตอลไตรกีฬาในตำนาน บันทึกรอบจับเวลา 30 Lap เมมโมรี่ ไฟหน้าปัด Indiglo Night-Light ปลุก 3 เวลา กันน้ำลึก 100 เมตร สายซิลิโคนใส่สบาย', 2190.00, 65, 'Black / Grey', '42 x 42 x 12 mm', 0, 'Sport & Tactical', 'Central Store BKK', 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80'),
('DW-112', 'Samsung Galaxy Watch6 Classic LTE', 'สมาร์ทวอทช์จอ Super AMOLED ขนาด 1.5 นิ้ว หมุนขอบเบเซิลสุดคลาสสิก วัดคลื่นไฟฟ้าหัวใจ ECG และความดันโลหิต วัดองค์ประกอบร่างกาย BIA รองรับ e-SIM', 13900.00, 55, 'Silver Stainless Steel', '47 x 47 x 10.9 mm', 14, 'Smartwatch', 'Central Store BKK', 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=800&q=80'),
('DW-113', 'Nixon Regulus Digital Cyber Tactical', 'ร่วมออกแบบกับหน่วยรบพิเศษสหรัฐฯ ตัวเรือนโพลีคาร์บอเนตหุ้มซิลิโคนกันกระแทก ระบบจับเวลาคู่ หน้าจอ LCD ความคมชัดสูงพิเศษ แบตเตอรี่ 5 ปี', 6200.00, 38, 'Sand Gunmetal', '46 x 46 x 16 mm', 7, 'Sport & Tactical', 'Warehouse Sriracha', 'https://images.unsplash.com/photo-1547996160-71dfabb16812?auto=format&fit=crop&w=800&q=80'),
('DW-114', 'Casio Databank DBC-32 Calculator', 'นาฬิกาดิจิตอลเครื่องคิดเลข 8 หลัก บันทึกข้อมูลเบอร์โทรศัพท์ได้ 25 รายการ รองรับ 13 ภาษา แบตเตอรี่ยาวนาน 10 ปี สไตล์เรโทรยุค 80s แท้', 1850.00, 82, 'Black Resin', '50.4 x 37.4 x 12 mm', 16, 'Vintage Retro', 'Warehouse Sriracha', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80'),
('DW-115', 'Tag Heuer Connected Calibre E4', 'นาฬิกาดิจิตอลสมาร์ทวอทช์ระดับหรูสวิส ตัวเรือนไทเทเนียมเกรด 2 พ่นทรายดำ ขอบเซรามิกเงา หน้าจอ OLED คมชัดสูง แอพเฉพาะสำหรับกอล์ฟและวิ่ง', 68000.00, 12, 'DLC Black Titanium', '45 x 45 x 15.3 mm', 3, 'Luxury Digital', 'Central Store BKK', 'https://images.unsplash.com/photo-1510017803434-a899398421b3?auto=format&fit=crop&w=800&q=80')
ON DUPLICATE KEY UPDATE `Name`=VALUES(`Name`), `price`=VALUES(`price`), `Stock`=VALUES(`Stock`);

-- Seed initial clusters for AI/ML dashboard
INSERT INTO `ProductClusters` (`product_code`, `cluster_label`, `price`, `monthly_sales`, `clustered_at`) VALUES
('DW-102', 'low', 650.00, 185, NOW()),
('DW-110', 'low', 490.00, 210, NOW()),
('DW-101', 'low', 1290.00, 120, NOW()),
('DW-108', 'low', 1450.00, 75, NOW()),
('DW-114', 'low', 1850.00, 82, NOW()),
('DW-111', 'medium', 2190.00, 65, NOW()),
('DW-107', 'medium', 2490.00, 140, NOW()),
('DW-103', 'medium', 2890.00, 95, NOW()),
('DW-113', 'medium', 6200.00, 38, NOW()),
('DW-109', 'medium', 7900.00, 45, NOW()),
('DW-104', 'high', 9500.00, 32, NOW()),
('DW-112', 'high', 13900.00, 55, NOW()),
('DW-105', 'high', 14900.00, 28, NOW()),
('DW-106', 'high', 31900.00, 40, NOW()),
('DW-115', 'high', 68000.00, 12, NOW())
ON DUPLICATE KEY UPDATE `cluster_label`=VALUES(`cluster_label`), `price`=VALUES(`price`);
