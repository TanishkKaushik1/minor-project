import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { bulkEnroll, listOfferings, listUsers } from "../../api/admin";
import type { Offering, User } from "../../api/admin";

const input = "w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-600";

export default function EnrollmentsTab() {
    const [offerings, setOfferings] = useState<Offering[]>([]);
    const [students, setStudents] = useState<User[]>([]);
    const [offering, setOffering] = useState("");
    const [picked, setPicked] = useState<string[]>([]);
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

    useEffect(() => {
        Promise.all([listOfferings(), listUsers()])
            .then(([o, u]) => {
                setOfferings(o ?? []);
                setStudents((u ?? []).filter((x) => x.role === "STUDENT" && x.is_active));
            })
            .catch((e) => setMsg({ ok: false, text: e instanceof Error ? e.message : "Failed to load" }));
    }, []);

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        setMsg(null);
        try {
            await bulkEnroll({ course_offering_id: Number(offering), student_ids: picked.map(Number) });
            setMsg({ ok: true, text: `Enrolled ${picked.length} student(s)` });
            setPicked([]);
        } catch (err) {
            setMsg({ ok: false, text: err instanceof Error ? err.message : "Enrollment failed" });
        }
    };

    return (
        <div className="space-y-8">
            {msg && (
                <div className={`p-4 rounded-md text-sm border ${msg.ok ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}`}>
                    {msg.text}
                </div>
            )}
            <form onSubmit={submit} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Course Offering</label>
                    <select required value={offering} onChange={(e) => setOffering(e.target.value)} className={input}>
                        <option value="">Select…</option>
                        {offerings.map((o) => (
                            <option key={o.id} value={o.id}>
                                #{o.id} · {o.subject_name} · {o.section_name} · {o.teacher_name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Students (Ctrl/Cmd-click for multiple) · {picked.length} selected
                    </label>
                    <select
                        multiple
                        required
                        value={picked}
                        onChange={(e) => setPicked(Array.from(e.target.selectedOptions, (o) => o.value))}
                        className={`${input} h-64`}
                    >
                        {students.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.roll_number ? `${s.roll_number} · ` : ""}{s.full_name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-end">
                    <button className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-5 py-2 rounded text-sm transition">
                        Enroll Students
                    </button>
                </div>
            </form>
        </div>
    );
}