import type { APIRequestContext, Page } from "@playwright/test";

export async function apiJson<T>(
  request: APIRequestContext,
  path: string,
): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await request.get(path);
  const data = (await res.json()) as T;
  return { ok: res.ok(), status: res.status(), data };
}

/** True when Postgres-backed routes return 200 (not 500 connection error). */
export async function databaseReady(request: APIRequestContext): Promise<boolean> {
  const { ok, data } = await apiJson<{ templates?: unknown[]; error?: string }>(
    request,
    "/api/templates",
  );
  return ok && !("error" in data && typeof data.error === "string" && data.error);
}

export async function skipUnlessDb(request: APIRequestContext, test: { skip: (cond: boolean, msg?: string) => void }) {
  const ready = await databaseReady(request);
  test.skip(!ready, "DATABASE_URL / Prisma not available in this environment");
}

export async function skipUnlessOpenAI(request: APIRequestContext, test: { skip: (cond: boolean, msg?: string) => void }) {
  const { ok, data } = await apiJson<{ effective?: Record<string, boolean> }>(
    request,
    "/api/settings/env-status",
  );
  const hasKey = ok && data.effective?.OPENAI_API_KEY === true;
  test.skip(!hasKey, "OPENAI_API_KEY not configured (env or Settings DB)");
}

export async function skipUnlessCreatomate(request: APIRequestContext, test: { skip: (cond: boolean, msg?: string) => void }) {
  const { ok, data } = await apiJson<{ effective?: Record<string, boolean> }>(
    request,
    "/api/settings/env-status",
  );
  const ready =
    ok &&
    data.effective?.CREATOMATE_API_KEY === true &&
    data.effective?.CREATOMATE_TEMPLATE_ID === true;
  test.skip(!ready, "Creatomate API key + template ID not both configured");
}

export async function dismissNextConfirm(page: Page) {
  page.once("dialog", (d) => d.dismiss().catch(() => {}));
}
