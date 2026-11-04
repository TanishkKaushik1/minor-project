// src/pages/admin/RegisterUserModal.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, Mail, Lock, User, Loader2, AlertCircle, Check } from "lucide-react";
import { createUser, listDepartments, listSections, listBatches } from "../../api/admin";
import type { Department, Section, Batch } from "../../api/admin";
import { FormSelect } from "../../components/ui/form-select";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function RegisterUserModal({ isOpen, onClose, onSuccess }: Props) {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("TEACHER");
    const [additionalRoles, setAdditionalRoles] = useState<string[]>([]);
    const [departmentId, setDepartmentId] = useState<number | "">("");
    const [sectionId, setSectionId] = useState<number | "">("");
    const [batchId, setBatchId] = useState<number | "">("");
    const [rollNumber, setRollNumber] = useState("");

    const [departments, setDepartments] = useState<Department[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            listDepartments().then(setDepartments).catch(() => {});
            listSections().then(setSections).catch(() => {});
            listBatches().then(setBatches).catch(() => {});
        }
    }, [isOpen]);

    const toggleAdditionalRole = (roleKey: string) => {
        setAdditionalRoles((prev) =>
            prev.includes(roleKey) ? prev.filter((r) => r !== roleKey) : [...prev, roleKey]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            let scope_type = "UNIVERSITY";
            let scope_id: number | null = null;

            const isHod = role === "HOD" || additionalRoles.includes("HOD");
            const isCoord = role === "COORDINATOR" || additionalRoles.includes("COORDINATOR");

            if (role === "HOD") {
                scope_type = "DEPARTMENT";
                scope_id = departmentId ? Number(departmentId) : null;
                if (!scope_id) throw new Error("Please select a department scope for HOD");
            } else if (role === "COORDINATOR") {
                scope_type = "SECTION";
                scope_id = sectionId ? Number(sectionId) : null;
                if (!scope_id) throw new Error("Please select a section scope for Coordinator");
            } else if (role === "TEACHER") {
                scope_type = "ASSIGNMENT";
                scope_id = null;
            } else if (role === "DEAN") {
                scope_type = "SCHOOL";
                scope_id = null;
            } else if (role === "STUDENT") {
                scope_type = "UNIVERSITY";
                scope_id = null;
                if (!rollNumber) throw new Error("Roll number is required for students");
                if (!batchId) throw new Error("Batch is required for students");
            }

            if (isHod && !departmentId) {
                throw new Error("Please select a department scope for the HOD role");
            }
            if (isCoord && !sectionId) {
                throw new Error("Please select a section scope for the Coordinator role");
            }

            const allSelectedRoles = Array.from(new Set([role, ...(role !== "STUDENT" ? additionalRoles : [])]));
            const roleAssignments = allSelectedRoles.map((r) => {
                if (r === "HOD") {
                    return { role: "HOD", scope_type: "DEPARTMENT", scope_id: Number(departmentId) };
                }
                if (r === "COORDINATOR") {
                    return { role: "COORDINATOR", scope_type: "SECTION", scope_id: Number(sectionId) };
                }
                if (r === "DEAN") {
                    return { role: "DEAN", scope_type: "SCHOOL", scope_id: null };
                }
                if (r === "ADMIN") {
                    return { role: "ADMIN", scope_type: "UNIVERSITY", scope_id: null };
                }
                if (r === "STUDENT") {
                    return { role: "STUDENT", scope_type: "UNIVERSITY", scope_id: null };
                }
                return { role: "TEACHER", scope_type: "ASSIGNMENT", scope_id: null };
            });

            await createUser({
                email,
                full_name: fullName,
                password,
                role,
                roles: allSelectedRoles,
                role_assignments: roleAssignments,
                scope_type,
                scope_id,
                roll_number: role === "STUDENT" ? rollNumber : null,
                batch_id: role === "STUDENT" && batchId ? Number(batchId) : null,
            });

            onSuccess();
            onClose();
            // Reset form
            setFullName("");
            setEmail("");
            setPassword("");
            setRole("TEACHER");
            setAdditionalRoles([]);
            setDepartmentId("");
            setSectionId("");
            setBatchId("");
            setRollNumber("");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to register user");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="bg-white w-full max-w-lg rounded-lg border border-slate-200 shadow-lg p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
                            <div>
                                <h3 className="text-sm sm:text-base font-semibold text-slate-900">Provision user</h3>
                                <p className="text-xs text-slate-500 font-normal">Create a new university identity</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] disabled:opacity-50"
                                aria-label="Close dialog"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {error && (
                            <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-md text-xs font-medium flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-3.5">
                            <div>
                                <label className="text-xs font-medium text-slate-700 mb-1 block">
                                    Full name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Dr. John Doe"
                                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-md text-xs font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-700 mb-1 block">
                                    University email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="johndoe@gbu.ac.in"
                                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-md text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-700 mb-1 block">
                                    Initial password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter initial password"
                                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-md text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Primary Role Selector */}
                            <div>
                                <label className="text-xs font-medium text-slate-700 mb-1 block">
                                    Primary system role
                                </label>
                                <FormSelect
                                    value={role}
                                    onChange={(val) => {
                                        setRole(val);
                                        // Clear conflicting additional roles
                                        setAdditionalRoles((prev) => prev.filter((r) => r !== val));
                                    }}
                                    options={[
                                        { value: "TEACHER", label: "Teacher (Faculty Member)" },
                                        { value: "COORDINATOR", label: "Coordinator (Section Coordinator)" },
                                        { value: "HOD", label: "HOD (Head of Department)" },
                                        { value: "DEAN", label: "Dean (School Level)" },
                                        { value: "ADMIN", label: "Admin (System Administrator)" },
                                        { value: "STUDENT", label: "Student (Class Attendee)" },
                                    ]}
                                    placeholder="Select role…"
                                />
                            </div>

                            {/* Multi-role Additional Assignment (for staff/faculty) */}
                            {role !== "STUDENT" && role !== "ADMIN" && (
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-medium text-slate-700 block">
                                            Additional roles (multiple roles)
                                        </label>
                                        <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                            Optional
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-normal">
                                        Staff can hold multiple roles simultaneously (e.g. Teacher + Coordinator or HOD + Teacher).
                                    </p>

                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {role !== "TEACHER" && (
                                            <button
                                                type="button"
                                                onClick={() => toggleAdditionalRole("TEACHER")}
                                                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] ${
                                                    additionalRoles.includes("TEACHER")
                                                        ? "bg-blue-700 text-white border-blue-700"
                                                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                                }`}
                                            >
                                                <Check className={`h-3 w-3 stroke-[3] ${additionalRoles.includes("TEACHER") ? "opacity-100" : "opacity-0"}`} />
                                                <span>+ Teacher</span>
                                            </button>
                                        )}

                                        {role !== "COORDINATOR" && (
                                            <button
                                                type="button"
                                                onClick={() => toggleAdditionalRole("COORDINATOR")}
                                                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] ${
                                                    additionalRoles.includes("COORDINATOR")
                                                        ? "bg-blue-700 text-white border-blue-700"
                                                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                                }`}
                                            >
                                                <Check className={`h-3 w-3 stroke-[3] ${additionalRoles.includes("COORDINATOR") ? "opacity-100" : "opacity-0"}`} />
                                                <span>+ Coordinator</span>
                                            </button>
                                        )}

                                        {role !== "HOD" && (
                                            <button
                                                type="button"
                                                onClick={() => toggleAdditionalRole("HOD")}
                                                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] ${
                                                    additionalRoles.includes("HOD")
                                                        ? "bg-blue-700 text-white border-blue-700"
                                                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                                }`}
                                            >
                                                <Check className={`h-3 w-3 stroke-[3] ${additionalRoles.includes("HOD") ? "opacity-100" : "opacity-0"}`} />
                                                <span>+ HOD</span>
                                            </button>
                                        )}

                                        {role !== "DEAN" && (
                                            <button
                                                type="button"
                                                onClick={() => toggleAdditionalRole("DEAN")}
                                                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] ${
                                                    additionalRoles.includes("DEAN")
                                                        ? "bg-blue-700 text-white border-blue-700"
                                                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                                }`}
                                            >
                                                <Check className={`h-3 w-3 stroke-[3] ${additionalRoles.includes("DEAN") ? "opacity-100" : "opacity-0"}`} />
                                                <span>+ Dean</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {(role === "HOD" || additionalRoles.includes("HOD")) && (
                                <div>
                                    <label className="text-xs font-medium text-slate-700 mb-1 block">
                                        Assigned department scope (for HOD) <span className="text-rose-600">*</span>
                                    </label>
                                    <FormSelect
                                        value={departmentId}
                                        onChange={(val) => setDepartmentId(val ? Number(val) : "")}
                                        options={departments.map((d) => ({
                                            value: d.id,
                                            label: `${d.code} (${d.name})`
                                        }))}
                                        placeholder="Select department…"
                                    />
                                </div>
                            )}

                            {(role === "COORDINATOR" || additionalRoles.includes("COORDINATOR")) && (
                                <div>
                                    <label className="text-xs font-medium text-slate-700 mb-1 block">
                                        Assigned section scope (for Coordinator) <span className="text-rose-600">*</span>
                                    </label>
                                    <FormSelect
                                        value={sectionId ? String(sectionId) : ""}
                                        onChange={(val) => setSectionId(val ? Number(val) : "")}
                                        options={sections.map((s) => ({
                                            value: s.id,
                                            label: `${s.name}${s.batch_name ? ` (${s.batch_name})` : ""}${s.programme_code ? ` (${s.programme_code})` : ""}`
                                        }))}
                                        placeholder="Select section…"
                                    />
                                </div>
                            )}

                            {role === "STUDENT" && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-slate-700 mb-1 block">
                                            Roll number <span className="text-rose-600">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={rollNumber}
                                            onChange={(e) => setRollNumber(e.target.value)}
                                            placeholder="235/ICS/006"
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs font-mono font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-700 mb-1 block">
                                            Assigned batch <span className="text-rose-600">*</span>
                                        </label>
                                        <FormSelect
                                            value={batchId ? String(batchId) : ""}
                                            onChange={(val) => setBatchId(val ? Number(val) : "")}
                                            options={batches.map((b) => ({
                                                value: b.id,
                                                label: `${b.name} (${b.start_year})`
                                            }))}
                                            placeholder="Select batch…"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-9 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-medium text-xs rounded-md transition-colors shadow-xs active:scale-[0.98] flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                >
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 motion-safe:animate-spin" />
                                    ) : (
                                        <>
                                            <UserPlus className="w-4 h-4" />
                                            <span>Provision user account</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
