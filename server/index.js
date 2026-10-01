const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const foodRoutes = require('./routes/foods');
const orderRoutes = require('./routes/orders');
const chatRoutes = require('./routes/chat');
const statsRoutes = require('./routes/stats');
const uploadRoutes = require('./routes/upload');
const settingsRoutes = require('./routes/settings');
const couponsRoutes = require('./routes/coupons');
const reviewsRoutes = require('./routes/reviews');
const luckyWheelRoutes = require('./routes/luckyWheel');
const setupChatSocket = require('./socket/chatSocket');
const supabase = require('./db/supabase');

const app = express();
const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  }
});
app.set('io', io);
setupChatSocket(io);

// Middlewares
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/lucky-wheel', luckyWheelRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Vietnam Food Delivery Backend API (Bếp Việt)',
    database: supabase ? 'Supabase PostgreSQL (Cloud Connected)' : 'Disconnected',
    runtime: process.version,
    environment: process.env.VERCEL ? 'Vercel Serverless' : 'Local Node Server',
    time: new Date().toISOString()
  });
});

// Serve frontend production build if available
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// Fallback to index.html for React SPA client-side routing
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    const indexPath = path.join(clientDistPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        res.status(200).send('API backend is online.');
      }
    });
  }
});

// Only bind port when not running inside Vercel serverless environment
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Fullstack App running on http://localhost:${PORT}`);
    console.log(`📁 Uploads available at http://localhost:${PORT}/uploads`);
  });
}

module.exports = app;
module.exports.server = server;
