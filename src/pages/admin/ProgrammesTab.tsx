import ResourcePanel from "./ResourcePanel";
import type { Row } from "./ResourcePanel";
import {
    listProgrammes,
    createProgramme,
    updateProgramme,
    deleteProgramme,
    createSpecialization,
    listDepartments,
    listSchools,
} from "../../api/admin";

const NA = "NA";
const ADD = "ADD";

const schools = () =>
    listSchools().then((s) => [
        { value: "ALL", label: "All Schools (Show All Departments)" },
        ...s.map((x) => ({ value: x.code, label: `${x.code} · ${x.name}` })),
    ]);

const departments = (v: Record<string, string>) => {
    const sc = v.school_code && v.school_code !== "ALL" ? v.school_code : undefined;
    return listDepartments(sc).then((d) =>
        d.map((x) => ({
            value: x.code,
            label: `${x.code} · ${x.name}${x.school_code ? ` [${x.school_code}]` : ""}`,
        }))
    );
};

const specMode = () =>
    Promise.resolve([
        { value: NA, label: "N/A (General Degree)" },
        { value: ADD, label: "Add specialization…" },
    ]);

// ponytail: not atomic. If the specialization call fails the programme still exists (the error says so).
const create = async ({ spec_mode, spec_name, spec_code, school_code: _s, ...body }: Row) => {
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

const editFields = [
    {
        name: "department_code",
        label: "Department",
        options: departments,
        placeholder: "Select department...",
    },
    { name: "code", label: "Code", upper: true, placeholder: "e.g. BCA, BTECH-CSE" },
    { name: "name", label: "Name", placeholder: "e.g. Bachelor of Computer Applications" },
    { name: "total_semesters", label: "Total Semesters", type: "number" as const, placeholder: "e.g. 6 or 8" },
];

export default function ProgrammesTab() {
    return (
        <ResourcePanel
            title="Programme"
            list={() => listProgrammes()}
            create={create}
            edit={updateProgramme}
            editFields={editFields}
            remove={deleteProgramme}
            defaults={{ spec_mode: NA, school_code: "ALL" }}
            columns={["id", "code", "name", "department_code", "total_semesters"]}
            fields={[
                {
                    name: "school_code",
                    label: "School (Filter)",
                    options: schools,
                    optional: true,
                    placeholder: "Select school to filter departments...",
                },
                {
                    name: "department_code",
                    label: "Department",
                    options: departments,
                    dependsOn: "school_code",
                    placeholder: "Select department...",
                },
                { name: "code", label: "Code", upper: true, placeholder: "e.g. BCA, BTECH-CSE" },
                { name: "name", label: "Name", placeholder: "e.g. Bachelor of Computer Applications" },
                { name: "total_semesters", label: "Total Semesters", type: "number", placeholder: "e.g. 6 or 8" },
                { name: "spec_mode", label: "Specialization", options: specMode },
                { name: "spec_name", label: "Specialization Name", showIf: (v) => v.spec_mode === ADD },
                { name: "spec_code", label: "Specialization Code", upper: true, showIf: (v) => v.spec_mode === ADD },
            ]}
        />
    );
}
