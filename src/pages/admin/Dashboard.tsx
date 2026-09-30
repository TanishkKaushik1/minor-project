import { useState } from "react";
import type { ComponentType } from "react";
import { DashboardShell } from "../../components/DashboardShell";
import type { NavItem } from "../../components/DashboardShell";
import DashboardHome from "./DashboardHome";
import UsersTab from "./UsersTab";
import LogsPage from "./LogsPage";
import DepartmentsTab from "./DepartmentsTab";
import ProgrammesTab from "./ProgrammesTab";
import BatchesTab from "./BatchesTab";
import SectionsTab from "./SectionsTab";
import TermsTab from "./TermsTab";
import SubjectsTab from "./SubjectsTab";
import OfferingsTab from "./OfferingsTab";
import EnrollmentsTab from "./EnrollmentsTab";

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
    { id: "logs", label: "Logs", Component: LogsPage },
];

const LEAVES = NAV.flatMap((n) => n.children ?? [n]);

export default function AdminDashboard() {
    const [active, setActive] = useState("dashboard");
    const Component = LEAVES.find((n) => n.id === active)!.Component!;
    return (
        <DashboardShell title="Admin Dashboard" nav={NAV} active={active} onSelect={setActive}>
            <Component key={active} />
        </DashboardShell>
    );
}