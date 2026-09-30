import ResourcePanel from "./ResourcePanel";
import { listSections, createSection, listBatches, listTerms, deleteSection } from "../../api/admin";

// Updated to display the custom batch name you typed, making it easy to select
const batches = () => listBatches().then((b) => b.map((x) => ({
    value: x.id,
    label: `${x.name} (${x.start_year}–${x.expected_end_year})`
})));

const terms = () => listTerms().then((t) => t.map((x) => ({ value: x.id, label: x.name })));

export default function SectionsTab() {
    return (
        <ResourcePanel
            title="Section"
            list={listSections}
            create={createSection}
            fields={[
                { name: "name", label: "Section Name (e.g., CS-IV-A)", type: "text"},
                { name: "batch_id", label: "Batch", type: "number", options: batches },
                { name: "term_id", label: "Term", type: "number", options: terms },
            ]}
            remove={deleteSection}
        />
    );
}