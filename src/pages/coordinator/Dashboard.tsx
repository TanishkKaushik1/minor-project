// src/pages/coordinator/Dashboard.tsx
import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { DashboardShell } from "../../components/DashboardShell";

interface CourseOffering {
    id: number;
    term_name: string;
    section_name: string;
    subject_name: string;
    teacher_name: string;
}

interface Section {
    id: number;
    name: string;
    batch_id: number;
    term_id: number;
}

const API_BASE = import.meta.env.VITE_API_URL || "https://laptop-f0uunm9o.taild8f6a1.ts.net/api/v1";

export default function CoordinatorDashboard() {
    const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Form State
    const [selectedOfferingId, setSelectedOfferingId] = useState<number | "">("");
    const [studentIdsInput, setStudentIdsInput] = useState("");

    const getAuthHeader = () => {
        const token = localStorage.getItem("token") || localStorage.getItem("access_token");
        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token || ""}`,
        };
    };

    const fetchData = async () => {
        const headers = getAuthHeader();
        try {
            const [offeringsRes, sectionsRes] = await Promise.all([
                fetch(`${API_BASE}/web/management/course-offerings`, { headers }),
                fetch(`${API_BASE}/web/management/sections`, { headers }),
            ]);

            if (offeringsRes.ok) setCourseOfferings(await offeringsRes.json());
            if (sectionsRes.ok) setSections(await sectionsRes.json());
        } catch {
            setMessage({ type: "error", text: "Network error loading data" });
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleBulkEnrollment = async (e: FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!selectedOfferingId) {
            setMessage({ type: "error", text: "Please select a course offering" });
            return;
        }

        const studentIds = studentIdsInput
            .split(",")
            .map((id) => id.trim())
            .filter((id) => id.length > 0)
            .map(Number)
            .filter((num) => !isNaN(num));

        if (studentIds.length === 0) {
            setMessage({ type: "error", text: "Please enter valid numeric Student IDs" });
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/web/management/enrollments/bulk`, {
                method: "POST",
                headers: getAuthHeader(),
                body: JSON.stringify({
                    course_offering_id: Number(selectedOfferingId),
                    student_ids: studentIds,
                }),
            });

            const data = await res.json().catch(() => null);

            if (res.ok) {
                setMessage({ type: "success", text: `Enrolled ${studentIds.length} students successfully!` });
                setSelectedOfferingId("");
                setStudentIdsInput("");
            } else {
                const errorDetail =
                    data?.detail?.[0]?.msg ||
                    (typeof data?.detail === "string" ? data.detail : null) ||
                    `HTTP Error ${res.status}`;
                setMessage({ type: "error", text: errorDetail });
            }
        } catch {
            setMessage({ type: "error", text: "Error submitting enrollment request" });
        }
    };

    return (
        <DashboardShell title="Coordinator Dashboard">
            <div className="space-y-8">
                {message && (
                    <div
                        className={`p-4 rounded text-sm ${message.type === "success"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-red-50 text-red-800 border border-red-200"
                            }`}
                    >
                        {message.text}
                    </div>
                )}

                {/* Bulk Student Enrollment Card */}
                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Bulk Student Enrollment</h2>
                    <form onSubmit={handleBulkEnrollment} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Select Course Offering</label>
                            <select
                                value={selectedOfferingId}
                                onChange={(e) => setSelectedOfferingId(e.target.value ? Number(e.target.value) : "")}
                                className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
                            >
                                <option value="">-- Select Class / Subject / Teacher --</option>
                                {courseOfferings.map((co) => (
                                    <option key={co.id} value={co.id}>
                                        [{co.section_name}] {co.subject_name} (Teacher: {co.teacher_name})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Student IDs (Comma Separated)
                            </label>
                            <textarea
                                rows={3}
                                value={studentIdsInput}
                                onChange={(e) => setStudentIdsInput(e.target.value)}
                                placeholder="101, 102, 103, 104"
                                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800 font-mono"
                            />
                            <p className="text-xs text-slate-400 mt-1">
                                Provide integer IDs separated by commas.
                            </p>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-5 py-2 rounded text-sm transition"
                            >
                                Enroll Students
                            </button>
                        </div>
                    </form>
                </div>

                {/* Sections & Course Offerings */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                        <h3 className="font-semibold text-slate-800 mb-3">Sections & Batches</h3>
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b text-slate-600">
                                    <th className="p-2">Section ID</th>
                                    <th className="p-2">Name</th>
                                    <th className="p-2">Batch ID</th>
                                    <th className="p-2">Term ID</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sections.map((s) => (
                                    <tr key={s.id}>
                                        <td className="p-2 font-mono text-xs text-slate-500">{s.id}</td>
                                        <td className="p-2 font-medium text-slate-800">{s.name}</td>
                                        <td className="p-2 text-slate-600">{s.batch_id}</td>
                                        <td className="p-2 text-slate-600">{s.term_id}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                        <h3 className="font-semibold text-slate-800 mb-3">Active Course Offerings</h3>
                        <ul className="divide-y divide-slate-100 text-sm">
                            {courseOfferings.map((co) => (
                                <li key={co.id} className="py-2">
                                    <div className="font-medium text-slate-800">{co.subject_name}</div>
                                    <div className="text-xs text-slate-500">
                                        Section: {co.section_name} | Term: {co.term_name} | Teacher: {co.teacher_name}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}