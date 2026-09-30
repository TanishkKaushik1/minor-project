import ResourcePanel from "./ResourcePanel";
import { listDepartments, createDepartment, deleteDepartment } from "../../api/admin";

export default function DepartmentsTab() {
    return (
        <ResourcePanel
            title="Department"
            list={listDepartments}
            create={createDepartment}
            remove={deleteDepartment}
            columns={["id", "code", "name"]}
            fields={[
                { name: "code", label: "Code", upper: true },
                { name: "name", label: "Name" },
            ]}
        />
    );
}