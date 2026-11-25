import ResourcePanel from "./ResourcePanel";
import { listSubjects, createSubject, updateSubject, deleteSubject } from "../../api/admin";

export default function SubjectsTab() {
    return (
        <ResourcePanel
            title="Subject"
            list={listSubjects}
            create={createSubject}
            edit={updateSubject}
            defaults={{
                course_type: "LECTURE",
                credits: "3",
                requires_attendance: "true",
            }}
            columns={["id", "course_code", "name", "course_type", "credits", "requires_attendance", "is_elective"]}
            fields={[
                { name: "course_code", label: "Course Code", upper: true },
                { name: "name", label: "Name" },
                {
                    name: "course_type",
                    label: "Course Type",
                    options: () => Promise.resolve([
                        { value: "LECTURE", label: "Lecture" },
                        { value: "LAB", label: "Lab" },
                        { value: "PROJECT", label: "Project (No Attendance)" },
                        { value: "TRAINING", label: "Training (No Attendance)" },
                        { value: "SEMINAR", label: "Seminar (No Attendance)" },
                    ]),
                },
                { name: "credits", label: "Credits", type: "number", optional: true },
                {
                    name: "requires_attendance",
                    label: "Track Attendance & Include in 75% Criteria",
                    type: "checkbox",
                },
                { name: "is_elective", label: "Elective Course", type: "checkbox" },
            ]}
            remove={deleteSubject}
        />
    );
}
