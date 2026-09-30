import ResourcePanel, { btnBad, btnGood } from "./ResourcePanel";
import { listUsers, createUser, deactivateUser, activateUser, listBatches } from "../../api/admin";

const fixed = (a: string[]) => () => Promise.resolve(a.map((v) => ({ value: v, label: v })));
const batches = () => listBatches().then((b) => b.map((x) => ({ value: x.id, label: `#${x.id} · ${x.start_year}–${x.expected_end_year}` })));

export default function UsersTab() {
    return (
        <ResourcePanel
            title="User"
            list={listUsers}
            create={createUser}
            columns={["id", "full_name", "email", "role", "scope_type", "scope_id", "is_active"]}
            defaults={{ role: "TEACHER", scope_type: "UNIVERSITY" }}
            fields={[
                { name: "full_name", label: "Full Name" },
                { name: "email", label: "Email", type: "email" },
                { name: "password", label: "Password", type: "password" },
                { name: "role", label: "Role", options: fixed(["ADMIN", "DEAN", "HOD", "COORDINATOR", "TEACHER", "STUDENT"]) },
                { name: "scope_type", label: "Scope Type", options: fixed(["UNIVERSITY", "SCHOOL", "DEPARTMENT", "PROGRAM", "ASSIGNMENT"]) },
                { name: "scope_id", label: "Scope ID", type: "number", optional: true },
                { name: "roll_number", label: "Roll Number", optional: true, showIf: (v) => v.role === "STUDENT" },
                { name: "batch_id", label: "Batch", type: "number", options: batches, optional: true, showIf: (v) => v.role === "STUDENT" },
            ]}
            rowActions={(u, run) =>
                u.is_active ? (
                    <button
                        className={btnBad}
                        onClick={() => confirm("Deactivate this user?") && run(() => deactivateUser(u.id), `User #${u.id} deactivated`)}
                    >
                        Deactivate
                    </button>
                ) : (
                    <button className={btnGood} onClick={() => run(() => activateUser(u.id), `User #${u.id} activated`)}>
                        Activate
                    </button>
                )
            }
        />
    );
}