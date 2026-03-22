import { NextResponse } from "next/server";
import { listCredentialStatus } from "@/lib/stored-credentials";

const KEYS = [
  "DATABASE_URL",
  "CREATOMATE_API_KEY",
  "CREATOMATE_TEMPLATE_ID",
  "CREATOMATE_EMAIL",
  "CREATOMATE_PASSWORD",
  "OPENAI_API_KEY",
  "GHL_API_TOKEN",
  "GHL_LOCATION_ID",
  "SETTINGS_ENCRYPTION_KEY",
  "SETTINGS_ADMIN_PIN",
] as const;

export async function GET() {
  const env: Record<string, boolean> = {};
  for (const k of KEYS) {
    const v = process.env[k];
    env[k] = typeof v === "string" && v.length > 0;
  }

  /** True if the app can resolve this credential (env or encrypted DB). */
  const effective: Record<string, boolean> = { ...env };
  try {
    const items = await listCredentialStatus();
    for (const item of items) {
      effective[item.name] = item.fromEnv || item.fromDatabase;
    }
  } catch {
    /* ignore DB/crypto errors on status page */
  }

  return NextResponse.json({ env, effective });
}
