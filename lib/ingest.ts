import * as cheerio from "cheerio";
import type { SourceSite } from "@prisma/client";

export type IngestResult = {
  url: string;
  sourceSite: SourceSite;
  title: string | null;
  text: string;
};

function normalizeText(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

export async function ingestUrl(
  url: string,
  sourceSite: SourceSite,
): Promise<IngestResult> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "WDUSA-Viral-Studio/1.0 (KB ingest)",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) {
    throw new Error(`Fetch failed ${res.status} for ${url}`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();
  const title = normalizeText($("title").first().text()) || null;
  const text = normalizeText($("body").text()).slice(0, 120_000);
  return { url, sourceSite, title, text };
}
