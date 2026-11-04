// src/components/ProfileModal.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Shield, Check, RefreshCw, KeyRound, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { changePassword } from "../api/auth";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: Props) {
    const { user, role, availableRoles, switchRole } = useAuth();
    const [switching, setSwitching] = useState<string | null>(null);

    // Change Password tab state
    const [tab, setTab] = useState<"profile" | "password">("profile");
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [passLoading, setPassLoading] = useState(false);
    const [passMsg, setPassMsg] = useState<{ ok: boolean; text: string } | null>(null);

    const handleSwitch = async (targetRole: string, scopeId: number | null) => {
        setSwitching(targetRole);
        try {
            await switchRole(targetRole, scopeId);
            onClose();
            window.location.reload();
        } catch (err) {
            console.error("Failed to switch role:", err);
        } finally {
            setSwitching(null);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPassLoading(true);
        setPassMsg(null);
        try {
            await changePassword(oldPassword, newPassword);
            setPassMsg({ ok: true, text: "Password changed successfully!" });
            setOldPassword("");
            setNewPassword("");
        } catch (err) {
            setPassMsg({ ok: false, text: err instanceof Error ? err.message : "Failed to change password" });
        } finally {
            setPassLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/50"
                    />

                    <motion.div
                        initial={{ scale: 0.96, opacity: 0, y: 8 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.96, opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="relative bg-white rounded-lg border border-slate-200 shadow-lg w-full max-w-md overflow-hidden z-10"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-semibold">
                                    <User className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-semibold text-slate-900">Authority profile</h3>
                                    <p className="text-xs text-slate-500 font-normal">
                                        Session credentials & university roles
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] disabled:opacity-50"
                                aria-label="Close dialog"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-slate-200 px-5 bg-white gap-2">
                            <button
                                onClick={() => setTab("profile")}
                                className={`py-2.5 px-3 text-xs font-medium transition-colors border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] ${
                                    tab === "profile"
                                        ? "border-blue-700 text-blue-800 font-semibold"
                                        : "border-transparent text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                Overview & roles
                            </button>
                            <button
                                onClick={() => setTab("password")}
                                className={`py-2.5 px-3 text-xs font-medium transition-colors border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] ${
                                    tab === "password"
                                        ? "border-blue-700 text-blue-800 font-semibold"
                                        : "border-transparent text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                Change password
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                            {tab === "profile" ? (
                                <div className="space-y-4">
                                    {/* User Details Card */}
                                    <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-md bg-blue-700 text-white flex items-center justify-center font-semibold text-sm">
                                            {user?.name?.substring(0, 2).toUpperCase() || "GB"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || "University User"}</p>
                                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                            <div className="mt-1 flex items-center gap-1.5">
                                                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
                                                    Active: {role}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Available Roles Switcher */}
                                    <div>
                                        <label className="text-xs font-medium text-slate-700 block mb-2">
                                            Assigned university roles ({availableRoles.length})
                                        </label>
                                        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                                            {availableRoles.length === 0 ? (
                                                <div className="p-3 bg-slate-50 rounded-md border border-slate-200 text-xs text-slate-500 text-center">
                                                    Primary role: <strong className="font-semibold text-slate-700">{role}</strong>
                                                </div>
                                            ) : (
                                                availableRoles.map((r, i) => {
                                                    const isActive = r.role.toUpperCase() === role?.toUpperCase();
                                                    return (
                                                        <div
                                                            key={i}
                                                            className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                                                                isActive
                                                                    ? "border-blue-300 bg-blue-50/50"
                                                                    : "border-slate-200 bg-white hover:bg-slate-50"
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Shield className={`h-4 w-4 ${isActive ? "text-blue-700" : "text-slate-400"}`} />
                                                                <div>
                                                                    <span className="text-xs font-medium text-slate-900">
                                                                        {r.role}
                                                                    </span>
                                                                    {r.scope_id && (
                                                                        <span className="text-[11px] text-slate-500 ml-1.5 font-mono">
                                                                            (scope #{r.scope_id})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {isActive ? (
                                                                <span className="flex items-center gap-1 text-xs font-medium text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded border border-blue-200">
                                                                    <Check className="h-3 w-3" />
                                                                    <span>Current</span>
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleSwitch(r.role, r.scope_id)}
                                                                    disabled={switching !== null}
                                                                    className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] disabled:opacity-50"
                                                                >
                                                                    {switching === r.role ? (
                                                                        <RefreshCw className="h-3 w-3 motion-safe:animate-spin" />
                                                                    ) : (
                                                                        "Switch"
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleChangePassword} className="space-y-3.5">
                                    {passMsg && (
                                        <div
                                            className={`p-2.5 rounded-md text-xs font-medium flex items-center gap-2 ${
                                                passMsg.ok
                                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                                    : "bg-rose-50 text-rose-800 border border-rose-200"
                                            }`}
                                        >
                                            {passMsg.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />}
                                            <span>{passMsg.text}</span>
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-xs font-medium text-slate-700 mb-1 block">
                                            Current password
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            placeholder="Enter current password"
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs font-mono focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 outline-none transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-slate-700 mb-1 block">
                                            New password
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Enter new password"
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs font-mono focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 outline-none transition-colors"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={passLoading}
                                        className="w-full h-9 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-medium text-xs rounded-md transition-colors shadow-xs flex items-center justify-center gap-2 mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98]"
                                    >
                                        {passLoading ? <RefreshCw className="h-3.5 w-3.5 motion-safe:animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                                        <span>Update password</span>
                                    </button>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
