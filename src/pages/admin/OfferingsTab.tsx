import ResourcePanel from "./ResourcePanel";
import { listOfferings, createOffering, listTerms, listSections, listSubjects, listFaculty, deleteOffering } from "../../api/admin";

const terms = () => listTerms().then((t) => t.map((x) => ({ value: x.id, label: x.name })));
const sections = () => listSections().then((s) => s.map((x) => ({ value: x.id, label: `${x.name} (#${x.id})` })));
const subjects = () => listSubjects().then((s) => s.map((x) => ({ value: x.id, label: `${x.course_code} · ${x.name}` })));
const teachers = () => listFaculty().then((f) => f.map((x) => ({ value: x.id, label: `${x.full_name} (${x.role})` })));

export default function OfferingsTab() {
    return (
        <ResourcePanel
            title="Course Offering"
            list={listOfferings}
            create={createOffering}
            columns={["id", "term_name", "section_name", "subject_name", "teacher_name"]}
            fields={[
                { name: "term_id", label: "Term", type: "number", options: terms },
                { name: "section_id", label: "Section", type: "number", options: sections },
                { name: "subject_id", label: "Subject", type: "number", options: subjects },
                { name: "teacher_id", label: "Teacher", type: "number", options: teachers },
            ]}
            remove={deleteOffering}
        />
    );
}