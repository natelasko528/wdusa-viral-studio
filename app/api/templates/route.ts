import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "1" || searchParams.get("all") === "true";
    const templates = await prisma.videoTemplate.findMany({
      where: all ? {} : { active: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ templates });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
