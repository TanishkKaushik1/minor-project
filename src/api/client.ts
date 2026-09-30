const BASE_URL = import.meta.env.VITE_API_URL;
if (!BASE_URL) throw new Error("VITE_API_URL is not set");

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
    const refresh_token = localStorage.getItem("refresh_token");
    if (!refresh_token) return false;
    try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        return true;
    } catch {
        return false;
    }
}

export async function apiFetch(path: string, options: RequestInit = {}, _retried = false): Promise<any> {
    const token = localStorage.getItem("access_token");
    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    // ponytail: a 403 here also triggers a refresh+retry even though a valid
    // token with insufficient permissions won't be fixed by refreshing — it
    // just costs one extra round trip before falling through to logout below.
    // Upgrade by distinguishing "expired" from "forbidden" once the backend
    // returns a distinguishable error code for each.
    if ((res.status === 401 || res.status === 403) && !_retried) {
        refreshPromise ??= tryRefresh().finally(() => { refreshPromise = null; });
        if (await refreshPromise) return apiFetch(path, options, true);
    }

    if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("active_role");
        window.location.href = "/login";
        return;
    }

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? "Request failed");
    }

    return res.json();
}
