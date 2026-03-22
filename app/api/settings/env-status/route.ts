import { NextResponse } from "next/server";

const KEYS = [
  "DATABASE_URL",
  "CREATOMATE_API_KEY",
  "CREATOMATE_TEMPLATE_ID",
  "CREATOMATE_EMAIL",
  "CREATOMATE_PASSWORD",
  "OPENAI_API_KEY",
  "GHL_API_TOKEN",
  "GHL_LOCATION_ID",
] as const;

export async function GET() {
  const env: Record<string, boolean> = {};
  for (const k of KEYS) {
    const v = process.env[k];
    env[k] = typeof v === "string" && v.length > 0;
  }
  return NextResponse.json({ env });
}
