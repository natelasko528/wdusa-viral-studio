export type CampaignProfile = "nate_landing" | "corporate";

export type KbFactLike = {
  category: string;
  key: string | null;
  content: string;
  campaignProfiles: string[];
};

/** Merge Creatomate `modifications` with optional text layers keyed for typical WDUSA templates. */
export function mergeModifications(
  base: Record<string, unknown>,
  overrides: Record<string, unknown>,
): Record<string, string | number | boolean | null> {
  const out: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries({ ...base, ...overrides })) {
    if (v === undefined) continue;
    if (v === null) {
      out[k] = null;
      continue;
    }
    if (
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean"
    ) {
      out[k] = v;
      continue;
    }
    out[k] = JSON.stringify(v);
  }
  return out;
}

/** Pick KB lines for on-screen text from stored facts (by campaign profile). */
export function factsToOverlayHints(
  facts: KbFactLike[],
  profile: CampaignProfile,
): { phone?: string; bookingUrl?: string; email?: string; offer?: string } {
  const match = (cat: string, key?: string) =>
    facts.find(
      (f) =>
        f.category === cat &&
        (!key || f.key === key) &&
        f.campaignProfiles.includes(profile),
    );

  return {
    phone: match("contact", "phone")?.content,
    bookingUrl: match("contact", "booking_url")?.content,
    email: match("contact", "email")?.content,
    offer: match("offer", "primary")?.content,
  };
}
