/**
 * Ensures at least one active VideoTemplate exists so Studio template mode
 * is usable in CI without a full seed (ingest can be slow or network-dependent).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
  } catch (e) {
    console.warn("[e2e-prep] DATABASE_URL not reachable — skipping template seed:", e);
    return;
  }

  const active = await prisma.videoTemplate.count({ where: { active: true } });
  if (active > 0) {
    console.log("[e2e-prep] Active templates already present:", active);
    return;
  }

  const creatomateTemplateId =
    process.env.CREATOMATE_TEMPLATE_ID?.trim() || "e2e-placeholder-creatomate-id";

  await prisma.videoTemplate.create({
    data: {
      name: "E2E default template",
      creatomateTemplateId,
      aspectRatio: "9:16",
      defaultModifications: {
        "Hook-Text": "",
        "Subhead-Text": "",
        "CTA-Text": "Book your FREE estimate",
      },
      active: true,
    },
  });
  console.log("[e2e-prep] Created placeholder VideoTemplate for E2E (configure CREATOMATE_TEMPLATE_ID for real renders).");
}

main()
  .catch((e) => {
    console.warn("[e2e-prep] Non-fatal:", e);
  })
  .finally(() => prisma.$disconnect());
