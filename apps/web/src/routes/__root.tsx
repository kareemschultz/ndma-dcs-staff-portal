import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { HeadContent, Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Toaster } from "@ndma-dcs-staff-portal/ui/components/sonner";

import { ThemeProvider } from "@/components/theme-provider";
import { orpc } from "@/utils/orpc";

import "../index.css";

function RootErrorComponent({ error }: { error: Error }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground max-w-md">{error.message}</p>
      <button
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        onClick={() => window.location.reload()}
      >
        Reload
      </button>
    </div>
  );
}

export interface RouterAppContext {
  orpc: typeof orpc;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  errorComponent: RootErrorComponent,
  head: () => ({
    meta: [
      { title: "DCS Ops Center" },
      {
        name: "description",
        content: "NDMA Data Centre Services — Operations & Compliance Management",
      },
    ],
    links: [{ rel: "icon", href: "/favicon.ico" }],
  }),
});

function RootComponent() {
  return (
    <>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        storageKey="ndma-dcs-theme"
      >
        <Outlet />
        <Toaster richColors position="top-right" />
      </ThemeProvider>
      {import.meta.env.MODE === "development" && (
        <>
          <TanStackRouterDevtools position="bottom-right" />
          <ReactQueryDevtools buttonPosition="bottom-left" />
        </>
      )}
    </>
  );
}
