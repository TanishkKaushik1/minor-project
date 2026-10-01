// src/App.tsx
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";

const Login = lazy(() => import("./pages/Login"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const DeanDashboard = lazy(() => import("./pages/dean/Dashboard"));
const HodDashboard = lazy(() => import("./pages/hod/Dashboard"));
const CoordinatorDashboard = lazy(() => import("./pages/coordinator/Dashboard"));

const HOME_BY_ROLE = {
    ADMIN: "/admin",
    DEAN: "/dean",
    HOD: "/hod",
    COORDINATOR: "/coordinator",
} as const;

function Home() {
    const { role } = useAuth();
    const dest = role ? HOME_BY_ROLE[role] : undefined;
    return <Navigate to={dest ?? "/login"} replace />;
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Suspense fallback={<div>Loading…</div>}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/" element={<Home />} />
                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute allow={["ADMIN"]}>
                                    <AdminDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/dean"
                            element={
                                <ProtectedRoute allow={["DEAN"]}>
                                    <DeanDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/hod"
                            element={
                                <ProtectedRoute allow={["HOD"]}>
                                    <HodDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/coordinator"
                            element={
                                <ProtectedRoute allow={["COORDINATOR"]}>
                                    <CoordinatorDashboard />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </Suspense>
            </AuthProvider>
        </BrowserRouter>
    );
}