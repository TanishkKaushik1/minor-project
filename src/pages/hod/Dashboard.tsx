// src/pages/hod/Dashboard.tsx
import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import {
    Calendar,
    UserCheck,
    CheckSquare,
    FileSpreadsheet,
    Users,
    Plus,
    Loader2,
    CheckCircle2,
    AlertCircle,
    UserPlus,
    Clock
} from "lucide-react";
import { DashboardShell } from "../../components/DashboardShell";
import type { NavItem } from "../../components/DashboardShell";
import { DatePicker } from "../../components/ui/date-picker";
import { FormSelect } from "../../components/ui/form-select";
import TeacherAllotmentsTab from "../admin/TeacherAllotmentsTab";
import UniversityTimetableTab from "../admin/UniversityTimetableTab";
import {
    getTerms,
    createTerm,
    getCourseOfferings,
    getSubjects,
    getFaculty,
    getPendingCorrections,
    resolveCorrection,
    bulkEnrollStudents,
    approveLeave,
} from "../../api/hod";
import type {
    Term,
    CourseOffering,
    Subject,
    Faculty,
    CorrectionRequest,
} from "../../api/hod";

const NAV: NavItem[] = [
    { id: "setup", label: "Semester Setup", icon: <Calendar className="h-4 w-4" /> },
    { id: "offerings", label: "Teacher Allotments", icon: <UserCheck className="h-4 w-4" /> },
    { id: "timetable", label: "University Timetable", icon: <Clock className="h-4 w-4" /> },
    { id: "enrollment", label: "Bulk Enrollment", icon: <UserPlus className="h-4 w-4" /> },
    { id: "corrections", label: "Corrections Queue", icon: <CheckSquare className="h-4 w-4" /> },
    { id: "leaves", label: "Leave Approval", icon: <FileSpreadsheet className="h-4 w-4" /> },
    { id: "data", label: "Faculty & Subjects", icon: <Users className="h-4 w-4" /> },
];

export default function HodDashboard() {
    const [activeTab, setActiveTab] = useState("setup");
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Data lists
    const [terms, setTerms] = useState<Term[]>([]);
    const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [faculty, setFaculty] = useState<Faculty[]>([]);
    const [corrections, setCorrections] = useState<CorrectionRequest[]>([]);

    // Form States
    const [termName, setTermName] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isActiveTerm, setIsActiveTerm] = useState(false);

    const [enrollOfferingId, setEnrollOfferingId] = useState<number | "">("");
    const [enrollStudentIds, setEnrollStudentIds] = useState("");
    const [leaveId, setLeaveId] = useState("");

    const fetchAllData = async () => {
        try {
            const [termsData, offeringsData, subjectsData, facultyData, correctionsData] =
                await Promise.all([
                    getTerms(),
                    getCourseOfferings(),
                    getSubjects(),
                    getFaculty(),
                    getPendingCorrections(),
                ]);
            setTerms(termsData ?? []);
            setCourseOfferings(offeringsData ?? []);
            setSubjects(subjectsData ?? []);
            setFaculty(facultyData ?? []);
            setCorrections(correctionsData ?? []);
        } catch (err) {
            setMessage({
                type: "error",
                text: err instanceof Error ? err.message : "Error fetching department data",
            });
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const handleCreateTerm = async (e: FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setSubmitting(true);
        try {
            await createTerm({
                name: termName,
                start_date: startDate,
                end_date: endDate,
                is_active: isActiveTerm,
            });
            setMessage({ type: "success", text: "Academic semester established successfully!" });
            setTermName("");
            setStartDate("");
            setEndDate("");
            setIsActiveTerm(false);
            fetchAllData();
        } catch (err) {
            setMessage({ type: "error", text: err instanceof Error ? err.message : "Error creating semester" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleResolveCorrection = async (id: number, decision: "APPROVED" | "REJECTED") => {
        setMessage(null);
        try {
            await resolveCorrection(id, decision);
            setMessage({ type: "success", text: `Correction request #${id} marked as ${decision}` });
            fetchAllData();
        } catch (err) {
            setMessage({
                type: "error",
                text: err instanceof Error ? err.message : "Error resolving correction",
            });
        }
    };

    const handleBulkEnroll = async (e: FormEvent) => {
        e.preventDefault();
        setMessage(null);
        const ids = enrollStudentIds
            .split(",")
            .map((s) => Number(s.trim()))
            .filter((n) => !Number.isNaN(n) && n > 0);

        if (!enrollOfferingId || ids.length === 0) {
            setMessage({ type: "error", text: "Select a course offering and enter at least one valid student ID" });
            return;
        }

        setSubmitting(true);
        try {
            await bulkEnrollStudents({
                course_offering_id: Number(enrollOfferingId),
                student_ids: ids,
            });
            setMessage({ type: "success", text: `Enrolled ${ids.length} student(s) into class successfully!` });
            setEnrollOfferingId("");
            setEnrollStudentIds("");
        } catch (err) {
            setMessage({ type: "error", text: err instanceof Error ? err.message : "Error enrolling students" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleApproveLeave = async (e: FormEvent) => {
        e.preventDefault();
        setMessage(null);
        const id = Number(leaveId);
        if (!id) {
            setMessage({ type: "error", text: "Enter a valid numeric Leave Request ID" });
            return;
        }

        setSubmitting(true);
        try {
            await approveLeave(id);
            setMessage({ type: "success", text: `Leave Request #${id} verified and approved. Attendance audit logs updated.` });
            setLeaveId("");
        } catch (err) {
            setMessage({ type: "error", text: err instanceof Error ? err.message : "Error approving leave request" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <DashboardShell
            title="HOD Department Portal"
            nav={NAV}
            active={activeTab}
            onSelect={setActiveTab}
        >
            <div className="space-y-6 animate-in fade-in duration-500">
                {/* Status Message */}
                {message && (
                    <div
                        className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 border ${
                            message.type === "success"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-red-50 text-red-800 border-red-200"
                        }`}
                    >
                        {message.type === "success" ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : (
                            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                        )}
                        <span>{message.text}</span>
                    </div>
                )}

                {/* Tab 1: Semester Setup */}
                {activeTab === "setup" && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                            <div className="border-b border-slate-100 pb-3">
                                <h2 className="text-base font-black text-slate-800 tracking-tight">Create Semester</h2>
                                <p className="text-xs text-slate-400 font-medium">Configure semester boundaries and active registration semester.</p>
                            </div>

                            <form onSubmit={handleCreateTerm} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">
                                        Semester Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={termName}
                                        onChange={(e) => setTermName(e.target.value)}
                                        placeholder="Spring 2026"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <DatePicker
                                        label="Start Date"
                                        required
                                        value={startDate}
                                        onChange={setStartDate}
                                        placeholder="Pick start date..."
                                    />
                                </div>

                                <div>
                                    <DatePicker
                                        label="End Date"
                                        required
                                        value={endDate}
                                        onChange={setEndDate}
                                        placeholder="Pick end date..."
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-6">
                                    <label className="flex items-center gap-2.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isActiveTerm}
                                            onChange={(e) => setIsActiveTerm(e.target.checked)}
                                            className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span className="text-xs font-bold text-slate-700">Set as Active Semester</span>
                                    </label>
                                </div>

                                <div className="md:col-span-2 lg:col-span-4 flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-500/25 flex items-center gap-2"
                                    >
                                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                        <span>Establish Semester</span>
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Semesters Table */}
                        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Configured Semesters</h3>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total: {terms.length}</span>
                            </div>
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50/70 text-slate-400 font-bold text-[10px] uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4">ID</th>
                                        <th className="px-6 py-4">Semester Label</th>
                                        <th className="px-6 py-4">Start Date</th>
                                        <th className="px-6 py-4">End Date</th>
                                        <th className="px-6 py-4 text-center">Active Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {terms.map((t) => (
                                        <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-6 py-4 font-mono text-slate-400">#{t.id}</td>
                                            <td className="px-6 py-4 font-bold text-slate-800">{t.name}</td>
                                            <td className="px-6 py-4 text-slate-600">{t.start_date}</td>
                                            <td className="px-6 py-4 text-slate-600">{t.end_date}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl text-[9px] font-black uppercase tracking-wider ${
                                                        t.is_active
                                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                            : "bg-slate-100 text-slate-500 border border-slate-200"
                                                    }`}
                                                >
                                                    <span className={`h-1.5 w-1.5 rounded-full ${t.is_active ? "bg-emerald-500" : "bg-slate-400"}`} />
                                                    {t.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tab 2: Course Offerings & Teacher Allotments */}
                {activeTab === "offerings" && (
                    <TeacherAllotmentsTab readOnly={false} />
                )}

                {/* Tab: University Timetable (Samay Portal) */}
                {activeTab === "timetable" && (
                    <UniversityTimetableTab />
                )}

                {/* Tab 3: Bulk Enrollment */}
                {activeTab === "enrollment" && (
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                        <div className="border-b border-slate-100 pb-3">
                            <h2 className="text-base font-black text-slate-800 tracking-tight">Bulk Student Enrollment</h2>
                            <p className="text-xs text-slate-400 font-medium">Link student rosters to course offerings in bulk.</p>
                        </div>

                        <form onSubmit={handleBulkEnroll} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">
                                    Select Target Course Offering
                                </label>
                                <FormSelect
                                    value={enrollOfferingId}
                                    onChange={(val) => setEnrollOfferingId(val ? Number(val) : "")}
                                    placeholder="-- Choose Class / Section / Teacher --"
                                    options={courseOfferings.map((co) => ({
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
                                    value={enrollStudentIds}
                                    onChange={(e) => setEnrollStudentIds(e.target.value)}
                                    placeholder="101, 102, 103, 104, 105"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-medium focus:bg-white outline-none transition-all"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">
                                    Provide numeric user IDs belonging to active student accounts.
                                </p>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-500/25 flex items-center gap-2"
                                >
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                                    <span>Enroll Student Roster</span>
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Tab 4: Corrections Queue */}
                {activeTab === "corrections" && (
                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Pending Attendance Corrections</h3>
                                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Time-limited 7-day correction window for teacher requests</p>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending: {corrections.length}</span>
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
                                                    {c.proposed_status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{c.reason}</td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleResolveCorrection(c.id, "APPROVED")}
                                                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleResolveCorrection(c.id, "REJECTED")}
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

                {/* Tab 5: Leave Approval */}
                {activeTab === "leaves" && (
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                        <div className="border-b border-slate-100 pb-3">
                            <h2 className="text-base font-black text-slate-800 tracking-tight">Approve Medical Leave Request</h2>
                            <p className="text-xs text-slate-400 font-medium">
                                Review student supporting medical certificates and re-classify historical absent records to approved leave.
                            </p>
                        </div>

                        <form onSubmit={handleApproveLeave} className="max-w-md space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">
                                    Leave Request ID
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={leaveId}
                                    onChange={(e) => setLeaveId(e.target.value)}
                                    placeholder="e.g. 1"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold focus:bg-white outline-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-500/25 flex items-center gap-2"
                            >
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                                <span>Verify & Execute Approval</span>
                            </button>
                        </form>
                    </div>
                )}

                {/* Tab 6: Faculty & Subjects Data */}
                {activeTab === "data" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4">Faculty Directory</h3>
                            <div className="divide-y divide-slate-100 text-xs">
                                {faculty.map((f) => (
                                    <div key={f.id} className="py-3 flex items-center justify-between">
                                        <div>
                                            <div className="font-bold text-slate-900">{f.full_name}</div>
                                            <div className="text-[10px] text-slate-400 font-mono">{f.email}</div>
                                        </div>
                                        <span className="px-2.5 py-0.5 rounded-xl text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                                            {f.role}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4">Subjects & Electives</h3>
                            <div className="divide-y divide-slate-100 text-xs">
                                {subjects.map((s) => (
                                    <div key={s.id} className="py-3 flex items-center justify-between">
                                        <div>
                                            <span className="font-mono text-blue-600 font-bold mr-2">{s.course_code}</span>
                                            <span className="font-bold text-slate-800">{s.name}</span>
                                        </div>
                                        {s.is_elective && (
                                            <span className="px-2 py-0.5 rounded-xl text-[9px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                                                Elective
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}
