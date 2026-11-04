import { useState, useEffect } from "react";
import {
    getNotificationSettings,
    updateNotificationSettings,
    type NotificationSettings,
} from "../../api/notifications";

export default function NotificationSettingsTab() {
    const [settings, setSettings] = useState<NotificationSettings>({
        allow_coordinator_broadcast: true,
        allow_teacher_broadcast: false,
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

    useEffect(() => {
        setLoading(true);
        getNotificationSettings()
            .then(setSettings)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleToggle = (key: keyof NotificationSettings) => {
        setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        setSaving(true);
        setFeedback(null);
        try {
            const updated = await updateNotificationSettings(settings);
            setSettings(updated);
            setFeedback({ ok: true, text: "Notification broadcast permissions saved successfully." });
        } catch (err) {
            setFeedback({
                ok: false,
                text: err instanceof Error ? err.message : "Failed to update notification settings.",
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            {feedback && (
                <div
                    className={`p-4 rounded-xl text-xs border font-medium ${
                        feedback.ok
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-red-50 text-red-800 border-red-200"
                    }`}
                >
                    {feedback.text}
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                        Broadcast governance settings
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Configure which university roles are authorized to compose and dispatch broadcast notices.
                    </p>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-xs text-slate-400">Loading settings…</div>
                ) : (
                    <div className="space-y-4">
                        {/* Coordinator Setting */}
                        <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors bg-slate-50/50">
                            <div>
                                <h3 className="text-xs font-semibold text-slate-900">
                                    Coordinator broadcasts
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                                    Allow Programme &amp; Batch Coordinators to broadcast notices, exam announcements, and reminders to their assigned student batches.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleToggle("allow_coordinator_broadcast")}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                                    settings.allow_coordinator_broadcast ? "bg-blue-600" : "bg-slate-300"
                                }`}
                                role="switch"
                                aria-checked={settings.allow_coordinator_broadcast}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                        settings.allow_coordinator_broadcast ? "translate-x-4" : "translate-x-0"
                                    }`}
                                />
                            </button>
                        </div>

                        {/* Teacher Setting */}
                        <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors bg-slate-50/50">
                            <div>
                                <h3 className="text-xs font-semibold text-slate-900">
                                    Teacher broadcasts
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                                    Allow course faculty to broadcast general circulars to full departments. (Recommended disabled; teachers should only notify their enrolled sections).
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleToggle("allow_teacher_broadcast")}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                                    settings.allow_teacher_broadcast ? "bg-blue-600" : "bg-slate-300"
                                }`}
                                role="switch"
                                aria-checked={settings.allow_teacher_broadcast}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                        settings.allow_teacher_broadcast ? "translate-x-4" : "translate-x-0"
                                    }`}
                                />
                            </button>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-5 py-2 rounded-xl text-xs transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                            >
                                {saving ? "Saving…" : "Save settings"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
