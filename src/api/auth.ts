// src/api/auth.ts
import { apiFetch } from "./client";

export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    must_change_password?: boolean;
    available_roles?: { role: string; scope_type: string; scope_id: number | null }[];
    active_role?: string;
}

export const login = (email: string, password: string): Promise<TokenResponse> =>
    apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });

export const logout = (refresh_token: string) =>
    apiFetch("/auth/logout", { method: "POST", body: JSON.stringify({ refresh_token }) });

export const changePassword = (old_password: string, new_password: string) =>
    apiFetch("/auth/change-password", { method: "POST", body: JSON.stringify({ old_password, new_password }) });

export const forgotPassword = (email: string) =>
    apiFetch("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });

export const resetPassword = (email: string, otp: string, new_password: string) =>
    apiFetch("/auth/reset-password", { method: "POST", body: JSON.stringify({ email, otp, new_password }) });

export const switchRole = (role: string, scope_id?: number | null): Promise<TokenResponse> =>
    apiFetch("/auth/switch-role", { method: "POST", body: JSON.stringify({ role, scope_id }) });
