import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const ALG = "aes-256-gcm";
const IV_LEN = 16;
const TAG_LEN = 16;

function deriveKey(raw: string): Buffer {
  const t = raw.trim();
  if (/^[0-9a-fA-F]{64}$/.test(t)) return Buffer.from(t, "hex");
  if (t.length >= 32 && /^[A-Za-z0-9+/=_-]+$/.test(t)) {
    const b = Buffer.from(t, "base64");
    if (b.length === 32) return b;
  }
  return scryptSync(t, "wdusa-stored-credentials", 32);
}

export function getSettingsEncryptionKey(): Buffer {
  const raw = process.env.SETTINGS_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error(
      "SETTINGS_ENCRYPTION_KEY is required to use database-stored API keys (32-byte key as base64 or 64-char hex, or a strong passphrase)",
    );
  }
  return deriveKey(raw);
}

/** iv(16) + tag(16) + ciphertext → base64 */
export function encryptSecret(plaintext: string): string {
  const key = getSettingsEncryptionKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALG, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptSecret(payload: string): string {
  const key = getSettingsEncryptionKey();
  const buf = Buffer.from(payload, "base64");
  if (buf.length < IV_LEN + TAG_LEN + 1) {
    throw new Error("Invalid stored credential payload");
  }
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const data = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv(ALG, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8",
  );
}
