import { PrismaClient, SourceSite } from "@prisma/client";
import { ingestUrl } from "../lib/ingest";

const prisma = new PrismaClient();

const NATE_LANDING = "https://wdusa-nate-landing.vercel.app/";
const CORPORATE = "https://windowdepotmilwaukee.com/";

const curatedNateLanding = [
  {
    category: "contact",
    key: "booking_url",
    content: "https://wdusa-nate-landing.vercel.app/",
    campaignProfiles: ["nate_landing"],
  },
  {
    category: "contact",
    key: "phone",
    content: "(414) 312-5213",
    campaignProfiles: ["nate_landing"],
  },
  {
    category: "contact",
    key: "email",
    content: "nlasko.wdusa.milwaukee@gmail.com",
    campaignProfiles: ["nate_landing"],
  },
  {
    category: "contact",
    key: "company_web",
    content: "https://windowdepotmilwaukee.com/",
    campaignProfiles: ["nate_landing"],
  },
  {
    category: "offer",
    key: "primary",
    content:
      "$1000 off your estimate if you book now (see landing page for terms).",
    campaignProfiles: ["nate_landing"],
  },
  {
    category: "trust",
    key: "google",
    content: "4.9 Google, 1,000+ reviews (per Nate landing page).",
    campaignProfiles: ["nate_landing"],
  },
  {
    category: "hook",
    key: "windows_wait",
    content:
      "Milwaukee homeowners: old windows leak comfort and cash every month—book a free in-home estimate.",
    campaignProfiles: ["nate_landing"],
  },
  {
    category: "hook",
    key: "triple_pane",
    content:
      "Triple pane performance at dual-pane prices—ProVia Endure for Wisconsin winters.",
    campaignProfiles: ["nate_landing"],
  },
] as const;

const curatedCorporate = [
  {
    category: "contact",
    key: "phone",
    content: "(414) 795-4804",
    campaignProfiles: ["corporate"],
  },
  {
    category: "offer",
    key: "primary",
    content: "$25 reward (see corporate site for details).",
    campaignProfiles: ["corporate"],
  },
  {
    category: "location",
    key: "showroom",
    content:
      "4630 S. Brust Ave. Suite 100, St Francis, WI 53235 (per corporate site).",
    campaignProfiles: ["corporate", "nate_landing"],
  },
] as const;

async function ingestPair() {
  const pairs: { url: string; site: SourceSite }[] = [
    { url: NATE_LANDING, site: "nate_landing" },
    { url: CORPORATE, site: "corporate" },
  ];

  for (const { url, site } of pairs) {
    try {
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
      }
      console.log("Ingested", url, "chunks:", Math.ceil(ingested.text.length / chunkSize));
    } catch (e) {
      console.warn("Ingest failed for", url, e);
    }
  }
}

async function seedCurated() {
  for (const row of curatedNateLanding) {
    await prisma.kbFact.create({
      data: {
        sourceSite: "nate_landing",
        sourceUrl: NATE_LANDING,
        category: row.category,
        key: row.key,
        content: row.content,
        campaignProfiles: [...row.campaignProfiles],
        metadata: { curated: true },
      },
    });
  }
  for (const row of curatedCorporate) {
    await prisma.kbFact.create({
      data: {
        sourceSite: "corporate",
        sourceUrl: CORPORATE,
        category: row.category,
        key: row.key,
        content: row.content,
        campaignProfiles: [...row.campaignProfiles],
        metadata: { curated: true },
      },
    });
  }
}

async function seedTemplate() {
  const templateId =
    process.env.CREATOMATE_TEMPLATE_ID ?? "REPLACE_WITH_YOUR_CREATOMATE_TEMPLATE_ID";
  await prisma.videoTemplate.create({
    data: {
      id: "wdusa-default-template",
      name: "Default Reel (9:16)",
      creatomateTemplateId: templateId,
      aspectRatio: "9:16",
      defaultModifications: {
        "Hook-Text": "",
        "Subhead-Text": "",
        "CTA-Text": "Book your FREE estimate",
      },
      active: true,
    },
  });
}

async function main() {
  await prisma.scheduledPost.deleteMany();
  await prisma.renderJob.deleteMany();
  await prisma.kbFact.deleteMany();
  await prisma.sourcePage.deleteMany();
  await prisma.videoTemplate.deleteMany();

  await seedCurated();
  await ingestPair();
  await seedTemplate();
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
