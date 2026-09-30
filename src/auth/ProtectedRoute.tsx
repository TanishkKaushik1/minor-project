// src/auth/ProtectedRoute.tsx
import type { JSX } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import type { Role } from "./AuthContext";

export function ProtectedRoute({ children, allow }: { children: JSX.Element; allow?: Role[] }) {
    const { role } = useAuth();
    if (!role) return <Navigate to="/login" replace />;
    if (allow && !allow.includes(role)) return <Navigate to="/" replace />;
    return children;
}