// src/pages/Login.tsx
import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    AlertCircle,
    CheckCircle2,
    Loader2,
    ShieldCheck,
    KeyRound,
    Sun,
    Moon,
    Smartphone
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { forgotPassword, resetPassword } from "../api/auth";
import {
    getStoredTheme,
    resolveEffectiveTheme,
    toggleTheme
} from "../utils/themeManager";

type View = "signin" | "forgot" | "reset";

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [view, setView] = useState<View>("signin");
    const [theme, setTheme] = useState<"light" | "dark">(() => resolveEffectiveTheme(getStoredTheme()));

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSignIn(e: FormEvent) {
        e.preventDefault();
        setError("");

        const cleanIdentifier = email.trim();
        if (!cleanIdentifier.includes("@")) {
            setError("Student roll numbers are not supported on the web portal. Please use the GBU Attendance mobile app to log in.");
            return;
        }

        setIsLoading(true);
        try {
            await login(cleanIdentifier, password);
            navigate("/");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Invalid email or password");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleForgot(e: FormEvent) {
        e.preventDefault();
        setError("");

        const cleanIdentifier = email.trim();
        if (!cleanIdentifier.includes("@")) {
            setError("Please enter your registered institutional email. Student roll numbers must use the mobile app.");
            return;
        }

        setIsLoading(true);
        try {
            await forgotPassword(cleanIdentifier);
            setNotice(`A reset OTP has been dispatched to ${cleanIdentifier}.`);
            setView("reset");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't send a reset code");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleReset(e: FormEvent) {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            await resetPassword(email, otp, newPassword);
            setNotice("Password successfully updated. Sign in with your new password.");
            setView("signin");
            setPassword("");
            setOtp("");
            setNewPassword("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't reset the password");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 sm:p-6 font-sans relative">
            {/* Top-right floating theme toggle */}
            <div className="absolute top-4 right-4 z-30">
                <button
                    type="button"
                    onClick={() => {
                        const next = toggleTheme();
                        setTheme(next);
                    }}
                    className="h-9 w-9 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer"
                    title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                    aria-label="Toggle dark mode"
                >
                    {theme === "dark" ? (
                        <Sun className="h-4 w-4 text-amber-400 motion-safe:transition-transform motion-safe:duration-300 hover:rotate-45" />
                    ) : (
                        <Moon className="h-4 w-4 text-slate-600 motion-safe:transition-transform motion-safe:duration-300 hover:-rotate-12" />
                    )}
                </button>
            </div>

            {/* Ambient Background Glows */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px]" />
            </div>

            {/* Split Card */}
            <div className="w-full max-w-[420px] lg:max-w-4xl grid grid-cols-1 lg:grid-cols-10 bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-slate-100 overflow-hidden relative z-10 my-8">
                {/* Left Branding Side */}
                <div className="lg:col-span-4 bg-slate-900 p-8 sm:p-10 flex flex-col justify-between text-white relative overflow-hidden min-h-[220px] lg:min-h-auto">
                    <div className="absolute inset-0 opacity-15">
                        <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-blue-400 via-transparent to-transparent" />
                    </div>

                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20 p-2 border border-slate-100">
                            <img
                                src="https://www.gbu.ac.in/Content/img/logo_gbu.png"
                                alt="GBU Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black leading-tight tracking-tight uppercase mt-6 text-white">
                            Gautam Buddha University
                        </h1>
                        <div className="h-1 w-12 bg-blue-500 mt-4 rounded-full" />
                        <p className="text-slate-400 text-[11px] mt-4 font-bold uppercase tracking-[0.2em] leading-relaxed">
                            Attendance Management Platform
                        </p>
                    </div>

                    <div className="relative z-10 pt-8 border-t border-slate-800/80 mt-6 lg:mt-0 flex items-center gap-2.5 text-slate-400 text-xs font-semibold">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Role-Based Secure Academic Portal</span>
                    </div>
                </div>

                {/* Right Form Side */}
                <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-white">
                    <div className="w-full">
                        {/* Header Text */}
                        <div className="mb-6 sm:mb-8 text-center lg:text-left">
                            <h2 className="text-xl sm:text-2xl font-black text-slate-800 uppercase tracking-tight">
                                {view === "signin" && "Authority Access"}
                                {view === "forgot" && "Recover Account"}
                                {view === "reset" && "Reset Password"}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {view === "signin" && "Sign in to access university administration portal"}
                                {view === "forgot" && "Enter your registered email for OTP"}
                                {view === "reset" && "Enter the OTP sent to your inbox"}
                            </p>
                        </div>

                        {/* Notifications */}
                        <AnimatePresence mode="wait">
                            {notice && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    className="mb-5 flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold"
                                >
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>{notice}</span>
                                </motion.div>
                            )}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    className="mb-5 flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-semibold"
                                >
                                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Sign In Form */}
                        {view === "signin" && (
                            <form onSubmit={handleSignIn} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">
                                        Email Address
                                    </label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input
                                            type="email"
                                            required
                                            autoFocus
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="name@example.com or admin@gbu.ac.in"
                                            className="w-full pl-11 pr-4 h-11 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block">
                                            Password
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setError("");
                                                setNotice("");
                                                setView("forgot");
                                            }}
                                            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider transition-colors cursor-pointer"
                                        >
                                            Forgot?
                                        </button>
                                    </div>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••••••"
                                            className="w-full pl-11 pr-11 h-11 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full mt-2 h-11 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60 text-white font-black text-xs uppercase tracking-[0.15em] rounded-2xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Authenticating…</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Sign In to Portal</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>

                                {/* Student / Teacher App Guidance Banner */}
                                <div className="mt-5 p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start gap-3 text-xs text-blue-900">
                                    <Smartphone className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-blue-950">Student or Teacher?</p>
                                        <p className="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
                                            Please use the <strong>GBU Attendance Mobile App</strong> to log in and mark attendance. This web portal is exclusively for University Administration.
                                        </p>
                                    </div>
                                </div>
                            </form>
                        )}

                        {/* Forgot Password Form */}
                        {view === "forgot" && (
                            <form onSubmit={handleForgot} className="space-y-4">
                                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                    Provide the registered email associated with your administrative account. We will dispatch a 6-digit one-time authorization code.
                                </p>

                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">
                                        Email Address
                                    </label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input
                                            type="email"
                                            required
                                            autoFocus
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="name@example.com or admin@gbu.ac.in"
                                            className="w-full pl-11 pr-4 h-11 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60 text-white font-black text-xs uppercase tracking-[0.15em] rounded-2xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <span>Dispatch Reset Code</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setError("");
                                        setView("signin");
                                    }}
                                    className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 py-1 transition-colors"
                                >
                                    Return to Sign In
                                </button>
                            </form>
                        )}

                        {/* Reset Password Form */}
                        {view === "reset" && (
                            <form onSubmit={handleReset} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">
                                        One-Time OTP Code
                                    </label>
                                    <div className="relative group">
                                        <KeyRound className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input
                                            type="text"
                                            required
                                            autoFocus
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            placeholder="Enter 6-digit OTP"
                                            className="w-full pl-11 pr-4 h-11 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all tracking-widest"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">
                                        New Password
                                    </label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input
                                            type="password"
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••••••"
                                            className="w-full pl-11 pr-4 h-11 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60 text-white font-black text-xs uppercase tracking-[0.15em] rounded-2xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <span>Set New Password</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setError("");
                                        setNotice("");
                                        setView("signin");
                                    }}
                                    className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 py-1 transition-colors"
                                >
                                    Return to Sign In
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
