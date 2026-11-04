// src/utils/csvParser.ts
import * as XLSX from "xlsx";

export interface ParsedCsvStudent {
    roll_number: string;
    full_name: string;
    email: string;
    original_email?: string;
    mobile?: string;
    section_hint?: string;
}

export interface CsvPreambleHints {
    school_hint?: string;
    programme_hint?: string;
    batch_hint?: string;
    section_hint?: string;
}

export interface CsvParseResult {
    students: ParsedCsvStudent[];
    hints: CsvPreambleHints;
    total_rows_scanned: number;
    skipped_rows: number;
    header_row_index: number;
}

/**
 * Standard RFC 4180 CSV parser that correctly handles:
 * - Multiline quoted fields (e.g. addresses, preamble headers)
 * - Escaped quotes ("")
 * - Commas within quotes
 */
export function parseCsvToGrid(text: string): string[][] {
    const grid: string[][] = [];
    let row: string[] = [];
    let current = "";
    let insideQuotes = false;
    let i = 0;

    while (i < text.length) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (insideQuotes) {
            if (char === '"') {
                if (nextChar === '"') {
                    // Escaped quote
                    current += '"';
                    i += 2;
                    continue;
                } else {
                    // Closing quote
                    insideQuotes = false;
                    i++;
                    continue;
                }
            } else {
                current += char;
                i++;
                continue;
            }
        } else {
            if (char === '"') {
                insideQuotes = true;
                i++;
                continue;
            } else if (char === ',') {
                row.push(current.trim());
                current = "";
                i++;
                continue;
            } else if (char === '\r') {
                if (nextChar === '\n') {
                    i++;
                }
                row.push(current.trim());
                grid.push(row);
                row = [];
                current = "";
                i++;
                continue;
            } else if (char === '\n') {
                row.push(current.trim());
                grid.push(row);
                row = [];
                current = "";
                i++;
                continue;
            } else {
                current += char;
                i++;
                continue;
            }
        }
    }

    if (current || row.length > 0) {
        row.push(current.trim());
        grid.push(row);
    }

    return grid;
}

/**
 * Parses a generic 2D grid of strings (from CSV or Excel), extracts student profiles,
 * and extracts any school/programme/batch/section hints.
 */
export function parseStudentGrid(grid: string[][]): CsvParseResult {
    const hints: CsvPreambleHints = {};

    // 1. Scan the top 10 rows for preamble text / hints
    for (let r = 0; r < Math.min(10, grid.length); r++) {
        const fullRowText = grid[r].join(" ");
        if (!fullRowText.trim()) continue;

        // School hint
        if (/school of ict|soict/i.test(fullRowText)) hints.school_hint = "SOICT";
        else if (/school of engineering|soe/i.test(fullRowText)) hints.school_hint = "SOE";
        else if (/school of management|som/i.test(fullRowText)) hints.school_hint = "SOM";
        else if (/school of biotechnology|sobt/i.test(fullRowText)) hints.school_hint = "SOBT";

        // Programme hint
        if (/b\.?tech\.?\s*\(?cse\)?/i.test(fullRowText)) hints.programme_hint = "CSE";
        else if (/b\.?tech\.?\s*\(?ece\)?/i.test(fullRowText)) hints.programme_hint = "ECE";
        else if (/b\.?tech\.?\s*\(?it\)?/i.test(fullRowText)) hints.programme_hint = "IT";

        // Batch hint (e.g., 2022-2026 or 2024-2028)
        const batchMatch = fullRowText.match(/(\d{4}\s*-\s*\d{4})/);
        if (batchMatch) {
            hints.batch_hint = batchMatch[1].replace(/\s+/g, "");
        }

        // Section hint (e.g., Sec. (A) or Sec A or 4-A)
        const secMatch = fullRowText.match(/sec\.?\s*\(?([A-Za-z0-9\-_]+)\)?/i);
        if (secMatch) {
            hints.section_hint = secMatch[1];
        }
    }

    // 2. Locate the header row containing "Roll" and "Name"
    let headerRowIndex = -1;
    let rollCol = -1;
    let nameCol = -1;
    let emailCol = -1;
    let mobileCol = -1;

    for (let r = 0; r < Math.min(15, grid.length); r++) {
        const row = grid[r].map((c) => String(c ?? "").toLowerCase());
        const tempRollCol = row.findIndex((c) => c.includes("roll"));
        const tempNameCol = row.findIndex(
            (c) => c.includes("name") && !c.includes("father") && !c.includes("mother") && !c.includes("teacher")
        );

        if (tempRollCol !== -1 && tempNameCol !== -1) {
            headerRowIndex = r;
            rollCol = tempRollCol;
            nameCol = tempNameCol;
            emailCol = row.findIndex((c) => c.includes("email") || c.includes("mail"));
            mobileCol = row.findIndex((c) => c.includes("mobile") || c.includes("phone"));
            break;
        }
    }

    if (headerRowIndex === -1) {
        throw new Error(
            "Could not find table header with 'RollNumber' and 'Name' columns. Please check file structure."
        );
    }

    // 3. Extract student records
    const students: ParsedCsvStudent[] = [];
    let skippedCount = 0;
    const seenRolls = new Set<string>();

    for (let r = headerRowIndex + 1; r < grid.length; r++) {
        const row = grid[r];
        if (!row || row.length <= Math.max(rollCol, nameCol)) {
            skippedCount++;
            continue;
        }

        const rollRaw = String(row[rollCol] ?? "").trim();
        const nameRaw = String(row[nameCol] ?? "").trim();
        const emailRaw = emailCol !== -1 ? String(row[emailCol] ?? "").trim() : "";
        const mobileRaw = mobileCol !== -1 ? String(row[mobileCol] ?? "").trim() : "";

        // Skip non-student rows, empty rows, or repeated subheaders
        if (
            !rollRaw ||
            !nameRaw ||
            rollRaw.toLowerCase() === "rollnumber" ||
            rollRaw.toLowerCase() === "roll no" ||
            rollRaw.toLowerCase() === "roll_number" ||
            rollRaw.startsWith("S.N") ||
            nameRaw.toLowerCase() === "name" ||
            rollRaw.toLowerCase().includes("no dues") ||
            nameRaw.toLowerCase().includes("no dues")
        ) {
            skippedCount++;
            continue;
        }

        // Clean roll number (e.g. 225/UCS/002)
        const rollClean = rollRaw.toUpperCase();
        if (seenRolls.has(rollClean)) {
            skippedCount++;
            continue;
        }
        seenRolls.add(rollClean);

        // Clean or synthesize institutional email if blank
        let cleanEmail = emailRaw.toLowerCase();
        const hasValidEmail = cleanEmail.includes("@") && !cleanEmail.includes(" ") && cleanEmail !== "na";

        if (!hasValidEmail) {
            const sanitizedRoll = rollClean.replace(/[^A-Za-z0-9]/g, "").toLowerCase();
            cleanEmail = `${sanitizedRoll}@gbu.ac.in`;
        }

        students.push({
            roll_number: rollClean,
            full_name: nameRaw,
            email: cleanEmail,
            original_email: hasValidEmail ? emailRaw : undefined,
            mobile: mobileRaw && !mobileRaw.toLowerCase().includes("na") ? mobileRaw : undefined,
        });
    }

    return {
        students,
        hints,
        total_rows_scanned: grid.length,
        skipped_rows: skippedCount,
        header_row_index: headerRowIndex,
    };
}

/**
 * Parses raw CSV text into students and preamble hints.
 */
export function parseStudentCsv(rawText: string): CsvParseResult {
    const grid = parseCsvToGrid(rawText);
    return parseStudentGrid(grid);
}

/**
 * Parses Excel (.xlsx / .xls) ArrayBuffer into students and preamble hints.
 */
export function parseStudentExcel(data: ArrayBuffer): CsvParseResult {
    const workbook = XLSX.read(data, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
        throw new Error("Excel file contains no readable sheets.");
    }
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows: (string | number | undefined)[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
        blankrows: false,
    });
    const grid: string[][] = rawRows.map((r) => r.map((c) => String(c ?? "").trim()));
    return parseStudentGrid(grid);
}
