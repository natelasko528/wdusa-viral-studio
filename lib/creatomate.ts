import { getEffectiveCredential } from "@/lib/stored-credentials";

const CREATOMATE_API = "https://api.creatomate.com/v2";

async function authHeadersJson(): Promise<HeadersInit> {
  const key = await getEffectiveCredential("CREATOMATE_API_KEY");
  if (!key) throw new Error("Missing CREATOMATE_API_KEY (env or Settings)");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

async function authHeadersRead(): Promise<HeadersInit> {
  const key = await getEffectiveCredential("CREATOMATE_API_KEY");
  if (!key) throw new Error("Missing CREATOMATE_API_KEY (env or Settings)");
  return { Authorization: `Bearer ${key}` };
}

export type CreatomateRenderCreate = {
  template_id: string;
  modifications?: Record<string, unknown>;
  render_scale?: number;
  max_width?: number;
  max_height?: number;
  webhook_url?: string;
  metadata?: string;
};

/** Full request body for POST /v2/renders (template + modifications or raw RenderScript). */
export async function createRenderRequest(
  body: Record<string, unknown>,
): Promise<{ id: string }> {
  const res = await fetch(`${CREATOMATE_API}/renders`, {
    method: "POST",
    headers: await authHeadersJson(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Creatomate create render failed: ${text}`);
  const data = JSON.parse(text) as { id?: string };
  if (!data.id) throw new Error("Creatomate response missing id");
  return { id: data.id };
}

export async function createRender(
  body: CreatomateRenderCreate,
): Promise<{ id: string }> {
  return createRenderRequest(body as unknown as Record<string, unknown>);
}

export type CreatomateRenderStatus = {
  id: string;
  status?: string;
  url?: string | null;
  result_url?: string | null;
  output_url?: string | null;
  error_message?: string | null;
};

export async function getRender(
  renderId: string,
): Promise<CreatomateRenderStatus> {
  const res = await fetch(`${CREATOMATE_API}/renders/${renderId}`, {
    headers: await authHeadersRead(),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Creatomate get render failed: ${text}`);
  return JSON.parse(text) as CreatomateRenderStatus;
}

export function mapCreatomateStatus(
  status: string | undefined,
): "rendering" | "succeeded" | "failed" | null {
  if (!status) return "rendering";
  const s = status.toLowerCase();
  if (s === "succeeded" || s === "completed" || s === "finished")
    return "succeeded";
  if (s === "failed" || s === "error") return "failed";
  if (s === "planned" || s === "waiting" || s === "rendering" || s === "queued")
    return "rendering";
  return "rendering";
}

export function extractOutputUrl(render: CreatomateRenderStatus): string | null {
  if (render.url && typeof render.url === "string") return render.url;
  if (render.result_url && typeof render.result_url === "string")
    return render.result_url;
  if (render.output_url && typeof render.output_url === "string")
    return render.output_url;
  return null;
}
