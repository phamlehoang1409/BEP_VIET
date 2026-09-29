const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

// GET all active chat conversations for Admin
router.get('/rooms', async (req, res) => {
  try {
    if (!supabase) {
      return res.json({ success: true, rooms: [] });
    }

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const roomsMap = new Map();
    for (const msg of (messages || [])) {
      if (!roomsMap.has(msg.room_id)) {
        roomsMap.set(msg.room_id, {
          room_id: msg.room_id,
          last_activity: msg.created_at,
          last_message: msg.message,
          last_sender_role: msg.sender_role,
          customer_name: msg.sender_role === 'customer' ? msg.sender_name : null,
          unread_count: 0
        });
      }
      const room = roomsMap.get(msg.room_id);
      if (!room.customer_name && msg.sender_role === 'customer') {
        room.customer_name = msg.sender_name;
      }
      if (msg.is_read === false && msg.sender_role === 'customer') {
        room.unread_count++;
      }
    }

    const rooms = Array.from(roomsMap.values());
    return res.json({ success: true, rooms });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET messages for a specific room
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!supabase) {
      return res.json({ success: true, messages: [] });
    }

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('id', { ascending: true })
      .limit(100);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, messages: messages || [] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST send new chat message via REST
router.post('/', async (req, res) => {
  try {
    const { room_id, sender_role, sender_phone, sender_name, message, image_url } = req.body;

    if (!room_id || !message || !message.trim()) {
      return res.status(400).json({ error: 'Nội dung tin nhắn không được để trống' });
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    const { data: newMsg, error } = await supabase
      .from('chat_messages')
      .insert({
        room_id,
        sender_role: sender_role || 'customer',
        sender_phone: sender_phone || room_id,
        sender_name: sender_name || (sender_role === 'admin' ? 'Bếp Việt' : 'Khách hàng'),
        message: message.trim(),
        image_url: image_url || null,
        is_read: sender_role === 'admin' ? true : false
      })
      .select()
      .single();

    if (error || !newMsg) {
      return res.status(500).json({ error: error ? error.message : 'Không thể gửi tin nhắn' });
    }

    // Broadcast via socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`room_${room_id}`).to('admin_room').emit('new_message', newMsg);
    }

    return res.status(201).json({ success: true, message: newMsg });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH mark messages as read
router.patch('/:roomId/read', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { reader_role } = req.body;

    if (!supabase) {
      return res.json({ success: true });
    }

    let q = supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('room_id', roomId);

    if (reader_role === 'admin') {
      q = q.eq('sender_role', 'customer');
    } else {
      q = q.eq('sender_role', 'admin');
    }

    await q;
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
