// SCRUM-48: AES-256-GCM encryption for sensitive columns
// KEY must be 64 hex characters (32 bytes). If not configured, encryption is disabled
// with a warning so dev environments don't explode.
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGO = 'aes-256-gcm';
const KEY_HEX = process.env.ENCRYPTION_KEY ?? '';

let KEY_BUFFER: Buffer | null = null;

if (KEY_HEX.length === 64) {
  KEY_BUFFER = Buffer.from(KEY_HEX, 'hex');
} else {
  // Non-fatal: system continues in plaintext mode so local dev works without key
  console.warn(
    '[crypto] ENCRYPTION_KEY is not set or invalid (expected 64 hex chars). ' +
      'Sensitive columns will be stored in plaintext. Do NOT use in production.'
  );
}

/**
 * Encrypts a UTF-8 string with AES-256-GCM.
 * Returns "iv:authTag:ciphertext" (all hex-encoded).
 * If ENCRYPTION_KEY is not configured, returns the original string unchanged.
 */
export function encrypt(text: string): string {
  if (!KEY_BUFFER) return text;

  const iv = randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = createCipheriv(ALGO, KEY_BUFFER, iv);

  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag(); // 128-bit tag

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts a string produced by encrypt().
 * Handles backward-compat: if decryption fails (e.g. plaintext legacy data),
 * returns the original string so existing rows don't break.
 */
export function decrypt(encrypted: string): string {
  if (!KEY_BUFFER) return encrypted;

  try {
    const parts = encrypted.split(':');
    if (parts.length !== 3) return encrypted; // not our format → legacy plaintext

    const [ivHex, authTagHex, dataHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const data = Buffer.from(dataHex, 'hex');

    const decipher = createDecipheriv(ALGO, KEY_BUFFER, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  } catch {
    // Decryption failed — assume legacy plaintext row, return as-is
    return encrypted;
  }
}

/** Returns true when the encryption key is properly configured. */
export const isEncryptionEnabled = (): boolean => KEY_BUFFER !== null;
