import { lazy, Suspense, useState } from "react";
import type { ComponentType } from "react";
import {
    LayoutDashboard,
    GraduationCap,
    Users,
    Activity,
    Building2,
    BookOpen,
    Layers,
    Calendar,
    FolderKanban,
    FileText,
    UserCheck,
    Clock,
    Award,
    Landmark,
    Sliders,
    Megaphone,
    Send,
    History
} from "lucide-react";
import { DashboardShell } from "../../components/DashboardShell";
import type { NavItem } from "../../components/DashboardShell";

const DashboardHome = lazy(() => import("./DashboardHome"));
const UsersTab = lazy(() => import("./UsersTab"));
const LogsPage = lazy(() => import("./LogsPage"));
const SchoolsTab = lazy(() => import("./SchoolsTab"));
const DepartmentsTab = lazy(() => import("./DepartmentsTab"));
const ProgrammesTab = lazy(() => import("./ProgrammesTab"));
const BatchesTab = lazy(() => import("./BatchesTab"));
const SectionsTab = lazy(() => import("./SectionsTab"));
const TermsTab = lazy(() => import("./TermsTab"));
const SubjectsTab = lazy(() => import("./SubjectsTab"));
const TeacherAllotmentsTab = lazy(() => import("./TeacherAllotmentsTab"));
const UniversityTimetableTab = lazy(() => import("./UniversityTimetableTab"));
const CreditsWorkloadTab = lazy(() => import("./CreditsWorkloadTab"));
const OfferingsTab = lazy(() => import("./OfferingsTab"));
const StudentsTab = lazy(() => import("./StudentsTab"));
const SettingsTab = lazy(() => import("./SettingsTab"));
const SendBroadcastTab = lazy(() => import("./SendBroadcastTab"));
const BroadcastHistoryTab = lazy(() => import("./BroadcastHistoryTab"));
const NotificationSettingsTab = lazy(() => import("./NotificationSettingsTab"));

type Node = NavItem & { Component?: ComponentType<{ onNavigate?: (tabId: string) => void }>; children?: Node[] };

const NAV: Node[] = [
    {
        id: "dashboard",
        label: "Dashboard",
        icon: <LayoutDashboard className="h-4 w-4" />,
        Component: DashboardHome,
    },
    {
        id: "academic",
        label: "Academic",
        icon: <GraduationCap className="h-4 w-4" />,
        children: [
            {
                id: "schools",
                label: "Schools",
                icon: <Landmark className="h-3.5 w-3.5" />,
                Component: SchoolsTab,
            },
            {
                id: "departments",
                label: "Departments",
                icon: <Building2 className="h-3.5 w-3.5" />,
                Component: DepartmentsTab,
            },
            {
                id: "programmes",
                label: "Programmes",
                icon: <BookOpen className="h-3.5 w-3.5" />,
                Component: ProgrammesTab,
            },
            {
                id: "batches",
                label: "Batches",
                icon: <Layers className="h-3.5 w-3.5" />,
                Component: BatchesTab,
            },
            {
                id: "terms",
                label: "Semesters",
                icon: <Calendar className="h-3.5 w-3.5" />,
                Component: TermsTab,
            },
            {
                id: "sections",
                label: "Sections",
                icon: <FolderKanban className="h-3.5 w-3.5" />,
                Component: SectionsTab,
            },
            {
                id: "subjects",
                label: "Subjects",
                icon: <FileText className="h-3.5 w-3.5" />,
                Component: SubjectsTab,
            },
            {
                id: "teacher-allotments",
                label: "Teacher Allotments",
                icon: <GraduationCap className="h-3.5 w-3.5" />,
                Component: TeacherAllotmentsTab,
            },
            {
                id: "timetable",
                label: "University Timetable",
                icon: <Clock className="h-3.5 w-3.5" />,
                Component: UniversityTimetableTab,
            },
            {
                id: "credits-workload",
                label: "Credits & Workload",
                icon: <Award className="h-3.5 w-3.5" />,
                Component: CreditsWorkloadTab,
            },
            {
                id: "offerings",
                label: "Course Offerings",
                icon: <UserCheck className="h-3.5 w-3.5" />,
                Component: OfferingsTab,
            },
            {
                id: "students",
                label: "Students",
                icon: <Users className="h-3.5 w-3.5" />,
                Component: StudentsTab,
            },
        ],
    },
    {
        id: "management",
        label: "User Accounts",
        icon: <Users className="h-4 w-4" />,
        Component: UsersTab,
    },
    {
        id: "logs",
        label: "Attendance Logs",
        icon: <Activity className="h-4 w-4" />,
        Component: LogsPage,
    },
    {
        id: "communications",
        label: "Communications",
        icon: <Megaphone className="h-4 w-4" />,
        children: [
            {
                id: "send-broadcast",
                label: "Send Broadcast",
                icon: <Send className="h-3.5 w-3.5" />,
                Component: SendBroadcastTab,
            },
            {
                id: "broadcast-history",
                label: "Broadcast History",
                icon: <History className="h-3.5 w-3.5" />,
                Component: BroadcastHistoryTab,
            },
            {
                id: "notification-settings",
                label: "Broadcast Settings",
                icon: <Sliders className="h-3.5 w-3.5" />,
                Component: NotificationSettingsTab,
            },
        ],
    },
    {
        id: "settings",
        label: "System Settings",
        icon: <Sliders className="h-4 w-4" />,
        Component: SettingsTab,
    },
];

const LEAVES = NAV.flatMap((n) => n.children ?? [n]);

export default function AdminDashboard() {
    const [active, setActive] = useState("dashboard");
    const matchedNode = LEAVES.find((n) => n.id === active);
    const Component = matchedNode?.Component || DashboardHome;

    return (
        <DashboardShell title="Admin Dashboard" nav={NAV} active={active} onSelect={setActive}>
            <Suspense
                fallback={
                    <div className="flex items-center justify-center py-24 text-slate-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                }
            >
                <Component key={active} onNavigate={setActive} />
            </Suspense>
        </DashboardShell>
    );
}