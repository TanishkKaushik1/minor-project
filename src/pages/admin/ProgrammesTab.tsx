import ResourcePanel from "./ResourcePanel";
import type { Row } from "./ResourcePanel";
import { listProgrammes, createProgramme, deleteProgramme, createSpecialization, listDepartments } from "../../api/admin";

const NA = "NA";
const ADD = "ADD";

const departments = () => listDepartments().then((d) => d.map((x) => ({ value: x.code, label: `${x.code} · ${x.name}` })));
const specMode = () =>
    Promise.resolve([
        { value: NA, label: "N/A (General Degree)" },
        { value: ADD, label: "Add specialization…" },
    ]);

// ponytail: not atomic. If the specialization call fails the programme still exists (the error says so).
const create = async ({ spec_mode, spec_name, spec_code, ...body }: Row) => {
    const p = await createProgramme(body as Parameters<typeof createProgramme>[0]);
    const code = p?.code ?? body.code;
    const spec = spec_mode === ADD
        ? { programme_code: code, name: spec_name, code: spec_code }
        : { programme_code: code, name: "General", code: "GEN-" + code };
    try {
        await createSpecialization(spec);
    } catch (e) {
        throw new Error(`Programme created, but specialization failed: ${e instanceof Error ? e.message : "unknown error"}`);
    }
};

export default function ProgrammesTab() {
    return (
        <ResourcePanel
            title="Programme"
            list={() => listProgrammes()}
            create={create}
            remove={deleteProgramme}
            defaults={{ spec_mode: NA }}
            columns={["id", "code", "name", "department_code", "total_semesters"]}
            fields={[
                { name: "department_code", label: "Department", options: departments },
                { name: "code", label: "Code", upper: true },
                { name: "name", label: "Name" },
                { name: "total_semesters", label: "Total Semesters", type: "number" },
                { name: "spec_mode", label: "Specialization", options: specMode },
                { name: "spec_name", label: "Specialization Name", showIf: (v) => v.spec_mode === ADD },
                { name: "spec_code", label: "Specialization Code", upper: true, showIf: (v) => v.spec_mode === ADD },
            ]}
        />
    );
}