// src/pages/admin/CreditsWorkloadTab.tsx
import { useState, useEffect, useCallback, useMemo, Fragment } from "react";
import {
    Award,
    Users,
    Clock,
    BookOpen,
    Search,
    Loader2,
    RefreshCw,
    CheckCircle2,
    FileSpreadsheet,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Edit3,
    Check,
    X,
} from "lucide-react";
import { PageSizeDropdown } from "../../components/ui/page-size-dropdown";
import { FormSelect } from "../../components/ui/form-select";
import {
    getFacultyWorkloadReport,
    getStudentCreditAudit,
    listSubjectsWithCredits,
    syncCreditsFromTimetable,
    updateSubjectCredits,
} from "../../api/admin";
import type {
    FacultyWorkloadReport,
    StudentCreditAuditReport,
    StudentCreditAuditItem,
    SubjectWithCredits,
    SyncCreditsResult,
} from "../../api/admin";

export default function CreditsWorkloadTab() {
    const [subTab, setSubTab] = useState<"faculty" | "students" | "subjects">("faculty");

    // Faculty Workload state
    const [workloadReport, setWorkloadReport] = useState<FacultyWorkloadReport | null>(null);
    const [facultySearch, setFacultySearch] = useState("");
    const [facultyLoading, setFacultyLoading] = useState(true);
    const [expandedTeacherId, setExpandedTeacherId] = useState<number | null>(null);

    // Student Credits state
    const [studentReport, setStudentReport] = useState<StudentCreditAuditReport | null>(null);
    const [studentSearch, setStudentSearch] = useState("");
    const [studentLoading, setStudentLoading] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentCreditAuditItem | null>(null);

    // Subjects Directory state
    const [subjectsList, setSubjectsList] = useState<SubjectWithCredits[]>([]);
    const [subjectsSearch, setSubjectsSearch] = useState("");
    const [subjectsLoading, setSubjectsLoading] = useState(false);
    const [editingSubject, setEditingSubject] = useState<SubjectWithCredits | null>(null);
    const [editCredits, setEditCredits] = useState<number>(3);
    const [editType, setEditType] = useState<string>("LECTURE");
    const [savingSubject, setSavingSubject] = useState(false);

    // Syncing state
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<SyncCreditsResult | null>(null);

    /* =========================================================================
     * FETCH DATA
     * ========================================================================= */

    const fetchFacultyWorkload = useCallback(async () => {
        setFacultyLoading(true);
        try {
            const data = await getFacultyWorkloadReport(facultySearch.trim() || undefined);
            setWorkloadReport(data);
        } catch (err) {
            console.error("Failed to load faculty workload:", err);
        } finally {
            setFacultyLoading(false);
        }
    }, [facultySearch]);

    const fetchStudentAudit = useCallback(async () => {
        setStudentLoading(true);
        try {
            const data = await getStudentCreditAudit(undefined, studentSearch.trim() || undefined);
            setStudentReport(data);
        } catch (err) {
            console.error("Failed to load student credit audit:", err);
        } finally {
            setStudentLoading(false);
        }
    }, [studentSearch]);

    const fetchSubjects = useCallback(async () => {
        setSubjectsLoading(true);
        try {
            const data = await listSubjectsWithCredits(subjectsSearch.trim() || undefined);
            setSubjectsList(data);
        } catch (err) {
            console.error("Failed to load subjects:", err);
        } finally {
            setSubjectsLoading(false);
        }
    }, [subjectsSearch]);

    useEffect(() => {
        if (subTab === "faculty") fetchFacultyWorkload();
        else if (subTab === "students") fetchStudentAudit();
        else if (subTab === "subjects") fetchSubjects();
    }, [subTab, fetchFacultyWorkload, fetchStudentAudit, fetchSubjects]);

    /* =========================================================================
     * ACTIONS
     * ========================================================================= */

    const handleSync = async () => {
        setIsSyncing(true);
        setSyncResult(null);
        try {
            const res = await syncCreditsFromTimetable();
            setSyncResult(res);
            // Refresh current tab
            if (subTab === "faculty") fetchFacultyWorkload();
            else if (subTab === "students") fetchStudentAudit();
            else if (subTab === "subjects") fetchSubjects();
        } catch (err) {
            console.error("Sync failed:", err);
            alert("Failed to sync credits and workload from timetable.");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleStartEdit = (s: SubjectWithCredits) => {
        setEditingSubject(s);
        setEditCredits(s.credits);
        setEditType(s.course_type || "LECTURE");
    };

    const handleSaveEdit = async () => {
        if (!editingSubject) return;
        setSavingSubject(true);
        try {
            const updated = await updateSubjectCredits(editingSubject.id, {
                credits: editCredits,
                course_type: editType,
            });
            setSubjectsList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
            setEditingSubject(null);
        } catch (err) {
            console.error("Failed to update subject:", err);
            alert("Failed to update subject credits.");
        } finally {
            setSavingSubject(false);
        }
    };

    /* =========================================================================
     * HELPERS & STYLES
     * ========================================================================= */

    const getTypeBadge = (type: string) => {
        switch (type?.toUpperCase()) {
            case "LAB":
            case "PRACTICAL":
                return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case "PROJECT":
                return "bg-purple-50 text-purple-700 border-purple-200";
            case "TRAINING":
            case "INTERNSHIP":
                return "bg-amber-50 text-amber-700 border-amber-200";
            case "SEMINAR":
                return "bg-slate-100 text-slate-700 border-slate-200";
            default:
                return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    const filteredTeachers = useMemo(() => {
        if (!workloadReport?.teachers) return [];
        return workloadReport.teachers;
    }, [workloadReport]);

    // Faculty Pagination
    const [facultyPage, setFacultyPage] = useState(1);
    const [facultyPageSize, setFacultyPageSize] = useState(15);

    useEffect(() => {
        setFacultyPage(1);
    }, [facultySearch]);

    const totalFacultyPages = Math.max(1, Math.ceil(filteredTeachers.length / facultyPageSize));

    useEffect(() => {
        if (facultyPage > totalFacultyPages) {
            setFacultyPage(totalFacultyPages);
        }
    }, [totalFacultyPages, facultyPage]);

    const paginatedTeachers = useMemo(() => {
        const start = (facultyPage - 1) * facultyPageSize;
        return filteredTeachers.slice(start, start + facultyPageSize);
    }, [filteredTeachers, facultyPage, facultyPageSize]);

    const filteredStudents = useMemo(() => {
        if (!studentReport?.students) return [];
        return studentReport.students;
    }, [studentReport]);

    // Student Pagination
    const [studentPage, setStudentPage] = useState(1);
    const [studentPageSize, setStudentPageSize] = useState(20);

    useEffect(() => {
        setStudentPage(1);
    }, [studentSearch]);

    const totalStudentPages = Math.max(1, Math.ceil(filteredStudents.length / studentPageSize));

    useEffect(() => {
        if (studentPage > totalStudentPages) {
            setStudentPage(totalStudentPages);
        }
    }, [totalStudentPages, studentPage]);

    const paginatedStudents = useMemo(() => {
        const start = (studentPage - 1) * studentPageSize;
        return filteredStudents.slice(start, start + studentPageSize);
    }, [filteredStudents, studentPage, studentPageSize]);

    // Subjects Pagination
    const [subjectsPage, setSubjectsPage] = useState(1);
    const [subjectsPageSize, setSubjectsPageSize] = useState(20);

    useEffect(() => {
        setSubjectsPage(1);
    }, [subjectsSearch]);

    const totalSubjectsPages = Math.max(1, Math.ceil(subjectsList.length / subjectsPageSize));

    useEffect(() => {
        if (subjectsPage > totalSubjectsPages) {
            setSubjectsPage(totalSubjectsPages);
        }
    }, [totalSubjectsPages, subjectsPage]);

    const paginatedSubjects = useMemo(() => {
        const start = (subjectsPage - 1) * subjectsPageSize;
        return subjectsList.slice(start, start + subjectsPageSize);
    }, [subjectsList, subjectsPage, subjectsPageSize]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                        Academic Credits & Faculty Workload
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Live credit accounting for students and teaching load distribution for faculty linked directly to official university allocations.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:bg-slate-400 text-white rounded-lg text-xs font-medium shadow-2xs transition-colors cursor-pointer"
                        title="Sync credits and workload from university timetable allocations"
                    >
                        <Sparkles className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                        <span>{isSyncing ? "Syncing..." : "Sync from Timetable"}</span>
                    </button>

                    <button
                        onClick={() => {
                            if (subTab === "faculty") fetchFacultyWorkload();
                            else if (subTab === "students") fetchStudentAudit();
                            else if (subTab === "subjects") fetchSubjects();
                        }}
                        className="inline-flex items-center justify-center p-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                        title="Refresh"
                    >
                        <RefreshCw className="h-4 w-4 text-slate-600" />
                    </button>
                </div>
            </div>

            {/* Sync Alert Banner */}
            {syncResult && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between gap-3 text-emerald-800 text-xs">
                    <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <div>
                            <p className="font-semibold text-slate-900">{syncResult.message}</p>
                            <p className="text-[11px] text-slate-600 mt-0.5">
                                Processed {syncResult.total_remarks_processed} remarks • Updated {syncResult.subjects_updated} subjects • Updated {syncResult.offerings_updated} course offerings.
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setSyncResult(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Top KPI Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Total Faculty Load</span>
                        <Clock className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold tracking-tight text-slate-900">
                            {workloadReport?.total_teaching_hours ?? 0}
                        </span>
                        <span className="text-xs font-medium text-slate-500">hrs/wk</span>
                    </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Avg Load per Faculty</span>
                        <Award className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold tracking-tight text-slate-900">
                            {workloadReport?.avg_teaching_hours ?? 0}
                        </span>
                        <span className="text-xs font-medium text-slate-500">hrs/wk</span>
                    </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Active Faculty Allotted</span>
                        <Users className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="mt-2">
                        <span className="text-2xl font-bold tracking-tight text-slate-900">
                            {workloadReport?.total_teachers ?? 0}
                        </span>
                    </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Avg Student Credits</span>
                        <BookOpen className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold tracking-tight text-slate-900">
                            {studentReport?.avg_credits_enrolled ?? 0}
                        </span>
                        <span className="text-xs font-medium text-slate-500">credits</span>
                    </div>
                </div>
            </div>

            {/* Sub-Tabs Navigation */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg w-fit border border-slate-200 text-xs">
                <button
                    onClick={() => setSubTab("faculty")}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                        subTab === "faculty"
                            ? "bg-white text-slate-900 shadow-2xs font-semibold"
                            : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Faculty Teaching Workload</span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700 font-medium">
                        {workloadReport?.total_teachers ?? 0}
                    </span>
                </button>

                <button
                    onClick={() => setSubTab("students")}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                        subTab === "students"
                            ? "bg-white text-slate-900 shadow-2xs font-semibold"
                            : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                    <Users className="h-3.5 w-3.5" />
                    <span>Student Academic Credits</span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700 font-medium">
                        {studentReport?.total_students ?? 0}
                    </span>
                </button>

                <button
                    onClick={() => setSubTab("subjects")}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                        subTab === "subjects"
                            ? "bg-white text-slate-900 shadow-2xs font-semibold"
                            : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    <span>Subject Credit Directory</span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700 font-medium">
                        {subjectsList.length}
                    </span>
                </button>
            </div>

            {/* =================================================================
             * TAB 1: FACULTY TEACHING WORKLOAD
             * ================================================================= */}
            {subTab === "faculty" && (
                <div className="space-y-3.5">
                    {/* Search bar */}
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-2xs flex items-center gap-2">
                        <Search className="h-4 w-4 text-slate-400 ml-1" />
                        <input
                            type="text"
                            placeholder="Search by professor name, email, or course code..."
                            value={facultySearch}
                            onChange={(e) => setFacultySearch(e.target.value)}
                            className="flex-1 bg-transparent border-none text-xs text-slate-800 placeholder:text-slate-400 outline-none"
                        />
                        {facultySearch && (
                            <button onClick={() => setFacultySearch("")} className="text-slate-400 hover:text-slate-600 text-xs px-2 cursor-pointer">
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                                    <tr>
                                        <th className="px-4 py-3 w-14 text-center">S.No.</th>
                                        <th className="px-5 py-3">Faculty Member</th>
                                        <th className="px-5 py-3">Weekly Teaching Load</th>
                                        <th className="px-5 py-3">Load Breakdown (Hours)</th>
                                        <th className="px-5 py-3">Allotted Courses</th>
                                        <th className="px-5 py-3 text-right">Details</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                    {facultyLoading ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center">
                                                <Loader2 className="h-6 w-6 animate-spin text-slate-400 mx-auto" />
                                                <p className="text-xs text-slate-400 mt-2 font-medium">
                                                    Loading faculty workload…
                                                </p>
                                            </td>
                                        </tr>
                                    ) : filteredTeachers.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs font-medium">
                                                No faculty workload records found
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedTeachers.map((t, idx) => {
                                            const serialNumber = (facultyPage - 1) * facultyPageSize + idx + 1;
                                            const isExpanded = expandedTeacherId === t.teacher_id;
                                            return (
                                                <Fragment key={t.teacher_id}>
                                                    <tr className="hover:bg-slate-50/70 transition-colors group">
                                                        <td className="px-4 py-3 text-center font-mono text-slate-400 text-xs">
                                                            {serialNumber}
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <div>
                                                                <span className="font-semibold text-slate-900 block text-xs">
                                                                    {t.teacher_name}
                                                                </span>
                                                                <span className="text-[11px] text-slate-400">
                                                                    {t.teacher_email}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        <td className="px-5 py-3">
                                                            <div className="w-44 space-y-1">
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <span className="font-semibold text-slate-900 text-xs">
                                                                        {t.total_weekly_hours} hrs/wk
                                                                    </span>
                                                                    <span
                                                                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                                                            t.total_weekly_hours >= 14
                                                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                                                : "bg-amber-50 text-amber-700 border border-amber-200"
                                                                        }`}
                                                                    >
                                                                        {t.total_weekly_hours >= 14 ? "Full Load" : "Light Load"}
                                                                    </span>
                                                                </div>
                                                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full ${
                                                                            t.total_weekly_hours >= 14
                                                                                ? "bg-emerald-600"
                                                                                : "bg-slate-700"
                                                                        }`}
                                                                        style={{
                                                                            width: `${Math.min(
                                                                                100,
                                                                                (t.total_weekly_hours / 16) * 100
                                                                            )}%`,
                                                                        }}
                                                                    />
                                                                </div>
                                                                <span className="text-[10px] text-slate-400 block">
                                                                    Target: 16 hrs / week
                                                                </span>
                                                            </div>
                                                        </td>

                                                        <td className="px-5 py-3">
                                                            <div className="flex flex-wrap items-center gap-1.5">
                                                                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                                                    Theory: {t.lecture_hours}h
                                                                </span>
                                                                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                    Lab: {t.lab_hours}h
                                                                </span>
                                                                {t.project_training_hours > 0 && (
                                                                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                                                                        Project: {t.project_training_hours}h
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        <td className="px-5 py-3">
                                                            <span className="font-semibold text-slate-800 text-xs">
                                                                {t.course_count} courses
                                                            </span>
                                                        </td>

                                                        <td className="px-5 py-3 text-right">
                                                            <button
                                                                onClick={() =>
                                                                    setExpandedTeacherId(isExpanded ? null : t.teacher_id)
                                                                }
                                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-2xs cursor-pointer"
                                                            >
                                                                <span>{isExpanded ? "Hide" : "View Courses"}</span>
                                                                {isExpanded ? (
                                                                    <ChevronUp className="h-3.5 w-3.5" />
                                                                ) : (
                                                                    <ChevronDown className="h-3.5 w-3.5" />
                                                                )}
                                                            </button>
                                                        </td>
                                                    </tr>

                                                    {/* Expanded courses view */}
                                                    {isExpanded && (
                                                        <tr className="bg-slate-50/70 border-y border-slate-200">
                                                            <td colSpan={6} className="px-6 py-4">
                                                                <div className="space-y-2">
                                                                    <p className="text-xs font-semibold text-slate-700">
                                                                        Teaching Allotments for {t.teacher_name}
                                                                    </p>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                                                        {t.courses.map((c) => (
                                                                            <div
                                                                                key={c.course_offering_id}
                                                                                className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between gap-3"
                                                                            >
                                                                                <div>
                                                                                    <div className="flex items-center gap-1.5">
                                                                                        <span className="font-mono font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                                                                                            {c.subject_code}
                                                                                        </span>
                                                                                        <span className="font-semibold text-slate-800 text-xs truncate max-w-[200px]">
                                                                                            {c.subject_name}
                                                                                        </span>
                                                                                    </div>
                                                                                    <p className="text-[11px] text-slate-500 mt-1">
                                                                                        Section: <strong>{c.section_name}</strong> • {c.term_name}
                                                                                    </p>
                                                                                </div>

                                                                                <div className="text-right shrink-0">
                                                                                    <span
                                                                                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${getTypeBadge(
                                                                                            c.course_type
                                                                                        )}`}
                                                                                    >
                                                                                        {c.course_type}
                                                                                    </span>
                                                                                    <p className="text-xs font-semibold text-slate-900 mt-1">
                                                                                        {c.weekly_hours} hrs/wk
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </Fragment>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Faculty Workload Pagination Footer */}
                        <div className="px-4 py-3 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-3 text-slate-500 font-medium">
                                <span>
                                    Showing <strong className="text-slate-900">{filteredTeachers.length === 0 ? 0 : (facultyPage - 1) * facultyPageSize + 1}</strong> to <strong className="text-slate-900">{Math.min(facultyPage * facultyPageSize, filteredTeachers.length)}</strong> of <strong className="text-slate-900">{filteredTeachers.length}</strong> faculty
                                </span>
                                <span className="text-slate-200">|</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-slate-500 font-medium">Per page:</span>
                                    <PageSizeDropdown
                                        value={facultyPageSize}
                                        onChange={(size) => {
                                            setFacultyPageSize(size);
                                            setFacultyPage(1);
                                        }}
                                        options={[10, 15, 25, 50]}
                                    />
                                </div>
                            </div>

                            {totalFacultyPages > 1 && (
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setFacultyPage((p) => Math.max(1, p - 1))}
                                        disabled={facultyPage === 1}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors cursor-pointer"
                                    >
                                        <ChevronLeft className="h-4 w-4" /> Prev
                                    </button>

                                    <span className="text-xs text-slate-600 px-2 font-medium">
                                        Page <strong>{facultyPage}</strong> of <strong>{totalFacultyPages}</strong>
                                    </span>

                                    <button
                                        onClick={() => setFacultyPage((p) => Math.min(totalFacultyPages, p + 1))}
                                        disabled={facultyPage === totalFacultyPages}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors cursor-pointer"
                                    >
                                        Next <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* =================================================================
             * TAB 2: STUDENT ACADEMIC CREDITS
             * ================================================================= */}
            {subTab === "students" && (
                <div className="space-y-3.5">
                    {/* Search bar */}
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-2xs flex items-center gap-2">
                        <Search className="h-4 w-4 text-slate-400 ml-1" />
                        <input
                            type="text"
                            placeholder="Search by student roll number, name, or section..."
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            className="flex-1 bg-transparent border-none text-xs text-slate-800 placeholder:text-slate-400 outline-none"
                        />
                        {studentSearch && (
                            <button onClick={() => setStudentSearch("")} className="text-slate-400 hover:text-slate-600 text-xs px-2 cursor-pointer">
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                                    <tr>
                                        <th className="px-4 py-3 w-14 text-center">S.No.</th>
                                        <th className="px-5 py-3">Roll Number</th>
                                        <th className="px-5 py-3">Student Name</th>
                                        <th className="px-5 py-3">Section</th>
                                        <th className="px-5 py-3">Enrolled Credits</th>
                                        <th className="px-5 py-3">Credit Breakdown</th>
                                        <th className="px-5 py-3 text-right">Action</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                    {studentLoading ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center">
                                                <Loader2 className="h-6 w-6 animate-spin text-slate-400 mx-auto" />
                                                <p className="text-xs text-slate-400 mt-2 font-medium">
                                                    Loading student credit audits…
                                                </p>
                                            </td>
                                        </tr>
                                    ) : filteredStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-xs font-medium">
                                                No student credit records found
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedStudents.map((s, idx) => {
                                            const serialNumber = (studentPage - 1) * studentPageSize + idx + 1;
                                            return (
                                                <tr key={s.student_id} className="hover:bg-slate-50/70 transition-colors group">
                                                    <td className="px-4 py-3 text-center font-mono text-slate-400 text-xs">
                                                        {serialNumber}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <span className="font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                            {s.roll_number}
                                                        </span>
                                                    </td>

                                                    <td className="px-5 py-3">
                                                    <div>
                                                        <span className="font-semibold text-slate-900 block text-xs">
                                                            {s.student_name}
                                                        </span>
                                                        <span className="text-[11px] text-slate-400">
                                                            {s.student_email}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-3">
                                                    <span className="font-medium text-slate-800 text-xs">
                                                        {s.section_name}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-3">
                                                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                                                        {s.total_credits} Credits
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 block mt-0.5">
                                                        {s.course_count} subjects
                                                    </span>
                                                </td>

                                                <td className="px-5 py-3">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                                            Theory: {s.lecture_credits}cr
                                                        </span>
                                                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            Lab: {s.lab_credits}cr
                                                        </span>
                                                        {s.project_training_credits > 0 && (
                                                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                                                                Project: {s.project_training_credits}cr
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-3 text-right">
                                                    <button
                                                        onClick={() => setSelectedStudent(s)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                                                    >
                                                        View Subjects
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                                </tbody>
                            </table>
                        </div>

                        {/* Student Credits Pagination Footer */}
                        <div className="px-4 py-3 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-3 text-slate-500 font-medium">
                                <span>
                                    Showing <strong className="text-slate-900">{filteredStudents.length === 0 ? 0 : (studentPage - 1) * studentPageSize + 1}</strong> to <strong className="text-slate-900">{Math.min(studentPage * studentPageSize, filteredStudents.length)}</strong> of <strong className="text-slate-900">{filteredStudents.length}</strong> students
                                </span>
                                <span className="text-slate-200">|</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-slate-500 font-medium">Per page:</span>
                                    <PageSizeDropdown
                                        value={studentPageSize}
                                        onChange={(size) => {
                                            setStudentPageSize(size);
                                            setStudentPage(1);
                                        }}
                                        options={[10, 20, 50, 100]}
                                    />
                                </div>
                            </div>

                            {totalStudentPages > 1 && (
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                                        disabled={studentPage === 1}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors cursor-pointer"
                                    >
                                        <ChevronLeft className="h-4 w-4" /> Prev
                                    </button>

                                    <span className="text-xs text-slate-600 px-2 font-medium">
                                        Page <strong>{studentPage}</strong> of <strong>{totalStudentPages}</strong>
                                    </span>

                                    <button
                                        onClick={() => setStudentPage((p) => Math.min(totalStudentPages, p + 1))}
                                        disabled={studentPage === totalStudentPages}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors cursor-pointer"
                                    >
                                        Next <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* =================================================================
             * TAB 3: SUBJECT CREDIT MASTER DIRECTORY
             * ================================================================= */}
            {subTab === "subjects" && (
                <div className="space-y-3.5">
                    {/* Search bar */}
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-2xs flex items-center gap-2">
                        <Search className="h-4 w-4 text-slate-400 ml-1" />
                        <input
                            type="text"
                            placeholder="Search by subject course code (e.g. CS401) or title..."
                            value={subjectsSearch}
                            onChange={(e) => setSubjectsSearch(e.target.value)}
                            className="flex-1 bg-transparent border-none text-xs text-slate-800 placeholder:text-slate-400 outline-none"
                        />
                        {subjectsSearch && (
                            <button onClick={() => setSubjectsSearch("")} className="text-slate-400 hover:text-slate-600 text-xs px-2 cursor-pointer">
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                                    <tr>
                                        <th className="px-4 py-3 w-14 text-center">S.No.</th>
                                        <th className="px-5 py-3">Course Code</th>
                                        <th className="px-5 py-3">Subject Title</th>
                                        <th className="px-5 py-3">Type</th>
                                        <th className="px-5 py-3">Credits</th>
                                        <th className="px-5 py-3">Classification</th>
                                        <th className="px-5 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                    {subjectsLoading ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center">
                                                <Loader2 className="h-6 w-6 animate-spin text-slate-400 mx-auto" />
                                                <p className="text-xs text-slate-400 mt-2 font-medium">
                                                    Loading subjects…
                                                </p>
                                            </td>
                                        </tr>
                                    ) : subjectsList.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-xs font-medium">
                                                No subjects found
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedSubjects.map((s, idx) => {
                                            const serialNumber = (subjectsPage - 1) * subjectsPageSize + idx + 1;
                                            return (
                                                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors group">
                                                    <td className="px-4 py-3 text-center font-mono text-slate-400 text-xs">
                                                        {serialNumber}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <span className="font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                            {s.course_code}
                                                        </span>
                                                    </td>

                                                <td className="px-5 py-3">
                                                    <span className="font-semibold text-slate-900 block text-xs">
                                                        {s.name}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-3">
                                                    <span
                                                        className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getTypeBadge(
                                                            s.course_type
                                                        )}`}
                                                    >
                                                        {s.course_type || "LECTURE"}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-3">
                                                    <span className="font-semibold text-slate-900 text-xs">
                                                        {s.credits} Credits
                                                    </span>
                                                </td>

                                                <td className="px-5 py-3">
                                                    <span
                                                        className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                                                            s.is_elective
                                                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                                                : "bg-slate-100 text-slate-700 border-slate-200"
                                                        }`}
                                                    >
                                                        {s.is_elective ? "Elective" : "Core"}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-3 text-right">
                                                    <button
                                                        onClick={() => handleStartEdit(s)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                                                    >
                                                        <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                                                        <span>Edit</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                                </tbody>
                            </table>
                        </div>

                        {/* Subjects Pagination Footer */}
                        <div className="px-4 py-3 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-3 text-slate-500 font-medium">
                                <span>
                                    Showing <strong className="text-slate-900">{subjectsList.length === 0 ? 0 : (subjectsPage - 1) * subjectsPageSize + 1}</strong> to <strong className="text-slate-900">{Math.min(subjectsPage * subjectsPageSize, subjectsList.length)}</strong> of <strong className="text-slate-900">{subjectsList.length}</strong> subjects
                                </span>
                                <span className="text-slate-200">|</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-slate-500 font-medium">Per page:</span>
                                    <PageSizeDropdown
                                        value={subjectsPageSize}
                                        onChange={(size) => {
                                            setSubjectsPageSize(size);
                                            setSubjectsPage(1);
                                        }}
                                        options={[10, 20, 50, 100]}
                                    />
                                </div>
                            </div>

                            {totalSubjectsPages > 1 && (
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setSubjectsPage((p) => Math.max(1, p - 1))}
                                        disabled={subjectsPage === 1}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors cursor-pointer"
                                    >
                                        <ChevronLeft className="h-4 w-4" /> Prev
                                    </button>

                                    <span className="text-xs text-slate-600 px-2 font-medium">
                                        Page <strong>{subjectsPage}</strong> of <strong>{totalSubjectsPages}</strong>
                                    </span>

                                    <button
                                        onClick={() => setSubjectsPage((p) => Math.min(totalSubjectsPages, p + 1))}
                                        disabled={subjectsPage === totalSubjectsPages}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors cursor-pointer"
                                    >
                                        Next <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* =================================================================
             * MODAL: STUDENT ENROLLED SUBJECTS DRILL-DOWN
             * ================================================================= */}
            {selectedStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white w-full max-w-2xl rounded-xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between">
                            <div>
                                <span className="font-mono text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                    {selectedStudent.roll_number}
                                </span>
                                <h2 className="text-base font-semibold text-slate-900 mt-2">
                                    {selectedStudent.student_name}
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Section {selectedStudent.section_name} • {selectedStudent.student_email}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedStudent(null)}
                                className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Summary pills */}
                        <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-700">
                                Total Enrolled: <strong className="text-slate-900">{selectedStudent.total_credits} Credits</strong>
                            </span>
                            <div className="flex items-center gap-1.5 text-xs">
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium border border-slate-200">
                                    Theory: {selectedStudent.lecture_credits}cr
                                </span>
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                                    Lab: {selectedStudent.lab_credits}cr
                                </span>
                                {selectedStudent.project_training_credits > 0 && (
                                    <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-medium border border-purple-200">
                                        Project: {selectedStudent.project_training_credits}cr
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-2">
                            {selectedStudent.courses.map((c) => (
                                <div
                                    key={c.course_offering_id}
                                    className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-3 shadow-2xs"
                                >
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-mono font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                                                {c.subject_code}
                                            </span>
                                            <span className="font-semibold text-slate-800 text-xs">
                                                {c.subject_name}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${getTypeBadge(
                                                c.course_type
                                            )}`}
                                        >
                                            {c.course_type}
                                        </span>
                                        <span className="font-mono font-semibold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-xs">
                                            {c.credits} Credits
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3 bg-white border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedStudent(null)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =================================================================
             * MODAL: EDIT SUBJECT CREDITS
             * ================================================================= */}
            {editingSubject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white w-full max-w-md rounded-xl border border-slate-200 shadow-xl overflow-hidden p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-sm font-semibold text-slate-900">
                                Edit Subject Credits: {editingSubject.course_code}
                            </h2>
                            <button onClick={() => setEditingSubject(null)} className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <p className="text-xs text-slate-600 font-medium">
                            {editingSubject.name}
                        </p>

                        <div className="space-y-3 pt-1">
                            <div>
                                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                                    Credits Allocation
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={editCredits}
                                    onChange={(e) => setEditCredits(parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-slate-400"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                                    Course Classification / Type
                                </label>
                                <FormSelect
                                    value={editType}
                                    onChange={(val) => setEditType(val)}
                                    options={[
                                        { value: "LECTURE", label: "LECTURE (Theory)" },
                                        { value: "LAB", label: "LAB (Practical)" },
                                        { value: "PROJECT", label: "PROJECT (Minor/Major)" },
                                        { value: "TRAINING", label: "TRAINING (Industrial/Internship)" },
                                        { value: "SEMINAR", label: "SEMINAR" },
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                            <button
                                onClick={() => setEditingSubject(null)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={savingSubject}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors shadow-2xs disabled:bg-slate-400 cursor-pointer"
                            >
                                {savingSubject ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                <span>Save Changes</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
