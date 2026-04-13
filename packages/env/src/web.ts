import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    // In dev, set to http://localhost:3000 (Hono server).
    // In production, leave unset — empty string makes auth + oRPC use
    // relative URLs which resolve to the same origin as the page.
    VITE_SERVER_URL: z.string().optional().default(""),
    VITE_DOCS_URL: z.string().optional(),
  },
  runtimeEnv: (import.meta as any).env,
  emptyStringAsUndefined: true,
});
