import { env } from "@ndma-dcs-staff-portal/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema";

export function createDb() {
  return drizzle(env.DATABASE_URL, { schema });
}

export const db = createDb();

// Re-export all schema tables, enums, and relations for use in other packages
export * from "./schema";
