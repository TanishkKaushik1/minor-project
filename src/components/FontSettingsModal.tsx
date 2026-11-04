// src/components/FontSettingsModal.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Type,
    Check,
    RotateCcw,
    CheckCircle2,
    Eye,
    Sun,
    Moon,
    Monitor
} from "lucide-react";
import {
    AVAILABLE_FONTS,
    SCALE_OPTIONS,
    SPACING_OPTIONS,
    DEFAULT_TYPOGRAPHY_SETTINGS,
    getTypographySettings,
    saveTypographySettings,
    applyTypographySettings
} from "../utils/typographySettings";
import type { TypographySettings } from "../utils/typographySettings";
import {
    getStoredTheme,
    saveTheme
} from "../utils/themeManager";
import type { ThemeMode } from "../utils/themeManager";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function FontSettingsModal({ isOpen, onClose }: Props) {
    const [settings, setSettings] = useState<TypographySettings>(DEFAULT_TYPOGRAPHY_SETTINGS);
    const [themeMode, setThemeMode] = useState<ThemeMode>(getStoredTheme);
    const [savedNotice, setSavedNotice] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSettings(getTypographySettings());
            setThemeMode(getStoredTheme());
            setSavedNotice(false);
        }
    }, [isOpen]);

    const handleSelectFont = (fontId: string) => {
        const next = { ...settings, fontFamily: fontId };
        setSettings(next);
        applyTypographySettings(next); // Instant live preview
    };

    const handleSelectScale = (scale: number) => {
        const next = { ...settings, fontScale: scale };
        setSettings(next);
        applyTypographySettings(next);
    };

    const handleSelectSpacing = (spacing: string) => {
        const next = { ...settings, letterSpacing: spacing };
        setSettings(next);
        applyTypographySettings(next);
    };

    const handleSave = () => {
        saveTypographySettings(settings);
        setSavedNotice(true);
        setTimeout(() => {
            setSavedNotice(false);
            onClose();
        }, 800);
    };

    const handleReset = () => {
        setSettings(DEFAULT_TYPOGRAPHY_SETTINGS);
        saveTypographySettings(DEFAULT_TYPOGRAPHY_SETTINGS);
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 1200);
    };

    const handleCancel = () => {
        // Revert to saved settings on cancel
        applyTypographySettings(getTypographySettings());
        onClose();
    };

    const currentFont = AVAILABLE_FONTS.find((f) => f.id === settings.fontFamily) || AVAILABLE_FONTS[0];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleCancel}
                        className="fixed inset-0 bg-slate-900/50"
                    />

                    <motion.div
                        initial={{ scale: 0.96, opacity: 0, y: 8 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.96, opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="relative w-full max-w-3xl bg-white border border-slate-200 shadow-lg rounded-lg overflow-hidden z-10 flex flex-col max-h-[92vh]"
                    >
                        {/* Header */}
                        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-slate-800 text-slate-200 rounded-md border border-slate-700">
                                    <Type className="h-4 w-4 text-blue-300" />
                                </div>
                                <div>
                                    <h2 className="text-sm sm:text-base font-semibold tracking-tight text-white">
                                        Typography & font customization
                                    </h2>
                                    <p className="text-xs text-slate-400 font-normal">
                                        Configure typography scale, letter spacing, and rendering engine.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleCancel}
                                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 active:scale-[0.98]"
                                aria-label="Close dialog"
                            >
                                <X className="h-4 w-4 text-slate-300" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
                            {/* Theme & Appearance */}
                            <div>
                                <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5 mb-2">
                                    <Sun className="h-3.5 w-3.5 text-blue-700" />
                                    <span>Theme & visual appearance</span>
                                </label>
                                <div className="grid grid-cols-3 gap-2.5">
                                    {[
                                        { id: "light" as ThemeMode, label: "Light", icon: Sun, desc: "Clean crisp paper" },
                                        { id: "dark" as ThemeMode, label: "Dark", icon: Moon, desc: "Restrained slate dark" },
                                        { id: "system" as ThemeMode, label: "System", icon: Monitor, desc: "Follow OS preference" }
                                    ].map((opt) => {
                                        const isSelected = themeMode === opt.id;
                                        const IconComponent = opt.icon;
                                        return (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => {
                                                    setThemeMode(opt.id);
                                                    saveTheme(opt.id);
                                                }}
                                                className={`p-3 rounded-lg border text-left cursor-pointer transition-colors ${
                                                    isSelected
                                                        ? "border-blue-600 bg-blue-50/50 shadow-2xs"
                                                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                                                        <IconComponent className={`h-3.5 w-3.5 ${isSelected ? "text-blue-700" : "text-slate-500"}`} />
                                                        {opt.label}
                                                    </span>
                                                    {isSelected && <Check className="h-3.5 w-3.5 text-blue-700" />}
                                                </div>
                                                <p className="text-[11px] text-slate-500 mt-1">{opt.desc}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Font Family Selection */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                                        <Type className="h-3.5 w-3.5 text-blue-700" />
                                        <span>Select font family</span>
                                    </label>
                                    <span className="text-xs font-normal text-slate-500">
                                        Active: <strong className="font-semibold text-blue-800">{currentFont.name}</strong>
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {AVAILABLE_FONTS.map((font) => {
                                        const isSelected = settings.fontFamily === font.id;
                                        return (
                                            <div
                                                key={font.id}
                                                onClick={() => handleSelectFont(font.id)}
                                                className={`p-3 rounded-lg border cursor-pointer transition-colors flex flex-col justify-between ${
                                                    isSelected
                                                        ? "border-blue-600 bg-blue-50/50"
                                                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                                }`}
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span
                                                            className="text-sm font-semibold text-slate-900"
                                                            style={{ fontFamily: font.stack }}
                                                        >
                                                            {font.name}
                                                        </span>
                                                        <span
                                                            className={`text-xs font-medium px-2 py-0.5 rounded border ${
                                                                font.recommended
                                                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                                                    : "bg-slate-100 text-slate-700 border-slate-200"
                                                            }`}
                                                        >
                                                            {font.badge}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                                        {font.description}
                                                    </p>
                                                </div>

                                                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                                    <span
                                                        className="text-xs text-slate-600 font-medium truncate"
                                                        style={{ fontFamily: font.stack }}
                                                    >
                                                        The quick brown fox jumps over the lazy dog
                                                    </span>
                                                    {isSelected && (
                                                        <div className="h-4 w-4 rounded-full bg-blue-700 text-white flex items-center justify-center shrink-0 ml-2">
                                                            <Check className="h-2.5 w-2.5" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Fine-Tuning Controls */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                {/* Font Scale */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-700 block">
                                        Interface scale
                                    </label>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {SCALE_OPTIONS.map((scale) => (
                                            <button
                                                key={scale.value}
                                                type="button"
                                                onClick={() => handleSelectScale(scale.value)}
                                                className={`py-1.5 px-2 text-xs font-medium rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] ${
                                                    settings.fontScale === scale.value
                                                        ? "bg-blue-700 text-white border-blue-700"
                                                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                                }`}
                                            >
                                                {scale.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Letter Spacing */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-700 block">
                                        Letter spacing (kerning)
                                    </label>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {SPACING_OPTIONS.map((spacing) => (
                                            <button
                                                key={spacing.id}
                                                type="button"
                                                onClick={() => handleSelectSpacing(spacing.id)}
                                                className={`py-1.5 px-2 text-xs font-medium rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] ${
                                                    settings.letterSpacing === spacing.id
                                                        ? "bg-blue-700 text-white border-blue-700"
                                                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                                }`}
                                            >
                                                {spacing.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Live Preview Card */}
                            <div className="bg-slate-900 text-white p-4 rounded-lg space-y-2.5 border border-slate-800">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                                        <Eye className="h-3.5 w-3.5 text-blue-400" />
                                        <span>Live typography preview ({currentFont.name})</span>
                                    </div>
                                    <span className="text-xs text-emerald-400 font-medium">Live rendering active</span>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-base font-semibold tracking-tight text-white">
                                        SOICT Computer Science & Engineering
                                    </h3>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        Welcome to Gautam Buddha University academic portal. Real-time biometric attendance, credit distribution audits, and university timetables.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-xs font-medium border border-blue-400/30">
                                        CS401: Database Systems
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-400/30">
                                        Batch 2024-28 (Section A)
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-400/30">
                                        Period IV (13:30 - 14:30)
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span>Reset to default (Inter)</span>
                            </button>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    className="flex-1 sm:flex-none whitespace-nowrap flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-md bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium transition-colors shadow-xs active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
                                >
                                    {savedNotice ? (
                                        <>
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                                            <span>Saved settings</span>
                                        </>
                                    ) : (
                                        <span>Save & apply</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
