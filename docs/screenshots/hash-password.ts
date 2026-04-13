// Run with: bun docs/screenshots/hash-password.ts
import { hashPassword } from 'better-auth/crypto';

const hash = await hashPassword('password123');
console.log('HASH:' + hash);
