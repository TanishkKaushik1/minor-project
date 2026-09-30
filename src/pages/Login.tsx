// src/pages/Login.tsx
import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { forgotPassword, resetPassword } from "../api/auth";

type View = "signin" | "forgot" | "reset";

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [view, setView] = useState<View>("signin");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSignIn(e: FormEvent) {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            await login(email, password);
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
        setIsLoading(true);
        try {
            await forgotPassword(email);
            setNotice(`A reset code was sent to ${email}.`);
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
            setNotice("Password reset. Sign in with your new password.");
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
        <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center px-4 py-16">
            <div className="w-full max-w-md">
                <div className="mb-10 text-center">
                    <p className="text-sm tracking-wide text-[#8A6D3B]">College attendance register</p>
                    <h1 className="mt-1 font-serif text-4xl text-[#1C2541]">Attendance Portal</h1>
                </div>

                <div className="relative bg-white border border-[#E7E2D6] rounded-sm shadow-sm pl-7 pr-8 py-8 sm:pl-9 sm:pr-10">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#B45309] rounded-l-sm" />

                    {notice && view !== "reset" && (
                        <p className="mb-5 text-sm text-[#1C2541] bg-[#F0EEE3] border border-[#E7E2D6] rounded px-3 py-2">
                            {notice}
                        </p>
                    )}
                    {error && (
                        <p className="mb-5 text-sm text-red-800 bg-red-50 border border-red-200 rounded px-3 py-2">
                            {error}
                        </p>
                    )}

                    {view === "signin" && (
                        <form onSubmit={handleSignIn} className="space-y-4">
                            <Field label="Email">
                                <input
                                    type="email" required autoFocus value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@college.edu"
                                    className={inputClass}
                                />
                            </Field>
                            <Field label="Password">
                                <input
                                    type="password" required value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className={inputClass}
                                />
                            </Field>

                            <button type="submit" disabled={isLoading} className={buttonClass}>
                                {isLoading ? "Signing in…" : "Sign in"}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setError(""); setNotice(""); setView("forgot"); }}
                                className="w-full text-center text-sm text-[#6B5B3E] hover:text-[#1C2541] pt-1"
                            >
                                Forgot your password?
                            </button>
                        </form>
                    )}

                    {view === "forgot" && (
                        <form onSubmit={handleForgot} className="space-y-4">
                            <p className="text-sm text-[#6B5B3E]">
                                Enter your email and we'll send a reset code.
                            </p>
                            <Field label="Email">
                                <input
                                    type="email" required autoFocus value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@college.edu"
                                    className={inputClass}
                                />
                            </Field>
                            <button type="submit" disabled={isLoading} className={buttonClass}>
                                {isLoading ? "Sending…" : "Send reset code"}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setError(""); setView("signin"); }}
                                className="w-full text-center text-sm text-[#6B5B3E] hover:text-[#1C2541] pt-1"
                            >
                                Back to sign in
                            </button>
                        </form>
                    )}

                    {view === "reset" && (
                        <form onSubmit={handleReset} className="space-y-4">
                            <Field label="Reset code">
                                <input
                                    type="text" required autoFocus value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="6-digit code"
                                    className={inputClass}
                                />
                            </Field>
                            <Field label="New password">
                                <input
                                    type="password" required value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className={inputClass}
                                />
                            </Field>
                            <button type="submit" disabled={isLoading} className={buttonClass}>
                                {isLoading ? "Resetting…" : "Reset password"}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setError(""); setNotice(""); setView("signin"); }}
                                className="w-full text-center text-sm text-[#6B5B3E] hover:text-[#1C2541] pt-1"
                            >
                                Back to sign in
                            </button>
                        </form>
                    )}
                </div>

                <p className="mt-6 text-center text-xs text-[#8A8272]">
                    Faculty and authorized staff access only.
                </p>
            </div>
        </div>
    );
}

const inputClass =
    "w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#DED8C8] rounded text-sm text-[#1C2541] placeholder-[#A69E8B] focus:outline-none focus:ring-2 focus:ring-[#B45309]/40 focus:border-[#B45309] transition-colors";

const buttonClass =
    "w-full bg-[#1C2541] hover:bg-[#141B31] disabled:opacity-60 text-white font-medium rounded py-2.5 text-sm transition-colors";

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <label className="block space-y-1.5">
            <span className="block text-sm text-[#44403C]">{label}</span>
            {children}
        </label>
    );
}
