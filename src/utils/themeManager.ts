// src/utils/themeManager.ts

export type ThemeMode = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "gbu_theme";

export function getStoredTheme(): ThemeMode {
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored === "light" || stored === "dark" || stored === "system") {
            return stored;
        }
    } catch {
        // ignore localStorage access issues
    }
    return "system";
}

export function isSystemDark(): boolean {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveEffectiveTheme(mode: ThemeMode): "light" | "dark" {
    if (mode === "system") {
        return isSystemDark() ? "dark" : "light";
    }
    return mode;
}

export function applyTheme(mode: ThemeMode): void {
    if (typeof document === "undefined") return;

    const effective = resolveEffectiveTheme(mode);
    const root = document.documentElement;

    if (effective === "dark") {
        root.classList.add("dark");
        root.style.colorScheme = "dark";
    } else {
        root.classList.remove("dark");
        root.style.colorScheme = "light";
    }

    // Dispatch custom event for reactive UI hooks
    window.dispatchEvent(new CustomEvent("gbu_theme_change", { detail: { mode, effective } }));
}

export function saveTheme(mode: ThemeMode): void {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
        // ignore
    }
    applyTheme(mode);
}

export function toggleTheme(): "light" | "dark" {
    const current = getStoredTheme();
    const effective = resolveEffectiveTheme(current);
    const next: ThemeMode = effective === "dark" ? "light" : "dark";
    saveTheme(next);
    return next;
}

// Listen for OS system theme changes
if (typeof window !== "undefined") {
    // Initial application on bundle load to eliminate flash
    applyTheme(getStoredTheme());

    if (window.matchMedia) {
        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
            const current = getStoredTheme();
            if (current === "system") {
                applyTheme("system");
            }
        });
    }
}
