import { useState, useCallback } from "react";
import ResourcePanel, { btnBad, btnGood } from "./ResourcePanel";
import {
    listUsers,
    createUser,
    deactivateUser,
    activateUser,
    listBatches,
    listDepartments,
    listProgrammes
} from "../../api/admin";

const fixed = (a: string[]) => () => Promise.resolve(a.map((v) => ({ value: v, label: v })));
const departments = () => listDepartments().then((d) => d.map((x) => ({ value: x.id, label: x.name })));
const programmes = () => listProgrammes().then((p) => p.map((x) => ({ value: x.id, label: `${x.code} · ${x.name}` })));
const batches = () => listBatches().then((b) => b.map((x) => ({ value: x.id, label: `${x.name} (${x.start_year})` })));

const handleCreateUser = (formValues: any) => {
    const payload = { ...formValues };

    if (payload.role === "HOD") {
        payload.scope_type = "DEPARTMENT";
        payload.scope_id = payload.department_id;
    } else if (payload.role === "COORDINATOR") {
        payload.scope_type = "PROGRAM";
        payload.scope_id = payload.programme_id;
    } else if (payload.role === "TEACHER") {
        payload.scope_type = "ASSIGNMENT";
        payload.scope_id = null;
    } else if (payload.role === "DEAN") {
        payload.scope_type = "SCHOOL";
        payload.scope_id = null;
    } else {
        payload.scope_type = "UNIVERSITY";
        payload.scope_id = null;
    }

    delete payload.department_id;
    delete payload.programme_id;

    return createUser(payload);
};

export default function UsersTab() {
    // Pagination State
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const size = 50;

    // Wrap the API call to extract items for ResourcePanel and save the total count
    const fetchPaginatedUsers = useCallback(async () => {
        const res = await listUsers(page, size);
        setTotal(res.total);
        return res.items; // Return just the array to ResourcePanel
    }, [page]);

    const totalPages = Math.ceil(total / size);

    return (
        <div className="flex flex-col gap-4">
            {/* Adding key={page} forces ResourcePanel to refetch when the page changes */}
            <ResourcePanel
                key={page}
                title="User"
                list={fetchPaginatedUsers}
                create={handleCreateUser}
                columns={["id", "full_name", "email", "role", "scope_type", "scope_id", "is_active"]}
                defaults={{ role: "TEACHER", scope_type: "UNIVERSITY" }}
                fields={[
                    { name: "full_name", label: "Full Name" },
                    { name: "email", label: "Email", type: "email" },
                    { name: "password", label: "Password", type: "password" },
                    { name: "role", label: "Role", options: fixed(["ADMIN", "DEAN", "HOD", "COORDINATOR", "TEACHER", "STUDENT"]) },

                    { name: "department_id", label: "Department Scope", type: "number", options: departments, optional: true, showIf: (v) => v.role === "HOD" },
                    { name: "programme_id", label: "Programme Scope", type: "number", options: programmes, optional: true, showIf: (v) => v.role === "COORDINATOR" },

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

            {/* Pagination UI rendering below the ResourcePanel */}
            {totalPages > 0 && (
                <div className="flex items-center justify-between bg-white p-4 rounded-md shadow border border-gray-200 mt-2">
                    <button
                        className="px-4 py-2 text-sm font-medium border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-600">
                        Page <span className="font-semibold text-gray-900">{page}</span> of <span className="font-semibold text-gray-900">{totalPages}</span>
                        <span className="ml-2 text-gray-400">({total} total users)</span>
                    </span>
                    <button
                        className="px-4 py-2 text-sm font-medium border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={page === totalPages || total === 0}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}