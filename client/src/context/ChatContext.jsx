import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSocket, getChatMessages, markChatRead, sendChatMessage, clearChatRoom } from '../api';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {}
}

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState('');

  const socket = getSocket();

  // Stable customer phone/id for this browser session
  const getCustomerRoom = useCallback(() => {
    if (user?.phone) return user.phone;
    let guest = localStorage.getItem('bepviet_guest_id');
    if (!guest) {
      guest = '09' + Math.floor(10000000 + Math.random() * 90000000);
      localStorage.setItem('bepviet_guest_id', guest);
    }
    return guest;
  }, [user]);

  // Sync room ID and register with socket
  useEffect(() => {
    const roomId = getCustomerRoom();
    setCurrentRoomId(roomId);
    if (socket) {
      socket.emit('join_customer_room', roomId);
    }
  }, [user, getCustomerRoom, socket]);

  // Polling for new messages (Dual-channel fallback for serverless environments)
  useEffect(() => {
    if (!currentRoomId) return;

    let isMounted = true;
    const fetchLatest = async () => {
      try {
        const res = await getChatMessages(currentRoomId);
        if (!isMounted || !res.success || !res.messages) return;

        setMessages((prev) => {
          // If no change in count and latest ID matches, return current state
          if (
            prev.length === res.messages.length &&
            prev.length > 0 &&
            prev[prev.length - 1]?.id === res.messages[res.messages.length - 1]?.id
          ) {
            return prev;
          }

          // Check if any new message from admin arrived
          const prevIds = new Set(prev.map((m) => m.id));
          const newAdminMsgs = res.messages.filter(
            (m) => !prevIds.has(m.id) && m.sender_role === 'admin'
          );

          if (newAdminMsgs.length > 0) {
            playNotificationSound();
            if (isChatOpen) {
              markChatRead(currentRoomId, 'customer').catch(() => {});
            }
          }

          return res.messages;
        });

        // Compute unread count when chat is closed
        if (!isChatOpen) {
          const unread = res.messages.filter(
            (m) => m.sender_role === 'admin' && !m.is_read
          ).length;
          setUnreadCount(unread);
        } else {
          setUnreadCount(0);
          markChatRead(currentRoomId, 'customer').catch(() => {});
        }
      } catch (e) {
        // Ignore polling error silently
      }
    };

    fetchLatest();

    // Fast polling (2.5s) when chat is open, slower polling (7s) when closed
    const pollInterval = isChatOpen ? 2500 : 7000;
    const timer = setInterval(fetchLatest, pollInterval);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [currentRoomId, isChatOpen]);

  // Listen to live socket messages when connected
  useEffect(() => {
    if (!currentRoomId || !socket) return;

    const handleNewMessage = (msg) => {
      if (msg.room_id === currentRoomId) {
        setMessages((prev) => {
          if (msg.id && prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });

        if (msg.sender_role === 'admin') {
          playNotificationSound();
          if (!isChatOpen) {
            setUnreadCount((c) => c + 1);
          } else {
            markChatRead(currentRoomId, 'customer').catch(() => {});
          }
        }
      }
    };

    const handleTypingStatus = (data) => {
      if (data.room_id === currentRoomId && data.sender_role === 'admin') {
        setIsTyping(data.isTyping);
      }
    };

    const handleChatCleared = (data) => {
      if (data.room_id === currentRoomId) {
        setMessages([]);
        setUnreadCount(0);
      }
    };

    const handleAllChatsCleared = () => {
      setMessages([]);
      setUnreadCount(0);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('typing_status', handleTypingStatus);
    socket.on('chat_cleared', handleChatCleared);
    socket.on('all_chats_cleared', handleAllChatsCleared);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('typing_status', handleTypingStatus);
      socket.off('chat_cleared', handleChatCleared);
      socket.off('all_chats_cleared', handleAllChatsCleared);
    };
  }, [currentRoomId, isChatOpen, socket]);

  // Mark read when customer opens chat
  useEffect(() => {
    if (isChatOpen && currentRoomId) {
      setUnreadCount(0);
      markChatRead(currentRoomId, 'customer').catch(() => {});
    }
  }, [isChatOpen, currentRoomId]);

  // Customer send message: ALWAYS sends via HTTP REST API with optimistic UI and socket broadcast
  const sendMessage = useCallback(
    async (text, imageUrl = null) => {
      if (!text && !imageUrl) return;
      const roomId = currentRoomId || getCustomerRoom();
      const senderPhone = user?.phone || roomId;
      const senderName = user?.name || `Khách hàng (${roomId.slice(-4)})`;

      const payload = {
        room_id: roomId,
        sender_role: 'customer',
        sender_phone: senderPhone,
        sender_name: senderName,
        message: text,
        image_url: imageUrl
      };

      // Optimistic UI update
      const tempId = 'temp_' + Date.now();
      const optimisticMsg = {
        id: tempId,
        ...payload,
        created_at: new Date().toISOString()
      };

      setMessages((prev) => [...prev, optimisticMsg]);

      try {
        // 1. Guaranteed HTTP API call to Supabase PostgreSQL
        const res = await sendChatMessage(payload);
        if (res.success && res.message) {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? res.message : m))
          );
        }

        // 2. Also emit to socket if connected
        if (socket?.connected) {
          socket.emit('chat_message', payload);
        }
      } catch (err) {
        console.error('Lỗi gửi tin nhắn:', err);
        // Rollback optimistic message if failed
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    },
    [currentRoomId, user, socket, getCustomerRoom]
  );

  const sendTyping = useCallback(
    (typing) => {
      const roomId = currentRoomId || getCustomerRoom();
      if (!roomId || !socket?.connected) return;
      socket.emit('typing', {
        room_id: roomId,
        sender_role: 'customer',
        isTyping: typing
      });
    },
    [currentRoomId, socket, getCustomerRoom]
  );

  const clearCurrentChat = useCallback(async () => {
    const roomId = currentRoomId || getCustomerRoom();
    if (!roomId) return;
    try {
      await clearChatRoom(roomId);
      setMessages([]);
      setUnreadCount(0);
      return { success: true };
    } catch (err) {
      console.error('Lỗi xóa tin nhắn:', err);
      throw err;
    }
  }, [currentRoomId, getCustomerRoom]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        setMessages,
        isChatOpen,
        setIsChatOpen,
        unreadCount,
        isTyping,
        currentRoomId,
        setCurrentRoomId,
        sendMessage,
        sendTyping,
        clearCurrentChat
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
