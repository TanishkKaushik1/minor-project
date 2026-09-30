// src/pages/hod/Dashboard.tsx
import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { DashboardShell } from "../../components/DashboardShell";
import {
    getTerms, createTerm, getCourseOfferings, assignTeacher, getSubjects, getSections, getFaculty,
    getPendingCorrections, resolveCorrection, bulkEnrollStudents, approveLeave,
} from "../../api/hod";
import type { Term, CourseOffering, Subject, Section, Faculty, CorrectionRequest } from "../../api/hod";

export default function HodDashboard() {
    const [activeTab, setActiveTab] = useState<"setup" | "offerings" | "data" | "queues">("setup");
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Data lists
    const [terms, setTerms] = useState<Term[]>([]);
    const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [faculty, setFaculty] = useState<Faculty[]>([]);

    // Form States
    const [termName, setTermName] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isActiveTerm, setIsActiveTerm] = useState(false);

    const [selectedTermId, setSelectedTermId] = useState<number | "">("");
    const [selectedSectionId, setSelectedSectionId] = useState<number | "">("");
    const [selectedSubjectId, setSelectedSubjectId] = useState<number | "">("");
    const [selectedTeacherId, setSelectedTeacherId] = useState<number | "">("");

    const [corrections, setCorrections] = useState<CorrectionRequest[]>([]);
    const [enrollOfferingId, setEnrollOfferingId] = useState<number | "">("");
    const [enrollStudentIds, setEnrollStudentIds] = useState("");
    const [leaveId, setLeaveId] = useState("");

    const fetchAllData = async () => {
        try {
            const [termsData, offeringsData, subjectsData, sectionsData, facultyData, correctionsData] = await Promise.all([
                getTerms(),
                getCourseOfferings(),
                getSubjects(),
                getSections(),
                getFaculty(),
                getPendingCorrections(),
            ]);
            setTerms(termsData);
            setCourseOfferings(offeringsData);
            setSubjects(subjectsData);
            setSections(sectionsData);
            setFaculty(facultyData);
            setCorrections(correctionsData);
        } catch (err) {
            setMessage({ type: "error", text: err instanceof Error ? err.message : "Error fetching data" });
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const handleCreateTerm = async (e: FormEvent) => {
        e.preventDefault();
        setMessage(null);
        try {
            await createTerm({ name: termName, start_date: startDate, end_date: endDate, is_active: isActiveTerm });
            setMessage({ type: "success", text: "Term created successfully!" });
            setTermName("");
            setStartDate("");
            setEndDate("");
            setIsActiveTerm(false);
            fetchAllData();
        } catch (err) {
            setMessage({ type: "error", text: err instanceof Error ? err.message : "Error creating term" });
        }
    };

    const handleAssignTeacher = async (e: FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!selectedTermId || !selectedSectionId || !selectedSubjectId || !selectedTeacherId) {
            setMessage({ type: "error", text: "Please fill all required fields" });
            return;
        }

        try {
            await assignTeacher({
                term_id: Number(selectedTermId),
                section_id: Number(selectedSectionId),
                subject_id: Number(selectedSubjectId),
                teacher_id: Number(selectedTeacherId),
            });
            setMessage({ type: "success", text: "Teacher assigned to class successfully!" });
            setSelectedTermId("");
            setSelectedSectionId("");
            setSelectedSubjectId("");
            setSelectedTeacherId("");
            fetchAllData();
        } catch (err) {
            setMessage({ type: "error", text: err instanceof Error ? err.message : "Error assigning teacher" });
        }
    };

    const handleResolveCorrection = async (id: number, decision: "APPROVED" | "REJECTED") => {
        setMessage(null);
        try {
            await resolveCorrection(id, decision);
            setMessage({ type: "success", text: `Correction #${id} ${decision.toLowerCase()}` });
            fetchAllData();
        } catch (err) {
            setMessage({ type: "error", text: err instanceof Error ? err.message : "Error resolving correction" });
        }
    };

    const handleBulkEnroll = async (e: FormEvent) => {
        e.preventDefault();
        setMessage(null);
        const ids = enrollStudentIds.split(",").map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n));
        if (!enrollOfferingId || ids.length === 0) {
            setMessage({ type: "error", text: "Pick a course offering and at least one valid student ID" });
            return;
        }
        try {
            await bulkEnrollStudents({ course_offering_id: Number(enrollOfferingId), student_ids: ids });
            setMessage({ type: "success", text: `Enrolled ${ids.length} student(s)` });
            setEnrollOfferingId("");
            setEnrollStudentIds("");
        } catch (err) {
            setMessage({ type: "error", text: err instanceof Error ? err.message : "Error enrolling students" });
        }
    };

    const handleApproveLeave = async (e: FormEvent) => {
        e.preventDefault();
        setMessage(null);
        const id = Number(leaveId);
        if (!id) {
            setMessage({ type: "error", text: "Enter a valid leave ID" });
            return;
        }
        try {
            await approveLeave(id);
            setMessage({ type: "success", text: `Leave #${id} approved` });
            setLeaveId("");
        } catch (err) {
            setMessage({ type: "error", text: err instanceof Error ? err.message : "Error approving leave" });
        }
    };

    return (
        <DashboardShell title="HOD Dashboard">
            <div className="space-y-6">
                {/* Nav Tabs */}
                <div className="flex border-b border-slate-200 space-x-4">
                    <button
                        onClick={() => setActiveTab("setup")}
                        className={`py-2 px-4 text-sm font-medium border-b-2 -mb-px transition ${activeTab === "setup"
                            ? "border-slate-800 text-slate-800 font-semibold"
                            : "border-transparent text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        Term Setup
                    </button>
                    <button
                        onClick={() => setActiveTab("offerings")}
                        className={`py-2 px-4 text-sm font-medium border-b-2 -mb-px transition ${activeTab === "offerings"
                            ? "border-slate-800 text-slate-800 font-semibold"
                            : "border-transparent text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        Assign Teacher / Offerings
                    </button>
                    <button
                        onClick={() => setActiveTab("data")}
                        className={`py-2 px-4 text-sm font-medium border-b-2 -mb-px transition ${activeTab === "data"
                            ? "border-slate-800 text-slate-800 font-semibold"
                            : "border-transparent text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        Faculty & Subjects Data
                    </button>
                    <button
                        onClick={() => setActiveTab("queues")}
                        className={`py-2 px-4 text-sm font-medium border-b-2 -mb-px transition ${activeTab === "queues"
                            ? "border-slate-800 text-slate-800 font-semibold"
                            : "border-transparent text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        Corrections, Enrollment & Leaves
                    </button>
                </div>

                {message && (
                    <div
                        className={`p-4 rounded text-sm ${message.type === "success"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-red-50 text-red-800 border border-red-200"
                            }`}
                    >
                        {message.text}
                    </div>
                )}

                {/* Tab 1: Term Setup */}
                {activeTab === "setup" && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4">Create Academic Term</h2>
                            <form onSubmit={handleCreateTerm} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Term Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={termName}
                                        onChange={(e) => setTermName(e.target.value)}
                                        placeholder="Spring 2026"
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800"
                                    />
                                </div>

                                <div className="flex items-center space-x-2 pt-6">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={isActiveTerm}
                                        onChange={(e) => setIsActiveTerm(e.target.checked)}
                                        className="rounded text-slate-800 focus:ring-slate-800 h-4 w-4"
                                    />
                                    <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                                        Set as Active Term
                                    </label>
                                </div>

                                <div className="md:col-span-2 lg:col-span-4 flex justify-end">
                                    <button
                                        type="submit"
                                        className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-5 py-2 rounded text-sm transition"
                                    >
                                        Create Term
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-200 font-semibold text-slate-800">Academic Terms</div>
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                                        <th className="p-3">ID</th>
                                        <th className="p-3">Name</th>
                                        <th className="p-3">Start Date</th>
                                        <th className="p-3">End Date</th>
                                        <th className="p-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {terms.map((t) => (
                                        <tr key={t.id}>
                                            <td className="p-3 font-mono text-xs text-slate-500">{t.id}</td>
                                            <td className="p-3 font-medium text-slate-800">{t.name}</td>
                                            <td className="p-3 text-slate-600">{t.start_date}</td>
                                            <td className="p-3 text-slate-600">{t.end_date}</td>
                                            <td className="p-3">
                                                <span
                                                    className={`px-2 py-0.5 text-xs font-semibold rounded ${t.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                                                        }`}
                                                >
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

                {/* Tab 2: Assign Teacher */}
                {activeTab === "offerings" && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4">Assign Teacher To Class</h2>
                            <form onSubmit={handleAssignTeacher} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Academic Term</label>
                                    <select
                                        value={selectedTermId}
                                        onChange={(e) => setSelectedTermId(e.target.value ? Number(e.target.value) : "")}
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
                                    >
                                        <option value="">Select Term</option>
                                        {terms.map((t) => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Section</label>
                                    <select
                                        value={selectedSectionId}
                                        onChange={(e) => setSelectedSectionId(e.target.value ? Number(e.target.value) : "")}
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
                                    >
                                        <option value="">Select Section</option>
                                        {sections.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
                                    <select
                                        value={selectedSubjectId}
                                        onChange={(e) => setSelectedSubjectId(e.target.value ? Number(e.target.value) : "")}
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
                                    >
                                        <option value="">Select Subject</option>
                                        {subjects.map((sub) => (
                                            <option key={sub.id} value={sub.id}>{sub.course_code} - {sub.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Teacher</label>
                                    <select
                                        value={selectedTeacherId}
                                        onChange={(e) => setSelectedTeacherId(e.target.value ? Number(e.target.value) : "")}
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
                                    >
                                        <option value="">Select Faculty</option>
                                        {faculty.map((f) => (
                                            <option key={f.id} value={f.id}>{f.full_name} ({f.email})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2 flex justify-end mt-2">
                                    <button
                                        type="submit"
                                        className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-5 py-2 rounded text-sm transition"
                                    >
                                        Assign Course Offering
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-200 font-semibold text-slate-800">Course Offerings</div>
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                                        <th className="p-3">ID</th>
                                        <th className="p-3">Term</th>
                                        <th className="p-3">Section</th>
                                        <th className="p-3">Subject</th>
                                        <th className="p-3">Teacher</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {courseOfferings.map((co) => (
                                        <tr key={co.id}>
                                            <td className="p-3 font-mono text-xs text-slate-500">{co.id}</td>
                                            <td className="p-3 text-slate-700">{co.term_name}</td>
                                            <td className="p-3 text-slate-700">{co.section_name}</td>
                                            <td className="p-3 font-medium text-slate-800">{co.subject_name}</td>
                                            <td className="p-3 text-slate-700">{co.teacher_name}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tab 3: Data Overview */}
                {activeTab === "data" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                            <h3 className="font-semibold text-slate-800 mb-3">Faculty List</h3>
                            <ul className="divide-y divide-slate-100 text-sm">
                                {faculty.map((f) => (
                                    <li key={f.id} className="py-2 flex justify-between items-center">
                                        <div>
                                            <div className="font-medium text-slate-800">{f.full_name}</div>
                                            <div className="text-xs text-slate-500">{f.email}</div>
                                        </div>
                                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{f.role}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                            <h3 className="font-semibold text-slate-800 mb-3">Subjects & Sections</h3>
                            <div className="space-y-2">
                                {subjects.map((s) => (
                                    <div key={s.id} className="p-2 bg-slate-50 rounded flex justify-between text-xs">
                                        <span className="font-medium text-slate-700">{s.course_code} - {s.name}</span>
                                        {s.is_elective && <span className="text-slate-400">Elective</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab 4: Corrections, Bulk Enroll, Leaves */}
                {activeTab === "queues" && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-200 font-semibold text-slate-800">Pending Corrections</div>
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                                        <th className="p-3">Requested By</th>
                                        <th className="p-3">Proposed Status</th>
                                        <th className="p-3">Reason</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {corrections.length === 0 ? (
                                        <tr><td colSpan={4} className="p-4 text-center text-slate-500">No pending corrections.</td></tr>
                                    ) : (
                                        corrections.map((c) => (
                                            <tr key={c.id}>
                                                <td className="p-3 text-slate-700">{c.requested_by_name}</td>
                                                <td className="p-3 text-slate-700">{c.proposed_status}</td>
                                                <td className="p-3 text-slate-600">{c.reason}</td>
                                                <td className="p-3 text-right space-x-2">
                                                    <button
                                                        onClick={() => handleResolveCorrection(c.id, "APPROVED")}
                                                        className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded transition"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleResolveCorrection(c.id, "REJECTED")}
                                                        className="text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2.5 py-1 rounded transition"
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

                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4">Bulk Enroll Students</h2>
                            <form onSubmit={handleBulkEnroll} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Course Offering</label>
                                    <select
                                        value={enrollOfferingId}
                                        onChange={(e) => setEnrollOfferingId(e.target.value ? Number(e.target.value) : "")}
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
                                    >
                                        <option value="">Select Offering</option>
                                        {courseOfferings.map((co) => (
                                            <option key={co.id} value={co.id}>
                                                {co.subject_name} – {co.section_name} ({co.term_name})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                        Student IDs (comma-separated — no lookup UI yet, enter known IDs)
                                    </label>
                                    <input
                                        type="text"
                                        value={enrollStudentIds}
                                        onChange={(e) => setEnrollStudentIds(e.target.value)}
                                        placeholder="101, 102, 103"
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                    />
                                </div>
                                <div className="md:col-span-3 flex justify-end">
                                    <button
                                        type="submit"
                                        className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-5 py-2 rounded text-sm transition"
                                    >
                                        Enroll Students
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4">Approve Leave</h2>
                            <p className="text-xs text-slate-500 mb-3">
                                No endpoint yet lists pending leaves — enter a known leave ID to approve it.
                            </p>
                            <form onSubmit={handleApproveLeave} className="flex gap-4 items-end">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Leave ID</label>
                                    <input
                                        type="number"
                                        value={leaveId}
                                        onChange={(e) => setLeaveId(e.target.value)}
                                        placeholder="42"
                                        className="border border-slate-300 rounded px-3 py-2 text-sm w-32"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-5 py-2 rounded text-sm transition"
                                >
                                    Approve
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}
