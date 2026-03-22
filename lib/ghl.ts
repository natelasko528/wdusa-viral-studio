const GHL_BASE = "https://services.leadconnectorhq.com";

function headers(): HeadersInit {
  const token = process.env.GHL_API_TOKEN;
  if (!token) throw new Error("Missing GHL_API_TOKEN");
  return {
    Authorization: `Bearer ${token}`,
    Version: "2021-07-28",
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

export function requireLocationId(): string {
  const id = process.env.GHL_LOCATION_ID;
  if (!id) throw new Error("Missing GHL_LOCATION_ID");
  return id;
}

export async function listSocialAccounts(locationId: string): Promise<unknown> {
  const res = await fetch(
    `${GHL_BASE}/social-media-posting/${locationId}/accounts`,
    { headers: headers() },
  );
  const text = await res.text();
  if (!res.ok) throw new Error(`GHL list accounts failed: ${text}`);
  return JSON.parse(text) as unknown;
}

export async function listUsersForLocation(locationId: string): Promise<unknown> {
  const url = new URL(`${GHL_BASE}/users/`);
  url.searchParams.set("locationId", locationId);
  const res = await fetch(url.toString(), { headers: headers() });
  const text = await res.text();
  if (!res.ok) throw new Error(`GHL list users failed: ${text}`);
  return JSON.parse(text) as unknown;
}

export type SchedulePostInput = {
  accountIds: string[];
  summary: string;
  scheduleDate: string;
  type: "post" | "story" | "reel";
  userId: string;
  status: "scheduled" | "draft" | "published";
  media: { url: string; type: string }[];
};

export async function createSocialPost(
  locationId: string,
  body: SchedulePostInput,
): Promise<unknown> {
  const res = await fetch(
    `${GHL_BASE}/social-media-posting/${locationId}/posts`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    },
  );
  const text = await res.text();
  if (!res.ok) throw new Error(`GHL create post failed: ${text}`);
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}
