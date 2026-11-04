// src/components/DashboardShell.tsx
import { useState, useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Menu,
    Settings,
    User,
    LogOut,
    ChevronDown,
    ChevronRight,
    Shield,
    Type,
    PanelLeftClose,
    PanelLeftOpen,
    Home,
    Sun,
    Moon,
    Monitor
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import LogoutConfirmModal from "./LogoutConfirmModal";
import ProfileModal from "./ProfileModal";
import NotificationBell from "./NotificationBell";
import FontSettingsModal from "./FontSettingsModal";
import {
    getStoredTheme,
    resolveEffectiveTheme,
    saveTheme,
    toggleTheme
} from "../utils/themeManager";
import type { ThemeMode } from "../utils/themeManager";

export type NavItem = {
    id: string;
    label: string;
    icon?: ReactNode;
    children?: NavItem[];
};

type Props = {
    title: string;
    children?: ReactNode;
    nav?: NavItem[];
    active?: string;
    onSelect?: (id: string) => void;
};

export function DashboardShell({ children, nav, active, onSelect }: Props) {
    const { user, role } = useAuth();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isLogoutOpen, setIsLogoutOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isFontSettingsOpen, setIsFontSettingsOpen] = useState(false);
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

    // Dark/Light theme mode state
    const [themeMode, setThemeMode] = useState<ThemeMode>(getStoredTheme);
    const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">(() => resolveEffectiveTheme(getStoredTheme()));

    useEffect(() => {
        const handler = (e: Event) => {
            const ce = e as CustomEvent<{ mode: ThemeMode; effective: "light" | "dark" }>;
            setThemeMode(ce.detail.mode);
            setEffectiveTheme(ce.detail.effective);
        };
        window.addEventListener("gbu_theme_change", handler);
        return () => window.removeEventListener("gbu_theme_change", handler);
    }, []);

    // Popover / Flyout state for collapsed rail & settings
    const [openFlyoutId, setOpenFlyoutId] = useState<string | null>(null);
    const [flyoutPosition, setFlyoutPosition] = useState<{ top: number; left: number } | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const flyoutRef = useRef<HTMLDivElement | null>(null);
    const settingsRef = useRef<HTMLDivElement | null>(null);

    // Collapsed sidebar state with persistent localStorage storage (Portainer-style)
    const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
        try {
            return localStorage.getItem("gbu_sidebar_collapsed") === "true";
        } catch {
            return false;
        }
    });

    const toggleSidebar = () => {
        setOpenFlyoutId(null);
        setIsSettingsOpen(false);
        setIsCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem("gbu_sidebar_collapsed", String(next));
            } catch {
                // ignore
            }
            return next;
        });
    };

    // Close flyout & settings dropdown when clicking outside or pressing Escape
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (flyoutRef.current && !flyoutRef.current.contains(target)) {
                setOpenFlyoutId(null);
            }
            if (settingsRef.current && !settingsRef.current.contains(target)) {
                setIsSettingsOpen(false);
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setOpenFlyoutId(null);
                setIsSettingsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    // Keyboard shortcut (Ctrl+B / Cmd+B) to toggle sidebar
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
                const target = e.target as HTMLElement | null;
                const isInput =
                    target?.tagName === "INPUT" ||
                    target?.tagName === "TEXTAREA" ||
                    target?.isContentEditable;
                if (!isInput) {
                    e.preventDefault();
                    toggleSidebar();
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Compute breadcrumbs trail based on active route and nav hierarchy
    const breadcrumbs = useMemo(() => {
        if (!nav || !active) return [];
        for (const item of nav) {
            if (item.id === active) {
                return [{ id: item.id, label: item.label }];
            }
            if (item.children) {
                const child = item.children.find((c) => c.id === active);
                if (child) {
                    return [
                        { id: item.id, label: item.label },
                        { id: child.id, label: child.label }
                    ];
                }
            }
        }
        return [{ id: active, label: active.charAt(0).toUpperCase() + active.slice(1) }];
    }, [nav, active]);

    // Auto-open group if active item is inside it
    useEffect(() => {
        if (nav && active) {
            nav.forEach((n) => {
                if (n.children?.some((c) => c.id === active)) {
                    setOpenGroups((prev) => ({ ...prev, [n.id]: true }));
                }
            });
        }
    }, [active, nav]);

    const toggleGroup = (id: string) => {
        setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleSelect = (id: string) => {
        onSelect?.(id);
        setIsMobileOpen(false);
    };

    const initials = user?.name
        ? user.name
              .split(" ")
              .map((w) => w.charAt(0))
              .join("")
              .slice(0, 2)
              .toUpperCase()
        : role?.slice(0, 2) || "GB";

    return (
        <div className="h-screen flex bg-slate-50 font-sans text-slate-900 overflow-hidden">
            {/* Mobile Sidebar Backdrop */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/60 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar: runs full height h-screen */}
            {nav && (
                <aside
                    className={`
                        fixed md:relative z-40 h-screen bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all duration-200 ease-in-out
                        ${isMobileOpen ? "translate-x-0 w-64 shadow-xl" : "-translate-x-full md:translate-x-0"}
                        ${isCollapsed ? "md:w-16" : "md:w-64"}
                    `}
                >
                    {/* Top Branding in Sidebar */}
                    <div
                        className={`h-14 border-b border-slate-200 flex items-center shrink-0 ${
                            isCollapsed ? "justify-center px-2" : "px-4 gap-3"
                        }`}
                    >
                        <div className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-2xs flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
                            <img
                                src="https://www.gbu.ac.in/Content/img/logo_gbu.png"
                                alt="GBU Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-bold text-slate-900 tracking-tight leading-tight truncate">
                                    GBU Attendance
                                </span>
                                <span className="text-[11px] font-medium text-slate-500 leading-tight truncate">
                                    Management console
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Navigation Body */}
                    {isCollapsed ? (
                        /* Slim Icon Rail View (Portainer-Style when closed) */
                        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1.5 custom-scrollbar flex flex-col items-center">
                            {nav.map((item) => {
                                if (item.children) {
                                    const hasActiveChild = item.children.some((c) => c.id === active);
                                    const isFlyoutOpen = openFlyoutId === item.id;

                                    return (
                                        <div key={item.id} className="relative flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    const maxMenuHeight = 440;
                                                    const top = Math.min(rect.top, Math.max(10, window.innerHeight - maxMenuHeight));
                                                    setFlyoutPosition({ top, left: rect.right + 8 });
                                                    setOpenFlyoutId(isFlyoutOpen ? null : item.id);
                                                }}
                                                className={`h-10 w-10 flex items-center justify-center rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                                                    hasActiveChild || isFlyoutOpen
                                                        ? "bg-blue-50 text-blue-900 font-semibold border border-blue-200 shadow-2xs"
                                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                                }`}
                                                title={`${item.label} (modules)`}
                                                aria-expanded={isFlyoutOpen}
                                            >
                                                {item.icon}
                                            </button>

                                            {/* Collapsed Rail Floating Submenu */}
                                            {isFlyoutOpen && flyoutPosition && (
                                                <div
                                                    ref={flyoutRef}
                                                    style={{ top: flyoutPosition.top, left: flyoutPosition.left }}
                                                    className="fixed w-60 bg-white border border-slate-200 shadow-xl rounded-lg p-1.5 z-50 text-xs max-h-[82vh] overflow-y-auto custom-scrollbar"
                                                >
                                                    <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-slate-100 mb-1 bg-slate-50/70 rounded-t">
                                                        <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-xs">
                                                            <span className="text-blue-700">{item.icon}</span>
                                                            <span>{item.label}</span>
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                            {item.children.length} modules
                                                        </span>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        {item.children.map((child) => {
                                                            const isChildActive = active === child.id;
                                                            return (
                                                                <button
                                                                    key={child.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        handleSelect(child.id);
                                                                        setOpenFlyoutId(null);
                                                                    }}
                                                                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 ${
                                                                        isChildActive
                                                                            ? "bg-blue-50 text-blue-900 font-semibold border-l-2 border-blue-600"
                                                                            : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                                                                    }`}
                                                                >
                                                                    {child.icon && (
                                                                        <span
                                                                            className={`shrink-0 ${
                                                                                isChildActive ? "text-blue-700" : "text-slate-500"
                                                                            }`}
                                                                        >
                                                                            {child.icon}
                                                                        </span>
                                                                    )}
                                                                    <span className="truncate">{child.label}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                const isCurrent = active === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => {
                                            setOpenFlyoutId(null);
                                            handleSelect(item.id);
                                        }}
                                        className={`h-10 w-10 flex items-center justify-center rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                                            isCurrent
                                                ? "bg-blue-50 text-blue-900 font-semibold border border-blue-200"
                                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                        }`}
                                        title={item.label}
                                    >
                                        {item.icon}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        /* Expanded Sidebar View */
                        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                            <div className="px-2.5 pb-1.5 pt-1 text-[11px] font-semibold text-slate-500">
                                Navigation
                            </div>

                            {nav.map((item) => {
                                if (item.children) {
                                    const isGroupOpen = openGroups[item.id] ?? false;
                                    const hasActiveChild = item.children.some((c) => c.id === active);

                                    return (
                                        <div key={item.id} className="space-y-0.5">
                                            <button
                                                onClick={() => toggleGroup(item.id)}
                                                className={`group w-full flex items-center justify-between h-9 px-3 rounded-md text-[13px] font-medium transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.99] ${
                                                    hasActiveChild
                                                        ? "text-blue-900 bg-blue-50/70 font-semibold"
                                                        : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    {item.icon && (
                                                        <span
                                                            className={`transition-colors shrink-0 ${
                                                                hasActiveChild
                                                                    ? "text-blue-700"
                                                                    : "text-slate-500 group-hover:text-slate-700"
                                                            }`}
                                                        >
                                                            {item.icon}
                                                        </span>
                                                    )}
                                                    <span className="truncate">{item.label}</span>
                                                </div>
                                                {isGroupOpen ? (
                                                    <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-600 shrink-0" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 shrink-0" />
                                                )}
                                            </button>

                                            <AnimatePresence initial={false}>
                                                {isGroupOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.15 }}
                                                        className="overflow-hidden ml-4 pl-2.5 border-l border-slate-200 space-y-0.5 pt-0.5"
                                                    >
                                                        {item.children.map((child) => {
                                                            const isChildActive = active === child.id;
                                                            return (
                                                                <button
                                                                    key={child.id}
                                                                    onClick={() => handleSelect(child.id)}
                                                                    className={`group relative w-full flex items-center h-8 px-2.5 rounded-md text-xs transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.99] ${
                                                                        isChildActive
                                                                            ? "bg-blue-50 text-blue-900 font-semibold"
                                                                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-normal"
                                                                    }`}
                                                                >
                                                                    {isChildActive && (
                                                                        <span
                                                                            aria-hidden="true"
                                                                            className="absolute -left-[11px] top-1.5 bottom-1.5 w-0.5 bg-blue-600 rounded-full"
                                                                        />
                                                                    )}
                                                                    {child.icon && (
                                                                        <span
                                                                            className={`mr-2.5 transition-colors shrink-0 ${
                                                                                isChildActive
                                                                                    ? "text-blue-700"
                                                                                    : "text-slate-400 group-hover:text-slate-600"
                                                                            }`}
                                                                        >
                                                                            {child.icon}
                                                                        </span>
                                                                    )}
                                                                    <span className="truncate">{child.label}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                }

                                const isCurrent = active === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleSelect(item.id)}
                                        className={`group relative w-full flex items-center h-9 px-3 rounded-md text-[13px] font-medium transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.99] ${
                                            isCurrent
                                                ? "bg-blue-50 text-blue-900 font-semibold"
                                                : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                                        }`}
                                    >
                                        {isCurrent && (
                                            <span
                                                aria-hidden="true"
                                                className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-sm bg-blue-600"
                                            />
                                        )}
                                        {item.icon && (
                                            <span
                                                className={`mr-2.5 transition-colors shrink-0 ${
                                                    isCurrent ? "text-blue-700" : "text-slate-500 group-hover:text-slate-700"
                                                }`}
                                            >
                                                {item.icon}
                                            </span>
                                        )}
                                        <span className="truncate">{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Sidebar Footer */}
                    {isCollapsed ? (
                        <div className="p-2 border-t border-slate-200 bg-slate-50/70 shrink-0 flex justify-center">
                            <button
                                onClick={() => setIsLogoutOpen(true)}
                                className="h-10 w-10 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                                title="Terminate session"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="p-3 border-t border-slate-200 bg-slate-50/70 shrink-0 space-y-2">
                            <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
                                <span className="font-medium truncate max-w-[130px]">
                                    {user?.name || "Authority User"}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700 font-medium capitalize">
                                    {role?.toLowerCase() || "admin"}
                                </span>
                            </div>
                            <button
                                onClick={() => setIsLogoutOpen(true)}
                                className="group w-full flex items-center justify-between h-8 px-2.5 rounded-md text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 active:scale-[0.99] cursor-pointer"
                            >
                                <span className="flex items-center gap-2">
                                    <LogOut className="h-3.5 w-3.5 text-slate-400 group-hover:text-red-600 transition-colors" />
                                    <span>Terminate session</span>
                                </span>
                                <span className="text-[10px] text-slate-400 group-hover:text-red-500 transition-colors">
                                    Exit
                                </span>
                            </button>
                        </div>
                    )}
                </aside>
            )}

            {/* Right Pane: Portainer-Style Top Bar + Main Scroll Content */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-slate-50">
                {/* Portainer-Style Top Bar */}
                <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 text-xs z-20">
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Sidebar Toggle Button (Portainer style) */}
                        <button
                            type="button"
                            onClick={toggleSidebar}
                            className="hidden md:inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                            title={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
                            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        >
                            {isCollapsed ? (
                                <PanelLeftOpen className="h-4.5 w-4.5 text-slate-700" />
                            ) : (
                                <PanelLeftClose className="h-4.5 w-4.5 text-slate-700" />
                            )}
                        </button>

                        {/* Mobile menu trigger */}
                        <button
                            type="button"
                            onClick={() => setIsMobileOpen(!isMobileOpen)}
                            className="md:hidden inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                            title="Toggle navigation"
                            aria-label="Toggle navigation"
                        >
                            <Menu className="h-5 w-5" />
                        </button>

                        <span className="text-slate-200 font-light select-none hidden sm:inline">|</span>

                        {/* Breadcrumbs Trail */}
                        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-slate-500 min-w-0 truncate">
                            <button
                                type="button"
                                onClick={() => handleSelect("dashboard")}
                                className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors cursor-pointer font-medium"
                                title="Home"
                            >
                                <Home className="h-3.5 w-3.5 text-slate-400" />
                                <span className="hidden sm:inline">Home</span>
                            </button>

                            {breadcrumbs.map((crumb, idx) => (
                                <div key={crumb.id || idx} className="flex items-center gap-1.5 min-w-0">
                                    <ChevronRight className="h-3 w-3 text-slate-300 shrink-0 select-none" />
                                    <span
                                        className={`truncate ${
                                            idx === breadcrumbs.length - 1
                                                ? "font-semibold text-slate-900"
                                                : "text-slate-500 hover:text-slate-900 transition-colors cursor-default"
                                        }`}
                                    >
                                        {crumb.label}
                                    </span>
                                </div>
                            ))}
                        </nav>
                    </div>

                    {/* Right: Authority Role & Settings & Profile */}
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <NotificationBell />
                        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
                            <Shield className="h-3.5 w-3.5 text-slate-500" />
                            <span className="capitalize">{role?.toLowerCase() || "guest"}</span>
                        </div>

                        {/* Quick Theme Toggle Button */}
                        <button
                            type="button"
                            onClick={() => toggleTheme()}
                            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer"
                            title={effectiveTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                            aria-label="Toggle dark mode"
                        >
                            {effectiveTheme === "dark" ? (
                                <Sun className="h-4 w-4 text-amber-400 motion-safe:transition-transform motion-safe:duration-300 hover:rotate-45" />
                            ) : (
                                <Moon className="h-4 w-4 text-slate-600 motion-safe:transition-transform motion-safe:duration-300 hover:-rotate-12" />
                            )}
                        </button>

                        <div className="relative" ref={settingsRef}>
                            <button
                                type="button"
                                onClick={() => setIsSettingsOpen((prev) => !prev)}
                                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer"
                                title="Settings & Profile"
                                aria-expanded={isSettingsOpen}
                            >
                                <Settings className="h-4 w-4 motion-safe:transition-transform motion-safe:duration-300 hover:rotate-45" />
                            </button>

                            {isSettingsOpen && (
                                <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-slate-200 shadow-xl rounded-lg p-1.5 z-50 text-slate-800 text-xs animate-in fade-in-50 zoom-in-95 duration-100">
                                    <div className="px-3 py-2 mb-1 bg-slate-50 rounded-md border border-slate-100">
                                        <div className="p-0 text-xs font-semibold text-slate-900 truncate">
                                            {user?.name || "Authority User"}
                                        </div>
                                        <p className="text-[11px] text-slate-500 font-mono truncate">{user?.email}</p>
                                        <div className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-medium capitalize">
                                            {role?.toLowerCase() || "admin"} portal
                                        </div>
                                    </div>

                                    <div className="my-1 border-t border-slate-100" />

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsSettingsOpen(false);
                                            setIsProfileOpen(true);
                                        }}
                                        className="w-full flex items-center gap-2.5 px-2.5 py-2 text-slate-700 hover:bg-slate-100 rounded-md transition-colors text-xs font-medium cursor-pointer text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                                    >
                                        <User size={15} className="text-slate-500 shrink-0" />
                                        <span>User profile & roles</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsSettingsOpen(false);
                                            setIsFontSettingsOpen(true);
                                        }}
                                        className="w-full flex items-center gap-2.5 px-2.5 py-2 text-slate-700 hover:bg-slate-100 rounded-md transition-colors text-xs font-medium cursor-pointer text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                                    >
                                        <Type size={15} className="text-slate-500 shrink-0" />
                                        <span>Font & display settings</span>
                                    </button>

                                    {/* Appearance Theme Selector */}
                                    <div className="px-2.5 py-2 mt-1 bg-slate-50 rounded-md border border-slate-100">
                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                            <span>Theme Mode</span>
                                            <span className="text-[9px] font-mono text-slate-400 capitalize">{themeMode}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1 bg-slate-200/60 p-0.5 rounded">
                                            <button
                                                type="button"
                                                onClick={() => saveTheme("light")}
                                                className={`py-1 text-[11px] font-medium rounded flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                                                    themeMode === "light"
                                                        ? "bg-white text-slate-900 shadow-2xs font-semibold"
                                                        : "text-slate-600 hover:text-slate-900"
                                                }`}
                                                title="Light theme"
                                            >
                                                <Sun size={12} />
                                                <span>Light</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => saveTheme("dark")}
                                                className={`py-1 text-[11px] font-medium rounded flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                                                    themeMode === "dark"
                                                        ? "bg-white text-slate-900 shadow-2xs font-semibold"
                                                        : "text-slate-600 hover:text-slate-900"
                                                }`}
                                                title="Dark theme"
                                            >
                                                <Moon size={12} />
                                                <span>Dark</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => saveTheme("system")}
                                                className={`py-1 text-[11px] font-medium rounded flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                                                    themeMode === "system"
                                                        ? "bg-white text-slate-900 shadow-2xs font-semibold"
                                                        : "text-slate-600 hover:text-slate-900"
                                                }`}
                                                title="Follow system OS setting"
                                            >
                                                <Monitor size={12} />
                                                <span>Auto</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="my-1 border-t border-slate-100" />

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsSettingsOpen(false);
                                            setIsLogoutOpen(true);
                                        }}
                                        className="w-full flex items-center gap-2.5 px-2.5 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors text-xs font-medium cursor-pointer text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                                    >
                                        <LogOut size={15} className="shrink-0" />
                                        <span>Terminate session</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Initials Avatar Button */}
                        <button
                            onClick={() => setIsProfileOpen(true)}
                            className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                            title="View Profile"
                        >
                            {initials}
                        </button>
                    </div>
                </header>

                {/* Main Content Pane */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50 custom-scrollbar">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {children}
                    </div>
                </main>
            </div>

            {/* Modals */}
            <LogoutConfirmModal isOpen={isLogoutOpen} onClose={() => setIsLogoutOpen(false)} />
            <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
            <FontSettingsModal isOpen={isFontSettingsOpen} onClose={() => setIsFontSettingsOpen(false)} />
        </div>
    );
}
