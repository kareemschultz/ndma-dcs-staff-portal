/**
 * parse-excel.ts — Extract all sheets and rows from DCS Excel workbooks
 *
 * Usage: bun scripts/parse-excel.ts [file.xlsx ...]
 *   With no args, processes all .xlsx files in project root.
 *
 * Output: JSON written to scripts/output/<filename>-parsed.json
 * Each entry: { sourceFile, sheetName, originalRow, hidden, values: Record<string, string> }
 */
import ExcelJS from "exceljs";
import { resolve, basename, join } from "path";
import { mkdirSync, writeFileSync } from "fs";

const PROJECT_ROOT = resolve(import.meta.dir, "..");
const OUTPUT_DIR = join(PROJECT_ROOT, "scripts", "output");

const DEFAULT_FILES = [
  "AccountManagementMarch_20260312.xlsx",
  "WorkUpdate_20240118_v01.xlsx",
  "LeaveDates_DCS.xlsx",
  "TemporaryTracker_20241231_v01.xlsx",
];

type ParsedRow = {
  sourceFile: string;
  sheetName: string;
  originalRow: number;
  hidden: boolean;
  values: Record<string, string>;
};

type SheetSummary = {
  sheetName: string;
  totalRows: number;
  visibleRows: number;
  hiddenRows: number;
  columns: string[];
  rows: ParsedRow[];
};

type FileSummary = {
  sourceFile: string;
  sheets: SheetSummary[];
  totalRows: number;
};

function cellToString(cell: ExcelJS.Cell): string {
  if (cell.value === null || cell.value === undefined) return "";

  // Rich text
  if (typeof cell.value === "object" && "richText" in cell.value) {
    return (cell.value as ExcelJS.CellRichTextValue).richText
      .map((r) => r.text)
      .join("");
  }

  // Formula — use the result
  if (typeof cell.value === "object" && "result" in cell.value) {
    const result = (cell.value as ExcelJS.CellFormulaValue).result;
    if (result === null || result === undefined) return "";
    return String(result);
  }

  // Date
  if (cell.value instanceof Date) {
    return cell.value.toISOString().slice(0, 10);
  }

  // Hyperlink
  if (typeof cell.value === "object" && "text" in cell.value) {
    return String((cell.value as ExcelJS.CellHyperlinkValue).text);
  }

  // Shared string / error
  if (typeof cell.value === "object" && "error" in cell.value) {
    return "";
  }

  return String(cell.value).trim();
}

async function parseWorkbook(filePath: string): Promise<FileSummary> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);

  const sourceFile = basename(filePath);
  const sheets: SheetSummary[] = [];

  for (const ws of wb.worksheets) {
    const sheetName = ws.name;

    // Collect header row (first non-empty row with multiple values)
    let headerRowNum = 1;
    let headers: string[] = [];

    // Scan first 5 rows to find the actual header row
    for (let r = 1; r <= Math.min(5, ws.rowCount); r++) {
      const row = ws.getRow(r);
      const vals: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell) => {
        vals.push(cellToString(cell));
      });
      const nonEmpty = vals.filter((v) => v.length > 0);
      if (nonEmpty.length >= 2) {
        headerRowNum = r;
        headers = vals.map((v, i) => (v.trim() ? v.trim() : `Col${i + 1}`));
        break;
      }
    }

    // If no header found, build generic column names from column count
    if (headers.length === 0) {
      const colCount = ws.columnCount || 10;
      headers = Array.from({ length: colCount }, (_, i) => `Col${i + 1}`);
    }

    const parsedRows: ParsedRow[] = [];
    let hiddenCount = 0;

    ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === headerRowNum) return; // skip header

      const isHidden = !!(row as ExcelJS.Row & { hidden?: boolean }).hidden;
      if (isHidden) hiddenCount++;

      const values: Record<string, string> = {};
      let hasData = false;

      row.eachCell({ includeEmpty: true }, (cell, colNum) => {
        const headerKey = headers[colNum - 1] ?? `Col${colNum}`;
        const val = cellToString(cell);
        values[headerKey] = val;
        if (val.trim()) hasData = true;
      });

      // Fill in any header columns not present in row
      for (const h of headers) {
        if (!(h in values)) values[h] = "";
      }

      if (hasData) {
        parsedRows.push({
          sourceFile,
          sheetName,
          originalRow: rowNumber,
          hidden: isHidden,
          values,
        });
      }
    });

    const visibleRows = parsedRows.filter((r) => !r.hidden).length;

    sheets.push({
      sheetName,
      totalRows: parsedRows.length,
      visibleRows,
      hiddenRows: hiddenCount,
      columns: headers.filter((h) => h.trim()),
      rows: parsedRows,
    });

    console.log(
      `  Sheet "${sheetName}": ${parsedRows.length} data rows ` +
        `(${visibleRows} visible, ${hiddenCount} hidden)`
    );
  }

  const totalRows = sheets.reduce((s, sh) => s + sh.totalRows, 0);
  return { sourceFile, sheets, totalRows };
}

async function main() {
  const args = process.argv.slice(2);
  const files =
    args.length > 0
      ? args.map((f) => resolve(f))
      : DEFAULT_FILES.map((f) => join(PROJECT_ROOT, f));

  mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const filePath of files) {
    const name = basename(filePath);
    console.log(`\nParsing: ${name}`);

    try {
      const result = await parseWorkbook(filePath);
      const outFile = join(OUTPUT_DIR, name.replace(".xlsx", "-parsed.json"));
      writeFileSync(outFile, JSON.stringify(result, null, 2));
      console.log(
        `  → ${result.totalRows} total rows across ${result.sheets.length} sheets`
      );
      console.log(`  → Written: ${outFile}`);
    } catch (err) {
      console.error(`  ERROR: ${(err as Error).message}`);
    }
  }

  console.log("\nDone.");
}

main().catch(console.error);
