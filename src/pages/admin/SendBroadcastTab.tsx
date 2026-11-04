import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import {
    Send,
    Megaphone,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Link as LinkIcon,
} from "lucide-react";
import {
    sendBroadcast,
    type NotificationType,
    type NotificationPriority,
    type NotificationScope,
} from "../../api/notifications";
import { listDepartments, listBatches, listSections } from "../../api/admin";
import type { Department, Batch, Section } from "../../api/admin";

export default function SendBroadcastTab() {
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [notifType, setNotifType] = useState<NotificationType>("ANNOUNCEMENT");
    const [priority, setPriority] = useState<NotificationPriority>("NORMAL");
    const [targetRole, setTargetRole] = useState("ALL");
    const [scopeType, setScopeType] = useState<NotificationScope>("UNIVERSITY");
    const [scopeId, setScopeId] = useState<number | undefined>(undefined);
    const [actionUrl, setActionUrl] = useState("");

    const [departments, setDepartments] = useState<Department[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [sections, setSections] = useState<Section[]>([]);

    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

    useEffect(() => {
        listDepartments().then(setDepartments).catch(() => {});
        listBatches().then(setBatches).catch(() => {});
        listSections().then(setSections).catch(() => {});
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setFeedback(null);
        setLoading(true);

        try {
            const res = await sendBroadcast({
                title: title.trim(),
                message: message.trim(),
                notification_type: notifType,
                priority,
                scope_type: scopeType,
                scope_id: scopeId,
                target_role: targetRole,
                action_url: actionUrl.trim() || null,
            });

            setFeedback({
                ok: true,
                text: `Broadcast dispatched successfully to ${res.recipient_count} recipient(s).`,
            });

            // Reset inputs
            setTitle("");
            setMessage("");
            setActionUrl("");
        } catch (err) {
            setFeedback({
                ok: false,
                text: err instanceof Error ? err.message : "Failed to dispatch broadcast.",
            });
        } finally {
            setLoading(false);
        }
    };

    const inputCls =
        "w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold transition-all";
    const labelCls = "block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1";

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header info */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <Megaphone className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-900 tracking-tight">
                            Compose Official Broadcast
                        </h2>
                        <p className="text-xs text-slate-500">
                            Dispatch university circulars, exam notices, and emergency orders to faculties and students.
                        </p>
                    </div>
                </div>
            </div>

            {feedback && (
                <div
                    className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold ${
                        feedback.ok
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-rose-50 border-rose-200 text-rose-800"
                    }`}
                >
                    {feedback.ok ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                        <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    )}
                    <span>{feedback.text}</span>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Notice Title */}
                    <div>
                        <label className={labelCls}>Notice Title</label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. Schedule for Mid-Term Examination 2026-27"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={inputCls}
                        />
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Notification Type */}
                        <div>
                            <label className={labelCls}>Type</label>
                            <select
                                value={notifType}
                                onChange={(e) => setNotifType(e.target.value as NotificationType)}
                                className={inputCls}
                            >
                                <option value="ANNOUNCEMENT">Announcement</option>
                                <option value="CIRCULAR">Circular</option>
                                <option value="ACADEMIC_ORDER">Academic Order</option>
                                <option value="ATTENDANCE_ALERT">Attendance Alert</option>
                                <option value="GENERAL">General Notice</option>
                            </select>
                        </div>

                        {/* Priority */}
                        <div>
                            <label className={labelCls}>Priority</label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as NotificationPriority)}
                                className={inputCls}
                            >
                                <option value="LOW">Low</option>
                                <option value="NORMAL">Normal</option>
                                <option value="HIGH">High</option>
                                <option value="URGENT">Urgent</option>
                            </select>
                        </div>

                        {/* Target Role */}
                        <div>
                            <label className={labelCls}>Target Audience</label>
                            <select
                                value={targetRole}
                                onChange={(e) => setTargetRole(e.target.value)}
                                className={inputCls}
                            >
                                <option value="ALL">Everyone (All Roles)</option>
                                <option value="STUDENT">Students Only</option>
                                <option value="TEACHER">Faculty Only</option>
                                <option value="COORDINATOR">Coordinators Only</option>
                            </select>
                        </div>

                        {/* Scope */}
                        <div>
                            <label className={labelCls}>Target Scope</label>
                            <select
                                value={scopeType}
                                onChange={(e) => {
                                    setScopeType(e.target.value as NotificationScope);
                                    setScopeId(undefined);
                                }}
                                className={inputCls}
                            >
                                <option value="UNIVERSITY">University-wide</option>
                                <option value="DEPARTMENT">Department-wide</option>
                                <option value="BATCH">Specific Batch</option>
                                <option value="SECTION">Specific Section</option>
                            </select>
                        </div>
                    </div>

                    {/* Conditional Scope Selector */}
                    {scopeType === "DEPARTMENT" && (
                        <div>
                            <label className={labelCls}>Select Target Department</label>
                            <select
                                required
                                value={scopeId ?? ""}
                                onChange={(e) => setScopeId(Number(e.target.value))}
                                className={inputCls}
                            >
                                <option value="">Select Department…</option>
                                {departments.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name} ({d.code})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {scopeType === "BATCH" && (
                        <div>
                            <label className={labelCls}>Select Target Batch</label>
                            <select
                                required
                                value={scopeId ?? ""}
                                onChange={(e) => setScopeId(Number(e.target.value))}
                                className={inputCls}
                            >
                                <option value="">Select Batch…</option>
                                {batches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name} ({b.start_year}–{b.expected_end_year})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {scopeType === "SECTION" && (
                        <div>
                            <label className={labelCls}>Select Target Section</label>
                            <select
                                required
                                value={scopeId ?? ""}
                                onChange={(e) => setScopeId(Number(e.target.value))}
                                className={inputCls}
                            >
                                <option value="">Select Section…</option>
                                {sections.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        Section {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Deep Link URL */}
                    <div>
                        <div className="flex items-center gap-1.5 mb-1">
                            <LinkIcon className="h-3 w-3 text-slate-400" />
                            <label className={labelCls}>Attached Document / Link (Optional)</label>
                        </div>
                        <input
                            type="url"
                            placeholder="https://gbu.ac.in/orders/2026-circular.pdf"
                            value={actionUrl}
                            onChange={(e) => setActionUrl(e.target.value)}
                            className={inputCls}
                        />
                    </div>

                    {/* Message Body */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className={labelCls}>Notice Body &amp; Directives</label>
                            <span className="text-[10px] font-bold text-slate-400">
                                {message.length} characters
                            </span>
                        </div>
                        <textarea
                            required
                            rows={6}
                            placeholder="Type the official notification directives, instructions, or examination guidelines here…"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className={inputCls}
                        />
                    </div>

                    {/* Submit Bar */}
                    <div className="pt-2 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Dispatching…</span>
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    <span>Dispatch Broadcast</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
