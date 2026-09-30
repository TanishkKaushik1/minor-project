import ResourcePanel from "./ResourcePanel";
import { listSections, createSection, listBatches, listTerms, deleteSection } from "../../api/admin";

const batches = () => listBatches().then((b) => b.map((x) => ({ value: x.id, label: `#${x.id} · ${x.start_year}–${x.expected_end_year}` })));
const terms = () => listTerms().then((t) => t.map((x) => ({ value: x.id, label: x.name })));

export default function SectionsTab() {
    return (
        <ResourcePanel
            title="Section"
            list={listSections}
            create={createSection}
            fields={[
                { name: "name", label: "Name" },
                { name: "batch_id", label: "Batch", type: "number", options: batches },
                { name: "term_id", label: "Term", type: "number", options: terms },
            ]}
            remove={deleteSection}
        />
    );
}