// src/components/EditUserRolesModal.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Shield,
    Check,
    Loader2,
    AlertCircle,
    Building2,
    GraduationCap,
    UserCheck,
    Crown,
    Users
} from "lucide-react";
import {
    listDepartments,
    listSchools,
    listSections,
    updateUserRoles
} from "../api/admin";
import type {
    User,
    Department,
    School,
    Section,
    RoleAssignmentPayload
} from "../api/admin";
import { FormSelect } from "./ui/form-select";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: User | null;
}

interface RoleDef {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    badgeStyle: string;
    icon: typeof Shield;
}

const ROLES_LIST: RoleDef[] = [
    {
        id: "TEACHER",
        title: "Teacher",
        subtitle: "Faculty Member",
        description: "Can be allotted to subject offerings, conduct classroom sessions, mark attendance, and view schedules.",
        badgeStyle: "bg-blue-50 text-blue-700 border-blue-200",
        icon: GraduationCap,
    },
    {
        id: "COORDINATOR",
        title: "Coordinator",
        subtitle: "Section Coordinator",
        description: "Manages class timetable matrix, teacher allotments, and bulk student course enrollments for the assigned section.",
        badgeStyle: "bg-purple-50 text-purple-700 border-purple-200",
        icon: UserCheck,
    },
    {
        id: "HOD",
        title: "Head of Department (HOD)",
        subtitle: "Department Leadership",
        description: "Oversees department faculty, academic setup, student leave approvals, and corrections queue.",
        badgeStyle: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: Building2,
    },
    {
        id: "DEAN",
        title: "Dean",
        subtitle: "School Oversight",
        description: "High-level overview and academic reports across all departments in the university school.",
        badgeStyle: "bg-amber-50 text-amber-700 border-amber-200",
        icon: Crown,
    },
    {
        id: "ADMIN",
        title: "System Administrator",
        subtitle: "Full Access",
        description: "Full institutional control over system settings, audit logs, and user onboarding.",
        badgeStyle: "bg-rose-50 text-rose-700 border-rose-200",
        icon: Shield,
    },
    {
        id: "STUDENT",
        title: "Student",
        subtitle: "Class Attendee",
        description: "Attends scheduled lectures and tracks personal subject attendance records.",
        badgeStyle: "bg-slate-100 text-slate-700 border-slate-200",
        icon: Users,
    },
];

export default function EditUserRolesModal({ isOpen, onClose, onSuccess, user }: Props) {
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [departmentId, setDepartmentId] = useState<number | "">("");
    const [sectionId, setSectionId] = useState<number | "">("");
    const [schoolId, setSchoolId] = useState<number | "">("");

    const [departments, setDepartments] = useState<Department[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [schools, setSchools] = useState<School[]>([]);

    const [loadingData, setLoadingData] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen && user) {
            setError("");
            setLoadingData(true);

            // Populate current roles
            let initialRoles: string[] = [];
            if (user.roles && user.roles.length > 0) {
                initialRoles = [...user.roles];
            } else if (user.role_assignments && user.role_assignments.length > 0) {
                initialRoles = user.role_assignments.map((a) => a.role);
            } else if (user.role) {
                initialRoles = [user.role];
            } else {
                initialRoles = ["TEACHER"];
            }
            setSelectedRoles(initialRoles);

            // Populate scopes if present
            let deptScope: number | "" = "";
            let secScope: number | "" = "";
            let schScope: number | "" = "";

            if (user.role_assignments && user.role_assignments.length > 0) {
                const hodAssignment = user.role_assignments.find((a) => a.role === "HOD");
                if (hodAssignment?.scope_id) deptScope = hodAssignment.scope_id;

                const coordAssignment = user.role_assignments.find((a) => a.role === "COORDINATOR");
                if (coordAssignment?.scope_id) secScope = coordAssignment.scope_id;

                const deanAssignment = user.role_assignments.find((a) => a.role === "DEAN");
                if (deanAssignment?.scope_id) schScope = deanAssignment.scope_id;
            }

            if (!deptScope && user.scope_type === "DEPARTMENT" && user.scope_id) {
                deptScope = user.scope_id;
            }
            if (!secScope && (user.scope_type === "SECTION" || user.scope_type === "PROGRAM") && user.scope_id) {
                secScope = user.scope_id;
            }
            if (!schScope && user.scope_type === "SCHOOL" && user.scope_id) {
                schScope = user.scope_id;
            }

            setDepartmentId(deptScope);
            setSectionId(secScope);
            setSchoolId(schScope);

            // Load lookup scopes
            Promise.all([
                listDepartments().then(setDepartments).catch(() => {}),
                listSections().then(setSections).catch(() => {}),
                listSchools().then(setSchools).catch(() => {}),
            ]).finally(() => {
                setLoadingData(false);
            });
        }
    }, [isOpen, user]);

    const toggleRole = (roleId: string) => {
        setSelectedRoles((prev) => {
            if (prev.includes(roleId)) {
                // Must retain at least one role
                if (prev.length === 1) return prev;
                return prev.filter((r) => r !== roleId);
            } else {
                return [...prev, roleId];
            }
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setError("");

        if (selectedRoles.length === 0) {
            setError("At least one role must be assigned to the user.");
            return;
        }

        if (selectedRoles.includes("HOD") && !departmentId) {
            setError("Please select a department scope for the HOD role.");
            return;
        }

        if (selectedRoles.includes("COORDINATOR") && !sectionId) {
            setError("Please select a section scope for the Coordinator role.");
            return;
        }

        setSaving(true);
        try {
            const payload: RoleAssignmentPayload[] = selectedRoles.map((roleId) => {
                if (roleId === "HOD") {
                    return {
                        role: "HOD",
                        scope_type: "DEPARTMENT",
                        scope_id: Number(departmentId),
                    };
                }
                if (roleId === "COORDINATOR") {
                    return {
                        role: "COORDINATOR",
                        scope_type: "SECTION",
                        scope_id: Number(sectionId),
                    };
                }
                if (roleId === "DEAN") {
                    return {
                        role: "DEAN",
                        scope_type: "SCHOOL",
                        scope_id: schoolId ? Number(schoolId) : null,
                    };
                }
                if (roleId === "ADMIN") {
                    return {
                        role: "ADMIN",
                        scope_type: "UNIVERSITY",
                        scope_id: null,
                    };
                }
                if (roleId === "STUDENT") {
                    return {
                        role: "STUDENT",
                        scope_type: "UNIVERSITY",
                        scope_id: null,
                    };
                }
                return {
                    role: "TEACHER",
                    scope_type: "ASSIGNMENT",
                    scope_id: null,
                };
            });

            await updateUserRoles(user.id, payload);
            onSuccess();
            onClose();
        } catch (err: unknown) {
            console.error("Failed to update user roles:", err);
            setError(err instanceof Error ? err.message : "Failed to update roles");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen || !user) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="bg-white w-full max-w-xl rounded-lg border border-slate-200 shadow-lg overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
                                <Shield className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                                    Manage user roles & scopes
                                </h3>
                                <p className="text-xs text-slate-500 font-normal">
                                    {user.full_name} <span className="font-mono text-xs text-slate-400">({user.email})</span>
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] disabled:opacity-50"
                            aria-label="Close dialog"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4">
                        {error && (
                            <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-md text-xs font-medium flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 font-normal">
                            A faculty member can simultaneously hold multiple roles (e.g., <strong>Teacher</strong> + <strong>Section Coordinator</strong> or <strong>HOD</strong> + <strong>Teacher</strong>). Select all roles that apply.
                        </div>

                        {loadingData ? (
                            <div className="py-12 text-center text-slate-400">
                                <Loader2 className="h-6 w-6 motion-safe:animate-spin mx-auto text-blue-700" />
                                <span className="text-xs mt-2 block font-medium">Loading user assignment scopes…</span>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                <label className="text-xs font-medium text-slate-700 block">
                                    Assign user roles
                                </label>

                                <div className="space-y-2">
                                    {ROLES_LIST.map((roleDef) => {
                                        const isSelected = selectedRoles.includes(roleDef.id);
                                        const Icon = roleDef.icon;

                                        return (
                                            <div
                                                key={roleDef.id}
                                                className={`rounded-lg border transition-colors ${
                                                    isSelected
                                                        ? "border-blue-400 bg-blue-50/30"
                                                        : "border-slate-200 bg-white hover:border-slate-300"
                                                }`}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => toggleRole(roleDef.id)}
                                                    className="w-full p-3 text-left flex items-start justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div
                                                            className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                                                                isSelected
                                                                    ? "bg-blue-700 border-blue-700 text-white"
                                                                    : "border-slate-300 bg-white"
                                                            }`}
                                                        >
                                                            {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <Icon className="h-4 w-4 text-slate-600" />
                                                                <span className="text-xs font-semibold text-slate-900">
                                                                    {roleDef.title}
                                                                </span>
                                                                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${roleDef.badgeStyle}`}>
                                                                    {roleDef.subtitle}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                                                {roleDef.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </button>

                                                {/* Scope Selectors */}
                                                {isSelected && roleDef.id === "HOD" && (
                                                    <div className="px-3.5 pb-3.5 pt-1 border-t border-blue-100 mt-1 bg-white/70 rounded-b-lg">
                                                        <label className="text-xs font-medium text-slate-700 block mb-1">
                                                            Select department scope <span className="text-rose-600">*</span>
                                                        </label>
                                                        <FormSelect
                                                            value={departmentId}
                                                            onChange={(val) => setDepartmentId(val ? Number(val) : "")}
                                                            placeholder="Choose Department…"
                                                            options={departments.map((d) => ({
                                                                value: d.id,
                                                                label: `${d.code} (${d.name})`,
                                                            }))}
                                                        />
                                                    </div>
                                                )}

                                                {isSelected && roleDef.id === "COORDINATOR" && (
                                                    <div className="px-3.5 pb-3.5 pt-1 border-t border-blue-100 mt-1 bg-white/70 rounded-b-lg">
                                                        <label className="text-xs font-medium text-slate-700 block mb-1">
                                                            Select section scope <span className="text-rose-600">*</span>
                                                        </label>
                                                        <FormSelect
                                                            value={sectionId ? String(sectionId) : ""}
                                                            onChange={(val) => setSectionId(val ? Number(val) : "")}
                                                            placeholder="Choose Section…"
                                                            options={sections.map((s) => ({
                                                                value: s.id,
                                                                label: `${s.name}${s.batch_name ? ` (${s.batch_name})` : ""}${s.programme_code ? ` (${s.programme_code})` : ""}`,
                                                            }))}
                                                        />
                                                    </div>
                                                )}

                                                {isSelected && roleDef.id === "DEAN" && (
                                                    <div className="px-3.5 pb-3.5 pt-1 border-t border-blue-100 mt-1 bg-white/70 rounded-b-lg">
                                                        <label className="text-xs font-medium text-slate-700 block mb-1">
                                                            Select school scope (optional)
                                                        </label>
                                                        <FormSelect
                                                            value={schoolId}
                                                            onChange={(val) => setSchoolId(val ? Number(val) : "")}
                                                            placeholder="Choose School…"
                                                            options={schools.map((s) => ({
                                                                value: s.id,
                                                                label: `${s.code} (${s.name})`,
                                                            }))}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Footer Controls */}
                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={saving}
                                className="px-3.5 py-1.5 rounded-md border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving || loadingData}
                                className="whitespace-nowrap px-4 py-1.5 rounded-md bg-blue-700 hover:bg-blue-800 text-xs font-medium text-white shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98]"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" />
                                        <span>Saving changes…</span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-3.5 w-3.5" />
                                        <span>Update roles</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
