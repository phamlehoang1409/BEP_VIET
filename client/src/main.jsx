import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Khóa phím F11 trên toàn bộ trang web
window.addEventListener('keydown', (e) => {
  if (e.key === 'F11' || e.code === 'F11' || e.keyCode === 122) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}, true);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
