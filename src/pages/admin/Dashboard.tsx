import { lazy, Suspense, useState } from "react";
import type { ComponentType } from "react";
import { DashboardShell } from "../../components/DashboardShell";
import type { NavItem } from "../../components/DashboardShell";

const DashboardHome = lazy(() => import("./DashboardHome"));
const UsersTab = lazy(() => import("./UsersTab"));
const LogsPage = lazy(() => import("./LogsPage"));
const DepartmentsTab = lazy(() => import("./DepartmentsTab"));
const ProgrammesTab = lazy(() => import("./ProgrammesTab"));
const BatchesTab = lazy(() => import("./BatchesTab"));
const SectionsTab = lazy(() => import("./SectionsTab"));
const TermsTab = lazy(() => import("./TermsTab"));
const SubjectsTab = lazy(() => import("./SubjectsTab"));
const OfferingsTab = lazy(() => import("./OfferingsTab"));
const EnrollmentsTab = lazy(() => import("./EnrollmentsTab"));

type Node = NavItem & { Component?: ComponentType; children?: Node[] };

const NAV: Node[] = [
    { id: "dashboard", label: "Dashboard", Component: DashboardHome },
    {
        id: "academic",
        label: "Academic",
        children: [
            { id: "departments", label: "Departments", Component: DepartmentsTab },
            { id: "programmes", label: "Programmes", Component: ProgrammesTab },
            { id: "batches", label: "Batches", Component: BatchesTab },
            { id: "terms", label: "Terms", Component: TermsTab },
            { id: "sections", label: "Sections", Component: SectionsTab },
            { id: "subjects", label: "Subjects", Component: SubjectsTab },
            { id: "offerings", label: "Course Offerings", Component: OfferingsTab },
            { id: "enrollments", label: "Enrollments", Component: EnrollmentsTab },
        ],
    },
    { id: "management", label: "Management", Component: UsersTab },
    { id: "logs", label: "Attendance Logs", Component: LogsPage },
];

const LEAVES = NAV.flatMap((n) => n.children ?? [n]);

export default function AdminDashboard() {
    const [active, setActive] = useState("dashboard");
    const Component = LEAVES.find((n) => n.id === active)!.Component!;
    return (
        <DashboardShell title="Admin Dashboard" nav={NAV} active={active} onSelect={setActive}>
            <Suspense fallback={<div>Loading…</div>}>
                <Component key={active} />
            </Suspense>
        </DashboardShell>
    );
}