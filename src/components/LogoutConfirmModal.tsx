// src/components/LogoutConfirmModal.tsx
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, X, ShieldCheck } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function LogoutConfirmModal({ isOpen, onClose }: Props) {
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/50"
                    />

                    {/* Modal Card */}
                    <motion.div
                        initial={{ scale: 0.96, opacity: 0, y: 8 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.96, opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="relative bg-white rounded-lg border border-slate-200 shadow-lg w-full max-w-sm overflow-hidden p-6 text-center z-10"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-3.5 right-3.5 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] disabled:opacity-50"
                            title="Close"
                            aria-label="Close dialog"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        {/* Icon Wrapper */}
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 border border-red-200 mb-4 text-red-600">
                            <LogOut className="h-5 w-5 ml-0.5" />
                        </div>

                        {/* Text Content */}
                        <h3 className="text-base font-semibold text-slate-900">Sign out of session?</h3>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                            You are about to sign out of the <span className="font-medium text-slate-800">GBU Attendance System</span>. Any unsaved edits may be lost.
                        </p>

                        {/* Action Buttons */}
                        <div className="flex gap-2.5 mt-5">
                            <button
                                onClick={onClose}
                                className="flex-1 py-2 px-3 bg-white border border-slate-200 text-slate-700 rounded-md font-medium text-xs hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleLogout}
                                className="flex-1 py-2 px-3 bg-red-600 text-white rounded-md font-medium text-xs hover:bg-red-700 shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 active:scale-[0.98] disabled:opacity-50"
                            >
                                Sign out
                            </button>
                        </div>

                        {/* Connection Security Status */}
                        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Encrypted session active</span>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
