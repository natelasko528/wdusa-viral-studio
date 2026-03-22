import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { NextResponse } from "next/server";
import {
  wdusaChatTools,
  WDUSA_SYSTEM_PROMPT,
} from "@/lib/chat-tools";
import { getEffectiveCredential } from "@/lib/stored-credentials";

export const maxDuration = 120;

export async function POST(req: Request) {
  const openaiKey = (await getEffectiveCredential("OPENAI_API_KEY"))?.trim();
  if (!openaiKey) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY (env or Settings)" },
      { status: 503 },
    );
  }

  try {
    const body = (await req.json()) as { messages?: UIMessage[] };
    const messages = body.messages ?? [];
    const openai = createOpenAI({ apiKey: openaiKey });
    const result = streamText({
      model: openai("gpt-4o"),
      system: WDUSA_SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      tools: wdusaChatTools,
      stopWhen: stepCountIs(20),
    });
    return result.toUIMessageStreamResponse();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
