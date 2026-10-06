import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Check if current device or user is Admin
const isAdminDevice = () => {
  try {
    const adminToken = localStorage.getItem('bepviet_admin_token');
    const userStr = localStorage.getItem('bepviet_user');
    const isAdminFlag = localStorage.getItem('bepviet_is_admin');
    const user = userStr ? JSON.parse(userStr) : null;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isDevQuery = window.location.search.includes('dev=1') || window.location.search.includes('admin=1');
    const isAdminPath = window.location.pathname.startsWith('/admin') || 
                        window.location.pathname.includes('chu-quan') || 
                        window.location.pathname.includes('secret');

    return Boolean(adminToken || (user && user.role === 'admin') || isAdminFlag === 'true' || isAdminPath || isLocalhost || isDevQuery);
  } catch (e) {
    return false;
  }
};

// Khóa click chuột phải trên toàn bộ trang web cho khách thường (Admin không bị khóa)
const blockRightClick = (e) => {
  if (isAdminDevice()) {
    return true; // Cho phép Admin dùng chuột phải & devtools
  }
  if (e) {
    try { if (e.preventDefault) e.preventDefault(); } catch (err) {}
    try { if (e.stopPropagation) e.stopPropagation(); } catch (err) {}
    try { if (e.stopImmediatePropagation) e.stopImmediatePropagation(); } catch (err) {}
    e.returnValue = false;
  }
  return false;
};

['contextmenu', 'auxclick'].forEach((evt) => {
  window.addEventListener(evt, blockRightClick, true);
  document.addEventListener(evt, blockRightClick, true);
});

['mousedown', 'pointerdown', 'mouseup'].forEach((evt) => {
  window.addEventListener(evt, (e) => {
    if (isAdminDevice()) return;
    if (e && (e.button === 2 || e.which === 3)) {
      blockRightClick(e);
    }
  }, true);
  document.addEventListener(evt, (e) => {
    if (isAdminDevice()) return;
    if (e && (e.button === 2 || e.which === 3)) {
      blockRightClick(e);
    }
  }, true);
});

// Khóa phím F11, F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S cho khách (Admin được mở toàn bộ)
window.addEventListener('keydown', (e) => {
  if (isAdminDevice()) {
    return; // Admin được bấm F12, Ctrl+Shift+I, F11 bình thường
  }
  if (e.key === 'F11' || e.code === 'F11' || e.keyCode === 122) {
    return blockRightClick(e);
  }
  if (e.key === 'F12' || e.code === 'F12' || e.keyCode === 123) {
    return blockRightClick(e);
  }
  if (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) {
    return blockRightClick(e);
  }
  if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
    return blockRightClick(e);
  }
  if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
    return blockRightClick(e);
  }
}, true);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
