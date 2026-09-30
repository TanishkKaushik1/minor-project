// src/api/admin.ts
import { apiFetch } from "./client";
import type { Role } from "../auth/AuthContext";

const M = "/web/management";
const post = (p: string, b: unknown) => apiFetch(`${M}${p}`, { method: "POST", body: JSON.stringify(b) });

/* ---------- Users ---------- */

export interface User {
    id: number;
    email: string;
    full_name: string;
    is_active: boolean;
    role: Role | "TEACHER" | "STUDENT";
    scope_type: string;
    scope_id: number | null;
    roll_number?: string | null;
    batch_id?: number | null;
}

export const listUsers = (): Promise<User[]> => apiFetch(`${M}/users`);

export const createUser = (data: {
    email: string;
    full_name: string;
    password: string;
    role: string;
    scope_type: string;
    scope_id?: number | null;
    roll_number?: string | null;
    batch_id?: number | null;
}) => post("/users", data);

export const deactivateUser = (userId: number) => apiFetch(`${M}/users/${userId}/deactivate`, { method: "PATCH" });
export const activateUser = (userId: number) => apiFetch(`${M}/users/${userId}/activate`, { method: "PATCH" });

/* ---------- Academic hierarchy ---------- */

export interface Department { id: number; name: string; code: string }
export interface Programme { id: number; name: string; code: string; department_code: string; total_semesters: number }
export interface Specialization { id: number; name: string; code: string; programme_code: string }
export interface Batch { id: number; start_year: number; expected_end_year: number; programme_id: number; specialization_id: number }
export interface Section { id: number; name: string; batch_id: number; term_id: number }

const q = (path: string, key: string, val?: string | number) =>
    val === undefined || val === "" ? path : `${path}?${key}=${encodeURIComponent(val)}`;

export const listDepartments = (): Promise<Department[]> => apiFetch(`${M}/departments`);
export const createDepartment = (b: { name: string; code: string }) => post("/departments", b);

export const listProgrammes = (departmentCode?: string): Promise<Programme[]> =>
    apiFetch(q(`${M}/programmes`, "department_code", departmentCode));
export const createProgramme = (b: { department_code: string; name: string; code: string; total_semesters: number }): Promise<Programme> =>
    post("/programmes", b);

export const listSpecializations = (programmeCode?: string): Promise<Specialization[]> =>
    apiFetch(q(`${M}/specializations`, "programme_code", programmeCode));
export const createSpecialization = (b: { programme_code: string; name: string; code: string }) => post("/specializations", b);

export const listBatches = (specializationId?: number): Promise<Batch[]> =>
    apiFetch(q(`${M}/batches`, "specialization_id", specializationId));
export const createBatch = (b: { programme_code: string; specialization_code: string; start_year: number; expected_end_year: number }) =>
    post("/batches", b);

export const listSections = (): Promise<Section[]> => apiFetch(`${M}/sections`);
export const createSection = (b: Omit<Section, "id">) => post("/sections", b);
/* ---------- Academic setup (terms, subjects, offerings, enrollment) ---------- */

export interface Term { id: number; name: string; start_date: string; end_date: string; is_active: boolean }
export interface Subject { id: number; course_code: string; name: string; is_elective: boolean }
export interface Faculty { id: number; full_name: string; email: string; role: string }
export interface Offering { id: number; term_name: string; section_name: string; subject_name: string; teacher_name: string }

export const listTerms = (): Promise<Term[]> => apiFetch(`${M}/terms`);
export const createTerm = (b: Omit<Term, "id">) => post("/terms", b);

export const listSubjects = (): Promise<Subject[]> => apiFetch(`${M}/subjects`);
export const createSubject = (b: Omit<Subject, "id">) => post("/subjects", b);

export const listFaculty = (): Promise<Faculty[]> => apiFetch(`${M}/faculty`);

export const listOfferings = (): Promise<Offering[]> => apiFetch(`${M}/course-offerings`);
export const createOffering = (b: { term_id: number; section_id: number; subject_id: number; teacher_id: number }) =>
    post("/course-offerings", b);

export const bulkEnroll = (b: { course_offering_id: number; student_ids: number[] }) => post("/enrollments/bulk", b);

/* ---------- Corrections (Admin = escalated approver) ---------- */

export interface Correction {
    id: number;
    attendance_record_id: number;
    requested_by_name: string;
    suggested_status: string;
    reason: string;
    requested_at: string;
}
/* ---------- Deletes ---------- */

const del = (p: string, id: number) => apiFetch(`${M}${p}/${id}`, { method: "DELETE" });

export const deleteDepartment = (id: number) => del("/departments", id);
export const deleteProgramme = (id: number) => del("/programmes", id);
export const deleteSpecialization = (id: number) => del("/specializations", id);
export const deleteBatch = (id: number) => del("/batches", id);
export const deleteSection = (id: number) => del("/sections", id);
export const deleteTerm = (id: number) => del("/terms", id);
export const deleteSubject = (id: number) => del("/subjects", id);
export const deleteOffering = (id: number) => del("/course-offerings", id);


export const listPendingCorrections = (): Promise<Correction[]> => apiFetch("/web/corrections/pending");
export const resolveCorrection = (id: number, b: { decision: string; rejection_reason?: string }) =>
    apiFetch(`/web/corrections/${id}/resolve`, { method: "POST", body: JSON.stringify(b) });