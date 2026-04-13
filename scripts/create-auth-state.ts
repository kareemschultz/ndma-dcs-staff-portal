/**
 * Creates Playwright storage state (auth session) by calling the API directly
 * instead of going through the browser login UI.
 * This avoids issues with VITE_SERVER_URL pointing to the wrong port.
 */
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:8090";
const AUTH_FILE = path.join(import.meta.dirname, "../e2e/.auth/user.json");

fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

// Sign in via API to get the session cookie
const res = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@ndma.gov", password: "admin1234" }),
});

if (!res.ok) {
  console.error("Login failed:", await res.text());
  process.exit(1);
}

// Parse the Set-Cookie header for the session token
const setCookie = res.headers.get("set-cookie") ?? "";
const cookieMatch = setCookie.match(/better-auth\.session_token=([^;]+)/);
if (!cookieMatch) {
  console.error("No session cookie in response");
  process.exit(1);
}

const cookieValue = decodeURIComponent(cookieMatch[1]!);

// Write Playwright storage state JSON
const storageState = {
  cookies: [
    {
      name: "better-auth.session_token",
      value: cookieValue,
      domain: "localhost",
      path: "/",
      expires: -1,
      httpOnly: true,
      secure: false,
      sameSite: "Lax" as const,
    },
  ],
  origins: [],
};

fs.writeFileSync(AUTH_FILE, JSON.stringify(storageState, null, 2));
console.log(`✅ Auth state saved to ${AUTH_FILE}`);
console.log(`   Cookie: better-auth.session_token (${cookieValue.slice(0, 20)}...)`);
