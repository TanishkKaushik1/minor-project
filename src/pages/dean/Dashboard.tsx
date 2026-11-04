// src/pages/dean/Dashboard.tsx
import { useState, useEffect } from "react";
import {
    School,
    Users,
    GraduationCap,
    Calendar,
    FolderKanban,
    RefreshCw
} from "lucide-react";
import { DashboardShell } from "../../components/DashboardShell";
import type { NavItem } from "../../components/DashboardShell";
import { listTerms, listOfferings, listFaculty, listDepartments } from "../../api/admin";
import type { Term, Offering, Faculty, Department } from "../../api/admin";

const NAV: NavItem[] = [
    { id: "overview", label: "Executive Overview", icon: <School className="h-4 w-4" /> },
    { id: "departments", label: "Departments", icon: <GraduationCap className="h-4 w-4" /> },
    { id: "offerings", label: "Course Offerings", icon: <FolderKanban className="h-4 w-4" /> },
    { id: "terms", label: "Academic Terms", icon: <Calendar className="h-4 w-4" /> },
];

export default function DeanDashboard() {
    const [activeTab, setActiveTab] = useState("overview");
    const [terms, setTerms] = useState<Term[]>([]);
    const [offerings, setOfferings] = useState<Offering[]>([]);
    const [faculty, setFaculty] = useState<Faculty[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const [termsData, offeringsData, facultyData, deptsData] = await Promise.all([
                listTerms(),
                listOfferings(),
                listFaculty(),
                listDepartments()
            ]);
            setTerms(termsData ?? []);
            setOfferings(offeringsData ?? []);
            setFaculty(facultyData ?? []);
            setDepartments(deptsData ?? []);
        } catch (err) {
            console.error("Failed to load Dean data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const activeTerm = terms.find((t) => t.is_active);

    return (
        <DashboardShell
            title="Dean Executive Portal"
            nav={NAV}
            active={activeTab}
            onSelect={setActiveTab}
        >
            <div className="space-y-6 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Dean Academic Oversight</h1>
                        <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
                            Institution-wide supervision of departments, faculties, and course offerings.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={loadData}
                            disabled={loading}
                            className="p-2.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all active:scale-95 shadow-xs"
                            title="Refresh Data"
                        >
                            <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? "animate-spin text-blue-600" : ""}`} />
                        </button>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Term</span>
                            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
                                <Calendar className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="text-xl font-black text-slate-800 tracking-tight">
                            {activeTerm ? activeTerm.name : "None Active"}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Current university session</p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Faculty</span>
                            <div className="p-2.5 rounded-2xl bg-violet-50 text-violet-600">
                                <Users className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-slate-800 tracking-tight">
                            {faculty.length}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Teaching & supervising staff</p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Course Offerings</span>
                            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
                                <FolderKanban className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-slate-800 tracking-tight">
                            {offerings.length}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Section class assignments</p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Departments</span>
                            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
                                <GraduationCap className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-slate-800 tracking-tight">
                            {departments.length}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Academic departments</p>
                    </div>
                </div>

                {/* Tables Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Course Offerings Table */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                                Department Course Allocations
                            </h3>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {offerings.length} Classes
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50/70 text-slate-400 font-bold text-[10px] uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="px-5 py-3.5">Subject</th>
                                        <th className="px-5 py-3.5">Section</th>
                                        <th className="px-5 py-3.5">Teacher</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {offerings.slice(0, 10).map((co) => (
                                        <tr key={co.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-5 py-3 font-bold text-slate-800">{co.subject_name}</td>
                                            <td className="px-5 py-3 text-slate-600">{co.section_name}</td>
                                            <td className="px-5 py-3 text-slate-700">{co.teacher_name}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Academic Terms Table */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                                Academic Terms
                            </h3>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {terms.length} Sessions
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50/70 text-slate-400 font-bold text-[10px] uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="px-5 py-3.5">Term</th>
                                        <th className="px-5 py-3.5">Start</th>
                                        <th className="px-5 py-3.5">End</th>
                                        <th className="px-5 py-3.5 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {terms.map((t) => (
                                        <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-5 py-3 font-bold text-slate-800">{t.name}</td>
                                            <td className="px-5 py-3 text-slate-600">{t.start_date}</td>
                                            <td className="px-5 py-3 text-slate-600">{t.end_date}</td>
                                            <td className="px-5 py-3 text-center">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-[9px] font-black uppercase tracking-wider ${
                                                        t.is_active
                                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                            : "bg-slate-100 text-slate-500 border border-slate-200"
                                                    }`}
                                                >
                                                    {t.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}