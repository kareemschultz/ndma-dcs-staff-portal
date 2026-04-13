import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Clock, ArrowDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@ndma-dcs-staff-portal/ui/components/card";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ThemeSwitch } from "@/components/theme-switch";

export const Route = createFileRoute("/_authenticated/settings/escalation")({
  component: EscalationSettingsPage,
});

const EXAMPLE_POLICY = {
  name: "Critical Incident Escalation",
  steps: [
    { order: 1, delay: 0, notify: "Lead Engineer on-call" },
    { order: 2, delay: 15, notify: "All ASN Support" },
    { order: 3, delay: 30, notify: "Core Support team" },
    { order: 4, delay: 60, notify: "All on-call staff" },
  ],
};

function EscalationSettingsPage() {
  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Escalation Policies</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Escalation Policies</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure timed escalation steps for on-call and incident response. (Phase D)
          </p>
        </div>

        <div className="mb-6 rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          <AlertTriangle className="size-8 mx-auto mb-2 text-muted-foreground" />
          <p className="font-medium">Escalation policy management coming in Phase D</p>
          <p className="text-xs mt-1">
            Policies link on-call roles to timed escalation steps. A step fires when no
            acknowledgement is received within the delay window.
          </p>
        </div>

        {/* Preview of how it will look */}
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Example Policy
        </h2>

        <Card className="max-w-md opacity-70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{EXAMPLE_POLICY.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {EXAMPLE_POLICY.steps.map((step, idx) => (
                <div key={step.order}>
                  <div className="flex items-start gap-3 py-2">
                    <div className="size-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {step.order}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{step.notify}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="size-3" />
                        {step.delay === 0 ? "Immediately" : `After ${step.delay} minutes`}
                      </p>
                    </div>
                  </div>
                  {idx < EXAMPLE_POLICY.steps.length - 1 && (
                    <div className="ml-3">
                      <ArrowDown className="size-3.5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Main>
    </>
  );
}
