import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import {
    Calendar,
    UserPlus,
    FolderKanban,
    CheckSquare,
    Loader2,
    CheckCircle2,
    AlertCircle,
    GraduationCap
} from "lucide-react";
import { DashboardShell } from "../../components/DashboardShell";
import type { NavItem } from "../../components/DashboardShell";
import { FormSelect } from "../../components/ui/form-select";
import TeacherAllotmentsTab from "../admin/TeacherAllotmentsTab";
import UniversityTimetableTab from "../admin/UniversityTimetableTab";
import {
    listOfferings,
    listSections,
    bulkEnroll,
    listPendingCorrections,
    resolveCorrection
} from "../../api/admin";
import type { Offering, Section, Correction } from "../../api/admin";

const NAV: NavItem[] = [
    { id: "timetable", label: "University Timetable", icon: <Calendar className="h-4 w-4" /> },
    { id: "allotments", label: "Teacher Allotments", icon: <GraduationCap className="h-4 w-4" /> },
    { id: "enrollment", label: "Bulk Enrollment", icon: <UserPlus className="h-4 w-4" /> },
    { id: "classes", label: "Sections & Classes", icon: <FolderKanban className="h-4 w-4" /> },
    { id: "corrections", label: "Corrections Queue", icon: <CheckSquare className="h-4 w-4" /> },
];

export default function CoordinatorDashboard() {
    const [activeTab, setActiveTab] = useState("timetable");
    const [sections, setSections] = useState<Section[]>([]);
    const [offerings, setOfferings] = useState<Offering[]>([]);
    const [corrections, setCorrections] = useState<Correction[]>([]);

    // Form State for Enrollment
    const [selectedOfferingId, setSelectedOfferingId] = useState<number | "">("");
    const [studentIdsInput, setStudentIdsInput] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

    const loadInitialData = async () => {
        try {
            const [sectionsData, offeringsData, correctionsData] = await Promise.all([
                listSections(),
                listOfferings(),
                listPendingCorrections(),
            ]);

            setSections(sectionsData ?? []);
            setOfferings(offeringsData ?? []);
            setCorrections(correctionsData ?? []);
        } catch (err) {
            setMessage({ ok: false, text: "Failed to load coordinator data" });
        }
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    const handleBulkEnrollment = async (e: FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!selectedOfferingId) {
            setMessage({ ok: false, text: "Please select a target course offering." });
            return;
        }

        const studentIds = studentIdsInput
            .split(",")
            .map((id) => Number(id.trim()))
            .filter((n) => !Number.isNaN(n) && n > 0);

        if (studentIds.length === 0) {
            setMessage({ ok: false, text: "Please enter valid student IDs separated by commas." });
            return;
        }

        setSubmitting(true);
        try {
            const res: any = await bulkEnroll({
                course_offering_id: Number(selectedOfferingId),
                student_ids: studentIds,
            });

            setMessage({
                ok: true,
                text: res?.message || `Successfully enrolled ${studentIds.length} students!`,
            });
            setSelectedOfferingId("");
            setStudentIdsInput("");
        } catch (err) {
            setMessage({ ok: false, text: err instanceof Error ? err.message : "Error enrolling students" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleResolveCorrection = async (id: number, decision: "APPROVE" | "REJECT") => {
        try {
            await resolveCorrection(id, { decision });
            setMessage({ ok: true, text: `Correction #${id} marked as ${decision}` });
            const updated = await listPendingCorrections();
            setCorrections(updated ?? []);
        } catch (err) {
            setMessage({ ok: false, text: err instanceof Error ? err.message : "Error resolving correction" });
        }
    };

    return (
        <DashboardShell
            title="Coordinator Portal"
            nav={NAV}
            active={activeTab}
            onSelect={setActiveTab}
        >
            <div className="space-y-6 animate-in fade-in duration-500">
                {/* Notification */}
                {message && (
                    <div
                        className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 border ${
                            message.ok
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-red-50 text-red-800 border-red-200"
                        }`}
                    >
                        {message.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />}
                        <span>{message.text}</span>
                    </div>
                )}

                {/* Tab 1: University Timetable (Samay Live) */}
                {activeTab === "timetable" && (
                    <UniversityTimetableTab />
                )}

                {/* Tab: Teacher Allotments */}
                {activeTab === "allotments" && (
                    <TeacherAllotmentsTab readOnly={true} />
                )}

                {/* Tab 2: Bulk Enrollment */}
                {activeTab === "enrollment" && (
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                        <div className="border-b border-slate-100 pb-3">
                            <h2 className="text-base font-black text-slate-800 tracking-tight">Bulk Student Enrollment</h2>
                            <p className="text-xs text-slate-400 font-medium">Enroll student IDs into class offerings for the coordinator's program.</p>
                        </div>

                        <form onSubmit={handleBulkEnrollment} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">
                                    Target Course Offering
                                </label>
                                <FormSelect
                                    value={selectedOfferingId}
                                    onChange={(val) => setSelectedOfferingId(val ? Number(val) : "")}
                                    placeholder="-- Choose Class / Section / Teacher --"
                                    options={offerings.map((co) => ({
                                        value: co.id,
                                        label: `[${co.section_name}] ${co.subject_name} — Faculty: ${co.teacher_name} (${co.term_name})`,
                                    }))}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">
                                    Student User IDs (Comma Separated)
                                </label>
                                <textarea
                                    rows={4}
                                    required
                                    value={studentIdsInput}
                                    onChange={(e) => setStudentIdsInput(e.target.value)}
                                    placeholder="101, 102, 103, 104, 105"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-medium focus:bg-white outline-none transition-all"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">
                                    Provide numeric user IDs separated by commas.
                                </p>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-500/25 flex items-center gap-2"
                                >
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                                    <span>Enroll Students</span>
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Tab 3: Sections & Course Allocations */}
                {activeTab === "classes" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Configured Sections</h3>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sections.length} Sections</span>
                            </div>
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50/70 text-slate-400 font-bold text-[10px] uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="px-5 py-3.5">ID</th>
                                        <th className="px-5 py-3.5">Section Name</th>
                                        <th className="px-5 py-3.5">Batch ID</th>
                                        <th className="px-5 py-3.5">Term ID</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {sections.map((s) => (
                                        <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-5 py-3 font-mono text-slate-400">#{s.id}</td>
                                            <td className="px-5 py-3 font-bold text-slate-800">{s.name}</td>
                                            <td className="px-5 py-3 text-slate-600 font-mono">#{s.batch_id}</td>
                                            <td className="px-5 py-3 text-slate-600 font-mono">#{s.term_id}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Course Offerings</h3>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{offerings.length} Offerings</span>
                            </div>
                            <div className="divide-y divide-slate-100 text-xs">
                                {offerings.map((co) => (
                                    <div key={co.id} className="p-4 hover:bg-slate-50/60 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-900">{co.subject_name}</span>
                                            <span className="font-bold text-blue-600">[{co.section_name}]</span>
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                                            <span>Teacher: <strong>{co.teacher_name}</strong></span>
                                            <span>Term: {co.term_name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab 4: Corrections Queue */}
                {activeTab === "corrections" && (
                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Pending Corrections Queue</h3>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{corrections.length} Pending</span>
                        </div>
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50/70 text-slate-400 font-bold text-[10px] uppercase tracking-widest border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">Submitted By</th>
                                    <th className="px-6 py-4">Proposed Status</th>
                                    <th className="px-6 py-4">Reason</th>
                                    <th className="px-6 py-4 text-right">Action Decision</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {corrections.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest">
                                            No pending correction requests.
                                        </td>
                                    </tr>
                                ) : (
                                    corrections.map((c) => (
                                        <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-800">{c.requested_by_name}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                                                    {c.suggested_status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{c.reason}</td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleResolveCorrection(c.id, "APPROVE")}
                                                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleResolveCorrection(c.id, "REJECT")}
                                                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                                                >
                                                    Reject
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}