// src/pages/admin/TeacherAllotmentsTab.tsx
import { useState, useEffect, useMemo } from "react";
import type { FormEvent } from "react";
import {
    GraduationCap,
    Users,
    BookOpen,
    FolderKanban,
    Search,
    Plus,
    Trash2,
    Calendar,
    LayoutGrid,
    List,
    AlertCircle,
    CheckCircle2,
    Loader2,
    X,
    Filter,
    Shield,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    UserCheck,
    AlertTriangle
} from "lucide-react";
import { PageSizeDropdown } from "../../components/ui/page-size-dropdown";
import { FormSelect } from "../../components/ui/form-select";
import { motion, AnimatePresence } from "framer-motion";
import {
    listFaculty,
    listOfferings,
    listTerms,
    listSections,
    listSubjects,
    createOffering,
    deleteOffering,
    reassignOffering
} from "../../api/admin";
import type { Faculty, Offering, Term, Section, Subject } from "../../api/admin";

interface TeacherAllotmentsTabProps {
    readOnly?: boolean;
}

export default function TeacherAllotmentsTab({ readOnly = false }: TeacherAllotmentsTabProps) {
    const [faculty, setFaculty] = useState<Faculty[]>([]);
    const [offerings, setOfferings] = useState<Offering[]>([]);
    const [terms, setTerms] = useState<Term[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTermId, setSelectedTermId] = useState<string>("active");
    const [selectedRole, setSelectedRole] = useState<string>("ALL");
    const [workloadFilter, setWorkloadFilter] = useState<"ALL" | "ALLOCATED" | "UNALLOCATED">("ALL");
    const [viewMode, setViewMode] = useState<"faculty" | "offerings">("faculty");
    const [expandedTeachers, setExpandedTeachers] = useState<Record<number, boolean>>({});

    // Modal state for Alloting Class
    const [isAllotModalOpen, setIsAllotModalOpen] = useState(false);
    const [modalTeacherId, setModalTeacherId] = useState<number | "">("");
    const [modalTermId, setModalTermId] = useState<number | "">("");
    const [modalSectionId, setModalSectionId] = useState<number | "">("");
    const [modalSubjectId, setModalSubjectId] = useState<number | "">("");

    // Modal state for Delete Confirmation
    const [offeringToDelete, setOfferingToDelete] = useState<Offering | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteAgreed, setDeleteAgreed] = useState(false);

    // Modal state for Reassigning Teacher
    const [offeringToReassign, setOfferingToReassign] = useState<Offering | null>(null);
    const [modalReassignTeacherId, setModalReassignTeacherId] = useState<number | "">("");
    const [reassigning, setReassigning] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            const [facultyData, offeringsData, termsData, sectionsData, subjectsData] = await Promise.all([
                listFaculty(),
                listOfferings(),
                listTerms(),
                listSections(),
                listSubjects(),
            ]);

            setFaculty(facultyData ?? []);
            setOfferings(offeringsData ?? []);
            setTerms(termsData ?? []);
            setSections(sectionsData ?? []);
            setSubjects(subjectsData ?? []);

            // Set default term to active term
            const active = termsData?.find((t) => t.is_active);
            if (active) {
                setSelectedTermId(active.id.toString());
                setModalTermId(active.id);
            } else if (termsData && termsData.length > 0) {
                setSelectedTermId(termsData[0].id.toString());
                setModalTermId(termsData[0].id);
            }
        } catch (err) {
            setMessage({
                type: "error",
                text: err instanceof Error ? err.message : "Failed to load faculty allotments data",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Active Term Object
    const activeTermObj = useMemo(() => terms.find((t) => t.is_active), [terms]);

    // Filter offerings by term
    const termFilteredOfferings = useMemo(() => {
        if (!selectedTermId || selectedTermId === "ALL") return offerings;
        const targetTerm = terms.find((t) => t.id.toString() === selectedTermId);
        if (!targetTerm) return offerings;
        return offerings.filter((o) => {
            if (o.term_id !== undefined && o.term_id !== null) {
                return Number(o.term_id) === Number(targetTerm.id);
            }
            return o.term_name.trim().toLowerCase() === targetTerm.name.trim().toLowerCase();
        });
    }, [offerings, selectedTermId, terms]);

    // Build teacher groups with their assigned offerings
    const facultyWithOfferings = useMemo(() => {
        return faculty.map((f) => {
            const assigned = termFilteredOfferings.filter((o) => {
                const idMatch =
                    o.teacher_id !== undefined &&
                    o.teacher_id !== null &&
                    Number(o.teacher_id) === Number(f.id);
                const nameMatch = Boolean(
                    o.teacher_name &&
                    f.full_name &&
                    o.teacher_name.trim().toLowerCase() === f.full_name.trim().toLowerCase()
                );
                return idMatch || nameMatch;
            });
            return {
                ...f,
                offerings: assigned,
                offeringCount: assigned.length,
            };
        });
    }, [faculty, termFilteredOfferings]);

    // Filter faculty list by search, role, and workload
    const filteredFaculty = useMemo(() => {
        return facultyWithOfferings.filter((f) => {
            const matchesRole = selectedRole === "ALL" || f.role === selectedRole;
            const matchesWorkload =
                workloadFilter === "ALL" ||
                (workloadFilter === "ALLOCATED" && f.offeringCount > 0) ||
                (workloadFilter === "UNALLOCATED" && f.offeringCount === 0);

            const q = searchQuery.toLowerCase().trim();
            if (!q) return matchesRole && matchesWorkload;

            const matchesSelf =
                f.full_name.toLowerCase().includes(q) ||
                f.email.toLowerCase().includes(q) ||
                f.role.toLowerCase().includes(q);

            const matchesClasses = f.offerings.some(
                (o) =>
                    o.subject_name.toLowerCase().includes(q) ||
                    (o.subject_code && o.subject_code.toLowerCase().includes(q)) ||
                    o.section_name.toLowerCase().includes(q)
            );

            return matchesRole && matchesWorkload && (matchesSelf || matchesClasses);
        });
    }, [facultyWithOfferings, selectedRole, workloadFilter, searchQuery]);

    // Filter offerings table by search
    const filteredOfferings = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        return termFilteredOfferings.filter((o) => {
            if (!q) return true;
            return (
                o.teacher_name.toLowerCase().includes(q) ||
                o.subject_name.toLowerCase().includes(q) ||
                (o.subject_code && o.subject_code.toLowerCase().includes(q)) ||
                o.section_name.toLowerCase().includes(q) ||
                o.term_name.toLowerCase().includes(q)
            );
        });
    }, [termFilteredOfferings, searchQuery]);

    // Pagination for Faculty view
    const [facultyPage, setFacultyPage] = useState(1);
    const [facultyPageSize, setFacultyPageSize] = useState(12);

    useEffect(() => {
        setFacultyPage(1);
    }, [searchQuery, selectedRole, workloadFilter, selectedTermId]);

    const totalFacultyPages = Math.max(1, Math.ceil(filteredFaculty.length / facultyPageSize));

    useEffect(() => {
        if (facultyPage > totalFacultyPages) {
            setFacultyPage(totalFacultyPages);
        }
    }, [totalFacultyPages, facultyPage]);

    const paginatedFaculty = useMemo(() => {
        const start = (facultyPage - 1) * facultyPageSize;
        return filteredFaculty.slice(start, start + facultyPageSize);
    }, [filteredFaculty, facultyPage, facultyPageSize]);

    // Pagination for Offerings view
    const [offeringsPage, setOfferingsPage] = useState(1);
    const [offeringsPageSize, setOfferingsPageSize] = useState(25);

    useEffect(() => {
        setOfferingsPage(1);
    }, [searchQuery, selectedTermId]);

    const totalOfferingsPages = Math.max(1, Math.ceil(filteredOfferings.length / offeringsPageSize));

    useEffect(() => {
        if (offeringsPage > totalOfferingsPages) {
            setOfferingsPage(totalOfferingsPages);
        }
    }, [totalOfferingsPages, offeringsPage]);

    const paginatedOfferings = useMemo(() => {
        const start = (offeringsPage - 1) * offeringsPageSize;
        return filteredOfferings.slice(start, start + offeringsPageSize);
    }, [filteredOfferings, offeringsPage, offeringsPageSize]);

    // Stats
    const stats = useMemo(() => {
        const totalFaculty = faculty.length;
        const totalOfferings = termFilteredOfferings.length;
        const allocatedFaculty = facultyWithOfferings.filter((f) => f.offeringCount > 0).length;
        const unallocatedFaculty = totalFaculty - allocatedFaculty;
        const avgLoad = totalFaculty > 0 ? (totalOfferings / totalFaculty).toFixed(1) : "0.0";

        return {
            totalFaculty,
            totalOfferings,
            allocatedFaculty,
            unallocatedFaculty,
            avgLoad,
        };
    }, [faculty, termFilteredOfferings, facultyWithOfferings]);

    const toggleTeacherExpand = (id: number) => {
        setExpandedTeachers((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const expandAll = () => {
        const next: Record<number, boolean> = {};
        faculty.forEach((f) => (next[f.id] = true));
        setExpandedTeachers(next);
    };

    const collapseAll = () => {
        setExpandedTeachers({});
    };

    const openAllotModal = (preselectedTeacherId?: number) => {
        if (preselectedTeacherId) {
            setModalTeacherId(preselectedTeacherId);
        } else if (faculty.length > 0) {
            setModalTeacherId(faculty[0].id);
        }

        if (selectedTermId !== "ALL" && selectedTermId) {
            setModalTermId(Number(selectedTermId));
        } else if (activeTermObj) {
            setModalTermId(activeTermObj.id);
        } else if (terms.length > 0) {
            setModalTermId(terms[0].id);
        }

        if (sections.length > 0 && !modalSectionId) setModalSectionId(sections[0].id);
        if (subjects.length > 0 && !modalSubjectId) setModalSubjectId(subjects[0].id);

        setIsAllotModalOpen(true);
    };

    const handleAllotSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!modalTeacherId || !modalTermId || !modalSectionId || !modalSubjectId) {
            setMessage({ type: "error", text: "Please select Semester, Section, Subject, and Faculty Member." });
            return;
        }

        setSubmitting(true);
        try {
            await createOffering({
                term_id: Number(modalTermId),
                section_id: Number(modalSectionId),
                subject_id: Number(modalSubjectId),
                teacher_id: Number(modalTeacherId),
            });

            setMessage({ type: "success", text: "Class successfully allotted to faculty member!" });
            setIsAllotModalOpen(false);
            // Refresh offerings
            const updatedOfferings = await listOfferings();
            setOfferings(updatedOfferings ?? []);
            // Automatically expand the teacher card
            setExpandedTeachers((prev) => ({ ...prev, [Number(modalTeacherId)]: true }));
        } catch (err) {
            setMessage({
                type: "error",
                text: err instanceof Error ? err.message : "Failed to allot class",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const openDeleteModal = (offering: Offering) => {
        setOfferingToDelete(offering);
        setDeleteAgreed(false);
    };

    const switchToReassign = (offering: Offering) => {
        setOfferingToDelete(null);
        setOfferingToReassign(offering);
        setModalReassignTeacherId("");
    };

    const handleConfirmDelete = async () => {
        if (!offeringToDelete) return;
        setDeleting(true);
        try {
            await deleteOffering(offeringToDelete.id);
            setMessage({ type: "success", text: `Unassigned ${offeringToDelete.subject_name} successfully.` });
            setOfferings((prev) => prev.filter((o) => o.id !== offeringToDelete.id));
            setOfferingToDelete(null);
        } catch (err) {
            setMessage({
                type: "error",
                text: err instanceof Error ? err.message : "Failed to unassign class offering",
            });
        } finally {
            setDeleting(false);
        }
    };

    const handleConfirmReassign = async (e: FormEvent) => {
        e.preventDefault();
        if (!offeringToReassign || !modalReassignTeacherId) {
            setMessage({ type: "error", text: "Please select a replacement faculty member." });
            return;
        }

        const newTeacherId = Number(modalReassignTeacherId);
        const targetTeacher = faculty.find((f) => Number(f.id) === newTeacherId);
        const targetTeacherName = targetTeacher?.full_name || "new faculty member";

        setReassigning(true);
        try {
            await reassignOffering(offeringToReassign.id, newTeacherId);
            setMessage({
                type: "success",
                text: `Successfully reassigned ${offeringToReassign.subject_name} (${offeringToReassign.section_name}) to ${targetTeacherName}!`,
            });
            setOfferingToReassign(null);
            setModalReassignTeacherId("");

            // Refresh latest offerings and faculty data
            const [updatedOfferings, updatedFaculty] = await Promise.all([
                listOfferings(),
                listFaculty(),
            ]);
            if (updatedOfferings) setOfferings(updatedOfferings);
            if (updatedFaculty) setFaculty(updatedFaculty);

            // Avoid search-filter trapping: If user was searching by the previous teacher's name,
            // switch search query to the new teacher's name so their card is immediately visible!
            if (targetTeacher) {
                setSearchQuery(targetTeacher.full_name);
                setExpandedTeachers((prev) => ({ ...prev, [newTeacherId]: true }));
            }
            if (workloadFilter === "UNALLOCATED") {
                setWorkloadFilter("ALL");
            }
        } catch (err) {
            setMessage({
                type: "error",
                text: err instanceof Error ? err.message : "Failed to reassign class offering",
            });
        } finally {
            setReassigning(false);
        }
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                        Teacher Allotted Classes
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Monitor faculty workload and inspect which teacher is currently allotted to each section and subject.
                    </p>
                </div>
                {!readOnly && (
                    <button
                        onClick={() => openAllotModal()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Allot New Class</span>
                    </button>
                )}
            </div>

            {/* Notification Banner */}
            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className={`p-3 rounded-lg flex items-start gap-3 border text-xs font-medium ${
                            message.type === "success"
                                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                : "bg-rose-50 border-rose-200 text-rose-800"
                        }`}
                    >
                        {message.type === "success" ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        ) : (
                            <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 flex-shrink-0" />
                        )}
                        <p className="flex-1">{message.text}</p>
                        <button
                            onClick={() => setMessage(null)}
                            className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">
                            Total faculty
                        </span>
                        <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                            <Users className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2.5">
                        <div className="text-2xl font-bold tabular-nums text-slate-900 tracking-tight">
                            {stats.totalFaculty}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500 font-medium">
                            Registered instructors
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">
                            Allotted classes
                        </span>
                        <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                            <BookOpen className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2.5">
                        <div className="text-2xl font-bold tabular-nums text-slate-900 tracking-tight">
                            {stats.totalOfferings}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500 font-medium">
                            Active course offerings
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">
                            Allocated faculty
                        </span>
                        <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                            <GraduationCap className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2.5">
                        <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-2xl font-bold tabular-nums text-slate-900 tracking-tight">
                                {stats.allocatedFaculty}
                            </span>
                            {stats.unallocatedFaculty > 0 ? (
                                <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                    {stats.unallocatedFaculty} unallocated
                                </span>
                            ) : (
                                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                    100% assigned
                                </span>
                            )}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500 font-medium">
                            Assigned instructors
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">
                            Average class load
                        </span>
                        <div className="h-8 w-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                            <FolderKanban className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2.5">
                        <div className="text-2xl font-bold tabular-nums text-slate-900 tracking-tight">
                            {stats.avgLoad}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500 font-medium">
                            Classes per teacher
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Filter by teacher, subject code, or section..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-8 py-1.5 bg-white text-xs rounded-md border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Filter controls */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Term Filter */}
                        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-600">
                            <Calendar className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                            <span className="font-medium text-slate-500 shrink-0">Semester:</span>
                            <FormSelect
                                value={selectedTermId}
                                onChange={(val) => setSelectedTermId(val)}
                                options={[
                                    { value: "ALL", label: "All Semesters" },
                                    ...terms.map((t) => ({
                                        value: t.id.toString(),
                                        label: `${t.name}${t.is_active ? " (Active)" : ""}`,
                                    })),
                                ]}
                                className="!w-auto !border-0 !bg-transparent !py-0 !px-1 text-xs font-medium text-slate-800 shadow-none min-w-[120px]"
                            />
                        </div>

                        {/* Role Filter */}
                        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-600">
                            <Shield className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                            <span className="font-medium text-slate-500 shrink-0">Role:</span>
                            <FormSelect
                                value={selectedRole}
                                onChange={(val) => setSelectedRole(val)}
                                options={[
                                    { value: "ALL", label: "All Roles" },
                                    { value: "TEACHER", label: "Teacher" },
                                    { value: "COORDINATOR", label: "Coordinator" },
                                    { value: "HOD", label: "HOD" },
                                ]}
                                className="!w-auto !border-0 !bg-transparent !py-0 !px-1 text-xs font-medium text-slate-800 shadow-none min-w-[110px]"
                            />
                        </div>

                        {/* Workload Filter */}
                        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-600">
                            <Filter className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            <FormSelect
                                value={workloadFilter}
                                onChange={(val) => setWorkloadFilter(val as any)}
                                options={[
                                    { value: "ALL", label: "All Workloads" },
                                    { value: "ALLOCATED", label: "Allocated Only" },
                                    { value: "UNALLOCATED", label: "Unallocated Only" },
                                ]}
                                className="!w-auto !border-0 !bg-transparent !py-0 !px-1 text-xs font-medium text-slate-800 shadow-none min-w-[130px]"
                            />
                        </div>

                        {/* View Mode Switcher */}
                        <div className="flex items-center border border-slate-200 rounded-md overflow-hidden bg-slate-100 p-0.5">
                            <button
                                onClick={() => setViewMode("faculty")}
                                title="Group by Teacher"
                                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                                    viewMode === "faculty"
                                        ? "bg-blue-600 text-white shadow-xs font-semibold"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <LayoutGrid className="h-3.5 w-3.5 inline mr-1" />
                                <span>Faculty</span>
                            </button>
                            <button
                                onClick={() => setViewMode("offerings")}
                                title="List by Class Offering"
                                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                                    viewMode === "offerings"
                                        ? "bg-blue-600 text-white shadow-xs font-semibold"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <List className="h-3.5 w-3.5 inline mr-1" />
                                <span>Offerings</span>
                            </button>
                        </div>
                    </div>
                </div>

                {viewMode === "faculty" && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                        <span>Showing {filteredFaculty.length} faculty members</span>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={expandAll}
                                className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                            >
                                Expand All
                            </button>
                            <span className="text-slate-300">•</span>
                            <button
                                onClick={collapseAll}
                                className="text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
                            >
                                Collapse All
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-slate-200 shadow-2xs">
                    <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                    <p className="text-xs text-slate-500 mt-2 font-medium">Loading faculty allotments...</p>
                </div>
            ) : viewMode === "faculty" ? (
                /* Faculty Centric Grid / Cards */
                filteredFaculty.length === 0 ? (
                    <div className="bg-white rounded-lg border border-slate-200 p-12 text-center shadow-2xs">
                        <GraduationCap className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <h3 className="text-sm font-semibold text-slate-700">No faculty members found</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                            No faculty match your active filters. Try adjusting the search query, semester, or workload filter.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-3">
                            {paginatedFaculty.map((teacher) => {
                            const isExpanded = expandedTeachers[teacher.id] ?? true;
                            return (
                                <div
                                    key={teacher.id}
                                    className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden"
                                >
                                    {/* Faculty Header Card */}
                                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                                        <div className="flex items-center gap-3">
                                            {/* Avatar */}
                                            <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-200 shrink-0">
                                                {teacher.full_name
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .slice(0, 2)
                                                    .join("")
                                                    .toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="text-sm font-semibold text-slate-900">
                                                        {teacher.full_name}
                                                    </h3>
                                                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                                        {teacher.role}
                                                    </span>
                                                    {teacher.offeringCount > 0 ? (
                                                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                            {teacher.offeringCount}{" "}
                                                            {teacher.offeringCount === 1 ? "Class" : "Classes"} Allotted
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                                            Unallocated
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 font-mono mt-0.5">{teacher.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-end sm:self-auto">
                                            {!readOnly && (
                                                <button
                                                    onClick={() => openAllotModal(teacher.id)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                    Allot Class
                                                </button>
                                            )}
                                            <button
                                                onClick={() => toggleTeacherExpand(teacher.id)}
                                                className="p-1 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                                                title={isExpanded ? "Collapse" : "Expand"}
                                            >
                                                {isExpanded ? (
                                                    <ChevronUp className="h-4 w-4" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Allotted Classes Nested List */}
                                    {isExpanded && (
                                        <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                                            {teacher.offerings.length === 0 ? (
                                                <div className="text-center py-4 bg-white rounded-lg border border-dashed border-slate-200">
                                                    <p className="text-xs text-slate-400 italic">
                                                        No course offerings assigned in the selected semester.
                                                    </p>
                                                    {!readOnly && (
                                                        <button
                                                            onClick={() => openAllotModal(teacher.id)}
                                                            className="text-xs text-blue-600 font-semibold hover:text-blue-800 hover:underline mt-1 cursor-pointer"
                                                        >
                                                            + Assign a class now
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {teacher.offerings.map((offering) => (
                                                        <div
                                                            key={offering.id}
                                                            className="bg-white p-3.5 rounded-lg border border-slate-200 hover:border-blue-200 shadow-2xs flex flex-col justify-between transition-colors"
                                                        >
                                                            <div className="space-y-1.5">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="font-semibold text-sm text-slate-900 line-clamp-1">
                                                                        {offering.subject_name}
                                                                    </div>
                                                                    {!readOnly && (
                                                                        <div className="flex items-center gap-0.5">
                                                                            <button
                                                                                onClick={() => {
                                                                                    setOfferingToReassign(offering);
                                                                                    setModalReassignTeacherId("");
                                                                                }}
                                                                                className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-1 rounded transition-colors cursor-pointer"
                                                                                title="Reassign to another teacher"
                                                                            >
                                                                                <UserCheck className="h-3.5 w-3.5" />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => openDeleteModal(offering)}
                                                                                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded transition-colors cursor-pointer"
                                                                                title="Unassign class"
                                                                            >
                                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {offering.subject_code && (
                                                                    <span className="inline-block font-mono text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                                                                        {offering.subject_code}
                                                                    </span>
                                                                )}

                                                                <div className="flex items-center gap-2 pt-1 flex-wrap">
                                                                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                                        <FolderKanban className="h-3 w-3 text-indigo-600" />
                                                                        {offering.section_name}
                                                                    </span>
                                                                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                                                                        <Calendar className="h-3 w-3 text-slate-400" />
                                                                        {offering.term_name}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                        {/* Faculty Pagination Footer */}
                        <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-2xs">
                            <div className="flex items-center gap-3 text-slate-500 font-medium">
                                <span>
                                    Showing <strong className="text-slate-900">{filteredFaculty.length === 0 ? 0 : (facultyPage - 1) * facultyPageSize + 1}</strong> to <strong className="text-slate-900">{Math.min(facultyPage * facultyPageSize, filteredFaculty.length)}</strong> of <strong className="text-slate-900">{filteredFaculty.length}</strong> faculty
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
                                        options={[6, 12, 24, 48]}
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
                )
            ) : (
                /* Class Offerings Centric Table */
                <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                                    <th className="py-3 px-4">Subject</th>
                                    <th className="py-3 px-4">Code</th>
                                    <th className="py-3 px-4">Section</th>
                                    <th className="py-3 px-4">Semester</th>
                                    <th className="py-3 px-4">Allotted Teacher</th>
                                    {!readOnly && <th className="py-3 px-4 text-right">Action</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredOfferings.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                                            No course offerings found matching criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedOfferings.map((offering) => (
                                        <tr key={offering.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="py-3 px-4 font-semibold text-slate-900">
                                                {offering.subject_name}
                                            </td>
                                            <td className="py-3 px-4">
                                                {offering.subject_code ? (
                                                    <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                                                        {offering.subject_code}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                    <FolderKanban className="h-3 w-3 text-indigo-600" />
                                                    {offering.section_name}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-xs text-slate-600 font-medium">
                                                {offering.term_name}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-7 w-7 rounded-md bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200 shrink-0">
                                                        {offering.teacher_name
                                                            .split(" ")
                                                            .map((n) => n[0])
                                                            .slice(0, 2)
                                                            .join("")
                                                            .toUpperCase()}
                                                    </div>
                                                    <span className="font-semibold text-slate-800 text-xs">
                                                        {offering.teacher_name}
                                                    </span>
                                                </div>
                                            </td>
                                            {!readOnly && (
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => {
                                                                setOfferingToReassign(offering);
                                                                setModalReassignTeacherId("");
                                                            }}
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                                            title="Reassign to another teacher"
                                                        >
                                                            <UserCheck className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => openDeleteModal(offering)}
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                                            title="Unassign class"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Offerings Pagination Footer */}
                    <div className="bg-white border-t border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3 text-slate-500 font-medium">
                            <span>
                                Showing <strong className="text-slate-900">{filteredOfferings.length === 0 ? 0 : (offeringsPage - 1) * offeringsPageSize + 1}</strong> to <strong className="text-slate-900">{Math.min(offeringsPage * offeringsPageSize, filteredOfferings.length)}</strong> of <strong className="text-slate-900">{filteredOfferings.length}</strong> offerings
                            </span>
                            <span className="text-slate-200">|</span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-500 font-medium">Per page:</span>
                                <PageSizeDropdown
                                    value={offeringsPageSize}
                                    onChange={(size) => {
                                        setOfferingsPageSize(size);
                                        setOfferingsPage(1);
                                    }}
                                    options={[15, 25, 50, 100]}
                                />
                            </div>
                        </div>

                        {totalOfferingsPages > 1 && (
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setOfferingsPage((p) => Math.max(1, p - 1))}
                                    disabled={offeringsPage === 1}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors cursor-pointer"
                                >
                                    <ChevronLeft className="h-4 w-4" /> Prev
                                </button>

                                <span className="text-xs text-slate-600 px-2 font-medium">
                                    Page <strong>{offeringsPage}</strong> of <strong>{totalOfferingsPages}</strong>
                                </span>

                                <button
                                    onClick={() => setOfferingsPage((p) => Math.min(totalOfferingsPages, p + 1))}
                                    disabled={offeringsPage === totalOfferingsPages}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors cursor-pointer"
                                >
                                    Next <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal: Allot Class to Teacher */}
            <AnimatePresence>
                {isAllotModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden"
                        >
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                                    <GraduationCap className="h-4 w-4 text-blue-600" />
                                    <h2>Allot Class to Faculty Member</h2>
                                </div>
                                <button
                                    onClick={() => setIsAllotModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <form onSubmit={handleAllotSubmit} className="p-5 space-y-4">
                                {/* Teacher Selection */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Faculty Member *
                                    </label>
                                    <FormSelect
                                        value={modalTeacherId ? String(modalTeacherId) : ""}
                                        onChange={(val) => setModalTeacherId(val ? Number(val) : 0)}
                                        options={faculty.map((f) => ({
                                            value: f.id,
                                            label: `${f.full_name} (${f.role}) — ${f.email}`
                                        }))}
                                        placeholder="Select Faculty Member..."
                                    />
                                </div>

                                {/* Semester */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Semester *
                                    </label>
                                    <FormSelect
                                        value={modalTermId ? String(modalTermId) : ""}
                                        onChange={(val) => setModalTermId(val ? Number(val) : 0)}
                                        options={terms.map((t) => ({
                                            value: t.id,
                                            label: `${t.name} ${t.is_active ? "— [Active Semester]" : ""}`
                                        }))}
                                        placeholder="Select Semester..."
                                    />
                                </div>

                                {/* Section */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Target Section *
                                    </label>
                                    <FormSelect
                                        value={modalSectionId ? String(modalSectionId) : ""}
                                        onChange={(val) => setModalSectionId(val ? Number(val) : 0)}
                                        options={sections.map((s) => ({
                                            value: s.id,
                                            label: `${s.name} (ID: #${s.id})`
                                        }))}
                                        placeholder="Select Class Section..."
                                    />
                                </div>

                                {/* Subject */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Subject / Course *
                                    </label>
                                    <FormSelect
                                        value={modalSubjectId ? String(modalSubjectId) : ""}
                                        onChange={(val) => setModalSubjectId(val ? Number(val) : 0)}
                                        options={subjects.map((sub) => ({
                                            value: sub.id,
                                            label: `${sub.course_code ? `${sub.course_code} · ` : ""}${sub.name} ${sub.is_elective ? "(Elective)" : ""}`
                                        }))}
                                        placeholder="Select Subject..."
                                    />
                                </div>

                                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsAllotModalOpen(false)}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
                                    >
                                        {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                        Confirm Allotment
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal: Confirm Delete / Unassign with Linked Data Warning */}
            <AnimatePresence>
                {offeringToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-rose-700 font-semibold text-sm">
                                    <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                                    <h2>Unassign Class Offering</h2>
                                </div>
                                <button
                                    onClick={() => setOfferingToDelete(null)}
                                    className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="p-5 space-y-4">
                                {/* Class Details Card */}
                                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                                    <div className="font-semibold text-slate-900 text-sm">
                                        {offeringToDelete.subject_name}{" "}
                                        {offeringToDelete.subject_code && (
                                            <span className="font-mono text-xs font-medium text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded">
                                                {offeringToDelete.subject_code}
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                                        <p>
                                            Section: <strong className="text-slate-800">{offeringToDelete.section_name}</strong>
                                        </p>
                                        <p>
                                            Semester: <strong className="text-slate-800">{offeringToDelete.term_name}</strong>
                                        </p>
                                        <p className="col-span-2">
                                            Currently Allotted: <strong className="text-slate-800">{offeringToDelete.teacher_name}</strong>
                                        </p>
                                    </div>
                                </div>

                                {/* Linked Dependency Warning Alert */}
                                <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-lg text-xs space-y-2 text-amber-900">
                                    <div className="flex items-center gap-2 font-semibold text-amber-900">
                                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                                        <span>Linked Dependencies Warning</span>
                                    </div>
                                    <p className="text-amber-800 leading-relaxed">
                                        This class offering may be actively linked to <strong>weekly timetable schedule slots</strong>, <strong>room allocations</strong>, and <strong>student course enrollments</strong>.
                                    </p>
                                    <ul className="list-disc pl-5 space-y-1 text-amber-900/90">
                                        <li>Dissociates <strong>{offeringToDelete.teacher_name}</strong> from this section.</li>
                                        <li>Clears all scheduled timetable slots for this subject & section.</li>
                                        <li>Removes enrolled students from this course offering roster.</li>
                                    </ul>
                                </div>

                                {/* Reassign Instead Option Callout */}
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3 text-xs">
                                    <div className="text-slate-700">
                                        <p className="font-semibold text-slate-900">Need to assign a different teacher?</p>
                                        <p className="text-slate-500 text-[11px] mt-0.5">
                                            Reassigning transfers the class while keeping all timetable slots and student rosters intact.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => switchToReassign(offeringToDelete)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium text-xs transition-colors shadow-2xs flex-shrink-0 cursor-pointer"
                                    >
                                        <UserCheck className="h-3.5 w-3.5 text-slate-500" />
                                        Reassign Instead
                                    </button>
                                </div>

                                {/* Safety Checkbox Confirmation */}
                                <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={deleteAgreed}
                                        onChange={(e) => setDeleteAgreed(e.target.checked)}
                                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                                    />
                                    <span className="text-xs font-medium text-slate-700 leading-tight">
                                        I understand that this class is linked to academic schedules and I confirm deleting this offering.
                                    </span>
                                </label>

                                {/* Action Buttons */}
                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setOfferingToDelete(null)}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleConfirmDelete}
                                        disabled={!deleteAgreed || deleting}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
                                    >
                                        {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                        Yes, Remove Allotment
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal: Confirm Reassign Faculty */}
            <AnimatePresence>
                {offeringToReassign && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden"
                        >
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                                    <UserCheck className="h-4 w-4 text-blue-600" />
                                    <h2>Reassign Class to Faculty</h2>
                                </div>
                                <button
                                    onClick={() => setOfferingToReassign(null)}
                                    className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <form onSubmit={handleConfirmReassign} className="p-5 space-y-4">
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                                    <p className="font-semibold text-slate-900 text-sm">
                                        {offeringToReassign.subject_name}
                                    </p>
                                    <p className="text-slate-500">
                                        Section: <span className="font-medium text-slate-700">{offeringToReassign.section_name}</span>
                                    </p>
                                    <p className="text-slate-500">
                                        Currently Allotted: <span className="font-medium text-slate-700">{offeringToReassign.teacher_name}</span>
                                    </p>
                                    <p className="text-slate-500">
                                        Semester: <span className="font-medium text-slate-700">{offeringToReassign.term_name}</span>
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        New Faculty Member *
                                    </label>
                                    <FormSelect
                                        value={modalReassignTeacherId ? String(modalReassignTeacherId) : ""}
                                        onChange={(val) => setModalReassignTeacherId(val ? Number(val) : "")}
                                        options={faculty.map((f) => {
                                            const isCurrentTeacher =
                                                (offeringToReassign.teacher_id !== undefined && Number(f.id) === Number(offeringToReassign.teacher_id)) ||
                                                Boolean(
                                                    offeringToReassign.teacher_name &&
                                                    f.full_name &&
                                                    offeringToReassign.teacher_name.trim().toLowerCase() === f.full_name.trim().toLowerCase()
                                                );
                                            return {
                                                value: f.id,
                                                label: `${f.full_name} (${f.role}) ${isCurrentTeacher ? "— Current Teacher (Assigned)" : `— ${f.email}`}`
                                            };
                                        })}
                                        placeholder="Select Replacement Faculty Member..."
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setOfferingToReassign(null)}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={reassigning}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
                                    >
                                        {reassigning && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                        Confirm Reassignment
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
