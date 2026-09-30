// src/auth/AuthContext.tsx
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import * as authApi from "../api/auth";

export type Role = "ADMIN" | "DEAN" | "HOD" | "COORDINATOR";

function toRole(value: unknown): Role | null {
    const r = String(value ?? "").toUpperCase();
    return (["ADMIN", "DEAN", "HOD", "COORDINATOR"] as const).includes(r as Role) ? (r as Role) : null;
}

interface AuthState {
    role: Role | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [role, setRole] = useState<Role | null>(() => toRole(localStorage.getItem("active_role")));

    async function login(email: string, password: string) {
        const data = await authApi.login(email, password);
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        const resolvedRole = toRole(data.active_role);
        if (!resolvedRole) throw new Error(`Unsupported role for web: ${data.active_role}`);
        localStorage.setItem("active_role", resolvedRole);
        setRole(resolvedRole);
    }

    function logout() {
        const refresh_token = localStorage.getItem("refresh_token");
        // fire-and-forget: don't block the local logout on the network call
        if (refresh_token) authApi.logout(refresh_token).catch(() => {});
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("active_role");
        setRole(null);
    }

    return <AuthContext.Provider value={{ role, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}
