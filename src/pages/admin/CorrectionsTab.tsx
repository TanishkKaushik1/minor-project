// src/pages/admin/CorrectionsTab.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import {
    CheckCircle2,
    XCircle,
    Loader2,
    RefreshCw,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Search,
    ArrowRight,
    Clock,
    User,
    Calendar,
    Eye,
    ShieldAlert,
    AlertTriangle,
    X,
    Check
} from "lucide-react";
import { PageSizeDropdown } from "../../components/ui/page-size-dropdown";
import { listPendingCorrections, resolveCorrection, bulkResolveCorrections } from "../../api/admin";
import type { Correction } from "../../api/admin";

type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

export default function CorrectionsTab() {
    const [corrections, setCorrections] = useState<Correction[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

    // Filters and pagination
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING");
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Selection for bulk actions
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Modals
    const [rejectModalItem, setRejectModalItem] = useState<Correction | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [rejectionError, setRejectionError] = useState("");

    const [approveModalItem, setApproveModalItem] = useState<Correction | null>(null);
    const [detailModalItem, setDetailModalItem] = useState<Correction | null>(null);

    const [bulkModalAction, setBulkModalAction] = useState<"APPROVE" | "REJECT" | null>(null);
    const [bulkRejectionReason, setBulkRejectionReason] = useState("");
    const [bulkError, setBulkError] = useState("");

    const loadCorrections = useCallback(async () => {
        setLoading(true);
        setSelectedIds([]);
        try {
            const data = await listPendingCorrections("ALL");
            setCorrections(data ?? []);
        } catch {
            setNotice({ ok: false, text: "Error loading attendance corrections queue." });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCorrections();
    }, [loadCorrections]);

    // Counts for tabs
    const counts = useMemo(() => {
        const pending = corrections.filter((c) => c.status === "PENDING").length;
        const approved = corrections.filter((c) => c.status === "APPROVED").length;
        const rejected = corrections.filter((c) => c.status === "REJECTED").length;
        return {
            ALL: corrections.length,
            PENDING: pending,
            APPROVED: approved,
            REJECTED: rejected,
        };
    }, [corrections]);

    // Filter by tab + search term
    const filteredCorrections = useMemo(() => {
        let list = corrections;

        if (statusFilter !== "ALL") {
            list = list.filter((c) => c.status === statusFilter);
        }

        if (!searchTerm.trim()) return list;

        const q = searchTerm.toLowerCase();
        return list.filter(
            (c) =>
                c.requested_by_name?.toLowerCase().includes(q) ||
                c.student_name?.toLowerCase().includes(q) ||
                c.student_roll?.toLowerCase().includes(q) ||
                c.subject_code?.toLowerCase().includes(q) ||
                c.subject_name?.toLowerCase().includes(q) ||
                c.class_date?.toLowerCase().includes(q) ||
                c.reason?.toLowerCase().includes(q) ||
                String(c.attendance_record_id).includes(q) ||
                String(c.id).includes(q)
        );
    }, [corrections, statusFilter, searchTerm]);

    useEffect(() => {
        setPage(1);
    }, [statusFilter, searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filteredCorrections.length / pageSize));

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [totalPages, page]);

    const paginatedCorrections = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredCorrections.slice(start, start + pageSize);
    }, [filteredCorrections, page, pageSize]);

    // Checkbox handlers
    const isAllPageSelected = useMemo(() => {
        const pendingOnPage = paginatedCorrections.filter((c) => c.status === "PENDING");
        if (pendingOnPage.length === 0) return false;
        return pendingOnPage.every((c) => selectedIds.includes(c.id));
    }, [paginatedCorrections, selectedIds]);

    const handleToggleSelectAll = () => {
        const pendingOnPage = paginatedCorrections.filter((c) => c.status === "PENDING").map((c) => c.id);
        if (isAllPageSelected) {
            setSelectedIds((prev) => prev.filter((id) => !pendingOnPage.includes(id)));
        } else {
            setSelectedIds((prev) => Array.from(new Set([...prev, ...pendingOnPage])));
        }
    };

    const handleToggleRow = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    // Actions
    const handleConfirmApprove = async () => {
        if (!approveModalItem) return;
        setActionLoading(approveModalItem.id);
        try {
            await resolveCorrection(approveModalItem.id, { decision: "APPROVED" });
            setNotice({
                ok: true,
                text: `Request #${approveModalItem.id} approved. Attendance updated successfully.`,
            });
            setApproveModalItem(null);
            loadCorrections();
        } catch (e: unknown) {
            setNotice({
                ok: false,
                text: e instanceof Error ? e.message : "Failed to approve correction request.",
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleConfirmReject = async () => {
        if (!rejectModalItem) return;
        if (!rejectionReason.trim()) {
            setRejectionError("Please provide a justification for this rejection.");
            return;
        }
        setActionLoading(rejectModalItem.id);
        try {
            await resolveCorrection(rejectModalItem.id, {
                decision: "REJECTED",
                rejection_reason: rejectionReason.trim(),
            });
            setNotice({
                ok: true,
                text: `Request #${rejectModalItem.id} rejected. Faculty notified.`,
            });
            setRejectModalItem(null);
            loadCorrections();
        } catch (e: unknown) {
            setNotice({
                ok: false,
                text: e instanceof Error ? e.message : "Failed to reject correction request.",
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleConfirmBulk = async () => {
        if (!bulkModalAction || selectedIds.length === 0) return;
        if (bulkModalAction === "REJECT" && !bulkRejectionReason.trim()) {
            setBulkError("Please provide a rejection reason for all selected requests.");
            return;
        }

        setBulkLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res = (await bulkResolveCorrections({
                request_ids: selectedIds,
                decision: bulkModalAction,
                rejection_reason: bulkModalAction === "REJECT" ? bulkRejectionReason.trim() : undefined,
            })) as any;
            setNotice({
                ok: true,
                text: res?.message || `Successfully processed ${res?.updated_count || selectedIds.length} request(s).`,
            });
            setBulkModalAction(null);
            setBulkRejectionReason("");
            setBulkError("");
            setSelectedIds([]);
            loadCorrections();
        } catch (e: unknown) {
            setNotice({
                ok: false,
                text: e instanceof Error ? e.message : "Bulk action encountered an error.",
            });
        } finally {
            setBulkLoading(false);
        }
    };

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case "APPROVED":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                        <span>Approved</span>
                    </span>
                );
            case "REJECTED":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-800 border border-rose-200">
                        <XCircle className="h-3 w-3 text-rose-600 shrink-0" />
                        <span>Rejected</span>
                    </span>
                );
            case "PENDING":
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="h-3 w-3 text-amber-600 shrink-0" />
                        <span>Pending</span>
                    </span>
                );
        }
    };

    const renderAttendancePill = (val?: string) => {
        if (!val) return <span className="text-slate-400">None</span>;
        const upper = val.toUpperCase();
        if (upper === "PRESENT") {
            return (
                <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Present
                </span>
            );
        }
        if (upper === "ABSENT") {
            return (
                <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-800 border border-rose-200">
                    Absent
                </span>
            );
        }
        return (
            <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                {val}
            </span>
        );
    };

    return (
        <div className="space-y-4">
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
                        Attendance Corrections Queue
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Audit, approve, or reject faculty attendance rectifications with automated audit logging.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={loadCorrections}
                        disabled={loading}
                        className="p-1.5 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                        title="Reload corrections"
                    >
                        <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? "motion-safe:animate-spin text-blue-600" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Notification Banner */}
            {notice && (
                <div
                    className={`p-3 rounded-md text-xs font-medium flex items-center justify-between gap-2.5 border ${
                        notice.ok
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-red-50 text-red-800 border-red-200"
                    }`}
                >
                    <div className="flex items-center gap-2">
                        {notice.ok ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : (
                            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                        )}
                        <span>{notice.text}</span>
                    </div>
                    <button
                        onClick={() => setNotice(null)}
                        className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
                {(
                    [
                        { id: "PENDING", label: "Pending review", count: counts.PENDING },
                        { id: "APPROVED", label: "Approved history", count: counts.APPROVED },
                        { id: "REJECTED", label: "Rejected history", count: counts.REJECTED },
                        { id: "ALL", label: "All requests", count: counts.ALL },
                    ] as const
                ).map((tab) => {
                    const isActive = statusFilter === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] ${
                                isActive
                                    ? "bg-blue-50 text-blue-900 font-semibold border border-blue-200"
                                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                            }`}
                        >
                            <span>{tab.label}</span>
                            <span
                                className={`px-1.5 py-0.2 rounded font-mono tabular-nums text-[10px] ${
                                    isActive ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"
                                }`}
                            >
                                {tab.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Search Toolbar & Bulk Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <input
                        type="search"
                        placeholder="Search student, roll number, faculty, subject, or reason…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-7 h-8.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus:border-blue-600 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm("")}
                            aria-label="Clear search"
                            className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 focus-visible:outline-none"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                {/* Bulk Actions Pill */}
                {selectedIds.length > 0 && statusFilter === "PENDING" && (
                    <div className="flex items-center gap-1.5 p-1 bg-slate-900 text-white rounded-md text-xs">
                        <span className="font-medium px-2 tabular-nums">
                            {selectedIds.length} selected
                        </span>
                        <button
                            onClick={() => setBulkModalAction("APPROVE")}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-medium transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white active:scale-[0.98]"
                        >
                            <Check className="h-3.5 w-3.5" />
                            <span>Approve all</span>
                        </button>
                        <button
                            onClick={() => setBulkModalAction("REJECT")}
                            className="px-2.5 py-1 bg-rose-700 hover:bg-rose-600 text-white rounded text-xs font-medium transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white active:scale-[0.98]"
                        >
                            <X className="h-3.5 w-3.5" />
                            <span>Reject all</span>
                        </button>
                        <button
                            onClick={() => setSelectedIds([])}
                            className="p-1 text-slate-400 hover:text-white transition-colors"
                            title="Clear selection"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left min-w-[950px]">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                            <tr>
                                {statusFilter === "PENDING" && (
                                    <th className="px-3 py-2.5 w-8 text-center">
                                        <input
                                            type="checkbox"
                                            checked={isAllPageSelected}
                                            onChange={handleToggleSelectAll}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                                        />
                                    </th>
                                )}
                                <th className="px-4 py-2.5 font-semibold text-slate-600">Request ID</th>
                                <th className="px-4 py-2.5 font-semibold text-slate-600">Student</th>
                                <th className="px-4 py-2.5 font-semibold text-slate-600">Subject</th>
                                <th className="px-4 py-2.5 font-semibold text-slate-600">Change requested</th>
                                <th className="px-4 py-2.5 font-semibold text-slate-600">Faculty requester</th>
                                <th className="px-4 py-2.5 font-semibold text-slate-600">Rationale</th>
                                <th className="px-4 py-2.5 text-right font-semibold text-slate-600">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-200 text-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center">
                                        <Loader2 className="h-6 w-6 motion-safe:animate-spin text-blue-600 mx-auto" />
                                        <p className="text-xs text-slate-500 mt-2 font-medium">
                                            Loading corrections queue…
                                        </p>
                                    </td>
                                </tr>
                            ) : filteredCorrections.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                                        <ShieldAlert className="h-6 w-6 mx-auto text-slate-300 mb-1.5" />
                                        <p className="text-xs font-semibold text-slate-700">
                                            No {statusFilter !== "ALL" ? statusFilter.toLowerCase() : ""} corrections found
                                        </p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            {searchTerm
                                                ? "Try clearing your search filter."
                                                : "All faculty attendance correction submissions are up to date."}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedCorrections.map((c) => {
                                    const isSelected = selectedIds.includes(c.id);
                                    const isPending = c.status === "PENDING";

                                    return (
                                        <tr
                                            key={c.id}
                                            className={`hover:bg-slate-50 transition-colors ${
                                                isSelected ? "bg-blue-50/50" : ""
                                            }`}
                                        >
                                            {statusFilter === "PENDING" && (
                                                <td className="px-3 py-2.5 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleToggleRow(c.id)}
                                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                                                    />
                                                </td>
                                            )}

                                            {/* Request ID & Status Badge */}
                                            <td className="px-4 py-2.5 whitespace-nowrap">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span className="font-mono tabular-nums text-xs font-semibold text-slate-900">
                                                        #{c.id}
                                                    </span>
                                                    {renderStatusBadge(c.status)}
                                                </div>
                                            </td>

                                            {/* Student Details */}
                                            <td className="px-4 py-2.5 whitespace-nowrap">
                                                <div>
                                                    <span className="font-medium text-slate-900 block text-xs">
                                                        {c.student_name || "Unknown Student"}
                                                    </span>
                                                    <span className="font-mono tabular-nums text-[11px] text-slate-400">
                                                        {c.student_roll || `Record #${c.attendance_record_id}`}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Class & Subject */}
                                            <td className="px-4 py-2.5">
                                                <div>
                                                    <span className="font-medium text-slate-800 block text-xs truncate max-w-[190px]" title={c.subject_name}>
                                                        {c.subject_code ? `${c.subject_code}: ${c.subject_name}` : "Attendance Session"}
                                                    </span>
                                                    <div className="flex items-center gap-1 text-slate-400 text-[11px] mt-0.5">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>{c.class_date || "Date N/A"}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Attendance Change */}
                                            <td className="px-4 py-2.5 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    {renderAttendancePill(c.current_status)}
                                                    <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                                                    {renderAttendancePill(c.suggested_status)}
                                                </div>
                                            </td>

                                            {/* Faculty Requester */}
                                            <td className="px-4 py-2.5 whitespace-nowrap">
                                                <div>
                                                    <div className="flex items-center gap-1 font-medium text-slate-800 text-xs">
                                                        <User className="h-3 w-3 text-slate-400" />
                                                        <span>{c.requested_by_name}</span>
                                                    </div>
                                                    <span className="text-[11px] text-slate-400 block mt-0.5">
                                                        {new Date(c.requested_at).toLocaleDateString(undefined, {
                                                            month: "short",
                                                            day: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit"
                                                        })}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Reason & Escalation Policy */}
                                            <td className="px-4 py-2.5 max-w-xs">
                                                <p className="truncate text-slate-700 text-xs font-normal" title={c.reason}>
                                                    {c.reason}
                                                </p>
                                                {c.is_escalated && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 mt-0.5">
                                                        <AlertTriangle className="h-2.5 w-2.5 text-amber-600" />
                                                        <span>Escalated</span>
                                                    </span>
                                                )}
                                            </td>

                                            {/* Action Buttons */}
                                            <td className="px-4 py-2.5 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1">
                                                    {isPending ? (
                                                        <>
                                                            <button
                                                                onClick={() => setApproveModalItem(c)}
                                                                disabled={actionLoading === c.id}
                                                                className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 active:scale-[0.98]"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setRejectModalItem(c);
                                                                    setRejectionReason("");
                                                                    setRejectionError("");
                                                                }}
                                                                disabled={actionLoading === c.id}
                                                                className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500 active:scale-[0.98]"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic mr-1">
                                                            Resolved
                                                        </span>
                                                    )}

                                                    <button
                                                        onClick={() => setDetailModalItem(c)}
                                                        className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                                                        title="View Request Details"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 text-slate-600 font-medium">
                        <span>
                            Showing <strong className="text-slate-900 tabular-nums">{filteredCorrections.length === 0 ? 0 : (page - 1) * pageSize + 1}</strong> to <strong className="text-slate-900 tabular-nums">{Math.min(page * pageSize, filteredCorrections.length)}</strong> of <strong className="text-slate-900 tabular-nums">{filteredCorrections.length}</strong> requests
                        </span>
                        <span className="text-slate-300">|</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-500">Per page:</span>
                            <PageSizeDropdown
                                value={pageSize}
                                onChange={(size) => {
                                    setPageSize(size);
                                    setPage(1);
                                }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 active:scale-[0.98]"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-slate-700 font-medium text-xs px-2 tabular-nums">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 active:scale-[0.98]"
                        >
                            <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MODAL 1: APPROVE CONFIRMATION MODAL --- */}
            {approveModalItem && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg border border-slate-200 shadow-lg max-w-md w-full p-5 space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-md">
                                    <CheckCircle2 className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Approve attendance correction
                                    </h3>
                                    <p className="text-xs text-slate-500">Request #{approveModalItem.id}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setApproveModalItem(null)}
                                className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="bg-slate-50 rounded-md p-3.5 border border-slate-200 space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Student:</span>
                                <span className="font-medium text-slate-900">
                                    {approveModalItem.student_name} ({approveModalItem.student_roll})
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Class:</span>
                                <span className="font-medium text-slate-900">
                                    {approveModalItem.subject_code}, {approveModalItem.class_date}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">Attendance update:</span>
                                <div className="flex items-center gap-1.5">
                                    {renderAttendancePill(approveModalItem.current_status)}
                                    <ArrowRight className="h-3 w-3 text-slate-400" />
                                    {renderAttendancePill(approveModalItem.suggested_status)}
                                </div>
                            </div>
                            <div className="pt-2 border-t border-slate-200">
                                <span className="text-slate-500 block mb-1">Faculty rationale:</span>
                                <p className="text-slate-800 italic bg-white p-2 rounded border border-slate-200">
                                    &ldquo;{approveModalItem.reason}&rdquo;
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-500 leading-normal">
                            Approving this request will immediately rectify the attendance database record and generate a tamper-evident audit log under your credentials.
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                onClick={() => setApproveModalItem(null)}
                                className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 active:scale-[0.98]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmApprove}
                                disabled={actionLoading === approveModalItem.id}
                                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {actionLoading === approveModalItem.id && <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" />}
                                <span>Confirm approval</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 2: REJECT CONFIRMATION MODAL --- */}
            {rejectModalItem && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg border border-slate-200 shadow-lg max-w-md w-full p-5 space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-rose-50 text-rose-700 rounded-md">
                                    <XCircle className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Reject correction request
                                    </h3>
                                    <p className="text-xs text-slate-500">Request #{rejectModalItem.id} by {rejectModalItem.requested_by_name}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setRejectModalItem(null)}
                                className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-700 block">
                                Rejection reason <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                rows={3}
                                value={rejectionReason}
                                onChange={(e) => {
                                    setRejectionReason(e.target.value);
                                    if (rejectionError) setRejectionError("");
                                }}
                                placeholder="Explain why this request is being rejected (e.g. past semester deadline)…"
                                className="w-full text-xs p-2.5 rounded-md border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none text-slate-900 placeholder:text-slate-400 resize-none font-medium transition-colors"
                            />
                            {rejectionError && (
                                <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3 shrink-0" />
                                    <span>{rejectionError}</span>
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                onClick={() => setRejectModalItem(null)}
                                className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 active:scale-[0.98]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmReject}
                                disabled={actionLoading === rejectModalItem.id}
                                className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-md text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {actionLoading === rejectModalItem.id && <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" />}
                                <span>Confirm rejection</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 3: BULK ACTION MODAL --- */}
            {bulkModalAction && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg border border-slate-200 shadow-lg max-w-md w-full p-5 space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2.5">
                                <div
                                    className={`p-2 rounded-md ${
                                        bulkModalAction === "APPROVE"
                                            ? "bg-emerald-50 text-emerald-700"
                                            : "bg-rose-50 text-rose-700"
                                    }`}
                                >
                                    {bulkModalAction === "APPROVE" ? (
                                        <CheckCircle2 className="h-4 w-4" />
                                    ) : (
                                        <XCircle className="h-4 w-4" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Bulk {bulkModalAction === "APPROVE" ? "approve" : "reject"} requests
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        {selectedIds.length} correction requests selected
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setBulkModalAction(null)}
                                className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {bulkModalAction === "REJECT" && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-700 block">
                                    Rejection reason for all selected <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    rows={3}
                                    value={bulkRejectionReason}
                                    onChange={(e) => {
                                        setBulkRejectionReason(e.target.value);
                                        if (bulkError) setBulkError("");
                                    }}
                                    placeholder="State the shared justification for rejecting these selected requests…"
                                    className="w-full text-xs p-2.5 rounded-md border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none text-slate-900 placeholder:text-slate-400 resize-none font-medium transition-colors"
                                />
                                {bulkError && (
                                    <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3 shrink-0" />
                                        <span>{bulkError}</span>
                                    </p>
                                )}
                            </div>
                        )}

                        <p className="text-xs text-slate-500 leading-normal">
                            Are you sure you want to {bulkModalAction.toLowerCase()} all{" "}
                            <strong className="text-slate-900">{selectedIds.length}</strong> selected attendance correction requests at once?
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                onClick={() => setBulkModalAction(null)}
                                className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 active:scale-[0.98]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmBulk}
                                disabled={bulkLoading}
                                className={`px-3 py-1.5 text-white rounded-md text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${
                                    bulkModalAction === "APPROVE"
                                        ? "bg-emerald-700 hover:bg-emerald-800 focus-visible:ring-emerald-500"
                                        : "bg-rose-700 hover:bg-rose-800 focus-visible:ring-rose-500"
                                }`}
                            >
                                {bulkLoading && <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" />}
                                <span>Confirm {bulkModalAction === "APPROVE" ? "approval" : "rejection"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 4: FULL DETAIL MODAL --- */}
            {detailModalItem && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg border border-slate-200 shadow-lg max-w-lg w-full p-5 space-y-4">
                        <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs text-slate-500">Request <span className="font-mono tabular-nums font-semibold text-slate-700">#{detailModalItem.id}</span></span>
                                    {renderStatusBadge(detailModalItem.status)}
                                </div>
                                <h3 className="text-sm font-semibold text-slate-900">
                                    Attendance correction audit record
                                </h3>
                            </div>
                            <button
                                onClick={() => setDetailModalItem(null)}
                                className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            {/* Student & Course Box */}
                            <div className="grid grid-cols-2 gap-3 p-3 rounded-md bg-slate-50 border border-slate-200">
                                <div>
                                    <span className="text-[11px] font-medium text-slate-500 block">Student</span>
                                    <p className="font-semibold text-slate-900 mt-0.5">{detailModalItem.student_name}</p>
                                    <p className="font-mono text-slate-500 text-[11px]">{detailModalItem.student_roll}</p>
                                </div>
                                <div>
                                    <span className="text-[11px] font-medium text-slate-500 block">Subject</span>
                                    <p className="font-semibold text-slate-900 mt-0.5">{detailModalItem.subject_code}</p>
                                    <p className="text-slate-600 truncate text-[11px]" title={detailModalItem.subject_name}>
                                        {detailModalItem.subject_name}
                                    </p>
                                </div>
                            </div>

                            {/* Attendance Modification Card */}
                            <div className="p-3 rounded-md bg-blue-50/60 border border-blue-200 flex items-center justify-between">
                                <div>
                                    <span className="text-[11px] font-medium text-blue-900 block">Class date</span>
                                    <span className="font-semibold text-slate-900 text-xs mt-0.5 block">{detailModalItem.class_date}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div>
                                        <span className="text-[10px] text-slate-500 block text-center mb-0.5">Recorded</span>
                                        {renderAttendancePill(detailModalItem.current_status)}
                                    </div>
                                    <ArrowRight className="h-3.5 w-3.5 text-blue-400" />
                                    <div>
                                        <span className="text-[10px] text-slate-500 block text-center mb-0.5">Requested</span>
                                        {renderAttendancePill(detailModalItem.suggested_status)}
                                    </div>
                                </div>
                            </div>

                            {/* Faculty Rationale */}
                            <div className="space-y-1">
                                <span className="text-[11px] font-medium text-slate-600 block">
                                    Faculty rationale ({detailModalItem.requested_by_name})
                                </span>
                                <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-slate-700 leading-normal font-normal">
                                    {detailModalItem.reason}
                                </div>
                            </div>

                            {/* Metadata */}
                            <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2.5">
                                <span>Attendance Record ID: #{detailModalItem.attendance_record_id}</span>
                                <span>Requested: {new Date(detailModalItem.requested_at).toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                            {detailModalItem.status === "PENDING" && (
                                <>
                                    <button
                                        onClick={() => {
                                            setApproveModalItem(detailModalItem);
                                            setDetailModalItem(null);
                                        }}
                                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-[0.98]"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => {
                                            setRejectModalItem(detailModalItem);
                                            setDetailModalItem(null);
                                        }}
                                        className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 active:scale-[0.98]"
                                    >
                                        Reject
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => setDetailModalItem(null)}
                                className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 active:scale-[0.98]"
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
