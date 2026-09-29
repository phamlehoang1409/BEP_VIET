const express = require('express');
const router = express.Router();
const { query, queryOne, run } = require('../db/database');

// GET all active chat conversations for Admin
router.get('/rooms', (req, res) => {
  try {
    const rooms = query(`
      SELECT
        c.room_id,
        MAX(c.created_at) as last_activity,
        (SELECT message FROM chat_messages WHERE room_id = c.room_id ORDER BY id DESC LIMIT 1) as last_message,
        (SELECT sender_role FROM chat_messages WHERE room_id = c.room_id ORDER BY id DESC LIMIT 1) as last_sender_role,
        (SELECT sender_name FROM chat_messages WHERE room_id = c.room_id AND sender_role = 'customer' ORDER BY id DESC LIMIT 1) as customer_name,
        SUM(CASE WHEN c.is_read = 0 AND c.sender_role = 'customer' THEN 1 ELSE 0 END) as unread_count
      FROM chat_messages c
      GROUP BY c.room_id
      ORDER BY last_activity DESC
    `);

    return res.json({ success: true, rooms });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET messages for a specific room
router.get('/:roomId', (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = query(
      'SELECT * FROM chat_messages WHERE room_id = ? ORDER BY id ASC LIMIT 100',
      [roomId]
    );

    return res.json({ success: true, messages });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST send new chat message via REST (fallback or standard)
router.post('/', (req, res) => {
  try {
    const { room_id, sender_role, sender_phone, sender_name, message, image_url } = req.body;

    if (!room_id || !message || !message.trim()) {
      return res.status(400).json({ error: 'Nội dung tin nhắn không được để trống' });
    }

    const result = run(`
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

    const createdMsg = queryOne('SELECT * FROM chat_messages WHERE id = ?', [Number(result.lastInsertRowid)]);

    // Socket broadcast
    const io = req.app.get('io');
    if (io) {
      io.to(`room_${room_id}`).to('admin_room').emit('new_message', createdMsg);
    }

    return res.status(201).json({ success: true, message: createdMsg });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH mark messages as read
router.patch('/:roomId/read', (req, res) => {
  try {
    const { roomId } = req.params;
    const { reader_role } = req.body;

    if (reader_role === 'admin') {
      run("UPDATE chat_messages SET is_read = 1 WHERE room_id = ? AND sender_role = 'customer'", [roomId]);
    } else {
      run("UPDATE chat_messages SET is_read = 1 WHERE room_id = ? AND sender_role = 'admin'", [roomId]);
    }

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
