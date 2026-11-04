// src/api/notifications.ts
import { apiFetch } from "./client";

export type NotificationType =
    | "ANNOUNCEMENT"
    | "CIRCULAR"
    | "ATTENDANCE_ALERT"
    | "LEAVE_UPDATE"
    | "ACADEMIC_ORDER"
    | "GENERAL";

export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type NotificationScope =
    | "UNIVERSITY"
    | "SCHOOL"
    | "DEPARTMENT"
    | "PROGRAM"
    | "BATCH"
    | "SECTION"
    | "INDIVIDUAL";

export interface NotificationCreate {
    title: string;
    message: string;
    notification_type: NotificationType;
    priority: NotificationPriority;
    scope_type: NotificationScope;
    scope_id?: number | null;
    target_role?: string;
    action_url?: string | null;
    expires_at?: string | null;
}

export interface NotificationBroadcastResponse {
    id: number;
    sender_id: number;
    sender_name: string;
    sender_email: string;
    title: string;
    message: string;
    notification_type: string;
    priority: string;
    scope_type: string;
    scope_id?: number | null;
    target_role?: string | null;
    action_url?: string | null;
    created_at: string;
    recipient_count: number;
}

export interface NotificationRecipientItem {
    id: number;
    notification_id: number;
    title: string;
    message: string;
    notification_type: string;
    priority: string;
    sender_name: string;
    action_url?: string | null;
    is_read: boolean;
    read_at?: string | null;
    created_at: string;
}

export interface PaginatedNotifications {
    items: NotificationRecipientItem[];
    total: number;
    unread_count: number;
    page: number;
    size: number;
}

export interface UnreadCountResponse {
    unread_count: number;
}

export interface BroadcastItem {
    id: number;
    sender_id: number;
    sender_name: string;
    sender_email: string;
    title: string;
    message: string;
    notification_type: string;
    priority: string;
    scope_type: string;
    scope_id?: number | null;
    target_role?: string | null;
    action_url?: string | null;
    created_at: string;
    recipient_count: number;
}

export interface PaginatedBroadcasts {
    items: BroadcastItem[];
    total: number;
    page: number;
    size: number;
}

export interface NotificationSettings {
    allow_coordinator_broadcast: boolean;
    allow_teacher_broadcast: boolean;
}

export const sendBroadcast = (data: NotificationCreate): Promise<NotificationBroadcastResponse> =>
    apiFetch("/notifications/broadcast", {
        method: "POST",
        body: JSON.stringify(data),
    });

export const getMyNotifications = (
    page: number = 1,
    size: number = 10,
    unreadOnly: boolean = false
): Promise<PaginatedNotifications> =>
    apiFetch(`/notifications/my-notifications?page=${page}&size=${size}&unread_only=${unreadOnly}`);

export const getUnreadCount = (): Promise<UnreadCountResponse> =>
    apiFetch("/notifications/unread-count");

export const markAsRead = (recipientId: number): Promise<{ status: string }> =>
    apiFetch(`/notifications/${recipientId}/read`, { method: "PATCH" });

export const markAllAsRead = (): Promise<{ status: string; marked_count: number }> =>
    apiFetch("/notifications/mark-all-read", { method: "POST" });

export const getBroadcastHistory = (
    page: number = 1,
    size: number = 20,
    search?: string
): Promise<PaginatedBroadcasts> => {
    const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
    });
    if (search && search.trim()) params.append("search", search.trim());
    return apiFetch(`/notifications/broadcasts?${params.toString()}`);
};

export const getNotificationSettings = (): Promise<NotificationSettings> =>
    apiFetch("/notifications/settings");

export const updateNotificationSettings = (
    data: Partial<NotificationSettings>
): Promise<NotificationSettings> =>
    apiFetch("/notifications/settings", {
        method: "PATCH",
        body: JSON.stringify(data),
    });
