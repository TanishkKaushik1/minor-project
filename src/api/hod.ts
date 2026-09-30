// src/api/hod.ts
import { apiFetch } from "./client";

export interface Term {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
}

export interface CourseOffering {
    id: number;
    term_name: string;
    section_name: string;
    subject_name: string;
    teacher_name: string;
}

export interface Subject {
    id: number;
    course_code: string;
    name: string;
    is_elective: boolean;
}

export interface Section {
    id: number;
    name: string;
    batch_id: number;
    term_id: number;
}

export interface Faculty {
    id: number;
    full_name: string;
    email: string;
    role: string;
}

export const getTerms = (): Promise<Term[]> => apiFetch("/web/management/terms");

export const createTerm = (data: { name: string; start_date: string; end_date: string; is_active?: boolean }) =>
    apiFetch("/web/management/terms", { method: "POST", body: JSON.stringify(data) });

export const getCourseOfferings = (): Promise<CourseOffering[]> =>
    apiFetch("/web/management/course-offerings");

export const assignTeacher = (data: {
    term_id: number;
    section_id: number;
    subject_id: number;
    teacher_id: number;
}) => apiFetch("/web/management/course-offerings", { method: "POST", body: JSON.stringify(data) });

export const getSubjects = (): Promise<Subject[]> => apiFetch("/web/management/subjects");

export const getSections = (): Promise<Section[]> => apiFetch("/web/management/sections");

export const getFaculty = (): Promise<Faculty[]> => apiFetch("/web/management/faculty");

export interface CorrectionRequest {
    id: number;
    session_id: number;
    record_id: number;
    requested_by_name: string;
    proposed_status: string;
    reason: string;
    requested_at: string;
}

export const getPendingCorrections = (): Promise<CorrectionRequest[]> =>
    apiFetch("/web/corrections/pending");

export const resolveCorrection = (requestId: number, decision: "APPROVED" | "REJECTED", rejection_reason?: string) =>
    apiFetch(`/web/corrections/${requestId}/resolve`, {
        method: "POST",
        body: JSON.stringify({ decision, ...(rejection_reason ? { rejection_reason } : {}) }),
    });

export const bulkEnrollStudents = (data: { course_offering_id: number; student_ids: number[] }) =>
    apiFetch("/web/management/enrollments/bulk", { method: "POST", body: JSON.stringify(data) });

// ponytail: no GET endpoint exists to list pending leaves, so this can only
// approve a leave by ID the caller already knows — upgrade once a list route ships.
export const approveLeave = (leaveId: number) =>
    apiFetch(`/web/leaves/${leaveId}/approve`, { method: "POST" });
