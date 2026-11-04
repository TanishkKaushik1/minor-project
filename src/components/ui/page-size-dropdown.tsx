// src/components/ui/page-size-dropdown.tsx
import { ChevronDown } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuCheckboxItem,
} from "./dropdown-menu";

interface PageSizeDropdownProps {
    value: number;
    onChange: (size: number) => void;
    options?: number[];
}

export function PageSizeDropdown({
    value,
    onChange,
    options = [10, 15, 25, 50, 100],
}: PageSizeDropdownProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-md text-xs font-medium text-slate-800 outline-none cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-300 active:scale-[0.98]"
            >
                <span>{value}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="start"
                sideOffset={4}
                className="w-32 bg-white border border-slate-200 shadow-lg rounded-lg p-1 z-50 text-slate-900"
            >
                <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-xs font-medium text-slate-500 px-2 py-1">
                        Rows per page
                    </DropdownMenuLabel>
                    {options.map((opt) => (
                        <DropdownMenuCheckboxItem
                            key={opt}
                            checked={value === opt}
                            onCheckedChange={() => onChange(opt)}
                            className="cursor-pointer font-normal text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                        >
                            {opt} rows
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default PageSizeDropdown;
