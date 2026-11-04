// src/pages/admin/SectionsTab.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import {
    Search,
    Plus,
    Trash2,
    RefreshCw,
    Loader2,
    CheckCircle2,
    AlertCircle,
    X,
    ChevronLeft,
    ChevronRight,
    Filter,
} from "lucide-react";
import { PageSizeDropdown } from "../../components/ui/page-size-dropdown";
import { FormSelect } from "../../components/ui/form-select";
import {
    listSections,
    createSection,
    deleteSection,
    listBatches,
    listTerms,
} from "../../api/admin";
import type { Section, Batch, Term } from "../../api/admin";

const getProgressionSemester = (startYear?: number | null, termName?: string | null) => {
    if (!startYear || !termName) return null;
    const match = termName.match(/(\d{4})/);
    const termYear = match ? parseInt(match[1], 10) : new Date().getFullYear();
    const isOdd = termName.toLowerCase().includes("odd") || !termName.toLowerCase().includes("even");
    const diff = termYear - startYear;
    if (diff < 0) return null;
    const semNum = isOdd ? (diff * 2 + 1) : ((diff - 1) * 2 + 2);
    return semNum > 0 ? `Semester ${semNum}` : null;
};

export default function SectionsTab() {
    const [sections, setSections] = useState<Section[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [terms, setTerms] = useState<Term[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

    // Filters & Search
    const [searchTerm, setSearchTerm] = useState("");
    const [termFilter, setTermFilter] = useState<string>("all");
    const [batchFilter, setBatchFilter] = useState<string>("all");

    // Pagination
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);

    // Add Section Modal
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formName, setFormName] = useState("");
    const [formBatchId, setFormBatchId] = useState("");
    const [formTermId, setFormTermId] = useState("");
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Load initial data
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [sectionsData, batchesData, termsData] = await Promise.all([
                listSections(),
                listBatches(),
                listTerms(),
            ]);
            setSections(sectionsData ?? []);
            setBatches(batchesData ?? []);
            setTerms(termsData ?? []);
        } catch (err: unknown) {
            console.error("Failed to load sections data:", err);
            setNotice({
                ok: false,
                text: err instanceof Error ? err.message : "Failed to load sections data",
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Pre-select active term if opening modal
    useEffect(() => {
        if (isAddModalOpen && !formTermId && terms.length > 0) {
            const activeTerm = terms.find((t) => t.is_active);
            if (activeTerm) {
                setFormTermId(String(activeTerm.id));
            }
        }
    }, [isAddModalOpen, terms, formTermId]);

    // Handle Create Section
    const handleCreateSection = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        const cleanName = formName.trim().toUpperCase();
        if (!cleanName) {
            setFormError("Please enter a valid section name (e.g., CS-IV-A).");
            return;
        }
        if (!formBatchId) {
            setFormError("Please select a batch.");
            return;
        }
        if (!formTermId) {
            setFormError("Please select a semester.");
            return;
        }

        setFormSubmitting(true);
        try {
            await createSection({
                name: cleanName,
                batch_id: Number(formBatchId),
                term_id: Number(formTermId),
            });
            setNotice({ ok: true, text: `Section '${cleanName}' created successfully!` });
            setIsAddModalOpen(false);
            setFormName("");
            setFormBatchId("");
            setFormTermId("");
            loadData();
        } catch (err: unknown) {
            console.error("Create section failed:", err);
            setFormError(err instanceof Error ? err.message : "Failed to create section");
        } finally {
            setFormSubmitting(false);
        }
    };

    // Handle Delete Section
    const handleDeleteSection = async (section: Section) => {
        const confirmMsg = `Are you sure you want to delete section "${section.name}"? This action cannot be undone.`;
        if (!window.confirm(confirmMsg)) return;

        setDeletingId(section.id);
        setNotice(null);
        try {
            await deleteSection(section.id);
            setNotice({ ok: true, text: `Section "${section.name}" deleted successfully.` });
            loadData();
        } catch (err: unknown) {
            console.error("Delete section failed:", err);
            setNotice({
                ok: false,
                text: err instanceof Error ? err.message : "Failed to delete section",
            });
        } finally {
            setDeletingId(null);
        }
    };

    // Filter Options
    const batchOptions = useMemo(() => {
        return batches.map((b) => ({
            value: String(b.id),
            label: `${b.name} (${b.start_year}–${b.expected_end_year})`,
        }));
    }, [batches]);

    const termOptions = useMemo(() => {
        return terms.map((t) => ({
            value: String(t.id),
            label: `${t.name}${t.is_active ? " (Active)" : ""}`,
        }));
    }, [terms]);

    // Client-side filtering
    const filteredSections = useMemo(() => {
        return sections.filter((s) => {
            // Term filter
            if (termFilter !== "all" && String(s.term_id) !== termFilter) {
                return false;
            }
            // Batch filter
            if (batchFilter !== "all" && String(s.batch_id) !== batchFilter) {
                return false;
            }
            // Search text
            if (searchTerm.trim()) {
                const q = searchTerm.toLowerCase();
                const matchName = s.name?.toLowerCase().includes(q);
                const matchBatch = s.batch_name?.toLowerCase().includes(q);
                const matchProgName = s.programme_name?.toLowerCase().includes(q);
                const matchProgCode = s.programme_code?.toLowerCase().includes(q);
                const matchTerm = s.term_name?.toLowerCase().includes(q);
                const matchId = String(s.id) === q || `#${s.id}`.includes(q);
                return matchName || matchBatch || matchProgName || matchProgCode || matchTerm || matchId;
            }
            return true;
        });
    }, [sections, termFilter, batchFilter, searchTerm]);

    // Reset pagination on filter change
    useEffect(() => {
        setPage(1);
    }, [searchTerm, termFilter, batchFilter, pageSize]);

    // Paginated rows
    const totalPages = Math.max(1, Math.ceil(filteredSections.length / pageSize));

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [totalPages, page]);

    const paginatedSections = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredSections.slice(start, start + pageSize);
    }, [filteredSections, page, pageSize]);

    const isFiltered = searchTerm.trim() !== "" || termFilter !== "all" || batchFilter !== "all";

    return (
        <div className="space-y-5">
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                            Section Management
                        </h1>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {sections.length} {sections.length === 1 ? "Section" : "Sections"}
                        </span>
                    </div>
                    <p className="text-slate-500 text-xs sm:text-sm mt-1">
                        Configure academic sections, linked batches, programmes, and semesters.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
                        title="Reload sections"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-slate-600" : "text-slate-500"}`} />
                        <span>Refresh</span>
                    </button>

                    <button
                        onClick={() => {
                            setFormError(null);
                            setIsAddModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-lg text-xs font-medium shadow-2xs transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Section</span>
                    </button>
                </div>
            </div>

            {/* Notification Banner */}
            {notice && (
                <div
                    className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between gap-2.5 border ${
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
                        className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            {/* Filter & Search Bar */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Filter by section, batch, programme, or semester..."
                        className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-colors"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                {/* Filter Dropdowns */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Term Filter */}
                    <div className="w-48 sm:w-56">
                        <FormSelect
                            value={termFilter}
                            onChange={(val) => setTermFilter(val)}
                            options={[
                                { value: "all", label: "All Semesters" },
                                ...termOptions,
                            ]}
                            placeholder="Filter by Semester"
                        />
                    </div>

                    {/* Batch Filter */}
                    <div className="w-52 sm:w-64">
                        <FormSelect
                            value={batchFilter}
                            onChange={(val) => setBatchFilter(val)}
                            options={[
                                { value: "all", label: "All Batches" },
                                ...batchOptions,
                            ]}
                            placeholder="Filter by Batch"
                        />
                    </div>

                    {/* Reset Filters */}
                    {isFiltered && (
                        <button
                            onClick={() => {
                                setSearchTerm("");
                                setTermFilter("all");
                                setBatchFilter("all");
                            }}
                            className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
                            title="Clear all filters"
                        >
                            <Filter className="h-3.5 w-3.5 text-slate-400" />
                            <span>Clear</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                            <tr>
                                <th className="px-4 py-3 w-16 text-center">S.No.</th>
                                <th className="px-5 py-3">Section Name</th>
                                <th className="px-5 py-3">Batch & Programme</th>
                                <th className="px-5 py-3">Semester</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-14 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-slate-600 mx-auto" />
                                        <p className="text-xs text-slate-500 mt-2 font-medium">
                                            Loading section records…
                                        </p>
                                    </td>
                                </tr>
                            ) : filteredSections.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-6 py-12 text-center text-slate-400 text-xs font-medium"
                                    >
                                        {isFiltered
                                            ? "No sections match your filter criteria"
                                            : "No section records found"}
                                    </td>
                                </tr>
                            ) : (
                                paginatedSections.map((sec, idx) => {
                                    const serialNumber = (page - 1) * pageSize + idx + 1;
                                    const isDeleting = deletingId === sec.id;

                                    return (
                                        <tr
                                            key={sec.id}
                                            className="hover:bg-slate-50/70 transition-colors"
                                        >
                                            {/* S.No. */}
                                            <td className="px-4 py-3 text-center text-slate-400 font-medium text-xs">
                                                {serialNumber}
                                            </td>

                                            {/* Section Name */}
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-slate-900 text-sm">
                                                        {sec.name}
                                                    </span>
                                                    <span className="text-xs text-slate-400 font-normal">
                                                        #{sec.id}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Batch & Programme */}
                                            <td className="px-5 py-3">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-slate-900 text-xs">
                                                            {sec.batch_name || `Batch #${sec.batch_id}`}
                                                        </span>
                                                        {sec.programme_code && (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                                                {sec.programme_code}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-2">
                                                        {sec.programme_name && (
                                                            <span className="truncate max-w-xs text-slate-600">
                                                                {sec.programme_name}
                                                            </span>
                                                        )}
                                                        {sec.start_year && sec.expected_end_year && (
                                                            <span className="text-slate-400">
                                                                ({sec.start_year}–{sec.expected_end_year})
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Semester */}
                                            <td className="px-5 py-3">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-slate-800 font-medium text-xs">
                                                            {sec.term_name || `Session #${sec.term_id}`}
                                                        </span>
                                                        {sec.is_term_active && (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                                Active
                                                            </span>
                                                        )}
                                                    </div>
                                                    {getProgressionSemester(sec.start_year, sec.term_name) && (
                                                        <span className="inline-flex items-center text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded w-fit">
                                                            {getProgressionSemester(sec.start_year, sec.term_name)}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-3 text-right">
                                                <button
                                                    onClick={() => handleDeleteSection(sec)}
                                                    disabled={isDeleting}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors inline-flex items-center justify-center cursor-pointer disabled:opacity-50"
                                                    title={`Delete section ${sec.name}`}
                                                >
                                                    {isDeleting ? (
                                                        <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 text-slate-500">
                        <span>
                            Showing{" "}
                            <strong className="text-slate-800 font-semibold">
                                {filteredSections.length === 0 ? 0 : (page - 1) * pageSize + 1}
                            </strong>{" "}
                            to{" "}
                            <strong className="text-slate-800 font-semibold">
                                {Math.min(page * pageSize, filteredSections.length)}
                            </strong>{" "}
                            of{" "}
                            <strong className="text-slate-800 font-semibold">
                                {filteredSections.length}
                            </strong>{" "}
                            sections
                        </span>
                        <span className="text-slate-300">|</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-slate-500">Per page:</span>
                            <PageSizeDropdown
                                value={pageSize}
                                onChange={(sz) => {
                                    setPageSize(sz);
                                    setPage(1);
                                }}
                            />
                        </div>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors cursor-pointer"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" /> Previous
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                    .reduce<(number | string)[]>((acc, p, idx, arr) => {
                                        if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) {
                                            acc.push("...");
                                        }
                                        acc.push(p);
                                        return acc;
                                    }, [])
                                    .map((p, idx) =>
                                        p === "..." ? (
                                            <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 text-xs">
                                                ...
                                            </span>
                                        ) : (
                                            <button
                                                key={`page-${p}`}
                                                onClick={() => setPage(p as number)}
                                                className={`w-7 h-7 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                                                    page === p
                                                        ? "bg-slate-900 text-white shadow-2xs"
                                                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        )
                                    )}
                            </div>

                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors cursor-pointer"
                            >
                                Next <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Section Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white w-full max-w-lg rounded-xl border border-slate-200 shadow-xl p-6 space-y-5">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                                    Create New Section
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Assign a section to a university batch and academic term.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleCreateSection} className="space-y-4">
                            {formError && (
                                <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg text-xs font-medium flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                                    <span>{formError}</span>
                                </div>
                            )}

                            {/* Section Name */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-700">
                                    Section Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value.toUpperCase())}
                                    placeholder="e.g. CS-IV-A or IT-VI-B"
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-slate-400 focus:ring-1 focus:ring-slate-400 uppercase tracking-wider"
                                    required
                                />
                                <p className="text-[11px] text-slate-400">
                                    Section identifier will be automatically capitalized.
                                </p>
                            </div>

                            {/* Batch Selection */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-700">
                                    Batch <span className="text-red-500">*</span>
                                </label>
                                <FormSelect
                                    value={formBatchId}
                                    onChange={(val) => setFormBatchId(val)}
                                    options={batchOptions}
                                    placeholder="Select Batch..."
                                />
                            </div>

                            {/* Academic Term Selection */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-700">
                                    Semester <span className="text-red-500">*</span>
                                </label>
                                <FormSelect
                                    value={formTermId}
                                    onChange={(val) => setFormTermId(val)}
                                    options={termOptions}
                                    placeholder="Select Semester..."
                                />
                            </div>

                            {/* Modal Footer */}
                            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={formSubmitting}
                                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                                >
                                    {formSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                    <span>{formSubmitting ? "Creating…" : "Create Section"}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}