import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);
export function createToken(): string { return randomBytes(32).toString('base64url'); }
export function hashToken(value: string): string { return createHash('sha256').update(value).digest('hex'); }
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(24).toString('base64url');
  const derived = await scrypt(password, salt, 64) as Buffer;
  return 'scrypt.v1.' + salt + '.' + derived.toString('hex');
}
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('.');
  if (parts.length !== 4 || parts[0] !== 'scrypt' || parts[1] !== 'v1') return false;
  try {
    const expected = Buffer.from(parts[3], 'hex');
    if (expected.length !== 64) return false;
    const actual = await scrypt(password, parts[2], 64) as Buffer;
    return timingSafeEqual(actual, expected);
  } catch { return false; }
}
