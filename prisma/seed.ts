import { PrismaClient, SourceSite } from "@prisma/client";
import { ingestUrl } from "../lib/ingest";
import { getEffectiveCredential } from "../lib/stored-credentials";

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

/**
 * Public image URLs referenced on Nate landing + Window Depot Milwaukee (wp uploads).
 * Keys match PRD for RenderScript / search_kb category:image.
 */
const curatedImages = [
  {
    category: "image",
    key: "logo",
    content:
      "https://windowdepotmilwaukee.com/wp-content/uploads/2021/03/WDUSA_MilwaukeeLogo.png",
    sourceSite: "corporate" as const,
    sourceUrl: CORPORATE,
    campaignProfiles: ["nate_landing", "corporate"],
    metadata: { curated: true },
  },
  {
    category: "image",
    key: "hero_windows",
    content:
      "https://windowdepotmilwaukee.com/wp-content/uploads/2019/06/picture-window3.jpg",
    sourceSite: "corporate" as const,
    sourceUrl: CORPORATE,
    campaignProfiles: ["nate_landing", "corporate"],
    metadata: { curated: true },
  },
  {
    category: "image",
    key: "windows_install",
    content:
      "https://windowdepotmilwaukee.com/wp-content/uploads/2019/06/picture-window4.jpg",
    sourceSite: "corporate" as const,
    sourceUrl: CORPORATE,
    campaignProfiles: ["nate_landing", "corporate"],
    metadata: { curated: true },
  },
  {
    category: "image",
    key: "door_install",
    content:
      "https://windowdepotmilwaukee.com/wp-content/uploads/2019/06/Provia-entry-hero7.jpg",
    sourceSite: "corporate" as const,
    sourceUrl: CORPORATE,
    campaignProfiles: ["nate_landing", "corporate"],
    metadata: { curated: true },
  },
  {
    category: "image",
    key: "siding_project",
    content:
      "https://windowdepotmilwaukee.com/wp-content/uploads/2022/04/Craneboard-siding-img1.jpg",
    sourceSite: "corporate" as const,
    sourceUrl: CORPORATE,
    campaignProfiles: ["nate_landing", "corporate"],
    metadata: { curated: true },
  },
  {
    category: "image",
    key: "roof_project",
    content:
      "https://windowdepotmilwaukee.com/wp-content/uploads/2021/12/Provia_slate-House-2.jpg",
    sourceSite: "corporate" as const,
    sourceUrl: CORPORATE,
    campaignProfiles: ["nate_landing", "corporate"],
    metadata: { curated: true },
  },
  {
    category: "image",
    key: "bathroom_remodel",
    content:
      "https://windowdepotmilwaukee.com/wp-content/uploads/2020/04/Gray_Classic_Bath_Roman_Stone_Windmill_Walls_with_Window_Kit_Polished_Chrome_IMG_0626_LR_bci.jpg",
    sourceSite: "corporate" as const,
    sourceUrl: CORPORATE,
    campaignProfiles: ["nate_landing", "corporate"],
    metadata: { curated: true },
  },
  {
    category: "image",
    key: "headshot_nate",
    content:
      "https://windowdepotmilwaukee.com/wp-content/uploads/2019/06/photo_01.jpg",
    sourceSite: "nate_landing" as const,
    sourceUrl: NATE_LANDING,
    campaignProfiles: ["nate_landing"],
    metadata: {
      curated: true,
      note: "Asset linked from Nate landing; replace with dedicated headshot if needed.",
    },
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
  for (const row of curatedImages) {
    await prisma.kbFact.create({
      data: {
        sourceSite: row.sourceSite,
        sourceUrl: row.sourceUrl,
        category: row.category,
        key: row.key,
        content: row.content,
        campaignProfiles: [...row.campaignProfiles],
        metadata: { ...(row.metadata as object) },
      },
    });
  }
}

async function seedTemplate() {
  const templateId =
    (await getEffectiveCredential("CREATOMATE_TEMPLATE_ID"))?.trim() ||
    "REPLACE_WITH_YOUR_CREATOMATE_TEMPLATE_ID";
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
  await prisma.browserTask.deleteMany();
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
