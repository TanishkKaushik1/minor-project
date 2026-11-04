// src/pages/admin/LogsPage.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import {
    Activity,
    Search,
    Loader2,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    ArrowRight,
    Users,
    CheckCircle2,
    XCircle,
    Eye,
    X,
    Radio,
    FileText,
    BookOpen,
    Clock
} from "lucide-react";
import { DatePicker } from "../../components/ui/date-picker";
import { PageSizeDropdown } from "../../components/ui/page-size-dropdown";
import {
    listAttendanceSessions,
    getSessionDetail,
    listAuditLogs
} from "../../api/admin";
import type {
    AttendanceSessionItem,
    SessionStudentRecord,
    AuditLogItem
} from "../../api/admin";

export default function LogsPage() {
    // Top-level tab: "sessions" (Live Marked Attendance) | "audit" (Status Modifications & Overrides)
    const [activeTab, setActiveTab] = useState<"sessions" | "audit">("sessions");

    /* =====================================================================
     * TAB 1: LIVE ATTENDANCE SESSIONS STATE
     * ===================================================================== */
    const [sessions, setSessions] = useState<AttendanceSessionItem[]>([]);
    const [sessionsTotal, setSessionsTotal] = useState(0);
    const [sessionsPage, setSessionsPage] = useState(1);
    const [sessionsPageSize, setSessionsPageSize] = useState(25);
    const [sessionsLoading, setSessionsLoading] = useState(true);
    const [summaryToday, setSummaryToday] = useState<{
        sessions_today: number;
        students_marked_today: number;
        present_today: number;
        overall_percentage_today: number;
    } | null>(null);

    // Filters for Sessions
    const [sessionSearch, setSessionSearch] = useState("");
    const [sessionDate, setSessionDate] = useState("");

    /* =====================================================================
     * ROSTER MODAL STATE (FOR SESSION DRILL-DOWN)
     * ===================================================================== */
    const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
    const [rosterSession, setRosterSession] = useState<AttendanceSessionItem | null>(null);
    const [rosterRecords, setRosterRecords] = useState<SessionStudentRecord[]>([]);
    const [rosterLoading, setRosterLoading] = useState(false);
    const [rosterFilter, setRosterFilter] = useState<"ALL" | "PRESENT" | "ABSENT" | "LEAVE">("ALL");
    const [rosterSearch, setRosterSearch] = useState("");

    /* =====================================================================
     * TAB 2: AUDIT LOGS STATE (HISTORICAL OVERRIDES)
     * ===================================================================== */
    const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
    const [auditTotal, setAuditTotal] = useState(0);
    const [auditPage, setAuditPage] = useState(1);
    const [auditPageSize, setAuditPageSize] = useState(50);
    const [auditSearch, setAuditSearch] = useState("");
    const [auditLoading, setAuditLoading] = useState(false);

    /* =====================================================================
     * DATA FETCHING: SESSIONS
     * ===================================================================== */
    const fetchSessions = useCallback(async () => {
        setSessionsLoading(true);
        try {
            const res = await listAttendanceSessions(sessionsPage, sessionsPageSize, {
                date: sessionDate || undefined,
                search: sessionSearch.trim() || undefined,
            });
            setSessions(res.items ?? []);
            setSessionsTotal(res.total ?? 0);
            if (res.summary_today) {
                setSummaryToday(res.summary_today);
            }
        } catch (err) {
            console.error("Failed to load attendance sessions:", err);
        } finally {
            setSessionsLoading(false);
        }
    }, [sessionsPage, sessionsPageSize, sessionDate, sessionSearch]);

    useEffect(() => {
        if (activeTab === "sessions") {
            fetchSessions();
        }
    }, [fetchSessions, activeTab]);

    /* =====================================================================
     * DATA FETCHING: AUDIT LOGS
     * ===================================================================== */
    const fetchAuditLogs = useCallback(async () => {
        setAuditLoading(true);
        try {
            const res = await listAuditLogs(auditPage, auditPageSize);
            setAuditLogs(res.items ?? []);
            setAuditTotal(res.total ?? 0);
        } catch (err) {
            console.error("Failed to load audit logs:", err);
        } finally {
            setAuditLoading(false);
        }
    }, [auditPage, auditPageSize]);

    useEffect(() => {
        if (activeTab === "audit") {
            fetchAuditLogs();
        }
    }, [fetchAuditLogs, activeTab]);

    /* =====================================================================
     * ROSTER MODAL DRILL-DOWN
     * ===================================================================== */
    const openRosterModal = async (session: AttendanceSessionItem) => {
        setSelectedSessionId(session.id);
        setRosterSession(session);
        setRosterFilter("ALL");
        setRosterSearch("");
        setRosterLoading(true);
        try {
            const res = await getSessionDetail(session.id);
            setRosterSession(res.session);
            setRosterRecords(res.records ?? []);
        } catch (err) {
            console.error("Failed to fetch session detail:", err);
        } finally {
            setRosterLoading(false);
        }
    };

    const closeRosterModal = () => {
        setSelectedSessionId(null);
        setRosterSession(null);
        setRosterRecords([]);
    };

    const filteredRosterRecords = useMemo(() => {
        return rosterRecords.filter((rec) => {
            if (rosterFilter !== "ALL" && rec.status.toUpperCase() !== rosterFilter) {
                return false;
            }
            if (!rosterSearch.trim()) return true;
            const q = rosterSearch.toLowerCase();
            return (
                rec.roll_number?.toLowerCase().includes(q) ||
                rec.student_name?.toLowerCase().includes(q) ||
                rec.student_email?.toLowerCase().includes(q)
            );
        });
    }, [rosterRecords, rosterFilter, rosterSearch]);

    /* =====================================================================
     * FILTERED AUDIT LOGS
     * ===================================================================== */
    const filteredAuditLogs = useMemo(() => {
        if (!auditSearch.trim()) return auditLogs;
        const q = auditSearch.toLowerCase();
        return auditLogs.filter(
            (l) =>
                l.changed_by_name?.toLowerCase().includes(q) ||
                l.changed_by_email?.toLowerCase().includes(q) ||
                String(l.attendance_record_id).includes(q) ||
                l.reason?.toLowerCase().includes(q) ||
                l.new_status?.toLowerCase().includes(q)
        );
    }, [auditLogs, auditSearch]);

    const sessionsTotalPages = Math.max(1, Math.ceil(sessionsTotal / sessionsPageSize));
    const auditTotalPages = Math.max(1, Math.ceil(auditTotal / auditPageSize));

    const isCancelled = (status?: string | null) => {
        const s = (status || "").toUpperCase();
        return s === "CANCELLED" || s === "CANCELED";
    };

    const isRescheduled = (status?: string | null) => {
        const s = (status || "").toUpperCase();
        return s === "RESCHEDULED" || s === "POSTPONED";
    };

    const renderSessionStatusBadge = (status?: string | null) => {
        const s = (status || "").toUpperCase();
        if (s === "CANCELLED" || s === "CANCELED") {
            return (
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-rose-600 shrink-0" />
                    <span>{status}</span>
                </span>
            );
        }
        if (s === "RESCHEDULED" || s === "POSTPONED") {
            return (
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                    <Clock className="h-3 w-3 text-amber-600 shrink-0" />
                    <span>{status}</span>
                </span>
            );
        }
        if (s === "SUBMITTED" || s === "CONDUCTED" || s === "COMPLETED") {
            return (
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span>{status}</span>
                </span>
            );
        }
        return (
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1">
                <Clock className="h-3 w-3 text-slate-500 shrink-0" />
                <span>{status || "UNKNOWN"}</span>
            </span>
        );
    };

    const getStatusBadge = (status: string) => {
        switch (status?.toUpperCase()) {
            case "PRESENT":
                return "bg-emerald-50 text-emerald-800 border-emerald-200";
            case "ABSENT":
                return "bg-rose-50 text-rose-800 border-rose-200";
            case "LEAVE":
                return "bg-blue-50 text-blue-800 border-blue-200";
            default:
                return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    const formatDateOnly = (dateStr?: string | null) => {
        if (!dateStr) return "—";
        try {
            const parts = dateStr.split("T")[0].split("-");
            if (parts.length === 3 && parts[0].length === 4) {
                const year = parseInt(parts[0], 10);
                const monthIndex = parseInt(parts[1], 10) - 1;
                const day = parseInt(parts[2], 10);
                const dateObj = new Date(year, monthIndex, day);
                return dateObj.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                });
            }
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
            });
        } catch {
            return dateStr;
        }
    };

    const formatTimeOnly = (isoString?: string | null) => {
        if (!isoString) return "";
        try {
            const d = new Date(isoString);
            if (isNaN(d.getTime())) return "";
            return d.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            });
        } catch {
            return "";
        }
    };

    const formatDateTime = (isoString?: string | null) => {
        if (!isoString) return "—";
        try {
            const d = new Date(isoString);
            return d.toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            });
        } catch {
            return isoString;
        }
    };

    return (
        <div className="space-y-4">
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-lg font-semibold text-slate-900 tracking-tight">Attendance Logs</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Live submission logs marked by teachers from mobile app & web, with an immutable audit trail.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            if (activeTab === "sessions") fetchSessions();
                            else fetchAuditLogs();
                        }}
                        disabled={activeTab === "sessions" ? sessionsLoading : auditLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-md hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                        title="Refresh data"
                    >
                        <RefreshCw
                            className={`h-3.5 w-3.5 text-slate-500 ${
                                (activeTab === "sessions" ? sessionsLoading : auditLoading)
                                    ? "motion-safe:animate-spin text-blue-600"
                                    : ""
                            }`}
                        />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
                <button
                    onClick={() => setActiveTab("sessions")}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] whitespace-nowrap ${
                        activeTab === "sessions"
                            ? "bg-blue-50 text-blue-900 font-semibold border border-blue-200"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                >
                    <Radio className={`h-3.5 w-3.5 ${activeTab === "sessions" ? "text-blue-700" : "text-slate-400"}`} />
                    <span>Live attendance submissions</span>
                    <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-mono tabular-nums ${
                            activeTab === "sessions"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-slate-100 text-slate-600"
                        }`}
                    >
                        {sessionsTotal}
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab("audit")}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] whitespace-nowrap ${
                        activeTab === "audit"
                            ? "bg-blue-50 text-blue-900 font-semibold border border-blue-200"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                >
                    <FileText className={`h-3.5 w-3.5 ${activeTab === "audit" ? "text-blue-700" : "text-slate-400"}`} />
                    <span>Status overrides & audit trail</span>
                    <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-mono tabular-nums ${
                            activeTab === "audit"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-slate-100 text-slate-600"
                        }`}
                    >
                        {auditTotal}
                    </span>
                </button>
            </div>

            {/* =================================================================
             * TAB 1: LIVE ATTENDANCE SESSIONS
             * ================================================================= */}
            {activeTab === "sessions" && (
                <div className="space-y-4">
                    {/* Summary KPI Ledger (Flat 4-column hairline grid) */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden bg-white">
                        <div className="bg-white p-3.5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-slate-500">Sessions today</p>
                                <p className="text-xl font-bold tracking-tight text-slate-900 tabular-nums mt-0.5">
                                    {summaryToday?.sessions_today ?? 0}
                                </p>
                            </div>
                            <div className="w-8 h-8 rounded bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                                <Activity className="h-4 w-4" />
                            </div>
                        </div>

                        <div className="bg-white p-3.5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-slate-500">Students marked today</p>
                                <p className="text-xl font-bold tracking-tight text-slate-900 tabular-nums mt-0.5">
                                    {summaryToday?.students_marked_today ?? 0}
                                </p>
                            </div>
                            <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                                <Users className="h-4 w-4" />
                            </div>
                        </div>

                        <div className="bg-white p-3.5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-slate-500">Present today</p>
                                <p className="text-xl font-bold tracking-tight text-slate-900 tabular-nums mt-0.5">
                                    {summaryToday?.present_today ?? 0}
                                </p>
                            </div>
                            <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                        </div>

                        <div className="bg-white p-3.5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-slate-500">Turnout today</p>
                                <p className="text-xl font-bold tracking-tight text-slate-900 tabular-nums mt-0.5">
                                    {summaryToday?.overall_percentage_today ?? 0}%
                                </p>
                            </div>
                            <div className="w-8 h-8 rounded bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                                <Activity className="h-4 w-4" />
                            </div>
                        </div>
                    </div>

                    {/* Filter and Search Bar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                            <input
                                type="search"
                                placeholder="Search by teacher, course code, course name, or section…"
                                value={sessionSearch}
                                onChange={(e) => {
                                    setSessionSearch(e.target.value);
                                    setSessionsPage(1);
                                }}
                                className="w-full pl-8 pr-7 h-8.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus:border-blue-600 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                            />
                            {sessionSearch && (
                                <button
                                    onClick={() => setSessionSearch("")}
                                    aria-label="Clear search"
                                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 focus-visible:outline-none"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        <div className="w-48 shrink-0">
                            <DatePicker
                                value={sessionDate}
                                onChange={(val) => {
                                    setSessionDate(val);
                                    setSessionsPage(1);
                                }}
                                placeholder="Filter by date…"
                                align="right"
                            />
                        </div>
                    </div>

                    {/* Sessions Table Container */}
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left min-w-[1000px]">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                                    <tr>
                                        <th className="px-3 py-2.5 w-14 text-center font-semibold text-slate-600">S.No.</th>
                                        <th className="px-4 py-2.5 font-semibold text-slate-600">Date & time</th>
                                        <th className="px-4 py-2.5 font-semibold text-slate-600">Faculty</th>
                                        <th className="px-4 py-2.5 font-semibold text-slate-600">Course & code</th>
                                        <th className="px-4 py-2.5 font-semibold text-slate-600">Section & semester</th>
                                        <th className="px-3 py-2.5 text-center font-semibold text-slate-600">Duration</th>
                                        <th className="px-4 py-2.5 font-semibold text-slate-600">Turnout</th>
                                        <th className="px-3 py-2.5 text-center font-semibold text-slate-600">Status</th>
                                        <th className="px-4 py-2.5 text-right font-semibold text-slate-600">Actions</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-200 text-slate-700">
                                    {sessionsLoading ? (
                                        <tr>
                                            <td colSpan={9} className="px-4 py-12 text-center">
                                                <Loader2 className="h-6 w-6 motion-safe:animate-spin text-blue-600 mx-auto" />
                                                <p className="text-xs text-slate-500 mt-2 font-medium">
                                                    Loading attendance sessions…
                                                </p>
                                            </td>
                                        </tr>
                                    ) : sessions.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                                                <BookOpen className="h-7 w-7 mx-auto text-slate-300 mb-2" />
                                                <p className="text-xs font-semibold text-slate-700">
                                                    No attendance sessions found
                                                </p>
                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                    Sessions marked by faculty via the mobile app or web will appear here.
                                                </p>
                                            </td>
                                        </tr>
                                    ) : (
                                        sessions.map((s, idx) => (
                                            <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                                {/* S.No. */}
                                                <td className="px-3 py-2.5 text-center font-mono tabular-nums text-slate-500 text-xs">
                                                    {(sessionsPage - 1) * sessionsPageSize + idx + 1}
                                                </td>

                                                {/* Date & Time */}
                                                <td className="px-4 py-2.5 whitespace-nowrap">
                                                    <div>
                                                        <span className="font-medium text-slate-900 block text-xs">
                                                            {formatDateOnly(s.date)}
                                                        </span>
                                                        <span className="text-[11px] text-slate-400 font-mono">
                                                            {formatTimeOnly(s.submitted_at || s.created_at) || s.date}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Faculty */}
                                                <td className="px-4 py-2.5 whitespace-nowrap">
                                                    <div className="truncate max-w-[170px]">
                                                        <span className="font-medium text-slate-900 block text-xs truncate" title={s.teacher_name}>
                                                            {s.teacher_name}
                                                        </span>
                                                        <span className="text-[11px] text-slate-400 font-mono truncate block" title={s.teacher_email}>
                                                            {s.teacher_email}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Course & Code */}
                                                <td className="px-4 py-2.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 font-mono text-[11px] border border-blue-200 shrink-0 font-medium">
                                                            {s.subject_code}
                                                        </span>
                                                        <span className="font-medium text-slate-800 text-xs truncate max-w-[200px]" title={s.subject_name}>
                                                            {s.subject_name}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Section & Semester */}
                                                <td className="px-4 py-2.5 whitespace-nowrap">
                                                    <div>
                                                        <span className="font-medium text-slate-900 block text-xs">
                                                            {s.section_name}
                                                        </span>
                                                        <span className="text-[11px] text-slate-500">
                                                            {s.term_name || "Active Semester"}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Duration */}
                                                <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                                        {s.duration_periods === 1 ? "1 period" : `${s.duration_periods} periods`}
                                                    </span>
                                                </td>

                                                {/* Turnout */}
                                                <td className="px-4 py-2.5 whitespace-nowrap">
                                                    {isCancelled(s.status) ? (
                                                        <span className="text-[11px] text-slate-400 italic font-medium">
                                                            No session held
                                                        </span>
                                                    ) : isRescheduled(s.status) ? (
                                                        <span className="text-[11px] text-amber-700 font-medium">
                                                            Rescheduled
                                                        </span>
                                                    ) : (
                                                        <div className="w-32 space-y-1">
                                                            <div className="flex items-center justify-between text-[11px]">
                                                                <span className="font-medium text-slate-900 tabular-nums">
                                                                    {s.present_count} / {s.total_students}
                                                                </span>
                                                                <span
                                                                    className={`font-semibold tabular-nums ${
                                                                        s.attendance_percentage >= 75
                                                                            ? "text-emerald-700"
                                                                            : s.attendance_percentage >= 60
                                                                            ? "text-amber-700"
                                                                            : "text-rose-700"
                                                                    }`}
                                                                >
                                                                    {s.attendance_percentage}%
                                                                </span>
                                                            </div>
                                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                                                                <div
                                                                    className={`h-full ${
                                                                        s.attendance_percentage >= 75
                                                                            ? "bg-emerald-600"
                                                                            : s.attendance_percentage >= 60
                                                                            ? "bg-amber-500"
                                                                            : "bg-rose-600"
                                                                    }`}
                                                                    style={{ width: `${s.attendance_percentage}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Status */}
                                                <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                                    {renderSessionStatusBadge(s.status)}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                                                    {isCancelled(s.status) || isRescheduled(s.status) ? (
                                                        <span
                                                            className="text-xs text-slate-400 font-medium px-2 py-1 inline-block"
                                                            title={isCancelled(s.status) ? "Session cancelled (no roster)" : "Class rescheduled"}
                                                        >
                                                            —
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => openRosterModal(s)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-medium border border-blue-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 active:scale-[0.98] cursor-pointer"
                                                        >
                                                            <Eye className="h-3.5 w-3.5 shrink-0" />
                                                            <span>View roster</span>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination and Status Footer */}
                        <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-3 text-slate-600 font-medium">
                                <span>
                                    Showing <strong className="text-slate-900 tabular-nums">{sessionsTotal === 0 ? 0 : (sessionsPage - 1) * sessionsPageSize + 1}</strong> to <strong className="text-slate-900 tabular-nums">{Math.min(sessionsPage * sessionsPageSize, sessionsTotal)}</strong> of <strong className="text-slate-900 tabular-nums">{sessionsTotal}</strong> sessions
                                </span>
                                <span className="text-slate-300">|</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-slate-500">Per page:</span>
                                    <PageSizeDropdown
                                        value={sessionsPageSize}
                                        onChange={(size) => {
                                            setSessionsPageSize(size);
                                            setSessionsPage(1);
                                        }}
                                        options={[15, 25, 50, 100]}
                                    />
                                </div>
                            </div>

                            {sessionsTotalPages > 1 && (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setSessionsPage((p) => Math.max(1, p - 1))}
                                        disabled={sessionsPage === 1}
                                        className="flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 active:scale-[0.98]"
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5" />
                                        <span>Previous</span>
                                    </button>

                                    <div className="flex items-center gap-0.5">
                                        {Array.from({ length: sessionsTotalPages }, (_, idx) => idx + 1)
                                            .filter((p) => p === 1 || p === sessionsTotalPages || Math.abs(p - sessionsPage) <= 1)
                                            .reduce<(number | string)[]>((acc, p, idx, arr) => {
                                                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) {
                                                    acc.push("…");
                                                }
                                                acc.push(p);
                                                return acc;
                                            }, [])
                                            .map((p, idx) =>
                                                p === "…" ? (
                                                    <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 text-xs">
                                                        …
                                                    </span>
                                                ) : (
                                                    <button
                                                        key={`page-${p}`}
                                                        onClick={() => setSessionsPage(p as number)}
                                                        className={`w-7 h-7 rounded text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 ${
                                                            sessionsPage === p
                                                                ? "bg-blue-700 text-white font-semibold"
                                                                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                                                        }`}
                                                    >
                                                        {p}
                                                    </button>
                                                )
                                            )}
                                    </div>

                                    <button
                                        onClick={() => setSessionsPage((p) => Math.min(sessionsTotalPages, p + 1))}
                                        disabled={sessionsPage === sessionsTotalPages}
                                        className="flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 active:scale-[0.98]"
                                    >
                                        <span>Next</span>
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* =================================================================
             * TAB 2: STATUS OVERRIDES & AUDIT TRAIL
             * ================================================================= */}
            {activeTab === "audit" && (
                <div className="space-y-4">
                    {/* Filter bar */}
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                        <input
                            type="search"
                            placeholder="Search modifier, email, record ID, or reason…"
                            value={auditSearch}
                            onChange={(e) => setAuditSearch(e.target.value)}
                            className="w-full pl-8 pr-7 h-8.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus:border-blue-600 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                        />
                        {auditSearch && (
                            <button
                                onClick={() => setAuditSearch("")}
                                aria-label="Clear filter"
                                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 focus-visible:outline-none"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Audit Table Container */}
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left min-w-[900px]">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                                    <tr>
                                        <th className="px-3 py-2.5 w-14 text-center font-semibold text-slate-600">S.No.</th>
                                        <th className="px-4 py-2.5 font-semibold text-slate-600">Timestamp</th>
                                        <th className="px-4 py-2.5 font-semibold text-slate-600">Modified by</th>
                                        <th className="px-4 py-2.5 font-semibold text-slate-600">Record ID</th>
                                        <th className="px-4 py-2.5 font-semibold text-slate-600">Status transition</th>
                                        <th className="px-4 py-2.5 font-semibold text-slate-600">Reason / notes</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-200 text-slate-700">
                                    {auditLoading ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-12 text-center">
                                                <Loader2 className="h-6 w-6 motion-safe:animate-spin text-blue-600 mx-auto" />
                                                <p className="text-xs text-slate-500 mt-2 font-medium">
                                                    Loading audit logs…
                                                </p>
                                            </td>
                                        </tr>
                                    ) : filteredAuditLogs.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-4 py-10 text-center text-slate-500 text-xs font-medium"
                                            >
                                                No audit entries found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredAuditLogs.map((l, idx) => (
                                            <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-3 py-2.5 text-center font-mono tabular-nums text-slate-500 text-xs">
                                                    {(auditPage - 1) * auditPageSize + idx + 1}
                                                </td>

                                                <td className="px-4 py-2.5 whitespace-nowrap">
                                                    <span className="font-mono tabular-nums text-slate-600 text-xs">
                                                        {formatDateTime(l.timestamp)}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-2.5 whitespace-nowrap">
                                                    <div>
                                                        <span className="font-medium text-slate-900 block text-xs">
                                                            {l.changed_by_name}
                                                        </span>
                                                        <span className="text-[11px] text-slate-400 font-mono">
                                                            {l.changed_by_email}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-2.5 font-mono tabular-nums text-slate-600 text-xs">
                                                    #{l.attendance_record_id}
                                                </td>

                                                <td className="px-4 py-2.5 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <span
                                                            className={`px-1.5 py-0.5 rounded text-[11px] font-medium border ${getStatusBadge(
                                                                l.old_status
                                                            )}`}
                                                        >
                                                            {l.old_status}
                                                        </span>
                                                        <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                                                        <span
                                                            className={`px-1.5 py-0.5 rounded text-[11px] font-medium border ${getStatusBadge(
                                                                l.new_status
                                                            )}`}
                                                        >
                                                            {l.new_status}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-2.5">
                                                    <span className="text-slate-700 text-xs font-normal">
                                                        {l.reason || "—"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination and Status Footer */}
                        <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-3 text-slate-600 font-medium">
                                <span>
                                    Showing <strong className="text-slate-900 tabular-nums">{auditTotal === 0 ? 0 : (auditPage - 1) * auditPageSize + 1}</strong> to <strong className="text-slate-900 tabular-nums">{Math.min(auditPage * auditPageSize, auditTotal)}</strong> of <strong className="text-slate-900 tabular-nums">{auditTotal}</strong> audit entries
                                </span>
                                <span className="text-slate-300">|</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-slate-500">Per page:</span>
                                    <PageSizeDropdown
                                        value={auditPageSize}
                                        onChange={(size) => {
                                            setAuditPageSize(size);
                                            setAuditPage(1);
                                        }}
                                        options={[15, 25, 50, 100]}
                                    />
                                </div>
                            </div>

                            {auditTotalPages > 1 && (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                                        disabled={auditPage === 1}
                                        className="flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 active:scale-[0.98]"
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5" />
                                        <span>Previous</span>
                                    </button>

                                    <div className="flex items-center gap-0.5">
                                        {Array.from({ length: auditTotalPages }, (_, idx) => idx + 1)
                                            .filter((p) => p === 1 || p === auditTotalPages || Math.abs(p - auditPage) <= 1)
                                            .reduce<(number | string)[]>((acc, p, idx, arr) => {
                                                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) {
                                                    acc.push("…");
                                                }
                                                acc.push(p);
                                                return acc;
                                            }, [])
                                            .map((p, idx) =>
                                                p === "…" ? (
                                                    <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 text-xs">
                                                        …
                                                    </span>
                                                ) : (
                                                    <button
                                                        key={`page-${p}`}
                                                        onClick={() => setAuditPage(p as number)}
                                                        className={`w-7 h-7 rounded text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 ${
                                                            auditPage === p
                                                                ? "bg-blue-700 text-white font-semibold"
                                                                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                                                        }`}
                                                    >
                                                        {p}
                                                    </button>
                                                )
                                            )}
                                    </div>

                                    <button
                                        onClick={() => setAuditPage((p) => Math.min(auditTotalPages, p + 1))}
                                        disabled={auditPage === auditTotalPages}
                                        className="flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 active:scale-[0.98]"
                                    >
                                        <span>Next</span>
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* =================================================================
             * ROSTER MODAL: STUDENT LEVEL BREAKDOWN
             * ================================================================= */}
            {selectedSessionId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
                    <div className="bg-white w-full max-w-3xl rounded-lg border border-slate-200 shadow-lg overflow-hidden flex flex-col max-h-[88vh]">
                        {/* Modal Header */}
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 font-medium text-xs font-mono border border-blue-200">
                                        {rosterSession?.subject_code}
                                    </span>
                                    <h2 className="text-sm font-semibold text-slate-900">
                                        {rosterSession?.subject_name}
                                    </h2>
                                    <span className="text-xs text-slate-500">
                                        (Section {rosterSession?.section_name})
                                    </span>
                                    {rosterSession && renderSessionStatusBadge(rosterSession.status)}
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                                    <span>Faculty: <strong className="text-slate-900">{rosterSession?.teacher_name}</strong></span>
                                    <span className="text-slate-300">|</span>
                                    <span>Date: <strong className="text-slate-900">{rosterSession?.date}</strong></span>
                                    <span className="text-slate-300">|</span>
                                    <span>Duration: <strong className="text-slate-900">{rosterSession?.duration_periods} periods</strong></span>
                                </div>
                            </div>

                            <button
                                onClick={closeRosterModal}
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Modal Metrics Bar & Quick Filters (hidden if cancelled or rescheduled) */}
                        {!isCancelled(rosterSession?.status) && !isRescheduled(rosterSession?.status) && (
                            <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setRosterFilter("ALL")}
                                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 active:scale-[0.98] ${
                                            rosterFilter === "ALL"
                                                ? "bg-slate-800 text-white font-semibold"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        }`}
                                    >
                                        All ({rosterRecords.length})
                                    </button>
                                    <button
                                        onClick={() => setRosterFilter("PRESENT")}
                                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 active:scale-[0.98] ${
                                            rosterFilter === "PRESENT"
                                                ? "bg-emerald-700 text-white font-semibold"
                                                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                                        }`}
                                    >
                                        <CheckCircle2 className="h-3 w-3" />
                                        <span>Present ({rosterSession?.present_count ?? 0})</span>
                                    </button>
                                    <button
                                        onClick={() => setRosterFilter("ABSENT")}
                                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500 active:scale-[0.98] ${
                                            rosterFilter === "ABSENT"
                                                ? "bg-rose-700 text-white font-semibold"
                                                : "bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200"
                                        }`}
                                    >
                                        <XCircle className="h-3 w-3" />
                                        <span>Absent ({rosterSession?.absent_count ?? 0})</span>
                                    </button>
                                    {(rosterSession?.leave_count ?? 0) > 0 && (
                                        <button
                                            onClick={() => setRosterFilter("LEAVE")}
                                            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 active:scale-[0.98] ${
                                                rosterFilter === "LEAVE"
                                                    ? "bg-blue-700 text-white font-semibold"
                                                    : "bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200"
                                            }`}
                                        >
                                            <span>Leave ({rosterSession?.leave_count ?? 0})</span>
                                        </button>
                                    )}
                                </div>

                                {/* Search inside roster */}
                                <div className="relative w-56">
                                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                                    <input
                                        type="search"
                                        placeholder="Search roll or student…"
                                        value={rosterSearch}
                                        onChange={(e) => setRosterSearch(e.target.value)}
                                        className="w-full pl-7 pr-6 h-7.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                                    />
                                    {rosterSearch && (
                                        <button
                                            onClick={() => setRosterSearch("")}
                                            aria-label="Clear filter"
                                            className="absolute right-1.5 top-1.5 text-slate-400 hover:text-slate-600"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Modal Body / Table */}
                        <div className="flex-1 overflow-y-auto">
                            {isCancelled(rosterSession?.status) ? (
                                <div className="py-14 px-6 text-center">
                                    <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-3 text-rose-600">
                                        <XCircle className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-slate-800 mb-1">
                                        Session Cancelled
                                    </h3>
                                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                        This lecture was marked as cancelled by the instructor, so no student attendance was recorded.
                                    </p>
                                </div>
                            ) : isRescheduled(rosterSession?.status) ? (
                                <div className="py-14 px-6 text-center">
                                    <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-3 text-amber-600">
                                        <Clock className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-slate-800 mb-1">
                                        Session Rescheduled
                                    </h3>
                                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                        This lecture was rescheduled to another time slot. Student attendance will be taken during the rescheduled class.
                                    </p>
                                </div>
                            ) : rosterLoading ? (
                                <div className="py-14 text-center">
                                    <Loader2 className="h-6 w-6 motion-safe:animate-spin text-blue-600 mx-auto" />
                                    <p className="text-xs text-slate-500 mt-2 font-medium">
                                        Loading student roster…
                                    </p>
                                </div>
                            ) : filteredRosterRecords.length === 0 ? (
                                <div className="py-12 text-center text-slate-500">
                                    <Users className="h-6 w-6 mx-auto text-slate-300 mb-1.5" />
                                    <p className="text-xs font-medium">
                                        No students found matching criteria
                                    </p>
                                </div>
                            ) : (
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2 font-semibold">Roll number</th>
                                            <th className="px-4 py-2 font-semibold">Student name</th>
                                            <th className="px-4 py-2 font-semibold">Status</th>
                                            <th className="px-4 py-2 font-semibold">Captured timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 text-slate-700">
                                        {filteredRosterRecords.map((rec) => (
                                            <tr key={rec.record_id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-2 font-mono tabular-nums text-slate-800 text-xs font-medium">
                                                    {rec.roll_number}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <div>
                                                        <span className="font-medium text-slate-900 block">
                                                            {rec.student_name}
                                                        </span>
                                                        <span className="text-[11px] text-slate-400 font-mono">
                                                            {rec.student_email}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span
                                                        className={`px-1.5 py-0.5 rounded text-[11px] font-medium border inline-flex items-center gap-1 ${getStatusBadge(
                                                            rec.status
                                                        )}`}
                                                    >
                                                        {rec.status.toUpperCase() === "PRESENT" ? (
                                                            <CheckCircle2 className="h-3 w-3" />
                                                        ) : (
                                                            <XCircle className="h-3 w-3" />
                                                        )}
                                                        <span>{rec.status}</span>
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-slate-500 font-mono tabular-nums text-[11px]">
                                                    {formatDateTime(rec.captured_at)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium">
                                {isCancelled(rosterSession?.status)
                                    ? "No student attendance recorded for cancelled session"
                                    : isRescheduled(rosterSession?.status)
                                    ? "No student attendance recorded for rescheduled session"
                                    : (
                                        <>
                                            Showing <strong className="text-slate-900 tabular-nums">{filteredRosterRecords.length}</strong> of{" "}
                                            <strong className="text-slate-900 tabular-nums">{rosterRecords.length}</strong> students
                                        </>
                                    )}
                            </span>
                            <button
                                onClick={closeRosterModal}
                                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 active:scale-[0.98]"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
