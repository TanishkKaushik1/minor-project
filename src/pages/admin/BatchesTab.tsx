import ResourcePanel from "./ResourcePanel";
import { listBatches, createBatch, deleteBatch, listSpecializations, listProgrammes, listDepartments } from "../../api/admin";

const departments = () => listDepartments().then((d) => d.map((x) => ({ value: x.code, label: `${x.code} · ${x.name}` })));

const programmes = (v: Record<string, string>) =>
    v.department_code
        ? listProgrammes(v.department_code).then((p) => p.map((x) => ({ value: x.code, label: `${x.code} · ${x.name}` })))
        : Promise.resolve([]);

const specs = (v: Record<string, string>) =>
    v.programme_code
        ? listSpecializations(v.programme_code).then((s) => s.map((x) => ({ value: x.code, label: `${x.code} · ${x.name}` })))
        : Promise.resolve([]);

const parseYear = (val: any): number => {
    if (!val) return new Date().getFullYear();
    if (typeof val === "number") return val;
    const str = String(val).trim();
    if (str.includes("-")) {
        const yr = parseInt(str.split("-")[0], 10);
        return isNaN(yr) ? new Date().getFullYear() : yr;
    }
    const yr = parseInt(str, 10);
    return isNaN(yr) ? new Date().getFullYear() : yr;
};

const create = ({ department_code: _d, ...batch }: any) => {
    return createBatch({
        name: batch.name,
        programme_code: batch.programme_code,
        specialization_code: batch.specialization_code || undefined,
        start_year: parseYear(batch.start_year),
        expected_end_year: parseYear(batch.expected_end_year),
    });
};

export default function BatchesTab() {
    return (
        <ResourcePanel
            title="Batch"
            list={() => listBatches()}
            create={create}
            remove={deleteBatch}
            columns={["id", "name", "start_year", "expected_end_year"]}
            fields={[
                {
                    name: "name",
                    label: "Batch Name (e.g., Morning Shift, Lateral Entry, 2024-CSE)",
                    type: "text",
                },
                { name: "department_code", label: "Department", options: departments },
                { name: "programme_code", label: "Programme", options: programmes, dependsOn: "department_code" },
                { name: "specialization_code", label: "Specialization", options: specs, dependsOn: "programme_code", optional: true },
                { name: "start_year", label: "Start Date", type: "date" },
                { name: "expected_end_year", label: "Expected End Date", type: "date" },
            ]}
        />
    );
}
