// src/pages/admin/UniversityTimetableTab.tsx
import { useState, useEffect, useMemo } from "react";
import {
    Clock,
    Search,
    Printer,
    RefreshCw,
    GraduationCap,
    Users,
    BookOpen,
    Loader2,
    MapPin,
    AlertCircle
} from "lucide-react";
import { FormSelect } from "../../components/ui/form-select";
import {
    getSamayMetadata,
    getSamaySlots,
    previewTimetableSync,
    applyTimetableSync,
    getTimetableSyncHistory,
    rollbackTimetableSync
} from "../../api/admin";
import type {
    SamayMetadata,
    SamaySlotsResponse,
    SamaySlot,
    TimetableSyncPreview,
    TimetableSyncHistoryItem
} from "../../api/admin";
import {
    CheckCircle2,
    Database,
    History,
    Undo2,
    X,
    ShieldCheck,
    Plus,
    Check
} from "lucide-react";

const PERIOD_LABELS: Record<number, { roman: string; time: string; startMin: number; endMin: number }> = {
    1: { roman: "I", time: "08:30-09:30", startMin: 510, endMin: 570 },
    2: { roman: "II", time: "09:30-10:30", startMin: 570, endMin: 630 },
    3: { roman: "III", time: "10:30-11:30", startMin: 630, endMin: 690 },
    4: { roman: "IV", time: "11:30-12:30", startMin: 690, endMin: 750 },
    5: { roman: "V", time: "12:30-13:30", startMin: 750, endMin: 810 },
    6: { roman: "VI", time: "13:30-14:30", startMin: 810, endMin: 870 },
    7: { roman: "VII", time: "14:30-15:30", startMin: 870, endMin: 930 },
    8: { roman: "VIII", time: "15:30-16:30", startMin: 930, endMin: 990 },
    9: { roman: "IX", time: "16:30-17:30", startMin: 990, endMin: 1050 },
    10: { roman: "X", time: "17:30-18:30", startMin: 1050, endMin: 1110 },
    11: { roman: "XI", time: "18:30-19:30", startMin: 1110, endMin: 1170 },
};

const DAYS = [
    { id: 1, name: "Mon", full: "Monday" },
    { id: 2, name: "Tue", full: "Tuesday" },
    { id: 3, name: "Wed", full: "Wednesday" },
    { id: 4, name: "Thu", full: "Thursday" },
    { id: 5, name: "Fri", full: "Friday" },
    { id: 6, name: "Sat", full: "Saturday" },
    { id: 7, name: "Sun", full: "Sunday" },
];

export default function UniversityTimetableTab() {
    // Mode: "section" | "faculty"
    // Safe Timetable Sync & Rollback States
    const [syncModalOpen, setSyncModalOpen] = useState(false);
    const [previewData, setPreviewData] = useState<TimetableSyncPreview | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [applyingSync, setApplyingSync] = useState(false);
    const [autoEnrollStudents, setAutoEnrollStudents] = useState(true);
    const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
    const [syncError, setSyncError] = useState<string | null>(null);

    // History & Rollback States
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [syncHistory, setSyncHistory] = useState<TimetableSyncHistoryItem[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [rollingBackId, setRollingBackId] = useState<number | null>(null);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"section" | "faculty">("section");

    // Metadata & Loading
    const [metadata, setMetadata] = useState<SamayMetadata | null>(null);
    const [loadingMeta, setLoadingMeta] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [slotsData, setSlotsData] = useState<SamaySlotsResponse | null>(null);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Section View Filters
    const [selectedSchool, setSelectedSchool] = useState<string>("SOICT");
    const [selectedDept, setSelectedDept] = useState<string>("CSE");
    const [selectedSectionId, setSelectedSectionId] = useState<string>("");

    // Faculty View Filters
    const [selectedTeacherName, setSelectedTeacherName] = useState<string>("");
    const [facultySearch, setFacultySearch] = useState<string>("");

    // Live Clock for Ongoing Period Highlight
    const [currentDayPeriod, setCurrentDayPeriod] = useState<{ day: number; period: number } | null>(null);

    useEffect(() => {
        const updateCurrentPeriod = () => {
            const now = new Date();
            const dayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon...
            const mappedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
            const currentMins = now.getHours() * 60 + now.getMinutes();

            let activePeriod = 0;
            for (const [pStr, info] of Object.entries(PERIOD_LABELS)) {
                if (currentMins >= info.startMin && currentMins < info.endMin) {
                    activePeriod = Number(pStr);
                    break;
                }
            }

            if (activePeriod > 0) {
                setCurrentDayPeriod({ day: mappedDay, period: activePeriod });
            } else {
                setCurrentDayPeriod(null);
            }
        };

        updateCurrentPeriod();
        const interval = setInterval(updateCurrentPeriod, 60000);
        return () => clearInterval(interval);
    }, []);

    // Load Metadata on mount
    const loadMetadata = async (force = false) => {
        if (force) setRefreshing(true);
        else setLoadingMeta(true);
        setErrorMessage(null);

        try {
            const data = await getSamayMetadata(force);
            setMetadata(data);

            // Default section setup
            if (data.sections && data.sections.length > 0) {
                // Try finding CS-IV-A or default to first section
                const preferred = data.sections.find((s) => s.section_id === "2433") || data.sections[0];
                setSelectedSchool(preferred.school || "SOICT");
                setSelectedDept(preferred.dept || "CSE");
                setSelectedSectionId(preferred.section_id);
            }

            // Default teacher setup
            if (data.teachers && data.teachers.length > 0) {
                const baghel = data.teachers.find((t) => t.teacher_name.toLowerCase().includes("baghel"));
                setSelectedTeacherName(baghel ? baghel.teacher_name : data.teachers[0].teacher_name);
            }
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : "Failed to connect to Samay Timetable API");
        } finally {
            setLoadingMeta(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadMetadata();
    }, []);

    // Filter available departments for the selected school
    const availableDepts = useMemo(() => {
        if (!metadata || !metadata.departments_by_school) return [];
        return metadata.departments_by_school[selectedSchool] || [];
    }, [metadata, selectedSchool]);

    // Keep selectedDept valid when school changes
    useEffect(() => {
        if (availableDepts.length > 0 && !availableDepts.includes(selectedDept)) {
            setSelectedDept(availableDepts[0]);
        }
    }, [availableDepts, selectedDept]);

    // Filter available sections for the selected School & Dept
    const availableSections = useMemo(() => {
        if (!metadata || !metadata.sections) return [];
        return metadata.sections.filter(
            (s) => s.school === selectedSchool && (!selectedDept || s.dept === selectedDept)
        );
    }, [metadata, selectedSchool, selectedDept]);

    // Update section selection if filtered list changes
    useEffect(() => {
        if (availableSections.length > 0) {
            const exists = availableSections.some((s) => s.section_id === selectedSectionId);
            if (!exists) {
                setSelectedSectionId(availableSections[0].section_id);
            }
        }
    }, [availableSections, selectedSectionId]);

    // Filter available teachers by search
    const filteredTeachers = useMemo(() => {
        if (!metadata || !metadata.teachers) return [];
        const q = facultySearch.toLowerCase().trim();
        if (!q) return metadata.teachers;
        return metadata.teachers.filter(
            (t) =>
                t.teacher_name.toLowerCase().includes(q) ||
                t.abbr.toLowerCase().includes(q) ||
                t.dept.toLowerCase().includes(q) ||
                t.school.toLowerCase().includes(q)
        );
    }, [metadata, facultySearch]);

    // Resolve Current Section Name
    const currentSectionName = useMemo(() => {
        const found = availableSections.find((s) => s.section_id === selectedSectionId);
        return found?.section_name || slotsData?.slots?.[0]?.section_name || "";
    }, [availableSections, selectedSectionId, slotsData]);

    // Handle Open Sync Modal (Diff Preview)
    const handleOpenSyncModal = async () => {
        if (!currentSectionName) return;
        setSyncModalOpen(true);
        setLoadingPreview(true);
        setSyncError(null);
        setSyncSuccessMsg(null);
        try {
            const data = await previewTimetableSync({
                section_name: currentSectionName,
                samay_section_id: selectedSectionId,
                school: selectedSchool,
                dept: selectedDept
            });
            setPreviewData(data);
        } catch (err) {
            setSyncError(err instanceof Error ? err.message : "Failed to load sync preview");
        } finally {
            setLoadingPreview(false);
        }
    };

    // Handle Confirm & Apply Additive Sync
    const handleApplySync = async () => {
        if (!previewData) return;
        setApplyingSync(true);
        setSyncError(null);
        try {
            const res = await applyTimetableSync({
                section_name: previewData.section_name,
                samay_section_id: selectedSectionId,
                school: selectedSchool,
                dept: selectedDept,
                auto_enroll_students: autoEnrollStudents
            });
            setSyncSuccessMsg(res.summary);
            // Refresh preview after short delay to show clean in-sync state
            setTimeout(async () => {
                const refreshed = await previewTimetableSync({
                    section_name: previewData.section_name,
                    samay_section_id: selectedSectionId,
                    school: selectedSchool,
                    dept: selectedDept
                });
                setPreviewData(refreshed);
            }, 500);
        } catch (err) {
            setSyncError(err instanceof Error ? err.message : "Failed to apply timetable sync");
        } finally {
            setApplyingSync(false);
        }
    };

    // Handle Open Sync History
    const handleOpenHistory = async () => {
        setHistoryModalOpen(true);
        setLoadingHistory(true);
        setHistoryError(null);
        try {
            const items = await getTimetableSyncHistory();
            setSyncHistory(items);
        } catch (err) {
            setHistoryError(err instanceof Error ? err.message : "Failed to load sync history");
        } finally {
            setLoadingHistory(false);
        }
    };

    // Handle Rollback
    const handleRollback = async (syncId: number) => {
        if (!confirm("Are you sure you want to rollback this sync? Any newly created course offerings and student enrollments will be safely removed, provided no attendance sessions have been marked.")) {
            return;
        }
        setRollingBackId(syncId);
        setHistoryError(null);
        try {
            await rollbackTimetableSync(syncId);
            const items = await getTimetableSyncHistory();
            setSyncHistory(items);
            if (syncModalOpen && previewData) {
                const refreshed = await previewTimetableSync({
                    section_name: previewData.section_name,
                    school: selectedSchool,
                    dept: selectedDept
                });
                setPreviewData(refreshed);
            }
        } catch (err) {
            setHistoryError(err instanceof Error ? err.message : "Rollback failed");
        } finally {
            setRollingBackId(null);
        }
    };

    // Fetch Slots whenever selected section or teacher changes
    useEffect(() => {
        const fetchSlots = async () => {
            if (viewMode === "section" && !selectedSectionId) return;
            if (viewMode === "faculty" && !selectedTeacherName) return;

            setLoadingSlots(true);
            setErrorMessage(null);
            try {
                const res = await getSamaySlots(
                    viewMode === "section"
                        ? { section_id: selectedSectionId }
                        : { teacher_name: selectedTeacherName }
                );
                setSlotsData(res);
            } catch (err) {
                setErrorMessage(err instanceof Error ? err.message : "Failed to load timetable slots");
            } finally {
                setLoadingSlots(false);
            }
        };

        fetchSlots();
    }, [viewMode, selectedSectionId, selectedTeacherName]);

    // Group slots by (day, period) for the matrix
    const slotMatrix = useMemo(() => {
        const matrix: Record<string, SamaySlot[]> = {};
        if (!slotsData || !slotsData.slots) return matrix;

        slotsData.slots.forEach((s) => {
            const key = `${s.day}-${s.period}`;
            if (!matrix[key]) matrix[key] = [];
            matrix[key].push(s);
        });
        return matrix;
    }, [slotsData]);

    // Total hours calculated from summary
    const totalWeeklyHours = useMemo(() => {
        if (!slotsData || !slotsData.summary) return 0;
        return slotsData.summary.reduce((acc, row) => {
            const h = typeof row.hours === "number" ? row.hours : parseFloat(String(row.hours || "0"));
            return acc + (isNaN(h) ? 0 : h);
        }, 0);
    }, [slotsData]);

    const preparePrintDocument = () => {
        const prevTitle = document.title;
        const identifier = viewMode === "section"
            ? (currentSectionName || "Section").replace(/[^a-zA-Z0-9_-]/g, "_")
            : (selectedTeacherName || "Faculty").replace(/[^a-zA-Z0-9_-]/g, "_");
        document.title = `GBU_Timetable_${identifier}_2026-27`;
        return () => {
            document.title = prevTitle;
        };
    };

    const handlePrint = () => {
        const restore = preparePrintDocument();
        window.print();
        setTimeout(restore, 1500);
    };

    return (
        <div className="space-y-4">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200 no-print">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
                            University Timetable
                        </h1>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 motion-safe:animate-pulse" />
                            <span>Official Samay Live</span>
                        </span>
                        {slotsData?.last_synced && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 tabular-nums shrink-0">
                                <Clock className="h-3 w-3 text-slate-400" />
                                <span>Synced: {slotsData.last_synced}</span>
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Live schedule synced with Gautam Buddha University official timetable portal (mygbu.in/schd)
                    </p>
                </div>

                {/* Right Action Bar */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                    <button
                        onClick={() => loadMetadata(true)}
                        disabled={refreshing || loadingMeta}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-medium text-xs rounded-md border border-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap"
                        title="Force refresh live data from official server"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 text-blue-700 ${refreshing ? "motion-safe:animate-spin" : ""}`} />
                        <span>{refreshing ? "Refreshing…" : "Sync live"}</span>
                    </button>

                    {/* Additive Sync Button (Section View) */}
                    {viewMode === "section" && (
                        <button
                            onClick={handleOpenSyncModal}
                            disabled={!currentSectionName}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-medium text-xs rounded-md shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap"
                            title="Sync official timetable courses into local database"
                        >
                            <Database className="h-3.5 w-3.5" />
                            <span>Sync to DB</span>
                        </button>
                    )}

                    {/* Sync History & Rollback Button */}
                    <button
                        onClick={handleOpenHistory}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-medium text-xs rounded-md border border-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 active:scale-[0.98] whitespace-nowrap"
                        title="View sync history and rollback past updates"
                    >
                        <History className="h-3.5 w-3.5 text-slate-500" />
                        <span>Sync history</span>
                    </button>

                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-medium text-xs rounded-md border border-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 active:scale-[0.98] whitespace-nowrap"
                        title="Print timetable or save as PDF (Landscape)"
                    >
                        <Printer className="h-3.5 w-3.5 text-slate-500" />
                        <span>Print / Save PDF</span>
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-sm no-print">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-600" />
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Control Strip & View Selector */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs space-y-3 no-print">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* View Switcher Toggle */}
                    <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-md border border-slate-200 self-start">
                        <button
                            onClick={() => setViewMode("section")}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 ${
                                viewMode === "section"
                                    ? "bg-white text-blue-900 font-semibold shadow-xs"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            <GraduationCap className="h-3.5 w-3.5" />
                            <span>Section / class view</span>
                        </button>
                        <button
                            onClick={() => setViewMode("faculty")}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 ${
                                viewMode === "faculty"
                                    ? "bg-white text-blue-900 font-semibold shadow-xs"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            <Users className="h-3.5 w-3.5" />
                            <span>Faculty load view</span>
                        </button>
                    </div>

                    {/* Active Target Banner */}
                    <div className="flex items-center gap-2 text-xs">
                        <span className="font-medium text-slate-500">Viewing:</span>
                        <span className="font-medium text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                            {slotsData?.title || (viewMode === "section" ? "Select section" : "Select faculty")}
                        </span>
                        {totalWeeklyHours > 0 && (
                            <span className="font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded tabular-nums">
                                {totalWeeklyHours} hours / week
                            </span>
                        )}
                    </div>
                </div>

                {/* Filter Row */}
                {viewMode === "section" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
                        {/* School Filter */}
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                1. School
                            </label>
                            <FormSelect
                                value={selectedSchool}
                                onChange={setSelectedSchool}
                                options={(metadata?.schools || []).map((s) => ({ value: s, label: s }))}
                                placeholder="Select school…"
                            />
                        </div>

                        {/* Department Filter */}
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                2. Department
                            </label>
                            <FormSelect
                                value={selectedDept}
                                onChange={setSelectedDept}
                                options={availableDepts.map((d) => ({ value: d, label: d }))}
                                placeholder="Select department…"
                            />
                        </div>

                        {/* Section Selector */}
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                3. Class section ({availableSections.length} available)
                            </label>
                            <FormSelect
                                value={selectedSectionId}
                                onChange={setSelectedSectionId}
                                options={availableSections.map((sec) => ({
                                    value: sec.section_id,
                                    label: `${sec.program_code ? `[${sec.program_code}] ` : ""}${sec.section_name} (${sec.program_name || sec.dept})`
                                }))}
                                placeholder="Select class section…"
                            />
                        </div>
                    </div>
                ) : (
                    /* Faculty Filter */
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
                        {/* Search Teacher */}
                        <div className="md:col-span-1">
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                Search faculty
                            </label>
                            <div className="relative">
                                <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Type professor name or dept…"
                                    value={facultySearch}
                                    onChange={(e) => setFacultySearch(e.target.value)}
                                    className="w-full pl-8 pr-3 h-8 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus:border-blue-600 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Teacher Dropdown */}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                Select faculty member
                            </label>
                            <FormSelect
                                value={selectedTeacherName}
                                onChange={setSelectedTeacherName}
                                options={filteredTeachers.map((t) => ({
                                    value: t.teacher_name,
                                    label: `${t.teacher_name}${t.dept ? ` (${t.dept})` : ""}`
                                }))}
                                placeholder="Select faculty member…"
                            />
                        </div>
                    </div>
                )}


            </div>

            {/* Timetable Matrix Grid Container */}
            <div id="timetable-print-area" className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                {/* Official University Institutional Header (Print Only - Compact 1-Page Fit) */}
                <div className="hidden print:flex items-center justify-between px-2.5 py-1.5 bg-slate-100 border-b-2 border-slate-900 text-slate-900">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded bg-slate-900 text-white flex items-center justify-center font-black text-[11px] tracking-wider">
                            GBU
                        </div>
                        <div>
                            <div className="text-[11px] font-black uppercase tracking-wider text-slate-900 leading-tight">
                                Gautam Buddha University • Greater Noida
                            </div>
                            <div className="text-[9px] text-slate-600 font-medium leading-tight">
                                {slotsData?.title || (viewMode === "section" ? currentSectionName : selectedTeacherName)} • Odd Semester 2026-27 {slotsData?.subtitle ? `(${slotsData.subtitle})` : ""}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5 text-[9px] text-slate-600">
                        <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded border border-slate-200">
                            <span className="flex items-center gap-1 font-semibold text-blue-900">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 inline-block" /> Lecture
                            </span>
                            <span className="text-slate-300">|</span>
                            <span className="flex items-center gap-1 font-semibold text-emerald-900">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" /> Lab
                            </span>
                        </div>
                        {totalWeeklyHours > 0 && (
                            <span className="font-bold text-slate-900 bg-slate-200 px-2 py-0.5 rounded">
                                Total: {totalWeeklyHours} Hrs/Week
                            </span>
                        )}
                        <span className="text-slate-400">|</span>
                        <div className="text-right text-[8px] text-slate-500">
                            Live Synced: {slotsData?.last_synced || "Official"}
                        </div>
                    </div>
                </div>

                {/* Print Title Header (Visible on Screen, Hidden on Print to Save Vertical Space) */}
                <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 print:hidden">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/15 font-medium">
                                GBU 2026-27 (Odd Semester)
                            </span>
                            <span className="text-xs text-white/80 font-normal">
                                {viewMode === "section" ? "Class Schedule" : "Faculty Weekly Load"}
                            </span>
                        </div>
                        <h2 className="text-lg font-semibold tracking-tight mt-1 text-white">
                            {slotsData?.title || "Loading timetable…"}
                        </h2>
                        <p className="text-xs text-white/70 mt-0.5">{slotsData?.subtitle}</p>
                    </div>

                    <div className="flex items-center gap-2 text-xs self-start sm:self-auto bg-white/10 px-2.5 py-1 rounded border border-white/10">
                        <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-blue-400" />
                            <span className="text-white/90">Lecture</span>
                        </div>
                        <span className="text-white/40">|</span>
                        <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            <span className="text-white/90">Lab</span>
                        </div>
                    </div>
                </div>

                {/* Grid Table */}
                {loadingSlots ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <Loader2 className="h-8 w-8 text-blue-700 motion-safe:animate-spin" />
                        <p className="text-xs font-medium text-slate-600 mt-2">Loading timetable matrix…</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto print:overflow-visible">
                        <table className="w-full text-left border-collapse min-w-[950px] print:min-w-0 print:w-full print:table-fixed">
                            <thead>
                                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                                    <th className="py-2.5 px-3 font-semibold text-xs text-slate-600 w-20 print:w-14 border-r border-slate-200 text-center sticky left-0 bg-slate-100 z-10 print:static print:bg-slate-100 print:py-1.5 print:px-1 print:text-[10px]">
                                        Day
                                    </th>
                                    {Object.entries(PERIOD_LABELS).map(([pStr, info]) => {
                                        const pNum = Number(pStr);
                                        const isLiveNow = currentDayPeriod?.period === pNum;
                                        return (
                                            <th
                                                key={pNum}
                                                className={`py-2 px-2 print:py-1 print:px-0.5 text-center border-r border-slate-200 last:border-r-0 min-w-[85px] print:min-w-0 transition-colors ${
                                                    isLiveNow ? "bg-amber-100 text-amber-900 font-bold" : ""
                                                }`}
                                            >
                                                <div className="font-extrabold text-xs">
                                                    {info.roman}
                                                    {isLiveNow && (
                                                        <span className="ml-1 text-[9px] px-1 py-0.2 rounded bg-amber-500 text-white font-semibold motion-safe:animate-pulse">
                                                            Now
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[10px] font-medium text-slate-500 mt-0.5 leading-tight">
                                                    {info.time}
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-xs">
                                {DAYS.map((day) => {
                                    const isToday = currentDayPeriod?.day === day.id;
                                    return (
                                        <tr
                                            key={day.id}
                                            className={`hover:bg-slate-50/50 transition-colors ${
                                                isToday ? "bg-amber-50/20" : ""
                                            }`}
                                        >
                                            {/* Day Row Header */}
                                            <td
                                                className={`py-3 px-3 print:py-0.5 print:px-1 font-bold text-xs print:text-[10px] text-center border-r border-slate-200 sticky left-0 z-10 print:static print:bg-slate-100 transition-colors ${
                                                    isToday
                                                        ? "bg-amber-100/90 text-amber-900 border-r-amber-300"
                                                        : "bg-slate-50 text-slate-700"
                                                }`}
                                            >
                                                <div className="font-bold">{day.name}</div>
                                                {isToday && (
                                                    <span className="text-[9px] font-semibold text-amber-700 block mt-0.5">
                                                        Today
                                                    </span>
                                                )}
                                            </td>

                                            {/* Period Slots 1 to 11 */}
                                            {Object.keys(PERIOD_LABELS).map((pStr) => {
                                                const pNum = Number(pStr);
                                                const matrixKey = `${day.id}-${pNum}`;
                                                const matchingSlots = slotMatrix[matrixKey] || [];
                                                const isLiveSlot =
                                                    currentDayPeriod?.day === day.id && currentDayPeriod?.period === pNum;

                                                return (
                                                    <td
                                                        key={pNum}
                                                        className={`p-1 print:p-0.5 border-r border-slate-200 last:border-r-0 align-top transition-colors ${
                                                            isLiveSlot ? "bg-amber-50/50 ring-1 ring-amber-400 inset-0" : ""
                                                        }`}
                                                    >
                                                        {matchingSlots.length === 0 ? (
                                                            <div className="h-full min-h-[58px] print:min-h-[22px] flex items-center justify-center text-slate-300">
                                                                <span className="text-slate-300 text-xs font-light select-none">·</span>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-1 print:space-y-0.5">
                                                                {matchingSlots.map((slot, idx) => {
                                                                    const isLab =
                                                                        slot.activity.toLowerCase() === "lab" ||
                                                                        slot.room.toLowerCase().includes("lp");

                                                                    const groupBadge = slot.batch_id && slot.batch_id !== "0" ? `G-${slot.batch_id}` : null;
                                                                    const groupTitle = groupBadge ? ` (${groupBadge})` : "";

                                                                    return (
                                                                        <div
                                                                            key={idx}
                                                                            title={`${slot.subject_code}: ${slot.subject_name}${groupTitle}\nFaculty: ${slot.teacher_name} (${slot.teacher_abbr})\nRoom: ${slot.room || "TBA"}${groupTitle}\nSection: ${slot.section_name}`}
                                                                            className={`p-1.5 rounded-md border text-left shadow-2xs motion-safe:transition-transform hover:scale-[1.02] cursor-default print:p-0.5 print:my-0 print:rounded-none print:shadow-none print:border ${
                                                                                isLab
                                                                                    ? "bg-emerald-50/90 border-emerald-300 text-emerald-950"
                                                                                    : "bg-blue-50/90 border-blue-200 text-blue-950"
                                                                            }`}
                                                                        >
                                                                            {/* Subject Code + Abbr */}
                                                                            <div className="flex items-center justify-between gap-1 leading-tight">
                                                                                <span className="font-extrabold text-[11px] print:text-[10px] tracking-tight">
                                                                                    {slot.subject_code}
                                                                                </span>
                                                                                {slot.teacher_abbr && (
                                                                                    <span
                                                                                        className={`text-[9px] font-bold px-1 rounded ${
                                                                                            isLab
                                                                                                ? "bg-emerald-200/70 text-emerald-800"
                                                                                                : "bg-blue-200/70 text-blue-800"
                                                                                        }`}
                                                                                    >
                                                                                        {slot.teacher_abbr}
                                                                                    </span>
                                                                                )}
                                                                            </div>

                                                                            {/* Room Badge + Group Badge */}
                                                                            <div className="flex items-center justify-between gap-1 mt-1 print:mt-0 text-[10px] print:text-[8px] font-semibold text-slate-600">
                                                                                <div className="flex items-center gap-1 min-w-0">
                                                                                    <MapPin className="h-2.5 w-2.5 text-slate-400 flex-shrink-0" />
                                                                                    <span
                                                                                        className={`truncate ${
                                                                                            isLab ? "text-emerald-800" : "text-blue-800"
                                                                                        }`}
                                                                                    >
                                                                                        {slot.room || "TBA"}
                                                                                    </span>
                                                                                </div>
                                                                                {groupBadge && (
                                                                                    <span className="shrink-0 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-200/90 text-emerald-900 border border-emerald-300">
                                                                                        {groupBadge}
                                                                                    </span>
                                                                                )}
                                                                            </div>

                                                                            {/* In Faculty View: Show Section Name */}
                                                                            {viewMode === "faculty" && slot.section_name && (
                                                                                <div className="mt-0.5 print:mt-0 text-[9px] print:text-[8px] print:leading-tight font-medium print:font-bold text-slate-500 print:text-slate-700 truncate">
                                                                                    {slot.section_name}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Evaluated Non-Classroom Courses (Minor Project & Industrial Training) */}
                {viewMode === "section" && slotsData?.non_classroom_courses && slotsData.non_classroom_courses.length > 0 && (
                    <div className="mx-4 sm:mx-6 mt-4 p-4 print:mx-0 print:mt-1 print:mb-0 print:p-1 rounded-lg bg-blue-50/70 border border-blue-200 print:bg-white print:border-slate-300 print-avoid-break">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-md bg-blue-700 text-white flex-shrink-0 mt-0.5 shadow-xs">
                                <GraduationCap className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <h4 className="text-xs font-semibold text-blue-950 flex items-center gap-2">
                                        <span>Non-classroom / field courses (Minor project & industrial training)</span>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                            Official Curriculum
                                        </span>
                                    </h4>
                                    <span className="text-xs text-slate-500">
                                        {slotsData.non_classroom_courses.length} courses registered
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 mt-1 print:hidden">
                                    These courses are officially registered for this section in university records and evaluated for full credits, but are self-directed or field-based so they do not occupy fixed period slots on the weekly timetable grid.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-3">
                                    {slotsData.non_classroom_courses.map((course, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-3 print:p-1 rounded-lg bg-white border border-blue-100 print:border-slate-200 shadow-2xs hover:border-blue-300 transition-colors"
                                        >
                                            <div className="min-w-0 pr-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-extrabold text-xs text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                                        {course.subject_code}
                                                    </span>
                                                    <span className="font-bold text-xs text-slate-800 truncate">
                                                        {course.subject_name}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                                                    <span>Faculty: <strong className="text-slate-700">{course.teacher_name || "Assigned"}</strong></span>
                                                    {course.teacher_abbr && (
                                                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold text-[10px]">
                                                            {course.teacher_abbr}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <span className="inline-block px-2.5 py-1 rounded-md text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                    {course.credits ? `${course.credits} Credits` : "Project"}
                                                </span>
                                                {course.hours && (
                                                    <div className="text-[10px] font-semibold text-slate-500 mt-1">
                                                        Load: {course.hours} hrs
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bottom Remarks / Breakdown Table */}
                {slotsData && slotsData.summary && slotsData.summary.length > 0 && (
                    <div className="p-4 sm:p-5 print:p-1 border-t border-slate-200 bg-slate-50/50 print-remarks-container print:bg-white print:border-t print:border-slate-300 print:mt-0.5">
                        <div className="flex items-center justify-between mb-3 print:mb-1">
                            <div>
                                <h3 className="font-bold text-sm print:text-[10px] text-slate-800 flex items-center gap-1.5">
                                    <BookOpen className="h-4 w-4 text-blue-600" />
                                    {viewMode === "section"
                                        ? "Remarks (Official University Course Allocations)"
                                        : "Teaching Details & Assigned Workload"}
                                </h3>
                                <p className="text-xs text-slate-500 print:hidden">
                                    {viewMode === "section"
                                        ? "Complete list of subjects, credits, allotted professors, and weekly hours for this section"
                                        : "Complete teaching load distribution across all sections for this faculty member"}
                                </p>
                            </div>

                            <span className="text-xs font-bold text-blue-700 bg-blue-100/70 border border-blue-200 px-3 py-1 rounded-full">
                                Total: {totalWeeklyHours} Hours / Week
                            </span>
                        </div>

                        <div className="overflow-x-auto bg-white rounded-lg border border-slate-200 shadow-2xs">
                            <table className="w-full text-left text-xs divide-y divide-slate-200">
                                <thead className="bg-slate-100/80 font-bold text-slate-700">
                                    <tr>
                                        {viewMode === "faculty" && (
                                            <th className="py-2.5 px-3 print:py-0.5 print:px-1 print:text-[8px]">Class / Section</th>
                                        )}
                                        <th className="py-2.5 px-3 print:py-0.5 print:px-1 print:text-[8px]">Subject Code</th>
                                        <th className="py-2.5 px-3 print:py-0.5 print:px-1 print:text-[8px]">Subject Name</th>
                                        {viewMode === "section" && (
                                            <th className="py-2.5 px-3 print:py-0.5 print:px-1 print:text-[8px] text-center">L-T-P (Credit)</th>
                                        )}
                                        <th className="py-2.5 px-3 print:py-0.5 print:px-1 print:text-[8px]">Type</th>
                                        {viewMode === "section" && (
                                            <>
                                                <th className="py-2.5 px-3 print:py-0.5 print:px-1 print:text-[8px] text-center">Faculty ABR</th>
                                                <th className="py-2.5 px-3 print:py-0.5 print:px-1 print:text-[8px]">Faculty Assigned</th>
                                            </>
                                        )}
                                        <th className="py-2.5 px-3 print:py-0.5 print:px-1 print:text-[8px] text-right">Faculty Load in Hours</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                    {slotsData.summary.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                            {viewMode === "faculty" && (
                                                <td className="py-2.5 px-3 print:py-0.5 print:px-1 print:text-[8px] font-bold text-slate-800">
                                                    {row.section_name || "—"}
                                                </td>
                                            )}
                                            <td className="py-2.5 px-3 print:py-0.5 print:px-1 print:text-[8px] font-mono font-bold text-blue-700">
                                                {row.subject_code}
                                            </td>
                                            <td className="py-2.5 px-3 print:py-0.5 print:px-1 print:text-[8px]">
                                                <div className="flex items-center gap-2">
                                                    <span>{row.subject_name}</span>
                                                    {row.is_non_classroom && (
                                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                            Non-Classroom
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            {viewMode === "section" && (
                                                <td className="py-2.5 px-3 print:py-0.5 print:px-1 print:text-[8px] text-center font-bold text-slate-700">
                                                    {row.credits || "—"}
                                                </td>
                                            )}
                                            <td className="py-2.5 px-3 print:py-0.5 print:px-1 print:text-[8px]">
                                                <span
                                                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                                        row.activity.toLowerCase() === "lab"
                                                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                                            : row.activity.toLowerCase() === "project"
                                                            ? "bg-purple-50 text-purple-800 border border-purple-200"
                                                            : row.activity.toLowerCase() === "training"
                                                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                                                            : "bg-blue-50 text-blue-800 border border-blue-200"
                                                    }`}
                                                >
                                                    {row.activity}
                                                </span>
                                            </td>
                                            {viewMode === "section" && (
                                                <>
                                                    <td className="py-2.5 px-3 print:py-0.5 print:px-1 print:text-[8px] text-center font-bold text-slate-600">
                                                        {row.teacher_abbr || "—"}
                                                    </td>
                                                    <td className="py-2.5 px-3 print:py-0.5 print:px-1 print:text-[8px] font-semibold text-slate-800">
                                                        {row.teacher_name || "—"}
                                                    </td>
                                                </>
                                            )}
                                            <td className="py-2.5 px-3 print:py-0.5 print:px-1 print:text-[8px] text-right font-bold text-slate-800 font-mono">
                                                {row.hours ? (String(row.hours).includes(".") ? row.hours : `${row.hours}.0`) : (row.official_load || ".0")}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* ========================================================================= */}
            {/* DIFF PREVIEW & SYNC MODAL (Approach A: Staging & Safe Transaction)        */}
            {/* ========================================================================= */}
            {syncModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
                    <div className="bg-white rounded-lg border border-slate-200 shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                                    <Database className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                                        Sync timetable to database
                                    </h3>
                                    <p className="text-xs text-slate-500 font-normal">
                                        Section: <strong className="text-blue-700">{currentSectionName}</strong> &bull; Non-destructive additive sync
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSyncModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                aria-label="Close sync modal"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 overflow-y-auto space-y-4 flex-1">
                            {loadingPreview ? (
                                <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                                    <Loader2 className="h-6 w-6 motion-safe:animate-spin text-blue-700" />
                                    <span className="text-xs font-medium text-slate-600">Analyzing official portal schedule & calculating diff…</span>
                                </div>
                            ) : syncError ? (
                                <div className="p-3 bg-rose-50 border border-rose-200 rounded-md flex items-center gap-2.5 text-rose-800 text-xs font-medium">
                                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                                    <span>{syncError}</span>
                                </div>
                            ) : previewData ? (
                                <>
                                    {/* Success Banner */}
                                    {syncSuccessMsg && (
                                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md flex items-center gap-2 text-emerald-800 text-xs font-medium">
                                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                                            <span>{syncSuccessMsg}</span>
                                        </div>
                                    )}

                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                            <div className="text-xs font-medium text-slate-500">Courses found</div>
                                            <div className="text-lg font-semibold text-slate-900 mt-0.5">{previewData.official_courses_total}</div>
                                            <div className="text-[11px] text-slate-500 font-normal">On official timetable</div>
                                        </div>
                                        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                                            <div className="text-xs font-medium text-emerald-700">Already in database</div>
                                            <div className="text-lg font-semibold text-emerald-800 mt-0.5">{previewData.already_synced_offerings.length}</div>
                                            <div className="text-[11px] text-emerald-700 font-normal">Active & untouched</div>
                                        </div>
                                        <div className={`p-3 rounded-lg border ${previewData.missing_offerings.length > 0 ? "bg-amber-50/70 border-amber-200" : "bg-slate-50 border-slate-200"}`}>
                                            <div className="text-xs font-medium text-slate-500">To add</div>
                                            <div className={`text-lg font-semibold mt-0.5 ${previewData.missing_offerings.length > 0 ? "text-amber-800" : "text-slate-500"}`}>
                                                +{previewData.missing_offerings.length}
                                            </div>
                                            <div className="text-[11px] text-slate-500 font-normal">Missing courses</div>
                                        </div>
                                    </div>

                                    {/* Missing Courses List (To be added) */}
                                    {previewData.missing_offerings.length > 0 ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 px-1">
                                                <span>New courses to be added to local database</span>
                                                <span className="text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                    Additive only
                                                </span>
                                            </div>
                                            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white text-xs">
                                                {previewData.missing_offerings.map((item) => (
                                                    <div key={item.course_code} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50">
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono font-semibold text-blue-700 text-xs">{item.course_code}</span>
                                                                <span className="font-medium text-slate-900 truncate">{item.subject_name}</span>
                                                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${
                                                                    (item.course_type || "").toUpperCase() === "LAB"
                                                                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                                                        : (item.course_type || "").toUpperCase() === "PROJECT"
                                                                        ? "bg-purple-50 text-purple-800 border-purple-200"
                                                                        : (item.course_type || "").toUpperCase() === "TRAINING" || (item.course_type || "").toUpperCase() === "INTERNSHIP"
                                                                        ? "bg-amber-50 text-amber-800 border-amber-200"
                                                                        : (item.course_type || "").toUpperCase() === "SEMINAR"
                                                                        ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                                                                        : "bg-blue-50 text-blue-800 border-blue-200"
                                                                }`}>
                                                                    {item.course_type}
                                                                </span>
                                                            </div>
                                                            <div className="text-[11px] text-slate-500 mt-0.5">
                                                                Faculty: <strong className="text-slate-700 font-medium">{item.teacher_name || "Unassigned"}</strong> &bull; {item.weekly_hours} hrs/week
                                                            </div>
                                                        </div>
                                                        {item.needs_subject_creation && (
                                                            <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                                <Plus className="h-3 w-3" /> New subject
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Auto-enroll toggle / No students banner */}
                                            {previewData.students_in_section > 0 ? (
                                                <label className="flex items-center gap-2.5 p-3 bg-blue-50/50 border border-blue-100 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={autoEnrollStudents}
                                                        onChange={(e) => setAutoEnrollStudents(e.target.checked)}
                                                        className="h-4 w-4 rounded border-slate-300 text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500"
                                                    />
                                                    <div className="text-xs">
                                                        <div className="font-semibold text-slate-900">
                                                            Auto-enroll all {previewData.students_in_section} section students into newly created courses
                                                        </div>
                                                        <div className="text-[11px] text-slate-600">
                                                            Ensures students immediately see the new labs/lectures on their profile & teachers can mark attendance.
                                                        </div>
                                                    </div>
                                                </label>
                                            ) : (
                                                <div className="flex items-start gap-2.5 p-3 bg-amber-50/80 border border-amber-200/80 rounded-lg text-xs text-amber-900">
                                                    <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                                                    <div>
                                                        <div className="font-semibold text-amber-950">
                                                            No students currently enrolled in this section (0 students)
                                                        </div>
                                                        <div className="text-[11px] text-amber-800 mt-0.5">
                                                            Courses will be created and assigned to faculty. No students will be auto-enrolled. You can assign students to this section later via the Students tab or Excel Bulk Import.
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg text-center space-y-1">
                                            <div className="inline-flex p-2 bg-emerald-100 text-emerald-800 rounded-full mb-1">
                                                <Check className="h-4 w-4" />
                                            </div>
                                            <div className="text-sm font-semibold text-slate-900">Section is 100% up-to-date</div>
                                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                                All {previewData.already_synced_offerings.length} courses from the official university timetable already exist in your local database. No changes are required.
                                            </p>
                                        </div>
                                    )}

                                    {/* Already Synced Accordion */}
                                    {previewData.already_synced_offerings.length > 0 && (
                                        <details className="text-xs text-slate-600 border border-slate-200 rounded-lg p-3 bg-slate-50/60">
                                            <summary className="font-semibold cursor-pointer text-slate-800 select-none">
                                                View {previewData.already_synced_offerings.length} already synced courses
                                            </summary>
                                            <div className="mt-2.5 divide-y divide-slate-100 bg-white rounded-lg border border-slate-200 overflow-hidden">
                                                {previewData.already_synced_offerings.map((c) => (
                                                    <div key={c.offering_id} className="p-2.5 flex items-center justify-between text-xs">
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-mono font-medium text-slate-700">{c.course_code}</span> &bull; <span className="font-medium text-slate-900">{c.subject_name}</span>
                                                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${
                                                                    (c.course_type || "").toUpperCase() === "LAB"
                                                                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                                                        : (c.course_type || "").toUpperCase() === "PROJECT"
                                                                        ? "bg-purple-50 text-purple-800 border-purple-200"
                                                                        : (c.course_type || "").toUpperCase() === "TRAINING" || (c.course_type || "").toUpperCase() === "INTERNSHIP"
                                                                        ? "bg-amber-50 text-amber-800 border-amber-200"
                                                                        : (c.course_type || "").toUpperCase() === "SEMINAR"
                                                                        ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                                                                        : "bg-blue-50 text-blue-800 border-blue-200"
                                                                }`}>
                                                                    {c.course_type || "LECTURE"}
                                                                </span>
                                                            </div>
                                                            <span className="text-[11px] text-slate-500 block">Faculty: {c.teacher_name}</span>
                                                        </div>
                                                        <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                            Synced
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </details>
                                    )}
                                </>
                            ) : null}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-normal">
                                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                                <span>Attendance safe: never deletes or overwrites existing history</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setSyncModalOpen(false)}
                                    className="px-3.5 py-1.5 border border-slate-200 text-slate-700 rounded-md text-xs font-medium hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                >
                                    Close
                                </button>
                                {previewData && previewData.has_changes && (
                                    <button
                                        onClick={handleApplySync}
                                        disabled={applyingSync}
                                        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white rounded-md text-xs font-medium shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] cursor-pointer"
                                    >
                                        {applyingSync ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" /> : <Database className="h-4 w-4" />}
                                        <span>{applyingSync ? "Applying sync…" : "Apply additive sync"}</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* SYNC HISTORY & ROLLBACK MODAL (Approach B: 1-Click Rollback)               */}
            {/* ========================================================================= */}
            {historyModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
                    <div className="bg-white rounded-lg border border-slate-200 shadow-lg w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                                    <History className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                                        Timetable sync history & rollback
                                    </h3>
                                    <p className="text-xs text-slate-500 font-normal">
                                        Audit log of past official timetable sync operations
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setHistoryModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                aria-label="Close sync history modal"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-5 overflow-y-auto space-y-3 flex-1">
                            {historyError && (
                                <div className="p-3 bg-rose-50 border border-rose-200 rounded-md flex items-center gap-2.5 text-rose-800 text-xs font-medium">
                                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                                    <span>{historyError}</span>
                                </div>
                            )}

                            {loadingHistory ? (
                                <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
                                    <Loader2 className="h-6 w-6 motion-safe:animate-spin text-slate-600" />
                                    <span className="text-xs font-medium text-slate-600">Loading sync audit logs…</span>
                                </div>
                            ) : syncHistory.length === 0 ? (
                                <div className="py-12 text-center text-slate-400 space-y-1">
                                    <History className="h-8 w-8 mx-auto text-slate-400" />
                                    <div className="text-sm font-semibold text-slate-700">No sync history yet</div>
                                    <p className="text-xs text-slate-500 print:hidden">When you sync a section’s timetable to the database, logs will appear here.</p>
                                </div>
                            ) : (
                                syncHistory.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`p-3.5 rounded-lg border transition-colors ${
                                            item.is_rolled_back
                                                ? "bg-slate-50 border-slate-200 opacity-75"
                                                : "bg-white border-slate-200 hover:border-slate-300"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="space-y-1 print:space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-slate-900 text-xs">
                                                        {item.section_name || "Section Sync"}
                                                    </span>
                                                    {item.is_rolled_back ? (
                                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-700">
                                                            Rolled back
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-600 font-normal">
                                                    {item.summary}
                                                </p>
                                                <div className="text-[11px] text-slate-500 flex items-center gap-2.5">
                                                    <span>By: <strong className="font-medium text-slate-700">{item.admin_name}</strong></span>
                                                    <span>&bull;</span>
                                                    <span>{item.created_at ? new Date(item.created_at).toLocaleString() : "Recently"}</span>
                                                    {item.is_rolled_back && item.rolled_back_at && (
                                                        <>
                                                            <span>&bull;</span>
                                                            <span className="text-rose-700">Reverted at {new Date(item.rolled_back_at).toLocaleTimeString()}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {!item.is_rolled_back && (
                                                <button
                                                    onClick={() => handleRollback(item.id)}
                                                    disabled={rollingBackId === item.id}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-md text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 active:scale-[0.98]"
                                                    title="Rollback this sync"
                                                >
                                                    {rollingBackId === item.id ? (
                                                        <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" />
                                                    ) : (
                                                        <Undo2 className="h-3.5 w-3.5" />
                                                    )}
                                                    <span>Rollback</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
                            <button
                                onClick={() => setHistoryModalOpen(false)}
                                className="px-3.5 py-1.5 border border-slate-200 text-slate-700 rounded-md text-xs font-medium hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
