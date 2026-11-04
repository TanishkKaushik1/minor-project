import { CheckCircle2 } from "lucide-react";
import ResourcePanel from "./ResourcePanel";
import { listTerms, createTerm, updateTerm, activateTerm, deleteTerm } from "../../api/admin";

export default function TermsTab() {
    return (
        <ResourcePanel
            title="Semester"
            list={listTerms}
            create={(data) =>
                createTerm({
                    name: String(data.name || "").trim(),
                    start_date: data.start_date,
                    end_date: data.end_date,
                    is_active: data.is_active === true || data.is_active === "true",
                })
            }
            edit={(id, data) =>
                updateTerm(id, {
                    name: data.name ? String(data.name).trim() : undefined,
                    start_date: data.start_date,
                    end_date: data.end_date,
                    is_active: data.is_active === true || data.is_active === "true",
                })
            }
            columns={["id", "name", "start_date", "end_date", "is_active"]}
            fields={[
                {
                    name: "name",
                    label: "Academic Session / Semester (e.g. 2026-27 Odd, 2026-27 Even)",
                    placeholder: "e.g. 2026-27 Odd",
                    type: "text",
                },
                { name: "start_date", label: "Start Date", type: "date" },
                { name: "end_date", label: "End Date", type: "date" },
                { name: "is_active", label: "Current Active Session (University-wide)", type: "checkbox" },
            ]}
            rowActions={(row, run) =>
                !row.is_active ? (
                    <button
                        onClick={() =>
                            run(
                                () => activateTerm(row.id),
                                `Activated "${row.name}" as current academic session`
                            )
                        }
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
                        title="Set as Active Session"
                    >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Set Active
                    </button>
                ) : (
                    <span className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 rounded-lg inline-flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Active
                    </span>
                )
            }
            remove={deleteTerm}
        />
    );
}
