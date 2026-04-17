import { useState, useRef, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Upload,
  Users,
  GraduationCap,
  FileText,
  ClipboardList,
  CalendarOff,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  FileSpreadsheet,
  History,
  XCircle,
  HardHat,
  Clock,
  PhoneCall,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@ndma-dcs-staff-portal/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@ndma-dcs-staff-portal/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ndma-dcs-staff-portal/ui/components/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@ndma-dcs-staff-portal/ui/components/tabs";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ThemeSwitch } from "@/components/theme-switch";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/import/")({
  component: ImportPage,
});

// ── Types ──────────────────────────────────────────────────────────────────

type ImportType =
  | "staff"
  | "training"
  | "contracts"
  | "work"
  | "leave"
  | "ppe"
  | "attendance"
  | "callouts";

interface ImportTarget {
  id: ImportType;
  title: string;
  description: string;
  icon: React.ElementType;
  columns: string[];
  requiredColumns: string[];
  sampleRows: string[][];
  notes: string;
}

interface ParsedRow {
  [key: string]: string;
}

interface ValidatedRow {
  data: ParsedRow;
  errors: string[];
}

// ── Config ─────────────────────────────────────────────────────────────────

const IMPORT_TARGETS: ImportTarget[] = [
  {
    id: "staff",
    title: "Staff Profiles",
    description: "Import staff members with their department and employment details.",
    icon: Users,
    columns: ["name", "email", "department", "employmentType"],
    requiredColumns: ["name", "email", "department", "employmentType"],
    notes: "employmentType: full_time | part_time | contract | temporary",
    sampleRows: [
      ["Alice Mensah", "alice.mensah@ndma.gov.gh", "Infrastructure", "full_time"],
      ["Bob Asante", "bob.asante@ndma.gov.gh", "Network Operations", "contract"],
    ],
  },
  {
    id: "training",
    title: "Training Records",
    description: "Bulk import training completions with expiry dates and providers.",
    icon: GraduationCap,
    columns: ["staffEmail", "trainingName", "provider", "completedDate", "expiryDate"],
    requiredColumns: ["staffEmail", "trainingName", "completedDate"],
    notes: "Dates must be in YYYY-MM-DD format. expiryDate is optional.",
    sampleRows: [
      ["alice.mensah@ndma.gov.gh", "Fire Safety", "Safety Pro Ltd", "2025-01-15", "2026-01-15"],
      ["bob.asante@ndma.gov.gh", "First Aid Level 2", "Red Cross", "2025-03-10", "2027-03-10"],
    ],
  },
  {
    id: "contracts",
    title: "Contracts",
    description: "Import contract details including start/end dates and contract type.",
    icon: FileText,
    columns: ["staffEmail", "contractType", "startDate", "endDate"],
    requiredColumns: ["staffEmail", "contractType", "startDate", "endDate"],
    notes: "Dates must be in YYYY-MM-DD format.",
    sampleRows: [
      ["alice.mensah@ndma.gov.gh", "permanent", "2023-01-01", "2026-12-31"],
      ["bob.asante@ndma.gov.gh", "fixed_term", "2025-01-01", "2025-12-31"],
    ],
  },
  {
    id: "work",
    title: "Work Items",
    description: "Bulk import work register items with type and priority.",
    icon: ClipboardList,
    columns: ["title", "type", "priority"],
    requiredColumns: ["title", "type", "priority"],
    notes:
      "type: routine | project | external_request | ad_hoc — priority: low | medium | high | critical",
    sampleRows: [
      ["Quarterly server audit", "routine", "medium"],
      ["Network upgrade Phase 2", "project", "high"],
    ],
  },
  {
    id: "leave",
    title: "Leave Records (2026)",
    description: "Import 2026 approved leave records for existing staff. Only 2026 dates accepted.",
    icon: CalendarOff,
    columns: ["staffEmail", "leaveTypeCode", "startDate", "endDate", "totalDays", "reason"],
    requiredColumns: ["staffEmail", "leaveTypeCode", "startDate", "endDate", "totalDays"],
    notes:
      "Dates MUST be 2026 (YYYY-MM-DD). leaveTypeCode: AL, SL, ML, STL. Staff must already exist — no new staff created.",
    sampleRows: [
      ["alice.mensah@ndma.gov.gh", "AL", "2026-03-03", "2026-03-07", "5", "Annual leave"],
      ["bob.asante@ndma.gov.gh", "SL", "2026-02-10", "2026-02-12", "3", ""],
    ],
  },
  {
    id: "ppe",
    title: "PPE & Tools",
    description: "Import PPE issuance records for staff.",
    icon: HardHat,
    columns: ["staffEmail", "ppeItemCode", "status", "issuedDate", "serialNumber", "size", "notes"],
    requiredColumns: ["staffEmail", "ppeItemCode", "issuedDate"],
    sampleRows: [
      ["joel@ndma.gov.gh", "laptop", "issued", "2024-01-15", "", "", ""],
      ["timothy@ndma.gov.gh", "mifi", "issued", "2024-01-15", "SN-2299", "", ""],
      ["richie@ndma.gov.gh", "safety_boots", "issued", "2024-02-01", "", "42", ""],
    ],
    notes:
      "ppeItemCode: long_boots, overalls, mousepad, safety_boots, bag, screwdriver, db9_rj45, db9_usb, monitor, hdmi_cable, laptop, mifi, cug_phone, cug_sim, ndma_shirts, usb_ethernet, umbrella. status: issued|returned|damaged|lost|replaced",
  },
  {
    id: "attendance",
    title: "Attendance Exceptions",
    description: "Import sick days, lateness, WFH, and other attendance exceptions.",
    icon: Clock,
    columns: ["staffEmail", "exceptionDate", "exceptionType", "reason", "hours", "minutesLate", "notes"],
    requiredColumns: ["staffEmail", "exceptionDate", "exceptionType"],
    sampleRows: [
      ["joel@ndma.gov.gh", "2025-01-06", "reported_sick", "", "8", "", ""],
      ["timothy@ndma.gov.gh", "2025-02-14", "lateness", "Traffic", "", "45", ""],
      ["richie@ndma.gov.gh", "2025-03-01", "wfh", "Remote work approved", "8", "", ""],
    ],
    notes:
      "exceptionType: reported_sick, medical, absent, lateness, wfh, early_leave, other. minutesLate only for lateness type.",
  },
  {
    id: "callouts",
    title: "Callout Register",
    description: "Import emergency callout records.",
    icon: PhoneCall,
    columns: ["staffEmail", "date", "startTime", "endTime", "hours", "comments", "relatedIncidentRef"],
    requiredColumns: ["staffEmail", "date", "hours"],
    sampleRows: [
      ["sachin@ndma.gov.gh", "2023-11-13", "06:00", "09:00", "3", "Livestreaming Cenotaph", ""],
      ["kevin@ndma.gov.gh", "2023-12-03", "18:00", "19:00", "1", "Timehri Fibre Cut", ""],
    ],
    notes:
      "startTime/endTime in HH:MM 24h format. hours is the total duration worked. relatedIncidentRef is optional.",
  },
];

// ── CSV template download ──────────────────────────────────────────────────

function downloadTemplate(target: ImportTarget) {
  const header = target.columns.join(",");
  const rows = target.sampleRows
    .map((row) => row.map((cell) => (cell.includes(",") ? `"${cell}"` : cell)).join(","))
    .join("\n");
  const csv = `${header}\n${rows}`;
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${target.id}_template.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Step indicator ──────────────────────────────────────────────────────────

const STEPS = ["Select Type", "Upload File", "Preview & Validate", "Import"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`size-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                i < current
                  ? "bg-primary border-primary text-primary-foreground"
                  : i === current
                    ? "border-primary text-primary bg-background"
                    : "border-muted text-muted-foreground bg-background"
              }`}
            >
              {i < current ? <CheckCircle className="size-4" /> : i + 1}
            </div>
            <span
              className={`text-xs whitespace-nowrap ${
                i === current ? "text-foreground font-medium" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`h-px w-12 sm:w-20 mx-1 mb-4 transition-colors ${
                i < current ? "bg-primary" : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    partial: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    failed: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    running: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    pending: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-xs font-medium capitalize ${map[status] ?? map.pending}`}
    >
      {status}
    </span>
  );
}

// ── CSV parser ─────────────────────────────────────────────────────────────

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsv(raw: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = parseCsvLine(lines[0]);
  const rows: ParsedRow[] = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: ParsedRow = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? "";
    });
    return row;
  });
  return { headers, rows };
}

// ── Validator ───────────────────────────────────────────────────────────────

function validateRows(rows: ParsedRow[], target: ImportTarget): ValidatedRow[] {
  return rows.map((row) => {
    const errors: string[] = [];
    for (const col of target.requiredColumns) {
      if (!row[col] || row[col].trim() === "") {
        errors.push(`Missing required field: ${col}`);
      }
    }
    return { data: row, errors };
  });
}

// ── Import History tab ─────────────────────────────────────────────────────

function ImportHistory() {
  const { data: jobs, isLoading } = useQuery(
    orpc.import.getHistory.queryOptions({ input: { limit: 30 } }),
  );

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        Loading import history…
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
        <History className="size-10 opacity-30" />
        <p className="text-sm">No imports yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>File</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Rows</TableHead>
            <TableHead className="text-right">Success</TableHead>
            <TableHead className="text-right">Errors</TableHead>
            <TableHead>Imported by</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell className="font-medium capitalize text-sm">
                {job.importType.replace("_", " ")}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">
                {job.fileName ?? "—"}
              </TableCell>
              <TableCell>
                <StatusBadge status={job.status} />
              </TableCell>
              <TableCell className="text-right text-sm">{job.totalRows ?? 0}</TableCell>
              <TableCell className="text-right text-sm text-green-600 dark:text-green-400">
                {job.successCount ?? 0}
              </TableCell>
              <TableCell className="text-right text-sm text-red-600 dark:text-red-400">
                {job.errorCount ?? 0}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {job.createdBy?.name ?? "—"}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(job.createdAt).toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

function ImportPage() {
  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState<ImportTarget | null>(null);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [importResult, setImportResult] = useState<{
    successCount: number;
    errorCount: number;
    status: string;
    errors?: { row: number; field?: string; message: string }[] | null;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importMutation = useMutation(orpc.import.execute.mutationOptions());

  // ── Step 1: select type ────────────────────────────────────────────────

  const handleTypeSelect = (target: ImportTarget) => {
    setSelectedType(target);
    setParsedHeaders([]);
    setParsedRows([]);
    setValidatedRows([]);
    setFileName("");
    setImportResult(null);
  };

  // ── Step 2: file handling ──────────────────────────────────────────────

  const processCsv = useCallback((content: string, name: string) => {
    const { headers, rows } = parseCsv(content);
    setFileName(name);
    setParsedHeaders(headers);
    setParsedRows(rows);
  }, []);

  const handleFileChange = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      processCsv(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) {
      handleFileChange(file);
    } else {
      toast.error("Please drop a CSV file");
    }
  };

  const loadSampleData = () => {
    if (!selectedType) return;
    const header = selectedType.columns.join(",");
    const rows = selectedType.sampleRows.map((r) => r.join(",")).join("\n");
    processCsv(`${header}\n${rows}`, "sample-data.csv");
  };

  // ── Step 3: validate ───────────────────────────────────────────────────

  const handleProceedToValidate = () => {
    if (!selectedType) return;
    setValidatedRows(validateRows(parsedRows, selectedType));
    setStep(2);
  };

  // ── Step 4: import ─────────────────────────────────────────────────────

  const handleImport = async () => {
    if (!selectedType) return;

    const validRows = validatedRows
      .filter((r) => r.errors.length === 0)
      .map((r) => r.data);

    try {
      const result = await importMutation.mutateAsync({
        importType: selectedType.id,
        fileName: fileName || undefined,
        rows: validRows,
      });

      setImportResult({
        successCount: result.successCount ?? 0,
        errorCount: result.errorCount ?? 0,
        status: result.status,
        errors: result.errors as { row: number; field?: string; message: string }[] | null,
      });

      if (result.status === "completed") {
        toast.success(`Imported ${result.successCount} rows successfully`);
      } else if (result.status === "partial") {
        toast.warning(
          `Partial import: ${result.successCount} succeeded, ${result.errorCount} failed`,
        );
      } else {
        toast.error("Import failed — check the error details below");
      }

      setStep(4);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    }
  };

  const resetWizard = () => {
    setStep(0);
    setSelectedType(null);
    setParsedHeaders([]);
    setParsedRows([]);
    setValidatedRows([]);
    setFileName("");
    setImportResult(null);
    importMutation.reset();
  };

  const validCount = validatedRows.filter((r) => r.errors.length === 0).length;
  const errorCount = validatedRows.filter((r) => r.errors.length > 0).length;
  const allValid = validatedRows.length > 0 && errorCount === 0;

  const getMissingColumns = () => {
    if (!selectedType || parsedHeaders.length === 0) return [];
    return selectedType.requiredColumns.filter((col) => !parsedHeaders.includes(col));
  };
  const missingColumns = getMissingColumns();

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <Upload className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Import Data</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Import Data</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bulk import staff, training records, contracts, and work items from CSV.
          </p>
        </div>

        <Tabs defaultValue="wizard">
          <TabsList className="mb-6">
            <TabsTrigger value="wizard">
              <Upload className="size-3.5 mr-1.5" />
              Import Wizard
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="size-3.5 mr-1.5" />
              Import History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wizard">
            {/* Only show step indicator while in wizard steps 0–3 */}
            {step < 4 && <StepIndicator current={step} />}

            {/* ── Step 0: Select type ── */}
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="text-base font-semibold">What would you like to import?</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {IMPORT_TARGETS.map((target) => (
                    <Card
                      key={target.id}
                      onClick={() => handleTypeSelect(target)}
                      className={`cursor-pointer transition-all hover:border-primary/60 ${
                        selectedType?.id === target.id
                          ? "border-primary ring-2 ring-primary/20"
                          : ""
                      }`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <div className="rounded-xl bg-muted p-2">
                            <target.icon className="size-4 text-foreground" />
                          </div>
                          <CardTitle className="text-sm">{target.title}</CardTitle>
                          {selectedType?.id === target.id && (
                            <CheckCircle className="size-4 text-primary ml-auto" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-xs mb-2">
                          {target.description}
                        </CardDescription>
                        <p className="text-xs text-muted-foreground mb-1.5">Required columns:</p>
                        <div className="flex flex-wrap gap-1">
                          {target.columns.map((col) => (
                            <span
                              key={col}
                              className="font-mono text-[10px] bg-muted rounded-lg px-1.5 py-0.5"
                            >
                              {col}
                            </span>
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2 italic">
                          {target.notes}
                        </p>
                        {/* Download template link — stopPropagation prevents card selection */}
                        <div className="mt-3 pt-3 border-t border-dashed">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadTemplate(target);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Download className="size-3" />
                            Download CSV Template
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-end mt-6">
                  <Button disabled={!selectedType} onClick={() => setStep(1)}>
                    Next
                    <ChevronRight className="size-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 1: Upload file ── */}
            {step === 1 && selectedType && (
              <div className="space-y-4 max-w-xl">
                <div className="flex items-center gap-2 mb-2">
                  <selectedType.icon className="size-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Importing: {selectedType.title}</span>
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`rounded-lg border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50 hover:bg-muted/30"
                  }`}
                >
                  <FileSpreadsheet className="size-10 text-muted-foreground mx-auto mb-3" />
                  {fileName ? (
                    <div>
                      <p className="text-sm font-medium text-foreground">{fileName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {parsedRows.length} data rows found
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium">Drop your CSV file here</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        or click to browse — .csv files only
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileChange(file);
                    }}
                  />
                </div>

                <div className="flex items-center justify-center gap-4 text-xs">
                  <button
                    onClick={loadSampleData}
                    className="text-primary underline-offset-2 hover:underline"
                    type="button"
                  >
                    Use sample data (2 example rows)
                  </button>
                  <span className="text-muted-foreground">·</span>
                  <button
                    type="button"
                    onClick={() => downloadTemplate(selectedType)}
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Download className="size-3" />
                    Need the template? Download it
                  </button>
                </div>

                {parsedRows.length > 0 && (
                  <div className="rounded-xl border bg-muted/30 p-3 text-sm">
                    <p className="font-medium">{fileName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {parsedRows.length} data rows — headers: {parsedHeaders.join(", ")}
                    </p>
                    {missingColumns.length > 0 && (
                      <div className="mt-2 flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400">
                        <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
                        <span>Missing required columns: {missingColumns.join(", ")}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep(0)}>
                    <ChevronLeft className="size-4 mr-1" />
                    Back
                  </Button>
                  <Button
                    disabled={parsedRows.length === 0 || missingColumns.length > 0}
                    onClick={handleProceedToValidate}
                  >
                    Preview & Validate
                    <ChevronRight className="size-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 2: Preview & Validate ── */}
            {step === 2 && selectedType && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold">Preview & Validate</h2>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      {validCount} rows valid
                    </span>
                    {errorCount > 0 && (
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        {errorCount} rows with errors
                      </span>
                    )}
                  </div>
                </div>

                {!allValid && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20 px-3 py-2 text-sm text-red-700 dark:text-red-400">
                    <AlertCircle className="size-4 shrink-0" />
                    Fix all row errors before importing. Required fields must not be empty.
                  </div>
                )}

                {allValid && (
                  <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20 px-3 py-2 text-sm text-green-700 dark:text-green-400">
                    <CheckCircle className="size-4 shrink-0" />
                    All {validCount} rows passed validation. Ready to import.
                  </div>
                )}

                <div className="rounded-xl border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">#</TableHead>
                        {parsedHeaders.map((h) => (
                          <TableHead key={h}>{h}</TableHead>
                        ))}
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validatedRows.slice(0, 5).map((row, i) => (
                        <TableRow
                          key={i}
                          className={
                            row.errors.length > 0 ? "bg-red-50/50 dark:bg-red-950/10" : ""
                          }
                        >
                          <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                          {parsedHeaders.map((h) => (
                            <TableCell key={h} className="text-sm">
                              {row.data[h] || (
                                <span className="text-muted-foreground italic">—</span>
                              )}
                            </TableCell>
                          ))}
                          <TableCell>
                            {row.errors.length === 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                                <CheckCircle className="size-3" />
                                Valid
                              </span>
                            ) : (
                              <div className="flex flex-col gap-1">
                                {row.errors.map((err, j) => (
                                  <span
                                    key={j}
                                    className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                  >
                                    <AlertCircle className="size-3 shrink-0" />
                                    {err}
                                  </span>
                                ))}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {validatedRows.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Showing first 5 of {validatedRows.length} rows
                  </p>
                )}

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ChevronLeft className="size-4 mr-1" />
                    Back
                  </Button>
                  <Button disabled={!allValid} onClick={() => setStep(3)}>
                    Proceed to Import
                    <ChevronRight className="size-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 3: Confirm Import ── */}
            {step === 3 && selectedType && (
              <div className="space-y-4 max-w-lg">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Confirm Import</CardTitle>
                    <CardDescription>
                      You are about to import{" "}
                      <span className="font-semibold text-foreground">{validCount} rows</span> of{" "}
                      <span className="font-semibold text-foreground">{selectedType.title}</span>{" "}
                      data.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-xl bg-muted/50 p-3 text-sm space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Import type</span>
                        <span className="font-medium">{selectedType.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total rows</span>
                        <span className="font-medium">{validatedRows.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valid rows</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {validCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Source file</span>
                        <span className="font-medium text-xs truncate max-w-[160px]">
                          {fileName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                      <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
                      This action will create new records. Duplicate emails will be skipped with an
                      error.
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    <ChevronLeft className="size-4 mr-1" />
                    Back
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={importMutation.isPending}
                  >
                    {importMutation.isPending ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Importing…
                      </>
                    ) : (
                      <>
                        <Upload className="size-4 mr-1" />
                        Confirm Import
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 4: Result ── */}
            {step === 4 && importResult && selectedType && (
              <Card className="max-w-lg">
                <CardContent className="py-10 text-center">
                  {importResult.status === "completed" ? (
                    <CheckCircle className="size-12 text-green-500 mx-auto mb-4" />
                  ) : importResult.status === "partial" ? (
                    <AlertCircle className="size-12 text-amber-500 mx-auto mb-4" />
                  ) : (
                    <XCircle className="size-12 text-red-500 mx-auto mb-4" />
                  )}

                  <h2 className="text-lg font-semibold mb-1">
                    Import{" "}
                    {importResult.status === "completed"
                      ? "Complete"
                      : importResult.status === "partial"
                        ? "Partially Complete"
                        : "Failed"}
                  </h2>

                  <div className="text-sm text-muted-foreground mb-4 space-y-1">
                    <p>
                      <span className="text-green-600 dark:text-green-400 font-semibold">
                        {importResult.successCount}
                      </span>{" "}
                      rows imported successfully
                    </p>
                    {importResult.errorCount > 0 && (
                      <p>
                        <span className="text-red-600 dark:text-red-400 font-semibold">
                          {importResult.errorCount}
                        </span>{" "}
                        rows failed
                      </p>
                    )}
                  </div>

                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="text-left rounded-xl border bg-red-50 dark:bg-red-950/20 p-3 mb-4 space-y-1.5 max-h-40 overflow-y-auto">
                      {importResult.errors.slice(0, 10).map((e, i) => (
                        <p key={i} className="text-xs text-red-700 dark:text-red-400">
                          Row {e.row}
                          {e.field ? ` (${e.field})` : ""}: {e.message}
                        </p>
                      ))}
                      {importResult.errors.length > 10 && (
                        <p className="text-xs text-muted-foreground">
                          …and {importResult.errors.length - 10} more errors
                        </p>
                      )}
                    </div>
                  )}

                  <Button onClick={resetWizard}>Import Another</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history">
            <ImportHistory />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  );
}
