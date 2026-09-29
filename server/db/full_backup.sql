-- Bếp Việt Gourmet SQL Dump
-- Generated on: 2026-09-29T05:13:39.429Z

-- Vietnam Food Delivery SQL Database Schema
-- Compatible with SQLite, PostgreSQL, MySQL

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  province TEXT,
  district TEXT,
  ward TEXT,
  role TEXT DEFAULT 'customer',
  avatar TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  display_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS foods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  original_price REAL,
  image TEXT NOT NULL,
  is_available INTEGER DEFAULT 1,
  rating REAL DEFAULT 5.0,
  prep_time INTEGER DEFAULT 20,
  spicy_level INTEGER DEFAULT 0,
  is_featured INTEGER DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_code TEXT UNIQUE NOT NULL,
  user_id INTEGER,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  province TEXT,
  district TEXT,
  note TEXT,
  subtotal REAL NOT NULL,
  discount REAL DEFAULT 0,
  delivery_fee REAL DEFAULT 15000,
  total_amount REAL NOT NULL,
  payment_method TEXT DEFAULT 'COD',
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  food_id INTEGER,
  food_name TEXT NOT NULL,
  food_image TEXT,
  price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  total REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS store_settings (
  id INTEGER PRIMARY KEY,
  store_name TEXT DEFAULT 'Bếp Việt Gourmet',
  is_open INTEGER DEFAULT 1,
  hotline TEXT DEFAULT '1900 6868',
  address TEXT DEFAULT '123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
  banner_message TEXT DEFAULT 'Chào mừng bạn đến với Bếp Việt - Giảm ngay 20.000đ cho đơn từ 150k!'
);


INSERT INTO categories (id, name, slug, icon, display_order) VALUES (1, 'Cơm & Món Chính', 'com-mon-chinh', 'Utensils', 1);
INSERT INTO categories (id, name, slug, icon, display_order) VALUES (2, 'Phở, Bún & Mì', 'pho-bun-mi', 'Soup', 2);
INSERT INTO categories (id, name, slug, icon, display_order) VALUES (3, 'Bánh Mì & Ăn Sáng', 'banh-mi-an-sang', 'Sandwich', 3);
INSERT INTO categories (id, name, slug, icon, display_order) VALUES (4, 'Đồ Uống & Trà Sữa', 'do-uong-tra-sua', 'CupSoda', 4);
INSERT INTO categories (id, name, slug, icon, display_order) VALUES (5, 'Ăn Vặt & Khai Vị', 'an-vat-khai-vi', 'Cookie', 5);
INSERT INTO categories (id, name, slug, icon, display_order) VALUES (6, 'Tráng Miệng & Chè', 'trang-mieng-che', 'IceCream', 6);

INSERT INTO foods (id, category_id, name, description, price, original_price, image, is_available, rating, prep_time, spicy_level, is_featured, sales_count) VALUES (1, 2, 'Phở Bò Tái Lăn Hà Nội', 'Thịt bò tươi xào lăn thơm phức tỏi gừng, nước dùng hầm xương 12 tiếng ngọt thanh đậm đà, ăn kèm quẩy giòn tan và ớt chưng gia truyền.', 55000, 65000, 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80', 1, 4.9, 15, 1, 1, 342);
INSERT INTO foods (id, category_id, name, description, price, original_price, image, is_available, rating, prep_time, spicy_level, is_featured, sales_count) VALUES (2, 2, 'Bún Chả Nem Cua Bể Phố Cổ', 'Chả thịt nướng than hoa thơm lừng quyện nước mắm chua ngọt chuẩn vị Bắc, kèm nem cua bể giòn rụm và rau sống tươi mát.', 60000, 70000, 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=800&q=80', 1, 4.8, 20, 0, 1, 289);
INSERT INTO foods (id, category_id, name, description, price, original_price, image, is_available, rating, prep_time, spicy_level, is_featured, sales_count) VALUES (3, 1, 'Cơm Tấm Sườn Bì Chả Đặc Biệt', 'Hạt gạo tấm thơm dẻo, sườn cốt lết ướp mật ong nướng vàng ươm, chả trứng béo ngậy, bì giòn thơm và mỡ hành tóp mỡ rưới đẫm.', 58000, 65000, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', 1, 4.9, 15, 0, 1, 512);
INSERT INTO foods (id, category_id, name, description, price, original_price, image, is_available, rating, prep_time, spicy_level, is_featured, sales_count) VALUES (4, 3, 'Bánh Mì Chảo Xíu Mại Pate Trứng', 'Chảo nóng sốt xì xèo với viên xíu mại mềm thơm, pate gan béo ngậy, trứng ốp la lòng đào, xúc xích và bánh mì giòn rụm.', 45000, 50000, 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80', 1, 4.7, 12, 1, 1, 198);
INSERT INTO foods (id, category_id, name, description, price, original_price, image, is_available, rating, prep_time, spicy_level, is_featured, sales_count) VALUES (5, 5, 'Bún Đậu Mắm Tôm Thập Cẩm', 'Đậu mơ rán giòn vỏ mềm ruột, thịt bắp luộc, chả cốm nóng hổi, nem rán giòn tan chấm cùng mắm tôm Thanh Hóa đánh sủi bọt ngập quất.', 65000, 75000, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80', 1, 4.9, 20, 1, 1, 420);
INSERT INTO foods (id, category_id, name, description, price, original_price, image, is_available, rating, prep_time, spicy_level, is_featured, sales_count) VALUES (6, 5, 'Gỏi Cuốn Tôm Thịt (3 Cuốn)', 'Tôm sú tươi đỏ au, thịt ba chỉ ngọt mềm, bún và rau thơm cuốn bánh tráng dẻo, chấm sốt tương đậu phộng bùi béo.', 35000, 40000, 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80', 1, 4.6, 10, 0, 0, 176);
INSERT INTO foods (id, category_id, name, description, price, original_price, image, is_available, rating, prep_time, spicy_level, is_featured, sales_count) VALUES (7, 4, 'Trà Sữa Trân Châu Đường Đen Hoàng Gia', 'Sữa tươi thanh trùng Đà Lạt béo ngậy quyện đường đen Okinawa nấu dẻo thơm và trân châu hoàng kim dai giòn sần sật.', 38000, 45000, 'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=800&q=80', 1, 4.8, 8, 0, 1, 630);
INSERT INTO foods (id, category_id, name, description, price, original_price, image, is_available, rating, prep_time, spicy_level, is_featured, sales_count) VALUES (8, 4, 'Trà Đào Cam Sả Tươi Mát', 'Trà lài ủ lạnh thơm nức mũi kết hợp cam vàng mọng nước, sả tươi dập nhẹ và miếng đào giòn ngọt thơm.', 35000, 40000, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80', 1, 4.7, 5, 0, 0, 310);
INSERT INTO foods (id, category_id, name, description, price, original_price, image, is_available, rating, prep_time, spicy_level, is_featured, sales_count) VALUES (9, 4, 'Cà Phê Muối Xứ Huế', 'Cà phê phin Robusta Đắk Lắk đậm đà hòa quyện lớp kem muối biển sánh mịn bồng bềnh, ngọt ngào vị béo lẫn mằn mặn đặc trưng.', 29000, 35000, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80', 1, 4.9, 5, 0, 1, 480);
INSERT INTO foods (id, category_id, name, description, price, original_price, image, is_available, rating, prep_time, spicy_level, is_featured, sales_count) VALUES (10, 1, 'Mì Quảng Tôm Thịt Trứng Cút', 'Sợi mì vàng óng dai mềm, tôm rim đậm vị, thịt heo mềm ngọt, đậu phộng rang giòn rụm và bánh tráng mè nướng giòn.', 52000, 58000, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80', 1, 4.8, 18, 1, 0, 145);
INSERT INTO foods (id, category_id, name, description, price, original_price, image, is_available, rating, prep_time, spicy_level, is_featured, sales_count) VALUES (11, 5, 'Bánh Tráng Trộn Long An Siêu Topping', 'Bánh tráng dẻo thấm sốt me bò cay, xoài băm, trứng cút lòng đào, khô bò đen, hành phi giòn và rau răm cay nồng.', 25000, 30000, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80', 1, 4.7, 10, 2, 0, 390);
INSERT INTO foods (id, category_id, name, description, price, original_price, image, is_available, rating, prep_time, spicy_level, is_featured, sales_count) VALUES (12, 6, 'Chè Khúc Bạch Hạnh Nhân Thanh Mát', 'Từng viên khúc bạch phô mai sữa béo ngậy mềm tan trong miệng, ăn cùng nhãn lồng mọng nước, hạnh nhân rang vàng giòn.', 32000, 38000, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80', 1, 4.8, 5, 0, 0, 215);
INSERT INTO foods (id, category_id, name, description, price, original_price, image, is_available, rating, prep_time, spicy_level, is_featured, sales_count) VALUES (13, 2, 'MÌ IDOME', 'ngon', 300000, 250000, 'https://mms.img.susercontent.com/vn-11134513-7ras8-mceemkpkyouq39@resize_ss1242x600!@crop_w1242_h600_cT', 1, 5, 15, 1, 0, 0);

