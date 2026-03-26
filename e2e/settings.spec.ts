import { expect, test } from "@playwright/test";

test.describe("Settings", () => {
  test("env-status API returns shape used by page", async ({ request }) => {
    const res = await request.get("/api/settings/env-status");
    expect(res.ok()).toBeTruthy();
    const data = (await res.json()) as { env?: Record<string, boolean>; effective?: Record<string, boolean> };
    expect(data.env).toBeDefined();
    expect(data.effective).toBeDefined();
  });

  test("credentials list loads or shows error toast path", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByText("Encrypted credentials")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Environment variables" })).toBeVisible({
      timeout: 15_000,
    });
  });
});
