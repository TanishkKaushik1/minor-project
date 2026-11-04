// src/pages/admin/SettingsTab.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Type,
    Check,
    RotateCcw,
    Sparkles,
    CheckCircle2,
    Sliders,
    Eye,
    HelpCircle,
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
} from "../../utils/typographySettings";
import type { TypographySettings } from "../../utils/typographySettings";
import {
    getStoredTheme,
    saveTheme
} from "../../utils/themeManager";
import type { ThemeMode } from "../../utils/themeManager";

export default function SettingsTab() {
    const [settings, setSettings] = useState<TypographySettings>(DEFAULT_TYPOGRAPHY_SETTINGS);
    const [themeMode, setThemeMode] = useState<ThemeMode>(getStoredTheme);
    const [savedNotice, setSavedNotice] = useState(false);

    useEffect(() => {
        setSettings(getTypographySettings());
        setThemeMode(getStoredTheme());
    }, []);

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
        setTimeout(() => setSavedNotice(false), 3000);
    };

    const handleReset = () => {
        setSettings(DEFAULT_TYPOGRAPHY_SETTINGS);
        saveTypographySettings(DEFAULT_TYPOGRAPHY_SETTINGS);
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 3000);
    };

    const activeFont = AVAILABLE_FONTS.find((f) => f.id === settings.fontFamily) || AVAILABLE_FONTS[0];

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">System & Display Settings</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Customize global typography, font sizing, and visual aesthetics across the entire portal
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleReset}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                        title="Reset to default system typography"
                    >
                        <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                        <span>Reset Defaults</span>
                    </button>
                    <button
                        onClick={handleSave}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-lg text-xs font-medium shadow-2xs transition-colors cursor-pointer"
                    >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Save Preferences</span>
                    </button>
                </div>
            </div>

            {/* Saved Notification Banner */}
            <AnimatePresence>
                {savedNotice && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 flex items-center justify-between text-xs"
                    >
                        <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            <div>
                                <p className="font-semibold text-emerald-950">
                                    Display preferences saved successfully!
                                </p>
                                <p className="text-[11px] text-emerald-800 mt-0.5">
                                    Your chosen typography and scaling will persist across every page and future sessions.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Font Family & Layout Controls */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Theme & Visual Appearance */}
                    <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sun className="h-4 w-4 text-slate-700" />
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Theme & Visual Appearance
                                </h2>
                            </div>
                            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 capitalize">
                                {themeMode} mode
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Switch between Light, Dark, or System mode to adapt the management console to your preference and environment.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                            {[
                                { id: "light" as ThemeMode, label: "Light Theme", icon: Sun, desc: "High contrast clean slate paper" },
                                { id: "dark" as ThemeMode, label: "Dark Theme", icon: Moon, desc: "Deep charcoal with vivid accents" },
                                { id: "system" as ThemeMode, label: "System Sync", icon: Monitor, desc: "Automatically match your OS theme" }
                            ].map((opt) => {
                                const isSelected = themeMode === opt.id;
                                const IconComp = opt.icon;
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => {
                                            setThemeMode(opt.id);
                                            saveTheme(opt.id);
                                        }}
                                        className={`p-3.5 rounded-lg text-left border transition-colors relative overflow-hidden cursor-pointer ${
                                            isSelected
                                                ? "border-blue-600 bg-blue-50/50 shadow-2xs"
                                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                                                <IconComp className={`h-4 w-4 ${isSelected ? "text-blue-700" : "text-slate-500"}`} />
                                                {opt.label}
                                            </span>
                                            {isSelected && (
                                                <div className="h-4 w-4 rounded-full bg-blue-700 text-white flex items-center justify-center">
                                                    <Check className="h-2.5 w-2.5" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">{opt.desc}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Font Family Selection */}
                    <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Type className="h-4 w-4 text-slate-700" />
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Global Font Family
                                </h2>
                            </div>
                            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {AVAILABLE_FONTS.length} available
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Select a modern typeface to configure the display style across all headings, tables, navigation, and modal forms.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                            {AVAILABLE_FONTS.map((font) => {
                                const isSelected = settings.fontFamily === font.id;
                                return (
                                    <button
                                        key={font.id}
                                        type="button"
                                        onClick={() => handleSelectFont(font.id)}
                                        className={`p-3.5 rounded-lg text-left border transition-colors relative overflow-hidden cursor-pointer ${
                                            isSelected
                                                ? "border-slate-900 bg-slate-50/80 shadow-2xs"
                                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <span
                                                        className="text-sm font-semibold text-slate-900"
                                                        style={{ fontFamily: font.stack }}
                                                    >
                                                        {font.name}
                                                    </span>
                                                    {font.recommended && (
                                                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-200 text-slate-800">
                                                            {font.badge}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                    {font.badge}
                                                </p>
                                            </div>
                                            {isSelected && (
                                                <div className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0">
                                                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                                                </div>
                                            )}
                                        </div>

                                        <p
                                            className="mt-2 text-xs text-slate-600 line-clamp-2"
                                            style={{ fontFamily: font.stack }}
                                        >
                                            {font.description}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Scale & Kerning Settings */}
                    <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-5">
                        <div className="flex items-center gap-2">
                            <Sliders className="h-4 w-4 text-slate-700" />
                            <h2 className="text-sm font-semibold text-slate-900">
                                Sizing & Letter Spacing
                            </h2>
                        </div>

                        {/* Font Scale */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-medium text-slate-700">
                                    Display Scale / Density
                                </label>
                                <span className="text-xs font-mono text-slate-900 font-semibold">
                                    {settings.fontScale}%
                                </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                                {SCALE_OPTIONS.map((opt) => {
                                    const isSelected = settings.fontScale === opt.value;
                                    return (
                                        <button
                                            key={opt.label}
                                            type="button"
                                            onClick={() => handleSelectScale(opt.value)}
                                            className={`py-2 px-2.5 rounded-lg text-center border transition-colors text-xs font-medium cursor-pointer ${
                                                isSelected
                                                    ? "border-slate-900 bg-slate-900 text-white shadow-2xs font-semibold"
                                                    : "border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Letter Spacing */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-medium text-slate-700">
                                    Letter Spacing (Kerning)
                                </label>
                                <span className="text-xs font-mono text-slate-500">
                                    {settings.letterSpacing || "normal"}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                {SPACING_OPTIONS.map((opt) => {
                                    const isSelected = settings.letterSpacing === opt.id;
                                    return (
                                        <button
                                            key={opt.label}
                                            type="button"
                                            onClick={() => handleSelectSpacing(opt.id)}
                                            className={`py-2 px-2.5 rounded-lg text-center border transition-colors text-xs font-medium cursor-pointer ${
                                                isSelected
                                                    ? "border-slate-900 bg-slate-900 text-white shadow-2xs font-semibold"
                                                    : "border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Live Interactive Preview */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4 sticky top-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4 text-slate-700" />
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Live Preview
                                </h2>
                            </div>
                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {activeFont.name}
                            </span>
                        </div>

                        <p className="text-xs text-slate-500">
                            Preview how headings, body text, tables, and numeric tags appear with the active font configuration.
                        </p>

                        {/* Interactive Preview Canvas */}
                        <div
                            className="p-4 rounded-lg bg-slate-50/70 border border-slate-200 text-slate-900 space-y-3.5"
                            style={{
                                fontFamily: activeFont.stack,
                                letterSpacing: settings.letterSpacing
                            }}
                        >
                            {/* Card Header */}
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                                <div>
                                    <h3 className="text-sm font-semibold tracking-tight text-slate-900">
                                        School of ICT Attendance
                                    </h3>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Academic Term 2026-2027 • Section 4A
                                    </p>
                                </div>
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Active Session
                                </span>
                            </div>

                            {/* Stat Chips */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                                    <span className="text-[10px] font-medium text-slate-500 block">Present</span>
                                    <span className="text-base font-bold text-slate-900">58</span>
                                </div>
                                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                                    <span className="text-[10px] font-medium text-slate-500 block">Absent</span>
                                    <span className="text-base font-bold text-slate-900">4</span>
                                </div>
                                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                                    <span className="text-[10px] font-medium text-slate-500 block">Avg Rate</span>
                                    <span className="text-base font-bold text-slate-900">93.5%</span>
                                </div>
                            </div>

                            {/* Mini Table Preview */}
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between items-center py-1.5 border-b border-slate-200 text-slate-700">
                                    <span className="font-medium">CS-401 Algorithm Analysis</span>
                                    <span className="font-mono text-slate-500 text-[11px]">09:00 - 10:00 AM</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-slate-200 text-slate-700">
                                    <span className="font-medium">CS-402 Database Systems</span>
                                    <span className="font-mono text-slate-500 text-[11px]">10:00 - 11:00 AM</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 text-slate-700">
                                    <span className="font-medium">CS-403 Web Engineering</span>
                                    <span className="font-mono text-slate-500 text-[11px]">11:30 - 12:30 PM</span>
                                </div>
                            </div>

                            {/* Action Row */}
                            <div className="pt-2 flex gap-2">
                                <button
                                    type="button"
                                    className="flex-1 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium text-center transition-colors shadow-2xs cursor-pointer"
                                >
                                    Export PDF
                                </button>
                                <button
                                    type="button"
                                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                                >
                                    Details
                                </button>
                            </div>
                        </div>

                        {/* Tips & Guidance */}
                        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 space-y-1">
                            <div className="flex items-center gap-1.5">
                                <HelpCircle className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                <span className="text-xs font-medium text-slate-800">Recommended Fonts</span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                <strong>Inter</strong> and <strong>Plus Jakarta Sans</strong> offer high readability for administrative tables and dense data grids. <strong>Geist</strong> delivers crisp, modern aesthetics.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
