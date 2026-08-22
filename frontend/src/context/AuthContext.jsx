import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null);
  const socketRef = useRef(null);

  // Toast display trigger helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Initialize Dark Mode on boot
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load profile if token exists
  useEffect(() => {
    const loadProfile = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          // Initialize Socket
          initSocket(userData.id);
          // Fetch notifications
          fetchNotifications(token);
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [token]);

  // Connect socket.io
  const initSocket = (userId) => {
    if (socketRef.current) socketRef.current.disconnect();

    // Use current protocol & host
    const socketUrl = window.location.origin;
    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.emit('register', userId);

    socket.on('notification', (newNotif) => {
      setNotifications(prev => [newNotif, ...prev]);
      showToast(newNotif.content, 'info');
    });

    socket.on('receive_message', (msg) => {
      // Create a message notification in UI if not actively looking at chat
      // We handle specific view updates inside Chat page as well via socket events
      showToast(`New message: "${msg.content.substring(0, 20)}..."`, 'info');
      // Refetch notifications since backend auto-inserts message_received notification
      fetchNotifications(token);
    });
  };

  const fetchNotifications = async (authToken) => {
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${authToken || token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markNotificationRead = async (notifId) => {
    try {
      const res = await fetch(`/api/notifications/${notifId}/read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        showToast('All notifications marked as read');
      }
    } catch (err) {
      console.error('Failed to read all notifications:', err);
    }
  };

  // Log in user
  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.message || 'Login failed' };
      }
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      initSocket(data.user.id);
      showToast(`Welcome back, ${data.user.name}!`);
      return { success: true };
    } catch (err) {
      return { success: false, message: 'Server communication error.' };
    }
  };

  // Register user
  const register = async (fields) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.message || 'Registration failed' };
      }
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      initSocket(data.user.id);
      showToast(`Account registered! Welcome, ${data.user.name}`);
      return { success: true };
    } catch (err) {
      return { success: false, message: 'Server communication error.' };
    }
  };

  // Log out user
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setNotifications([]);
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    showToast('Logged out successfully.');
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      darkMode,
      toggleDarkMode,
      notifications,
      unreadNotificationsCount: unreadCount,
      fetchNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      login,
      register,
      logout,
      toast,
      showToast,
      socket: socketRef.current
    }}>
      {children}
      
      {/* Global Toast component */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[9999] flex items-center p-4 rounded-xl shadow-xl transition-all duration-300 transform translate-y-0 scale-100 glass-panel border border-slate-200 dark:border-slate-800 animate-bounce">
          <div className={`mr-3 w-3 h-3 rounded-full ${
            toast.type === 'success' ? 'bg-emerald-500' :
            toast.type === 'error' ? 'bg-rose-500' :
            toast.type === 'info' ? 'bg-brand-500' : 'bg-slate-400'
          }`} />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{toast.message}</p>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
