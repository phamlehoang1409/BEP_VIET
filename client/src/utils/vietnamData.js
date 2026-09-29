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

// 63 Provinces / Cities in Vietnam
export const VIETNAM_PROVINCES = [
  'TP. Hồ Chí Minh',
  'Hà Nội',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'An Giang',
  'Bà Rịa - Vũng Tàu',
  'Bắc Giang',
  'Bắc Kạn',
  'Bạc Liêu',
  'Bắc Ninh',
  'Bến Tre',
  'Bình Định',
  'Bình Dương',
  'Bình Phước',
  'Bình Thuận',
  'Cà Mau',
  'Cao Bằng',
  'Đắk Lắk',
  'Đắk Nông',
  'Điện Biên',
  'Đồng Nai',
  'Đồng Tháp',
  'Gia Lai',
  'Hà Giang',
  'Hà Nam',
  'Hà Tĩnh',
  'Hải Dương',
  'Hậu Giang',
  'Hòa Bình',
  'Hưng Yên',
  'Khánh Hòa',
  'Kiên Giang',
  'Kon Tum',
  'Lai Châu',
  'Lâm Đồng',
  'Lạng Sơn',
  'Lào Cai',
  'Long An',
  'Nam Định',
  'Nghệ An',
  'Ninh Bình',
  'Ninh Thuận',
  'Phú Thọ',
  'Phú Yên',
  'Quảng Bình',
  'Quảng Nam',
  'Quảng Ngãi',
  'Quảng Ninh',
  'Quảng Trị',
  'Sóc Trăng',
  'Sơn La',
  'Tây Ninh',
  'Thái Bình',
  'Thái Nguyên',
  'Thanh Hóa',
  'Thừa Thiên Huế',
  'Tiền Giang',
  'Trà Vinh',
  'Tuyên Quang',
  'Vĩnh Long',
  'Vĩnh Phúc',
  'Yên Bái'
];

// Popular Districts mapped to main cities
export const CITY_DISTRICTS = {
  'TP. Hồ Chí Minh': [
    'Quận 1', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8',
    'Quận 10', 'Quận 11', 'Quận 12', 'TP. Thủ Đức', 'Quận Bình Thạnh',
    'Quận Gò Vấp', 'Quận Phú Nhuận', 'Quận Tân Bình', 'Quận Tân Phú',
    'Quận Bình Tân', 'Huyện Bình Chánh', 'Huyện Hóc Môn', 'Huyện Nhà Bè'
  ],
  'Hà Nội': [
    'Quận Ba Đình', 'Quận Hoàn Kiếm', 'Quận Tây Hồ', 'Quận Long Biên',
    'Quận Cầu Giấy', 'Quận Đống Đa', 'Quận Hai Bà Trưng', 'Quận Hoàng Mai',
    'Quận Thanh Xuân', 'Quận Nam Từ Liêm', 'Quận Bắc Từ Liêm', 'Quận Hà Đông'
  ],
  'Đà Nẵng': [
    'Quận Hải Châu', 'Quận Thanh Khê', 'Quận Sơn Trà', 'Quận Ngũ Hành Sơn',
    'Quận Liên Chiểu', 'Quận Cẩm Lệ', 'Huyện Hòa Vang'
  ],
  'Cần Thơ': [
    'Quận Ninh Kiều', 'Quận Bình Thủy', 'Quận Cái Răng', 'Quận Ô Môn', 'Quận Thốt Nốt'
  ],
  'Hải Phòng': [
    'Quận Hồng Bàng', 'Quận Ngô Quyền', 'Quận Lê Chân', 'Quận Hải An', 'Quận Kiến An'
  ],
  'Bình Dương': [
    'TP. Thủ Dầu Một', 'TP. Thuận An', 'TP. Dĩ An', 'TP. Tân Uyên', 'Thị xã Bến Cát'
  ],
  'Đồng Nai': [
    'TP. Biên Hòa', 'TP. Long Khánh', 'Huyện Long Thành', 'Huyện Nhơn Trạch'
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
