/**
 * Standalone auth setup — logs in as admin and saves session to e2e/.auth/user.json
 * Run with: bun run scripts/auth-setup.ts
 */
import { chromium } from "@playwright/test";
import path from "path";
import fs from "fs";

const BASE_URL = "http://localhost:8090";
const AUTH_FILE = path.join(import.meta.dirname, "../e2e/.auth/user.json");

fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await context.newPage();

console.log("Navigating to login page...");
await page.goto(`${BASE_URL}/login`, { waitUntil: "load", timeout: 30_000 });

// Wait for the React-rendered email input to appear (SPA needs JS to execute)
console.log("Waiting for login form to render...");
await page.waitForSelector('#email', { state: "visible", timeout: 20_000 });

console.log("Filling credentials...");
await page.fill('#email', "admin@ndma.gov");
await page.fill('#password', "admin1234");
await page.click('button[type="submit"]');

console.log("Waiting for redirect...");
await page.waitForURL(`${BASE_URL}/`, { timeout: 20_000 });

console.log("Saving auth state...");
await context.storageState({ path: AUTH_FILE });
await browser.close();

console.log(`Auth state saved to ${AUTH_FILE}`);
