// src/utils/typographySettings.ts

export interface TypographySettings {
    fontFamily: string;
    fontScale: number; // percentage, e.g. 100 for 100%
    letterSpacing: string;
    fontWeightAdjustment: "normal" | "medium" | "bold";
}

export interface FontOption {
    id: string;
    name: string;
    stack: string;
    description: string;
    badge: string;
    recommended?: boolean;
}

export const AVAILABLE_FONTS: FontOption[] = [
    {
        id: "inter",
        name: "Inter",
        stack: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        description: "The gold-standard UI typeface. Ultra-crisp, high legibility, clean and modern.",
        badge: "Recommended",
        recommended: true,
    },
    {
        id: "plus-jakarta",
        name: "Plus Jakarta Sans",
        stack: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        description: "Premium contemporary geometric sans with clean shapes and high aesthetic appeal.",
        badge: "Ultra-Modern",
    },
    {
        id: "geist",
        name: "Geist Sans",
        stack: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        description: "Precision-engineered modern developer and dashboard typeface with optimal spacing.",
        badge: "Minimalist Tech",
    },
    {
        id: "outfit",
        name: "Outfit",
        stack: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        description: "Modern, refined geometric sans-serif that gives a fresh, high-end look to screens.",
        badge: "Sleek & Clean",
    },
    {
        id: "poppins",
        name: "Poppins",
        stack: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        description: "Approachable, rounded geometric curves that make interfaces friendly and easy to read.",
        badge: "Friendly Geometric",
    },
    {
        id: "dm-sans",
        name: "DM Sans",
        stack: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        description: "Modern editorial low-contrast sans-serif designed for clean data and dashboard displays.",
        badge: "Editorial Clean",
    },
    {
        id: "roboto-flex",
        name: "Roboto Flex",
        stack: "'Roboto Flex', Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        description: "High-density technical sans with flexible character width, ideal for complex tables.",
        badge: "High Density",
    },
    {
        id: "system",
        name: "System Modern (SF / Segoe)",
        stack: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        description: "Native operating system font stack (San Francisco on Mac/iOS, Segoe UI on Windows).",
        badge: "Zero Latency",
    },
];

export const SPACING_OPTIONS = [
    { id: "-0.02em", label: "Compact / Tight (-0.02em)" },
    { id: "-0.011em", label: "Modern Balanced (-0.011em)", default: true },
    { id: "0em", label: "Standard Neutral (0em)" },
    { id: "0.015em", label: "Spacious (+0.015em)" },
];

export const SCALE_OPTIONS = [
    { value: 92, label: "Compact (92%)" },
    { value: 96, label: "Comfortable (96%)" },
    { value: 100, label: "Default (100%)", default: true },
    { value: 105, label: "Large (105%)" },
    { value: 110, label: "Extra Large (110%)" },
];

const STORAGE_KEY = "gbu_typography_settings";

export const DEFAULT_TYPOGRAPHY_SETTINGS: TypographySettings = {
    fontFamily: "inter",
    fontScale: 100,
    letterSpacing: "-0.011em",
    fontWeightAdjustment: "normal",
};

export function getTypographySettings(): TypographySettings {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return { ...DEFAULT_TYPOGRAPHY_SETTINGS, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.warn("Failed to parse typography settings from storage", e);
    }
    return DEFAULT_TYPOGRAPHY_SETTINGS;
}

export function applyTypographySettings(settings: TypographySettings): void {
    const selectedFont = AVAILABLE_FONTS.find((f) => f.id === settings.fontFamily) || AVAILABLE_FONTS[0];

    const root = document.documentElement;
    root.style.setProperty("--font-primary", selectedFont.stack);
    root.style.setProperty("--font-letter-spacing", settings.letterSpacing);

    // Adjust root font-size scaling
    if (settings.fontScale === 100) {
        root.style.fontSize = "";
    } else {
        root.style.fontSize = `${(settings.fontScale / 100) * 16}px`;
    }

    if (document.body) {
        document.body.style.fontFamily = selectedFont.stack;
        document.body.style.letterSpacing = settings.letterSpacing;
    }
}

export function saveTypographySettings(settings: TypographySettings): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
        console.warn("Failed to save typography settings", e);
    }
    applyTypographySettings(settings);
}

// Auto-apply immediately when script loads so user sees their chosen modern font without flash
if (typeof window !== "undefined") {
    applyTypographySettings(getTypographySettings());
}
