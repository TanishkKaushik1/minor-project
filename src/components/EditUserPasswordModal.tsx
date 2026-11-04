// src/components/EditUserPasswordModal.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    KeyRound,
    Loader2,
    AlertCircle,
    Eye,
    EyeOff,
    Sparkles,
    Copy,
    CheckCheck,
    Mail
} from "lucide-react";
import { updateUserPassword } from "../api/admin";
import type { User } from "../api/admin";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (msg: string) => void;
    user: User | null;
}

export default function EditUserPasswordModal({
    isOpen,
    onClose,
    onSuccess,
    user
}: Props) {
    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [mustChangePassword, setMustChangePassword] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Reset fields on modal open
    useEffect(() => {
        if (isOpen && user) {
            setNewPassword("");
            setShowPassword(false);
            setMustChangePassword(true);
            setError(null);
            setCopied(false);
        }
    }, [isOpen, user]);

    if (!isOpen || !user) return null;

    const userRoles = user.roles && user.roles.length > 0 ? user.roles : (user.role ? [user.role] : []);
    const isStudent = userRoles.includes("STUDENT");
    const isTeacher = userRoles.includes("TEACHER");

    // Generator function for strong readable password
    const handleGeneratePassword = () => {
        const chars = "abcdefghjkmnpqrstuvwxyz23456789";
        let randStr = "";
        for (let i = 0; i < 4; i++) {
            randStr += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const generated = `Gbu@${new Date().getFullYear()}#${randStr}`;
        setNewPassword(generated);
        setShowPassword(true);
        setError(null);
    };

    const handleCopy = () => {
        if (!newPassword) return;
        navigator.clipboard.writeText(newPassword);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const pwd = newPassword.trim();
        if (!pwd) {
            setError("Password cannot be empty.");
            return;
        }
        if (pwd.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await updateUserPassword(user.id, pwd, mustChangePassword);
            onSuccess(res.message || `Password for ${user.full_name} updated successfully.`);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="bg-white rounded-lg border border-slate-200 shadow-lg w-full max-w-lg overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-amber-50 text-amber-700 rounded-md border border-amber-200">
                                <KeyRound className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                                    Update password
                                </h3>
                                <p className="text-xs text-slate-500 font-normal">
                                    Change or reset account login credentials
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

                    <form onSubmit={handleSubmit} className="p-5 space-y-4">
                        {/* Target User Info Card */}
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm text-slate-900">
                                        {user.full_name}
                                    </span>
                                    {isStudent && user.roll_number && (
                                        <span className="font-mono text-xs font-medium px-2 py-0.5 rounded border bg-purple-50 text-purple-700 border-purple-200">
                                            {user.roll_number}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                                    <span>{user.email}</span>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1 justify-end">
                                {userRoles.map((r) => (
                                    <span
                                        key={r}
                                        className="text-xs font-medium px-2 py-0.5 rounded border bg-blue-50 text-blue-800 border-blue-200"
                                    >
                                        {r}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Error Notice */}
                        {error && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md flex items-center gap-2.5 text-xs text-rose-800 font-medium">
                                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Password Input Field */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-medium text-slate-700">
                                    New password <span className="text-rose-600">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={handleGeneratePassword}
                                    className="text-xs font-medium text-blue-700 hover:text-blue-800 inline-flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                >
                                    <Sparkles className="h-3 w-3" />
                                    <span>Generate strong</span>
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => {
                                        setNewPassword(e.target.value);
                                        setError(null);
                                    }}
                                    placeholder="Enter new password (min. 6 chars)…"
                                    className="w-full px-3 py-2 pr-20 bg-white border border-slate-200 rounded-md text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
                                />
                                <div className="absolute right-2 top-2 flex items-center gap-1">
                                    {newPassword && (
                                        <button
                                            type="button"
                                            onClick={handleCopy}
                                            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                            title="Copy password"
                                        >
                                            {copied ? (
                                                <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                                            ) : (
                                                <Copy className="h-3.5 w-3.5" />
                                            )}
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                        title={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-3.5 w-3.5" />
                                        ) : (
                                            <Eye className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Preset Buttons */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="text-xs font-normal text-slate-500">
                                    Presets:
                                </span>
                                {isStudent && user.roll_number && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setNewPassword(user.roll_number!);
                                            setShowPassword(true);
                                            setError(null);
                                        }}
                                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                    >
                                        Roll no: {user.roll_number}
                                    </button>
                                )}
                                {isTeacher && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setNewPassword("Faculty@123");
                                            setShowPassword(true);
                                            setError(null);
                                        }}
                                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                    >
                                        Faculty@123
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNewPassword("GBU@12345");
                                        setShowPassword(true);
                                        setError(null);
                                    }}
                                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                >
                                    GBU@12345
                                </button>
                            </div>
                        </div>

                        {/* Force Change Password on Login Checkbox */}
                        <label className="flex items-start gap-2.5 p-2.5 bg-blue-50/50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                            <input
                                type="checkbox"
                                checked={mustChangePassword}
                                onChange={(e) => setMustChangePassword(e.target.checked)}
                                className="h-4 w-4 mt-0.5 rounded border-slate-300 text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500"
                            />
                            <div className="text-xs">
                                <span className="font-semibold text-slate-900 block">
                                    Require user to change password on next login
                                </span>
                                <span className="text-[11px] text-slate-600">
                                    Forces the student or teacher to set their own private password after entering this temporary one.
                                </span>
                            </div>
                        </label>

                        {/* Footer Buttons */}
                        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="px-3.5 py-1.5 border border-slate-200 text-slate-700 rounded-md text-xs font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98]"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !newPassword}
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-md text-xs font-medium shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98]"
                            >
                                {loading ? (
                                    <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" />
                                ) : (
                                    <KeyRound className="h-3.5 w-3.5" />
                                )}
                                <span>{loading ? "Updating…" : "Update password"}</span>
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
