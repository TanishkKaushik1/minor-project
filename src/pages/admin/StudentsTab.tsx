// src/pages/admin/StudentsTab.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import {
    Users,
    BookOpen,
    Search,
    RefreshCw,
    Loader2,
    CheckCircle2,
    AlertCircle,
    X,
    ChevronLeft,
    ChevronRight,
    Download,
    Upload,
    Eye,
    BookMarked,
    Mail,
    Hash,
    Filter,
    School as SchoolIcon,
    Trash2,
    UserPen,
} from "lucide-react";
import { FormSelect } from "../../components/ui/form-select";
import type { SelectOption } from "../../components/ui/form-select";
import { PageSizeDropdown } from "../../components/ui/page-size-dropdown";
import BulkImportStudentsModal from "./BulkImportStudentsModal";
import EditUserProfileModal from "../../components/EditUserProfileModal";
import {
    listAcademicStudents,
    listSchools,
    listDepartments,
    listProgrammes,
    listBatches,
    listSections,
    listOfferings,
    unenrollStudentFromCourse,
} from "../../api/admin";
import type {
    StudentAcademicItem,
    School,
    Department,
    Programme,
    Batch,
    Section,
    Offering,
} from "../../api/admin";

export default function StudentsTab() {
    // Academic hierarchy filter lists
    const [schools, setSchools] = useState<School[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [programmes, setProgrammes] = useState<Programme[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [offerings, setOfferings] = useState<Offering[]>([]);

    // Selected filter values (empty string = "all")
    const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
    const [selectedDeptId, setSelectedDeptId] = useState<string>("");
    const [selectedProgId, setSelectedProgId] = useState<string>("");
    const [selectedBatchId, setSelectedBatchId] = useState<string>("");
    const [selectedSectionId, setSelectedSectionId] = useState<string>("");
    const [selectedOfferingId, setSelectedOfferingId] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [debouncedSearch, setDebouncedSearch] = useState<string>("");

    // Debounce search by 300ms to avoid network spam and race conditions
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery.trim());
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Student data & stats
    const [students, setStudents] = useState<StudentAcademicItem[]>([]);
    const [totalStudents, setTotalStudents] = useState<number>(0);
    const [totalActive, setTotalActive] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [exporting, setExporting] = useState<boolean>(false);
    const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

    // Pagination
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(15);

    // Detail Modal for Student's Enrolled Courses
    const [viewingStudent, setViewingStudent] = useState<StudentAcademicItem | null>(null);
    const [passwordEditStudent, setPasswordEditStudent] = useState<StudentAcademicItem | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [unenrollingOfferingId, setUnenrollingOfferingId] = useState<number | null>(null);

    const handleUnenrollCourse = async (offeringId: number) => {
        if (!viewingStudent) return;
        setUnenrollingOfferingId(offeringId);
        try {
            await unenrollStudentFromCourse(viewingStudent.id, offeringId);
            const nextCourses = viewingStudent.enrolled_courses.filter((c) => c.offering_id !== offeringId);
            const updated = {
                ...viewingStudent,
                enrolled_courses: nextCourses,
                enrolled_courses_count: nextCourses.length,
            };
            setViewingStudent(updated);
            setStudents((prev) => prev.map((s) => (s.id === viewingStudent.id ? updated : s)));
        } catch (err) {
            console.error("Failed to unenroll:", err);
        } finally {
            setUnenrollingOfferingId(null);
        }
    };

    // Initial dropdown bootstrap
    useEffect(() => {
        const loadInitialFilters = async () => {
            try {
                const [schoolsData, batchesData, sectionsData, offeringsData] = await Promise.all([
                    listSchools().catch(() => []),
                    listBatches().catch(() => []),
                    listSections().catch(() => []),
                    listOfferings().catch(() => []),
                ]);
                setSchools(schoolsData ?? []);
                setBatches(batchesData ?? []);
                setSections(sectionsData ?? []);
                setOfferings(offeringsData ?? []);
            } catch (err) {
                console.error("Failed to load filter metadata:", err);
            }
        };
        loadInitialFilters();
    }, []);

    // Load departments when school changes
    useEffect(() => {
        const loadDepartments = async () => {
            if (!selectedSchoolId) {
                // If all schools, fetch all departments
                try {
                    const depts = await listDepartments();
                    setDepartments(depts ?? []);
                } catch {
                    setDepartments([]);
                }
                return;
            }
            const school = schools.find((s) => String(s.id) === selectedSchoolId);
            try {
                const depts = await listDepartments(school?.code);
                setDepartments(depts ?? []);
            } catch {
                setDepartments([]);
            }
        };
        loadDepartments();
    }, [selectedSchoolId, schools]);

    // Load programmes when department changes
    useEffect(() => {
        const loadProgrammes = async () => {
            if (!selectedDeptId) {
                try {
                    const progs = await listProgrammes();
                    setProgrammes(progs ?? []);
                } catch {
                    setProgrammes([]);
                }
                return;
            }
            const dept = departments.find((d) => String(d.id) === selectedDeptId);
            try {
                const progs = await listProgrammes(dept?.code);
                setProgrammes(progs ?? []);
            } catch {
                setProgrammes([]);
            }
        };
        loadProgrammes();
    }, [selectedDeptId, departments]);

    // Fetch students matching the current active filters
    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const data = await listAcademicStudents({
                school_id: selectedSchoolId ? Number(selectedSchoolId) : undefined,
                department_id: selectedDeptId ? Number(selectedDeptId) : undefined,
                programme_id: selectedProgId ? Number(selectedProgId) : undefined,
                batch_id: selectedBatchId ? Number(selectedBatchId) : undefined,
                section_id: selectedSectionId ? Number(selectedSectionId) : undefined,
                course_offering_id: selectedOfferingId ? Number(selectedOfferingId) : undefined,
                search: debouncedSearch || undefined,
                page,
                size: pageSize,
            });
            setStudents(data.items ?? []);
            setTotalStudents(data.total ?? 0);
            setTotalActive(data.total_active ?? 0);
        } catch (err) {
            console.error("Failed to load students:", err);
            setNotice({
                ok: false,
                text: err instanceof Error ? err.message : "Failed to load students directory",
            });
        } finally {
            setLoading(false);
        }
    }, [
        selectedSchoolId,
        selectedDeptId,
        selectedProgId,
        selectedBatchId,
        selectedSectionId,
        selectedOfferingId,
        debouncedSearch,
        page,
        pageSize,
    ]);

    // Trigger fetch on filter or pagination change
    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    // Cascading selection handlers
    const handleSchoolChange = (val: string) => {
        setSelectedSchoolId(val);
        setSelectedDeptId("");
        setSelectedProgId("");
        setPage(1);
    };

    const handleDeptChange = (val: string) => {
        setSelectedDeptId(val);
        setSelectedProgId("");
        setPage(1);
    };

    const handleProgChange = (val: string) => {
        setSelectedProgId(val);
        setPage(1);
    };

    const handleBatchChange = (val: string) => {
        setSelectedBatchId(val);
        setPage(1);
    };

    const handleSectionChange = (val: string) => {
        setSelectedSectionId(val);
        setPage(1);
    };

    const handleOfferingChange = (val: string) => {
        setSelectedOfferingId(val);
        setPage(1);
    };

    const handleClearFilters = () => {
        setSelectedSchoolId("");
        setSelectedDeptId("");
        setSelectedProgId("");
        setSelectedBatchId("");
        setSelectedSectionId("");
        setSelectedOfferingId("");
        setSearchQuery("");
        setPage(1);
    };

    const hasActiveFilters = Boolean(
        selectedSchoolId ||
        selectedDeptId ||
        selectedProgId ||
        selectedBatchId ||
        selectedSectionId ||
        selectedOfferingId ||
        searchQuery
    );

    // Dropdown options
    const schoolOptions: SelectOption[] = useMemo(() => [
        { value: "", label: "All Schools" },
        ...schools.map((s) => ({ value: String(s.id), label: `${s.code} - ${s.name}` })),
    ], [schools]);

    const deptOptions: SelectOption[] = useMemo(() => [
        { value: "", label: "All Departments" },
        ...departments.map((d) => ({ value: String(d.id), label: `${d.code} - ${d.name}` })),
    ], [departments]);

    const progOptions: SelectOption[] = useMemo(() => [
        { value: "", label: "All Programmes" },
        ...programmes.map((p) => ({ value: String(p.id), label: `${p.code} - ${p.name}` })),
    ], [programmes]);

    const batchOptions: SelectOption[] = useMemo(() => [
        { value: "", label: "All Batches" },
        ...batches.map((b) => ({ value: String(b.id), label: `${b.name} (${b.start_year}-${b.expected_end_year})` })),
    ], [batches]);

    const sectionOptions: SelectOption[] = useMemo(() => {
        const sorted = [...sections].sort((a, b) => {
            const cntA = a.enrolled_students_count ?? 0;
            const cntB = b.enrolled_students_count ?? 0;
            if (cntB !== cntA) return cntB - cntA;
            return a.name.localeCompare(b.name);
        });

        return [
            { value: "", label: "All Sections" },
            ...sorted.map((s) => {
                const count = s.enrolled_students_count ?? 0;
                return {
                    value: String(s.id),
                    label: count > 0 ? `⭐ ${s.name} (${count} students)` : s.name,
                };
            }),
        ];
    }, [sections]);

    const offeringOptions: SelectOption[] = useMemo(() => [
        { value: "", label: "All Courses / Offerings" },
        ...offerings.map((o) => ({
            value: String(o.id),
            label: `${o.subject_code ? `${o.subject_code} - ` : ""}${o.subject_name} (${o.section_name})`,
        })),
    ], [offerings]);

    // CSV Export
    const handleExportCSV = async () => {
        setExporting(true);
        try {
            // Fetch all matching records up to 500 for export
            const data = await listAcademicStudents({
                school_id: selectedSchoolId ? Number(selectedSchoolId) : undefined,
                department_id: selectedDeptId ? Number(selectedDeptId) : undefined,
                programme_id: selectedProgId ? Number(selectedProgId) : undefined,
                batch_id: selectedBatchId ? Number(selectedBatchId) : undefined,
                section_id: selectedSectionId ? Number(selectedSectionId) : undefined,
                course_offering_id: selectedOfferingId ? Number(selectedOfferingId) : undefined,
                search: searchQuery.trim() || undefined,
                page: 1,
                size: 500,
            });

            const headers = [
                "Roll Number",
                "Full Name",
                "Email",
                "Status",
                "School",
                "Department",
                "Programme",
                "Batch",
                "Courses Enrolled Count",
                "Enrolled Courses",
            ];

            const rows = (data.items || []).map((s) => [
                `"${s.roll_number || "N/A"}"`,
                `"${s.full_name}"`,
                `"${s.email}"`,
                `"${s.is_active ? "Active" : "Inactive"}"`,
                `"${s.school_name || s.school_code || "N/A"}"`,
                `"${s.department_name || s.department_code || "N/A"}"`,
                `"${s.programme_name || s.programme_code || "N/A"}"`,
                `"${s.batch_name || "N/A"}"`,
                `"${s.enrolled_courses_count}"`,
                `"${s.enrolled_courses.map((c) => `${c.course_code} (${c.section_name})`).join("; ")}"`,
            ]);

            const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `students_directory_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("Export error:", err);
            setNotice({ ok: false, text: "Failed to export CSV file" });
        } finally {
            setExporting(false);
        }
    };

    const totalPages = Math.max(1, Math.ceil(totalStudents / pageSize));

    return (
        <div className="space-y-6 animate-fade-in text-slate-800 pb-16">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                                Students Directory
                            </h1>
                            <p className="text-xs font-semibold text-slate-500 mt-0.5">
                                Browse, filter, and inspect registered students across schools, departments, programmes, sections, and courses.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setIsImportModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold shadow-sm transition-all hover:border-indigo-300 cursor-pointer"
                    >
                        <Upload className="h-3.5 w-3.5" />
                        <span>Bulk Import (Excel / CSV)</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleExportCSV}
                        disabled={exporting || loading || students.length === 0}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 disabled:opacity-50 cursor-pointer"
                    >
                        {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                        <span>Export CSV</span>
                    </button>
                    <button
                        type="button"
                        onClick={fetchStudents}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Notification alert */}
            {notice && (
                <div
                    className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
                        notice.ok
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-rose-50 border-rose-200 text-rose-800"
                    }`}
                >
                    <div className="flex items-center gap-2">
                        {notice.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
                        <span>{notice.text}</span>
                    </div>
                    <button type="button" onClick={() => setNotice(null)} className="p-1 hover:bg-black/5 rounded">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Users className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Matching Students</div>
                        <div className="text-xl font-black text-slate-800">{totalStudents.toLocaleString()}</div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Students</div>
                        <div className="text-xl font-black text-slate-800">{totalActive.toLocaleString()}</div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                        <SchoolIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Schools Filter</div>
                        <div className="text-xs font-black text-slate-700 truncate max-w-[150px]">
                            {selectedSchoolId ? schools.find((s) => String(s.id) === selectedSchoolId)?.code || "Filtered" : "All Schools"}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                        <BookMarked className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Course / Section Filter</div>
                        <div className="text-xs font-black text-slate-700 truncate max-w-[150px]">
                            {selectedOfferingId
                                ? offerings.find((o) => String(o.id) === selectedOfferingId)?.subject_code || "Course Selected"
                                : selectedSectionId
                                ? sections.find((s) => String(s.id) === selectedSectionId)?.name || "Section Selected"
                                : "All Courses & Sections"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <Filter className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Filter Academic Hierarchy</span>
                    </div>
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                            <X className="h-3 w-3" />
                            <span>Reset All Filters</span>
                        </button>
                    )}
                </div>

                {/* Dropdowns Row 1: School, Department, Programme, Batch */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                            School
                        </label>
                        <FormSelect
                            value={selectedSchoolId}
                            onChange={handleSchoolChange}
                            options={schoolOptions}
                            placeholder="All Schools"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                            Department
                        </label>
                        <FormSelect
                            value={selectedDeptId}
                            onChange={handleDeptChange}
                            options={deptOptions}
                            placeholder="All Departments"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                            Programme
                        </label>
                        <FormSelect
                            value={selectedProgId}
                            onChange={handleProgChange}
                            options={progOptions}
                            placeholder="All Programmes"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                            Batch
                        </label>
                        <FormSelect
                            value={selectedBatchId}
                            onChange={handleBatchChange}
                            options={batchOptions}
                            placeholder="All Batches"
                        />
                    </div>
                </div>

                {/* Dropdowns Row 2: Section, Course Offering, Search Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                            Section
                        </label>
                        <FormSelect
                            value={selectedSectionId}
                            onChange={handleSectionChange}
                            options={sectionOptions}
                            placeholder="All Sections"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                            Specific Course / Offering
                        </label>
                        <FormSelect
                            value={selectedOfferingId}
                            onChange={handleOfferingChange}
                            options={offeringOptions}
                            placeholder="All Courses"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                            Search Student
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, roll no, email..."
                                className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setPage(1);
                                    }}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                <th className="py-3 px-4 w-12 text-center">#</th>
                                <th className="py-3 px-4">Student</th>
                                <th className="py-3 px-4">Roll Number</th>
                                <th className="py-3 px-4">School & Dept</th>
                                <th className="py-3 px-4">Programme & Batch</th>
                                <th className="py-3 px-4 text-center">Enrolled Courses</th>
                                <th className="py-3 px-4 text-center">Status</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                                            <span className="text-xs font-bold text-slate-500">Loading students...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : students.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="p-3 bg-slate-100 rounded-2xl text-slate-400">
                                                <Users className="h-8 w-8" />
                                            </div>
                                            <div className="text-sm font-bold text-slate-700">No students found</div>
                                            <p className="text-xs text-slate-400 max-w-sm">
                                                No students matched the selected filters. Try broadening your criteria or search query.
                                            </p>
                                            {hasActiveFilters && (
                                                <button
                                                    type="button"
                                                    onClick={handleClearFilters}
                                                    className="mt-2 text-xs font-bold text-indigo-600 hover:underline"
                                                >
                                                    Clear filters
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                students.map((student, idx) => (
                                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                                        {/* Serial Number */}
                                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-400 text-xs">
                                            {(page - 1) * pageSize + idx + 1}
                                        </td>

                                        {/* Student Details */}
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                                                    {student.full_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-slate-800 truncate">
                                                        {student.full_name}
                                                    </div>
                                                    <div className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                                                        <Mail className="h-2.5 w-2.5 shrink-0" />
                                                        <span className="truncate">{student.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Roll Number */}
                                        <td className="py-3 px-4">
                                            <div className="inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px]">
                                                <Hash className="h-3 w-3 text-slate-400" />
                                                <span>{student.roll_number || "N/A"}</span>
                                            </div>
                                        </td>

                                        {/* School & Dept */}
                                        <td className="py-3 px-4">
                                            <div className="space-y-0.5">
                                                <div className="font-bold text-slate-700 text-xs truncate max-w-[180px]">
                                                    {student.school_code || student.school_name || "N/A"}
                                                </div>
                                                <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                                                    {student.department_name || student.department_code || "N/A"}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Programme & Batch */}
                                        <td className="py-3 px-4">
                                            <div className="space-y-0.5">
                                                <div className="font-bold text-slate-700 text-xs truncate max-w-[180px]">
                                                    {student.programme_name || student.programme_code || "N/A"}
                                                </div>
                                                <div className="text-[11px] text-slate-400">
                                                    {student.batch_name ? `Batch: ${student.batch_name}` : "N/A"}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Enrolled Courses */}
                                        <td className="py-3 px-4 text-center">
                                            <button
                                                type="button"
                                                onClick={() => setViewingStudent(student)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                                            >
                                                <BookMarked className="h-3 w-3" />
                                                <span>{student.enrolled_courses_count} Courses</span>
                                            </button>
                                        </td>

                                        {/* Status */}
                                        <td className="py-3 px-4 text-center">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                                    student.is_active
                                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                        : "bg-slate-100 text-slate-500 border border-slate-200"
                                                }`}
                                            >
                                                <span className={`h-1.5 w-1.5 rounded-full ${student.is_active ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                                                <span>{student.is_active ? "Active" : "Inactive"}</span>
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setPasswordEditStudent(student)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                                                    title="Edit Student Profile & Password"
                                                >
                                                    <UserPen className="h-3 w-3 text-indigo-600" />
                                                    <span>Edit</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setViewingStudent(student)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-2xs hover:border-slate-300 cursor-pointer"
                                                >
                                                    <Eye className="h-3 w-3" />
                                                    <span>View</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-500">
                    <div className="flex items-center gap-2">
                        <span>Showing</span>
                        <PageSizeDropdown
                            value={pageSize}
                            onChange={(sz) => {
                                setPageSize(sz);
                                setPage(1);
                            }}
                            options={[10, 15, 25, 50, 100]}
                        />
                        <span>of {totalStudents.toLocaleString()} students</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1 || loading}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition-all cursor-pointer"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="px-3 py-1 font-bold text-slate-700">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages || loading}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition-all cursor-pointer"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Course Enrollment Detail Modal */}
            {viewingStudent && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-scale-in">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 font-black text-sm flex items-center justify-center">
                                    {viewingStudent.full_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-800">
                                        {viewingStudent.full_name}
                                    </h3>
                                    <div className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                                        <span className="font-mono text-slate-600 font-bold">
                                            {viewingStudent.roll_number || "No Roll Number"}
                                        </span>
                                        <span>•</span>
                                        <span>{viewingStudent.email}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewingStudent(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                            {/* Academic Hierarchy Summary */}
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400">School</div>
                                    <div className="font-bold text-slate-700 truncate">
                                        {viewingStudent.school_code || viewingStudent.school_name || "N/A"}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400">Department</div>
                                    <div className="font-bold text-slate-700 truncate">
                                        {viewingStudent.department_code || viewingStudent.department_name || "N/A"}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400">Programme</div>
                                    <div className="font-bold text-slate-700 truncate">
                                        {viewingStudent.programme_code || viewingStudent.programme_name || "N/A"}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400">Batch</div>
                                    <div className="font-bold text-slate-700 truncate">
                                        {viewingStudent.batch_name || "N/A"}
                                    </div>
                                </div>
                            </div>

                            {/* Enrolled Courses List */}
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                                    <BookMarked className="h-3.5 w-3.5 text-indigo-600" />
                                    <span>Enrolled Courses ({viewingStudent.enrolled_courses.length})</span>
                                </h4>

                                {viewingStudent.enrolled_courses.length === 0 ? (
                                    <div className="py-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                                        <BookOpen className="h-6 w-6 mx-auto mb-1 text-slate-300" />
                                        <div className="text-xs font-bold text-slate-600">No courses enrolled</div>
                                        <p className="text-[11px] text-slate-400">This student is not enrolled in any course offerings yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {viewingStudent.enrolled_courses.map((course, idx) => (
                                            <div
                                                key={idx}
                                                className="p-3 bg-white hover:bg-slate-50/80 border border-slate-200 rounded-xl flex items-center justify-between gap-3 transition-colors"
                                            >
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                                                            {course.course_code}
                                                        </span>
                                                        <span className="font-bold text-xs text-slate-800 truncate">
                                                            {course.subject_name}
                                                        </span>
                                                    </div>
                                                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-1">
                                                        <span>Section: <strong className="text-slate-600">{course.section_name}</strong></span>
                                                        {course.term_name && (
                                                            <>
                                                                <span>•</span>
                                                                <span>Term: <strong className="text-slate-600">{course.term_name}</strong></span>
                                                            </>
                                                        )}
                                                        {course.teacher_name && (
                                                            <>
                                                                <span>•</span>
                                                                <span>Teacher: <strong className="text-slate-600">{course.teacher_name}</strong></span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    {course.course_type && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                                                            {course.course_type}
                                                        </span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUnenrollCourse(course.offering_id)}
                                                        disabled={unenrollingOfferingId === course.offering_id}
                                                        className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                        title="Unenroll student from this course"
                                                    >
                                                        {unenrollingOfferingId === course.offering_id ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-600" />
                                                        ) : (
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setViewingStudent(null)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Import Modal */}
            <BulkImportStudentsModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={() => {
                    fetchStudents();
                    setNotice({ ok: true, text: "Students imported successfully!" });
                }}
            />

            {/* Edit Student Profile Modal */}
            <EditUserProfileModal
                isOpen={!!passwordEditStudent}
                user={
                    passwordEditStudent
                        ? {
                              id: passwordEditStudent.id,
                              email: passwordEditStudent.email,
                              full_name: passwordEditStudent.full_name,
                              is_active: passwordEditStudent.is_active,
                              role: "STUDENT",
                              roles: ["STUDENT"],
                              roll_number: passwordEditStudent.roll_number,
                              scope_type: "UNIVERSITY",
                              scope_id: null,
                          }
                        : null
                }
                onClose={() => setPasswordEditStudent(null)}
                onSuccess={(msg) => {
                    setNotice({ ok: true, text: msg });
                    fetchStudents();
                }}
            />
        </div>
    );
}
