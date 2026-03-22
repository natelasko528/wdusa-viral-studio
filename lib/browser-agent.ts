import { chromium, type Browser, type Page } from "playwright";
import { prisma } from "@/lib/prisma";
import { asPrismaInputJson } from "@/lib/prisma-json";
import type { BrowserTaskType } from "@prisma/client";

const CREATOMATE_APP = "https://app.creatomate.com";

async function loginIfNeeded(page: Page): Promise<void> {
  const email = process.env.CREATOMATE_EMAIL;
  const password = process.env.CREATOMATE_PASSWORD;
  if (!email?.trim() || !password?.trim()) {
    throw new Error(
      "CREATOMATE_EMAIL and CREATOMATE_PASSWORD must be set for browser automation",
    );
  }

  await page.goto(`${CREATOMATE_APP}/login`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  const emailInput = page.locator('input[type="email"]').first();
  const passInput = page.locator('input[type="password"]').first();
  await emailInput.waitFor({ state: "visible", timeout: 15000 });
  await emailInput.fill(email);
  await passInput.fill(password);

  const submit = page.getByRole("button", { name: /log\s*in|sign\s*in/i });
  if ((await submit.count()) > 0) {
    await submit.first().click();
  } else {
    await page.keyboard.press("Enter");
  }

  await page.waitForURL(/app\.creatomate\.com/, { timeout: 60000 });
}

async function screenshotDebug(page: Page, label: string) {
  try {
    const buf = await page.screenshot({ type: "png" });
    return { label, bytes: buf.byteLength };
  } catch {
    return { label, bytes: 0 };
  }
}

export async function processBrowserTask(taskId: string): Promise<void> {
  const task = await prisma.browserTask.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("BrowserTask not found");

  await prisma.browserTask.update({
    where: { id: taskId },
    data: { status: "running", error: null },
  });

  let browser: Browser | undefined;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await loginIfNeeded(page);
    const shots: { label: string; bytes: number }[] = [];
    shots.push(await screenshotDebug(page, "after_login"));

    const input = task.input as Record<string, unknown>;
    let output: Record<string, unknown> = { step: "login_ok" };

    if (task.type === "export_renderscript") {
      const templateId = String(input.creatomateTemplateId ?? "");
      if (!templateId) throw new Error("creatomateTemplateId required in input");
      await page.goto(`${CREATOMATE_APP}/templates/${templateId}`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      shots.push(await screenshotDebug(page, "template_open"));
      output = {
        message:
          "Opened template in editor. Full RenderScript export requires editor-specific steps; use Creatomate GET /v1/templates/:id API with your API key instead for reliable JSON.",
        creatomateTemplateId: templateId,
        screenshots: shots,
      };
    } else if (task.type === "create_template") {
      await page.goto(`${CREATOMATE_APP}/templates/new`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      shots.push(await screenshotDebug(page, "new_template"));
      output = {
        message:
          "Navigated to new template flow. Element-level automation is environment-specific; complete layout in Creatomate UI or use RenderScript API from this app.",
        name: input.name,
        screenshots: shots,
      };
    } else {
      output = {
        message:
          "clone_template: open source template in UI — automation stub records login success only.",
        source: input,
        screenshots: shots,
      };
    }

    await prisma.browserTask.update({
      where: { id: taskId },
      data: { status: "succeeded", output: asPrismaInputJson(output) },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.browserTask.update({
      where: { id: taskId },
      data: { status: "failed", error: msg },
    });
    throw e;
  } finally {
    await browser?.close();
  }
}

export async function createAndRunBrowserTask(
  type: BrowserTaskType,
  input: Record<string, unknown>,
): Promise<{ taskId: string }> {
  const task = await prisma.browserTask.create({
    data: { type, status: "queued", input: asPrismaInputJson(input) },
  });
  await processBrowserTask(task.id);
  return { taskId: task.id };
}

/** Opens Creatomate, logs in, returns a page (caller must close browser). */
export async function loginToCreatomate(): Promise<{
  browser: Browser;
  page: Page;
}> {
  const email = process.env.CREATOMATE_EMAIL;
  const password = process.env.CREATOMATE_PASSWORD;
  if (!email?.trim() || !password?.trim()) {
    throw new Error(
      "CREATOMATE_EMAIL and CREATOMATE_PASSWORD must be set for browser automation",
    );
  }
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await loginIfNeeded(page);
  return { browser, page };
}

export async function createTemplate(
  input: Record<string, unknown>,
): Promise<{ taskId: string }> {
  return createAndRunBrowserTask("create_template", input);
}

export async function cloneTemplate(
  input: Record<string, unknown>,
): Promise<{ taskId: string }> {
  return createAndRunBrowserTask("clone_template", input);
}

export async function exportRenderScript(
  creatomateTemplateId: string,
  extraInput?: Record<string, unknown>,
): Promise<{ taskId: string }> {
  return createAndRunBrowserTask("export_renderscript", {
    creatomateTemplateId,
    ...extraInput,
  });
}
