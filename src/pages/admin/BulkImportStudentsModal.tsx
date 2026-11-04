// src/pages/admin/BulkImportStudentsModal.tsx
import { useState, useMemo, useEffect, useRef } from "react";
import {
    X,
    Upload,
    FileSpreadsheet,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Sparkles,
    Check,
    Search,
    ClipboardPaste,
} from "lucide-react";
import { FormSelect } from "../../components/ui/form-select";
import type { SelectOption } from "../../components/ui/form-select";
import { parseStudentCsv, parseStudentExcel } from "../../utils/csvParser";
import type { ParsedCsvStudent, CsvPreambleHints } from "../../utils/csvParser";
import {
    bulkImportStudents,
    listSchools,
    listDepartments,
    listProgrammes,
    listBatches,
    listSections,
    listOfferings,
} from "../../api/admin";
import type {
    School,
    Department,
    Programme,
    Batch,
    Section,
    Offering,
    StudentBulkImportResponse,
} from "../../api/admin";

interface BulkImportStudentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function BulkImportStudentsModal({
    isOpen,
    onClose,
    onSuccess,
}: BulkImportStudentsModalProps) {
    // Mode: "upload" or "paste"
    const [inputMode, setInputMode] = useState<"upload" | "paste">("upload");
    const [pastedText, setPastedText] = useState("");
    const [fileName, setFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Parsing state
    const [rawCsvText, setRawCsvText] = useState<string>("");
    const [parsedStudents, setParsedStudents] = useState<ParsedCsvStudent[]>([]);
    const [detectedHints, setDetectedHints] = useState<CsvPreambleHints | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);
    const [selectedStudentRolls, setSelectedStudentRolls] = useState<Set<string>>(new Set());
    const [previewSearch, setPreviewSearch] = useState<string>("");

    // Academic Metadata Lists
    const [schools, setSchools] = useState<School[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [programmes, setProgrammes] = useState<Programme[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [offerings, setOfferings] = useState<Offering[]>([]);

    // Selected Academic Values
    const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
    const [selectedDeptId, setSelectedDeptId] = useState<string>("");
    const [selectedProgId, setSelectedProgId] = useState<string>("");
    const [selectedBatchId, setSelectedBatchId] = useState<string>("");
    const [selectedSectionId, setSelectedSectionId] = useState<string>("");
    const [selectedOfferingIds, setSelectedOfferingIds] = useState<number[]>([]);
    const [autoEnrollSection, setAutoEnrollSection] = useState<boolean>(false);

    // Submission & Results
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<StudentBulkImportResponse | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Initial metadata loading
    useEffect(() => {
        if (!isOpen) return;
        const loadInitialData = async () => {
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
                console.error("Failed to load metadata:", err);
            }
        };
        loadInitialData();
    }, [isOpen]);

    // Load departments when school changes
    useEffect(() => {
        if (!isOpen) return;
        const loadDepartments = async () => {
            if (!selectedSchoolId) {
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
    }, [selectedSchoolId, schools, isOpen]);

    // Load programmes when department changes
    useEffect(() => {
        if (!isOpen) return;
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
    }, [selectedDeptId, departments, isOpen]);

    // Smart auto-selection based on detected hints
    const applyHints = (h: CsvPreambleHints) => {
        if (h.school_hint && schools.length > 0) {
            const matchedSchool = schools.find((s) =>
                s.code.toUpperCase().includes(h.school_hint!.toUpperCase()) ||
                s.name.toUpperCase().includes(h.school_hint!.toUpperCase())
            );
            if (matchedSchool) {
                setSelectedSchoolId(String(matchedSchool.id));
            }
        }

        if (h.batch_hint && batches.length > 0) {
            const matchedBatch = batches.find((b) =>
                b.name.includes(h.batch_hint!) ||
                `${b.start_year}-${b.expected_end_year}`.includes(h.batch_hint!)
            );
            if (matchedBatch) {
                setSelectedBatchId(String(matchedBatch.id));
            }
        }

        if (h.section_hint && sections.length > 0) {
            const matchedSec = sections.find((s) =>
                s.name.toUpperCase().includes(h.section_hint!.toUpperCase())
            );
            if (matchedSec) {
                setSelectedSectionId(String(matchedSec.id));
            }
        }
    };

    // Parse CSV whenever rawCsvText changes
    useEffect(() => {
        if (!rawCsvText.trim()) {
            setParsedStudents([]);
            setDetectedHints(null);
            setParseError(null);
            setSelectedStudentRolls(new Set());
            return;
        }

        try {
            const parsed = parseStudentCsv(rawCsvText);
            setParsedStudents(parsed.students);
            setDetectedHints(parsed.hints);
            setParseError(null);
            setSelectedStudentRolls(new Set(parsed.students.map((s) => s.roll_number)));
            applyHints(parsed.hints);
        } catch (err) {
            setParsedStudents([]);
            setDetectedHints(null);
            setParseError(err instanceof Error ? err.message : "Failed to parse CSV file");
        }
    }, [rawCsvText, schools, batches, sections]);

    // Handle File Upload (.xlsx, .xls, .csv, .txt)
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        const isExcel = /\.(xlsx|xls)$/i.test(file.name);

        const reader = new FileReader();
        if (isExcel) {
            reader.onload = (event) => {
                const buffer = event.target?.result as ArrayBuffer;
                try {
                    const parsed = parseStudentExcel(buffer);
                    setParsedStudents(parsed.students);
                    setDetectedHints(parsed.hints);
                    setParseError(null);
                    setSelectedStudentRolls(new Set(parsed.students.map((s) => s.roll_number)));
                    applyHints(parsed.hints);
                } catch (err) {
                    setParsedStudents([]);
                    setDetectedHints(null);
                    setParseError(err instanceof Error ? err.message : "Failed to parse Excel file");
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            reader.onload = (event) => {
                const text = event.target?.result as string;
                setRawCsvText(text || "");
            };
            reader.readAsText(file);
        }
    };

    // Handle Text Paste Apply
    const handleApplyPaste = () => {
        setRawCsvText(pastedText);
        setFileName("pasted_data.csv");
    };

    // Filtered Preview Students
    const filteredPreviewStudents = useMemo(() => {
        if (!previewSearch.trim()) return parsedStudents;
        const q = previewSearch.toLowerCase();
        return parsedStudents.filter(
            (s) =>
                s.roll_number.toLowerCase().includes(q) ||
                s.full_name.toLowerCase().includes(q) ||
                s.email.toLowerCase().includes(q)
        );
    }, [parsedStudents, previewSearch]);

    // Toggle single student
    const toggleStudentRoll = (roll: string) => {
        setSelectedStudentRolls((prev) => {
            const next = new Set(prev);
            if (next.has(roll)) next.delete(roll);
            else next.add(roll);
            return next;
        });
    };

    // Toggle all filtered
    const toggleSelectAll = () => {
        if (selectedStudentRolls.size === parsedStudents.length) {
            setSelectedStudentRolls(new Set());
        } else {
            setSelectedStudentRolls(new Set(parsedStudents.map((s) => s.roll_number)));
        }
    };

    // Toggle course offering enrollment
    const toggleOffering = (offId: number) => {
        setSelectedOfferingIds((prev) =>
            prev.includes(offId) ? prev.filter((id) => id !== offId) : [...prev, offId]
        );
    };

    // Filter available offerings by selected section if section is chosen
    const availableOfferings = useMemo(() => {
        if (!selectedSectionId) return offerings;
        const filtered = offerings.filter((o) => String(o.section_id) === selectedSectionId);
        return filtered.length > 0 ? filtered : offerings;
    }, [offerings, selectedSectionId]);

    // Dropdown options
    const schoolOptions: SelectOption[] = useMemo(() => [
        { value: "", label: "Select School..." },
        ...schools.map((s) => ({ value: String(s.id), label: `${s.code} - ${s.name}` })),
    ], [schools]);

    const deptOptions: SelectOption[] = useMemo(() => [
        { value: "", label: "Select Department..." },
        ...departments.map((d) => ({ value: String(d.id), label: `${d.code} - ${d.name}` })),
    ], [departments]);

    const progOptions: SelectOption[] = useMemo(() => [
        { value: "", label: "Select Programme..." },
        ...programmes.map((p) => ({ value: String(p.id), label: `${p.code} - ${p.name}` })),
    ], [programmes]);

    const batchOptions: SelectOption[] = useMemo(() => [
        { value: "", label: "Select Target Batch * (Required)" },
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
            { value: "", label: "Select Section (Optional)" },
            ...sorted.map((s) => {
                const count = s.enrolled_students_count ?? 0;
                return {
                    value: String(s.id),
                    label: count > 0 ? `⭐ ${s.name} (${count} students)` : s.name,
                };
            }),
        ];
    }, [sections]);

    // Handle Submit
    const handleSubmit = async () => {
        setErrorMsg(null);
        if (!selectedBatchId) {
            setErrorMsg("Please select a target Batch for these students.");
            return;
        }

        const studentsToImport = parsedStudents
            .filter((s) => selectedStudentRolls.has(s.roll_number))
            .map((s) => ({
                roll_number: s.roll_number,
                full_name: s.full_name,
                email: s.email,
            }));

        if (studentsToImport.length === 0) {
            setErrorMsg("Please select at least one student from the preview list.");
            return;
        }

        const offeringIdsToSubmit =
            selectedOfferingIds.length > 0
                ? selectedOfferingIds
                : autoEnrollSection && selectedSectionId
                ? availableOfferings.map((o) => o.id)
                : null;

        setSubmitting(true);
        try {
            const resp = await bulkImportStudents({
                batch_id: Number(selectedBatchId),
                section_id: selectedSectionId ? Number(selectedSectionId) : null,
                course_offering_ids: offeringIdsToSubmit,
                students: studentsToImport,
            });
            setResult(resp);
            onSuccess();
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Failed to import students");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            <div className="bg-white rounded-lg border border-slate-200 shadow-lg max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900">
                {/* Modal Header */}
                <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                            <FileSpreadsheet className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-sm sm:text-base font-semibold text-slate-900">Bulk import & enroll students</h2>
                            <p className="text-xs font-normal text-slate-500">
                                Import student roster from university CSV, map academic batch, and enroll into classes.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] disabled:opacity-50"
                        aria-label="Close dialog"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-5 overflow-y-auto space-y-4 flex-1">
                    {/* Result Success Banner */}
                    {result ? (
                        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-lg text-center space-y-3">
                            <div className="inline-flex p-2 bg-emerald-100 text-emerald-800 rounded-full">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-base font-semibold text-emerald-950">Import completed successfully</h3>
                                <p className="text-xs font-normal text-emerald-800 mt-0.5">{result.message}</p>
                            </div>

                            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-1">
                                <div className="p-2.5 bg-white rounded-md border border-emerald-200">
                                    <div className="text-xs font-medium text-slate-500">Created</div>
                                    <div className="text-base font-semibold text-emerald-700">{result.created_count}</div>
                                </div>
                                <div className="p-2.5 bg-white rounded-md border border-emerald-200">
                                    <div className="text-xs font-medium text-slate-500">Updated</div>
                                    <div className="text-base font-semibold text-blue-700">{result.updated_count}</div>
                                </div>
                                <div className="p-2.5 bg-white rounded-md border border-emerald-200">
                                    <div className="text-xs font-medium text-slate-500">Enrolled</div>
                                    <div className="text-base font-semibold text-indigo-700">{result.enrolled_count}</div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-medium text-xs rounded-md shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98]"
                                >
                                    Done & view students
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Error Alert */}
                            {errorMsg && (
                                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-medium flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                                        <span>{errorMsg}</span>
                                    </div>
                                    <button type="button" onClick={() => setErrorMsg(null)} className="p-1 hover:bg-rose-100 rounded">
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            )}

                            {/* Input Mode Selector */}
                            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                                <button
                                    type="button"
                                    onClick={() => setInputMode("upload")}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] ${
                                        inputMode === "upload"
                                            ? "bg-blue-700 text-white shadow-xs"
                                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                                    }`}
                                >
                                    <Upload className="h-3.5 w-3.5" />
                                    <span>Upload Excel / CSV</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setInputMode("paste")}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] ${
                                        inputMode === "paste"
                                            ? "bg-blue-700 text-white shadow-xs"
                                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                                    }`}
                                >
                                    <ClipboardPaste className="h-3.5 w-3.5" />
                                    <span>Paste data / text</span>
                                </button>
                            </div>

                            {/* Upload / Paste Area */}
                            {inputMode === "upload" ? (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/20 rounded-lg p-5 text-center cursor-pointer transition-colors"
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx,.xls,.csv,.txt"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <div className="mx-auto w-9 h-9 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mb-1.5 border border-blue-200">
                                        <Upload className="h-4 w-4" />
                                    </div>
                                    <div className="text-xs font-semibold text-slate-700">
                                        {fileName ? (
                                            <span className="text-blue-700 font-semibold">{fileName}</span>
                                        ) : (
                                            "Click or drag university Excel (.xlsx / .xls) or CSV file here"
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        Supports .xlsx, .xls, .csv class attendance sheets, roll lists, and registration exports.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <textarea
                                        value={pastedText}
                                        onChange={(e) => setPastedText(e.target.value)}
                                        rows={4}
                                        placeholder="Paste CSV rows here (including header like S.N,RollNumber,Name,Email…)"
                                        className="w-full p-2.5 bg-white border border-slate-200 rounded-md text-xs font-mono font-normal outline-none focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
                                    />
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={handleApplyPaste}
                                            disabled={!pastedText.trim()}
                                            className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98]"
                                        >
                                            Parse text
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Parse Error */}
                            {parseError && (
                                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-xs font-medium flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                                    <span>{parseError}</span>
                                </div>
                            )}

                            {/* Detected Preamble Hints Banner */}
                            {detectedHints && (
                                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center gap-2 text-xs font-medium text-blue-900">
                                    <Sparkles className="h-4 w-4 text-blue-700 shrink-0" />
                                    <span>
                                        Detected hints from CSV:&nbsp;
                                        {detectedHints.school_hint && <strong className="text-blue-800 font-semibold">[{detectedHints.school_hint}] </strong>}
                                        {detectedHints.programme_hint && <strong className="text-blue-800 font-semibold">[{detectedHints.programme_hint}] </strong>}
                                        {detectedHints.batch_hint && <strong className="text-blue-800 font-semibold">[Batch {detectedHints.batch_hint}] </strong>}
                                        {detectedHints.section_hint && <strong className="text-blue-800 font-semibold">[Section {detectedHints.section_hint}]</strong>}
                                    </span>
                                </div>
                            )}

                            {/* Academic Hierarchy Target Selection */}
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                                <div className="text-xs font-semibold text-slate-800">
                                    Target academic destination
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            School
                                        </label>
                                        <FormSelect
                                            value={selectedSchoolId}
                                            onChange={(val) => {
                                                setSelectedSchoolId(val);
                                                setSelectedDeptId("");
                                                setSelectedProgId("");
                                            }}
                                            options={schoolOptions}
                                            placeholder="Select school…"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            Department
                                        </label>
                                        <FormSelect
                                            value={selectedDeptId}
                                            onChange={(val) => {
                                                setSelectedDeptId(val);
                                                setSelectedProgId("");
                                            }}
                                            options={deptOptions}
                                            placeholder="Select department…"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            Programme
                                        </label>
                                        <FormSelect
                                            value={selectedProgId}
                                            onChange={setSelectedProgId}
                                            options={progOptions}
                                            placeholder="Select programme…"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-blue-700 mb-1">
                                            Batch * (Required)
                                        </label>
                                        <FormSelect
                                            value={selectedBatchId}
                                            onChange={setSelectedBatchId}
                                            options={batchOptions}
                                            placeholder="Select target batch…"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200/60">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            Target section (optional)
                                        </label>
                                        <FormSelect
                                            value={selectedSectionId}
                                            onChange={setSelectedSectionId}
                                            options={sectionOptions}
                                            placeholder="Select section (optional)…"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            Enroll in course offerings (optional)
                                        </label>
                                        <div className="max-h-24 overflow-y-auto bg-white border border-slate-200 rounded-md p-2 space-y-1">
                                            {availableOfferings.length === 0 ? (
                                                <div className="text-[11px] text-slate-400">No offerings available</div>
                                            ) : (
                                                availableOfferings.slice(0, 10).map((off) => (
                                                    <label
                                                        key={off.id}
                                                        className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-50 p-1 rounded"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedOfferingIds.includes(off.id)}
                                                            onChange={() => toggleOffering(off.id)}
                                                            className="rounded text-blue-700"
                                                        />
                                                        <span className="truncate">
                                                            {off.subject_code ? `${off.subject_code} - ` : ""}
                                                            {off.subject_name} ({off.section_name})
                                                        </span>
                                                    </label>
                                                ))
                                            )}
                                        </div>
                                        {selectedSectionId && (
                                            <label className="flex items-center gap-2 mt-2 text-xs font-medium text-slate-600 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={autoEnrollSection}
                                                    onChange={(e) => setAutoEnrollSection(e.target.checked)}
                                                    className="rounded text-blue-700"
                                                />
                                                <span>Auto-enroll in all courses of selected section</span>
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Parsed Students Live Preview */}
                            {parsedStudents.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-slate-800">
                                                Preview parsed students
                                            </span>
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold text-xs">
                                                {selectedStudentRolls.size} of {parsedStudents.length} selected
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                                                <input
                                                    type="text"
                                                    value={previewSearch}
                                                    onChange={(e) => setPreviewSearch(e.target.value)}
                                                    placeholder="Filter preview…"
                                                    className="pl-7 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 w-36 sm:w-48 font-semibold"
                                                />
                                            </div>

                                            <button
                                                type="button"
                                                onClick={toggleSelectAll}
                                                className="px-2.5 py-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98]"
                                            >
                                                {selectedStudentRolls.size === parsedStudents.length ? "Deselect all" : "Select all"}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Preview Table */}
                                    <div className="border border-slate-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-xs font-semibold text-slate-700">
                                                <tr>
                                                    <th className="py-2 px-3 w-8">#</th>
                                                    <th className="py-2 px-3">Roll number</th>
                                                    <th className="py-2 px-3">Student name</th>
                                                    <th className="py-2 px-3">Email address</th>
                                                    <th className="py-2 px-3">Mobile</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 font-medium">
                                                {filteredPreviewStudents.map((student) => {
                                                    const isChecked = selectedStudentRolls.has(student.roll_number);
                                                    return (
                                                        <tr
                                                            key={student.roll_number}
                                                            onClick={() => toggleStudentRoll(student.roll_number)}
                                                            className={`cursor-pointer transition-colors ${
                                                                isChecked ? "bg-indigo-50/30 hover:bg-indigo-50/60" : "hover:bg-slate-50 opacity-60"
                                                            }`}
                                                        >
                                                            <td className="py-2 px-3">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onChange={() => {}} // handled by row click
                                                                    className="rounded text-blue-700"
                                                                />
                                                            </td>
                                                            <td className="py-2 px-3 font-mono font-bold text-slate-800">
                                                                {student.roll_number}
                                                            </td>
                                                            <td className="py-2 px-3 font-bold text-slate-700">
                                                                {student.full_name}
                                                            </td>
                                                            <td className="py-2 px-3 text-slate-500 text-[11px]">
                                                                <span>{student.email}</span>
                                                                {!student.original_email && (
                                                                    <span className="ml-1 text-[9px] font-bold text-amber-600 bg-amber-50 px-1 py-0.2 rounded">
                                                                        Auto-gen
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-2 px-3 text-slate-400 text-[11px]">
                                                                {student.mobile || "—"}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Modal Footer */}
                {!result && (
                    <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting || parsedStudents.length === 0 || selectedStudentRolls.size === 0 || !selectedBatchId}
                            className="whitespace-nowrap inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-medium text-xs rounded-md shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98]"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" />
                                    <span>Importing students…</span>
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4" />
                                    <span>Import {selectedStudentRolls.size} students</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
