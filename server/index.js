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
const setupChatSocket = require('./socket/chatSocket');

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Vietnam Food Delivery Backend API',
    database: 'SQLite (node:sqlite)',
    time: new Date().toISOString()
  });
});

// Serve frontend production build
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// Fallback to index.html for React SPA client-side routing
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Fullstack App running on http://localhost:${PORT}`);
  console.log(`📁 Uploads available at http://localhost:${PORT}/uploads`);
});

module.exports = app;
module.exports.server = server;
