// src/pages/admin/UsersTab.tsx
import { useState, useEffect, useCallback } from "react";
import {
    Search,
    UserPlus,
    Filter,
    Mail,
    Loader2,
    RefreshCw,
    Users,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    CheckCircle2,
    XCircle,
    Building2,
    Shield,
    UserPen,
    X
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuCheckboxItem,
} from "../../components/ui/dropdown-menu";
import { PageSizeDropdown } from "../../components/ui/page-size-dropdown";
import { listUsers, deactivateUser, activateUser } from "../../api/admin";
import type { User as UserItem } from "../../api/admin";
import RegisterUserModal from "./RegisterUserModal";
import EditUserRolesModal from "../../components/EditUserRolesModal";
import EditUserProfileModal from "../../components/EditUserProfileModal";

export default function UsersTab() {
    const [users, setUsers] = useState<UserItem[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(25);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);
    const [editingProfileUser, setEditingProfileUser] = useState<UserItem | null>(null);
    const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

    // 350ms Debounce: prevents spamming the API on every keystroke
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm.trim());
            setPage(1);
        }, 350);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Data fetching with active-request tracking
    useEffect(() => {
        let isCurrent = true;
        setLoading(true);

        listUsers(page, size, roleFilter || undefined, debouncedSearch || undefined)
            .then((res) => {
                if (!isCurrent) return;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const items = (res as any)?.items || (Array.isArray(res) ? res : []);
                setUsers(items);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setTotalUsers((res as any)?.total || items.length);
            })
            .catch((err) => {
                if (!isCurrent) return;
                console.error("Failed to load users:", err);
                setNotice({ ok: false, text: "Error connecting to user management API" });
            })
            .finally(() => {
                if (isCurrent) {
                    setLoading(false);
                }
            });

        return () => {
            isCurrent = false;
        };
    }, [page, size, roleFilter, debouncedSearch, refreshTrigger]);

    const refetch = useCallback(() => {
        setRefreshTrigger((k) => k + 1);
    }, []);
    const fetchUsers = refetch;

    const filteredUsers = users;
    const totalPages = Math.max(1, Math.ceil(totalUsers / size));

    const handleToggleStatus = async (user: UserItem) => {
        setActionLoading(user.id);
        setNotice(null);
        try {
            if (user.is_active) {
                if (confirm(`Deactivate account for ${user.full_name}?`)) {
                    await deactivateUser(user.id);
                    setNotice({ ok: true, text: `Deactivated ${user.full_name}` });
                }
            } else {
                await activateUser(user.id);
                setNotice({ ok: true, text: `Reactivated ${user.full_name}` });
            }
            refetch();
        } catch (err) {
            setNotice({ ok: false, text: err instanceof Error ? err.message : "Failed to update user status" });
        } finally {
            setActionLoading(null);
        }
    };

    const getRoleBadgeStyle = (role: string) => {
        switch (role?.toUpperCase()) {
            case "ADMIN":
                return "bg-rose-50 text-rose-800 border-rose-200";
            case "DEAN":
                return "bg-purple-50 text-purple-800 border-purple-200";
            case "HOD":
                return "bg-blue-50 text-blue-800 border-blue-200";
            case "COORDINATOR":
                return "bg-indigo-50 text-indigo-800 border-indigo-200";
            case "TEACHER":
                return "bg-teal-50 text-teal-800 border-teal-200";
            case "STUDENT":
                return "bg-emerald-50 text-emerald-800 border-emerald-200";
            default:
                return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    return (
        <div className="space-y-4">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
                        User Management
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Maintain and audit university staff, student, and authority accounts.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-medium">
                        <Users className="h-3.5 w-3.5 text-slate-500" />
                        <span>Total: <strong className="tabular-nums font-semibold">{totalUsers}</strong></span>
                    </div>

                    <button
                        onClick={fetchUsers}
                        disabled={loading}
                        className="p-1.5 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                        title="Refresh"
                    >
                        <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? "motion-safe:animate-spin text-blue-600" : ""}`} />
                    </button>

                    <button
                        onClick={() => setIsRegisterModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                    >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Register user</span>
                    </button>
                </div>
            </div>

            {/* Notification Banner */}
            {notice && (
                <div
                    className={`p-3 rounded-md text-xs font-medium flex items-center justify-between border ${
                        notice.ok
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-red-50 text-red-800 border-red-200"
                    }`}
                >
                    <div className="flex items-center gap-2">
                        {notice.ok ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        ) : (
                            <XCircle className="h-4 w-4 shrink-0 text-red-600" />
                        )}
                        <span>{notice.text}</span>
                    </div>
                    <button
                        onClick={() => setNotice(null)}
                        className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            {/* Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <input
                        type="search"
                        placeholder="Search by name, email, or roll number…"
                        className="w-full pl-8 pr-7 h-8.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus:border-blue-600 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                setDebouncedSearch(searchTerm.trim());
                            }
                        }}
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchTerm("");
                                setDebouncedSearch("");
                            }}
                            className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 focus-visible:outline-none"
                            title="Clear search"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                <div className="w-48 shrink-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            className="w-full px-3 h-8.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-700 outline-none flex items-center justify-between gap-2 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                            <div className="flex items-center gap-2 truncate">
                                <Filter className="h-3.5 w-3.5 text-blue-700 shrink-0" />
                                <span className="capitalize">{roleFilter ? roleFilter.toLowerCase() : "All roles"}</span>
                            </div>
                            <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-white border border-slate-200 rounded-md p-1 z-50">
                            <DropdownMenuGroup>
                                <DropdownMenuLabel className="text-[11px] font-semibold text-slate-500 px-2 py-1">
                                    Filter by role
                                </DropdownMenuLabel>
                                <DropdownMenuCheckboxItem
                                    checked={roleFilter === ""}
                                    onCheckedChange={() => {
                                        setRoleFilter("");
                                        setPage(1);
                                    }}
                                >
                                    All roles
                                </DropdownMenuCheckboxItem>
                                {["ADMIN", "DEAN", "HOD", "COORDINATOR", "TEACHER", "STUDENT"].map((r) => (
                                    <DropdownMenuCheckboxItem
                                        key={r}
                                        checked={roleFilter === r}
                                        onCheckedChange={() => {
                                            setRoleFilter(roleFilter === r ? "" : r);
                                            setPage(1);
                                        }}
                                    >
                                        <span className="capitalize">{r.toLowerCase()}</span>
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left min-w-[900px]">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                            <tr>
                                <th className="px-3 py-2.5 w-14 text-center font-semibold text-slate-600">S.No.</th>
                                <th className="px-4 py-2.5 font-semibold text-slate-600">Identification</th>
                                <th className="px-4 py-2.5 font-semibold text-slate-600">Assigned roles</th>
                                <th className="px-4 py-2.5 font-semibold text-slate-600">Scope / student info</th>
                                <th className="px-4 py-2.5 text-center font-semibold text-slate-600">Account status</th>
                                <th className="px-4 py-2.5 text-right font-semibold text-slate-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center">
                                        <Loader2 className="h-6 w-6 motion-safe:animate-spin text-blue-600 mx-auto" />
                                        <p className="text-xs text-slate-500 mt-2 font-medium">Loading accounts…</p>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500 text-xs font-medium">
                                        No users matching filters
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u, idx) => {
                                    const userRoles = u.roles && u.roles.length > 0 ? u.roles : (u.role ? [u.role] : []);

                                    return (
                                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-3 py-2.5 text-center font-mono tabular-nums text-slate-500 text-xs">
                                                {(page - 1) * size + idx + 1}
                                            </td>

                                            <td className="px-4 py-2.5">
                                                <div>
                                                    <span className="font-medium text-slate-900 block text-xs">
                                                        {u.full_name}
                                                    </span>
                                                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                                        <Mail className="h-3 w-3 text-slate-400" />
                                                        <span>{u.email}</span>
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-4 py-2.5">
                                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                    {userRoles.map((r) => (
                                                        <span
                                                            key={r}
                                                            className={`inline-block px-1.5 py-0.2 rounded text-[11px] font-medium border capitalize ${getRoleBadgeStyle(
                                                                r
                                                            )}`}
                                                        >
                                                            {r.toLowerCase()}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>

                                            <td className="px-4 py-2.5">
                                                {userRoles.includes("STUDENT") ? (
                                                    <div>
                                                        <span className="font-mono tabular-nums text-slate-800 font-medium block">
                                                            {u.roll_number || "No roll"}
                                                        </span>
                                                        <span className="text-[11px] text-slate-400 font-normal">
                                                            Batch #{u.batch_id || "Unassigned"}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-slate-600">
                                                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                                        <span className="text-xs">
                                                            {u.scope_type === "SECTION"
                                                                ? `Section #${u.scope_id || "Unassigned"}`
                                                                : `${u.scope_type} ${u.scope_id ? `(#${u.scope_id})` : ""}`}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-4 py-2.5 text-center">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                                                        u.is_active
                                                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                                            : "bg-slate-100 text-slate-600 border border-slate-200"
                                                    }`}
                                                >
                                                    {u.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </td>

                                            <td className="px-4 py-2.5 text-right whitespace-nowrap">
                                                <div className="inline-flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => setEditingProfileUser(u)}
                                                        className="px-2 py-0.5 rounded text-xs font-medium border border-indigo-200 text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100 transition-colors inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 active:scale-[0.98]"
                                                        title="Edit User Profile & Password"
                                                    >
                                                        <UserPen className="h-3 w-3 text-indigo-700 shrink-0" />
                                                        <span>Edit</span>
                                                    </button>

                                                    <button
                                                        onClick={() => setEditingUser(u)}
                                                        className="px-2 py-0.5 rounded text-xs font-medium border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 active:scale-[0.98]"
                                                        title="Edit User Roles & Scopes"
                                                    >
                                                        <Shield className="h-3 w-3 text-blue-700 shrink-0" />
                                                        <span>Roles</span>
                                                    </button>

                                                    <button
                                                        onClick={() => handleToggleStatus(u)}
                                                        disabled={actionLoading === u.id}
                                                        className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 active:scale-[0.98] ${
                                                            u.is_active
                                                                ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 focus-visible:ring-red-500"
                                                                : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 focus-visible:ring-emerald-500"
                                                        }`}
                                                    >
                                                        {actionLoading === u.id ? (
                                                            <Loader2 className="h-3 w-3 motion-safe:animate-spin inline" />
                                                        ) : u.is_active ? (
                                                            "Deactivate"
                                                        ) : (
                                                            "Activate"
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination and Status Footer */}
                <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 text-slate-600 font-medium">
                        <span>
                            Showing <strong className="text-slate-900 tabular-nums">{totalUsers === 0 ? 0 : (page - 1) * size + 1}</strong> to <strong className="text-slate-900 tabular-nums">{Math.min(page * size, totalUsers)}</strong> of <strong className="text-slate-900 tabular-nums">{totalUsers}</strong> accounts
                        </span>
                        <span className="text-slate-300">|</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-500">Per page:</span>
                            <PageSizeDropdown
                                value={size}
                                onChange={(newSize) => {
                                    setSize(newSize);
                                    setPage(1);
                                }}
                                options={[10, 15, 25, 50, 100]}
                            />
                        </div>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 active:scale-[0.98]"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                                <span>Previous</span>
                            </button>

                            <div className="flex items-center gap-0.5">
                                {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                    .reduce<(number | string)[]>((acc, p, idx, arr) => {
                                        if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) {
                                            acc.push("…");
                                        }
                                        acc.push(p);
                                        return acc;
                                    }, [])
                                    .map((p, idx) =>
                                        p === "…" ? (
                                            <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 text-xs">
                                                …
                                            </span>
                                        ) : (
                                            <button
                                                key={`page-${p}`}
                                                onClick={() => setPage(p as number)}
                                                className={`w-7 h-7 rounded text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 ${
                                                    page === p
                                                        ? "bg-blue-700 text-white font-semibold"
                                                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        )
                                    )}
                            </div>

                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 active:scale-[0.98]"
                            >
                                <span>Next</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <RegisterUserModal
                isOpen={isRegisterModalOpen}
                onClose={() => setIsRegisterModalOpen(false)}
                onSuccess={fetchUsers}
            />

            <EditUserRolesModal
                isOpen={!!editingUser}
                user={editingUser}
                onClose={() => setEditingUser(null)}
                onSuccess={fetchUsers}
            />

            <EditUserProfileModal
                isOpen={!!editingProfileUser}
                user={editingProfileUser}
                onClose={() => setEditingProfileUser(null)}
                onSuccess={(msg) => {
                    setNotice({ ok: true, text: msg });
                    refetch();
                }}
            />
        </div>
    );
}
