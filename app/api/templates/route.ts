import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const templates = await prisma.videoTemplate.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ templates });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
