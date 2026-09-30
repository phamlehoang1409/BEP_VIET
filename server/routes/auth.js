const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

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
router.post('/request-otp', async (req, res) => {
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

  // Check if this phone number already has an account
  let isExistingUser = false;
  let existingName = '';
  if (supabase) {
    try {
      const { data: existing } = await supabase
        .from('users')
        .select('name, role')
        .eq('phone', normalized)
        .neq('role', 'store_settings')
        .maybeSingle();
      if (existing && existing.name) {
        isExistingUser = true;
        existingName = existing.name;
      }
    } catch (e) {}
  }

  // Pre-fixed demo OTP
  const demoOtp = '123456';

  return res.json({
    success: true,
    phone: normalized,
    otp: demoOtp,
    isExistingUser,
    existingName,
    message: isExistingUser
      ? `Chào mừng ${existingName} quay trở lại! Mã OTP: 123456`
      : `Mã OTP xác thực đã được gửi tới số ${normalized} (Mã thử nghiệm: 123456)`
  });
});

// Verify OTP & Login / Register
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp, name } = req.body;
    const normalized = normalizePhone(phone);

    if (!normalized || !VN_PHONE_REGEX.test(normalized)) {
      return res.status(400).json({ error: 'Số điện thoại không hợp lệ.' });
    }

    if (otp !== '123456') {
      return res.status(400).json({ error: 'Mã OTP không chính xác! Vui lòng nhập 123456.' });
    }

    // Check if user exists in Supabase
    let user = null;
    const cleanName = name && typeof name === 'string' ? name.trim() : '';

    if (supabase) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('phone', normalized)
        .maybeSingle();

      if (existingUser) {
        if (cleanName && cleanName !== existingUser.name) {
          const { data: updated } = await supabase
            .from('users')
            .update({ name: cleanName })
            .eq('phone', normalized)
            .select()
            .maybeSingle();
          user = updated || { ...existingUser, name: cleanName };
        } else {
          user = existingUser;
        }
      } else {
        const userName = cleanName || `Khách hàng ${normalized.slice(-4)}`;
        const { data: newUser, error: insertErr } = await supabase
          .from('users')
          .insert({
            phone: normalized,
            name: userName,
            role: 'customer'
          })
          .select()
          .single();

        if (!insertErr && newUser) {
          user = newUser;
        }
      }
    }

    // Fallback if DB unavailable
    if (!user) {
      user = {
        id: Date.now(),
        phone: normalized,
        name: cleanName || `Khách hàng ${normalized.slice(-4)}`,
        role: 'customer'
      };
    }

    return res.json({
      success: true,
      user,
      message: 'Đăng nhập thành công!'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

const { generateAdminToken, requireAdmin } = require('../middleware/authMiddleware');

// In-memory rate limiting cho đăng nhập Admin để chống Brute-force
const adminLoginAttempts = new Map(); // ip -> { count, lockedUntil }

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || '127.0.0.1';
}

function checkAdminRateLimit(ip) {
  const now = Date.now();
  const attempt = adminLoginAttempts.get(ip);
  if (attempt && attempt.lockedUntil && attempt.lockedUntil > now) {
    const remainingMinutes = Math.ceil((attempt.lockedUntil - now) / 60000);
    return `Tài khoản quản trị tạm thời bị khóa do nhập sai mật khẩu quá 5 lần. Vui lòng thử lại sau ${remainingMinutes} phút!`;
  }
  return null;
}

function recordAdminFailedAttempt(ip) {
  const now = Date.now();
  const attempt = adminLoginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  attempt.count += 1;
  if (attempt.count >= 5) {
    attempt.lockedUntil = now + 15 * 60 * 1000; // Khóa 15 phút
    attempt.count = 0;
  }
  adminLoginAttempts.set(ip, attempt);
}

function clearAdminFailedAttempts(ip) {
  adminLoginAttempts.delete(ip);
}

// GET verify admin token
router.get('/verify-admin', requireAdmin, (req, res) => {
  return res.json({
    success: true,
    admin: req.admin,
    message: 'Token quản trị viên hợp lệ.'
  });
});

// Admin login with required password 14092006 (Bảo mật tối đa, chống dò mật khẩu)
router.post('/admin-login', async (req, res) => {
  try {
    const clientIp = getClientIp(req);
    const lockMessage = checkAdminRateLimit(clientIp);
    if (lockMessage) {
      return res.status(429).json({ error: lockMessage });
    }

    const { passcode } = req.body;

    if (!passcode) {
      return res.status(400).json({ error: 'Vui lòng nhập mật khẩu quản trị viên!' });
    }

    // Exact password check: 14092006
    if (passcode !== '14092006') {
      recordAdminFailedAttempt(clientIp);
      const attempt = adminLoginAttempts.get(clientIp);
      const remainingAttempts = 5 - (attempt?.count || 0);
      return res.status(401).json({
        error: `Mật khẩu quản trị viên không chính xác! (Còn ${remainingAttempts > 0 ? remainingAttempts : 0} lần thử trước khi bị khóa tạm thời 15 phút)`
      });
    }

    // Đăng nhập thành công -> Xóa bộ đếm lỗi
    clearAdminFailedAttempts(clientIp);

    let adminUser = null;
    if (supabase) {
      try {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'admin')
          .maybeSingle();
        adminUser = data;
      } catch (err) {
        console.warn('Supabase query error:', err.message);
      }
    }

    if (!adminUser) {
      adminUser = {
        id: 1,
        phone: '0353859726',
        name: 'Quản Trị Viên Bếp Việt',
        role: 'admin'
      };
    }

    // Tạo token HMAC SHA256 an toàn có hạn 7 ngày
    const token = generateAdminToken(adminUser);

    return res.json({
      success: true,
      user: adminUser,
      token,
      message: 'Đăng nhập trang Quản Trị thành công!'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Update Profile & Address
router.put('/profile', async (req, res) => {
  try {
    const { phone, name, address, province, district, ward } = req.body;
    const normalized = normalizePhone(phone);

    if (!normalized) {
      return res.status(400).json({ error: 'Thiếu số điện thoại' });
    }

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (address !== undefined) updateFields.address = address;
    if (province !== undefined) updateFields.province = province;
    if (district !== undefined) updateFields.district = district;
    if (ward !== undefined) updateFields.ward = ward;

    if (supabase) {
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update(updateFields)
        .eq('phone', normalized)
        .select()
        .maybeSingle();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.json({ success: true, user: updatedUser });
    }

    return res.json({
      success: true,
      user: { phone: normalized, ...updateFields }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get user profile by phone
router.get('/:phone', async (req, res) => {
  try {
    const normalized = normalizePhone(req.params.phone);
    if (!normalized) {
      return res.status(400).json({ error: 'Số điện thoại không hợp lệ' });
    }

    if (supabase) {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone', normalized)
        .maybeSingle();

      if (error || !user) {
        return res.status(404).json({ error: 'Không tìm thấy người dùng' });
      }
      return res.json({ success: true, user });
    }

    return res.status(404).json({ error: 'Không tìm thấy người dùng' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
