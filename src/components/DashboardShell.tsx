import { useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";

export type NavItem = {
    id: string;
    label: string;
    icon?: ReactNode;
    children?: NavItem[];
};

type Props = {
    title: string;
    children?: ReactNode;
    nav?: NavItem[]; // an item with `children` renders as a collapsible group
    active?: string;
    onSelect?: (id: string) => void;
};

// SVG Components
const Chevron = ({ open }: { open: boolean }) => (
    <svg
        className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ease-in-out ${open ? "rotate-90 text-slate-200" : ""
            }`}
        viewBox="0 0 20 20"
        fill="currentColor"
    >
        <path
            fillRule="evenodd"
            d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
            clipRule="evenodd"
        />
    </svg>
);

const LogOutIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

const AppLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

const MenuIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

const CloseIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export function DashboardShell({ title, children, nav, active, onSelect }: Props) {
    const { logout } = useAuth();
    const [open, setOpen] = useState<Record<string, boolean>>({});
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Closed by default; opens itself when the active page lives inside the group
    const isOpen = (n: NavItem) => open[n.id] ?? n.children?.some((c) => c.id === active) ?? false;

    // Auto-close mobile menu on selection
    const handleSelect = (id: string) => {
        onSelect?.(id);
        setIsMobileMenuOpen(false);
    };

    const item = (n: NavItem, nested = false) => {
        const on = n.id === active;
        return (
            <button
                key={n.id}
                onClick={() => handleSelect(n.id)}
                className={`group relative flex w-full items-center gap-2.5 rounded-xl text-xs font-medium transition-all duration-200 py-2.5 ${nested ? "pl-9 pr-3" : "px-3"
                    } ${on
                        ? "bg-blue-600/20 text-blue-400 font-semibold shadow-inner"
                        : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100 hover:translate-x-0.5"
                    }`}
            >
                {/* Glowing left edge bar for active state */}
                {on && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                )}
                {n.icon && <span className="shrink-0">{n.icon}</span>}
                <span className="truncate">{n.label}</span>
            </button>
        );
    };

    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* Sidebar Branding */}
            <div className="flex items-center gap-3 px-3 py-4 mb-3 border-b border-slate-800/80">
                <div className="p-2 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-900/30">
                    <AppLogo className="w-5 h-5" />
                </div>
                <div>
                    <div className="text-sm font-bold text-slate-100 tracking-tight">Attendance System</div>
                    <div className="text-[10px] font-medium text-slate-400">Admin Portal</div>
                </div>
            </div>

            {/* Navigation List */}
            <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1 custom-scrollbar">
                {nav?.map((n) =>
                    n.children ? (
                        <div key={n.id} className="space-y-1">
                            <button
                                onClick={() => setOpen((p) => ({ ...p, [n.id]: !isOpen(n) }))}
                                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-800/70 hover:text-slate-200 transition-all duration-200"
                            >
                                <div className="flex items-center gap-2.5">
                                    {n.icon && <span>{n.icon}</span>}
                                    <span className="uppercase tracking-wider text-[11px] font-bold text-slate-400/90">{n.label}</span>
                                </div>
                                <Chevron open={isOpen(n)} />
                            </button>

                            {/* Animated Submenu Grid Accordion */}
                            <div
                                className={`grid transition-all duration-300 ease-in-out ${isOpen(n) ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                                    }`}
                            >
                                <div className="overflow-hidden space-y-1">
                                    {n.children.map((c) => item(c, true))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        item(n)
                    )
                )}
            </nav>

            {/* Bottom Info / Status */}
            <div className="pt-3 border-t border-slate-800/80 mt-auto">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/40 text-[11px] text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>System Status: <strong className="text-slate-300 font-medium">Online</strong></span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans antialiased text-slate-800">
            {/* Desktop Sidebar */}
            {nav && (
                <aside className="hidden lg:block w-64 shrink-0 bg-slate-900 p-4 sticky top-0 h-screen border-r border-slate-800 shadow-xl">
                    {sidebarContent}
                </aside>
            )}

            {/* Mobile Navigation Drawer */}
            {nav && (
                <>
                    {/* Backdrop */}
                    {isMobileMenuOpen && (
                        <div
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
                        />
                    )}

                    {/* Mobile Slide-out Drawer */}
                    <aside
                        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 p-4 transform transition-transform duration-300 ease-in-out lg:hidden ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                            }`}
                    >
                        <div className="flex justify-end mb-2">
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        {sidebarContent}
                    </aside>
                </>
            )}

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 flex flex-col min-h-screen">
                {/* Header Navbar */}
                <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
                    <div className="flex items-center gap-3">
                        {/* Mobile Menu Toggle Button */}
                        {nav && (
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden transition-colors"
                                aria-label="Toggle Navigation"
                            >
                                <MenuIcon className="w-5 h-5" />
                            </button>
                        )}

                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1>
                        </div>
                    </div>

                    {/* Top Bar Actions */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={logout}
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-all duration-200 shadow-2xs"
                        >
                            <LogOutIcon className="w-3.5 h-3.5" />
                            <span>Log out</span>
                        </button>
                    </div>
                </header>

                {/* Page Content Container */}
                <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
                    {children}
                </div>
            </main>
        </div>
    );
}