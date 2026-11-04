// src/components/EditUserProfileModal.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    UserPen,
    Loader2,
    AlertCircle,
    Eye,
    EyeOff,
    Sparkles,
    Copy,
    CheckCheck,
    Mail,
    Hash,
    User as UserIcon,
    Lock
} from "lucide-react";
import { updateUserProfile } from "../api/admin";
import type { User, UpdateUserProfilePayload } from "../api/admin";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (msg: string) => void;
    user: User | null;
}

export default function EditUserProfileModal({
    isOpen,
    onClose,
    onSuccess,
    user
}: Props) {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [rollNumber, setRollNumber] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [mustChangePassword, setMustChangePassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Populate form fields whenever modal opens with target user
    useEffect(() => {
        if (isOpen && user) {
            setFullName(user.full_name || "");
            setEmail(user.email || "");
            setRollNumber(user.roll_number || "");
            setNewPassword("");
            setShowPassword(false);
            setMustChangePassword(false);
            setError(null);
            setCopied(false);
        }
    }, [isOpen, user]);

    if (!isOpen || !user) return null;

    const userRoles = user.roles && user.roles.length > 0 ? user.roles : (user.role ? [user.role] : []);
    const isStudent = userRoles.includes("STUDENT") || !!user.roll_number;
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
        const cleanName = fullName.trim();
        const cleanEmail = email.trim();
        const cleanRoll = rollNumber.trim();
        const cleanPwd = newPassword.trim();

        if (!cleanName) {
            setError("Full name is required.");
            return;
        }
        if (!cleanEmail) {
            setError("Email address is required.");
            return;
        }
        if (cleanPwd && cleanPwd.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        const payload: UpdateUserProfilePayload = {};
        if (cleanName !== user.full_name) payload.full_name = cleanName;
        if (cleanEmail.toLowerCase() !== user.email.toLowerCase()) payload.email = cleanEmail;
        if (isStudent && cleanRoll !== (user.roll_number || "")) payload.roll_number = cleanRoll;
        if (cleanPwd) {
            payload.new_password = cleanPwd;
            payload.must_change_password = mustChangePassword;
        } else if (mustChangePassword) {
            payload.must_change_password = true;
        }

        // If no changes made, close modal
        if (Object.keys(payload).length === 0) {
            onClose();
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await updateUserProfile(user.id, payload);
            onSuccess(`Profile for ${cleanName} updated successfully.`);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update profile.");
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
                    className="bg-white rounded-lg border border-slate-200 shadow-lg w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]"
                >
                    {/* Header */}
                    <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                                <UserPen className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                                    Edit user profile
                                </h3>
                                <p className="text-xs text-slate-500 font-normal">
                                    Update personal details, credentials, and access settings
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

                    <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
                        {/* Current User Roles Pill Summary */}
                        <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-slate-600">
                                    Account #{user.id}:
                                </span>
                                <div className="flex flex-wrap gap-1">
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
                            <span
                                className={`text-xs font-medium px-2 py-0.5 rounded border ${
                                    user.is_active
                                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                        : "bg-slate-100 text-slate-600 border border-slate-200"
                                }`}
                            >
                                {user.is_active ? "Active" : "Inactive"}
                            </span>
                        </div>

                        {/* Error Notice */}
                        {error && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md flex items-center gap-2.5 text-xs text-rose-800 font-medium">
                                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* 1. Full Name */}
                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-slate-700 flex items-center gap-1.5">
                                <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                                <span>Full name</span> <span className="text-rose-600">*</span>
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => {
                                    setFullName(e.target.value);
                                    setError(null);
                                }}
                                placeholder="Enter full name"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
                            />
                        </div>

                        {/* 2. Email Address */}
                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-slate-700 flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5 text-slate-400" />
                                <span>Email address</span> <span className="text-rose-600">*</span>
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setError(null);
                                }}
                                placeholder="name@gbu.ac.in"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
                            />
                        </div>

                        {/* 3. Student Roll Number (If applicable) */}
                        {isStudent && (
                            <div className="space-y-1">
                                <label className="block text-xs font-medium text-slate-700 flex items-center gap-1.5">
                                    <Hash className="h-3.5 w-3.5 text-slate-400" />
                                    <span>Student roll number</span>
                                </label>
                                <input
                                    type="text"
                                    value={rollNumber}
                                    onChange={(e) => {
                                        setRollNumber(e.target.value);
                                        setError(null);
                                    }}
                                    placeholder="e.g. 24/ICS/001"
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
                                />
                            </div>
                        )}

                        {/* Section Divider */}
                        <div className="pt-2 border-t border-slate-200">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                    <Lock className="h-3.5 w-3.5 text-slate-400" />
                                    <span className="text-xs font-medium text-slate-900">
                                        Password & credentials
                                    </span>
                                    <span className="text-xs text-slate-500 font-normal">(optional)</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleGeneratePassword}
                                    className="text-xs font-medium text-blue-700 hover:text-blue-800 inline-flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                >
                                    <Sparkles className="h-3 w-3" />
                                    <span>Generate strong</span>
                                </button>
                            </div>

                            {/* Password Input */}
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => {
                                        setNewPassword(e.target.value);
                                        setError(null);
                                    }}
                                    placeholder="Leave blank to keep current password…"
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

                            {/* Quick Presets */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                <span className="text-xs font-normal text-slate-500">
                                    Presets:
                                </span>
                                {isStudent && rollNumber && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setNewPassword(rollNumber);
                                            setShowPassword(true);
                                            setError(null);
                                        }}
                                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                    >
                                        Roll no ({rollNumber})
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

                            {/* Must change password checkbox */}
                            {newPassword && (
                                <label className="mt-2.5 flex items-start gap-2.5 p-2.5 bg-blue-50/50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
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
                                            User will be asked to choose their own personal password after login.
                                        </span>
                                    </div>
                                </label>
                            )}
                        </div>

                        {/* Footer Buttons */}
                        <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="px-3.5 py-1.5 border border-slate-200 text-slate-700 rounded-md text-xs font-medium hover:bg-slate-100 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98]"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-md text-xs font-medium shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98]"
                            >
                                {loading ? (
                                    <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" />
                                ) : (
                                    <UserPen className="h-3.5 w-3.5" />
                                )}
                                <span>{loading ? "Saving changes…" : "Save changes"}</span>
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
