const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'food_delivery.db');
const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables
function initDb() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);

  // Check if categories need seeding
  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (catCount.count === 0) {
    seedData();
  }
}

function seedData() {
  console.log('🌱 Seeding initial delicious food data...');

  // Seed Categories
  const insertCat = db.prepare(`
    INSERT INTO categories (id, name, slug, icon, display_order)
    VALUES (?, ?, ?, ?, ?)
  `);

  const categories = [
    [1, 'Cơm & Món Chính', 'com-mon-chinh', 'Utensils', 1],
    [2, 'Phở, Bún & Mì', 'pho-bun-mi', 'Soup', 2],
    [3, 'Bánh Mì & Ăn Sáng', 'banh-mi-an-sang', 'Sandwich', 3],
    [4, 'Đồ Uống & Trà Sữa', 'do-uong-tra-sua', 'CupSoda', 4],
    [5, 'Ăn Vặt & Khai Vị', 'an-vat-khai-vi', 'Cookie', 5],
    [6, 'Tráng Miệng & Chè', 'trang-mieng-che', 'IceCream', 6]
  ];

  for (const cat of categories) {
    insertCat.run(...cat);
  }

  // Seed Foods
  const insertFood = db.prepare(`
    INSERT INTO foods (
      category_id, name, description, price, original_price,
      image, is_available, rating, prep_time, spicy_level, is_featured, sales_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const foods = [
    [
      2,
      'Phở Bò Tái Lăn Hà Nội',
      'Thịt bò tươi xào lăn thơm phức tỏi gừng, nước dùng hầm xương 12 tiếng ngọt thanh đậm đà, ăn kèm quẩy giòn tan và ớt chưng gia truyền.',
      55000,
      65000,
      'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80',
      1,
      4.9,
      15,
      1,
      1,
      342
    ],
    [
      2,
      'Bún Chả Nem Cua Bể Phố Cổ',
      'Chả thịt nướng than hoa thơm lừng quyện nước mắm chua ngọt chuẩn vị Bắc, kèm nem cua bể giòn rụm và rau sống tươi mát.',
      60000,
      70000,
      'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=800&q=80',
      1,
      4.8,
      20,
      0,
      1,
      289
    ],
    [
      1,
      'Cơm Tấm Sườn Bì Chả Đặc Biệt',
      'Hạt gạo tấm thơm dẻo, sườn cốt lết ướp mật ong nướng vàng ươm, chả trứng béo ngậy, bì giòn thơm và mỡ hành tóp mỡ rưới đẫm.',
      58000,
      65000,
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      1,
      4.9,
      15,
      0,
      1,
      512
    ],
    [
      3,
      'Bánh Mì Chảo Xíu Mại Pate Trứng',
      'Chảo nóng sốt xì xèo với viên xíu mại mềm thơm, pate gan béo ngậy, trứng ốp la lòng đào, xúc xích và bánh mì giòn rụm.',
      45000,
      50000,
      'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
      1,
      4.7,
      12,
      1,
      1,
      198
    ],
    [
      5,
      'Bún Đậu Mắm Tôm Thập Cẩm',
      'Đậu mơ rán giòn vỏ mềm ruột, thịt bắp luộc, chả cốm nóng hổi, nem rán giòn tan chấm cùng mắm tôm Thanh Hóa đánh sủi bọt ngập quất.',
      65000,
      75000,
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
      1,
      4.9,
      20,
      1,
      1,
      420
    ],
    [
      5,
      'Gỏi Cuốn Tôm Thịt (3 Cuốn)',
      'Tôm sú tươi đỏ au, thịt ba chỉ ngọt mềm, bún và rau thơm cuốn bánh tráng dẻo, chấm sốt tương đậu phộng bùi béo.',
      35000,
      40000,
      'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
      1,
      4.6,
      10,
      0,
      0,
      176
    ],
    [
      4,
      'Trà Sữa Trân Châu Đường Đen Hoàng Gia',
      'Sữa tươi thanh trùng Đà Lạt béo ngậy quyện đường đen Okinawa nấu dẻo thơm và trân châu hoàng kim dai giòn sần sật.',
      38000,
      45000,
      'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=800&q=80',
      1,
      4.8,
      8,
      0,
      1,
      630
    ],
    [
      4,
      'Trà Đào Cam Sả Tươi Mát',
      'Trà lài ủ lạnh thơm nức mũi kết hợp cam vàng mọng nước, sả tươi dập nhẹ và miếng đào giòn ngọt thơm.',
      35000,
      40000,
      'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
      1,
      4.7,
      5,
      0,
      0,
      310
    ],
    [
      4,
      'Cà Phê Muối Xứ Huế',
      'Cà phê phin Robusta Đắk Lắk đậm đà hòa quyện lớp kem muối biển sánh mịn bồng bềnh, ngọt ngào vị béo lẫn mằn mặn đặc trưng.',
      29000,
      35000,
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
      1,
      4.9,
      5,
      0,
      1,
      480
    ],
    [
      1,
      'Mì Quảng Tôm Thịt Trứng Cút',
      'Sợi mì vàng óng dai mềm, tôm rim đậm vị, thịt heo mềm ngọt, đậu phộng rang giòn rụm và bánh tráng mè nướng giòn.',
      52000,
      58000,
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
      1,
      4.8,
      18,
      1,
      0,
      145
    ],
    [
      5,
      'Bánh Tráng Trộn Long An Siêu Topping',
      'Bánh tráng dẻo thấm sốt me bò cay, xoài băm, trứng cút lòng đào, khô bò đen, hành phi giòn và rau răm cay nồng.',
      25000,
      30000,
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
      1,
      4.7,
      10,
      2,
      0,
      390
    ],
    [
      6,
      'Chè Khúc Bạch Hạnh Nhân Thanh Mát',
      'Từng viên khúc bạch phô mai sữa béo ngậy mềm tan trong miệng, ăn cùng nhãn lồng mọng nước, hạnh nhân rang vàng giòn.',
      32000,
      38000,
      'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
      1,
      4.8,
      5,
      0,
      0,
      215
    ]
  ];

  for (const food of foods) {
    insertFood.run(...food);
  }

  // Seed Admin & Demo Customer User
  const insertUser = db.prepare(`
    INSERT INTO users (phone, name, address, province, district, ward, role)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('0909999999', 'Chủ Quán Bếp Việt', '123 Đường Nguyễn Huệ', 'Hồ Chí Minh', 'Quận 1', 'Phường Bến Nghé', 'admin');
  insertUser.run('0912345678', 'Nguyễn Văn An', '45 Lê Duẩn, Bến Nghé', 'Hồ Chí Minh', 'Quận 1', 'Phường Bến Nghé', 'customer');

  // Seed sample initial orders for admin view
  const insertOrder = db.prepare(`
    INSERT INTO orders (
      order_code, user_id, customer_name, customer_phone, delivery_address,
      province, district, note, subtotal, discount, delivery_fee, total_amount, payment_method, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (order_id, food_id, food_name, food_image, price, quantity, total)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const o1 = insertOrder.run(
    'ORD-2026-001',
    2,
    'Nguyễn Văn An',
    '0912345678',
    '45 Lê Duẩn, Bến Nghé, Quận 1',
    'Hồ Chí Minh',
    'Quận 1',
    'Cho nhiều tương ớt và quẩy giòn nhé quán ơi!',
    110000,
    0,
    15000,
    125000,
    'COD',
    'preparing'
  );

  insertOrderItem.run(
    Number(o1.lastInsertRowid),
    1,
    'Phở Bò Tái Lăn Hà Nội',
    'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80',
    55000,
    2,
    110000
  );

  const o2 = insertOrder.run(
    'ORD-2026-002',
    2,
    'Trần Thị Mai',
    '0988776655',
    '88 Hai Bà Trưng, Tân Định, Quận 1',
    'Hồ Chí Minh',
    'Quận 1',
    'Trà đào ít ngọt 50% đường, đá riêng',
    93000,
    10000,
    15000,
    98000,
    'BANKING',
    'delivering'
  );

  insertOrderItem.run(
    Number(o2.lastInsertRowid),
    3,
    'Cơm Tấm Sườn Bì Chả Đặc Biệt',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    58000,
    1,
    58000
  );
  insertOrderItem.run(
    Number(o2.lastInsertRowid),
    8,
    'Trà Đào Cam Sả Tươi Mát',
    'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
    35000,
    1,
    35000
  );

  // Default store settings
  db.exec(`
    INSERT OR IGNORE INTO store_settings (id, store_name, is_open, hotline, address, banner_message)
    VALUES (1, 'Bếp Việt Gourmet', 1, '1900 6868', '123 Đường Nguyễn Huệ, Quận 1, TP. HCM', 'Chào mừng bạn đến với Bếp Việt - Món ngon chuẩn vị, giao nhanh 20 phút!')
  `);

  console.log('✅ Seeding complete!');
}

initDb();

module.exports = {
  db,
  query: (sql, params = []) => db.prepare(sql).all(...params),
  queryOne: (sql, params = []) => db.prepare(sql).get(...params),
  run: (sql, params = []) => db.prepare(sql).run(...params)
};
