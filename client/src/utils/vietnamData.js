// Vietnamese Phone & Address Data and Validation Utilities

export const VIETNAM_PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

/**
 * Validates a Vietnamese phone number
 * @param {string} phone
 * @returns {{ isValid: boolean, error?: string, normalized?: string }}
 */
export function validateVietnamPhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, error: 'Vui lòng nhập số điện thoại' };
  }

  let cleaned = phone.trim().replace(/\s+/g, '').replace(/-/g, '');
  if (cleaned.startsWith('+84')) {
    cleaned = '0' + cleaned.slice(3);
  }

  if (cleaned.length !== 10) {
    return {
      isValid: false,
      error: `Số điện thoại phải gồm đúng 10 chữ số (hiện tại: ${cleaned.length} số)`
    };
  }

  if (!VIETNAM_PHONE_REGEX.test(cleaned)) {
    return {
      isValid: false,
      error: 'Đầu số không hợp lệ! Số điện thoại Việt Nam bắt đầu bằng 03, 05, 07, 08, hoặc 09.'
    };
  }

  return { isValid: true, normalized: cleaned };
}

/**
 * Formats a number to Vietnamese Dong currency (e.g. 55000 -> 55.000 ₫)
 * @param {number} amount
 * @returns {string}
 */
export function formatVND(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount);
}

// Priority Delivery Scope: Nội thành Hà Nội
export const VIETNAM_PROVINCES = [
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'Bắc Ninh',
  'Hải Dương',
  'Hưng Yên',
  'Quảng Ninh',
  'Vĩnh Phúc'
];

export const HANOI_INNER_DISTRICTS = [
  'Quận Hoàn Kiếm',
  'Quận Ba Đình',
  'Quận Đống Đa',
  'Quận Cầu Giấy',
  'Quận Hai Bà Trưng',
  'Quận Thanh Xuân',
  'Quận Tây Hồ',
  'Quận Nam Từ Liêm',
  'Quận Bắc Từ Liêm',
  'Quận Hà Đông',
  'Quận Hoàng Mai',
  'Quận Long Biên'
];

export const HANOI_DISTRICT_WARDS = {
  'Quận Hoàn Kiếm': ['Phường Hàng Bạc', 'Phường Hàng Đào', 'Phường Hàng Gai', 'Phường Tràng Tiền', 'Phường Lý Thái Tổ', 'Phường Phan Chu Trinh', 'Phường Hàng Mã', 'Phường Cửa Đông', 'Phường Cửa Nam', 'Phường Đồng Xuân'],
  'Quận Ba Đình': ['Phường Kim Mã', 'Phường Giảng Võ', 'Phường Đội Cấn', 'Phường Liễu Giai', 'Phường Ngọc Hà', 'Phường Quán Thánh', 'Phường Trúc Bạch', 'Phường Thành Công', 'Phường Cống Vị', 'Phường Điện Biên'],
  'Quận Đống Đa': ['Phường Ô Chợ Dừa', 'Phường Láng Hạ', 'Phường Láng Thượng', 'Phường Cát Linh', 'Phường Văn Miếu', 'Phường Nam Đồng', 'Phường Khâm Thiên', 'Phường Quang Trung', 'Phường Kim Liên'],
  'Quận Cầu Giấy': ['Phường Dịch Vọng', 'Phường Dịch Vọng Hậu', 'Phường Mai Dịch', 'Phường Nghĩa Đô', 'Phường Nghĩa Tân', 'Phường Quan Hoa', 'Phường Trung Hòa', 'Phường Yên Hòa'],
  'Quận Hai Bà Trưng': ['Phường Bách Khoa', 'Phường Bạch Đằng', 'Phường Bạch Mai', 'Phường Cầu Dền', 'Phường Đồng Tâm', 'Phường Lê Đại Hành', 'Phường Minh Khai', 'Phường Phố Huế', 'Phường Thanh Nhàn', 'Phường Vĩnh Tuy'],
  'Quận Thanh Xuân': ['Phường Khương Mai', 'Phường Khương Trung', 'Phường Khương Đình', 'Phường Thanh Xuân Bắc', 'Phường Thanh Xuân Nam', 'Phường Thanh Xuân Trung', 'Phường Nhân Chính', 'Phường Phương Liệt'],
  'Quận Tây Hồ': ['Phường Bưởi', 'Phường Thụy Khuê', 'Phường Yên Phụ', 'Phường Tứ Liên', 'Phường Quảng An', 'Phường Nhật Tân', 'Phường Xuân La', 'Phường Phú Thượng'],
  'Quận Nam Từ Liêm': ['Phường Mỹ Đình 1', 'Phường Mỹ Đình 2', 'Phường Mễ Trì', 'Phường Phú Đô', 'Phường Cầu Diễn', 'Phường Trung Văn'],
  'Quận Bắc Từ Liêm': ['Phường Cổ Nhuế 1', 'Phường Cổ Nhuế 2', 'Phường Đông Ngạc', 'Phường Xuân Đỉnh', 'Phường Phúc Diễn'],
  'Quận Hà Đông': ['Phường Quang Trung', 'Phường Yết Kiêu', 'Phường Nguyễn Trãi', 'Phường Văn Quán', 'Phường Mộ Lao', 'Phường La Khê', 'Phường Vạn Phúc'],
  'Quận Hoàng Mai': ['Phường Hoàng Liệt', 'Phường Định Công', 'Phường Giáp Bát', 'Phường Thịnh Liệt', 'Phường Tương Mai', 'Phường Mai Động', 'Phường Vĩnh Hưng'],
  'Quận Long Biên': ['Phường Bồ Đề', 'Phường Gia Thụy', 'Phường Ngọc Lâm', 'Phường Long Biên', 'Phường Thượng Thanh']
};

// Popular Districts mapped to main cities
export const CITY_DISTRICTS = {
  'Hà Nội': HANOI_INNER_DISTRICTS,
  'TP. Hồ Chí Minh': [
    'Quận 1', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 7', 'Quận 10', 'TP. Thủ Đức', 'Quận Bình Thạnh'
  ],
  'Đà Nẵng': [
    'Quận Hải Châu', 'Quận Thanh Khê', 'Quận Sơn Trà', 'Quận Ngũ Hành Sơn'
  ],
  'Hải Phòng': [
    'Quận Hồng Bàng', 'Quận Ngô Quyền', 'Quận Lê Chân', 'Quận Hải An'
  ]
};

/**
 * Validates complete delivery address
 * @param {string} streetAddress
 * @param {string} province
 * @param {string} district
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateDeliveryAddress(streetAddress, province, district) {
  if (!streetAddress || streetAddress.trim().length < 6) {
    return {
      isValid: false,
      error: 'Vui lòng nhập số nhà, tên đường cụ thể (tối thiểu 6 ký tự) để giao hàng nhanh chóng!'
    };
  }

  if (!province) {
    return {
      isValid: false,
      error: 'Vui lòng chọn Tỉnh / Thành phố nhận hàng'
    };
  }

  if (!district) {
    return {
      isValid: false,
      error: 'Vui lòng chọn Quận / Huyện nhận hàng'
    };
  }

  return { isValid: true };
}
