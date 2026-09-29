import { io } from 'socket.io-client';

const isDev = typeof window !== 'undefined' && window.location.port === '5173';
const BACKEND_URL = isDev
  ? `${window.location.protocol}//${window.location.hostname}:5000`
  : (typeof window !== 'undefined' ? window.location.origin : '');

const API_BASE = `${BACKEND_URL}/api`;

// Socket.io singleton
let socketInstance = null;
export function getSocket() {
  if (!socketInstance) {
    socketInstance = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      timeout: 5000
    });
    socketInstance.on('connect_error', () => {
      // Gracefully ignore socket errors in serverless environments where WebSockets are not available
    });
  }
  return socketInstance;
}

// Generic Fetch helper
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers: options.isFormData ? options.headers : headers
  });

  const contentType = response.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = { error: 'Dữ liệu phản hồi từ máy chủ không hợp lệ' };
    }
  } else {
    const text = await response.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text || `Lỗi máy chủ (${response.status}: ${response.statusText})` };
    }
  }

  if (!response.ok) {
    throw new Error(data.error || 'Có lỗi xảy ra, vui lòng thử lại sau.');
  }
  return data;
}

function buildQueryString(params = {}) {
  const cleanParams = {};
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== '' && val !== 'undefined' && val !== 'null') {
      cleanParams[key] = val;
    }
  }
  const qs = new URLSearchParams(cleanParams).toString();
  return qs ? `?${qs}` : '';
}

// --- Foods API ---
export const getFoods = (params = {}) => {
  return request(`/foods${buildQueryString(params)}`);
};

export const getFoodById = (id) => request(`/foods/${id}`);

export const createFood = (data) =>
  request('/foods', {
    method: 'POST',
    body: JSON.stringify(data)
  });

export const updateFood = (id, data) =>
  request(`/foods/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });

export const updateFoodPrice = (id, price, original_price) =>
  request(`/foods/${id}/price`, {
    method: 'PATCH',
    body: JSON.stringify({ price, original_price })
  });

export const toggleFoodStatus = (id) =>
  request(`/foods/${id}/status`, {
    method: 'PATCH'
  });

export const deleteFood = (id) =>
  request(`/foods/${id}`, {
    method: 'DELETE'
  });

export const getCategories = () => request('/foods/categories');

// --- Image Upload API ---
export const uploadImageFile = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${BACKEND_URL}/api/upload`, {
    method: 'POST',
    body: formData
  });

  const contentType = response.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = { error: 'Không thể đọc phản hồi từ máy chủ tải ảnh' };
    }
  } else {
    const text = await response.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text || 'Không thể tải ảnh lên' };
    }
  }

  if (!response.ok) {
    throw new Error(data.error || 'Không thể tải ảnh lên');
  }
  return data;
};

// --- Orders API ---
export const placeOrder = (data) =>
  request('/orders', {
    method: 'POST',
    body: JSON.stringify(data)
  });

export const getCustomerOrders = (phone) => request(`/orders/user/${phone}`);

export const getAllOrders = (params = {}) => {
  return request(`/orders${buildQueryString(params)}`);
};

export const getOrderById = (id) => request(`/orders/${id}`);

export const updateOrderStatus = (id, status) =>
  request(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });

// --- Auth API ---
export const requestOtp = (phone) =>
  request('/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify({ phone })
  });

export const verifyOtp = (phone, otp, name) =>
  request('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, otp, name })
  });

export const adminLogin = (passcode) =>
  request('/auth/admin-login', {
    method: 'POST',
    body: JSON.stringify({ passcode })
  });

export const updateProfile = (profileData) =>
  request('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData)
  });

// --- Chat API ---
export const getChatRooms = () => request('/chat/rooms');

export const getChatMessages = (roomId) => request(`/chat/${roomId}`);

export const sendChatMessage = (data) =>
  request('/chat', {
    method: 'POST',
    body: JSON.stringify(data)
  });

export const markChatRead = (roomId, reader_role) =>
  request(`/chat/${roomId}/read`, {
    method: 'PATCH',
    body: JSON.stringify({ reader_role })
  });

// --- Dashboard Stats API ---
export const getDashboardStats = () => request('/stats/summary');
