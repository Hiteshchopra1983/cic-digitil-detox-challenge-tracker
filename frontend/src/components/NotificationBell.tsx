import { useEffect, useMemo, useState } from "react";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../lib/api";

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V10a6 6 0 1 0-12 0v4.2a2 2 0 0 1-.6 1.4L4 17h5" />
      <path d="M9 17a3 3 0 0 0 6 0" />
    </svg>
  );
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const hasNotifications = useMemo(() => notifications.length > 0, [notifications]);

  async function loadNotifications() {
    setLoading(true);
    try {
      const res = await getNotifications();
      if (res) {
        setNotifications(res.notifications || []);
        setUnreadCount(Number(res.unread_count || 0));
      }
    } finally {
      setLoading(false);
    }
  }

  async function onMarkRead(id: number) {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  async function onMarkAllRead() {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }

  useEffect(() => {
    loadNotifications();
    const poll = setInterval(loadNotifications, 60 * 1000);
    return () => clearInterval(poll);
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
        aria-label="Notifications"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] leading-[18px] font-semibold">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[340px] max-w-[90vw] bg-white border border-gray-200 rounded-2xl shadow-xl z-40">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
            <button
              type="button"
              onClick={onMarkAllRead}
              className="text-xs text-[#064e3b] font-semibold hover:underline disabled:text-gray-400"
              disabled={unreadCount === 0}
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-[340px] overflow-y-auto p-2">
            {loading && <p className="text-sm text-gray-500 p-2">Loading...</p>}
            {!loading && !hasNotifications && (
              <p className="text-sm text-gray-500 p-2">No notifications yet.</p>
            )}

            {notifications.map((n) => (
              <div
                key={n.id}
                className={`rounded-xl p-3 mb-2 border ${n.is_read ? "bg-white border-gray-100" : "bg-emerald-50/60 border-emerald-100"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                    <p className="text-sm text-gray-600 break-words">{n.message}</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!n.is_read && (
                    <button
                      type="button"
                      onClick={() => onMarkRead(n.id)}
                      className="text-xs text-[#064e3b] font-semibold hover:underline shrink-0"
                    >
                      Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
