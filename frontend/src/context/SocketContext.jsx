import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [realtimeNotifications, setRealtimeNotifications] = useState([]);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Fetch initial unread count
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await api.notifications.getAll();
        if (res.success) {
          const count = res.notifications.filter(n => !n.isRead).length;
          setUnreadCount(count);
        }
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    };
    fetchUnreadCount();

    const socketInstance = io('http://localhost:5000', {
      query: { userId: user.id || user._id }
    });

    setSocket(socketInstance);

    socketInstance.on('notification', (newNotif) => {
      console.log('Real-time notification received:', newNotif);
      setRealtimeNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, unreadCount, setUnreadCount, realtimeNotifications, setRealtimeNotifications }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
