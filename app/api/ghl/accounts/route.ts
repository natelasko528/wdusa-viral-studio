import { NextResponse } from "next/server";
import { listSocialAccounts, requireLocationId } from "@/lib/ghl";

export async function GET() {
  try {
    const locationId = await requireLocationId();
    const data = await listSocialAccounts(locationId);
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
