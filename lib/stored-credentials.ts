import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret } from "@/lib/secret-crypto";

/** Credential names allowed in DB + UI (single-tenant app). */
export const STORABLE_CREDENTIAL_NAMES = [
  "CREATOMATE_API_KEY",
  "OPENAI_API_KEY",
  "GHL_API_TOKEN",
  "GHL_LOCATION_ID",
  "CREATOMATE_EMAIL",
  "CREATOMATE_PASSWORD",
  "CREATOMATE_TEMPLATE_ID",
] as const;

export type StorableCredentialName = (typeof STORABLE_CREDENTIAL_NAMES)[number];

export function isStorableCredentialName(
  s: string,
): s is StorableCredentialName {
  return (STORABLE_CREDENTIAL_NAMES as readonly string[]).includes(s);
}

function readEnv(name: StorableCredentialName): string | undefined {
  const v = process.env[name];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

/** Prefer environment variable; otherwise load decrypt from DB. */
export async function getEffectiveCredential(
  name: StorableCredentialName,
): Promise<string | undefined> {
  const envVal = readEnv(name);
  if (envVal !== undefined) return envVal;
  const row = await prisma.storedCredential.findUnique({ where: { name } });
  if (!row?.payload) return undefined;
  try {
    return decryptSecret(row.payload);
  } catch {
    return undefined;
  }
}

export async function upsertStoredCredential(
  name: StorableCredentialName,
  plaintext: string,
): Promise<void> {
  const payload = encryptSecret(plaintext.trim());
  await prisma.storedCredential.upsert({
    where: { name },
    create: { name, payload },
    update: { payload },
  });
}

export async function deleteStoredCredential(
  name: StorableCredentialName,
): Promise<void> {
  await prisma.storedCredential.deleteMany({ where: { name } });
}

export async function hasStoredCredential(
  name: StorableCredentialName,
): Promise<boolean> {
  const row = await prisma.storedCredential.findUnique({
    where: { name },
    select: { id: true },
  });
  return row !== null;
}

/** Last 4 chars for UI hint (never full secret). */
function last4(value: string): string {
  const t = value.trim();
  if (t.length <= 4) return "****";
  return `…${t.slice(-4)}`;
}

export type CredentialStatusItem = {
  name: StorableCredentialName;
  fromEnv: boolean;
  fromDatabase: boolean;
  hint?: string;
};

export async function listCredentialStatus(): Promise<CredentialStatusItem[]> {
  const rows = await prisma.storedCredential.findMany({
    select: { name: true, payload: true },
  });
  const byName = new Map(rows.map((r) => [r.name, r.payload]));

  const items: CredentialStatusItem[] = [];
  for (const name of STORABLE_CREDENTIAL_NAMES) {
    const envVal = readEnv(name);
    const fromEnv = envVal !== undefined;
    const payload = byName.get(name);
    const fromDatabase = Boolean(payload);
    let hint: string | undefined;
    if (fromDatabase && payload) {
      try {
        hint = last4(decryptSecret(payload));
      } catch {
        hint = "(decrypt error)";
      }
    } else if (fromEnv && envVal) {
      hint = last4(envVal);
    }
    items.push({ name, fromEnv, fromDatabase, hint });
  }
  return items;
}

export function isEncryptionConfigured(): boolean {
  return Boolean(process.env.SETTINGS_ENCRYPTION_KEY?.trim());
}

export function isWritePinConfigured(): boolean {
  return Boolean(process.env.SETTINGS_ADMIN_PIN?.trim());
}

export function verifyAdminPin(pin: string | undefined): boolean {
  const expected = process.env.SETTINGS_ADMIN_PIN?.trim();
  if (!expected) return true;
  return typeof pin === "string" && pin === expected;
}
