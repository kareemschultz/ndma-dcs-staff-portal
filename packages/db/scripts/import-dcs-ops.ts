#!/usr/bin/env bun
/**
 * import-dcs-ops.ts
 * Reads DCS OPS xlsx files and seeds production data:
 *   - ppeIssuances         (PPE&IndividualTools spreadsheet, "Summary" sheet)
 *   - attendanceExceptions (TimeOffSickDays spreadsheet, *-TOSD sheets)
 *   - callouts             (TimeOffSickDays spreadsheet, "2023-Callout" sheet)
 *
 * Run: bun --env-file=../../apps/server/.env scripts/import-dcs-ops.ts
 */

import ExcelJS from "exceljs";
import { eq } from "drizzle-orm";
import { db } from "../src/index";
import { staffProfiles } from "../src/schema/staff";
import { user } from "../src/schema/auth";
import { ppeItems, ppeIssuances } from "../src/schema/ppe";
import { attendanceExceptions } from "../src/schema/attendance-exceptions";
import { callouts } from "../src/schema/callouts";

// ─── File Paths ──────────────────────────────────────────────────────────────

const PPE_FILE =
  "/home/karetech/projects/ndma-dcs-staff-portal/DCS OPS/DCS Staff/PPE&IndividualTools_20240726_v01.xlsx";

const TOSD_FILE =
  "/home/karetech/projects/ndma-dcs-staff-portal/DCS OPS/Shared-Everyone/TimeOffSickDays_20251010_v01.xlsx";

// ─── PPE Column → item code mapping ─────────────────────────────────────────

const PPE_COLUMN_CODE: Record<string, string> = {
  "Long Boots": "long_boots",
  Overalls: "overalls",
  Mousepad: "mousepad",
  "Safety Boots": "safety_boots",
  Bag: "bag",
  Screwdriver: "screwdriver",
  "DB9-RJ45": "db9_rj45",
  "DB9-USB": "db9_usb",
  Monitor: "monitor",
  "HDMI to Monitor": "hdmi_cable",
  Laptop: "laptop",
  MiFi: "mifi",
  "CUG Phone": "cug_phone",
  "CUG Sim": "cug_sim",
  "NDMA Shirts": "ndma_shirts",
  "USB To Ethernet": "usb_ethernet",
  Umbrella: "umbrella",
};

// ─── Attendance exception type mapping ───────────────────────────────────────

type AttendanceExceptionType =
  | "reported_sick"
  | "medical"
  | "absent"
  | "lateness"
  | "wfh"
  | "early_leave"
  | "other";

function mapExceptionType(raw: string): AttendanceExceptionType {
  const v = raw.trim().toLowerCase();
  if (v === "reported sick") return "reported_sick";
  if (v === "medical") return "medical";
  if (v === "time off") return "other";
  if (v === "work from home") return "wfh";
  if (v === "absent") return "absent";
  if (v === "lateness") return "lateness";
  if (v === "early leave") return "early_leave";
  return "other";
}

// ─── Cell helpers ─────────────────────────────────────────────────────────────

/** Safely extract a cell value as a plain string */
function cellStr(cell: ExcelJS.Cell): string {
  const v = cell.value;
  if (v === null || v === undefined) return "";
  if (typeof v === "object" && "richText" in (v as object)) {
    return (v as ExcelJS.CellRichTextValue).richText
      .map((r: { text: string }) => r.text)
      .join("")
      .trim();
  }
  if (typeof v === "object" && "result" in (v as object)) {
    return String((v as ExcelJS.CellFormulaValue).result ?? "").trim();
  }
  return String(v).trim();
}

/** Safely extract a cell value as a Date (or null) */
function cellDate(cell: ExcelJS.Cell): Date | null {
  const v = cell.value;
  if (v instanceof Date) return v;
  if (typeof v === "string" && v) {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/** Safely extract a numeric cell value */
function cellNum(cell: ExcelJS.Cell): number | null {
  const v = cell.value;
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim()) {
    const n = parseFloat(v.trim());
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

// ─── Date/time helpers ────────────────────────────────────────────────────────

/** Format any date-like value as "YYYY-MM-DD" */
function toDateString(value: unknown): string | null {
  if (!value) return null;
  let d: Date;
  if (value instanceof Date) {
    d = value;
  } else if (typeof value === "number") {
    // Excel date serial (days since 1900-01-00, with leap-year bug)
    d = new Date((value - 25569) * 86400000);
  } else if (typeof value === "string") {
    d = new Date(value);
  } else {
    return null;
  }
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Combine a date value and a time cell value into a single UTC Date.
 * ExcelJS represents time-of-day cells as Date objects with the time portion set
 * relative to the Excel epoch (1899-12-30), so we read UTC hours/minutes from it.
 */
function combineDateTime(dateVal: unknown, timeVal: unknown): Date | null {
  const dateStr = toDateString(dateVal);
  if (!dateStr) return null;

  let hours = 0;
  let minutes = 0;

  if (timeVal instanceof Date) {
    hours = timeVal.getUTCHours();
    minutes = timeVal.getUTCMinutes();
  } else if (typeof timeVal === "number") {
    // Fractional day: 0.5 = noon
    const totalMinutes = Math.round(timeVal * 24 * 60);
    hours = Math.floor(totalMinutes / 60) % 24;
    minutes = totalMinutes % 60;
  } else if (typeof timeVal === "string") {
    const parts = timeVal.split(":");
    hours = parseInt(parts[0] ?? "0", 10);
    minutes = parseInt(parts[1] ?? "0", 10);
  }

  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCHours(hours, minutes, 0, 0);
  return d;
}

// ─── Staff name resolution ────────────────────────────────────────────────────

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

async function loadStaffMap(): Promise<Map<string, string>> {
  const rows = await db
    .select({ id: staffProfiles.id, name: user.name })
    .from(staffProfiles)
    .innerJoin(user, eq(staffProfiles.userId, user.id));

  const map = new Map<string, string>();

  for (const row of rows) {
    if (!row.name) continue;
    const norm = normalizeName(row.name);
    // Full-name entry (never overwrite — first one wins)
    if (!map.has(norm)) map.set(norm, row.id);

    // First-name-only entry
    const firstName = norm.split(" ")[0];
    if (firstName && !map.has(firstName)) {
      map.set(firstName, row.id);
    }
  }

  return map;
}

function resolveStaffId(
  rawName: string,
  staffMap: Map<string, string>,
): string | null {
  if (!rawName.trim()) return null;
  const norm = normalizeName(rawName);

  // 1. Exact full-name match
  if (staffMap.has(norm)) return staffMap.get(norm)!;

  // 2. First-name-only match (already indexed above)
  const firstName = norm.split(" ")[0];
  if (firstName && staffMap.has(firstName)) return staffMap.get(firstName)!;

  // 3. Prefix match: any indexed key starts with the lookup term or vice-versa
  for (const [key, id] of staffMap.entries()) {
    if (key.startsWith(norm) || norm.startsWith(key)) return id;
  }

  return null;
}

// ─── DB insert result helper ──────────────────────────────────────────────────

function rowsAffected(result: unknown): number {
  if (result && typeof result === "object" && "rowCount" in (result as object)) {
    return (result as { rowCount: number }).rowCount ?? 0;
  }
  return 0;
}

// ─── PPE Import ───────────────────────────────────────────────────────────────

async function importPPE(staffMap: Map<string, string>): Promise<void> {
  console.log("\n── PPE Issuances ──────────────────────────────────────────");

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(PPE_FILE);

  const sheet = wb.getWorksheet("Summary");
  if (!sheet) {
    console.warn("  [WARN] Sheet 'Summary' not found in PPE file — skipping.");
    return;
  }

  // Load ppe_items code → id
  const itemRows = await db
    .select({ id: ppeItems.id, code: ppeItems.code })
    .from(ppeItems);
  const itemCodeMap = new Map(itemRows.map((r) => [r.code, r.id]));

  // Row 1 = headers. Build column index → ppe item code.
  const headerRow = sheet.getRow(1);
  const colIndexToCode = new Map<number, string>();
  headerRow.eachCell((cell, colNum) => {
    if (colNum === 1) return; // "Name" column
    const header = cellStr(cell);
    const code = PPE_COLUMN_CODE[header];
    if (code) colIndexToCode.set(colNum, code);
  });

  // Issuance date taken from the filename (2024-07-26)
  const issuanceDate = "2024-07-26";

  let inserted = 0;
  let skipped = 0;
  let notFound = 0;

  for (let rowNum = 2; rowNum <= sheet.rowCount; rowNum++) {
    const row = sheet.getRow(rowNum);
    const nameRaw = cellStr(row.getCell(1));
    if (!nameRaw) continue;

    const staffId = resolveStaffId(nameRaw, staffMap);
    if (!staffId) {
      console.warn(
        `  [WARN] PPE row ${rowNum}: staff not found for "${nameRaw}" — skipped`,
      );
      notFound++;
      continue;
    }

    for (const [colNum, code] of colIndexToCode.entries()) {
      const rawVal = cellStr(row.getCell(colNum)).trim();

      // Skip blank, "NO", "N/A"
      if (!rawVal) { skipped++; continue; }
      const upper = rawVal.toUpperCase();
      if (upper === "NO" || upper === "N/A") { skipped++; continue; }
      if (!upper.startsWith("YES")) { skipped++; continue; }

      const itemId = itemCodeMap.get(code);
      if (!itemId) {
        console.warn(`  [WARN] PPE item code "${code}" not in DB — skipped`);
        skipped++;
        continue;
      }

      // Extract optional serial number: "Yes-XXXX" → "XXXX"
      let serialNumber: string | null = null;
      const dashIdx = rawVal.indexOf("-");
      if (dashIdx !== -1) {
        const after = rawVal.slice(dashIdx + 1).trim();
        if (after) serialNumber = after;
      }

      try {
        const result = await db
          .insert(ppeIssuances)
          .values({
            ppeItemId: itemId,
            staffProfileId: staffId,
            issuedDate: issuanceDate,
            status: "issued",
            condition: "good",
            serialNumber,
          })
          .onConflictDoNothing();

        if (rowsAffected(result) > 0) inserted++;
        else skipped++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(
          `  [WARN] PPE insert error staff=${staffId} item=${code}: ${msg}`,
        );
        skipped++;
      }
    }
  }

  console.log(
    `  PPE issuances — inserted: ${inserted}, skipped/conflict: ${skipped}, staff not found: ${notFound}`,
  );
}

// ─── Attendance Exceptions Import ─────────────────────────────────────────────

const TOSD_SHEETS = [
  "2022-TOSD",
  "2023-TOSD",
  "2024-TOSD",
  "2025-TOSD",
  "2026- TOSD",
];

async function importAttendanceExceptions(
  staffMap: Map<string, string>,
): Promise<void> {
  console.log("\n── Attendance Exceptions ──────────────────────────────────");

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(TOSD_FILE);

  let totalInserted = 0;
  let totalSkipped = 0;
  let totalNotFound = 0;

  for (const sheetName of TOSD_SHEETS) {
    const sheet = wb.getWorksheet(sheetName);
    if (!sheet) {
      console.warn(`  [WARN] Sheet "${sheetName}" not found — skipping`);
      continue;
    }

    // Discover column positions from header row
    const headerRow = sheet.getRow(1);
    let colDate = -1;
    let colType = -1;
    let colStaff = -1;
    let colReason = -1;
    let colHours = -1;

    headerRow.eachCell((cell, colNum) => {
      const h = cellStr(cell).toLowerCase();
      if (h === "date") colDate = colNum;
      else if (h === "type") colType = colNum;
      else if (h === "staff") colStaff = colNum;
      else if (h === "reason") colReason = colNum;
      else if (h === "hours") colHours = colNum;
    });

    if (colDate === -1 || colStaff === -1 || colType === -1) {
      console.warn(
        `  [WARN] Sheet "${sheetName}" missing required columns (Date/Type/Staff) — skipping`,
      );
      continue;
    }

    let sheetInserted = 0;
    let sheetSkipped = 0;
    let sheetNotFound = 0;

    for (let rowNum = 2; rowNum <= sheet.rowCount; rowNum++) {
      const row = sheet.getRow(rowNum);

      const dateRaw = cellDate(row.getCell(colDate)) ?? cellStr(row.getCell(colDate));
      const typeRaw = cellStr(row.getCell(colType));
      const staffRaw = cellStr(row.getCell(colStaff));
      const reason =
        colReason !== -1 ? cellStr(row.getCell(colReason)) || null : null;
      const hoursVal = colHours !== -1 ? cellNum(row.getCell(colHours)) : null;

      // Skip completely blank rows
      if (!staffRaw && !typeRaw) continue;

      if (!staffRaw) { sheetSkipped++; continue; }

      const dateStr = toDateString(dateRaw);
      if (!dateStr) {
        console.warn(
          `  [WARN] ${sheetName} row ${rowNum}: invalid date — skipped`,
        );
        sheetSkipped++;
        continue;
      }

      const staffId = resolveStaffId(staffRaw, staffMap);
      if (!staffId) {
        console.warn(
          `  [WARN] ${sheetName} row ${rowNum}: staff not found for "${staffRaw}" — skipped`,
        );
        sheetNotFound++;
        continue;
      }

      const exceptionType = mapExceptionType(typeRaw || "other");
      const hoursStr = hoursVal !== null ? String(hoursVal) : null;

      try {
        const result = await db
          .insert(attendanceExceptions)
          .values({
            staffProfileId: staffId,
            exceptionDate: dateStr,
            exceptionType,
            hours: hoursStr,
            reason,
            status: "approved",
          })
          .onConflictDoNothing();

        if (rowsAffected(result) > 0) sheetInserted++;
        else sheetSkipped++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`  [WARN] ${sheetName} row ${rowNum} insert error: ${msg}`);
        sheetSkipped++;
      }
    }

    console.log(
      `  ${sheetName}: inserted ${sheetInserted}, skipped/conflict ${sheetSkipped}, not found ${sheetNotFound}`,
    );
    totalInserted += sheetInserted;
    totalSkipped += sheetSkipped;
    totalNotFound += sheetNotFound;
  }

  console.log(
    `  Attendance exceptions total — inserted: ${totalInserted}, skipped: ${totalSkipped}, staff not found: ${totalNotFound}`,
  );
}

// ─── Callouts Import ──────────────────────────────────────────────────────────

async function importCallouts(staffMap: Map<string, string>): Promise<void> {
  console.log("\n── Callouts ───────────────────────────────────────────────");

  // Reuse the already-opened workbook from the TOSD file
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(TOSD_FILE);

  const sheet = wb.getWorksheet("2023-Callout");
  if (!sheet) {
    console.warn("  [WARN] Sheet '2023-Callout' not found — skipping");
    return;
  }

  // Discover columns: Name, Date, Start, End, Hours, Comments
  const headerRow = sheet.getRow(1);
  let colName = -1;
  let colDate = -1;
  let colStart = -1;
  let colComments = -1;

  headerRow.eachCell((cell, colNum) => {
    const h = cellStr(cell).toLowerCase();
    if (h === "name") colName = colNum;
    else if (h === "date") colDate = colNum;
    else if (h === "start") colStart = colNum;
    else if (h === "comments") colComments = colNum;
  });

  if (colName === -1 || colDate === -1) {
    console.warn(
      "  [WARN] Callout sheet missing required columns (Name, Date) — skipping",
    );
    return;
  }

  let inserted = 0;
  let skipped = 0;
  let notFound = 0;

  for (let rowNum = 2; rowNum <= sheet.rowCount; rowNum++) {
    const row = sheet.getRow(rowNum);

    const nameRaw = cellStr(row.getCell(colName));
    const dateRaw =
      cellDate(row.getCell(colDate)) ?? cellStr(row.getCell(colDate));
    const startRaw = colStart !== -1 ? row.getCell(colStart).value : null;
    const comments =
      colComments !== -1 ? cellStr(row.getCell(colComments)) || null : null;

    // Skip blank rows
    if (!nameRaw && !comments) continue;
    if (!nameRaw) { skipped++; continue; }

    const staffId = resolveStaffId(nameRaw, staffMap);
    if (!staffId) {
      console.warn(
        `  [WARN] Callout row ${rowNum}: staff not found for "${nameRaw}" — skipped`,
      );
      notFound++;
      continue;
    }

    const calloutAt = combineDateTime(dateRaw, startRaw);
    if (!calloutAt) {
      console.warn(
        `  [WARN] Callout row ${rowNum}: invalid date for "${nameRaw}" — skipped`,
      );
      skipped++;
      continue;
    }

    const reason = comments ?? "Callout (imported)";

    try {
      const result = await db
        .insert(callouts)
        .values({
          staffProfileId: staffId,
          calloutAt,
          calloutType: "manual",
          reason,
          status: "logged",
        })
        .onConflictDoNothing();

      if (rowsAffected(result) > 0) inserted++;
      else skipped++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`  [WARN] Callout row ${rowNum} insert error: ${msg}`);
      skipped++;
    }
  }

  console.log(
    `  Callouts — inserted: ${inserted}, skipped/conflict: ${skipped}, staff not found: ${notFound}`,
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("DCS OPS data import starting...");
  console.log(`  PPE file:  ${PPE_FILE}`);
  console.log(`  TOSD file: ${TOSD_FILE}`);

  const staffMap = await loadStaffMap();
  console.log(`\nLoaded ${staffMap.size} staff name entries from DB`);

  await importPPE(staffMap);
  await importAttendanceExceptions(staffMap);
  await importCallouts(staffMap);

  console.log("\nImport complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
