import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';
import { Bell, Check, Trash2, ShieldAlert } from 'lucide-react';

const NotificationsPage = () => {
  const { t } = useLanguage();
  const { setUnreadCount, realtimeNotifications, setRealtimeNotifications } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.notifications.getAll();
      if (res.success) {
        setNotifications(res.notifications);
        // Reset unread counts on view
        setUnreadCount(0);
        await api.notifications.markAllAsRead();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Merge real-time socket updates received while online
    if (realtimeNotifications.length > 0) {
      setNotifications(prev => [...realtimeNotifications, ...prev]);
      setRealtimeNotifications([]); // Clear queue after flush
    }
  }, [realtimeNotifications]);

  const handleMarkRead = async (id) => {
    try {
      const res = await api.notifications.markAsRead(id);
      if (res.success) {
        setNotifications(prev =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl glow-card border border-slate-100 dark:border-slate-850">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-spice-500" />
            <span>{t('notifications')}</span>
          </h2>
          <span className="text-xs font-bold bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full">
            {notifications.length} Total Alerts
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-spice-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500">Loading alerts...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <ShieldAlert className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="font-extrabold text-lg text-slate-600 dark:text-slate-400 mb-1">Clear Horizon</h3>
            <p className="text-sm text-slate-400">You don't have any notifications at the moment.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {notifications.map((n) => (
              <div
                key={n._id}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                  n.isRead
                    ? 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-100 dark:border-slate-850 text-slate-600 dark:text-slate-400'
                    : 'bg-white dark:bg-slate-900 border-spice-100 dark:border-spice-900/30 text-slate-800 dark:text-slate-200 shadow-sm'
                }`}
              >
                <div className="flex gap-3">
                  <div className={`p-2 rounded-full mt-1 ${n.isRead ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-spice-50 dark:bg-spice-950/20 text-spice-500'}`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-sm leading-relaxed ${n.isRead ? 'font-medium' : 'font-extrabold'}`}>
                      {n.message}
                    </p>
                    <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                      {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {!n.isRead && (
                  <button
                    onClick={() => handleMarkRead(n._id)}
                    className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-450 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors border border-slate-100 dark:border-slate-750"
                    title="Mark Read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
