import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const profile = searchParams.get("profile") ?? "nate_landing";
    const category = searchParams.get("category");

    const facts = await prisma.kbFact.findMany({
      where: {
        campaignProfiles: { has: profile },
        ...(category ? { category } : {}),
      },
      orderBy: [{ category: "asc" }, { key: "asc" }],
      take: 500,
    });

    return NextResponse.json({ profile, facts });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
