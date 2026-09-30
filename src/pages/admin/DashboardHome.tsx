import { useEffect, useState, type ReactNode } from "react"; 
import { listUsers, listDepartments, listProgrammes, listBatches } from "../../api/admin";
import type { User } from "../../api/admin";

type CardData = {
    key: string;
    label: string;
    value: number | null;
    subtitle: string;
    icon: (props: { className?: string }) => ReactNode;
    badgeBg: string;
    iconColor: string;
    hoverBorder: string;
};

// Custom SVG Icons
const UsersIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const UserCheckIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

const BuildingIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

const AcademicCapIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
);

const LayersIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
);

const AlertTriangleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

const CloseIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const CARD_THEMES: Record<string, Omit<CardData, "key" | "label" | "value">> = {
    "Users": {
        subtitle: "Total registered users",
        icon: UsersIcon,
        badgeBg: "bg-blue-50 group-hover:bg-blue-100/80",
        iconColor: "text-blue-600",
        hoverBorder: "hover:border-blue-200",
    },
    "Active Users": {
        subtitle: "Currently active accounts",
        icon: UserCheckIcon,
        badgeBg: "bg-emerald-50 group-hover:bg-emerald-100/80",
        iconColor: "text-emerald-600",
        hoverBorder: "hover:border-emerald-200",
    },
    "Departments": {
        subtitle: "Academic departments",
        icon: BuildingIcon,
        badgeBg: "bg-violet-50 group-hover:bg-violet-100/80",
        iconColor: "text-violet-600",
        hoverBorder: "hover:border-violet-200",
    },
    "Programmes": {
        subtitle: "Offered study programmes",
        icon: AcademicCapIcon,
        badgeBg: "bg-amber-50 group-hover:bg-amber-100/80",
        iconColor: "text-amber-600",
        hoverBorder: "hover:border-amber-200",
    },
    "Batches": {
        subtitle: "Active student batches",
        icon: LayersIcon,
        badgeBg: "bg-indigo-50 group-hover:bg-indigo-100/80",
        iconColor: "text-indigo-600",
        hoverBorder: "hover:border-indigo-200",
    },
};

export default function DashboardHome() {
    const [cards, setCards] = useState<CardData[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showErrorBanner, setShowErrorBanner] = useState(true);

    useEffect(() => {
        const jobs: [string, Promise<unknown[]>][] = [
            ["Users", listUsers()],
            ["Departments", listDepartments()],
            ["Programmes", listProgrammes()],
            ["Batches", listBatches()],
        ];

        Promise.allSettled(jobs.map(([, p]) => p)).then((res) => {
            const out: CardData[] = [];
            const errs: string[] = [];

            res.forEach((r, i) => {
                const name = jobs[i][0];
                const theme = CARD_THEMES[name];

                if (r.status === "rejected") {
                    errs.push(`${name}: ${r.reason instanceof Error ? r.reason.message : "failed to fetch"}`);
                    out.push({ key: name, label: name, value: null, ...theme });
                    if (name === "Users") {
                        out.push({
                            key: "Active Users",
                            label: "Active Users",
                            value: null,
                            ...CARD_THEMES["Active Users"],
                        });
                    }
                    return;
                }

                out.push({
                    key: name,
                    label: name,
                    value: r.value.length,
                    ...theme,
                });

                if (name === "Users") {
                    const activeCount = (r.value as User[]).filter((u) => u.is_active).length;
                    out.push({
                        key: "Active Users",
                        label: "Active Users",
                        value: activeCount,
                        ...CARD_THEMES["Active Users"],
                    });
                }
            });

            setCards(out);
            setErrors(errs);
            setIsLoading(false);
        });
    }, []);

    return (
        <div className="space-y-6">
            {/* Error Banner */}
            {errors.length > 0 && showErrorBanner && (
                <div className="relative flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50/90 text-red-900 shadow-sm transition-all duration-300 animate-in fade-in">
                    <div className="p-1 rounded-lg bg-red-100 text-red-600 shrink-0 mt-0.5">
                        <AlertTriangleIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-sm">
                        <h4 className="font-semibold text-red-900">Some dashboard data failed to load</h4>
                        <ul className="mt-1.5 list-disc pl-4 space-y-1 text-xs text-red-700">
                            {errors.map((e) => (
                                <li key={e}>{e}</li>
                            ))}
                        </ul>
                    </div>
                    <button
                        onClick={() => setShowErrorBanner(false)}
                        className="p-1 rounded-md text-red-400 hover:text-red-700 hover:bg-red-100 transition-colors"
                        title="Dismiss"
                    >
                        <CloseIcon className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Dashboard Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {isLoading ? (
                    // Skeleton Loaders
                    Array.from({ length: 5 }).map((_, idx) => (
                        <div
                            key={idx}
                            className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm animate-pulse space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <div className="h-3.5 bg-slate-200 rounded w-20"></div>
                                <div className="w-9 h-9 bg-slate-200 rounded-xl"></div>
                            </div>
                            <div className="h-8 bg-slate-200 rounded w-16"></div>
                            <div className="h-3 bg-slate-100 rounded w-28"></div>
                        </div>
                    ))
                ) : (
                    // Loaded Metric Cards
                    cards.map((c, index) => {
                        const IconComponent = c.icon;
                        return (
                            <div
                                key={c.key}
                                style={{
                                    animationDelay: `${index * 75}ms`,
                                    animationFillMode: "backwards",
                                }}
                                className={`group bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 ${c.hoverBorder} flex flex-col justify-between`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        {c.label}
                                    </span>
                                    <div
                                        className={`p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110 ${c.badgeBg} ${c.iconColor}`}
                                    >
                                        <IconComponent className="w-5 h-5" />
                                    </div>
                                </div>

                                <div className="mt-3">
                                    <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                        {c.value !== null ? c.value.toLocaleString() : "—"}
                                    </div>
                                    <div className="text-xs font-medium text-slate-400 mt-1 transition-colors group-hover:text-slate-500">
                                        {c.subtitle}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}