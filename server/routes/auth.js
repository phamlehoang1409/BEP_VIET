const express = require('express');
const router = express.Router();
const { query, queryOne, run } = require('../db/database');

// Vietnamese phone number validation regex
// Starts with 0 or +84, followed by 3, 5, 7, 8, 9, followed by 8 digits (total 10 digits)
const VN_PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

function normalizePhone(phone) {
  if (!phone) return '';
  let cleaned = phone.trim().replace(/\s+/g, '').replace(/-/g, '');
  if (cleaned.startsWith('+84')) {
    cleaned = '0' + cleaned.slice(3);
  }
  return cleaned;
}

// Request OTP simulation
router.post('/request-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Vui lòng nhập số điện thoại' });
  }

  const normalized = normalizePhone(phone);
  if (!VN_PHONE_REGEX.test(normalized)) {
    return res.status(400).json({
      error: 'Số điện thoại không hợp lệ! Vui lòng nhập số điện thoại Việt Nam 10 số (bắt đầu bằng 03, 05, 07, 08, 09).'
    });
  }

  // Pre-fixed demo OTP or 6-digit random
  const demoOtp = '123456';

  return res.json({
    success: true,
    phone: normalized,
    otp: demoOtp,
    message: `Mã OTP xác thực đã được gửi tới số ${normalized} (Mã thử nghiệm: 123456)`
  });
});

// Verify OTP & Login / Register
router.post('/verify-otp', (req, res) => {
  const { phone, otp, name } = req.body;
  const normalized = normalizePhone(phone);

  if (!normalized || !VN_PHONE_REGEX.test(normalized)) {
    return res.status(400).json({ error: 'Số điện thoại không hợp lệ.' });
  }

  if (otp !== '123456') {
    return res.status(400).json({ error: 'Mã OTP không chính xác! Vui lòng nhập 123456.' });
  }

  // Check if user exists
  let user = queryOne('SELECT * FROM users WHERE phone = ?', [normalized]);

  if (!user) {
    // Auto register customer
    const userName = name && name.trim() ? name.trim() : `Khách hàng ${normalized.slice(-4)}`;
    const result = run(
      'INSERT INTO users (phone, name, role) VALUES (?, ?, ?)',
      [normalized, userName, 'customer']
    );
    user = queryOne('SELECT * FROM users WHERE id = ?', [Number(result.lastInsertRowid)]);
  }

  return res.json({
    success: true,
    user,
    message: 'Đăng nhập thành công!'
  });
});

// Admin login with required password 14092006
router.post('/admin-login', (req, res) => {
  const { passcode } = req.body;

  if (!passcode) {
    return res.status(400).json({ error: 'Vui lòng nhập mật khẩu quản trị viên!' });
  }

  // Exact password check: 14092006
  if (passcode !== '14092006') {
    return res.status(401).json({ error: 'Mật khẩu quản trị viên không chính xác! Vui lòng nhập đúng mật khẩu.' });
  }

  let adminUser = queryOne('SELECT * FROM users WHERE role = ? LIMIT 1', ['admin']);
  if (!adminUser) {
    const resAdmin = run(
      'INSERT INTO users (phone, name, role) VALUES (?, ?, ?)',
      ['0909999999', 'Quản Trị Viên Bếp Việt', 'admin']
    );
    adminUser = queryOne('SELECT * FROM users WHERE id = ?', [Number(resAdmin.lastInsertRowid)]);
  }

  return res.json({
    success: true,
    user: adminUser,
    token: 'admin-authenticated-token-14092006',
    message: 'Đăng nhập trang Quản Trị thành công!'
  });
});

// Update Profile & Address
router.put('/profile', (req, res) => {
  const { phone, name, address, province, district, ward } = req.body;
  const normalized = normalizePhone(phone);

  if (!normalized) {
    return res.status(400).json({ error: 'Thiếu số điện thoại' });
  }

  run(
    `UPDATE users
     SET name = COALESCE(?, name),
         address = COALESCE(?, address),
         province = COALESCE(?, province),
         district = COALESCE(?, district),
         ward = COALESCE(?, ward)
     WHERE phone = ?`,
    [name, address, province, district, ward, normalized]
  );

  const updatedUser = queryOne('SELECT * FROM users WHERE phone = ?', [normalized]);
  return res.json({ success: true, user: updatedUser });
});

// Get user profile by phone
router.get('/:phone', (req, res) => {
  const normalized = normalizePhone(req.params.phone);
  const user = queryOne('SELECT * FROM users WHERE phone = ?', [normalized]);
  if (!user) {
    return res.status(404).json({ error: 'Không tìm thấy người dùng' });
  }
  return res.json({ success: true, user });
});

module.exports = router;
