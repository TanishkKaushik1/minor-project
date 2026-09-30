import ResourcePanel from "./ResourcePanel";
import { listSpecializations, createSpecialization, deleteSpecialization, listProgrammes } from "../../api/admin";

const programmes = () => listProgrammes().then((p) => p.map((x) => ({ value: x.code, label: `${x.code} · ${x.name}` })));

export default function SpecializationsTab() {
    return (
        <ResourcePanel
            title="Specialization"
            list={() => listSpecializations()}
            create={createSpecialization}
            remove={deleteSpecialization}
            columns={["id", "code", "name", "programme_code"]}
            fields={[
                { name: "programme_code", label: "Programme", options: programmes },
                { name: "code", label: "Code", upper: true },
                { name: "name", label: "Name" },
            ]}
        />
    );
}