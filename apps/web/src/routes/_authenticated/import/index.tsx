import { createFileRoute } from "@tanstack/react-router";
import { Upload, FileSpreadsheet, Users, GraduationCap, FileText, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@ndma-dcs-staff-portal/ui/components/card";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ThemeSwitch } from "@/components/theme-switch";

export const Route = createFileRoute("/_authenticated/import/")({
  component: ImportPage,
});

const IMPORT_TARGETS = [
  {
    title: "Staff Profiles",
    description: "Import staff from CSV. Required fields: name, email, department, employment type.",
    icon: Users,
    fields: ["name", "email", "department", "employmentType"],
  },
  {
    title: "Training Records",
    description: "Bulk import training completions with expiry dates and providers.",
    icon: GraduationCap,
    fields: ["staffEmail", "trainingName", "provider", "completedDate", "expiryDate"],
  },
  {
    title: "Contracts",
    description: "Import contract details including start/end dates and contract type.",
    icon: FileText,
    fields: ["staffEmail", "contractType", "startDate", "endDate"],
  },
  {
    title: "Work Items",
    description: "Bulk import work register items with assignees and due dates.",
    icon: ClipboardList,
    fields: ["title", "type", "priority", "assigneeEmail", "dueDate"],
  },
];

function ImportPage() {
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
            Bulk import staff, training records, contracts, and work items from CSV or Excel.
          </p>
        </div>

        <div className="mb-6 rounded-md border border-dashed p-8 text-center">
          <FileSpreadsheet className="size-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">Import wizard coming in Phase K</p>
          <p className="text-xs text-muted-foreground mt-1">
            The import wizard will support CSV/XLSX upload with column mapping, validation preview, and row-by-row error reporting.
          </p>
        </div>

        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Supported Import Types
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {IMPORT_TARGETS.map((target) => (
            <Card key={target.title} className="opacity-70">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <target.icon className="size-4 text-muted-foreground" />
                  <CardTitle className="text-sm">{target.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-2">{target.description}</p>
                <div className="flex flex-wrap gap-1">
                  {target.fields.map((field) => (
                    <span
                      key={field}
                      className="font-mono text-[10px] bg-muted rounded px-1.5 py-0.5"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Main>
    </>
  );
}
