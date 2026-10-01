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
  'Quận Hà Đông',
  'Quận Đống Đa',
  'Quận Cầu Giấy',
  'Quận Thanh Xuân',
  'Quận Nam Từ Liêm',
  'Quận Bắc Từ Liêm',
  'Quận Ba Đình',
  'Quận Hoàn Kiếm',
  'Quận Hai Bà Trưng',
  'Quận Tây Hồ',
  'Quận Hoàng Mai',
  'Quận Long Biên',
  'Huyện Thanh Trì',
  'Huyện Hoài Đức',
  'Huyện Gia Lâm',
  'Huyện Đông Anh',
  'Huyện Đan Phượng'
];

export const HANOI_DISTRICT_WARDS = {
  'Quận Hà Đông': [
    'Phường Dương Nội',
    'Phường Yên Nghĩa',
    'Phường Mộ Lao',
    'Phường Văn Quán',
    'Phường La Khê',
    'Phường Vạn Phúc',
    'Phường Phúc La (KĐT Xa La)',
    'Phường Kiến Hưng',
    'Phường Hà Cầu',
    'Phường Phú La (KĐT Văn Phú)',
    'Phường Phú Lãm',
    'Phường Phú Lương',
    'Phường Quang Trung',
    'Phường Yết Kiêu',
    'Phường Nguyễn Trãi',
    'Phường Biên Giang',
    'Phường Đồng Mai'
  ],
  'Quận Đống Đa': [
    'Phường Trung Liệt (Thái Hà, Chùa Bộc)',
    'Phường Ô Chợ Dừa (Hoàng Cầu, Hào Nam)',
    'Phường Láng Hạ (Huỳnh Thúc Kháng, Thái Hà)',
    'Phường Láng Thượng (Chùa Láng, Nguyễn Chí Thanh)',
    'Phường Cát Linh (Giảng Võ, Hào Nam)',
    'Phường Văn Miếu (Quốc Tử Giám)',
    'Phường Nam Đồng (Hồ Đắc Di, Xã Đàn)',
    'Phường Khâm Thiên',
    'Phường Quang Trung (Tây Sơn, Chùa Bộc)',
    'Phường Kim Liên (Phạm Ngọc Thạch, Đào Duy Anh)',
    'Phường Ngã Tư Sở (Đường Láng, Trường Chinh)',
    'Phường Khương Thượng (Tôn Thất Tùng, Tam Khương)',
    'Phường Phương Mai (Lương Định Của, Giải Phóng)',
    'Phường Phương Liên (Xã Đàn, Kim Hoa)',
    'Phường Thịnh Quang (Thái Thịnh, Vĩnh Hồ)',
    'Phường Thổ Quan (Khâm Thiên, Đê La Thành)',
    'Phường Hàng Bột (Tôn Đức Thắng, Cát Linh)',
    'Phường Quốc Tử Giám (Tôn Đức Thắng, Văn Miếu)',
    'Phường Trung Phụng (Xã Đàn, Chợ Khâm Thiên)',
    'Phường Trung Tự (Đặng Văn Ngữ, Phạm Ngọc Thạch)',
    'Phường Văn Chương (Hồ Văn Chương, Khâm Thiên)'
  ],
  'Quận Cầu Giấy': [
    'Phường Dịch Vọng',
    'Phường Dịch Vọng Hậu (Duy Tân, Xuân Thủy)',
    'Phường Mai Dịch (Hồ Tùng Mậu, Doãn Kế Thiện)',
    'Phường Nghĩa Đô (Hoàng Quốc Việt)',
    'Phường Nghĩa Tân (Tô Hiệu)',
    'Phường Quan Hoa (Nguyễn Khánh Toàn)',
    'Phường Trung Hòa (Trung Hòa Nhân Chính, Trần Duy Hưng)',
    'Phường Yên Hòa (Vũ Phạm Hàm, Trung Kính)'
  ],
  'Quận Thanh Xuân': [
    'Phường Thượng Đình (Royal City, Nguyễn Trãi)',
    'Phường Nhân Chính (Lê Văn Lương, Hoàng Đạo Thúy)',
    'Phường Khương Đình (Vũ Tông Phan, Bùi Xương Trạch)',
    'Phường Khương Mai (Lê Trọng Tấn, Cù Chính Lan)',
    'Phường Khương Trung (Hoàng Văn Thái, Khương Trung)',
    'Phường Kim Giang (Kim Giang, Hoàng Đạo Thành)',
    'Phường Phương Liệt (Trường Chinh, Giải Phóng)',
    'Phường Thanh Xuân Bắc (Nguyễn Quý Đức, Khuất Duy Tiến)',
    'Phường Thanh Xuân Nam (Triều Khúc, Nguyễn Trãi)',
    'Phường Thanh Xuân Trung (Nguyễn Tuân, Ngụy Như Kon Tum)',
    'Phường Hạ Đình (Khương Đình, Kim Giang)'
  ],
  'Quận Nam Từ Liêm': [
    'Phường Mỹ Đình 1 (Sân vận động Mỹ Đình, The Manor)',
    'Phường Mỹ Đình 2 (Lê Đức Thọ, Nguyễn Hoàng)',
    'Phường Mễ Trì (Keangnam, The Matrix One)',
    'Phường Phú Đô (Lê Quang Đạo, SVĐ Mỹ Đình)',
    'Phường Tây Mỗ (Vinhomes Smart City)',
    'Phường Đại Mỗ (FLC Đại Mỗ, Sa Đôi)',
    'Phường Trung Văn (Tố Hữu, Lương Thế Vinh)',
    'Phường Cầu Diễn (Hồ Tùng Mậu, Hàm Nghi)',
    'Phường Phương Canh (Trịnh Văn Bô)',
    'Phường Xuân Phương (KĐT Vân Canh, Tasco)'
  ],
  'Quận Bắc Từ Liêm': [
    'Phường Cổ Nhuế 1 (Phạm Văn Đồng)',
    'Phường Cổ Nhuế 2 (Học viện Cảnh sát)',
    'Phường Xuân Đỉnh (KĐT Ngoại Giao Đoàn)',
    'Phường Xuân Tảo (KĐT Starlake)',
    'Phường Đông Ngạc (Cầu Thăng Long)',
    'Phường Đức Thắng (ĐH Mỏ Địa chất)',
    'Phường Phúc Diễn (Goldmark City)',
    'Phường Phú Diễn (Ga Phú Diễn)',
    'Phường Minh Khai (ĐH Công Nghiệp)',
    'Phường Tây Tựu (Làng hoa Tây Tựu)',
    'Phường Thượng Cát',
    'Phường Thụy Phương',
    'Phường Liên Mạc'
  ],
  'Quận Ba Đình': [
    'Phường Cống Vị (Lotte Center)',
    'Phường Liễu Giai (Vinhomes Metropolis)',
    'Phường Kim Mã',
    'Phường Giảng Võ (Hồ Giảng Võ)',
    'Phường Đội Cấn',
    'Phường Ngọc Hà (Lăng Bác)',
    'Phường Ngọc Khánh (Hồ Ngọc Khánh)',
    'Phường Thành Công (Hồ Thành Công)',
    'Phường Quán Thánh',
    'Phường Trúc Bạch (Hồ Trúc Bạch)',
    'Phường Điện Biên (Hoàng Diệu, Điện Biên Phủ)',
    'Phường Nguyễn Trung Trực',
    'Phường Phúc Xá',
    'Phường Vĩnh Phúc'
  ],
  'Quận Hoàn Kiếm': [
    'Phường Hàng Bạc (Tạ Hiện, Phố Cổ)',
    'Phường Hàng Đào (Đồng Xuân, Hàng Ngang)',
    'Phường Hàng Gai (Lương Văn Can)',
    'Phường Tràng Tiền (Nhà Hát Lớn, Tràng Tiền Plaza)',
    'Phường Lý Thái Tổ (Hồ Gươm)',
    'Phường Phan Chu Trinh',
    'Phường Trần Hưng Đạo',
    'Phường Hàng Bài',
    'Phường Hàng Bông',
    'Phường Hàng Buồm',
    'Phường Hàng Bồ',
    'Phường Hàng Mã',
    'Phường Hàng Trống',
    'Phường Cửa Đông',
    'Phường Cửa Nam',
    'Phường Đồng Xuân',
    'Phường Chương Dương',
    'Phường Phúc Tân'
  ],
  'Quận Hai Bà Trưng': [
    'Phường Bách Khoa (Đại học Bách Khoa)',
    'Phường Đồng Tâm (Đại học KTQD)',
    'Phường Vĩnh Tuy (Vinhomes Times City)',
    'Phường Minh Khai (Hinode City)',
    'Phường Lê Đại Hành (Vincom Bà Triệu)',
    'Phường Phố Huế',
    'Phường Bạch Mai',
    'Phường Thanh Nhàn',
    'Phường Bạch Đằng (Bệnh viện 108)',
    'Phường Cầu Dền',
    'Phường Đống Mác',
    'Phường Đồng Nhân',
    'Phường Ngô Thì Nhậm',
    'Phường Nguyễn Du (Hồ Thiền Quang)',
    'Phường Phạm Đình Hổ',
    'Phường Quỳnh Lôi',
    'Phường Quỳnh Mai',
    'Phường Thanh Lương'
  ],
  'Quận Tây Hồ': [
    'Phường Quảng An (Phủ Tây Hồ, Xuân Diệu)',
    'Phường Nhật Tân (Công viên Nước Hồ Tây, Lotte Tây Hồ)',
    'Phường Thụy Khuê',
    'Phường Bưởi (Hoàng Hoa Thám)',
    'Phường Yên Phụ (Đường Thanh Niên)',
    'Phường Tứ Liên',
    'Phường Xuân La (Võ Chí Công)',
    'Phường Phú Thượng (Ciputra, Cầu Nhật Tân)'
  ],
  'Quận Hoàng Mai': [
    'Phường Hoàng Liệt (Bán đảo Linh Đàm)',
    'Phường Định Công (KĐT Định Công)',
    'Phường Đại Kim (KĐT Đại Kim, Kim Văn Kim Lũ)',
    'Phường Giáp Bát (Bến xe Giáp Bát)',
    'Phường Thịnh Liệt (Giải Phóng)',
    'Phường Tương Mai (Trương Định)',
    'Phường Mai Động (Hoàng Mai)',
    'Phường Tân Mai',
    'Phường Vĩnh Hưng',
    'Phường Thanh Trì',
    'Phường Hoàng Văn Thụ',
    'Phường Lĩnh Nam',
    'Phường Trần Phú',
    'Phường Yên Sở (Công viên Yên Sở)'
  ],
  'Quận Long Biên': [
    'Phường Long Biên (Aeon Mall Long Biên)',
    'Phường Bồ Đề (Cầu Chương Dương)',
    'Phường Ngọc Lâm (Cầu Long Biên)',
    'Phường Ngọc Thụy (Mipec Riverside)',
    'Phường Gia Thụy (Nguyễn Văn Cừ)',
    'Phường Thượng Thanh',
    'Phường Việt Hưng (Vinhomes Riverside)',
    'Phường Phúc Đồng',
    'Phường Phúc Lợi',
    'Phường Sài Đồng',
    'Phường Thạch Bàn',
    'Phường Đức Giang',
    'Phường Giang Biên',
    'Phường Cự Khối'
  ],
  'Huyện Thanh Trì': [
    'Thị trấn Văn Điển',
    'Xã Tân Triều (Triều Khúc, KĐT Tổng Cục 5)',
    'Xã Thanh Liệt (The Manor Central Park)',
    'Xã Tam Hiệp',
    'Xã Tứ Hiệp',
    'Xã Ngũ Hiệp',
    'Xã Ngọc Hồi',
    'Xã Vĩnh Quỳnh',
    'Xã Tả Thanh Oai (Cầu Bươu)',
    'Xã Hữu Hòa',
    'Xã Đại Áng',
    'Xã Liên Ninh',
    'Xã Đông Mỹ',
    'Xã Duyên Hà',
    'Xã Vạn Phúc',
    'Xã Yên Mỹ'
  ],
  'Huyện Hoài Đức': [
    'Thị trấn Trạm Trôi',
    'Xã An Khánh (Vinhomes Thăng Long, Splendora)',
    'Xã Vân Canh (KĐT Vân Canh)',
    'Xã Kim Chung (KĐT Hinode Royal Park)',
    'Xã La Phù (Giáp Hà Đông)',
    'Xã Đông La (Giáp Hà Đông)',
    'Xã Di Trạch',
    'Xã Lại Yên',
    'Xã Song Phương',
    'Xã An Thượng',
    'Xã Tiền Yên',
    'Xã Đắc Sở',
    'Xã Cát Quế',
    'Xã Dương Liễu',
    'Xã Đồng Tháp',
    'Xã Yên Sở'
  ],
  'Huyện Gia Lâm': [
    'Thị trấn Trâu Quỳ (Học viện Nông Nghiệp)',
    'Xã Đa Tốn (Vinhomes Ocean Park)',
    'Xã Kiêu Kỵ (Vinhomes Ocean Park)',
    'Xã Bát Tràng (Làng gốm Bát Tràng)',
    'Xã Đặng Xá (KĐT Đặng Xá)',
    'Xã Cổ Bi',
    'Xã Ninh Hiệp (Chợ Ninh Hiệp)',
    'Thị trấn Yên Viên',
    'Xã Yên Thường',
    'Xã Dương Xá',
    'Xã Phú Thị'
  ],
  'Huyện Đông Anh': [
    'Thị trấn Đông Anh',
    'Xã Vĩnh Ngọc (Chân cầu Nhật Tân)',
    'Xã Hải Bối (Chân cầu Thăng Long)',
    'Xã Kim Chung (KCN Thăng Long)',
    'Xã Tiên Dương',
    'Xã Uy Nỗ',
    'Xã Cổ Loa (Thành Cổ Loa)',
    'Xã Đông Hội (Cầu Đông Trù)',
    'Xã Mai Lâm',
    'Xã Nam Hồng'
  ],
  'Huyện Đan Phượng': [
    'Thị trấn Phùng',
    'Xã Tân Hội (KĐT Vinhomes Đan Phượng)',
    'Xã Tân Lập',
    'Xã Đan Phượng',
    'Xã Đồng Tháp',
    'Xã Song Phượng',
    'Xã Thượng Mỗ',
    'Xã Hạ Mỗ',
    'Xã Hồng Hà',
    'Xã Liên Hà'
  ]
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

// List of popular, verified locations & landmarks in Hanoi for instant autocomplete
export const HANOI_POPULAR_LOCATIONS = [
  { name: 'Phố Thái Hà', address: 'Phố Thái Hà', district: 'Quận Đống Đa', ward: 'Phường Trung Liệt (Thái Hà, Chùa Bộc)', type: 'Tuyến phố trung tâm' },
  { name: 'Khu đô thị Dương Nội', address: 'Đường Tố Hữu, Dương Nội', district: 'Quận Hà Đông', ward: 'Phường Dương Nội', type: 'Khu đô thị' },
  { name: 'Bến xe Yên Nghĩa', address: 'Quốc lộ 6, Yên Nghĩa', district: 'Quận Hà Đông', ward: 'Phường Yên Nghĩa', type: 'Bến xe khách' },
  { name: 'Khu đô thị Đô Nghĩa (Yên Nghĩa)', address: 'Đường Yên Lộ, Yên Nghĩa', district: 'Quận Hà Đông', ward: 'Phường Yên Nghĩa', type: 'Khu đô thị' },
  { name: 'Phố Chùa Bộc', address: 'Phố Chùa Bộc', district: 'Quận Đống Đa', ward: 'Phường Trung Liệt (Thái Hà, Chùa Bộc)', type: 'Tuyến phố mua sắm' },
  { name: 'Phố Thái Thịnh', address: 'Phố Thái Thịnh', district: 'Quận Đống Đa', ward: 'Phường Thịnh Quang (Thái Thịnh, Vĩnh Hồ)', type: 'Tuyến phố ẩm thực' },
  { name: 'Đường Huỳnh Thúc Kháng', address: 'Huỳnh Thúc Kháng', district: 'Quận Đống Đa', ward: 'Phường Láng Hạ (Huỳnh Thúc Kháng, Thái Hà)', type: 'Tuyến phố văn phòng' },
  { name: 'Đường Hoàng Cầu', address: 'Hoàng Cầu', district: 'Quận Đống Đa', ward: 'Phường Ô Chợ Dừa (Hoàng Cầu, Hào Nam)', type: 'Tuyến phố trung tâm' },
  { name: 'Đường Xã Đàn', address: 'Xã Đàn', district: 'Quận Đống Đa', ward: 'Phường Nam Đồng (Hồ Đắc Di, Xã Đàn)', type: 'Tuyến đường huyết mạch' },
  { name: 'Khu đô thị Xa La', address: 'Đường Phúc La, Phúc La', district: 'Quận Hà Đông', ward: 'Phường Phúc La (KĐT Xa La)', type: 'Khu đô thị' },
  { name: 'Khu đô thị Văn Phú', address: 'Đường Quang Trung, Phú La', district: 'Quận Hà Đông', ward: 'Phường Phú La (KĐT Văn Phú)', type: 'Khu đô thị' },
  { name: 'Khu đô thị Mộ Lao (Làng Việt Kiều)', address: 'Đường Nguyễn Văn Lộc, Mộ Lao', district: 'Quận Hà Đông', ward: 'Phường Mộ Lao', type: 'Khu đô thị' },
  { name: 'Khu đô thị Văn Quán', address: 'Đường Nguyễn Khuyến, Văn Quán', district: 'Quận Hà Đông', ward: 'Phường Văn Quán', type: 'Khu đô thị' },
  { name: 'Khu đô thị ParkCity Hanoi', address: 'Đường Lê Trọng Tấn, La Khê', district: 'Quận Hà Đông', ward: 'Phường La Khê', type: 'Khu đô thị cao cấp' },
  { name: 'Làng Lụa Vạn Phúc', address: 'Phố Lụa, Vạn Phúc', district: 'Quận Hà Đông', ward: 'Phường Vạn Phúc', type: 'Làng nghề truyền thống' },
  { name: 'Aeon Mall Hà Đông', address: 'Khu đô thị Dương Nội', district: 'Quận Hà Đông', ward: 'Phường Dương Nội', type: 'Đại siêu thị' },
  { name: 'Tòa nhà Keangnam Landmark 72', address: 'Phạm Hùng', district: 'Quận Nam Từ Liêm', ward: 'Phường Mễ Trì', type: 'Tòa nhà văn phòng' },
  { name: 'Tòa nhà Lotte Center Hà Nội', address: '54 Liễu Giai', district: 'Quận Ba Đình', ward: 'Phường Cống Vị', type: 'Trung tâm thương mại' },
  { name: 'Vinhomes Metropolis Liễu Giai', address: '29 Liễu Giai', district: 'Quận Ba Đình', ward: 'Phường Liễu Giai', type: 'Khu căn hộ cao cấp' },
  { name: 'Vinhomes Times City', address: '458 Minh Khai', district: 'Quận Hai Bà Trưng', ward: 'Phường Vĩnh Tuy', type: 'Khu đô thị' },
  { name: 'Vinhomes Royal City', address: '72A Nguyễn Trãi', district: 'Quận Thanh Xuân', ward: 'Phường Thượng Đình', type: 'Khu đô thị' },
  { name: 'Vinhomes Smart City', address: 'Tây Mỗ', district: 'Quận Nam Từ Liêm', ward: 'Phường Trung Văn', type: 'Đại đô thị' },
  { name: 'Vinhomes D\'Capitale', address: '119 Trần Duy Hưng', district: 'Quận Cầu Giấy', ward: 'Phường Trung Hòa', type: 'Khu căn hộ' },
  { name: 'Vincom Center Bà Triệu', address: '191 Bà Triệu', district: 'Quận Hai Bà Trưng', ward: 'Phường Lê Đại Hành', type: 'Trung tâm thương mại' },
  { name: 'Vincom Center Phạm Ngọc Thạch', address: '2 Phạm Ngọc Thạch', district: 'Quận Đống Đa', ward: 'Phường Kim Liên', type: 'Trung tâm thương mại' },
  { name: 'Vincom Mega Mall Smart City', address: 'Tây Mỗ', district: 'Quận Nam Từ Liêm', ward: 'Phường Phú Đô', type: 'Trung tâm thương mại' },
  { name: 'Indochina Plaza Hanoi (IPH)', address: '241 Xuân Thủy', district: 'Quận Cầu Giấy', ward: 'Phường Dịch Vọng Hậu', type: 'Tòa nhà phức hợp' },
  { name: 'Tràng Tiền Plaza', address: '24 Hai Bà Trưng', district: 'Quận Hoàn Kiếm', ward: 'Phường Tràng Tiền', type: 'Trung tâm thương mại' },
  { name: 'Aeon Mall Long Biên', address: '27 Cổ Linh', district: 'Quận Long Biên', ward: 'Phường Long Biên', type: 'Đại siêu thị' },
  { name: 'Aeon Mall Hà Đông', address: 'Khu đô thị Dương Nội', district: 'Quận Hà Đông', ward: 'Phường Vạn Phúc', type: 'Đại siêu thị' },
  { name: 'Đại học Bách Khoa Hà Nội', address: 'Số 1 Đại Cồ Việt', district: 'Quận Hai Bà Trưng', ward: 'Phường Bách Khoa', type: 'Trường Đại Học' },
  { name: 'Đại học Quốc Gia Hà Nội', address: '144 Xuân Thủy', district: 'Quận Cầu Giấy', ward: 'Phường Dịch Vọng Hậu', type: 'Trường Đại Học' },
  { name: 'Đại học Kinh Tế Quốc Dân', address: '207 Giải Phóng', district: 'Quận Hai Bà Trưng', ward: 'Phường Đồng Tâm', type: 'Trường Đại Học' },
  { name: 'Đại học Ngoại Thương', address: '91 Chùa Láng', district: 'Quận Đống Đa', ward: 'Phường Láng Thượng', type: 'Trường Đại Học' },
  { name: 'Đại học Sư Phạm Hà Nội', address: '136 Xuân Thủy', district: 'Quận Cầu Giấy', ward: 'Phường Dịch Vọng Hậu', type: 'Trường Đại Học' },
  { name: 'Đại học Luật Hà Nội', address: '87 Nguyễn Chí Thanh', district: 'Quận Đống Đa', ward: 'Phường Láng Thượng', type: 'Trường Đại Học' },
  { name: 'Đại học Y Hà Nội', address: 'Số 1 Tôn Thất Tùng', district: 'Quận Đống Đa', ward: 'Phường Kim Liên', type: 'Trường Đại Học' },
  { name: 'Học viện Ngân Hàng', address: '12 Chùa Bộc', district: 'Quận Đống Đa', ward: 'Phường Quang Trung', type: 'Trường Đại Học' },
  { name: 'Học viện Báo chí và Tuyên truyền', address: '36 Xuân Thủy', district: 'Quận Cầu Giấy', ward: 'Phường Dịch Vọng Hậu', type: 'Học viện' },
  { name: 'Học viện Ngoại Giao', address: '69 Chùa Láng', district: 'Quận Đống Đa', ward: 'Phường Láng Thượng', type: 'Học viện' },
  { name: 'Học viện Công nghệ Bưu chính Viễn thông', address: 'Km10 Nguyễn Trãi', district: 'Quận Hà Đông', ward: 'Phường Mộ Lao', type: 'Học viện' },
  { name: 'Bệnh viện Bạch Mai', address: '78 Giải Phóng', district: 'Quận Đống Đa', ward: 'Phường Kim Liên', type: 'Bệnh viện trung ương' },
  { name: 'Bệnh viện Việt Đức', address: '40 Tràng Thi', district: 'Quận Hoàn Kiếm', ward: 'Phường Hàng Bông', type: 'Bệnh viện trung ương' },
  { name: 'Bệnh viện Phụ Sản Hà Nội', address: '929 La Thành', district: 'Quận Ba Đình', ward: 'Phường Ngọc Khánh', type: 'Bệnh viện' },
  { name: 'Bệnh viện Quân Y 108', address: 'Số 1 Trần Hưng Đạo', district: 'Quận Hai Bà Trưng', ward: 'Phường Bạch Đằng', type: 'Bệnh viện' },
  { name: 'Sân vận động Quốc gia Mỹ Đình', address: 'Đường Lê Đức Thọ', district: 'Quận Nam Từ Liêm', ward: 'Phường Mỹ Đình 1', type: 'Địa điểm công cộng' },
  { name: 'Hồ Hoàn Kiếm / Phố Đi Bộ', address: 'Đinh Tiên Hoàng', district: 'Quận Hoàn Kiếm', ward: 'Phường Hàng Bạc', type: 'Khu phố cổ' },
  { name: 'Hồ Tây / Phủ Tây Hồ', address: 'Đường Quảng An', district: 'Quận Tây Hồ', ward: 'Phường Quảng An', type: 'Thắng cảnh' },
  { name: 'Chung cư Mipec Tower', address: '229 Tây Sơn', district: 'Quận Đống Đa', ward: 'Phường Quang Trung', type: 'Chung cư cao tầng' },
  { name: 'Chung cư Goldmark City', address: '136 Hồ Tùng Mậu', district: 'Quận Bắc Từ Liêm', ward: 'Phường Phúc Diễn', type: 'Khu đô thị' },
  { name: 'Chung cư The Matrix One', address: 'Đường Lê Quang Đạo', district: 'Quận Nam Từ Liêm', ward: 'Phường Mễ Trì', type: 'Khu căn hộ' },
  { name: 'Chung cư Imperia Garden', address: '203 Nguyễn Huy Tưởng', district: 'Quận Thanh Xuân', ward: 'Phường Thanh Xuân Trung', type: 'Khu căn hộ' },
  { name: 'Chung cư Discovery Complex', address: '302 Cầu Giấy', district: 'Quận Cầu Giấy', ward: 'Phường Dịch Vọng', type: 'Tòa nhà phức hợp' }
];

/**
 * Validates delivery address
 * @param {string} streetAddress
 * @param {string} [province]
 * @param {string} [district]
 * @param {string} [ward]
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateDeliveryAddress(streetAddress, province, district, ward) {
  if (!streetAddress || typeof streetAddress !== 'string' || streetAddress.trim().length < 2) {
    return {
      isValid: false,
      error: 'Vui lòng nhập địa chỉ nhận hàng cụ thể (số nhà, tên đường, tòa nhà...)'
    };
  }
  return { isValid: true };
}

/**
 * Search Hanoi locations by text query (combines local curated database + online OpenStreetMap Nominatim)
 * @param {string} query
 * @returns {Promise<Array<{ name: string, address: string, district: string, ward: string, full: string }>>}
 */
export async function searchHanoiLocations(query) {
  if (!query || query.trim().length < 2) return [];

  const q = query.trim().toLowerCase();
  const results = [];
  const seen = new Set();

  // 1. Search local instant database
  for (const loc of HANOI_POPULAR_LOCATIONS) {
    const combined = `${loc.name} ${loc.address} ${loc.district} ${loc.ward}`.toLowerCase();
    if (combined.includes(q)) {
      const full = `${loc.name}, ${loc.address}, ${loc.ward}, ${loc.district}, Hà Nội`;
      if (!seen.has(full)) {
        seen.add(full);
        results.push({
          name: loc.name,
          address: `${loc.name} (${loc.address})`,
          district: loc.district,
          ward: loc.ward,
          type: loc.type,
          full
        });
      }
    }
  }

  // 2. Query OpenStreetMap Nominatim for real street names in Hanoi
  if (results.length < 5 && q.length >= 3) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', Hà Nội')}&format=json&addressdetails=1&limit=5&countrycodes=vn&viewbox=105.70,21.15,105.95,20.90`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'vi' } });
      if (res.ok) {
        const data = await res.json();
        for (const item of data) {
          const addr = item.address || {};
          const road = addr.road || addr.pedestrian || addr.suburb || item.display_name.split(',')[0];
          const houseNumber = addr.house_number ? `Số ${addr.house_number} ` : '';
          const streetStr = `${houseNumber}${road}`.trim();

          // Try to match district
          let matchedDistrict = HANOI_INNER_DISTRICTS.find(d =>
            item.display_name.toLowerCase().includes(d.replace('Quận ', '').toLowerCase()) ||
            (addr.city_district && addr.city_district.toLowerCase().includes(d.replace('Quận ', '').toLowerCase()))
          );

          if (!matchedDistrict) {
            matchedDistrict = 'Quận Cầu Giấy'; // Default fallback
          }

          // Try to match ward
          let matchedWard = '';
          const wards = HANOI_DISTRICT_WARDS[matchedDistrict] || [];
          for (const w of wards) {
            const shortW = w.replace('Phường ', '').toLowerCase();
            if (item.display_name.toLowerCase().includes(shortW)) {
              matchedWard = w;
              break;
            }
          }
          if (!matchedWard && wards.length > 0) {
            matchedWard = wards[0];
          }

          const full = `${streetStr}, ${matchedWard}, ${matchedDistrict}, Hà Nội`;
          if (!seen.has(full) && streetStr.length >= 4) {
            seen.add(full);
            results.push({
              name: streetStr,
              address: streetStr,
              district: matchedDistrict,
              ward: matchedWard,
              type: 'Địa chỉ đường phố',
              full
            });
          }
        }
      }
    } catch (e) {
      // Ignore network errors on Nominatim, local results are always fast & guaranteed
    }
  }

  return results.slice(0, 6);
}

/**
 * Reverse geocode GPS coordinates to Hanoi address
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{ streetAddress: string, district: string, ward: string, fullAddress: string } | null>}
 */
export async function reverseGeocodeHanoi(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=vi`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'vi' } });
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address || {};

    const houseNumber = addr.house_number ? `Số ${addr.house_number} ` : '';
    const road = addr.road || addr.pedestrian || addr.neighbourhood || addr.suburb || 'Đường phố';
    const streetAddress = `${houseNumber}${road}`.trim();

    // Match district
    let matchedDistrict = HANOI_INNER_DISTRICTS.find(d =>
      data.display_name.toLowerCase().includes(d.replace('Quận ', '').toLowerCase()) ||
      (addr.city_district && addr.city_district.toLowerCase().includes(d.replace('Quận ', '').toLowerCase()))
    );

    if (!matchedDistrict) {
      matchedDistrict = 'Quận Cầu Giấy';
    }

    // Match ward
    let matchedWard = '';
    const wards = HANOI_DISTRICT_WARDS[matchedDistrict] || [];
    for (const w of wards) {
      const shortW = w.replace('Phường ', '').toLowerCase();
      if (data.display_name.toLowerCase().includes(shortW)) {
        matchedWard = w;
        break;
      }
    }
    if (!matchedWard && wards.length > 0) {
      matchedWard = wards[0];
    }

    return {
      streetAddress,
      district: matchedDistrict,
      ward: matchedWard,
      fullAddress: `${streetAddress}, ${matchedWard}, ${matchedDistrict}, Hà Nội`,
      lat,
      lng: lon
    };
  } catch (e) {
    return null;
  }
}

