// Script to set password for admin user using Better Auth's scrypt hash
import { scryptAsync } from '/home/karetech/projects/ndma-dcs-staff-portal/node_modules/.bun/@noble+hashes@1.7.1/node_modules/@noble/hashes/esm/scrypt.js';

const config = { N: 16384, r: 16, p: 1, dkLen: 64 };

function hex_encode(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

const password = 'password123';
const saltBytes = crypto.getRandomValues(new Uint8Array(16));
const salt = hex_encode(saltBytes);

const key = await scryptAsync(password.normalize('NFKC'), salt, {
  N: config.N, p: config.p, r: config.r, dkLen: config.dkLen,
  maxmem: 128 * config.N * config.r * 2
});

const hash = `${salt}:${hex_encode(key)}`;
console.log('PASSWORD_HASH=' + hash);
