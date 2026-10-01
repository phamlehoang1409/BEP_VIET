import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Khóa click chuột phải trên toàn bộ trang web (Cả window và document, phase capture)
const blockRightClick = (e) => {
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
    if (e && (e.button === 2 || e.which === 3)) {
      blockRightClick(e);
    }
  }, true);
  document.addEventListener(evt, (e) => {
    if (e && (e.button === 2 || e.which === 3)) {
      blockRightClick(e);
    }
  }, true);
});

// Khóa phím F11, F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S
window.addEventListener('keydown', (e) => {
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
