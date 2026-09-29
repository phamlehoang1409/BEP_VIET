const { run, queryOne } = require('../db/database');

function setupChatSocket(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // Join user/customer room
    socket.on('join_customer_room', (phone) => {
      if (!phone) return;
      const room = `room_${phone}`;
      socket.join(room);
      console.log(`Customer ${phone} joined ${room}`);
    });

    // Join admin room
    socket.on('join_admin_room', () => {
      socket.join('admin_room');
      console.log(`Admin joined admin_room`);
    });

    // Send chat message
    socket.on('chat_message', (data) => {
      try {
        const { room_id, sender_role, sender_phone, sender_name, message, image_url } = data;
        if (!room_id || !message || !message.trim()) return;

        const res = run(`
          INSERT INTO chat_messages (room_id, sender_role, sender_phone, sender_name, message, image_url, is_read)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          room_id,
          sender_role || 'customer',
          sender_phone || room_id,
          sender_name || (sender_role === 'admin' ? 'Bếp Việt' : 'Khách hàng'),
          message.trim(),
          image_url || null,
          sender_role === 'admin' ? 1 : 0
        ]);

        const newMsg = queryOne('SELECT * FROM chat_messages WHERE id = ?', [Number(res.lastInsertRowid)]);

        // Broadcast to customer room and admin room without duplicate packets
        io.to(`room_${room_id}`).to('admin_room').emit('new_message', newMsg);
      } catch (err) {
        console.error('Error saving socket chat message:', err);
      }
    });

    // Typing indicators
    socket.on('typing', ({ room_id, sender_role, isTyping }) => {
      if (sender_role === 'customer') {
        io.to('admin_room').emit('typing_status', { room_id, isTyping, sender_role });
      } else {
        io.to(`room_${room_id}`).emit('typing_status', { room_id, isTyping, sender_role });
      }
    });

    socket.on('disconnect', () => {
      // console.log(`Client disconnected: ${socket.id}`);
    });
  });
}

module.exports = setupChatSocket;
