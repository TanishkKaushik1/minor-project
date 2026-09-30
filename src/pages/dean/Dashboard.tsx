// src/pages/dean/Dashboard.tsx
import { useState, useEffect } from "react";
import { DashboardShell } from "../../components/DashboardShell";

interface AcademicTerm {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
}

interface CourseOffering {
    id: number;
    term_name: string;
    section_name: string;
    subject_name: string;
    teacher_name: string;
}

interface Faculty {
    id: number;
    full_name: string;
    email: string;
    role: string;
}

interface Subject {
    id: number;
    course_code: string;
    name: string;
}

const API_BASE = import.meta.env.VITE_API_URL || "https://laptop-f0uunm9o.taild8f6a1.ts.net/api/v1";

export default function DeanDashboard() {
    const [terms, setTerms] = useState<AcademicTerm[]>([]);
    const [offerings, setOfferings] = useState<CourseOffering[]>([]);
    const [faculty, setFaculty] = useState<Faculty[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);

    const getAuthHeader = () => {
        const token = localStorage.getItem("token") || localStorage.getItem("access_token");
        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token || ""}`,
        };
    };

    useEffect(() => {
        const fetchAnalyticsData = async () => {
            const headers = getAuthHeader();
            try {
                const [termsRes, offeringsRes, facultyRes, subjectsRes] = await Promise.all([
                    fetch(`${API_BASE}/web/management/terms`, { headers }),
                    fetch(`${API_BASE}/web/management/course-offerings`, { headers }),
                    fetch(`${API_BASE}/web/management/faculty`, { headers }),
                    fetch(`${API_BASE}/web/management/subjects`, { headers }),
                ]);

                if (termsRes.ok) setTerms(await termsRes.json());
                if (offeringsRes.ok) setOfferings(await offeringsRes.json());
                if (facultyRes.ok) setFaculty(await facultyRes.json());
                if (subjectsRes.ok) setSubjects(await subjectsRes.json());
            } catch {
                console.error("Failed to load Dean dashboard data");
            } finally {
                setLoading(false);
            }
        };

        fetchAnalyticsData();
    }, []);

    const activeTerm = terms.find((t) => t.is_active);

    return (
        <DashboardShell title="Dean Dashboard">
            <div className="space-y-8">
                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Term</p>
                        <p className="text-xl font-bold text-slate-800 mt-1">{activeTerm ? activeTerm.name : "None Active"}</p>
                    </div>

                    <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Faculty</p>
                        <p className="text-xl font-bold text-slate-800 mt-1">{faculty.length}</p>
                    </div>

                    <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Course Offerings</p>
                        <p className="text-xl font-bold text-slate-800 mt-1">{offerings.length}</p>
                    </div>

                    <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Subjects</p>
                        <p className="text-xl font-bold text-slate-800 mt-1">{subjects.length}</p>
                    </div>
                </div>

                {/* Academic Overview Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                        <h3 className="font-semibold text-slate-800 mb-4">Academic Terms Overview</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                        <th className="p-2">Term</th>
                                        <th className="p-2">Start</th>
                                        <th className="p-2">End</th>
                                        <th className="p-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="p-3 text-center text-slate-400">Loading...</td>
                                        </tr>
                                    ) : (
                                        terms.map((t) => (
                                            <tr key={t.id}>
                                                <td className="p-2 font-medium text-slate-800">{t.name}</td>
                                                <td className="p-2 text-slate-600">{t.start_date}</td>
                                                <td className="p-2 text-slate-600">{t.end_date}</td>
                                                <td className="p-2">
                                                    <span
                                                        className={`px-2 py-0.5 text-xs rounded font-medium ${t.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                                                            }`}
                                                    >
                                                        {t.is_active ? "Active" : "Inactive"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                        <h3 className="font-semibold text-slate-800 mb-4">Department Course Allocations</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                        <th className="p-2">Subject</th>
                                        <th className="p-2">Section</th>
                                        <th className="p-2">Teacher</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={3} className="p-3 text-center text-slate-400">Loading...</td>
                                        </tr>
                                    ) : (
                                        offerings.map((co) => (
                                            <tr key={co.id}>
                                                <td className="p-2 font-medium text-slate-800">{co.subject_name}</td>
                                                <td className="p-2 text-slate-600">{co.section_name}</td>
                                                <td className="p-2 text-slate-600">{co.teacher_name}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}