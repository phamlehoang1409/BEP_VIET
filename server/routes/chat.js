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
      .order('id', { ascending: false })
      .limit(500);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Try to enrich with registered user names
    const userMap = new Map();
    try {
      const { data: users } = await supabase.from('users').select('phone, name');
      for (const u of (users || [])) {
        if (u.phone && u.name) userMap.set(u.phone, u.name);
      }
    } catch (e) {}

    const roomsMap = new Map();
    for (const msg of (messages || [])) {
      if (!roomsMap.has(msg.room_id)) {
        const foundName = userMap.get(msg.room_id) || (msg.sender_role === 'customer' ? msg.sender_name : null);
        roomsMap.set(msg.room_id, {
          room_id: msg.room_id,
          last_activity: msg.created_at,
          last_message: msg.message,
          last_sender_role: msg.sender_role,
          customer_name: foundName,
          unread_count: 0
        });
      }
      const room = roomsMap.get(msg.room_id);
      if (!room.customer_name && msg.sender_role === 'customer') {
        room.customer_name = userMap.get(msg.room_id) || msg.sender_name;
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
      .limit(200);

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

    const role = sender_role || 'customer';
    const defaultName = role === 'admin' ? 'Bếp Việt (Chủ Quán)' : 'Khách hàng';

    const { data: newMsg, error } = await supabase
      .from('chat_messages')
      .insert({
        room_id,
        sender_role: role,
        sender_phone: sender_phone || (role === 'admin' ? '0909999999' : room_id),
        sender_name: sender_name || defaultName,
        message: message.trim(),
        image_url: image_url || null,
        is_read: false
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

// DELETE /api/chat/:roomId - Khi chat xong với khách, xóa sạch toàn bộ tin nhắn của khách trong Supabase
router.delete('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!roomId) {
      return res.status(400).json({ error: 'Thiếu mã phòng chat' });
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    // Xóa toàn bộ tin nhắn liên quan tới roomId này trong bảng chat_messages của Supabase
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('room_id', roomId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Phát socket thông báo cho cả Admin và Khách hàng xóa trắng màn hình chat ngay lập tức
    const io = req.app.get('io');
    if (io) {
      io.to(`room_${roomId}`).to('admin_room').emit('chat_cleared', { room_id: roomId });
    }

    return res.json({
      success: true,
      message: `Đã kết thúc cuộc trò chuyện và xóa toàn bộ dữ liệu tin nhắn của phòng ${roomId} khỏi Supabase!`
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// DELETE /api/chat - Xóa toàn bộ lịch sử tin nhắn của tất cả khách hàng trong Supabase
router.delete('/', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .neq('id', 0);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('all_chats_cleared');
    }

    return res.json({
      success: true,
      message: 'Đã xóa sạch toàn bộ lịch sử tin nhắn trong Supabase thành công!'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
