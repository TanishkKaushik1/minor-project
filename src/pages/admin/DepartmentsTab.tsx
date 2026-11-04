import ResourcePanel from "./ResourcePanel";
import { listDepartments, createDepartment, deleteDepartment, listSchools } from "../../api/admin";

const schools = () =>
    listSchools().then((s) => s.map((x) => ({ value: x.code, label: `${x.code} · ${x.name}` })));

export default function DepartmentsTab() {
    return (
        <ResourcePanel
            title="Department"
            list={() => listDepartments()}
            create={createDepartment}
            remove={deleteDepartment}
            columns={["id", "school_code", "code", "name"]}
            fields={[
                { name: "school_code", label: "School", options: schools },
                { name: "code", label: "Code", upper: true },
                { name: "name", label: "Name" },
            ]}
        />
    );
}