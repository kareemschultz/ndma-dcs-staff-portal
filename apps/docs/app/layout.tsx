import type { ReactNode } from "react";
import { RootProvider } from "fumadocs-ui/provider";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { source } from "@/app/source";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ display: "contents" }}>
        <RootProvider>
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
        </RootProvider>
      </body>
    </html>
  );
}
