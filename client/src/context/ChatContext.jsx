import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSocket, getChatMessages, markChatRead, sendChatMessage } from '../api';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

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

  // Customer always joins their customer room
  useEffect(() => {
    const roomId = getCustomerRoom();
    setCurrentRoomId(roomId);
    socket.emit('join_customer_room', roomId);

    // Fetch conversation history from SQL database
    getChatMessages(roomId)
      .then((res) => {
        if (res.success && res.messages) {
          setMessages(res.messages);
          const unread = res.messages.filter((m) => m.sender_role === 'admin' && !m.is_read).length;
          setUnreadCount(unread);
        }
      })
      .catch(console.error);
  }, [user, getCustomerRoom, socket]);

  // Listen to live socket messages
  useEffect(() => {
    if (!currentRoomId) return;

    const handleNewMessage = (msg) => {
      // Only handle messages for this customer's room
      if (msg.room_id === currentRoomId) {
        setMessages((prev) => {
          // Strictly prevent duplicate by id
          if (msg.id && prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });

        if (!isChatOpen && msg.sender_role === 'admin') {
          setUnreadCount((c) => c + 1);
        }
      }
    };

    const handleTypingStatus = (data) => {
      if (data.room_id === currentRoomId && data.sender_role === 'admin') {
        setIsTyping(data.isTyping);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('typing_status', handleTypingStatus);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('typing_status', handleTypingStatus);
    };
  }, [currentRoomId, isChatOpen, socket]);

  // Mark read when customer opens chat
  useEffect(() => {
    if (isChatOpen && currentRoomId) {
      setUnreadCount(0);
      markChatRead(currentRoomId, 'customer').catch(console.error);
    }
  }, [isChatOpen, currentRoomId]);

  // Customer send message: ALWAYS sends as role 'customer'
  const sendMessage = useCallback(
    (text, imageUrl = null) => {
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

      if (!socket.connected) {
        sendChatMessage(payload)
          .then((res) => {
            if (res.success && res.message) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === res.message.id)) return prev;
                return [...prev, res.message];
              });
            }
          })
          .catch(console.error);
        return;
      }

      socket.emit('chat_message', payload);
    },
    [currentRoomId, user, socket, getCustomerRoom]
  );

  const sendTyping = useCallback(
    (typing) => {
      const roomId = currentRoomId || getCustomerRoom();
      if (!roomId) return;
      socket.emit('typing', {
        room_id: roomId,
        sender_role: 'customer',
        isTyping: typing
      });
    },
    [currentRoomId, socket, getCustomerRoom]
  );

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
        sendTyping
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
