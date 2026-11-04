/* Hallmark · app: admin-dashboard · genre: modern-minimal · tone: institutional · v2.0.0 */
import { useEffect, useState } from "react";
import {
    Activity,
    Calendar,
    RefreshCw,
    ShieldAlert,
    Clock,
    Building2,
    BookOpen,
    Layers,
    FolderKanban,
    CheckCircle2,
    ArrowUpRight,
    AlertCircle,
    UserCheck,
    GraduationCap
} from "lucide-react";
import {
    getDashboardStats,
    getActionItems,
    getAttendancePulse,
    getSetupHealth,
    listDepartments,
    listProgrammes,
    listBatches,
    listOfferings,
    listTerms
} from "../../api/admin";
import type { DashboardStats, ActionItems, AttendancePulse, SetupHealth } from "../../api/admin";

interface DashboardHomeProps {
    onNavigate?: (tabId: string) => void;
}

export default function DashboardHome({ onNavigate }: DashboardHomeProps) {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [actionItems, setActionItems] = useState<ActionItems | null>(null);
    const [pulse, setPulse] = useState<AttendancePulse | null>(null);
    const [setupHealth, setSetupHealth] = useState<SetupHealth | null>(null);
    const [deptCount, setDeptCount] = useState<number>(0);
    const [progCount, setProgCount] = useState<number>(0);
    const [batchCount, setBatchCount] = useState<number>(0);
    const [offeringCount, setOfferingCount] = useState<number>(0);
    const [termCount, setTermCount] = useState<number>(0);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const loadAll = async () => {
        setFetchError(null);
        try {
            const [
                statsRes,
                actionsRes,
                pulseRes,
                healthRes,
                depts,
                progs,
                batches,
                offerings,
                terms
            ] = await Promise.allSettled([
                getDashboardStats(),
                getActionItems(),
                getAttendancePulse(),
                getSetupHealth(),
                listDepartments(),
                listProgrammes(),
                listBatches(),
                listOfferings(),
                listTerms()
            ]);

            if (statsRes.status === "fulfilled") setStats(statsRes.value);
            if (actionsRes.status === "fulfilled") setActionItems(actionsRes.value);
            if (pulseRes.status === "fulfilled") setPulse(pulseRes.value);
            if (healthRes.status === "fulfilled") setSetupHealth(healthRes.value);
            if (depts.status === "fulfilled") setDeptCount(depts.value?.length || 0);
            if (progs.status === "fulfilled") setProgCount(progs.value?.length || 0);
            if (batches.status === "fulfilled") setBatchCount(batches.value?.length || 0);
            if (offerings.status === "fulfilled") setOfferingCount(offerings.value?.length || 0);
            if (terms.status === "fulfilled") setTermCount(terms.value?.length || 0);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to load dashboard data.";
            setFetchError(msg);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadAll();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        loadAll();
    };

    const totalActionCount = actionItems
        ? actionItems.pending_leave_requests + (actionItems.unassigned_courses ?? 0)
        : 0;

    return (
        <div className="space-y-6">
            {/* Top Operational Header */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                        Institutional Overview
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        University registry status, live attendance metrics, and operational action queue.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                    {setupHealth?.active_term_name && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 text-xs font-medium shadow-2xs">
                            <Calendar className="h-3.5 w-3.5 text-blue-700 shrink-0" aria-hidden="true" />
                            <span>{setupHealth.active_term_name}</span>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={refreshing || loading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 hover:text-slate-900 text-xs font-medium shadow-2xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Refresh operational metrics"
                    >
                        <RefreshCw
                            className={`h-3.5 w-3.5 text-slate-500 ${refreshing ? "motion-safe:animate-spin text-blue-600" : ""}`}
                            aria-hidden="true"
                        />
                        <span>{refreshing ? "Refreshing…" : "Refresh"}</span>
                    </button>
                </div>
            </header>

            {/* Error Banner */}
            {fetchError && (
                <div
                    role="alert"
                    className="p-3.5 rounded-md border border-red-200 bg-red-50 text-red-800 text-xs flex items-center justify-between gap-3"
                >
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600 shrink-0" aria-hidden="true" />
                        <span>{fetchError}</span>
                    </div>
                    <button
                        type="button"
                        onClick={loadAll}
                        className="font-semibold underline hover:no-underline active:text-red-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Metric Hairline Ledger */}
            <section aria-labelledby="primary-metrics-heading">
                <h2 id="primary-metrics-heading" className="sr-only">
                    Primary Operational Metrics
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 rounded-lg overflow-hidden border border-slate-200 shadow-2xs">
                    {/* Stat 1: Live Attendance Rate */}
                    <div className="bg-white p-5 flex flex-col justify-between">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-slate-500">
                                Today’s attendance rate
                            </span>
                            <Activity className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl sm:text-3xl font-semibold tabular-nums text-slate-900 tracking-tight">
                                {loading ? (
                                    <span className="inline-block w-16 h-8 bg-slate-200 rounded motion-safe:animate-pulse motion-reduce:bg-slate-200" />
                                ) : pulse ? (
                                    `${pulse.overall_attendance_today}%`
                                ) : (
                                    "—"
                                )}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                                {loading ? (
                                    <span className="inline-block w-28 h-3.5 bg-slate-100 rounded motion-safe:animate-pulse motion-reduce:bg-slate-100" />
                                ) : (
                                    `${pulse?.classes_held_today ?? 0} class sessions marked`
                                )}
                            </div>
                        </div>
                        <div className="mt-3.5 w-full bg-slate-100 rounded-full h-1 overflow-hidden" aria-hidden="true">
                            <div
                                className="bg-blue-600 h-1 rounded-full transition-transform origin-left duration-300 motion-reduce:transition-none"
                                style={{ transform: `scaleX(${Math.min(pulse?.overall_attendance_today || 0, 100) / 100})` }}
                            />
                        </div>
                    </div>

                    {/* Stat 2: Enrolled Students */}
                    <div className="bg-white p-5 flex flex-col justify-between">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-slate-500">
                                Enrolled students
                            </span>
                            <GraduationCap className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl sm:text-3xl font-semibold tabular-nums text-slate-900 tracking-tight">
                                {loading ? (
                                    <span className="inline-block w-20 h-8 bg-slate-200 rounded motion-safe:animate-pulse motion-reduce:bg-slate-200" />
                                ) : (
                                    stats?.total_students.toLocaleString() ?? "—"
                                )}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                                {loading ? (
                                    <span className="inline-block w-32 h-3.5 bg-slate-100 rounded motion-safe:animate-pulse motion-reduce:bg-slate-100" />
                                ) : (
                                    `${stats?.total_users ?? 0} registered user profiles`
                                )}
                            </div>
                        </div>
                        <div className="mt-3.5 text-xs text-slate-400">
                            Active in university portal
                        </div>
                    </div>

                    {/* Stat 3: Teaching Faculty */}
                    <div className="bg-white p-5 flex flex-col justify-between">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-slate-500">
                                Teaching faculty
                            </span>
                            <UserCheck className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl sm:text-3xl font-semibold tabular-nums text-slate-900 tracking-tight">
                                {loading ? (
                                    <span className="inline-block w-16 h-8 bg-slate-200 rounded motion-safe:animate-pulse motion-reduce:bg-slate-200" />
                                ) : (
                                    stats?.total_teachers.toLocaleString() ?? "—"
                                )}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                                {loading ? (
                                    <span className="inline-block w-28 h-3.5 bg-slate-100 rounded motion-safe:animate-pulse motion-reduce:bg-slate-100" />
                                ) : (
                                    `${stats?.total_coordinators ?? 0} coordinators & HODs`
                                )}
                            </div>
                        </div>
                        <div className="mt-3.5 text-xs text-slate-400">
                            Course allocation verified
                        </div>
                    </div>

                    {/* Stat 4: Attendance Submission Activity */}
                    <div
                        onClick={() => onNavigate?.("logs")}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onNavigate?.("logs");
                            }
                        }}
                        tabIndex={0}
                        role="button"
                        className="bg-white p-5 flex flex-col justify-between cursor-pointer hover:bg-slate-50/70 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        aria-label="View live attendance submission logs"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-slate-500">
                                Attendance activity
                            </span>
                            <Clock className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl sm:text-3xl font-semibold tabular-nums text-slate-900 tracking-tight flex items-baseline gap-2">
                                {loading ? (
                                    <span className="inline-block w-14 h-8 bg-slate-200 rounded motion-safe:animate-pulse motion-reduce:bg-slate-200" />
                                ) : (
                                    (pulse?.classes_held_today ?? 0).toLocaleString()
                                )}
                                <span className="text-xs font-normal text-slate-500">sessions today</span>
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                                {loading ? (
                                    <span className="inline-block w-32 h-3.5 bg-slate-100 rounded motion-safe:animate-pulse motion-reduce:bg-slate-100" />
                                ) : (
                                    `${pulse?.overall_attendance_today ?? 0}% overall turnout`
                                )}
                            </div>
                        </div>
                        <div className="mt-3.5 text-xs text-blue-600 font-medium flex items-center gap-1">
                            <span>View logs</span>
                            <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Signature Section: Administrative Action Triage Ledger */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left 2 Cols: Unified Action Queue Ledger */}
                <section
                    aria-labelledby="action-queue-heading"
                    className="lg:col-span-2 rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs"
                >
                    <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50/60">
                        <div className="flex items-center gap-2.5">
                            <ShieldAlert className="h-4 w-4 text-slate-700 shrink-0" aria-hidden="true" />
                            <div>
                                <h2 id="action-queue-heading" className="text-sm font-semibold text-slate-900">
                                    Administrative Triage Queue
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Items requiring institutional verification or departmental resolution.
                                </p>
                            </div>
                        </div>
                        {totalActionCount > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                {totalActionCount} pending
                            </span>
                        )}
                    </div>

                    <div className="divide-y divide-slate-100">
                        {/* Triage Row 1: Medical Leave Requests */}
                        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-900">
                                        Medical & Official Leave Requests
                                    </span>
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                        Document review
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500">
                                    Student medical certificates and institutional representations uploaded via app.
                                </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
                                <span className="text-base font-semibold tabular-nums text-slate-900 min-w-8 text-right">
                                    {loading ? "…" : (actionItems?.pending_leave_requests ?? 0)}
                                </span>
                                <span className="text-xs text-slate-400 px-3 py-1.5">
                                    HOD Queue
                                </span>
                            </div>
                        </div>

                        {/* Triage Row 2: Unassigned Course Offerings */}
                        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-900">
                                        Unassigned Course Offerings
                                    </span>
                                    {(actionItems?.unassigned_courses ?? 0) > 0 ? (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">
                                            Needs faculty
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            All assigned
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500">
                                    Class sections in the active semester without an allotted instructor.
                                </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
                                <span className="text-base font-semibold tabular-nums text-slate-900 min-w-8 text-right">
                                    {loading ? "…" : (actionItems?.unassigned_courses ?? 0)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => onNavigate?.("teacher-allotments")}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-xs font-medium text-slate-700 shadow-2xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                                >
                                    <span>Allotments</span>
                                    <ArrowUpRight className="h-3 w-3 text-slate-400" aria-hidden="true" />
                                </button>
                            </div>
                        </div>

                        {/* Triage Row 4: Unmapped Student Registrations */}
                        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-900">
                                        Unmapped Student Profiles
                                    </span>
                                    {(actionItems?.unmapped_students ?? 0) > 0 ? (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                            Missing subjects
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            Fully mapped
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500">
                                    Enrolled students without subject or course-offering mapping this semester.
                                </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
                                <span className="text-base font-semibold tabular-nums text-slate-900 min-w-8 text-right">
                                    {loading ? "…" : (actionItems?.unmapped_students ?? 0)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => onNavigate?.("students")}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-xs font-medium text-slate-700 shadow-2xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                                >
                                    <span>Students</span>
                                    <ArrowUpRight className="h-3 w-3 text-slate-400" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Right Col: Academic Entity Hierarchy Table */}
                <section
                    aria-labelledby="hierarchy-heading"
                    className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs"
                >
                    <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/60">
                        <h2 id="hierarchy-heading" className="text-sm font-semibold text-slate-900">
                            Academic Hierarchy
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Configured entities across the university registry.
                        </p>
                    </div>

                    <table className="w-full text-xs text-left">
                        <caption className="sr-only">Academic Hierarchy Counts</caption>
                        <thead>
                            <tr className="border-b border-slate-100 text-slate-400">
                                <th scope="col" className="py-2.5 px-4 font-medium">Entity</th>
                                <th scope="col" className="py-2.5 px-4 font-medium text-right">Count</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <th scope="row" className="py-2.5 px-4 font-normal text-slate-700 flex items-center gap-2">
                                    <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                                    <span>Departments</span>
                                </th>
                                <td className="py-2.5 px-4 text-right font-semibold tabular-nums text-slate-900">
                                    {loading ? "…" : deptCount}
                                </td>
                            </tr>
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <th scope="row" className="py-2.5 px-4 font-normal text-slate-700 flex items-center gap-2">
                                    <BookOpen className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                                    <span>Programmes</span>
                                </th>
                                <td className="py-2.5 px-4 text-right font-semibold tabular-nums text-slate-900">
                                    {loading ? "…" : progCount}
                                </td>
                            </tr>
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <th scope="row" className="py-2.5 px-4 font-normal text-slate-700 flex items-center gap-2">
                                    <Layers className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                                    <span>Batches</span>
                                </th>
                                <td className="py-2.5 px-4 text-right font-semibold tabular-nums text-slate-900">
                                    {loading ? "…" : batchCount}
                                </td>
                            </tr>
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <th scope="row" className="py-2.5 px-4 font-normal text-slate-700 flex items-center gap-2">
                                    <FolderKanban className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                                    <span>Course offerings</span>
                                </th>
                                <td className="py-2.5 px-4 text-right font-semibold tabular-nums text-slate-900">
                                    {loading ? "…" : offeringCount}
                                </td>
                            </tr>
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <th scope="row" className="py-2.5 px-4 font-normal text-slate-700 flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                                    <span>Semesters</span>
                                </th>
                                <td className="py-2.5 px-4 text-right font-semibold tabular-nums text-slate-900">
                                    {loading ? "…" : termCount}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="p-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                        <span>University timetable schema in sync</span>
                    </div>
                </section>
            </div>
        </div>
    );
}
