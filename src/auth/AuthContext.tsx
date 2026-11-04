// src/auth/AuthContext.tsx
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import * as authApi from "../api/auth";

export type Role = "ADMIN" | "DEAN" | "HOD" | "COORDINATOR" | "TEACHER" | "STUDENT";

export interface RoleAssignmentInfo {
    role: string;
    scope_type: string;
    scope_id: number | null;
}

export interface UserInfo {
    email: string;
    name?: string;
}

interface AuthState {
    role: Role | null;
    user: UserInfo | null;
    availableRoles: RoleAssignmentInfo[];
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    switchRole: (role: string, scope_id?: number | null) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

function toRole(value: unknown): Role | null {
    const r = String(value ?? "").toUpperCase();
    return (["ADMIN", "DEAN", "HOD", "COORDINATOR", "TEACHER", "STUDENT"] as const).includes(r as Role)
        ? (r as Role)
        : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [role, setRole] = useState<Role | null>(() => toRole(localStorage.getItem("active_role")));
    const [user, setUser] = useState<UserInfo | null>(() => {
        const stored = localStorage.getItem("auth_user");
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch {
                return null;
            }
        }
        return null;
    });
    const [availableRoles, setAvailableRoles] = useState<RoleAssignmentInfo[]>(() => {
        const stored = localStorage.getItem("available_roles");
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch {
                return [];
            }
        }
        return [];
    });

    async function login(email: string, password: string) {
        const data = await authApi.login(email, password);

        // Verify that the user has an administrative authority role (ADMIN, DEAN, HOD, COORDINATOR)
        const authorityRoles = ["ADMIN", "DEAN", "HOD", "COORDINATOR"];
        const userRoles = data.available_roles || [];
        const hasAuthorityRole =
            userRoles.some((r) => authorityRoles.includes(r.role.toUpperCase())) ||
            authorityRoles.includes((data.active_role || "").toUpperCase());

        if (!hasAuthorityRole) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            throw new Error(
                "Access restricted: This account belongs to a Student/Teacher. Please use the GBU Attendance mobile app to log in."
            );
        }

        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);

        const resolvedRole = toRole(data.active_role);
        if (!resolvedRole) throw new Error(`Unsupported role: ${data.active_role}`);
        localStorage.setItem("active_role", resolvedRole);
        setRole(resolvedRole);

        const rolesList = data.available_roles || [{ role: resolvedRole, scope_type: "GLOBAL", scope_id: null }];
        localStorage.setItem("available_roles", JSON.stringify(rolesList));
        setAvailableRoles(rolesList);

        // Derive user name from email prefix or capitalize
        const rawName = email.split("@")[0].replace(/[._]/g, " ");
        const formattedName = rawName
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");

        const userInfo: UserInfo = {
            email,
            name: formattedName || "University Authority",
        };
        localStorage.setItem("auth_user", JSON.stringify(userInfo));
        setUser(userInfo);
    }

    async function switchRole(targetRole: string, scope_id?: number | null) {
        const data = await authApi.switchRole(targetRole, scope_id);
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);

        const resolved = toRole(data.active_role || targetRole);
        if (resolved) {
            localStorage.setItem("active_role", resolved);
            setRole(resolved);
        }

        if (data.available_roles) {
            localStorage.setItem("available_roles", JSON.stringify(data.available_roles));
            setAvailableRoles(data.available_roles);
        }
    }

    function logout() {
        const refresh_token = localStorage.getItem("refresh_token");
        if (refresh_token) authApi.logout(refresh_token).catch(() => {});
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("active_role");
        localStorage.removeItem("auth_user");
        localStorage.removeItem("available_roles");
        setRole(null);
        setUser(null);
        setAvailableRoles([]);
    }

    return (
        <AuthContext.Provider value={{ role, user, availableRoles, login, logout, switchRole }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}
