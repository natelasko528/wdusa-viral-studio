import { NextResponse } from "next/server";
import { SourceSite } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ingestUrl } from "@/lib/ingest";

const URLS: { url: string; site: SourceSite }[] = [
  { url: "https://wdusa-nate-landing.vercel.app/", site: "nate_landing" },
  { url: "https://windowdepotmilwaukee.com/", site: "corporate" },
];

export async function POST() {
  try {
    const results: { url: string; chunks: number }[] = [];
    for (const { url, site } of URLS) {
      const ingested = await ingestUrl(url, site);
      const page = await prisma.sourcePage.create({
        data: {
          url: ingested.url,
          sourceSite: ingested.sourceSite,
          title: ingested.title,
          rawText: ingested.text,
        },
      });
      const chunkSize = 3500;
      let chunks = 0;
      for (let i = 0; i < ingested.text.length; i += chunkSize) {
        const chunk = ingested.text.slice(i, i + chunkSize);
        await prisma.kbFact.create({
          data: {
            sourcePageId: page.id,
            sourceSite: site,
            sourceUrl: url,
            category: "page_chunk",
            key: `offset_${i}`,
            content: chunk,
            campaignProfiles: site === "nate_landing" ? ["nate_landing"] : ["corporate"],
          },
        });
        chunks++;
      }
      results.push({ url, chunks });
    }
    return NextResponse.json({ ok: true, results });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
