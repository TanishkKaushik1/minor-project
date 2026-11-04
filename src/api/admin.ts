// src/api/admin.ts
import { apiFetch } from "./client";
import type { Role } from "../auth/AuthContext";

const M = "/web/management";
const post = (p: string, b: unknown) => apiFetch(`${M}${p}`, { method: "POST", body: JSON.stringify(b) });
const put = (p: string, b: unknown) => apiFetch(`${M}${p}`, { method: "PUT", body: JSON.stringify(b) });

/* ---------- Users ---------- */

export interface RoleAssignmentInfo {
    id?: number;
    role: string;
    scope_type: string;
    scope_id: number | null;
}

export interface User {
    id: number;
    email: string;
    full_name: string;
    is_active: boolean;
    role: Role | "TEACHER" | "STUDENT";
    roles?: (Role | "TEACHER" | "STUDENT")[];
    role_assignments?: RoleAssignmentInfo[];
    scope_type: string;
    scope_id: number | null;
    roll_number?: string | null;
    batch_id?: number | null;
}

// Added to support the new backend pagination schema
export interface PaginatedUsers {
    items: User[];
    total: number;
    page: number;
    size: number;
}

// Updated to pass pagination parameters to the backend
export const listUsers = (page: number = 1, size: number = 50, role?: string, search?: string, signal?: AbortSignal): Promise<PaginatedUsers> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (role && role.trim()) params.set("role", role.trim());
    if (search && search.trim()) params.set("search", search.trim());
    return apiFetch(`${M}/users?${params.toString()}`, { signal });
};
export interface DashboardStats {
    total_users: number;
    active_users: number;
    total_students: number;
    total_teachers: number;
    total_coordinators: number;
    total_admins: number;
}
export const getDashboardStats = (): Promise<DashboardStats> => apiFetch("/admin/dashboard/stats");

export interface ActionItems {
    pending_corrections: number;
    pending_leave_requests: number;
    unassigned_courses: number;
    unmapped_students: number;
}
export const getActionItems = (): Promise<ActionItems> => apiFetch("/admin/dashboard/action-items");

export interface AttendancePulse {
    classes_held_today: number;
    overall_attendance_today: number;
}
export const getAttendancePulse = (): Promise<AttendancePulse> => apiFetch("/admin/dashboard/attendance-pulse");

export interface SetupHealth {
    active_term_name: string | null;
    batches_without_sections: number;
    empty_sections: number;
}
export const getSetupHealth = (): Promise<SetupHealth> => apiFetch("/admin/dashboard/setup-health");
export interface RoleAssignmentPayload {
    role: string;
    scope_type?: string;
    scope_id?: number | null;
}

export const createUser = (data: {
    email: string;
    full_name: string;
    password: string;
    role: string;
    roles?: string[];
    role_assignments?: RoleAssignmentPayload[];
    scope_type: string;
    scope_id?: number | null;
    roll_number?: string | null;
    batch_id?: number | null;
}) => post("/users", data);

export const updateUserRoles = (
    userId: number,
    roles: RoleAssignmentPayload[]
): Promise<User> =>
    apiFetch(`${M}/users/${userId}/roles`, {
        method: "PUT",
        body: JSON.stringify({ roles }),
    });

export const deactivateUser = (userId: number) => apiFetch(`${M}/users/${userId}/deactivate`, { method: "PATCH" });
export const activateUser = (userId: number) => apiFetch(`${M}/users/${userId}/activate`, { method: "PATCH" });
export const updateUserPassword = (
    userId: number,
    newPassword: string,
    mustChangePassword = false
): Promise<{ status: string; message: string }> =>
    apiFetch(`${M}/users/${userId}/password`, {
        method: "PATCH",
        body: JSON.stringify({
            new_password: newPassword,
            must_change_password: mustChangePassword,
        }),
    });

export interface UpdateUserProfilePayload {
    full_name?: string;
    email?: string;
    roll_number?: string;
    new_password?: string;
    must_change_password?: boolean;
}

export const updateUserProfile = (
    userId: number,
    data: UpdateUserProfilePayload
): Promise<User> =>
    apiFetch(`${M}/users/${userId}/profile`, {
        method: "PATCH",
        body: JSON.stringify(data),
    });

export interface AuditLogItem {
    id: number;
    attendance_record_id: number;
    changed_by_name: string;
    changed_by_email: string;
    old_status: string;
    new_status: string;
    reason: string | null;
    timestamp: string;
}

export interface PaginatedAuditLogs {
    items: AuditLogItem[];
    total: number;
    page: number;
    size: number;
}

export const listAuditLogs = (
    page: number = 1,
    size: number = 50,
    userId?: number,
    recordId?: number
): Promise<PaginatedAuditLogs> => {
    const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
    });

    if (userId) params.append("user_id", userId.toString());
    if (recordId) params.append("record_id", recordId.toString());

    return apiFetch(`/web/audit-logs?${params.toString()}`);
};

/* ---------- Attendance Sessions (Live Marked Logs) ---------- */

export interface AttendanceSessionItem {
    id: number;
    session_uuid: string;
    date: string;
    teacher_id: number;
    teacher_name: string;
    teacher_email: string;
    course_offering_id: number;
    subject_code: string;
    subject_name: string;
    section_name: string;
    term_name?: string | null;
    duration_periods: number;
    mode: string;
    status: string;
    total_students: number;
    present_count: number;
    absent_count: number;
    leave_count: number;
    attendance_percentage: number;
    submitted_at?: string | null;
    created_at: string;
}

export interface PaginatedAttendanceSessions {
    items: AttendanceSessionItem[];
    total: number;
    page: number;
    size: number;
    summary_today?: {
        sessions_today: number;
        students_marked_today: number;
        present_today: number;
        overall_percentage_today: number;
    } | null;
}

export interface SessionStudentRecord {
    record_id: number;
    student_id: number;
    roll_number: string;
    student_name: string;
    student_email: string;
    status: string;
    captured_at: string;
    is_flagged: boolean;
    flag_reason?: string | null;
}

export interface SessionDetailResponse {
    session: AttendanceSessionItem;
    records: SessionStudentRecord[];
}

export const listAttendanceSessions = (
    page: number = 1,
    size: number = 50,
    params?: { date?: string; teacher_id?: number; course_offering_id?: number; search?: string }
): Promise<PaginatedAttendanceSessions> => {
    const q = new URLSearchParams({ page: String(page), size: String(size) });
    if (params?.date) q.append("date", params.date);
    if (params?.teacher_id) q.append("teacher_id", String(params.teacher_id));
    if (params?.course_offering_id) q.append("course_offering_id", String(params.course_offering_id));
    if (params?.search) q.append("search", params.search);
    return apiFetch(`/web/attendance-sessions/sessions?${q.toString()}`);
};

export const getSessionDetail = (sessionId: number): Promise<SessionDetailResponse> =>
    apiFetch(`/web/attendance-sessions/sessions/${sessionId}`);

/* ---------- Academic hierarchy ---------- */

export interface School { id: number; name: string; code: string }
export interface Department { id: number; name: string; code: string; school_code?: string | null; school_name?: string | null }
export interface Programme { id: number; name: string; code: string; department_code: string; total_semesters: number }
export interface Specialization { id: number; name: string; code: string; programme_code: string }
export interface Batch { id: number; name: string; start_year: number; expected_end_year: number; programme_id: number; specialization_id?: number | null }
export interface Section {
    id: number;
    name: string;
    batch_id: number;
    term_id: number;
    batch_name?: string | null;
    start_year?: number | null;
    expected_end_year?: number | null;
    programme_name?: string | null;
    programme_code?: string | null;
    term_name?: string | null;
    is_term_active?: boolean | null;
    enrolled_students_count?: number;
}

const q = (path: string, key: string, val?: string | number) =>
    val === undefined || val === "" ? path : `${path}?${key}=${encodeURIComponent(val)}`;

export const listSchools = (): Promise<School[]> => apiFetch(`${M}/schools`);
export const createSchool = (b: { name: string; code: string }) => post("/schools", b);

export const listDepartments = (schoolCode?: string): Promise<Department[]> =>
    apiFetch(q(`${M}/departments`, "school_code", schoolCode));
export const createDepartment = (b: { name: string; code: string; school_code?: string }) => post("/departments", b);

export const listProgrammes = (departmentCode?: string): Promise<Programme[]> =>
    apiFetch(q(`${M}/programmes`, "department_code", departmentCode));
export const createProgramme = (b: { department_code: string; name: string; code: string; total_semesters: number }): Promise<Programme> =>
    post("/programmes", b);
export const updateProgramme = (id: number, b: { department_code?: string; name?: string; code?: string; total_semesters?: number }): Promise<Programme> =>
    put(`/programmes/${id}`, b);

export const listSpecializations = (programmeCode?: string): Promise<Specialization[]> =>
    apiFetch(q(`${M}/specializations`, "programme_code", programmeCode));
export const createSpecialization = (b: { programme_code: string; name: string; code: string }) => post("/specializations", b);

export const listBatches = (specializationId?: number): Promise<Batch[]> =>
    apiFetch(q(`${M}/batches`, "specialization_id", specializationId));
export const createBatch = (b: { name: string; programme_code: string; specialization_code?: string; start_year: number; expected_end_year: number }) =>
    post("/batches", b);

export const listSections = (): Promise<Section[]> => apiFetch(`${M}/sections`);
export const createSection = (b: Omit<Section, "id">) => post("/sections", b);

/* ---------- Academic setup (terms, subjects, offerings, enrollment) ---------- */

export interface Term { id: number; name: string; start_date: string; end_date: string; is_active: boolean; batch_id?: number | null }
export type Semester = Term;
export interface Subject { id: number; course_code: string; name: string; is_elective: boolean }
export interface Faculty { id: number; full_name: string; email: string; role: string }
export interface Offering {
    id: number;
    term_name: string;
    section_name: string;
    subject_name: string;
    teacher_name: string;
    teacher_id?: number;
    subject_code?: string;
    term_id?: number;
    section_id?: number;
    subject_id?: number;
}

export const listTerms = (): Promise<Term[]> => apiFetch(`${M}/terms`);
export const createTerm = (b: Omit<Term, "id">) => post("/terms", b);
export const updateTerm = (id: number, b: Partial<Omit<Term, "id">>): Promise<Term> => put(`/terms/${id}`, b);
export const activateTerm = (id: number): Promise<Term> => put(`/terms/${id}/activate`, {});
export const listSemesters = listTerms;
export const createSemester = createTerm;
export const updateSemester = updateTerm;
export const activateSemester = activateTerm;

export const listSubjects = (): Promise<Subject[]> => apiFetch(`${M}/subjects`);
export const createSubject = (b: Omit<Subject, "id">) => post("/subjects", b);

export const listFaculty = (): Promise<Faculty[]> => apiFetch(`${M}/faculty?_t=${Date.now()}`);

export const listOfferings = (): Promise<Offering[]> => apiFetch(`${M}/course-offerings?_t=${Date.now()}`);
export const createOffering = (b: { term_id: number; section_id: number; subject_id: number; teacher_id: number }) =>
    post("/course-offerings", b);
export const reassignOffering = (offeringId: number, teacherId: number) =>
    apiFetch(`${M}/course-offerings/${offeringId}/reassign`, {
        method: "PATCH",
        body: JSON.stringify({ teacher_id: teacherId }),
    });

export const bulkEnroll = (b: { course_offering_id: number; student_ids: number[] }) => post("/enrollments/bulk", b);

/* ---------- Academic Students Directory ---------- */

export interface StudentAcademicCourse {
    offering_id: number;
    course_code: string;
    subject_name: string;
    section_name: string;
    term_name?: string | null;
    teacher_name?: string | null;
    course_type?: string | null;
}

export interface StudentAcademicItem {
    id: number;
    full_name: string;
    email: string;
    roll_number?: string | null;
    is_active: boolean;
    batch_id?: number | null;
    batch_name?: string | null;
    programme_id?: number | null;
    programme_name?: string | null;
    programme_code?: string | null;
    department_id?: number | null;
    department_name?: string | null;
    department_code?: string | null;
    school_id?: number | null;
    school_name?: string | null;
    school_code?: string | null;
    enrolled_courses_count: number;
    enrolled_courses: StudentAcademicCourse[];
}

export interface PaginatedStudentAcademicResponse {
    items: StudentAcademicItem[];
    total: number;
    page: number;
    size: number;
    total_active: number;
}

export interface StudentFilterParams {
    school_id?: number;
    department_id?: number;
    programme_id?: number;
    batch_id?: number;
    section_id?: number;
    subject_id?: number;
    course_offering_id?: number;
    search?: string;
    page?: number;
    size?: number;
}

export const listAcademicStudents = (params?: StudentFilterParams): Promise<PaginatedStudentAcademicResponse> => {
    const q = new URLSearchParams();
    if (params?.school_id) q.append("school_id", String(params.school_id));
    if (params?.department_id) q.append("department_id", String(params.department_id));
    if (params?.programme_id) q.append("programme_id", String(params.programme_id));
    if (params?.batch_id) q.append("batch_id", String(params.batch_id));
    if (params?.section_id) q.append("section_id", String(params.section_id));
    if (params?.subject_id) q.append("subject_id", String(params.subject_id));
    if (params?.course_offering_id) q.append("course_offering_id", String(params.course_offering_id));
    if (params?.search) q.append("search", params.search);
    if (params?.page) q.append("page", String(params.page));
    if (params?.size) q.append("size", String(params.size));
    const qs = q.toString();
    return apiFetch(`/web/management/students${qs ? `?${qs}` : ""}`);
};

export interface StudentImportItem {
    roll_number: string;
    full_name: string;
    email?: string | null;
}

export interface StudentBulkImportRequest {
    batch_id: number;
    section_id?: number | null;
    course_offering_ids?: number[] | null;
    students: StudentImportItem[];
}

export interface StudentBulkImportResponse {
    status: string;
    message: string;
    total_processed: number;
    created_count: number;
    updated_count: number;
    enrolled_count: number;
    skipped_count: number;
    errors: string[];
}

export const bulkImportStudents = (payload: StudentBulkImportRequest): Promise<StudentBulkImportResponse> =>
    apiFetch("/web/management/students/bulk-import", {
        method: "POST",
        body: JSON.stringify(payload),
    });

export const unenrollStudentFromCourse = (studentId: number, offeringId: number): Promise<{ status: string; message: string }> =>
    apiFetch(`/web/management/students/${studentId}/courses/${offeringId}`, { method: "DELETE" });

/* ---------- Corrections (Admin = escalated approver) ---------- */

export interface Correction {
    id: number;
    attendance_record_id: number;
    requested_by_name: string;
    student_name?: string;
    student_roll?: string;
    subject_code?: string;
    subject_name?: string;
    class_date?: string;
    current_status?: string;
    suggested_status: string;
    status: string;
    reason: string;
    requested_at: string;
    is_escalated?: boolean;
}

/* ---------- Deletes ---------- */

const del = (p: string, id: number) => apiFetch(`${M}${p}/${id}`, { method: "DELETE" });

export const deleteSchool = (id: number) => del("/schools", id);
export const deleteDepartment = (id: number) => del("/departments", id);
export const deleteProgramme = (id: number) => del("/programmes", id);
export const deleteSpecialization = (id: number) => del("/specializations", id);
export const deleteBatch = (id: number) => del("/batches", id);
export const deleteSection = (id: number) => del("/sections", id);
export const deleteTerm = (id: number) => del("/terms", id);
export const deleteSubject = (id: number) => del("/subjects", id);
export const deleteOffering = (id: number) => del("/course-offerings", id);

export const listPendingCorrections = (status?: string): Promise<Correction[]> => {
    const q = status ? `?status=${encodeURIComponent(status)}` : "";
    return apiFetch(`/web/corrections${q}`);
};
export const resolveCorrection = (id: number, b: { decision: string; rejection_reason?: string }) =>
    apiFetch(`/web/corrections/${id}/resolve`, { method: "POST", body: JSON.stringify(b) });
export const bulkResolveCorrections = (b: { request_ids: number[]; decision: string; rejection_reason?: string }) =>
    apiFetch(`/web/corrections/bulk-resolve`, { method: "POST", body: JSON.stringify(b) });

/* ---------- Timetable (Scraped timetable viewer) ---------- */

export interface TimetableSlot {
    course_offering_id: number;
    subject_code: string;
    subject_name: string;
    section_name: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    room: string;
    batch_label: string;
}

export const listTimetable = (termId: number, sectionId: number): Promise<TimetableSlot[]> =>
    apiFetch(`/web/timetable/?term_id=${termId}&section_id=${sectionId}`);

/* ---------- Samay Live Timetable (Official GBU Portal) ---------- */

export interface SamaySectionMeta {
    section_id: string;
    section_name: string;
    school: string;
    dept: string;
    program_code: string;
    program_name: string;
}

export interface SamayTeacherMeta {
    faculty_id: string;
    teacher_name: string;
    abbr: string;
    dept: string;
    school: string;
}

export interface SamayMetadata {
    status: string;
    last_synced: string;
    schools: string[];
    departments_by_school: Record<string, string[]>;
    sections: SamaySectionMeta[];
    teachers: SamayTeacherMeta[];
    total_slots: number;
}

export interface SamaySlot {
    day: number;
    day_name: string;
    period: number;
    period_time: string;
    subject_code: string;
    subject_name: string;
    teacher_name: string;
    teacher_abbr: string;
    faculty_id: string;
    section_name: string;
    section_id: string;
    program_name: string;
    room: string;
    building: string;
    activity: string;
    batch_id: string;
}

export interface SamaySummaryRow {
    subject_code: string;
    subject_name: string;
    activity: string;
    hours: number | string;
    official_load?: string;
    teacher_name?: string;
    teacher_abbr?: string;
    section_name?: string;
    credits?: string | number;
    grid_hours?: number;
    is_non_classroom?: boolean;
}

export interface SamaySlotsResponse {
    title: string;
    subtitle: string;
    last_synced: string;
    total_slots: number;
    slots: SamaySlot[];
    summary: SamaySummaryRow[];
    non_classroom_courses?: SamaySummaryRow[];
    period_definitions: Record<number, string>;
    day_definitions: Record<number, string>;
}

export const getSamayMetadata = (forceRefresh = false): Promise<SamayMetadata> =>
    apiFetch(`/web/timetable/samay/metadata?force_refresh=${forceRefresh}&_t=${Date.now()}`);

export const getSamaySlots = (params: {
    section_id?: string;
    teacher_name?: string;
    faculty_id?: string;
    school?: string;
    force_refresh?: boolean;
}): Promise<SamaySlotsResponse> => {
    const q = new URLSearchParams();
    if (params.section_id) q.set("section_id", params.section_id);
    if (params.teacher_name) q.set("teacher_name", params.teacher_name);
    if (params.faculty_id) q.set("faculty_id", params.faculty_id);
    if (params.school) q.set("school", params.school);
    if (params.force_refresh) q.set("force_refresh", "true");
    q.set("_t", Date.now().toString());
    return apiFetch(`/web/timetable/samay/slots?${q.toString()}`);
};

/* ---------- Credit & Faculty Workload Management ---------- */

export interface FacultyCourseLoadItem {
    course_offering_id: number;
    subject_code: string;
    subject_name: string;
    section_name: string;
    term_name: string;
    course_type: string;
    credits: number;
    weekly_hours: number;
}

export interface TeacherWorkloadItem {
    teacher_id: number;
    teacher_name: string;
    teacher_email: string;
    total_weekly_hours: number;
    lecture_hours: number;
    lab_hours: number;
    project_training_hours: number;
    course_count: number;
    courses: FacultyCourseLoadItem[];
}

export interface FacultyWorkloadReport {
    total_teachers: number;
    total_teaching_hours: number;
    avg_teaching_hours: number;
    teachers: TeacherWorkloadItem[];
}

export interface StudentEnrolledCourseItem {
    course_offering_id: number;
    subject_code: string;
    subject_name: string;
    course_type: string;
    credits: number;
}

export interface StudentCreditAuditItem {
    student_id: number;
    student_name: string;
    roll_number: string;
    student_email: string;
    section_name: string;
    total_credits: number;
    lecture_credits: number;
    lab_credits: number;
    project_training_credits: number;
    course_count: number;
    courses: StudentEnrolledCourseItem[];
}

export interface StudentCreditAuditReport {
    total_students: number;
    avg_credits_enrolled: number;
    students: StudentCreditAuditItem[];
}

export interface SyncCreditsResult {
    subjects_updated: number;
    offerings_updated: number;
    total_remarks_processed: number;
    message: string;
}

export interface SubjectWithCredits {
    id: number;
    course_code: string;
    name: string;
    is_elective: boolean;
    credits: number;
    course_type: string;
}

export const syncCreditsFromTimetable = (): Promise<SyncCreditsResult> =>
    post("/web/credits/sync-from-timetable", {});

export const getFacultyWorkloadReport = (search?: string): Promise<FacultyWorkloadReport> => {
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    return apiFetch(`/web/credits/faculty-workload${q}`);
};

export const getStudentCreditAudit = (sectionId?: number, search?: string): Promise<StudentCreditAuditReport> => {
    const q = new URLSearchParams();
    if (sectionId) q.set("section_id", sectionId.toString());
    if (search) q.set("search", search);
    const qs = q.toString() ? `?${q.toString()}` : "";
    return apiFetch(`/web/credits/student-audit${qs}`);
};

export const listSubjectsWithCredits = (search?: string): Promise<SubjectWithCredits[]> => {
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    return apiFetch(`/web/credits/subjects${q}`);
};

export const updateSubjectCredits = (
    subjectId: number,
    data: { name?: string; credits?: number; course_type?: string; is_elective?: boolean }
): Promise<SubjectWithCredits> =>
    apiFetch(`/web/credits/subjects/${subjectId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
    });

/* ---------- Safe Timetable Sync & Rollback ---------- */

export interface MissingSubjectItem {
    course_code: string;
    name: string;
    course_type: string;
    credits: number | string;
}

export interface MissingOfferingItem {
    course_code: string;
    subject_name: string;
    teacher_name: string;
    teacher_abbr: string;
    course_type: string;
    weekly_hours: number;
    needs_subject_creation: boolean;
}

export interface AlreadySyncedOfferingItem {
    offering_id: number;
    course_code: string;
    subject_name: string;
    teacher_name: string;
    course_type: string;
    weekly_hours: number;
}

export interface TimetableSyncPreview {
    section_id: number;
    section_name: string;
    term_id: number;
    term_name: string;
    official_courses_total: number;
    missing_subjects: MissingSubjectItem[];
    missing_offerings: MissingOfferingItem[];
    already_synced_offerings: AlreadySyncedOfferingItem[];
    students_in_section: number;
    auto_enroll_will_affect: number;
    has_changes: boolean;
}

export interface TimetableSyncResult {
    status: string;
    sync_id: number;
    summary: string;
    created_subjects_count: number;
    created_offerings_count: number;
    created_enrollments_count: number;
    is_rolled_back: boolean;
    created_at: string;
}

export interface TimetableSyncHistoryItem {
    id: number;
    created_at: string | null;
    admin_name: string;
    section_id: number | null;
    section_name: string | null;
    summary: string;
    created_subjects_count: number;
    created_offerings_count: number;
    created_enrollments_count: number;
    is_rolled_back: boolean;
    rolled_back_at: string | null;
}

export const previewTimetableSync = (params: {
    section_name: string;
    samay_section_id?: string;
    school?: string;
    dept?: string;
}): Promise<TimetableSyncPreview> => {
    const q = new URLSearchParams();
    q.set("section_name", params.section_name);
    if (params.samay_section_id) q.set("samay_section_id", params.samay_section_id);
    if (params.school) q.set("school", params.school);
    if (params.dept) q.set("dept", params.dept);
    return apiFetch(`/web/timetable/sync/preview?${q.toString()}`);
};

export const applyTimetableSync = (payload: {
    section_name: string;
    samay_section_id?: string;
    school?: string;
    dept?: string;
    auto_enroll_students?: boolean;
}): Promise<TimetableSyncResult> =>
    apiFetch(`/web/timetable/sync/apply`, {
        method: "POST",
        body: JSON.stringify(payload),
    });

export const getTimetableSyncHistory = (limit: number = 20): Promise<TimetableSyncHistoryItem[]> =>
    apiFetch(`/web/timetable/sync/history?limit=${limit}`);

export const rollbackTimetableSync = (syncId: number): Promise<{ status: string; message: string; rolled_back_at: string }> =>
    apiFetch(`/web/timetable/sync/rollback/${syncId}`, {
        method: "POST",
    });
