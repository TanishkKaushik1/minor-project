// src/components/ui/form-select.tsx
import { useState, useMemo } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
} from "./dropdown-menu";

export interface SelectOption {
    value: string | number;
    label: string;
}

interface FormSelectProps {
    value?: string | number | null;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    required?: boolean;
    searchable?: boolean;
}

export function FormSelect({
    value,
    onChange,
    options = [],
    placeholder = "Select…",
    className = "",
    disabled = false,
    searchable = true,
}: FormSelectProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const selectedOption = useMemo(() => {
        if (value === undefined || value === null) return null;
        if (value === "") {
            const emptyOpt = options.find((o) => o.value === "");
            if (emptyOpt && emptyOpt.label) return emptyOpt;
            return null;
        }
        return options.find((o) => String(o.value) === String(value)) || null;
    }, [value, options]);

    const filteredOptions = useMemo(() => {
        if (!searchTerm.trim()) return options;
        const q = searchTerm.toLowerCase();
        return options.filter((o) => o.label.toLowerCase().includes(q));
    }, [options, searchTerm]);

    const showSearch = searchable && options.length > 5;

    return (
        <DropdownMenu onOpenChange={(open) => { if (!open) setSearchTerm(""); }}>
            <DropdownMenuTrigger
                type="button"
                disabled={disabled}
                className={`w-full min-h-[38px] px-3 py-2 bg-white hover:bg-slate-50/80 focus:bg-white text-xs font-normal text-slate-900 border border-slate-200 hover:border-slate-300 rounded-md transition-colors outline-none flex items-center justify-between text-left cursor-pointer group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 focus:border-slate-300 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${className}`}
            >
                <span className={`truncate mr-2 ${selectedOption ? "font-medium text-slate-900" : "text-slate-400 font-normal"}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 group-hover:text-slate-600 transition-colors" />
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="start"
                sideOffset={4}
                className="w-(--anchor-width) min-w-[240px] max-w-[500px] max-h-72 overflow-y-auto bg-white border border-slate-200 shadow-lg rounded-lg p-1 z-[300] text-slate-900 custom-scrollbar"
            >
                {showSearch && (
                    <div className="p-1.5 mb-1 border-b border-slate-100 sticky top-0 bg-white z-10">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200 focus-within:border-slate-400 focus-within:bg-white rounded-md transition-colors">
                            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                                style={{ outline: "none", boxShadow: "none" }}
                                className="w-full bg-transparent border-none text-xs font-normal outline-none focus:outline-none focus:ring-0 focus-visible:outline-none text-slate-900 placeholder:text-slate-400 shadow-none ring-0"
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSearchTerm("");
                                    }}
                                    className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-300"
                                    aria-label="Clear search"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <DropdownMenuGroup>
                    {/* Optional empty/reset choice if currently selected */}
                    {selectedOption && selectedOption.value !== "" && (
                        <DropdownMenuItem
                            onClick={() => onChange("")}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer border-b border-slate-100 mb-1 transition-colors"
                        >
                            <X className="h-3 w-3 text-slate-400" />
                            <span>Clear selection</span>
                        </DropdownMenuItem>
                    )}

                    {filteredOptions.length === 0 ? (
                        <div className="px-3 py-6 text-center text-xs text-slate-400 font-normal">
                            No options found
                        </div>
                    ) : (
                        filteredOptions.map((opt) => {
                            const isSelected = String(opt.value) === String(value);
                            return (
                                <DropdownMenuItem
                                    key={String(opt.value)}
                                    onClick={() => onChange(String(opt.value))}
                                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-colors outline-none ${
                                        isSelected
                                            ? "bg-slate-100 text-slate-900 font-medium"
                                            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-normal"
                                    }`}
                                >
                                    <span className="truncate mr-2">{opt.label}</span>
                                    {isSelected && <Check className="h-3.5 w-3.5 text-slate-900 shrink-0 ml-auto stroke-[2.5]" />}
                                </DropdownMenuItem>
                            );
                        })
                    )}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default FormSelect;
