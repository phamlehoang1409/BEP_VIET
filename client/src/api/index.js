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
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000
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

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Có lỗi xảy ra, vui lòng thử lại sau.');
  }
  return data;
}

// --- Foods API ---
export const getFoods = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/foods${query ? `?${query}` : ''}`);
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

  const data = await response.json();
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
  const query = new URLSearchParams(params).toString();
  return request(`/orders${query ? `?${query}` : ''}`);
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
