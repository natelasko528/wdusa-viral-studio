import { NextResponse } from "next/server";
import { scheduleRenderToGhl } from "@/lib/ghl-schedule-service";

type Body = {
  renderJobId: string;
  accountIds: string[];
  userId: string;
  scheduleDate: string;
  summary: string;
  type?: "post" | "story" | "reel";
  status?: "scheduled" | "draft" | "published";
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (
      !body.renderJobId ||
      !body.accountIds?.length ||
      !body.userId ||
      !body.scheduleDate ||
      !body.summary
    ) {
      return NextResponse.json(
        {
          error:
            "renderJobId, accountIds, userId, scheduleDate, summary required",
        },
        { status: 400 },
      );
    }

    const { scheduledPost } = await scheduleRenderToGhl(body);
    return NextResponse.json({ scheduledPost });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
