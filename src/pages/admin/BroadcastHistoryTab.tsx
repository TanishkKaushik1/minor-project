import { useState, useEffect, useCallback } from "react";
import {
    History,
    Search,
    RefreshCw,
    Loader2,
    Eye,
    X,
    ChevronLeft,
    ChevronRight,
    Users,
    ExternalLink,
} from "lucide-react";
import { getBroadcastHistory, type BroadcastItem } from "../../api/notifications";

export default function BroadcastHistoryTab() {
    const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState<BroadcastItem | null>(null);

    const size = 15;

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getBroadcastHistory(page, size, search);
            setBroadcasts(res.items ?? []);
            setTotal(res.total ?? 0);
        } catch {
            setBroadcasts([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const handleSearchChange = (val: string) => {
        setSearch(val);
        setPage(1);
    };

    const totalPages = Math.max(1, Math.ceil(total / size));
    const rangeStart = total === 0 ? 0 : (page - 1) * size + 1;
    const rangeEnd = Math.min(page * size, total);

    const getPriorityBadge = (p: string) => {
        if (p === "URGENT") return "bg-rose-50 text-rose-700 border-rose-200";
        if (p === "HIGH") return "bg-amber-50 text-amber-700 border-amber-200";
        return "bg-slate-100 text-slate-600 border-slate-200";
    };

    return (
        <div className="space-y-6">
            {/* Header info */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <History className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-900 tracking-tight">
                            Broadcast Audit Log
                        </h2>
                        <p className="text-xs text-slate-500">
                            Historical records of all university notifications, circulars, and recipient reach statistics.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={fetchHistory}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Search Bar */}
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700">All Dispatches</span>
                        <span className="text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-bold">
                            {total} records
                        </span>
                    </div>

                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search notices, directives…"
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full pl-9 pr-8 py-1.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => handleSearchChange("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                <th className="py-3 px-4">Date</th>
                                <th className="py-3 px-4">Notice Title</th>
                                <th className="py-3 px-4">Type</th>
                                <th className="py-3 px-4">Priority</th>
                                <th className="py-3 px-4">Target Scope</th>
                                <th className="py-3 px-4">Dispatched By</th>
                                <th className="py-3 px-4 text-center">Audience Reach</th>
                                <th className="py-3 px-4 text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                                            <span className="text-xs font-bold text-slate-500">Loading audit history…</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : broadcasts.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="p-3 bg-slate-100 rounded-2xl text-slate-400">
                                                <Users className="h-8 w-8" />
                                            </div>
                                            <div className="text-sm font-bold text-slate-700">No broadcasts found</div>
                                            <p className="text-xs text-slate-400 max-w-sm">
                                                {search
                                                    ? `No notices matched "${search}". Try searching for another term.`
                                                    : "No official broadcasts have been dispatched yet."}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                broadcasts.map((b) => (
                                    <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                                            {new Date(b.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="py-3 px-4 font-bold text-slate-900 max-w-xs truncate">
                                            {b.title}
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                                {b.notification_type}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <span
                                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadge(
                                                    b.priority
                                                )}`}
                                            >
                                                {b.priority}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-slate-700 whitespace-nowrap font-medium">
                                            {b.scope_type} · <span className="text-slate-500">{b.target_role ?? "ALL"}</span>
                                        </td>
                                        <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                                            <div className="font-bold text-slate-800">{b.sender_name}</div>
                                            <div className="text-[10px] text-slate-400">{b.sender_email}</div>
                                        </td>
                                        <td className="py-3 px-4 text-center whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                <Users className="h-3 w-3" />
                                                <span>{b.recipient_count} recipients</span>
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right whitespace-nowrap">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedItem(b)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-2xs hover:border-slate-300 cursor-pointer"
                                            >
                                                <Eye className="h-3 w-3" />
                                                <span>View</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-500">
                    <div>
                        Showing <span className="text-slate-800">{rangeStart}</span> to{" "}
                        <span className="text-slate-800">{rangeEnd}</span> of{" "}
                        <span className="text-slate-800">{total}</span> broadcasts
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1 || loading}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition-all cursor-pointer"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="px-3 py-1 font-bold text-slate-700">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages || loading}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition-all cursor-pointer"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* View Modal */}
            {selectedItem && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                            <div>
                                <span
                                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border mb-1.5 ${getPriorityBadge(
                                        selectedItem.priority
                                    )}`}
                                >
                                    {selectedItem.priority} · {selectedItem.notification_type}
                                </span>
                                <h3 className="text-sm font-bold text-slate-900">{selectedItem.title}</h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    Dispatched by {selectedItem.sender_name} on{" "}
                                    {new Date(selectedItem.created_at).toLocaleString()}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedItem(null)}
                                className="text-slate-400 hover:text-slate-600 p-1"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                            {selectedItem.message}
                        </div>

                        {selectedItem.action_url && (
                            <div className="pt-2">
                                <a
                                    href={selectedItem.action_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline font-bold break-all"
                                >
                                    <span>Open Attached Document / Link</span>
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                        )}

                        <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-500">
                            <span>Delivered to {selectedItem.recipient_count} recipients</span>
                            <button
                                type="button"
                                onClick={() => setSelectedItem(null)}
                                className="px-3.5 py-1.5 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 text-slate-700 cursor-pointer"
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
