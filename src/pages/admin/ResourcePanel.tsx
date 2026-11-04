// src/pages/admin/ResourcePanel.tsx
import { useEffect, useRef, useState, useMemo } from "react";
import type { FormEvent, ReactNode } from "react";
import {
    Plus,
    Trash2,
    Search,
    Loader2,
    CheckCircle2,
    AlertCircle,
    X,
    ChevronLeft,
    ChevronRight,
    Pencil
} from "lucide-react";
import { DatePicker } from "../../components/ui/date-picker";
import { PageSizeDropdown } from "../../components/ui/page-size-dropdown";
import { FormSelect } from "../../components/ui/form-select";

export type Opt = { value: string | number; label: string };
export type Field = {
    name: string;
    upper?: boolean;
    label: string;
    placeholder?: string;
    type?: "text" | "number" | "date" | "email" | "password" | "checkbox";
    options?: (vals: Record<string, string>) => Promise<Opt[]>;
    dependsOn?: string;
    optional?: boolean;
    showIf?: (vals: Record<string, string>) => boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;
export type Run = (fn: () => Promise<unknown>, okText: string) => void;

type Props = {
    title: string;
    list: () => Promise<Row[]>;
    fields?: Field[];
    editFields?: Field[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create?: (body: any) => Promise<unknown>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    edit?: (id: number, body: any) => Promise<unknown>;
    columns?: string[];
    remove?: (id: number) => Promise<unknown>;
    defaults?: Record<string, string>;
    rowActions?: (row: Row, run: Run) => ReactNode;
    showSerial?: boolean;
};

export const btnGood =
    "px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50 disabled:pointer-events-none";

export const btnBad =
    "px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50 disabled:pointer-events-none";

export default function ResourcePanel({
    title,
    list,
    fields = [],
    editFields,
    create,
    edit,
    columns,
    defaults = {},
    rowActions,
    remove,
    showSerial = true,
}: Props) {
    const [rows, setRows] = useState<Row[]>([]);
    const [vals, setVals] = useState<Record<string, string>>(defaults);
    const [opts, setOpts] = useState<Record<string, Opt[]>>({});
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const [editingRow, setEditingRow] = useState<Row | null>(null);
    const [editVals, setEditVals] = useState<Record<string, string>>({});
    const [editOpts, setEditOpts] = useState<Record<string, Opt[]>>({});

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    const activeEditFields = editFields && editFields.length > 0 ? editFields : fields;
    const seen = useRef<Record<string, string>>({});

    const fail = (e: unknown, fallback: string) =>
        setMsg({ ok: false, text: e instanceof Error ? e.message : fallback });

    const load = async () => {
        setLoading(true);
        try {
            const r = await list();
            setRows(r ?? []);
        } catch (e) {
            fail(e, "Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const dep = fields.map((f) => (f.dependsOn ? vals[f.dependsOn] ?? "" : "")).join("|");
    useEffect(() => {
        fields.forEach((f) => {
            if (!f.options) return;
            const key = f.dependsOn ? vals[f.dependsOn] ?? "" : "";
            if (seen.current[f.name] === key) return;
            seen.current[f.name] = key;
            f.options(vals)
                .then((o) => setOpts((p) => ({ ...p, [f.name]: o })))
                .catch((e) => fail(e, "Failed to load options"));
        });
    }, [dep]); // eslint-disable-line react-hooks/exhaustive-deps

    const run: Run = async (fn, okText) => {
        setMsg(null);
        try {
            await fn();
            setMsg({ ok: true, text: okText });
            load();
        } catch (e) {
            fail(e, "Action failed");
        }
    };

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMsg(null);

        const body: Row = {};
        for (const f of fields) {
            if (f.showIf && !f.showIf(vals)) continue;
            const v = vals[f.name] ?? "";
            if (f.type === "checkbox") body[f.name] = v === "true";
            else if (v === "") {
                if (f.optional) body[f.name] = null;
            } else body[f.name] = f.type === "number" ? Number(v) : v;
        }

        try {
            await create!(body);
            setMsg({ ok: true, text: `${title} created successfully` });
            setVals(defaults);
            setIsFormOpen(false);
            load();
        } catch (e) {
            fail(e, `Failed to create ${title.toLowerCase()}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenEdit = (r: Row) => {
        setEditingRow(r);
        const initialVals: Record<string, string> = {};
        activeEditFields.forEach((f) => {
            if (r[f.name] !== undefined && r[f.name] !== null) {
                initialVals[f.name] = String(r[f.name]);
            } else {
                initialVals[f.name] = "";
            }
        });
        setEditVals(initialVals);
        activeEditFields.forEach((f) => {
            if (f.options) {
                f.options(initialVals)
                    .then((o) => setEditOpts((p) => ({ ...p, [f.name]: o })))
                    .catch((e) => fail(e, "Failed to load options"));
            }
        });
    };

    const setEditVal = (n: string, v: string) => {
        setEditVals((p) => {
            const next = {
                ...p,
                [n]: v,
                ...Object.fromEntries(activeEditFields.filter((f) => f.dependsOn === n).map((f) => [f.name, ""])),
            };
            activeEditFields.forEach((f) => {
                if (f.options && f.dependsOn === n) {
                    f.options(next)
                        .then((o) => setEditOpts((prev) => ({ ...prev, [f.name]: o })))
                        .catch((e) => fail(e, "Failed to load options"));
                }
            });
            return next;
        });
    };

    const submitEdit = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingRow || !edit) return;
        setSubmitting(true);
        setMsg(null);

        const body: Row = {};
        for (const f of activeEditFields) {
            if (f.showIf && !f.showIf(editVals)) continue;
            const v = editVals[f.name] ?? "";
            if (f.type === "checkbox") body[f.name] = v === "true";
            else if (v === "") {
                if (f.optional) body[f.name] = null;
            } else body[f.name] = f.type === "number" ? Number(v) : v;
        }

        try {
            await edit(editingRow.id, body);
            setMsg({ ok: true, text: `${title} updated successfully` });
            setEditingRow(null);
            load();
        } catch (e) {
            fail(e, `Failed to update ${title.toLowerCase()}`);
        } finally {
            setSubmitting(false);
        }
    };

    const setVal = (n: string, v: string) => {
        setVals((p) => ({
            ...p,
            [n]: v,
            ...Object.fromEntries(fields.filter((f) => f.dependsOn === n).map((f) => [f.name, ""])),
        }));
    };

    // Filter rows based on search
    const filteredRows = useMemo(() => {
        if (!searchTerm.trim()) return rows;
        const q = searchTerm.toLowerCase().trim();
        return rows.filter((r) =>
            Object.values(r).some((v) =>
                v !== null && v !== undefined && String(v).toLowerCase().includes(q)
            )
        );
    }, [rows, searchTerm]);

    const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
    const paginatedRows = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredRows.slice(start, start + pageSize);
    }, [filteredRows, page, pageSize]);

    const cols = useMemo(() => {
        if (columns && columns.length > 0) return columns;
        if (rows[0]) {
            return Object.keys(rows[0]).filter(
                (k) => !["created_at", "updated_at", "password_hash"].includes(k)
            );
        }
        return [];
    }, [columns, rows]);

    return (
        <div className="space-y-4">
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
                        {title} Management
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Configure and review university {title.toLowerCase()} records.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {create && (
                        <button
                            onClick={() => setIsFormOpen(!isFormOpen)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {isFormOpen ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                            <span>{isFormOpen ? "Close form" : `Add ${title}`}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Notification Banner */}
            {msg && (
                <div
                    className={`p-3 rounded-md text-xs font-medium flex items-center justify-between border ${
                        msg.ok
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-red-50 text-red-800 border-red-200"
                    }`}
                >
                    <div className="flex items-center gap-2">
                        {msg.ok ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : (
                            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                        )}
                        <span>{msg.text}</span>
                    </div>
                    <button
                        onClick={() => setMsg(null)}
                        className="text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 rounded p-0.5"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            {/* Create Form Drawer / Card */}
            {create && isFormOpen && (
                <form
                    onSubmit={submit}
                    className="bg-white p-5 rounded-lg border border-slate-200 space-y-4 shadow-xs"
                >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                        <h3 className="text-xs font-semibold text-slate-900">
                            Create new {title.toLowerCase()}
                        </h3>
                        <span className="text-[11px] text-slate-500 font-normal">
                            All marked fields are required
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {fields.map((f) => {
                            if (f.showIf && !f.showIf(vals)) return null;

                            if (f.type === "checkbox") {
                                return (
                                    <label
                                        key={f.name}
                                        className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-md cursor-pointer hover:bg-slate-100/70 transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                            checked={vals[f.name] === "true"}
                                            onChange={(e) => setVal(f.name, String(e.target.checked))}
                                        />
                                        <span className="text-xs font-medium text-slate-800">{f.label}</span>
                                    </label>
                                );
                            }

                            if (f.options) {
                                return (
                                    <div key={f.name}>
                                        <label className="text-xs font-medium text-slate-700 mb-1 block">
                                            {f.label} {!f.optional && <span className="text-red-500">*</span>}
                                        </label>
                                        <FormSelect
                                            options={opts[f.name] ?? []}
                                            required={!f.optional}
                                            value={vals[f.name] ?? ""}
                                            onChange={(val) => setVal(f.name, val)}
                                            placeholder={f.placeholder ?? `Select ${f.label.toLowerCase()}…`}
                                        />
                                    </div>
                                );
                            }

                            if (f.type === "date") {
                                return (
                                    <div key={f.name}>
                                        <label className="text-xs font-medium text-slate-700 mb-1 block">
                                            {f.label} {!f.optional && <span className="text-red-500">*</span>}
                                        </label>
                                        <DatePicker
                                            value={vals[f.name] ?? ""}
                                            onChange={(val) => setVal(f.name, val)}
                                            placeholder="YYYY-MM-DD"
                                        />
                                    </div>
                                );
                            }

                            return (
                                <div key={f.name}>
                                    <label className="text-xs font-medium text-slate-700 mb-1 block">
                                        {f.label} {!f.optional && <span className="text-red-500">*</span>}
                                    </label>
                                    <input
                                        type={f.type ?? "text"}
                                        required={!f.optional}
                                        value={vals[f.name] ?? ""}
                                        onChange={(e) =>
                                            setVal(f.name, f.upper ? e.target.value.toUpperCase() : e.target.value)
                                        }
                                        placeholder={f.placeholder ?? `Enter ${f.label.toLowerCase()}…`}
                                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus:border-blue-600 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                                    />
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setIsFormOpen(false)}
                            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {submitting ? <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                            <span>Create {title.toLowerCase()}</span>
                        </button>
                    </div>
                </form>
            )}

            {/* Edit Form Modal */}
            {editingRow && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <form
                        onSubmit={submitEdit}
                        className="bg-white w-full max-w-xl p-5 rounded-lg border border-slate-200 space-y-4 shadow-lg max-h-[90vh] overflow-y-auto custom-scrollbar"
                    >
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                            <h3 className="text-xs font-semibold text-slate-900">
                                Edit {title.toLowerCase()} #{editingRow.id}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setEditingRow(null)}
                                className="text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 rounded p-0.5"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {activeEditFields.map((f) => {
                                if (f.showIf && !f.showIf(editVals)) return null;

                                if (f.type === "checkbox") {
                                    return (
                                        <label
                                            key={f.name}
                                            className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-md cursor-pointer hover:bg-slate-100/70 transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                                checked={editVals[f.name] === "true"}
                                                onChange={(e) => setEditVal(f.name, String(e.target.checked))}
                                            />
                                            <span className="text-xs font-medium text-slate-800">{f.label}</span>
                                        </label>
                                    );
                                }

                                if (f.options) {
                                    return (
                                        <div key={f.name}>
                                            <label className="text-xs font-medium text-slate-700 mb-1 block">
                                                {f.label} {!f.optional && <span className="text-red-500">*</span>}
                                            </label>
                                            <FormSelect
                                                options={editOpts[f.name] ?? []}
                                                required={!f.optional}
                                                value={editVals[f.name] ?? ""}
                                                onChange={(val) => setEditVal(f.name, val)}
                                                placeholder={f.placeholder ?? `Select ${f.label.toLowerCase()}…`}
                                            />
                                        </div>
                                    );
                                }

                                if (f.type === "date") {
                                    return (
                                        <div key={f.name}>
                                            <label className="text-xs font-medium text-slate-700 mb-1 block">
                                                {f.label} {!f.optional && <span className="text-red-500">*</span>}
                                            </label>
                                            <DatePicker
                                                value={editVals[f.name] ?? ""}
                                                onChange={(val) => setEditVal(f.name, val)}
                                                placeholder="YYYY-MM-DD"
                                            />
                                        </div>
                                    );
                                }

                                return (
                                    <div key={f.name}>
                                        <label className="text-xs font-medium text-slate-700 mb-1 block">
                                            {f.label} {!f.optional && <span className="text-red-500">*</span>}
                                        </label>
                                        <input
                                            type={f.type ?? "text"}
                                            required={!f.optional}
                                            value={editVals[f.name] ?? ""}
                                            onChange={(e) =>
                                                setEditVal(f.name, f.upper ? e.target.value.toUpperCase() : e.target.value)
                                            }
                                            placeholder={f.placeholder ?? `Enter ${f.label.toLowerCase()}…`}
                                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus:border-blue-600 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setEditingRow(null)}
                                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {submitting && <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" />}
                                <span>Save changes</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filter & Search Bar */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <input
                        type="search"
                        placeholder={`Filter ${title.toLowerCase()} records…`}
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(1);
                        }}
                        className="w-full pl-8 pr-7 h-8.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus:border-blue-600 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm("")}
                            aria-label="Clear filter"
                            className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 focus-visible:outline-none"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
                {searchTerm && (
                    <span className="text-xs text-slate-500 tabular-nums">
                        {filteredRows.length} matching
                    </span>
                )}
            </div>

            {/* Table Container: High-density institutional ledger */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                            <tr>
                                {showSerial && (
                                    <th className="px-4 py-2.5 w-14 font-semibold text-slate-600">
                                        S.No.
                                    </th>
                                )}
                                {cols.map((c) => (
                                    <th key={c} className="px-4 py-2.5 font-semibold text-slate-600 capitalize">
                                        {c === "term_name" ? "Semester" : c === "is_term_active" ? "Active Semester" : c.replace(/_/g, " ")}
                                    </th>
                                ))}
                                {(remove || edit || rowActions) && (
                                    <th className="px-4 py-2.5 text-right font-semibold text-slate-600">Actions</th>
                                )}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-200 text-slate-700">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={cols.length + (showSerial ? 1 : 0) + ((remove || edit || rowActions) ? 1 : 0)}
                                        className="px-4 py-12 text-center"
                                    >
                                        <Loader2 className="h-6 w-6 motion-safe:animate-spin text-blue-600 mx-auto" />
                                        <p className="text-xs text-slate-500 mt-2 font-medium">
                                            Loading {title.toLowerCase()} records…
                                        </p>
                                    </td>
                                </tr>
                            ) : filteredRows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={cols.length + (showSerial ? 1 : 0) + ((remove || edit || rowActions) ? 1 : 0)}
                                        className="px-4 py-10 text-center text-slate-500 text-xs font-medium"
                                    >
                                        No {title.toLowerCase()} records found
                                    </td>
                                </tr>
                            ) : (
                                paginatedRows.map((r, i) => (
                                    <tr key={r.id ?? i} className="hover:bg-slate-50 transition-colors">
                                        {showSerial && (
                                            <td className="px-4 py-2.5 font-mono tabular-nums text-slate-500 text-xs">
                                                {(page - 1) * pageSize + i + 1}
                                            </td>
                                        )}

                                        {cols.map((c) => {
                                            const val = r[c];
                                            const isId = c === "id";
                                            const isStatus = typeof val === "boolean" || c === "status" || c === "is_active";
                                            const isCourseType = c === "course_type" || c === "activity";

                                            return (
                                                <td key={c} className="px-4 py-2.5">
                                                    {isId ? (
                                                        <span className="font-mono tabular-nums text-slate-500 text-xs font-medium">
                                                            #{val}
                                                        </span>
                                                    ) : isStatus ? (
                                                        <span
                                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                                                                val
                                                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                                                    : "bg-slate-100 text-slate-600 border border-slate-200"
                                                            }`}
                                                        >
                                                            {val ? "Active" : "Inactive"}
                                                        </span>
                                                    ) : isCourseType ? (
                                                        <span
                                                            className="inline-block px-2 py-0.5 rounded text-[11px] font-medium border bg-blue-50 text-blue-800 border-blue-200 capitalize"
                                                        >
                                                            {String(val || "Lecture").toLowerCase()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-900 font-medium">
                                                            {val !== null && val !== undefined ? String(val) : "—"}
                                                        </span>
                                                    )}
                                                </td>
                                            );
                                        })}

                                        {(remove || edit || rowActions) && (
                                            <td className="px-4 py-2.5 text-right space-x-1 whitespace-nowrap">
                                                {rowActions && rowActions(r, run)}
                                                {edit && (
                                                    <button
                                                        onClick={() => handleOpenEdit(r)}
                                                        className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors inline-flex focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                                                        title={`Edit ${title}`}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                                {remove && (
                                                    <button
                                                        disabled={r.is_active === true}
                                                        onClick={() => {
                                                            if (r.is_active === true) {
                                                                alert(`Cannot delete active ${title.toLowerCase()}. Activate another first.`);
                                                                return;
                                                            }
                                                            if (confirm(`Are you sure you want to delete this ${title.toLowerCase()}?`)) {
                                                                run(() => remove(r.id), `${title} removed`);
                                                            }
                                                        }}
                                                        className={`p-1 rounded transition-colors inline-flex focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500 ${
                                                            r.is_active === true
                                                                ? "text-slate-300 cursor-not-allowed opacity-40"
                                                                : "text-slate-500 hover:text-red-700 hover:bg-red-50"
                                                        }`}
                                                        title={r.is_active === true ? "Cannot delete active record" : "Delete record"}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination & Status Footer */}
                <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 text-slate-600 font-medium">
                        <span>
                            Showing <strong className="text-slate-900 tabular-nums">{filteredRows.length === 0 ? 0 : (page - 1) * pageSize + 1}</strong> to <strong className="text-slate-900 tabular-nums">{Math.min(page * pageSize, filteredRows.length)}</strong> of <strong className="text-slate-900 tabular-nums">{filteredRows.length}</strong> records
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
                                options={[10, 15, 25, 50, 100]}
                            />
                        </div>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 active:scale-[0.98]"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                                <span>Previous</span>
                            </button>

                            <div className="flex items-center gap-0.5">
                                {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
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
                                                onClick={() => setPage(p as number)}
                                                className={`w-7 h-7 rounded text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 ${
                                                    page === p
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
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
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
    );
}
