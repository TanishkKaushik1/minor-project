import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";

export type Opt = { value: string | number; label: string };
export type Field = {
    name: string;
    upper?: boolean;
    label: string;
    type?: "text" | "number" | "date" | "email" | "password" | "checkbox";
    options?: (vals: Record<string, string>) => Promise<Opt[]>; // renders a <select>
    dependsOn?: string; // reload options (and clear this field) when that field changes
    optional?: boolean; // empty -> null
    showIf?: (vals: Record<string, string>) => boolean;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;
export type Run = (fn: () => Promise<unknown>, okText: string) => void;

type Props = {
    title: string;
    list: () => Promise<Row[]>;
    fields?: Field[];
    create?: (body: Row) => Promise<unknown>; // omit for a read-only list
    columns?: string[];
    remove?: (id: number) => Promise<unknown>;
    defaults?: Record<string, string>;
    rowActions?: (row: Row, run: Run) => ReactNode;
};

const input = "w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-600";
export const btnGood = "text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded transition";
export const btnBad = "text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2.5 py-1 rounded transition";

export default function ResourcePanel({ title, list, fields = [], create, columns, defaults = {}, rowActions, remove }: Props) {
    const [rows, setRows] = useState<Row[]>([]);
    const [vals, setVals] = useState<Record<string, string>>(defaults);
    const [opts, setOpts] = useState<Record<string, Opt[]>>({});
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

    const fail = (e: unknown, fallback: string) => setMsg({ ok: false, text: e instanceof Error ? e.message : fallback });
    const load = () => list().then((r) => setRows(r ?? [])).catch((e) => fail(e, "Failed to load"));

    useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const dep = fields.map((f) => (f.dependsOn ? vals[f.dependsOn] ?? "" : "")).join("|");
    useEffect(() => {
        fields.forEach((f) =>
            f.options?.(vals).then((o) => setOpts((p) => ({ ...p, [f.name]: o }))).catch((e) => fail(e, "Failed to load options"))
        );
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

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const body: Row = {};
        for (const f of fields) {
            if (f.showIf && !f.showIf(vals)) continue;
            const v = vals[f.name] ?? "";
            if (f.type === "checkbox") body[f.name] = v === "true";
            else if (v === "") { if (f.optional) body[f.name] = null; }
            else body[f.name] = f.type === "number" ? Number(v) : v;
        }
        run(async () => {
            await create!(body);
            setVals(defaults);
        }, `${title} created`);
    };

    const cols = columns ?? ["id", ...fields.map((f) => f.name)];
    const set = (n: string, v: string) =>
        setVals((p) => ({
            ...p,
            [n]: v,
            ...Object.fromEntries(fields.filter((f) => f.dependsOn === n).map((f) => [f.name, ""])),
        }));

    return (
        <div className="space-y-8">
            {msg && (
                <div className={`p-4 rounded-md text-sm border ${msg.ok ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}`}>
                    {msg.text}
                </div>
            )}

            {create && (
                <form onSubmit={submit} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
                    {fields.filter((f) => !f.showIf || f.showIf(vals)).map((f) => (
                        <div key={f.name}>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                {f.label}{f.optional && " (optional)"}
                            </label>
                            {f.options ? (
                                <select required={!f.optional} value={vals[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} className={input}>
                                    <option value="">Select…</option>
                                    {(opts[f.name] ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            ) : f.type === "checkbox" ? (
                                <input type="checkbox" checked={vals[f.name] === "true"} onChange={(e) => set(f.name, String(e.target.checked))} className="h-4 w-4 mt-2" />
                            ) : (
                                        <input required={!f.optional} type={f.type ?? "text"} value={vals[f.name] ?? ""} onChange={(e) => set(f.name, f.upper ? e.target.value.toUpperCase() : e.target.value)} className={input} />
                            )}
                        </div>
                    ))}
                    <div className="md:col-span-3 flex justify-end">
                        <button className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-5 py-2 rounded text-sm transition">
                            Create {title}
                        </button>
                    </div>
                </form>
            )}

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-slate-800">{title} List</h2>
                    <button onClick={load} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded font-medium transition">
                        Refresh
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                                {cols.map((c) => <th key={c} className="p-3">{c}</th>)}
                                {(rowActions || remove) && <th className="p-3 text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={cols.length + (rowActions || remove ? 1 : 0)} className="p-4 text-center text-slate-500">
                                        Nothing yet.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((r) => (
                                    <tr key={String(r.id)} className="hover:bg-slate-50/50">
                                        {cols.map((c) => <td key={c} className="p-3 text-slate-700">{String(r[c] ?? "")}</td>)}
                                        {(rowActions || remove) && (
                                            <td className="p-3 text-right space-x-2">
                                                {rowActions?.(r, run)}
                                                {remove && (
                                                    <button
                                                        className={btnBad}
                                                        onClick={() => confirm(`Delete ${title} #${r.id}?`) && run(() => remove(r.id), `${title} #${r.id} deleted`)}
                                                    >
                                                        Delete
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
            </div>
        </div>
    );
}