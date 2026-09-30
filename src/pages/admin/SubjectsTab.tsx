import ResourcePanel from "./ResourcePanel";
import { listSubjects, createSubject, deleteSubject } from "../../api/admin";

export default function SubjectsTab() {
    return (
        <ResourcePanel
            title="Subject"
            list={listSubjects}
            create={createSubject}
            columns={["id", "course_code", "name", "is_elective"]}
            fields={[
                { name: "course_code", label: "Course Code" },
                { name: "name", label: "Name" },
                { name: "is_elective", label: "Elective", type: "checkbox" },
            ]}
            remove={deleteSubject}
        />
    );
}