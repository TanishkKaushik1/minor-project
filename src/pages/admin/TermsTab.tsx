import ResourcePanel from "./ResourcePanel";
import { listTerms, createTerm, deleteTerm } from "../../api/admin";

export default function TermsTab() {
    return (
        <ResourcePanel
            title="Term"
            list={listTerms}
            create={createTerm}
            columns={["id", "name", "start_date", "end_date", "is_active"]}
            fields={[
                { name: "name", label: "Name" },
                { name: "start_date", label: "Start Date", type: "date" },
                { name: "end_date", label: "End Date", type: "date" },
                { name: "is_active", label: "Active", type: "checkbox" },
            ]}
            remove={deleteTerm}
        />
    );
}