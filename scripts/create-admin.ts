/**
 * Creates the admin login user in the database.
 * Better Auth uses scrypt for password hashing.
 *
 * Run: DATABASE_URL="..." bun scripts/create-admin.ts
 */

import { db } from "@ndma-dcs-staff-portal/db";
import { user, account } from "@ndma-dcs-staff-portal/db/schema/auth";
import { scryptSync, randomBytes } from "crypto";

function hashPassword(password: string): string {
  // Better Auth uses scrypt — same format as its internal hashing
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

const pwd = hashPassword("admin1234");
const userId = "user-admin";
const now = new Date();

await db.insert(user).values({
  id: userId,
  name: "Admin User",
  email: "admin@ndma.gov",
  emailVerified: true,
  role: "admin",
  createdAt: now,
  updatedAt: now,
}).onConflictDoNothing();

await db.insert(account).values({
  id: "acct-admin",
  userId,
  accountId: userId,
  providerId: "credential",
  password: pwd,
  createdAt: now,
  updatedAt: now,
}).onConflictDoNothing();

console.log("✅ Admin user created: admin@ndma.gov / admin1234");
