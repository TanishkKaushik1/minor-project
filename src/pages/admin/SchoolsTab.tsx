import ResourcePanel from "./ResourcePanel";
import { listSchools, createSchool, deleteSchool } from "../../api/admin";

export default function SchoolsTab() {
    return (
        <ResourcePanel
            title="School"
            list={listSchools}
            create={createSchool}
            remove={deleteSchool}
            columns={["id", "code", "name"]}
            fields={[
                { name: "code", label: "School Code (e.g. SOICT, SOE)", upper: true },
                { name: "name", label: "School Name (e.g. School of Information & Communication Technology)" },
            ]}
        />
    );
}
