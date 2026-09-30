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

// List of popular, verified locations & landmarks in Hanoi for instant autocomplete
export const HANOI_POPULAR_LOCATIONS = [
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
 * Validates complete delivery address with strict checks against nonsense/gibberish
 * @param {string} streetAddress
 * @param {string} province
 * @param {string} district
 * @param {string} [ward]
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateDeliveryAddress(streetAddress, province, district, ward) {
  if (!streetAddress || typeof streetAddress !== 'string') {
    return {
      isValid: false,
      error: 'Vui lòng nhập số nhà, tên đường hoặc tòa nhà cụ thể tại Hà Nội!'
    };
  }

  const cleaned = streetAddress.trim();

  // 1. Minimum and maximum length
  if (cleaned.length < 8) {
    return {
      isValid: false,
      error: 'Địa chỉ quá ngắn (tối thiểu 8 ký tự)! Vui lòng ghi rõ số nhà, ngõ/ngách hoặc tên tòa nhà.'
    };
  }
  if (cleaned.length > 180) {
    return {
      isValid: false,
      error: 'Địa chỉ quá dài (tối đa 180 ký tự)! Vui lòng rút gọn thông tin trọng tâm.'
    };
  }

  // 2. Chống nhập chuỗi ký tự lặp vô nghĩa (vd: aaaaaa, 111111, xxxxx)
  if (/(.)\1{3,}/.test(cleaned)) {
    return {
      isValid: false,
      error: 'Địa chỉ chứa ký tự lặp lại bất thường! Vui lòng nhập địa chỉ có thật để shipper giao hàng.'
    };
  }

  // 3. Chống nhập từ ngữ linh tinh, giả mạo, test, spam
  const blacklistedKeywords = [
    'linh tinh', 'lung tung', 'khong co', 'chua co', 'khong biet', 'chua biet',
    'test', 'demo', 'asdf', 'qwerty', 'zxcv', '12345', '123456', '11111',
    'aaaaa', 'hahaha', 'hehehe', 'hihihi', 'dau cung duoc', 'tuy quan',
    'ko co', 'hong co', 'fake', 'abcde', 'qwer', 'đâu cũng được', 'tùy quán'
  ];
  const lower = cleaned.toLowerCase();
  for (const word of blacklistedKeywords) {
    if (lower.includes(word)) {
      return {
        isValid: false,
        error: `Địa chỉ không hợp lệ (phát hiện từ khóa không rõ ràng: "${word}")! Vui lòng nhập số nhà, tên đường cụ thể.`
      };
    }
  }

  // 4. Kiểm tra cấu trúc từ hợp lệ (ít nhất 2 từ)
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length < 2) {
    return {
      isValid: false,
      error: 'Địa chỉ phải có ít nhất 2 từ (Ví dụ: "Số 12 Hàng Bạc" hoặc "Chung cư Royal City")!'
    };
  }

  // 5. Phải chứa nguyên âm tiếng Việt/Latin (chống gõ linh tinh chuỗi phụ âm kiểu "sdfghjk")
  if (!/[aeiouyáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ]/i.test(cleaned)) {
    return {
      isValid: false,
      error: 'Địa chỉ không hợp lệ! Vui lòng nhập tên đường, tòa nhà có nghĩa.'
    };
  }

  // 6. Kiểm tra Quận nội thành Hà Nội
  if (!district || !HANOI_INNER_DISTRICTS.includes(district)) {
    return {
      isValid: false,
      error: 'Quán hiện chỉ giao hàng trong 12 Quận nội thành Hà Nội. Vui lòng chọn Quận hợp lệ!'
    };
  }

  // 7. Kiểm tra Phường thuộc Quận nếu có
  if (ward && HANOI_DISTRICT_WARDS[district]) {
    const validWards = HANOI_DISTRICT_WARDS[district];
    if (validWards.length > 0 && !validWards.includes(ward)) {
      return {
        isValid: false,
        error: `Phường/Xã "${ward}" không thuộc ${district}! Vui lòng chọn lại phường tương ứng.`
      };
    }
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

