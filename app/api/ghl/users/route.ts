import { NextResponse } from "next/server";
import { listUsersForLocation, requireLocationId } from "@/lib/ghl";

export async function GET() {
  try {
    const locationId = requireLocationId();
    const data = await listUsersForLocation(locationId);
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
