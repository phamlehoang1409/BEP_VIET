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
