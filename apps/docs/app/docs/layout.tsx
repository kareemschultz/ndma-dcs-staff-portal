import type { ReactNode } from "react";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { source } from "@/app/source";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{
        title: (
          <span className="font-semibold text-sm">DCS Ops Center Docs</span>
        ),
      }}
      sidebar={{
        banner: (
          <div className="rounded-lg border border-fd-border bg-fd-muted px-3 py-2 text-xs text-fd-muted-foreground">
            NDMA Data Centre Services — internal documentation
          </div>
        ),
      }}
    >
      {children}
    </DocsLayout>
  );
}
