/**
 * Creates the admin login user with the correct Better Auth password hash.
 * Better Auth password format: "<hex-salt>:<hex-scrypt-key>"
 * Params: N=16384, r=16, p=1, dkLen=64 (from @better-auth/utils/password)
 *
 * Run from packages/db:
 *   bun --env-file=../../apps/server/.env src/create-admin.ts
 */
import { db } from "./index";
import { user, account } from "./schema/auth";
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await scryptAsync(password.normalize("NFKC"), salt, 64, {
    N: 16384,
    r: 16,
    p: 1,
    maxmem: 128 * 16384 * 16 * 2,
  }) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}

const hash = await hashPassword("admin1234");
const userId = "user-admin";
const now = new Date();

await db
  .insert(user)
  .values({
    id: userId,
    name: "Admin User",
    email: "admin@ndma.gov",
    emailVerified: true,
    role: "admin",
    createdAt: now,
    updatedAt: now,
  })
  .onConflictDoNothing();

await db
  .insert(account)
  .values({
    id: "acct-admin",
    userId,
    accountId: userId,
    providerId: "credential",
    password: hash,
    createdAt: now,
    updatedAt: now,
  })
  .onConflictDoNothing();

console.log("✅ Admin user created: admin@ndma.gov / admin1234");
