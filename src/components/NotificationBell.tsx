import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import {
    getUnreadCount,
    getMyNotifications,
    markAsRead,
    markAllAsRead,
} from "../api/notifications";
import type { NotificationRecipientItem } from "../api/notifications";

const formatTimeAgo = (isoDate: string): string => {
    try {
        const diff = (Date.now() - new Date(isoDate).getTime()) / 1000;
        if (diff < 60) return "Just now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
        return new Date(isoDate).toLocaleDateString();
    } catch {
        return "";
    }
};

export default function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationRecipientItem[]>([]);
    const [loading, setLoading] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    const refreshCount = async () => {
        try {
            const res = await getUnreadCount();
            setUnreadCount(res.unread_count ?? 0);
        } catch {
            // Ignore polling errors
        }
    };

    const loadRecentNotifications = async () => {
        setLoading(true);
        try {
            const res = await getMyNotifications(1, 6, false);
            setNotifications(res.items ?? []);
            setUnreadCount(res.unread_count ?? 0);
        } catch {
            // Ignore
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshCount();
        const timer = setInterval(refreshCount, 30000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadRecentNotifications();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const handleItemClick = async (item: NotificationRecipientItem) => {
        if (!item.is_read) {
            try {
                await markAsRead(item.id);
                setNotifications((prev) =>
                    prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            } catch {
                // Ignore
            }
        }
        if (item.action_url) {
            window.open(item.action_url, "_blank");
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch {
            // Ignore
        }
    };

    return (
        <div className="relative" ref={popoverRef}>
            {/* Bell Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="relative h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer"
                aria-label="Open Notifications"
                title="Notifications"
            >
                <Bell className="h-4 w-4 motion-safe:transition-transform hover:scale-110" />

                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white font-bold text-[9px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-xs animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Popover */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                Notifications
                            </h3>
                            {unreadCount > 0 && (
                                <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded-full font-semibold">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={handleMarkAllRead}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                            >
                                <CheckCheck className="h-3 w-3" />
                                <span>Mark all as read</span>
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {loading && notifications.length === 0 ? (
                            <div className="p-6 text-center text-xs text-slate-400">Loading…</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-xs text-slate-500">
                                <p className="font-semibold text-slate-700">No notifications yet</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    You're all caught up with university notices.
                                </p>
                            </div>
                        ) : (
                            notifications.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => handleItemClick(item)}
                                    className={`p-3.5 hover:bg-slate-50/90 transition-colors cursor-pointer flex items-start gap-2.5 ${
                                        !item.is_read ? "bg-indigo-50/20" : ""
                                    }`}
                                >
                                    <span
                                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                            !item.is_read ? "bg-indigo-600 ring-4 ring-indigo-100" : "bg-transparent"
                                        }`}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1 mb-0.5">
                                            <h4 className="text-xs font-semibold text-slate-900 truncate">
                                                {item.title}
                                            </h4>
                                            <span className="text-[10px] text-slate-400 shrink-0">
                                                {formatTimeAgo(item.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                                            {item.message}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-1.5">
                                            <span className="text-[9px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                                {item.sender_name}
                                            </span>
                                            {item.priority === "URGENT" && (
                                                <span className="text-[9px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                                                    URGENT
                                                </span>
                                            )}
                                            {item.action_url && (
                                                <span className="inline-flex items-center gap-0.5 text-[9px] text-indigo-600 font-medium ml-auto">
                                                    <span>Open link</span>
                                                    <ExternalLink className="h-2.5 w-2.5" />
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
