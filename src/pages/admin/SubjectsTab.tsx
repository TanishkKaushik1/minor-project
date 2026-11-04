import ResourcePanel from "./ResourcePanel";
import { listSubjects, createSubject, deleteSubject } from "../../api/admin";

export default function SubjectsTab() {
    return (
        <ResourcePanel
            title="Subject"
            list={listSubjects}
            create={createSubject}
            columns={["id", "course_code", "name", "course_type", "is_elective"]}
            fields={[
                { name: "course_code", label: "Course Code" },
                { name: "name", label: "Name" },
                {
                    name: "course_type",
                    label: "Course Type",
                    options: () => Promise.resolve([
                        { value: "LECTURE", label: "Lecture" },
                        { value: "LAB", label: "Lab" },
                        { value: "PROJECT", label: "Project" },
                        { value: "TRAINING", label: "Training" },
                        { value: "SEMINAR", label: "Seminar" },
                    ]),
                },
                { name: "is_elective", label: "Elective", type: "checkbox" },
            ]}
            remove={deleteSubject}
        />
    );
}
