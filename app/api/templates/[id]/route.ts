import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { asPrismaInputJson } from "@/lib/prisma-json";

type PatchBody = {
  defaultModifications?: Record<string, unknown>;
  active?: boolean;
  name?: string;
  renderscriptSource?: Record<string, unknown> | null;
};

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as PatchBody;
    const data: Prisma.VideoTemplateUpdateInput = {};
    if (body.defaultModifications !== undefined)
      data.defaultModifications = asPrismaInputJson(body.defaultModifications);
    if (body.active !== undefined) data.active = body.active;
    if (body.name !== undefined) data.name = body.name;
    if (body.renderscriptSource !== undefined) {
      data.renderscriptSource =
        body.renderscriptSource === null
          ? Prisma.DbNull
          : asPrismaInputJson(body.renderscriptSource);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    const template = await prisma.videoTemplate.update({
      where: { id },
      data,
    });
    return NextResponse.json({ template });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Soft-delete: deactivate template (keeps history on render jobs). */
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const template = await prisma.videoTemplate.update({
      where: { id },
      data: { active: false },
    });
    return NextResponse.json({ template });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
