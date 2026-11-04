// src/components/ui/date-picker.tsx
import * as React from "react";
import { format, parseISO, isValid } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "./calendar";

export interface DatePickerProps {
    value?: string | null; // e.g. "2026-10-19"
    onChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    clearable?: boolean;
    align?: "left" | "right";
    label?: string;
    required?: boolean;
}

export function DatePicker({
    value,
    onChange,
    placeholder = "Select date",
    className = "",
    disabled = false,
    clearable = true,
    align = "left",
    label,
    required = false,
}: DatePickerProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Parse incoming value string to a local Date object safely
    const selectedDate = React.useMemo(() => {
        if (!value) return undefined;
        try {
            // "YYYY-MM-DD" parsing without UTC offset shifts
            const parts = value.split("-");
            if (parts.length === 3) {
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const day = parseInt(parts[2], 10);
                const d = new Date(year, month, day);
                return isValid(d) ? d : undefined;
            }
            const d = parseISO(value);
            return isValid(d) ? d : undefined;
        } catch {
            return undefined;
        }
    }, [value]);

    // Close on click outside
    React.useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen]);

    const handleSelect = (date: Date | undefined) => {
        if (!date) {
            onChange?.("");
        } else {
            const formatted = format(date, "yyyy-MM-dd");
            onChange?.(formatted);
        }
        setIsOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange?.("");
        setIsOpen(false);
    };

    const handleToday = (e: React.MouseEvent) => {
        e.stopPropagation();
        const today = new Date();
        onChange?.(format(today, "yyyy-MM-dd"));
        setIsOpen(false);
    };

    const displayDate = selectedDate ? format(selectedDate, "MMM d, yyyy") : "";

    return (
        <div className="relative inline-block w-full" ref={containerRef}>
            {label && (
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen((prev) => !prev)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs font-medium text-slate-900 border rounded-2xl transition-all outline-none ${
                    isOpen
                        ? "border-blue-500 ring-4 ring-blue-500/10 bg-white"
                        : "border-slate-200"
                } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}
            >
                <div className="flex items-center gap-2.5 truncate">
                    <CalendarIcon className="h-4 w-4 text-blue-600 shrink-0" />
                    <span className={displayDate ? "text-slate-900 font-semibold" : "text-slate-400"}>
                        {displayDate || placeholder}
                    </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {clearable && value && !disabled && (
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={handleClear}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    handleClear(e as any);
                                }
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                            title="Clear date"
                        >
                            <X className="h-3 w-3" />
                        </span>
                    )}
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute z-50 mt-2 p-3 bg-white rounded-3xl border border-slate-200 shadow-2xl ${
                            align === "right" ? "right-0" : "left-0"
                        }`}
                    >
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleSelect}
                            autoFocus
                            captionLayout="dropdown"
                            startMonth={new Date(2000, 0)}
                            endMonth={new Date(2045, 11)}
                        />

                        {/* Quick action footer */}
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                            <button
                                type="button"
                                onClick={handleToday}
                                className="px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                Today
                            </button>
                            {value && (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default DatePicker;
