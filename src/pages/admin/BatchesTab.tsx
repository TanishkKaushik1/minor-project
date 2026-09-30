import ResourcePanel from "./ResourcePanel";
import type { Row } from "./ResourcePanel";
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

// department_code is only a UI filter; the API takes programme_code + specialization_code
const create = ({ department_code: _d, ...batch }: Row) => createBatch(batch as Parameters<typeof createBatch>[0]);

export default function BatchesTab() {
    return (
        <ResourcePanel
            title="Batch"
            list={() => listBatches()}
            create={create}
            remove={deleteBatch}
            columns={["id", "programme_id", "specialization_id", "start_year", "expected_end_year"]}
            fields={[
                { name: "department_code", label: "Department", options: departments },
                { name: "programme_code", label: "Programme", options: programmes, dependsOn: "department_code" },
                { name: "specialization_code", label: "Specialization", options: specs, dependsOn: "programme_code" },
                { name: "start_year", label: "Start Year", type: "number" },
                { name: "expected_end_year", label: "Expected End Year", type: "number" },
            ]}
        />
    );
}